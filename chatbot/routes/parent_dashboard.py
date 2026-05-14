from typing import Optional

from fastapi import APIRouter, HTTPException
import psycopg2.extras

from core import get_db_connection
from serializers import build_dashboard_suggestions, communication_prompt_row_to_dict, routine_item_row_to_dict, routine_row_to_dict, support_resource_row_to_dict, trigger_row_to_dict, user_row_to_dict

router = APIRouter()
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

def points_row_to_dict(row, child_id: str):
    if not row:
        return {
            "child_id": child_id,
            "points_balance": 0,
            "updated_at": None,
        }
    return {
        "child_id": str(row.get("child_id", child_id)),
        "points_balance": int(row.get("points_balance", 0)),
        "updated_at": str(row.get("updated_at")) if row.get("updated_at") else None,
    }

@router.get("/api/parent-dashboard/core/{parent_id}")
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


@router.get("/api/parent-dashboard/support/{child_id}")
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
                WHERE routine_id = ANY(%s::uuid[])
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
