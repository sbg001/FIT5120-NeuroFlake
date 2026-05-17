from typing import Optional
import uuid

from fastapi import APIRouter, HTTPException
import psycopg2.extras

from core import get_db_connection
from schemas import CreateTaskRequest, CreateTaskStepRequest, UpdateTaskRequest, UpdateTaskStepRequest
from serializers import task_row_to_dict, task_step_row_to_dict

router = APIRouter()
# ==========================================

# TASK AND TASK STEP ENDPOINTS

# ==========================================

@router.get("/api/tasks")

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

@router.get("/api/tasks/{task_id}")

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

@router.get("/api/tasks/{task_id}/steps")

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

@router.get("/api/today-task")

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

@router.post("/api/tasks")

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

@router.post("/api/task-steps")

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

@router.patch("/api/tasks/{task_id}")

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

@router.patch("/api/task-steps/{step_id}")

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

@router.delete("/api/tasks/{task_id}")

async def delete_task(task_id: str):

    conn = None
    cur = None

    try:

        conn = get_db_connection()

        cur = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)

        cur.execute(
            """
            UPDATE emotion_logs
            SET linked_task_id = NULL
            WHERE linked_task_id = %s
            """,
            (task_id,),
        )

        cur.execute(
            """
            UPDATE reward_transactions
            SET task_id = NULL
            WHERE task_id = %s
            """,
            (task_id,),
        )

        cur.execute("DELETE FROM task_steps WHERE task_id = %s", (task_id,))

        cur.execute(
            "DELETE FROM tasks WHERE task_id = %s RETURNING task_id",
            (task_id,),
        )

        deleted_task = cur.fetchone()

        if not deleted_task:
            conn.rollback()
            raise HTTPException(status_code=404, detail="Task not found.")

        conn.commit()

        return {"task_id": task_id}

    except HTTPException:
        raise
    except Exception as e:

        if conn:
            conn.rollback()

        print(f"Delete task error: {str(e)}")

        raise HTTPException(status_code=500, detail="Could not delete task.")
    finally:
        if cur:
            cur.close()
        if conn:
            conn.close()

@router.delete("/api/task-steps/{step_id}")

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

@router.patch("/api/tasks/{task_id}/step-count")

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

@router.post("/api/tasks/{task_id}/reset")

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

@router.post("/api/tasks/{task_id}/complete-step/{step_id}")

async def complete_step(task_id: str, step_id: str):

    try:

        conn = get_db_connection()

        cur = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)

        cur.execute(
            """
            WITH updated_step AS (
                UPDATE task_steps
                SET is_completed = true, completed_at = COALESCE(completed_at, NOW())
                WHERE task_id = %s AND step_id = %s
                RETURNING *
            ),
            counts AS (
                SELECT COUNT(*) AS completed_count
                FROM task_steps
                WHERE task_id = %s AND is_completed = true
            ),
            updated_task AS (
                UPDATE tasks
                SET
                    completed_steps = counts.completed_count,
                    status = CASE
                        WHEN counts.completed_count > 0
                             AND counts.completed_count >= COALESCE(tasks.total_steps, 0)
                        THEN 'completed'
                        ELSE 'in_progress'
                    END,
                    updated_at = NOW()
                FROM counts
                WHERE tasks.task_id = %s
                RETURNING tasks.task_id
            )
            SELECT updated_step.*
            FROM updated_step
            CROSS JOIN updated_task
            """,
            (task_id, step_id, task_id, task_id),
        )

        step = cur.fetchone()

        if not step:

            cur.close()

            conn.close()

            raise HTTPException(status_code=404, detail="Task step not found.")

        conn.commit()

        cur.close()

        conn.close()

        return task_step_row_to_dict(step)

    except HTTPException:

        raise

    except Exception as e:

        print(f"Complete step error: {str(e)}")

        raise HTTPException(status_code=500, detail="Could not complete step.")

@router.post("/api/tasks/{task_id}/complete")

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
