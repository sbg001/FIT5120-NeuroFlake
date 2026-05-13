from typing import Optional
import uuid

from fastapi import APIRouter, HTTPException
import psycopg2.extras

from core import get_db_connection
from schemas import CreateEmotionLogRequest
from serializers import emotion_row_to_dict

router = APIRouter()
# ==========================================
# EMOTION ENDPOINTS
# ==========================================
@router.get("/api/emotions")
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


@router.post("/api/emotions")
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
