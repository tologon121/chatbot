import io
import zipfile
import logging
import xml.etree.ElementTree as ET
import pypdf

logger = logging.getLogger(__name__)

def parse_txt(file_bytes: bytes) -> str:
    """
    Разбирает текстовый файл с автоопределением кодировки.
    Пытается сначала декодировать в UTF-8, затем в CP1251, а затем игнорирует невалидные символы.
    """
    try:
        return file_bytes.decode("utf-8")
    except UnicodeDecodeError:
        try:
            return file_bytes.decode("cp1251")
        except Exception as e:
            logger.warning(f"Failed to decode as CP1251: {e}. Fallback to ignore errors.")
            return file_bytes.decode("utf-8", errors="ignore")

def parse_pdf(file_bytes: bytes) -> str:
    """
    Извлекает текст из PDF файла с помощью библиотеки pypdf.
    """
    try:
        pdf_file = io.BytesIO(file_bytes)
        reader = pypdf.PdfReader(pdf_file)
        text_parts = []
        for i, page in enumerate(reader.pages):
            text = page.extract_text()
            if text:
                text_parts.append(text)
        
        extracted_text = "\n".join(text_parts).strip()
        if not extracted_text:
            raise ValueError("В PDF файле не найдено текстового содержимого (возможно, это сканированное изображение).")
        return extracted_text
    except Exception as e:
        logger.error(f"Error parsing PDF: {e}")
        raise ValueError(f"Ошибка при разборе PDF файла: {str(e)}")

def parse_docx(file_bytes: bytes) -> str:
    """
    Извлекает текст из файлов DOCX (OpenXML zip) без внешних зависимостей.
    Распаковывает zip-архив файла и собирает все текстовые теги <w:t> из XML структуры документа.
    """
    try:
        docx_file = io.BytesIO(file_bytes)
        with zipfile.ZipFile(docx_file) as docx:
            xml_content = docx.read('word/document.xml')
            tree = ET.fromstring(xml_content)
            
            # Пространство имен Word OpenXML
            namespaces = {'w': 'http://schemas.openxmlformats.org/wordprocessingml/2006/main'}
            
            # Ищем все текстовые элементы <w:t>
            text_elements = tree.findall('.//w:t', namespaces)
            paragraphs = []
            
            # Собираем слова/текст
            current_paragraph = []
            
            # Обходим дерево XML, чтобы сохранить разрывы параграфов для лучшего chunking-а
            for elem in tree.iter():
                if elem.tag.endswith('p'):
                    # Закончился предыдущий абзац
                    if current_paragraph:
                        paragraphs.append("".join(current_paragraph))
                        current_paragraph = []
                elif elem.tag.endswith('t') and elem.text:
                    current_paragraph.append(elem.text)
                    
            if current_paragraph:
                paragraphs.append("".join(current_paragraph))
                
            extracted_text = "\n\n".join(paragraphs).strip()
            if not extracted_text:
                raise ValueError("В DOCX файле не найдено текстового содержимого.")
            return extracted_text
            
    except Exception as e:
        logger.error(f"Error parsing DOCX: {e}")
        raise ValueError(f"Ошибка при разборе DOCX файла: {str(e)}")

def parse_document(filename: str, file_bytes: bytes) -> str:
    """
    Определяет тип файла по его имени и извлекает из него текст.
    """
    lower_filename = filename.lower()
    if lower_filename.endswith('.txt'):
        return parse_txt(file_bytes)
    elif lower_filename.endswith('.pdf'):
        return parse_pdf(file_bytes)
    elif lower_filename.endswith('.docx'):
        return parse_docx(file_bytes)
    else:
        raise ValueError(f"Неподдерживаемый формат файла: .{filename.split('.')[-1]}. Поддерживаются только TXT, PDF, DOCX.")
