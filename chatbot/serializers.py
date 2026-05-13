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

