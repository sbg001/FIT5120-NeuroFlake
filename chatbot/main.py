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
from psycopg2.pool import SimpleConnectionPool
from behavior_engine import calculate_overload_risk, load_model

# Load the variables from your .env file
load_dotenv() 

app = FastAPI()
DB_POOL = None


class PooledConnectionProxy:
    def __init__(self, connection, pool):
        self._connection = connection
        self._pool = pool
        self._is_returned = False

    def __getattr__(self, name):
        return getattr(self._connection, name)

    def close(self):
        if self._is_returned:
            return
        self._is_returned = True
        self._pool.putconn(self._connection)


def ensure_rewards_parent_column():
    conn = None
    cur = None
    try:
        conn = psycopg2.connect(DATABASE_URL)
        cur = conn.cursor()
        cur.execute(
            """
            ALTER TABLE rewards_catalog
            ADD COLUMN IF NOT EXISTS parent_id UUID
            """
        )
        cur.execute(
            """
            CREATE INDEX IF NOT EXISTS idx_rewards_catalog_parent_id
            ON rewards_catalog (parent_id)
            """
        )
        conn.commit()
    finally:
        if cur:
            cur.close()
        if conn:
            conn.close()

# Initialize the ML model when the FastAPI server starts
@app.on_event("startup")
async def startup_event():
    global DB_POOL
    print("Booting up backend services...")
    load_model()
    if not DATABASE_URL:
        raise RuntimeError("Database URL is not configured.")
    ensure_rewards_parent_column()
    if DB_POOL is None:
        DB_POOL = SimpleConnectionPool(
            minconn=1,
            maxconn=10,
            dsn=DATABASE_URL,
        )


@app.on_event("shutdown")
async def shutdown_event():
    global DB_POOL
    if DB_POOL is not None:
        DB_POOL.closeall()
        DB_POOL = None

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
    tasks_context: str = ""

GROQ_API_KEY = os.getenv("GROQ_API_KEY")
DATABASE_URL = os.getenv("DATABASE_URL")


def get_db_connection():
    if DB_POOL is None:
        raise HTTPException(status_code=500, detail="Database URL is not configured.")
    return PooledConnectionProxy(DB_POOL.getconn(), DB_POOL)


def get_parent_id_for_child(cur, child_id: str):
    cur.execute(
        """
        SELECT parent_id
        FROM users
        WHERE user_id = %s
        LIMIT 1
        """,
        (child_id,),
    )
    row = cur.fetchone()
    return str(row.get("parent_id")) if row and row.get("parent_id") else None


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


class UpdateChildPasswordRequest(BaseModel):
    parentId: str
    childId: str
    password: str

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


@app.put("/api/auth/children/{child_id}/password")
async def update_child_password(child_id: str, request: UpdateChildPasswordRequest):
    parent_id = request.parentId
    request_child_id = request.childId
    password = request.password

    if not parent_id or not request_child_id or not password:
        raise HTTPException(status_code=400, detail="Please complete the child password fields.")

    if str(child_id) != str(request_child_id):
        raise HTTPException(status_code=400, detail="Child account details do not match.")

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
            SELECT *
            FROM users
            WHERE user_id = %s AND role = 'child' AND parent_id = %s
            LIMIT 1
            """,
            (child_id, parent_id),
        )

        child = cur.fetchone()

        if not child:
            cur.close()
            conn.close()
            raise HTTPException(status_code=404, detail="Child account not found for this parent.")

        cur.execute(
            """
            UPDATE users
            SET password = %s
            WHERE user_id = %s
            RETURNING *
            """,
            (password, child_id),
        )

        updated_child = cur.fetchone()
        conn.commit()

        cur.close()
        conn.close()

        return user_row_to_dict(updated_child)

    except HTTPException:
        raise
    except Exception as e:
        print(f"Update child password error: {str(e)}")
        raise HTTPException(status_code=500, detail="Could not update the child password.")

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


@app.get("/api/routines-with-items")
async def get_routines_with_items(child_id: Optional[str] = None):
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

        routine_ids = [routine["routine_id"] for routine in routines if routine.get("routine_id")]
        items_by_routine = {}

        if routine_ids:
            cur.execute(
                """
                SELECT *
                FROM routine_items
                WHERE routine_id = ANY(%s)
                ORDER BY routine_id ASC, item_order ASC
                """,
                (routine_ids,),
            )

            for item in cur.fetchall():
                normalized_item = routine_item_row_to_dict(item)
                routine_key = normalized_item["routine_id"]
                items_by_routine.setdefault(routine_key, []).append(normalized_item)

        cur.close()
        conn.close()

        blocks = []
        for routine in routines:
            normalized_routine = routine_row_to_dict(routine)
            items = items_by_routine.get(normalized_routine["routine_id"], [])
            blocks.append(
                {
                    **normalized_routine,
                    "items": items,
                    "completed_count": len([item for item in items if item.get("is_completed")]),
                    "total_count": len(items),
                }
            )

        return blocks

    except Exception as e:
        print(f"Get routines with items error: {str(e)}")
        raise HTTPException(status_code=500, detail="Could not load routines.")


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
async def save_emotion_selection(request: CreateEmotionLogRequest):
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
                logged_at,
                linked_task_id,
                notes
            )
            VALUES (%s, %s, %s, NOW(), %s, %s)
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

        emotion_log = cur.fetchone()
        conn.commit()

        cur.close()
        conn.close()

        return emotion_row_to_dict(emotion_log)

    except Exception as e:
        print(f"Save emotion error: {str(e)}")
        raise HTTPException(status_code=500, detail="Could not save emotion check-in.")
# ==========================================
# REWARD AND POINTS HELPERS AND MODELS
# ==========================================
def points_row_to_dict(row, child_id):
    if not row:
        return {
            "child_id": child_id,
            "points_balance": 0,
            "updated_at": None,
        }

    return {
        "child_id": str(row.get("child_id")),
        "points_balance": row.get("points_balance") or 0,
        "updated_at": row["updated_at"].isoformat() if row.get("updated_at") else None,
    }


def reward_transaction_row_to_dict(row):
    if not row:
        return None

    return {
        "transaction_id": str(row.get("transaction_id")),
        "child_id": str(row.get("child_id")),
        "task_id": str(row.get("task_id")) if row.get("task_id") else None,
        "points_earned": row.get("points_earned") or 0,
        "steps_completed": row.get("steps_completed") or 0,
        "transaction_type": row.get("transaction_type"),
        "task_title": row.get("task_title") or "Task reward",
        "created_at": row["created_at"].isoformat() if row.get("created_at") else None,
    }


def reward_row_to_dict(row):
    if not row:
        return None

    return {
        "id": str(row.get("reward_id") or row.get("id")),
        "reward_id": str(row.get("reward_id") or row.get("id")),
        "parent_id": str(row.get("parent_id")) if row.get("parent_id") else None,
        "emoji": row.get("emoji") or "🎁",
        "title": row.get("title"),
        "cost": row.get("points_cost"),
        "points_cost": row.get("points_cost"),
        "approved": row.get("approved"),
        "theme": row.get("theme") or "custom",
        "created_at": row["created_at"].isoformat() if row.get("created_at") else None,
    }


class UpdatePointsRequest(BaseModel):
    points_balance: int


class CreateRewardTransactionRequest(BaseModel):
    child_id: str
    task_id: Optional[str] = None
    points_earned: int
    steps_completed: int = 0
    transaction_type: str = "earn"


class ClaimRewardRequest(BaseModel):
    child_id: str
    reward_id: str


class CreateRewardRequest(BaseModel):
    parent_id: str
    title: str
    emoji: str = "🎁"
    cost: int
    approved: bool = True
    theme: str = "custom"


class UpdateRewardRequest(BaseModel):
    parent_id: str
    title: str
    emoji: str = "🎁"
    cost: int
    approved: bool = True
    theme: str = "custom"

# ==========================================
# EPIC 6 SUPPORT HELPERS AND MODELS
# ==========================================
def trigger_row_to_dict(row):
    if not row:
        return None

    return {
        "trigger_id": str(row.get("trigger_id")),
        "child_id": str(row.get("child_id")) if row.get("child_id") else None,
        "trigger_title": row.get("trigger_title"),
        "trigger_type": row.get("trigger_type"),
        "notes": row.get("notes"),
        "logged_at": row["logged_at"].isoformat() if row.get("logged_at") else None,
    }


def communication_prompt_row_to_dict(row):
    if not row:
        return None

    return {
        "prompt_id": str(row.get("prompt_id")),
        "child_id": str(row.get("child_id")) if row.get("child_id") else None,
        "title": row.get("title"),
        "prompt_text": row.get("prompt_text"),
        "category": row.get("category"),
        "created_at": row["created_at"].isoformat() if row.get("created_at") else None,
    }


def support_resource_row_to_dict(row):
    if not row:
        return None

    return {
        "resource_id": str(row.get("resource_id")),
        "title": row.get("title"),
        "category": row.get("category"),
        "description": row.get("description"),
        "url": row.get("url"),
        "created_at": row["created_at"].isoformat() if row.get("created_at") else None,
    }


class CreateTriggerRequest(BaseModel):
    child_id: str
    trigger_title: str
    trigger_type: str
    notes: Optional[str] = None


class CreateRoutineRequest(BaseModel):
    child_id: str
    title: str
    description: Optional[str] = None
    display_order: int = 0


class CreateRoutineItemRequest(BaseModel):
    routine_id: str
    item_order: int = 0
    title: str
    description: Optional[str] = None
    reminder_time: Optional[str] = None


class CreateCommunicationPromptRequest(BaseModel):
    child_id: Optional[str] = None
    title: str
    prompt_text: str
    category: str = "general"


class CreateSupportResourceRequest(BaseModel):
    title: str
    category: str
    description: str
    url: Optional[str] = None

# ==========================================
# PARENT DASHBOARD AGGREGATED ENDPOINTS
# ==========================================
def build_dashboard_suggestions(top_trigger, top_emotion, task_summary):
    suggestions = []

    if top_trigger:
        trigger_type = str(top_trigger.get("trigger_type") or "").lower()

        if "noise" in trigger_type or "sound" in trigger_type:
            suggestions.append({
                "title": "Reduce sensory noise",
                "text": "Try a quieter space or headphones before starting the next task.",
                "source": "trigger pattern",
            })
        elif "transition" in trigger_type:
            suggestions.append({
                "title": "Prepare transitions early",
                "text": "Give a short warning before switching activities.",
                "source": "trigger pattern",
            })
        else:
            suggestions.append({
                "title": "Watch repeated triggers",
                "text": f"The most repeated trigger is {top_trigger.get('trigger_type')}. Try adjusting the routine around it.",
                "source": "trigger pattern",
            })

    if top_emotion:
        emotion_type = str(top_emotion.get("emotion_type") or "").lower()

        if emotion_type == "overwhelmed":
            suggestions.append({
                "title": "Lower the next demand",
                "text": "Break the next task into a smaller step and offer a short pause.",
                "source": "emotion pattern",
            })
        elif emotion_type == "tired":
            suggestions.append({
                "title": "Use a lighter routine",
                "text": "Start with the easiest task and keep instructions short.",
                "source": "emotion pattern",
            })

    completed_count = task_summary.get("completed_count") or 0 if task_summary else 0
    total_count = task_summary.get("total_count") or 0 if task_summary else 0

    if total_count > 0 and completed_count < total_count:
        suggestions.append({
            "title": "Support task completion",
            "text": "Choose one active task and focus only on the first small step.",
            "source": "task progress",
        })

    if not suggestions:
        suggestions.append({
            "title": "Keep routines predictable",
            "text": "Continue using simple steps, calm language, and meaningful rewards.",
            "source": "general guidance",
        })

    return suggestions


@app.get("/api/parent-dashboard/core/{parent_id}")
async def get_parent_dashboard_core(parent_id: str, child_id: Optional[str] = None):
    try:
        conn = get_db_connection()
        cur = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)

        cur.execute(
            """
            SELECT *
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
            raise HTTPException(status_code=404, detail="Parent not found.")

        if child_id:
            cur.execute(
                """
                SELECT *
                FROM users
                WHERE user_id = %s AND parent_id = %s AND role = 'child'
                LIMIT 1
                """,
                (child_id, parent_id),
            )
        else:
            cur.execute(
                """
                SELECT *
                FROM users
                WHERE parent_id = %s AND role = 'child'
                ORDER BY created_at ASC
                LIMIT 1
                """,
                (parent_id,),
            )

        child = cur.fetchone()
        resolved_child_id = str(child.get("user_id")) if child else None

        tasks = []
        points = {
            "child_id": resolved_child_id,
            "points_balance": 0,
            "updated_at": None,
        }

        if resolved_child_id:
            cur.execute(
                """
                SELECT *
                FROM tasks
                WHERE child_id = %s
                ORDER BY created_at DESC
                """,
                (resolved_child_id,),
            )
            tasks = cur.fetchall()

            cur.execute(
                """
                SELECT *
                FROM user_points
                WHERE child_id = %s
                LIMIT 1
                """,
                (resolved_child_id,),
            )
            points_row = cur.fetchone()
            points = points_row_to_dict(points_row, resolved_child_id)

        cur.execute(
            """
            SELECT *
            FROM rewards_catalog
            WHERE parent_id = %s
            ORDER BY points_cost ASC
            """,
            (parent_id,),
        )
        rewards = cur.fetchall()

        if not rewards:
            cur.execute(
                """
                SELECT *
                FROM rewards_catalog
                WHERE parent_id IS NULL
                ORDER BY points_cost ASC
                """
            )
            rewards = cur.fetchall()

        cur.close()
        conn.close()

        return {
            "parent": user_row_to_dict(parent),
            "child": user_row_to_dict(child),
            "tasks": [task_row_to_dict(task) for task in tasks],
            "points": points,
            "rewards": [reward_row_to_dict(reward) for reward in rewards],
        }

    except HTTPException:
        raise
    except Exception as e:
        print(f"Get parent dashboard core error: {str(e)}")
        raise HTTPException(status_code=500, detail="Could not load parent dashboard data.")


@app.get("/api/parent-dashboard/support/{child_id}")
async def get_parent_dashboard_support(child_id: str):
    try:
        conn = get_db_connection()
        cur = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)

        cur.execute(
            """
            SELECT *
            FROM trigger_logs
            WHERE child_id = %s
            ORDER BY logged_at DESC
            """,
            (child_id,),
        )
        triggers = cur.fetchall()

        cur.execute(
            """
            SELECT trigger_type, COUNT(*) AS count
            FROM trigger_logs
            WHERE child_id = %s
            GROUP BY trigger_type
            ORDER BY count DESC
            LIMIT 1
            """,
            (child_id,),
        )
        top_trigger = cur.fetchone()

        cur.execute(
            """
            SELECT emotion_type, COUNT(*) AS count
            FROM emotion_logs
            WHERE child_id = %s
            GROUP BY emotion_type
            ORDER BY count DESC
            LIMIT 1
            """,
            (child_id,),
        )
        top_emotion = cur.fetchone()

        cur.execute(
            """
            SELECT
              COUNT(*) FILTER (WHERE status = 'completed') AS completed_count,
              COUNT(*) AS total_count
            FROM tasks
            WHERE child_id = %s
            """,
            (child_id,),
        )
        task_summary = cur.fetchone()

        suggestions = build_dashboard_suggestions(
            top_trigger,
            top_emotion,
            task_summary,
        )

        cur.execute(
            """
            SELECT *
            FROM routines
            WHERE child_id = %s OR child_id IS NULL
            ORDER BY display_order ASC
            """,
            (child_id,),
        )
        routines = cur.fetchall()

        routine_ids = [routine["routine_id"] for routine in routines if routine.get("routine_id")]
        items_by_routine = {}

        if routine_ids:
            cur.execute(
                """
                SELECT *
                FROM routine_items
                WHERE routine_id = ANY(%s)
                ORDER BY routine_id ASC, item_order ASC
                """,
                (routine_ids,),
            )

            for item in cur.fetchall():
                normalized_item = routine_item_row_to_dict(item)
                routine_key = normalized_item["routine_id"]
                items_by_routine.setdefault(routine_key, []).append(normalized_item)

        routine_blocks = []

        for routine in routines:
            normalized_routine = routine_row_to_dict(routine)
            routine_items = items_by_routine.get(normalized_routine["routine_id"], [])
            completed_count = len([item for item in routine_items if item.get("is_completed")])

            routine_blocks.append({
                **normalized_routine,
                "items": routine_items,
                "completed_count": completed_count,
                "total_count": len(routine_items),
            })

        cur.execute(
            """
            SELECT *
            FROM communication_prompts
            WHERE child_id = %s OR child_id IS NULL
            ORDER BY created_at DESC
            """,
            (child_id,),
        )
        prompts = cur.fetchall()

        cur.execute(
            """
            SELECT *
            FROM support_resources
            ORDER BY created_at DESC
            """
        )
        resources = cur.fetchall()

        cur.execute(
            """
            SELECT *
            FROM emotion_logs
            WHERE child_id = %s
            ORDER BY logged_at DESC
            """,
            (child_id,),
        )
        emotion_logs = cur.fetchall()

        cur.close()
        conn.close()

        return {
            "triggers": [trigger_row_to_dict(trigger) for trigger in triggers],
            "suggestions": suggestions,
            "routineBlocks": routine_blocks,
            "communicationPrompts": [
                communication_prompt_row_to_dict(prompt) for prompt in prompts
            ],
            "supportResources": [
                support_resource_row_to_dict(resource) for resource in resources
            ],
            "emotionLogs": [
                emotion_row_to_dict(log) for log in emotion_logs
            ],
        }

    except Exception as e:
        print(f"Get parent dashboard support error: {str(e)}")
        raise HTTPException(status_code=500, detail="Could not load parent support dashboard data.")

# ==========================================
# TRIGGER TRACKING ENDPOINTS
# ==========================================
@app.get("/api/triggers")
async def get_triggers(child_id: Optional[str] = None):
    try:
        conn = get_db_connection()
        cur = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)

        if child_id:
            cur.execute(
                """
                SELECT *
                FROM trigger_logs
                WHERE child_id = %s
                ORDER BY logged_at DESC
                """,
                (child_id,),
            )
        else:
            cur.execute(
                """
                SELECT *
                FROM trigger_logs
                ORDER BY logged_at DESC
                """
            )

        triggers = cur.fetchall()
        cur.close()
        conn.close()

        return [trigger_row_to_dict(trigger) for trigger in triggers]

    except Exception as e:
        print(f"Get triggers error: {str(e)}")
        raise HTTPException(status_code=500, detail="Could not load triggers.")


@app.post("/api/triggers")
async def create_trigger(request: CreateTriggerRequest):
    try:
        conn = get_db_connection()
        cur = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)

        trigger_id = str(uuid.uuid4())

        cur.execute(
            """
            INSERT INTO trigger_logs (
                trigger_id,
                child_id,
                trigger_title,
                trigger_type,
                notes,
                logged_at
            )
            VALUES (%s, %s, %s, %s, %s, NOW())
            RETURNING *
            """,
            (
                trigger_id,
                request.child_id,
                request.trigger_title,
                request.trigger_type,
                request.notes,
            ),
        )

        trigger = cur.fetchone()
        conn.commit()

        cur.close()
        conn.close()

        return trigger_row_to_dict(trigger)

    except Exception as e:
        print(f"Create trigger error: {str(e)}")
        raise HTTPException(status_code=500, detail="Could not save trigger.")


@app.get("/api/suggestions/{child_id}")
async def get_personalised_suggestions(child_id: str):
    try:
        conn = get_db_connection()
        cur = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)

        cur.execute(
            """
            SELECT trigger_type, COUNT(*) AS count
            FROM trigger_logs
            WHERE child_id = %s
            GROUP BY trigger_type
            ORDER BY count DESC
            LIMIT 1
            """,
            (child_id,),
        )
        top_trigger = cur.fetchone()

        cur.execute(
            """
            SELECT emotion_type, COUNT(*) AS count
            FROM emotion_logs
            WHERE child_id = %s
            GROUP BY emotion_type
            ORDER BY count DESC
            LIMIT 1
            """,
            (child_id,),
        )
        top_emotion = cur.fetchone()

        cur.execute(
            """
            SELECT
              COUNT(*) FILTER (WHERE status = 'completed') AS completed_count,
              COUNT(*) AS total_count
            FROM tasks
            WHERE child_id = %s
            """,
            (child_id,),
        )
        task_summary = cur.fetchone()

        cur.close()
        conn.close()

        suggestions = []

        if top_trigger:
            trigger_type = str(top_trigger.get("trigger_type") or "").lower()
            if "noise" in trigger_type or "sound" in trigger_type:
                suggestions.append({
                    "title": "Reduce sensory noise",
                    "text": "Try a quieter space or headphones before starting the next task.",
                    "source": "trigger pattern",
                })
            elif "transition" in trigger_type:
                suggestions.append({
                    "title": "Prepare transitions early",
                    "text": "Give a short warning before switching activities.",
                    "source": "trigger pattern",
                })
            else:
                suggestions.append({
                    "title": "Watch repeated triggers",
                    "text": f"The most repeated trigger is {top_trigger.get('trigger_type')}. Try adjusting the routine around it.",
                    "source": "trigger pattern",
                })

        if top_emotion:
            emotion_type = str(top_emotion.get("emotion_type") or "").lower()
            if emotion_type == "overwhelmed":
                suggestions.append({
                    "title": "Lower the next demand",
                    "text": "Break the next task into a smaller step and offer a short pause.",
                    "source": "emotion pattern",
                })
            elif emotion_type == "tired":
                suggestions.append({
                    "title": "Use a lighter routine",
                    "text": "Start with the easiest task and keep instructions short.",
                    "source": "emotion pattern",
                })

        completed_count = task_summary.get("completed_count") or 0 if task_summary else 0
        total_count = task_summary.get("total_count") or 0 if task_summary else 0

        if total_count > 0 and completed_count < total_count:
            suggestions.append({
                "title": "Support task completion",
                "text": "Choose one active task and focus only on the first small step.",
                "source": "task progress",
            })

        if not suggestions:
            suggestions.append({
                "title": "Keep routines predictable",
                "text": "Continue using simple steps, calm language, and meaningful rewards.",
                "source": "general guidance",
            })

        return suggestions

    except Exception as e:
        print(f"Get suggestions error: {str(e)}")
        raise HTTPException(status_code=500, detail="Could not generate suggestions.")


# ==========================================
# ROUTINE CREATION ENDPOINTS
# ==========================================
@app.post("/api/routines")
async def create_routine(request: CreateRoutineRequest):
    try:
        conn = get_db_connection()
        cur = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)

        routine_id = str(uuid.uuid4())

        cur.execute(
            """
            INSERT INTO routines (
                routine_id,
                child_id,
                title,
                description,
                display_order,
                created_at
            )
            VALUES (%s, %s, %s, %s, %s, NOW())
            RETURNING *
            """,
            (
                routine_id,
                request.child_id,
                request.title,
                request.description,
                request.display_order,
            ),
        )

        routine = cur.fetchone()
        conn.commit()

        cur.close()
        conn.close()

        return routine_row_to_dict(routine)

    except Exception as e:
        print(f"Create routine error: {str(e)}")
        raise HTTPException(status_code=500, detail="Could not create routine.")


@app.post("/api/routine-items")
async def create_routine_item(request: CreateRoutineItemRequest):
    try:
        conn = get_db_connection()
        cur = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)

        item_id = str(uuid.uuid4())

        cur.execute(
            """
            INSERT INTO routine_items (
                item_id,
                routine_id,
                item_order,
                title,
                description,
                reminder_time,
                is_completed,
                completed_at,
                created_at
            )
            VALUES (%s, %s, %s, %s, %s, %s, false, NULL, NOW())
            RETURNING *
            """,
            (
                item_id,
                request.routine_id,
                request.item_order,
                request.title,
                request.description,
                request.reminder_time,
            ),
        )

        item = cur.fetchone()
        conn.commit()

        cur.close()
        conn.close()

        return routine_item_row_to_dict(item)

    except Exception as e:
        print(f"Create routine item error: {str(e)}")
        raise HTTPException(status_code=500, detail="Could not create routine item.")


# ==========================================
# COMMUNICATION PROMPTS ENDPOINTS
# ==========================================
@app.get("/api/communication-prompts")
async def get_communication_prompts(child_id: Optional[str] = None):
    try:
        conn = get_db_connection()
        cur = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)

        if child_id:
            cur.execute(
                """
                SELECT *
                FROM communication_prompts
                WHERE child_id = %s OR child_id IS NULL
                ORDER BY created_at DESC
                """,
                (child_id,),
            )
        else:
            cur.execute(
                """
                SELECT *
                FROM communication_prompts
                ORDER BY created_at DESC
                """
            )

        prompts = cur.fetchall()
        cur.close()
        conn.close()

        return [communication_prompt_row_to_dict(prompt) for prompt in prompts]

    except Exception as e:
        print(f"Get communication prompts error: {str(e)}")
        raise HTTPException(status_code=500, detail="Could not load communication prompts.")


@app.post("/api/communication-prompts")
async def create_communication_prompt(request: CreateCommunicationPromptRequest):
    try:
        conn = get_db_connection()
        cur = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)

        prompt_id = str(uuid.uuid4())

        cur.execute(
            """
            INSERT INTO communication_prompts (
                prompt_id,
                child_id,
                title,
                prompt_text,
                category,
                created_at
            )
            VALUES (%s, %s, %s, %s, %s, NOW())
            RETURNING *
            """,
            (
                prompt_id,
                request.child_id,
                request.title,
                request.prompt_text,
                request.category,
            ),
        )

        prompt = cur.fetchone()
        conn.commit()

        cur.close()
        conn.close()

        return communication_prompt_row_to_dict(prompt)

    except Exception as e:
        print(f"Create communication prompt error: {str(e)}")
        raise HTTPException(status_code=500, detail="Could not create communication prompt.")


# ==========================================
# SUPPORT RESOURCES ENDPOINTS
# ==========================================
@app.get("/api/support-resources")
async def get_support_resources():
    try:
        conn = get_db_connection()
        cur = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)

        cur.execute(
            """
            SELECT *
            FROM support_resources
            ORDER BY created_at DESC
            """
        )

        resources = cur.fetchall()
        cur.close()
        conn.close()

        return [support_resource_row_to_dict(resource) for resource in resources]

    except Exception as e:
        print(f"Get support resources error: {str(e)}")
        raise HTTPException(status_code=500, detail="Could not load support resources.")


@app.post("/api/support-resources")
async def create_support_resource(request: CreateSupportResourceRequest):
    try:
        conn = get_db_connection()
        cur = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)

        resource_id = str(uuid.uuid4())

        cur.execute(
            """
            INSERT INTO support_resources (
                resource_id,
                title,
                category,
                description,
                url,
                created_at
            )
            VALUES (%s, %s, %s, %s, %s, NOW())
            RETURNING *
            """,
            (
                resource_id,
                request.title,
                request.category,
                request.description,
                request.url,
            ),
        )

        resource = cur.fetchone()
        conn.commit()

        cur.close()
        conn.close()

        return support_resource_row_to_dict(resource)

    except Exception as e:
        print(f"Create support resource error: {str(e)}")
        raise HTTPException(status_code=500, detail="Could not create support resource.")
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
        1. Keep responses concise and actionable (1-3 sentences).
        2. Maintain a warm, professional, and non-judgmental tone.
        3. Frame behaviors as communication (e.g., 'refusal' is often 'overwhelm').
        4. NEVER give medical diagnoses. 
        5. You have access to recent conversation history. Use it for context.
        6. Keep the total response under 70 words.
        """
    else:
        chat_system_prompt = f"""
        You are a friendly, highly supportive digital companion for a neurodivergent child (age 7-13).
        Your current persona is a {request.pet_type}. Act like this character in a subtle, cute way.
        
        Rules:
        1. Keep responses very short around 50 words max.
        2. Use simple, accessible language. Be encouraging and emotionally validating.
        3. You have access to the recent conversation history. Use it to maintain context!
        4. If the child asks about dangerous or complex adult topics, politely deflect.
        5. CRITICAL: You are a text-only AI. You cannot see pictures. Ask them to describe images instead.
        
        CHILD's CURRENT TASKS:
        {request.tasks_context if request.tasks_context else "No tasks currently assigned."}
        
        If the child asks what they need to do, gently remind them of their unfinished tasks. If they finished all tasks, celebrate with them!
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

# ==========================================
# REWARD AND POINTS ENDPOINTS
# ==========================================
@app.get("/api/points/{child_id}")
async def get_points(child_id: str):
    try:
        conn = get_db_connection()
        cur = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)

        cur.execute(
            """
            SELECT *
            FROM user_points
            WHERE child_id = %s
            LIMIT 1
            """,
            (child_id,),
        )

        points = cur.fetchone()

        cur.close()
        conn.close()

        return points_row_to_dict(points, child_id)

    except Exception as e:
        print(f"Get points error: {str(e)}")
        raise HTTPException(status_code=500, detail="Could not load points balance.")


@app.patch("/api/points/{child_id}")
async def update_points(child_id: str, request: UpdatePointsRequest):
    try:
        conn = get_db_connection()
        cur = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)

        cur.execute(
            """
            SELECT *
            FROM user_points
            WHERE child_id = %s
            LIMIT 1
            """,
            (child_id,),
        )

        existing_points = cur.fetchone()

        if existing_points:
            cur.execute(
                """
                UPDATE user_points
                SET
                    points_balance = %s,
                    updated_at = NOW()
                WHERE child_id = %s
                RETURNING *
                """,
                (request.points_balance, child_id),
            )
        else:
            cur.execute(
                """
                INSERT INTO user_points (
                    child_id,
                    points_balance,
                    updated_at
                )
                VALUES (%s, %s, NOW())
                RETURNING *
                """,
                (child_id, request.points_balance),
            )

        points = cur.fetchone()
        conn.commit()

        cur.close()
        conn.close()

        return points_row_to_dict(points, child_id)

    except Exception as e:
        print(f"Update points error: {str(e)}")
        raise HTTPException(status_code=500, detail="Could not update points balance.")


@app.get("/api/reward-transactions/{child_id}")
async def get_reward_transactions(child_id: str):
    try:
        conn = get_db_connection()
        cur = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)

        cur.execute(
            """
            SELECT
                rt.transaction_id,
                rt.child_id,
                rt.task_id,
                rt.points_earned,
                rt.steps_completed,
                rt.transaction_type,
                rt.created_at,
                t.title AS task_title
            FROM reward_transactions rt
            LEFT JOIN tasks t
                ON rt.task_id = t.task_id
            WHERE rt.child_id = %s
            ORDER BY rt.created_at DESC
            """,
            (child_id,),
        )

        transactions = cur.fetchall()

        cur.close()
        conn.close()

        return [dict(transaction) for transaction in transactions]

    except Exception as e:
        print(f"Get reward transactions error: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail="Could not load reward transactions."
        )
    try:
        conn = get_db_connection()
        cur = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)

        if request.transaction_type == "earn" and request.task_id:
            cur.execute(
                """
                SELECT
                    rt.*,
                    COALESCE(t.title, 'Task reward') AS task_title
                FROM reward_transactions rt
                LEFT JOIN tasks t ON t.task_id = rt.task_id
                WHERE rt.child_id = %s
                  AND rt.task_id = %s
                  AND rt.transaction_type = 'earn'
                LIMIT 1
                """,
                (request.child_id, request.task_id),
            )

            existing_transaction = cur.fetchone()

            if existing_transaction:
                cur.close()
                conn.close()
                return reward_transaction_row_to_dict(existing_transaction)

        transaction_id = str(uuid.uuid4())

        cur.execute(
            """
            INSERT INTO reward_transactions (
                transaction_id,
                child_id,
                task_id,
                points_earned,
                steps_completed,
                transaction_type,
                created_at
            )
            VALUES (%s, %s, %s, %s, %s, %s, NOW())
            RETURNING *
            """,
            (
                transaction_id,
                request.child_id,
                request.task_id,
                request.points_earned,
                request.steps_completed,
                request.transaction_type,
            ),
        )

        transaction = cur.fetchone()
        conn.commit()

        cur.close()
        conn.close()

        return reward_transaction_row_to_dict(transaction)

    except Exception as e:
        print(f"Create reward transaction error: {str(e)}")
        raise HTTPException(status_code=500, detail="Could not create reward transaction.")

@app.post("/api/reward-transactions")
async def create_reward_transaction(request: CreateRewardTransactionRequest):
    try:
        conn = get_db_connection()
        cur = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)

        transaction_id = str(uuid.uuid4())

        cur.execute(
            """
            INSERT INTO reward_transactions (
                transaction_id,
                child_id,
                task_id,
                points_earned,
                steps_completed,
                transaction_type,
                created_at
            )
            VALUES (%s, %s, %s, %s, %s, %s, NOW())
            RETURNING *
            """,
            (
                transaction_id,
                request.child_id,
                request.task_id,
                request.points_earned,
                request.steps_completed,
                request.transaction_type,
            ),
        )

        transaction = cur.fetchone()
        conn.commit()

        cur.close()
        conn.close()

        return reward_transaction_row_to_dict(transaction)

    except Exception as e:
        print(f"Create reward transaction error: {str(e)}")
        raise HTTPException(status_code=500, detail="Could not create reward transaction.")


@app.post("/api/rewards/claim")
async def claim_reward(request: ClaimRewardRequest):
    if not request.child_id or not request.reward_id:
        raise HTTPException(status_code=400, detail="A child and reward are required.")

    try:
        conn = get_db_connection()
        cur = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
        parent_id = get_parent_id_for_child(cur, request.child_id)

        if not parent_id:
            cur.close()
            conn.close()
            raise HTTPException(status_code=404, detail="The child's reward profile was not found.")

        cur.execute(
            """
            SELECT *
            FROM rewards_catalog
            WHERE reward_id = %s AND (parent_id = %s OR parent_id IS NULL)
            LIMIT 1
            """,
            (request.reward_id, parent_id),
        )
        reward = cur.fetchone()

        if not reward:
            cur.close()
            conn.close()
            raise HTTPException(status_code=404, detail="Reward not found.")

        if not reward.get("approved"):
            cur.close()
            conn.close()
            raise HTTPException(status_code=400, detail="This reward is not available right now.")

        reward_cost = int(reward.get("points_cost") or 0)
        if reward_cost <= 0:
            cur.close()
            conn.close()
            raise HTTPException(status_code=400, detail="This reward cannot be claimed yet.")

        cur.execute(
            """
            SELECT *
            FROM user_points
            WHERE child_id = %s
            LIMIT 1
            FOR UPDATE
            """,
            (request.child_id,),
        )
        points_row = cur.fetchone()
        current_balance = int(points_row.get("points_balance") or 0) if points_row else 0

        if current_balance < reward_cost:
            cur.close()
            conn.close()
            raise HTTPException(status_code=400, detail="Not enough points to claim this reward.")

        updated_balance = current_balance - reward_cost

        if points_row:
            cur.execute(
                """
                UPDATE user_points
                SET
                    points_balance = %s,
                    updated_at = NOW()
                WHERE child_id = %s
                RETURNING *
                """,
                (updated_balance, request.child_id),
            )
        else:
            cur.execute(
                """
                INSERT INTO user_points (
                    child_id,
                    points_balance,
                    updated_at
                )
                VALUES (%s, %s, NOW())
                RETURNING *
                """,
                (request.child_id, updated_balance),
            )

        updated_points = cur.fetchone()

        cur.execute(
            """
            UPDATE rewards_catalog
            SET approved = false
            WHERE reward_id = %s
            RETURNING *
            """,
            (request.reward_id,),
        )
        claimed_reward = cur.fetchone()

        transaction_id = str(uuid.uuid4())
        cur.execute(
            """
            INSERT INTO reward_transactions (
                transaction_id,
                child_id,
                task_id,
                points_earned,
                steps_completed,
                transaction_type,
                created_at
            )
            VALUES (%s, %s, %s, %s, %s, %s, NOW())
            RETURNING *
            """,
            (
                transaction_id,
                request.child_id,
                None,
                -reward_cost,
                0,
                "redeem",
            ),
        )
        transaction = cur.fetchone()

        conn.commit()

        cur.close()
        conn.close()

        return {
            "reward": reward_row_to_dict(claimed_reward or reward),
            "points": points_row_to_dict(updated_points, request.child_id),
            "transaction": {
                **reward_transaction_row_to_dict(transaction),
                "reward_title": reward.get("title"),
            },
            "message": f"You claimed {reward.get('title')}.",
        }

    except HTTPException:
        raise
    except Exception as e:
        print(f"Claim reward error: {str(e)}")
        raise HTTPException(status_code=500, detail="Could not claim the reward.")


@app.get("/api/rewards")
async def get_rewards(
    approved: Optional[bool] = None,
    parent_id: Optional[str] = None,
    child_id: Optional[str] = None,
):
    try:
        conn = get_db_connection()
        cur = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
        resolved_parent_id = parent_id

        if child_id and not resolved_parent_id:
            resolved_parent_id = get_parent_id_for_child(cur, child_id)

        if resolved_parent_id and approved is None:
            cur.execute(
                """
                SELECT *
                FROM rewards_catalog
                WHERE parent_id = %s
                ORDER BY points_cost ASC
                """,
                (resolved_parent_id,),
            )
            rewards = cur.fetchall()
            if not rewards:
                cur.execute(
                    """
                    SELECT *
                    FROM rewards_catalog
                    WHERE parent_id IS NULL
                    ORDER BY points_cost ASC
                    """
                )
                rewards = cur.fetchall()
        elif resolved_parent_id:
            cur.execute(
                """
                SELECT *
                FROM rewards_catalog
                WHERE approved = %s AND parent_id = %s
                ORDER BY points_cost ASC
                """,
                (approved, resolved_parent_id),
            )
            rewards = cur.fetchall()
            if not rewards:
                cur.execute(
                    """
                    SELECT *
                    FROM rewards_catalog
                    WHERE approved = %s AND parent_id IS NULL
                    ORDER BY points_cost ASC
                    """,
                    (approved,),
                )
                rewards = cur.fetchall()
        elif approved is None:
            cur.execute(
                """
                SELECT *
                FROM rewards_catalog
                ORDER BY points_cost ASC
                """
            )
            rewards = cur.fetchall()
        else:
            cur.execute(
                """
                SELECT *
                FROM rewards_catalog
                WHERE approved = %s
                ORDER BY points_cost ASC
                """,
                (approved,),
            )
            rewards = cur.fetchall()

        cur.close()
        conn.close()

        return [reward_row_to_dict(reward) for reward in rewards]

    except Exception as e:
        print(f"Get rewards error: {str(e)}")
        raise HTTPException(status_code=500, detail="Could not load rewards.")


@app.post("/api/rewards")
async def create_reward(request: CreateRewardRequest):
    try:
        conn = get_db_connection()
        cur = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)

        reward_id = str(uuid.uuid4())

        cur.execute(
            """
            INSERT INTO rewards_catalog (
                reward_id,
                parent_id,
                title,
                emoji,
                points_cost,
                approved,
                theme,
                created_at
            )
            VALUES (%s, %s, %s, %s, %s, %s, %s, NOW())
            RETURNING *
            """,
            (
                reward_id,
                request.parent_id,
                request.title,
                request.emoji,
                request.cost,
                request.approved,
                request.theme,
            ),
        )

        reward = cur.fetchone()
        conn.commit()

        cur.close()
        conn.close()

        return reward_row_to_dict(reward)

    except Exception as e:
        print(f"Create reward error: {str(e)}")
        raise HTTPException(status_code=500, detail="Could not create reward.")


@app.patch("/api/rewards/{reward_id}")
async def update_reward(reward_id: str, request: UpdateRewardRequest):
    try:
        conn = get_db_connection()
        cur = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)

        cur.execute(
            """
            UPDATE rewards_catalog
            SET
                parent_id = %s,
                title = %s,
                emoji = %s,
                points_cost = %s,
                approved = %s,
                theme = %s
            WHERE reward_id = %s AND (parent_id = %s OR parent_id IS NULL)
            RETURNING *
            """,
            (
                request.parent_id,
                request.title,
                request.emoji,
                request.cost,
                request.approved,
                request.theme,
                reward_id,
                request.parent_id,
            ),
        )

        reward = cur.fetchone()
        conn.commit()

        cur.close()
        conn.close()

        if not reward:
            raise HTTPException(status_code=404, detail="Reward not found.")

        return reward_row_to_dict(reward)

    except HTTPException:
        raise
    except Exception as e:
        print(f"Update reward error: {str(e)}")
        raise HTTPException(status_code=500, detail="Could not update reward.")


@app.delete("/api/rewards/{reward_id}")
async def delete_reward(reward_id: str, parent_id: str):
    try:
        conn = get_db_connection()
        cur = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)

        cur.execute(
            """
            DELETE FROM rewards_catalog
            WHERE reward_id = %s AND (parent_id = %s OR parent_id IS NULL)
            """,
            (reward_id, parent_id),
        )

        conn.commit()

        cur.close()
        conn.close()

        return {"id": reward_id}

    except Exception as e:
        print(f"Delete reward error: {str(e)}")
        raise HTTPException(status_code=500, detail="Could not delete reward.")
