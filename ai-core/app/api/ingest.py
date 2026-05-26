from fastapi import APIRouter, HTTPException, BackgroundTasks, File, UploadFile, Form
from pydantic import BaseModel
import uuid
import logging
from app.services.rag import process_and_store_document
from app.services.document_parser import parse_document
from app.core.supabase_client import get_supabase

router = APIRouter()
supabase = get_supabase()
logger = logging.getLogger(__name__)

class IngestRequest(BaseModel):
    widget_id: str
    title: str
    text_content: str

@router.post("/upload-text")
async def upload_text(request: IngestRequest, background_tasks: BackgroundTasks):
    """
    Эндпоинт загрузки сырого текста в базу знаний.
    Обработка и векторизация происходит в фоновом режиме для скорости.
    """
    try:
        doc_id = str(uuid.uuid4())
        
        # 1. Создаем запись о документе со статусом PROCESSING в Supabase
        supabase.table("Document").insert({
            "id": doc_id,
            "widgetId": request.widget_id,
            "title": request.title,
            "type": "RAW_TEXT",
            "status": "PROCESSING"
        }).execute()
        
        # 2. Отправляем в фоновую задачу
        background_tasks.add_task(process_and_store_document, doc_id, request.widget_id, request.text_content)
        
        return {"status": "success", "document_id": doc_id, "message": "Document is processing in background"}
    except Exception as e:
        logger.error(f"Error in upload-text: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/upload-file")
async def upload_file(
    background_tasks: BackgroundTasks,
    widget_id: str = Form(...),
    file: UploadFile = File(...)
):
    """
    Эндпоинт загрузки файлов базы знаний (TXT, PDF, DOCX).
    Парсит содержимое на бэкенде, сохраняет метаданные документа и векторизует текст в фоновом режиме.
    """
    try:
        filename = file.filename or "unnamed_file"
        # Читаем байты файла
        file_bytes = await file.read()
        
        # Парсим текст на основе расширения файла
        try:
            text_content = parse_document(filename, file_bytes)
        except ValueError as val_err:
            raise HTTPException(status_code=400, detail=str(val_err))
            
        doc_id = str(uuid.uuid4())
        
        # Определяем тип файла для сохранения в Supabase
        lower_name = filename.lower()
        if lower_name.endswith('.pdf'):
            doc_type = 'PDF'
        elif lower_name.endswith('.docx'):
            doc_type = 'DOCX'
        else:
            doc_type = 'TXT'
            
        # 1. Создаем запись о документе со статусом PROCESSING
        supabase.table("Document").insert({
            "id": doc_id,
            "widgetId": widget_id,
            "title": filename,
            "type": doc_type,
            "status": "PROCESSING"
        }).execute()
        
        # 2. Запускаем фоновую задачу chunking + embedding
        background_tasks.add_task(process_and_store_document, doc_id, widget_id, text_content)
        
        return {
            "status": "success",
            "document_id": doc_id,
            "title": filename,
            "type": doc_type,
            "message": "Файл успешно загружен и обрабатывается в фоновом режиме"
        }
    except HTTPException as http_exc:
        raise http_exc
    except Exception as e:
        logger.error(f"Error in upload-file: {e}")
        raise HTTPException(status_code=500, detail=f"Внутренняя ошибка сервера при обработке файла: {str(e)}")

@router.get("/documents/{widget_id}")
async def get_documents(widget_id: str):
    """
    Возвращает список всех документов в базе знаний для конкретного виджета.
    """
    try:
        res = supabase.table("Document").select("*").eq("widgetId", widget_id).execute()
        return res.data
    except Exception as e:
        logger.error(f"Error getting documents for widget {widget_id}: {e}")
        raise HTTPException(status_code=500, detail=f"Не удалось получить список документов: {str(e)}")

@router.delete("/documents/{document_id}")
async def delete_document(document_id: str):
    """
    Удаляет документ из базы знаний. Связанные векторные чанки удаляются 
    автоматически каскадом в Supabase (благодаря ON DELETE CASCADE на внешнем ключе).
    """
    try:
        supabase.table("Document").delete().eq("id", document_id).execute()
        return {"status": "success", "message": f"Документ {document_id} успешно удален из базы знаний."}
    except Exception as e:
        logger.error(f"Error deleting document {document_id}: {e}")
        raise HTTPException(status_code=500, detail=f"Не удалось удалить документ: {str(e)}")
