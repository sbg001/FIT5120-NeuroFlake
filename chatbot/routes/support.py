from typing import Optional
import uuid

from fastapi import APIRouter, HTTPException
import psycopg2.extras

from core import get_db_connection
from schemas import CreateCommunicationPromptRequest, CreateRoutineItemRequest, CreateRoutineRequest, CreateSupportResourceRequest, CreateTriggerRequest
from serializers import communication_prompt_row_to_dict, routine_item_row_to_dict, routine_row_to_dict, support_resource_row_to_dict, trigger_row_to_dict

router = APIRouter()
# ==========================================
# TRIGGER TRACKING ENDPOINTS
# ==========================================
@router.get("/api/triggers")
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


@router.post("/api/triggers")
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


@router.get("/api/suggestions/{child_id}")
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
@router.post("/api/routines")
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


@router.post("/api/routine-items")
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
                item_text,
                item_order,
                title,
                description,
                reminder_time,
                is_completed,
                completed_at,
                created_at
            )
            VALUES (%s, %s::uuid, %s, %s, %s, %s, NULLIF(%s, '')::time, false, NULL, NOW())
            RETURNING *
            """,
            (
                item_id,
                request.routine_id,
                request.title,
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
    try:
        conn = get_db_connection()
        cur = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)

        item_id = str(uuid.uuid4())
        item_text = request.title or request.description or "Routine item"

        cur.execute(
            """
            INSERT INTO routine_items (
                item_id,
                routine_id,
                item_text,
                item_order,
                is_completed,
                completed_at,
                title,
                description,
                reminder_time,
                created_at
            )
            VALUES (%s, %s::uuid, %s, %s, false, NULL, %s, %s, NULLIF(%s, '')::time, NOW())
            RETURNING *
            """,
            (
                item_id,
                request.routine_id,
                item_text,
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
@router.get("/api/communication-prompts")
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


@router.post("/api/communication-prompts")
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
@router.get("/api/support-resources")
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


@router.post("/api/support-resources")
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
