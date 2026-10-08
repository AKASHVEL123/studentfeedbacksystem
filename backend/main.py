from fastapi import FastAPI, Depends, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from typing import List
from sqlalchemy.orm import Session

import models
import schemas
import crud
from database import engine, get_db

# Create SQLite database tables if they do not exist
models.Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="Student Feedback Management System API",
    description="REST API for managing student feedback with SQLite and SQLAlchemy ORM",
    version="1.0.0"
)

# Enable CORS so that frontend (localhost:5500, localhost:3000, etc.) can communicate with backend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
def read_root():
    return {
        "app": "Student Feedback Management System API",
        "status": "online",
        "docs_url": "/docs",
        "endpoints": {
            "all_feedback": "GET /feedback",
            "get_one": "GET /feedback/{id}",
            "create": "POST /feedback",
            "update": "PUT /feedback/{id}",
            "delete": "DELETE /feedback/{id}"
        }
    }

# 1. CREATE Feedback
@app.post("/feedback", response_model=schemas.FeedbackResponse, status_code=status.HTTP_201_CREATED)
def create_student_feedback(feedback: schemas.FeedbackCreate, db: Session = Depends(get_db)):
    """Create and persist a new student feedback entry."""
    return crud.create_feedback(db=db, feedback=feedback)

# 2. READ/View all feedback
@app.get("/feedback", response_model=List[schemas.FeedbackResponse])
def read_all_feedback(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    """Retrieve all student feedback records."""
    return crud.get_all_feedback(db=db, skip=skip, limit=limit)

# 3. READ/View one feedback by ID
@app.get("/feedback/{id}", response_model=schemas.FeedbackResponse)
def read_feedback_by_id(id: int, db: Session = Depends(get_db)):
    """Retrieve a single student feedback record by primary key ID."""
    feedback = crud.get_feedback(db=db, feedback_id=id)
    if feedback is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Feedback with ID {id} not found"
        )
    return feedback

# 4. UPDATE feedback
@app.put("/feedback/{id}", response_model=schemas.FeedbackResponse)
def update_student_feedback(id: int, feedback_update: schemas.FeedbackUpdate, db: Session = Depends(get_db)):
    """Update an existing student feedback record by ID."""
    updated = crud.update_feedback(db=db, feedback_id=id, feedback_update=feedback_update)
    if updated is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Feedback with ID {id} not found"
        )
    return updated

# 5. DELETE feedback
@app.delete("/feedback/{id}", status_code=status.HTTP_200_OK)
def delete_student_feedback(id: int, db: Session = Depends(get_db)):
    """Delete a student feedback record by ID."""
    deleted = crud.delete_feedback(db=db, feedback_id=id)
    if deleted is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Feedback with ID {id} not found"
        )
    return {"message": f"Feedback with ID {id} deleted successfully"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
