import httpx
import logging
from app.core.supabase_client import get_supabase
import uuid

logger = logging.getLogger(__name__)
supabase = get_supabase()

async def send_webhook(url: str, payload: dict):
    """
    Универсальная асинхронная функция для отправки Webhook.
    """
    try:
        async with httpx.AsyncClient() as client:
            response = await client.post(url, json=payload, timeout=5.0)
            response.raise_for_status()
            logger.info(f"Webhook successfully sent to {url}")
    except Exception as e:
        logger.error(f"Failed to send webhook to {url}: {str(e)}")

async def handle_negative_sentiment(widget_id: str, session_id: str, user_message: str):
    """
    Триггер: Отрабатывает, когда sentiment < -0.4.
    Ищет Webhook URL владельца виджета и отправляет алерт о негативе.
    Можно подключить к Telegram боту, Slack или CRM.
    """
    try:
        # 1. Получаем настройки виджета
        widget_res = supabase.table("Widget").select("webhookUrl, name").eq("id", widget_id).execute()
        if not widget_res.data or not widget_res.data[0].get("webhookUrl"):
            logger.info(f"No Webhook configured for widget {widget_id}, skipping sentiment alert.")
            return
            
        widget_info = widget_res.data[0]
        webhook_url = widget_info["webhookUrl"]
        
        # 2. Формируем Payload
        payload = {
            "event": "negative_sentiment",
            "widget_name": widget_info["name"],
            "session_id": session_id,
            "trigger_message": user_message,
            "alert": "Внимание: Клиент недоволен! Требуется вмешательство живого оператора."
        }
        
        # 3. Отправляем Webhook
        await send_webhook(webhook_url, payload)
        
    except Exception as e:
        logger.error(f"Error in handle_negative_sentiment: {str(e)}")

async def process_lead_generation(widget_id: str, session_id: str, lead_data: dict):
    """
    Триггер: Отрабатывает при захвате контактов (Lead Gen Mode).
    """
    try:
        # 1. Сохраняем лида в базу данных PostgreSQL
        supabase.table("Lead").insert({
            "id": str(uuid.uuid4()),
            "widgetId": widget_id,
            "name": lead_data.get("name", "Unknown"),
            "phone": lead_data.get("phone", ""),
            "email": lead_data.get("email", ""),
            "context": lead_data.get("context", "Диалог с ботом..."),
            "isSent": True
        }).execute()

        # 2. Получаем настройки Webhook
        widget_res = supabase.table("Widget").select("webhookUrl").eq("id", widget_id).execute()
        if not widget_res.data or not widget_res.data[0].get("webhookUrl"):
            logger.warning("Lead generated but no webhook configured for forwarding.")
            return
            
        webhook_url = widget_res.data[0]["webhookUrl"]
        
        # 3. Формируем Payload для Salebot / WhatsApp / CRM
        payload = {
            "event": "new_lead",
            "widget_id": widget_id,
            "lead": lead_data,
            "source": "Nexus AI Widget",
            "message": "Новый лид с виджета! Свяжитесь с клиентом."
        }
        
        # 4. Отправка Webhook
        await send_webhook(webhook_url, payload)
        logger.info(f"Lead forwarded to CRM via webhook for widget {widget_id}")
        
    except Exception as e:
        logger.error(f"Error in process_lead_generation: {str(e)}")
