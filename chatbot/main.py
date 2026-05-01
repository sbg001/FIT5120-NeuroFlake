from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from dotenv import load_dotenv
from typing import List, Optional
import requests
import json
import os
import uuid
import psycopg2
import psycopg2.extras
from behavior_engine import calculate_overload_risk, load_model

# Load the variables from your .env file
load_dotenv() 

app = FastAPI()

# Initialize the ML model when the FastAPI server starts
@app.on_event("startup")
async def startup_event():
    print("Booting up backend services...")
    load_model()

class RiskRequest(BaseModel):
    hours_slept: float
    overwhelmed_count: int
    tasks_abandoned: int
    tasks_completed: int

# Allow frontend to connect
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# 1. UPDATE: Tell the backend to expect a pet_type when breaking down tasks
class TaskRequest(BaseModel):
    task_name: str
    pet_type: str = "bear" # Default fallback

# 2. ADD: The data model for the new chat widget
class ChatMessage(BaseModel):
    role: str
    content: str

class ChatRequest(BaseModel):
    message: str
    pet_type: str = "bear"
    history: List[ChatMessage] = []
    user_role: str = "child" # NEW: Default to child for safety

GROQ_API_KEY = os.getenv("GROQ_API_KEY")
DATABASE_URL = os.getenv("DATABASE_URL")


def get_db_connection():
    if not DATABASE_URL:
        raise HTTPException(status_code=500, detail="Database URL is not configured.")
    return psycopg2.connect(DATABASE_URL)


def user_row_to_dict(row):
    if not row:
        return None

    return {
        "user_id": str(row["user_id"]),
        "device_id": row.get("device_id"),
        "role": row.get("role"),
        "name": row.get("name"),
        "email": row.get("email"),
        "username": row.get("username"),
        "age": row.get("age"),
        "parent_id": str(row["parent_id"]) if row.get("parent_id") else None,
        "pin_code": row.get("pin_code"),
        "created_at": row["created_at"].isoformat() if row.get("created_at") else None,
    }


class SignInRequest(BaseModel):
    identifier: str
    password: str


class RegisterParentRequest(BaseModel):
    name: str
    email: str
    password: str


class CreateChildRequest(BaseModel):
    parentId: str
    name: str
    username: str
    password: str
    age: int

# ==========================================
# AUTH ENDPOINTS
# ==========================================
@app.post("/api/auth/sign-in")
async def sign_in(request: SignInRequest):
    identifier = request.identifier.strip().lower()
    password = request.password

    if not identifier or not password:
        raise HTTPException(status_code=400, detail="Please enter your account and password.")

    try:
        conn = get_db_connection()
        cur = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)

        cur.execute(
            """
            SELECT *
            FROM users
            WHERE lower(email) = %s OR lower(username) = %s
            LIMIT 1
            """,
            (identifier, identifier),
        )

        user = cur.fetchone()
        cur.close()
        conn.close()

        if not user or str(user.get("password")) != str(password):
            raise HTTPException(status_code=401, detail="Invalid account or password.")

        return user_row_to_dict(user)

    except HTTPException:
        raise
    except Exception as e:
        print(f"Sign in error: {str(e)}")
        raise HTTPException(status_code=500, detail="Could not sign in.")


@app.post("/api/auth/register-parent")
async def register_parent(request: RegisterParentRequest):
    name = request.name.strip()
    email = request.email.strip().lower()
    password = request.password

    if not name or not email or not password:
        raise HTTPException(status_code=400, detail="Please complete all parent sign up fields.")

    try:
        conn = get_db_connection()
        cur = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)

        cur.execute(
            """
            SELECT user_id
            FROM users
            WHERE lower(email) = %s
            LIMIT 1
            """,
            (email,),
        )

        existing_user = cur.fetchone()

        if existing_user:
            cur.close()
            conn.close()
            raise HTTPException(status_code=400, detail="This email is already registered.")

        new_user_id = str(uuid.uuid4())

        cur.execute(
            """
            INSERT INTO users (
                user_id,
                role,
                name,
                email,
                username,
                password,
                age,
                parent_id,
                pin_code,
                created_at
            )
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, NOW())
            RETURNING *
            """,
            (
                new_user_id,
                "parent",
                name,
                email,
                "",
                password,
                None,
                None,
                "",
            ),
        )

        new_parent = cur.fetchone()
        conn.commit()

        cur.close()
        conn.close()

        return user_row_to_dict(new_parent)

    except HTTPException:
        raise
    except Exception as e:
        print(f"Register parent error: {str(e)}")
        raise HTTPException(status_code=500, detail="Could not create parent account.")


@app.post("/api/auth/create-child")
async def create_child(request: CreateChildRequest):
    parent_id = request.parentId
    name = request.name.strip()
    username = request.username.strip().lower()
    password = request.password
    age = request.age

    if not parent_id or not name or not username or not password or not age:
        raise HTTPException(status_code=400, detail="Please complete all child account fields.")

    try:
        conn = get_db_connection()
        cur = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)

        cur.execute(
            """
            SELECT user_id
            FROM users
            WHERE user_id = %s AND role = 'parent'
            LIMIT 1
            """,
            (parent_id,),
        )

        parent = cur.fetchone()

        if not parent:
            cur.close()
            conn.close()
            raise HTTPException(status_code=403, detail="A valid parent account is required.")

        cur.execute(
            """
            SELECT user_id
            FROM users
            WHERE lower(username) = %s
            LIMIT 1
            """,
            (username,),
        )

        existing_child = cur.fetchone()

        if existing_child:
            cur.close()
            conn.close()
            raise HTTPException(status_code=400, detail="This child username is already used.")

        new_user_id = str(uuid.uuid4())

        cur.execute(
            """
            INSERT INTO users (
                user_id,
                role,
                name,
                email,
                username,
                password,
                age,
                parent_id,
                pin_code,
                created_at
            )
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, NOW())
            RETURNING *
            """,
            (
                new_user_id,
                "child",
                name,
                "",
                username,
                password,
                age,
                parent_id,
                "",
            ),
        )

        new_child = cur.fetchone()
        conn.commit()

        cur.close()
        conn.close()

        return user_row_to_dict(new_child)

    except HTTPException:
        raise
    except Exception as e:
        print(f"Create child error: {str(e)}")
        raise HTTPException(status_code=500, detail="Could not create child account.")


@app.get("/api/auth/children/{parent_id}")
async def get_children(parent_id: str):
    try:
        conn = get_db_connection()
        cur = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)

        cur.execute(
            """
            SELECT *
            FROM users
            WHERE role = 'child' AND parent_id = %s
            ORDER BY created_at ASC
            """,
            (parent_id,),
        )

        children = cur.fetchall()

        cur.close()
        conn.close()

        return [user_row_to_dict(child) for child in children]

    except Exception as e:
        print(f"Get children error: {str(e)}")
        raise HTTPException(status_code=500, detail="Could not load child accounts.")

def task_row_to_dict(row):
    if not row:
        return None

    return {
        "task_id": str(row.get("task_id")),
        "child_id": str(row.get("child_id")) if row.get("child_id") else None,
        "created_by": str(row.get("created_by")) if row.get("created_by") else None,
        "title": row.get("title"),
        "description": row.get("description"),
        "status": row.get("status"),
        "total_steps": row.get("total_steps") or 0,
        "completed_steps": row.get("completed_steps") or 0,
        "priority_type": row.get("priority_type"),
        "priority_rank": row.get("priority_rank"),
        "created_at": row["created_at"].isoformat() if row.get("created_at") else None,
        "updated_at": row["updated_at"].isoformat() if row.get("updated_at") else None,
    }


def task_step_row_to_dict(row):
    if not row:
        return None

    return {
        "step_id": str(row.get("step_id")),
        "task_id": str(row.get("task_id")),
        "step_order": row.get("step_order"),
        "step_title": row.get("step_title"),
        "step_description": row.get("step_description"),
        "is_completed": row.get("is_completed") or False,
        "completed_at": row["completed_at"].isoformat() if row.get("completed_at") else None,
        "visual_hint": row.get("visual_hint"),
        "example_text": row.get("example_text"),
    }


class CreateTaskRequest(BaseModel):
    child_id: str
    created_by: str
    title: str
    description: str
    status: str = "pending"
    total_steps: int = 0
    completed_steps: int = 0
    priority_type: Optional[str] = None
    priority_rank: Optional[int] = None


class UpdateTaskRequest(BaseModel):
    title: str
    description: str
    priority_type: Optional[str] = None
    priority_rank: Optional[int] = None


class CreateTaskStepRequest(BaseModel):
    task_id: str
    step_order: int
    step_title: str
    step_description: Optional[str] = None
    is_completed: bool = False
    completed_at: Optional[str] = None
    visual_hint: Optional[str] = None
    example_text: Optional[str] = None


class UpdateTaskStepRequest(BaseModel):
    step_order: int
    step_title: str
    step_description: Optional[str] = None
    visual_hint: Optional[str] = None
    example_text: Optional[str] = None

# ==========================================

# TASK AND TASK STEP ENDPOINTS

# ==========================================

@app.get("/api/tasks")

async def get_tasks(child_id: Optional[str] = None):

    try:

        conn = get_db_connection()

        cur = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)

        if child_id:

            cur.execute(

                """

                SELECT *

                FROM tasks

                WHERE child_id = %s

                ORDER BY created_at DESC

                """,

                (child_id,),

            )

        else:

            cur.execute(

                """

                SELECT *

                FROM tasks

                ORDER BY created_at DESC

                """

            )

        tasks = cur.fetchall()

        cur.close()

        conn.close()

        return [task_row_to_dict(task) for task in tasks]

    except Exception as e:

        print(f"Get tasks error: {str(e)}")

        raise HTTPException(status_code=500, detail="Could not load tasks.")

@app.get("/api/tasks/{task_id}")

async def get_task_by_id(task_id: str):

    try:

        conn = get_db_connection()

        cur = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)

        cur.execute(

            """

            SELECT *

            FROM tasks

            WHERE task_id = %s

            LIMIT 1

            """,

            (task_id,),

        )

        task = cur.fetchone()

        cur.close()

        conn.close()

        if not task:

            raise HTTPException(status_code=404, detail="Task not found.")

        return task_row_to_dict(task)

    except HTTPException:

        raise

    except Exception as e:

        print(f"Get task by id error: {str(e)}")

        raise HTTPException(status_code=500, detail="Could not load task.")

@app.get("/api/tasks/{task_id}/steps")

async def get_task_steps(task_id: str):

    try:

        conn = get_db_connection()

        cur = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)

        cur.execute(

            """

            SELECT *

            FROM task_steps

            WHERE task_id = %s

            ORDER BY step_order ASC

            """,

            (task_id,),

        )

        steps = cur.fetchall()

        cur.close()

        conn.close()

        return [task_step_row_to_dict(step) for step in steps]

    except Exception as e:

        print(f"Get task steps error: {str(e)}")

        raise HTTPException(status_code=500, detail="Could not load task steps.")

@app.get("/api/today-task")

async def get_today_task(child_id: Optional[str] = None):

    try:

        conn = get_db_connection()

        cur = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)

        if child_id:

            cur.execute(

                """

                SELECT *

                FROM tasks

                WHERE child_id = %s

                ORDER BY created_at DESC

                LIMIT 1

                """,

                (child_id,),

            )

        else:

            cur.execute(

                """

                SELECT *

                FROM tasks

                ORDER BY created_at DESC

                LIMIT 1

                """

            )

        task = cur.fetchone()

        cur.close()

        conn.close()

        return task_row_to_dict(task) if task else None

    except Exception as e:

        print(f"Get today task error: {str(e)}")

        raise HTTPException(status_code=500, detail="Could not load today's task.")

@app.post("/api/tasks")

async def create_task(request: CreateTaskRequest):

    try:

        conn = get_db_connection()

        cur = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)

        task_id = str(uuid.uuid4())

        cur.execute(

            """

            INSERT INTO tasks (

                task_id,

                child_id,

                created_by,

                title,

                description,

                status,

                total_steps,

                completed_steps,

                priority_type,

                priority_rank,

                created_at,

                updated_at

            )

            VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, NOW(), NOW())

            RETURNING *

            """,

            (

                task_id,

                request.child_id,

                request.created_by,

                request.title,

                request.description,

                request.status,

                request.total_steps,

                request.completed_steps,

                request.priority_type,

                request.priority_rank,

            ),

        )

        task = cur.fetchone()

        conn.commit()

        cur.close()

        conn.close()

        return task_row_to_dict(task)

    except Exception as e:

        print(f"Create task error: {str(e)}")

        raise HTTPException(status_code=500, detail="Could not create task.")

@app.post("/api/task-steps")

async def create_task_step(request: CreateTaskStepRequest):

    try:

        conn = get_db_connection()

        cur = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)

        step_id = str(uuid.uuid4())

        cur.execute(

            """

            INSERT INTO task_steps (

                step_id,

                task_id,

                step_order,

                step_title,

                step_description,

                is_completed,

                completed_at,

                visual_hint,

                example_text

            )

            VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s)

            RETURNING *

            """,

            (

                step_id,

                request.task_id,

                request.step_order,

                request.step_title,

                request.step_description,

                request.is_completed,

                request.completed_at,

                request.visual_hint,

                request.example_text,

            ),

        )

        step = cur.fetchone()

        conn.commit()

        cur.close()

        conn.close()

        return task_step_row_to_dict(step)

    except Exception as e:

        print(f"Create task step error: {str(e)}")

        raise HTTPException(status_code=500, detail="Could not create task step.")

@app.patch("/api/tasks/{task_id}")

async def update_task(task_id: str, request: UpdateTaskRequest):

    try:

        conn = get_db_connection()

        cur = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)

        cur.execute(

            """

            UPDATE tasks

            SET

                title = %s,

                description = %s,

                priority_type = %s,

                priority_rank = %s,

                updated_at = NOW()

            WHERE task_id = %s

            RETURNING *

            """,

            (

                request.title,

                request.description,

                request.priority_type,

                request.priority_rank,

                task_id,

            ),

        )

        task = cur.fetchone()

        conn.commit()

        cur.close()

        conn.close()

        if not task:

            raise HTTPException(status_code=404, detail="Task not found.")

        return task_row_to_dict(task)

    except HTTPException:

        raise

    except Exception as e:

        print(f"Update task error: {str(e)}")

        raise HTTPException(status_code=500, detail="Could not update task.")

@app.patch("/api/task-steps/{step_id}")

async def update_task_step(step_id: str, request: UpdateTaskStepRequest):

    try:

        conn = get_db_connection()

        cur = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)

        cur.execute(

            """

            UPDATE task_steps

            SET

                step_order = %s,

                step_title = %s,

                step_description = %s,

                visual_hint = %s,

                example_text = %s

            WHERE step_id = %s

            RETURNING *

            """,

            (

                request.step_order,

                request.step_title,

                request.step_description,

                request.visual_hint,

                request.example_text,

                step_id,

            ),

        )

        step = cur.fetchone()

        conn.commit()

        cur.close()

        conn.close()

        if not step:

            raise HTTPException(status_code=404, detail="Task step not found.")

        return task_step_row_to_dict(step)

    except HTTPException:

        raise

    except Exception as e:

        print(f"Update task step error: {str(e)}")

        raise HTTPException(status_code=500, detail="Could not update task step.")

@app.delete("/api/tasks/{task_id}")

async def delete_task(task_id: str):

    try:

        conn = get_db_connection()

        cur = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)

        cur.execute("DELETE FROM task_steps WHERE task_id = %s", (task_id,))

        cur.execute("DELETE FROM tasks WHERE task_id = %s", (task_id,))

        conn.commit()

        cur.close()

        conn.close()

        return {"task_id": task_id}

    except Exception as e:

        print(f"Delete task error: {str(e)}")

        raise HTTPException(status_code=500, detail="Could not delete task.")

@app.delete("/api/task-steps/{step_id}")

async def delete_task_step(step_id: str):

    try:

        conn = get_db_connection()

        cur = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)

        cur.execute("DELETE FROM task_steps WHERE step_id = %s", (step_id,))

        conn.commit()

        cur.close()

        conn.close()

        return {"step_id": step_id}

    except Exception as e:

        print(f"Delete task step error: {str(e)}")

        raise HTTPException(status_code=500, detail="Could not delete task step.")

@app.patch("/api/tasks/{task_id}/step-count")

async def update_task_step_count(task_id: str):

    try:

        conn = get_db_connection()

        cur = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)

        cur.execute(

            """

            SELECT COUNT(*) AS step_count

            FROM task_steps

            WHERE task_id = %s

            """,

            (task_id,),

        )

        count_row = cur.fetchone()

        step_count = count_row["step_count"] if count_row else 0

        cur.execute(

            """

            UPDATE tasks

            SET total_steps = %s, updated_at = NOW()

            WHERE task_id = %s

            RETURNING *

            """,

            (step_count, task_id),

        )

        task = cur.fetchone()

        conn.commit()

        cur.close()

        conn.close()

        if not task:

            raise HTTPException(status_code=404, detail="Task not found.")

        return task_row_to_dict(task)

    except HTTPException:

        raise

    except Exception as e:

        print(f"Update task step count error: {str(e)}")

        raise HTTPException(status_code=500, detail="Could not update task step count.")

@app.post("/api/tasks/{task_id}/reset")

async def reset_task_status(task_id: str):

    try:

        conn = get_db_connection()

        cur = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)

        cur.execute(

            """

            UPDATE task_steps

            SET is_completed = false, completed_at = NULL

            WHERE task_id = %s

            """,

            (task_id,),

        )

        cur.execute(

            """

            UPDATE tasks

            SET

                status = 'pending',

                completed_steps = 0,

                updated_at = NOW()

            WHERE task_id = %s

            RETURNING *

            """,

            (task_id,),

        )

        task = cur.fetchone()

        conn.commit()

        cur.close()

        conn.close()

        if not task:

            raise HTTPException(status_code=404, detail="Task not found.")

        return task_row_to_dict(task)

    except HTTPException:

        raise

    except Exception as e:

        print(f"Reset task error: {str(e)}")

        raise HTTPException(status_code=500, detail="Could not reset task.")

@app.post("/api/tasks/{task_id}/complete-step/{step_id}")

async def complete_step(task_id: str, step_id: str):

    try:

        conn = get_db_connection()

        cur = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)

        cur.execute(

            """

            UPDATE task_steps

            SET is_completed = true, completed_at = NOW()

            WHERE task_id = %s AND step_id = %s

            RETURNING *

            """,

            (task_id, step_id),

        )

        step = cur.fetchone()

        if not step:

            cur.close()

            conn.close()

            raise HTTPException(status_code=404, detail="Task step not found.")

        cur.execute(

            """

            SELECT COUNT(*) AS completed_count

            FROM task_steps

            WHERE task_id = %s AND is_completed = true

            """,

            (task_id,),

        )

        completed_row = cur.fetchone()

        completed_steps = completed_row["completed_count"] if completed_row else 0

        cur.execute(

            """

            SELECT total_steps

            FROM tasks

            WHERE task_id = %s

            LIMIT 1

            """,

            (task_id,),

        )

        task_count_row = cur.fetchone()

        total_steps = task_count_row["total_steps"] if task_count_row else 0

        new_status = (

            "completed"

            if completed_steps > 0 and completed_steps == total_steps

            else "in_progress"

        )

        cur.execute(

            """

            UPDATE tasks

            SET

                completed_steps = %s,

                status = %s,

                updated_at = NOW()

            WHERE task_id = %s

            """,

            (completed_steps, new_status, task_id),

        )

        conn.commit()

        cur.close()

        conn.close()

        return task_step_row_to_dict(step)

    except HTTPException:

        raise

    except Exception as e:

        print(f"Complete step error: {str(e)}")

        raise HTTPException(status_code=500, detail="Could not complete step.")

@app.post("/api/tasks/{task_id}/complete")

async def complete_task(task_id: str):

    try:

        conn = get_db_connection()

        cur = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)

        cur.execute(

            """

            SELECT total_steps

            FROM tasks

            WHERE task_id = %s

            LIMIT 1

            """,

            (task_id,),

        )

        task = cur.fetchone()

        if not task:

            cur.close()

            conn.close()

            raise HTTPException(status_code=404, detail="Task not found.")

        total_steps = task["total_steps"] or 0

        cur.execute(

            """

            UPDATE task_steps

            SET is_completed = true, completed_at = NOW()

            WHERE task_id = %s

            """,

            (task_id,),

        )

        cur.execute(

            """

            UPDATE tasks

            SET

                status = 'completed',

                completed_steps = %s,

                updated_at = NOW()

            WHERE task_id = %s

            RETURNING *

            """,

            (total_steps, task_id),

        )

        completed_task = cur.fetchone()

        conn.commit()

        cur.close()

        conn.close()

        return task_row_to_dict(completed_task)

    except HTTPException:

        raise

    except Exception as e:

        print(f"Complete task error: {str(e)}")

        raise HTTPException(status_code=500, detail="Could not complete task.")
    
# ==========================================
# ROUTINE HELPERS AND MODELS
# ==========================================
def routine_row_to_dict(row):
    if not row:
        return None

    return {
        "routine_id": str(row.get("routine_id")),
        "child_id": str(row.get("child_id")) if row.get("child_id") else None,
        "title": row.get("title"),
        "description": row.get("description"),
        "display_order": row.get("display_order") or 0,
        "created_at": row["created_at"].isoformat() if row.get("created_at") else None,
    }


def routine_item_row_to_dict(row):
    if not row:
        return None

    return {
        "item_id": str(row.get("item_id")),
        "routine_id": str(row.get("routine_id")),
        "item_order": row.get("item_order") or 0,
        "title": row.get("title"),
        "description": row.get("description"),
        "reminder_time": row.get("reminder_time"),
        "is_completed": row.get("is_completed") or False,
        "completed_at": row["completed_at"].isoformat() if row.get("completed_at") else None,
        "created_at": row["created_at"].isoformat() if row.get("created_at") else None,
    }


class UpdateRoutineItemRequest(BaseModel):
    is_completed: bool


# ==========================================
# ROUTINE ENDPOINTS
# ==========================================
@app.get("/api/routines")
async def get_routines(child_id: Optional[str] = None):
    try:
        conn = get_db_connection()
        cur = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)

        if child_id:
            cur.execute(
                """
                SELECT *
                FROM routines
                WHERE child_id = %s OR child_id IS NULL
                ORDER BY display_order ASC
                """,
                (child_id,),
            )
        else:
            cur.execute(
                """
                SELECT *
                FROM routines
                ORDER BY display_order ASC
                """
            )

        routines = cur.fetchall()
        cur.close()
        conn.close()

        return [routine_row_to_dict(routine) for routine in routines]

    except Exception as e:
        print(f"Get routines error: {str(e)}")
        raise HTTPException(status_code=500, detail="Could not load routines.")


@app.get("/api/routines/{routine_id}/items")
async def get_routine_items(routine_id: str):
    try:
        conn = get_db_connection()
        cur = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)

        cur.execute(
            """
            SELECT *
            FROM routine_items
            WHERE routine_id = %s
            ORDER BY item_order ASC
            """,
            (routine_id,),
        )

        items = cur.fetchall()
        cur.close()
        conn.close()

        return [routine_item_row_to_dict(item) for item in items]

    except Exception as e:
        print(f"Get routine items error: {str(e)}")
        raise HTTPException(status_code=500, detail="Could not load routine items.")


@app.patch("/api/routine-items/{item_id}")
async def update_routine_item(item_id: str, request: UpdateRoutineItemRequest):
    try:
        conn = get_db_connection()
        cur = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)

        cur.execute(
            """
            UPDATE routine_items
            SET
                is_completed = %s,
                completed_at = CASE WHEN %s THEN NOW() ELSE NULL END
            WHERE item_id = %s
            RETURNING *
            """,
            (
                request.is_completed,
                request.is_completed,
                item_id,
            ),
        )

        item = cur.fetchone()
        conn.commit()

        cur.close()
        conn.close()

        if not item:
            raise HTTPException(status_code=404, detail="Routine item not found.")

        return routine_item_row_to_dict(item)

    except HTTPException:
        raise
    except Exception as e:
        print(f"Update routine item error: {str(e)}")
        raise HTTPException(status_code=500, detail="Could not update routine item.")

# ==========================================
# EMOTION HELPERS AND MODELS
# ==========================================
def emotion_row_to_dict(row):
    if not row:
        return None

    return {
        "emotion_id": str(row.get("emotion_id")),
        "child_id": str(row.get("child_id")) if row.get("child_id") else None,
        "emotion_type": row.get("emotion_type"),
        "linked_task_id": str(row.get("linked_task_id")) if row.get("linked_task_id") else None,
        "notes": row.get("notes"),
        "logged_at": row["logged_at"].isoformat() if row.get("logged_at") else None,
    }


class CreateEmotionLogRequest(BaseModel):
    child_id: str
    emotion_type: str
    linked_task_id: Optional[str] = None
    notes: Optional[str] = None


# ==========================================
# EMOTION ENDPOINTS
# ==========================================
@app.get("/api/emotions")
async def get_emotion_logs(child_id: Optional[str] = None):
    try:
        conn = get_db_connection()
        cur = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)

        if child_id:
            cur.execute(
                """
                SELECT *
                FROM emotion_logs
                WHERE child_id = %s
                ORDER BY logged_at DESC
                """,
                (child_id,),
            )
        else:
            cur.execute(
                """
                SELECT *
                FROM emotion_logs
                ORDER BY logged_at DESC
                """
            )

        logs = cur.fetchall()
        cur.close()
        conn.close()

        return [emotion_row_to_dict(log) for log in logs]

    except Exception as e:
        print(f"Get emotion logs error: {str(e)}")
        raise HTTPException(status_code=500, detail="Could not load emotion logs.")


@app.post("/api/emotions")
async def create_emotion_log(request: CreateEmotionLogRequest):
    try:
        conn = get_db_connection()
        cur = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)

        emotion_id = str(uuid.uuid4())

        cur.execute(
            """
            INSERT INTO emotion_logs (
                emotion_id,
                child_id,
                emotion_type,
                linked_task_id,
                notes,
                logged_at
            )
            VALUES (%s, %s, %s, %s, %s, NOW())
            RETURNING *
            """,
            (
                emotion_id,
                request.child_id,
                request.emotion_type,
                request.linked_task_id,
                request.notes,
            ),
        )

        log = cur.fetchone()
        conn.commit()

        cur.close()
        conn.close()

        return emotion_row_to_dict(log)

    except Exception as e:
        print(f"Create emotion log error: {str(e)}")
        raise HTTPException(status_code=500, detail="Could not save emotion check-in.")
# ==========================================
# ENDPOINT 1: TASK BREAKDOWN
# ==========================================
@app.post("/api/breakdown-task")
async def breakdown_task(request: TaskRequest):
    if not GROQ_API_KEY:
        raise HTTPException(status_code=500, detail="Groq API key is not configured.")

    # UPDATE: The prompt is now dynamic and knows exactly which pet it is!
    dynamic_system_prompt = f"""
    You are a friendly, calming digital companion for a neurodivergent child.
    Your current persona is a {request.pet_type}. 
    The user is your human friend. Your job is to help them break down big tasks into small, easy steps.

    RULES:
    1. Divide the task into 2 to 5 steps based on how complex it is. A simple task needs 2 steps, a hard task needs 4 or 5.
    2. Use very simple, concrete, and easy-to-understand language.
    3. Do not use metaphors, sarcasm, or complex vocabulary.
    4. Keep your companion_message short, encouraging, and supportive (1 or 2 sentences max).
    5. Output NOTHING but a single, valid JSON object.

    JSON FORMAT EXAMPLE:
    {{
      "companion_message": "Hey friend! This task can be tough, but we can do it together. Here is our mission plan:",
      "steps": [
        {{
          "step_number": 1,
          "step_title": "Short step name",
          "description": "Simple action 1"
        }}
      ]
    }}
    """

    groq_url = "https://api.groq.com/openai/v1/chat/completions"
    headers = {
        "Authorization": f"Bearer {GROQ_API_KEY}",
        "Content-Type": "application/json"
    }

    payload = {
        "model": "llama-3.1-8b-instant",
        "messages": [
            {"role": "system", "content": dynamic_system_prompt},
            {"role": "user", "content": f"Task to break down: {request.task_name}"}
        ],
        "response_format": {"type": "json_object"},
        "temperature": 0.2
    }

    try:
        response = requests.post(groq_url, headers=headers, json=payload)

        if not response.ok:
            print(f"GROQ REJECTED THE REQUEST. Reason: {response.text}")

        response.raise_for_status()
        data = response.json()

        raw_response = data["choices"][0]["message"]["content"]
        
        # Clean up markdown blocks before parsing
        clean_text = raw_response.strip()
        if clean_text.startswith("```json"):
            clean_text = clean_text[7:]
        if clean_text.startswith("```"):
            clean_text = clean_text[3:]
        if clean_text.endswith("```"):
            clean_text = clean_text[:-3]
        clean_text = clean_text.strip()

        structured_data = json.loads(clean_text)
        return structured_data
        
    except Exception as e:
        print(f"General Error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


# ==========================================
# ENDPOINT 2: COMPANION CHAT
# ==========================================
@app.post("/api/chat")
async def companion_chat(request: ChatRequest):
    if not GROQ_API_KEY:
        raise HTTPException(status_code=500, detail="Groq API key is not configured.")

    # 2. NEW: Role-Based Prompting!
    if request.user_role == "parent":
        chat_system_prompt = """
        You are a supportive, knowledgeable, and empathetic 'Parent Guide' expert in neurodiversity (Autism, ADHD, PDA, etc.).
        Your goal is to help parents understand their child's behaviors, prevent sensory overload, and offer gentle, practical parenting strategies.
        
        Rules:
        1. Keep responses concise and actionable (2-4 sentences max).
        2. Maintain a warm, professional, and non-judgmental tone.
        3. Frame behaviors as communication (e.g., 'refusal' is often 'overwhelm').
        4. NEVER give medical diagnoses. 
        5. You have access to recent conversation history. Use it for context.
        """
    else:
        chat_system_prompt = f"""
        You are a friendly, highly supportive digital companion for a neurodivergent child (age 7-13).
        Your current persona is a {request.pet_type}. Act like this character in a subtle, cute way.
        
        Rules:
        1. Keep responses very short (1-3 sentences max).
        2. Use simple, accessible language. Be encouraging and emotionally validating.
        3. You have access to the recent conversation history. Use it to maintain context!
        4. If the child asks about dangerous or complex adult topics, politely deflect.
        5. CRITICAL: You are a text-only AI. You cannot see pictures. Ask them to describe images instead.
        """

    # Build the message array starting with the correct system prompt
    groq_messages = [{"role": "system", "content": chat_system_prompt}]
    
    for msg in request.history:
        if msg.role in ["user", "assistant"]:
            groq_messages.append({"role": msg.role, "content": msg.content})
            
    groq_messages.append({"role": "user", "content": request.message})

    groq_url = "https://api.groq.com/openai/v1/chat/completions"
    headers = {
        "Authorization": f"Bearer {GROQ_API_KEY}",
        "Content-Type": "application/json"
    }

    payload = {
        "model": "llama-3.1-8b-instant",
        "messages": groq_messages,
        "temperature": 0.6 
    }

    try:
        response = requests.post(groq_url, headers=headers, json=payload)
        response.raise_for_status()
        data = response.json()
        
        ai_reply = data["choices"][0]["message"]["content"]
        return {"reply": ai_reply.strip()}

    except Exception as e:
        print(f"Chat Error: {str(e)}")
        return {"reply": "I'm having a little trouble thinking right now. Could you say that again?"}

# ==========================================
# ENDPOINT 3: PREDICT SENSORY OVERLOAD RISK
# ==========================================
@app.post("/api/predict-risk")
async def predict_risk(request: RiskRequest):
    try:
        # The behavior engine handles the real-time calculation
        risk_assessment = calculate_overload_risk(
            hours_slept=request.hours_slept,
            overwhelmed_count=request.overwhelmed_count,
            tasks_abandoned=request.tasks_abandoned,
            tasks_completed=request.tasks_completed
        )
        return risk_assessment
        
    except Exception as e:
        print(f"Prediction Error: {str(e)}")
        raise HTTPException(status_code=500, detail="Could not process behavioral data.")
    
if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)