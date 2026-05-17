from typing import Optional

from fastapi import APIRouter, HTTPException
import psycopg2.extras

from core import get_db_connection
from schemas import UpdateRoutineItemRequest
from serializers import routine_item_row_to_dict, routine_row_to_dict

router = APIRouter()
# ==========================================
# ROUTINE ENDPOINTS
# ==========================================
@router.get("/api/routines")
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


@router.get("/api/routines/{routine_id}/items")
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


@router.get("/api/routines-with-items")
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
                WHERE routine_id = ANY(%s::uuid[])
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


@router.patch("/api/routine-items/{item_id}")
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


@router.delete("/api/routines/{routine_id}")
async def delete_routine(routine_id: str):
    try:
        conn = get_db_connection()
        cur = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)

        cur.execute(
            """
            DELETE FROM routine_items
            WHERE routine_id = %s::uuid
            """,
            (routine_id,),
        )

        cur.execute(
            """
            DELETE FROM routines
            WHERE routine_id = %s::uuid
            RETURNING *
            """,
            (routine_id,),
        )

        routine = cur.fetchone()
        conn.commit()

        cur.close()
        conn.close()

        if not routine:
            raise HTTPException(status_code=404, detail="Routine not found.")

        return routine_row_to_dict(routine)

    except HTTPException:
        raise
    except Exception as e:
        print(f"Delete routine error: {str(e)}")
        raise HTTPException(status_code=500, detail="Could not delete routine.")


@router.delete("/api/routine-items/{item_id}")
async def delete_routine_item(item_id: str):
    try:
        conn = get_db_connection()
        cur = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)

        cur.execute(
            """
            DELETE FROM routine_items
            WHERE item_id = %s::uuid
            RETURNING *
            """,
            (item_id,),
        )

        item = cur.fetchone()
        conn.commit()

        cur.close()
        conn.close()

        if not item:
            raise HTTPException(status_code=404, detail="Routine step not found.")

        return routine_item_row_to_dict(item)

    except HTTPException:
        raise
    except Exception as e:
        print(f"Delete routine item error: {str(e)}")
        raise HTTPException(status_code=500, detail="Could not delete routine step.")
