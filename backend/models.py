from datetime import datetime
from sqlalchemy import Column, Integer, String, Text, DateTime
from database import Base

class Feedback(Base):
    __tablename__ = "feedback"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    student_name = Column(String(100), nullable=False)
    register_number = Column(String(50), nullable=False, index=True)
    department = Column(String(100), nullable=False)
    email = Column(String(120), nullable=True)
    rating = Column(Integer, nullable=False)
    feedback = Column(Text, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
