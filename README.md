# Student Feedback Management System 🎓

A clean, beginner-friendly full-stack web application developed for college mini-projects. It allows educational institutions to collect, manage, review, and evaluate student feedback across departments with complete CRUD operations.

---

## 1. Project Introduction

The **Student Feedback Management System** provides an intuitive academic feedback portal. Students or evaluators can submit course and lab feedback with ratings (1 to 5 stars), department tags, and comments. Department coordinators can search, filter, view complete details, edit records, and remove obsolete entries.

The system is designed with a modern decoupled architecture:
- **Frontend:** Pure HTML5, CSS3, and Vanilla JavaScript (No heavy frameworks, easy for viva/examinations).
- **Backend:** Python FastAPI REST API with Pydantic schemas and SQLAlchemy ORM.
- **Database:** SQLite database (`student_feedback.db`).
- **DevOps:** Containerized with Docker and ready for deployment on Kubernetes via Minikube.

---

## 2. Features

- **Complete CRUD Operations:**
  - **Create:** Submit feedback with student name, register number, department, email, star rating (1–5), and comments.
  - **Read (All):** View all records in a responsive, styled data table with real-time KPI metrics.
  - **Read (Single):** Modal popup displaying full details of an individual feedback entry.
  - **Update:** Pre-fill existing record data into the form and update via `PUT /feedback/{id}`.
  - **Delete:** Safe deletion with confirmation modal dialog via `DELETE /feedback/{id}`.
- **Academic Dashboard & Analytics:**
  - Real-time statistics: Total Feedbacks, Average Rating, 5-Star Count, Department count.
  - Live client-side search across student name, register number, department, and feedback text.
  - Filters by department and rating level.
- **Interactive 5-Star Picker:** User-friendly hover and select star rating input.
- **Data Validation:** Form validation in frontend + Pydantic schema validation on FastAPI backend (rating restricted to 1–5, email format check, required fields).
- **Toast Notifications:** Smooth feedback notifications on add, edit, delete, and error events.

---

## 3. Technologies Used

| Layer | Technology | Purpose |
| :--- | :--- | :--- |
| **Frontend** | HTML5, CSS3, Vanilla JavaScript | Simple responsive UI, DOM manipulation, `fetch()` API |
| **Backend** | Python 3.10+, FastAPI | High-performance asynchronous REST API framework |
| **Data Validation** | Pydantic v2 | Request/response data models and parameter validation |
| **ORM** | SQLAlchemy 2.0+ | Object Relational Mapping with SQLite database |
| **Web Server** | Uvicorn | Lightning-fast ASGI server for Python |
| **Database** | SQLite (`student_feedback.db`) | Lightweight, self-contained SQL database |
| **Containerization** | Docker, Docker Compose | Container packaging and multi-container orchestration |
| **Orchestration** | Kubernetes, Minikube | Pod replication, service exposure, and container management |

---

## 4. Project Structure

```text
student-feedback-app/
│
├── backend/
│   ├── main.py                  # FastAPI application entry point, CORS & route definitions
│   ├── database.py              # SQLite engine, SessionLocal, and DB dependency
│   ├── models.py                # SQLAlchemy ORM model for "feedback" table
│   ├── schemas.py               # Pydantic validation schemas (Create, Update, Response)
│   ├── crud.py                  # Database CRUD query functions
│   ├── requirements.txt         # Python package dependencies
│   └── student_feedback.db      # SQLite database file
│
├── frontend/
│   ├── index.html               # Main dashboard HTML structure
│   ├── style.css                # Academic theme styling (Navy/Royal Blue & White)
│   └── script.js                # Vanilla JS CRUD handler communicating via fetch()
│
├── k8s/
│   ├── deployment.yaml          # Kubernetes deployment (2 replicas, resource limits)
│   └── service.yaml             # Kubernetes NodePort service (port 30080)
│
├── Dockerfile                   # Docker build file for FastAPI backend container
├── docker-compose.yml           # Multi-container setup for backend + frontend
└── README.md                    # Detailed documentation and execution guide
```

---

## 5. How to Install Dependencies

### Prerequisites
- Python 3.10 or higher
- `pip` package manager

### Steps
1. Open your terminal and navigate to the project directory:
   ```bash
   cd student-feedback-app/backend
   ```
2. (Optional but recommended) Create and activate a Python virtual environment:
   ```bash
   # On Linux/macOS
   python3 -m venv venv
   source venv/bin/activate

   # On Windows
   python -m venv venv
   venv\Scripts\activate
   ```
3. Install required Python packages:
   ```bash
   pip install -r requirements.txt
   ```

---

## 6. How to Run Backend

1. Navigate to the `backend/` folder:
   ```bash
   cd backend
   ```
2. Start the Uvicorn development server:
   ```bash
   uvicorn main:app --host 0.0.0.0 --port 8000 --reload
   ```
3. The backend is now running at:
   - Base URL: `http://localhost:8000`
   - Interactive Swagger API Documentation: `http://localhost:8000/docs`
   - ReDoc Documentation: `http://localhost:8000/redoc`

---

## 7. How to Run Frontend

The frontend uses standard HTML, CSS, and JavaScript. You can run it using any simple local web server:

### Option A: Using Python's built-in HTTP server
1. Open a new terminal in the `frontend/` directory:
   ```bash
   cd frontend
   python3 -m http.server 5500
   ```
2. Open your browser and navigate to:
   ```text
   http://localhost:5500
   ```

### Option B: Using VS Code Live Server
1. Open the project folder in VS Code.
2. Right-click `frontend/index.html` and click **"Open with Live Server"**.
3. It will open automatically at `http://localhost:5500` or `http://127.0.0.1:5500`.

---

## 8. How to Test CRUD Operations

### A. Via Frontend Dashboard
1. **Create:** Click `+ Add Feedback`, fill in the form (e.g. Rating: 5, Dept: Computer Science), and click **Submit Feedback**.
2. **Read (All):** The table immediately displays the newly created record with formatted stars and register number.
3. **Read (Single):** Click the **👁️ View** button on any table row to see complete details in a modal card.
4. **Update:** Click the **✏️ Edit** button on any record, modify the feedback text or rating, and click **Update Feedback**.
5. **Delete:** Click the **🗑️ Delete** button, review the student details in the confirmation modal, and confirm.

### B. Via FastAPI Swagger Docs (`http://localhost:8000/docs`)
- **POST `/feedback`**: Test JSON payload:
  ```json
  {
    "student_name": "Aarav Sharma",
    "register_number": "2023CS101",
    "department": "Computer Science & Engineering",
    "email": "aarav.cs@college.edu",
    "rating": 5,
    "feedback": "Outstanding laboratory practicals and guidance!"
  }
  ```
- **GET `/feedback`**: Returns a list of all feedback objects.
- **GET `/feedback/1`**: Returns details of feedback with ID 1.
- **PUT `/feedback/1`**: Updates fields for ID 1.
- **DELETE `/feedback/1`**: Deletes record with ID 1.

---

## 9. How to Build Docker Image

Build the backend container image from the root directory:

```bash
docker build -t student-feedback-api:latest .
```

---

## 10. How to Run Docker Container

### Run single container:
```bash
docker run -d -p 8000:8000 --name student_feedback_api student-feedback-api:latest
```

### Or run using Docker Compose (Backend + Frontend together):
```bash
docker-compose up --build
```
- Backend will be available at: `http://localhost:8000`
- Frontend will be available at: `http://localhost:5500`

To stop the containers:
```bash
docker-compose down
```

---

## 11. How to Start Minikube

Ensure you have [Minikube](https://minikube.sigs.k8s.io/) and `kubectl` installed.

1. Start Minikube cluster:
   ```bash
   minikube start
   ```
2. Point your local Docker CLI to Minikube's Docker daemon (so Minikube can use your locally built image):
   ```bash
   # Linux / macOS
   eval $(minikube docker-env)

   # Windows PowerShell
   & minikube -p minikube docker-env --shell powershell | Invoke-Expression
   ```
3. Build the image inside Minikube's environment:
   ```bash
   docker build -t student-feedback-api:latest .
   ```

---

## 12. How to Deploy to Kubernetes

Apply the deployment and service manifests:

```bash
kubectl apply -f k8s/deployment.yaml
kubectl apply -f k8s/service.yaml
```

---

## 13. How to Verify Pods

1. Check deployment status:
   ```bash
   kubectl get deployments
   ```
2. Verify both Pod replicas are running:
   ```bash
   kubectl get pods -l app=student-feedback-api
   ```
   *Expected output:*
   ```text
   NAME                                    READY   STATUS    RESTARTS   AGE
   student-feedback-api-7b8f99c85b-abcde   1/1     Running   0          30s
   student-feedback-api-7b8f99c85b-vwxyz   1/1     Running   0          30s
   ```
3. Inspect service:
   ```bash
   kubectl get svc student-feedback-service
   ```

---

## 14. How to Access the Application

### Under Minikube:
1. Open the service URL using Minikube's service command:
   ```bash
   minikube service student-feedback-service --url
   ```
2. Or create a tunnel directly:
   ```bash
   minikube tunnel
   ```
3. Open `http://localhost:8000/docs` in your browser to view the interactive FastAPI Swagger API documentation.

---

## Evaluation & Viva Checklist
- ✅ Clean folder structure following standard Python & Web conventions.
- ✅ SQLAlchemy ORM models mapping strictly to SQLite tables.
- ✅ Pydantic schema validation preventing invalid ratings (< 1 or > 5).
- ✅ Asynchronous CORS-enabled REST API endpoints.
- ✅ Pure HTML5, CSS3, and JavaScript frontend with no external build tool requirement.
- ✅ Production containerization with Docker & Kubernetes deployment manifests.
