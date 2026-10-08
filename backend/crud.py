from sqlalchemy.orm import Session
from datetime import datetime
import models
import schemas

def get_feedback(db: Session, feedback_id: int):
    """Fetch a single feedback record by primary key id."""
    return db.query(models.Feedback).filter(models.Feedback.id == feedback_id).first()

def get_all_feedback(db: Session, skip: int = 0, limit: int = 100):
    """Fetch all feedback records sorted by newest first."""
    return db.query(models.Feedback).order_by(models.Feedback.id.desc()).offset(skip).limit(limit).all()

def create_feedback(db: Session, feedback: schemas.FeedbackCreate):
    """Insert a new feedback record into the SQLite database."""
    db_feedback = models.Feedback(
        student_name=feedback.student_name,
        register_number=feedback.register_number,
        department=feedback.department,
        email=feedback.email,
        rating=feedback.rating,
        feedback=feedback.feedback,
        created_at=datetime.utcnow()
    )
    db.add(db_feedback)
    db.commit()
    db.refresh(db_feedback)
    return db_feedback

def update_feedback(db: Session, feedback_id: int, feedback_update: schemas.FeedbackUpdate):
    """Update an existing feedback record by ID."""
    db_feedback = get_feedback(db, feedback_id)
    if not db_feedback:
        return None
    
    # Use model_dump or dict depending on Pydantic version
    if hasattr(feedback_update, "model_dump"):
        update_data = feedback_update.model_dump(exclude_unset=True)
    else:
        update_data = feedback_update.dict(exclude_unset=True)

    for key, value in update_data.items():
        setattr(db_feedback, key, value)
    
    db.commit()
    db.refresh(db_feedback)
    return db_feedback

def delete_feedback(db: Session, feedback_id: int):
    """Delete an existing feedback record by ID."""
    db_feedback = get_feedback(db, feedback_id)
    if not db_feedback:
        return None
    db.delete(db_feedback)
    db.commit()
    return db_feedback
