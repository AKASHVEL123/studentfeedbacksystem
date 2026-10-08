from pydantic import BaseModel, Field, EmailStr
from typing import Optional
from datetime import datetime

class FeedbackBase(BaseModel):
    student_name: str = Field(..., min_length=2, max_length=100, description="Full name of student")
    register_number: str = Field(..., min_length=2, max_length=50, description="College register or roll number")
    department: str = Field(..., min_length=2, max_length=100, description="Academic department")
    email: Optional[EmailStr] = Field(None, description="Valid email address")
    rating: int = Field(..., ge=1, le=5, description="Rating scale from 1 to 5")
    feedback: str = Field(..., min_length=5, description="Feedback comments")

class FeedbackCreate(FeedbackBase):
    pass

class FeedbackUpdate(BaseModel):
    student_name: Optional[str] = Field(None, min_length=2, max_length=100)
    register_number: Optional[str] = Field(None, min_length=2, max_length=50)
    department: Optional[str] = Field(None, min_length=2, max_length=100)
    email: Optional[EmailStr] = None
    rating: Optional[int] = Field(None, ge=1, le=5)
    feedback: Optional[str] = Field(None, min_length=5)

class FeedbackResponse(FeedbackBase):
    id: int
    created_at: datetime

    class Config:
        from_attributes = True
