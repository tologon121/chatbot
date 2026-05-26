from fastapi import APIRouter, BackgroundTasks, HTTPException, Request
from pydantic import BaseModel, EmailStr, Field, field_validator
from typing import Optional

from app.core.supabase_client import get_supabase
from app.services.integrations import process_lead_generation

router = APIRouter()
supabase = get_supabase()


class LeadRequest(BaseModel):
    widget_id: str
    session_id: str
    name: Optional[str] = Field(default=None, max_length=120)
    phone: Optional[str] = Field(default=None, max_length=40)
    email: Optional[EmailStr] = None
    context: Optional[str] = Field(
        default="User requested manager contact",
        max_length=2000,
    )

    @field_validator("phone")
    @classmethod
    def at_least_one_contact(cls, v, info):
        # хотя бы что-то одно должно быть указано — проверим позже в endpoint
        return v


@router.post("/capture")
async def capture_lead(
    request: LeadRequest,
    background_tasks: BackgroundTasks,
    http_request: Request,
):
    """
    Эндпоинт, который дергает виджет (Lead Gen Mode),
    когда клиент оставляет свой номер или email в чате.
    """
    if not (request.phone or request.email):
        raise HTTPException(
            status_code=400,
            detail="At least one of phone or email is required.",
        )

    # Проверяем что виджет существует
    widget_res = (
        supabase.table("Widget")
        .select("id, isActive")
        .eq("id", request.widget_id)
        .limit(1)
        .execute()
    )
    if not widget_res.data:
        raise HTTPException(status_code=404, detail="Widget not found")
    if widget_res.data[0].get("isActive") is False:
        raise HTTPException(status_code=403, detail="Widget is disabled")

    lead_data = {
        "name": request.name,
        "phone": request.phone,
        "email": request.email,
        "context": request.context,
    }

    # Асинхронно сохраняем в БД и отправляем Webhook в CRM
    background_tasks.add_task(
        process_lead_generation,
        request.widget_id,
        request.session_id,
        lead_data,
    )

    return {"status": "success", "message": "Lead captured and being processed"}
