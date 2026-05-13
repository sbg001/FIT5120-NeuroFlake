from typing import Optional
import uuid

from fastapi import APIRouter, HTTPException
import psycopg2.extras

from core import get_db_connection, get_parent_id_for_child
from schemas import ClaimRewardRequest, CreateRewardRequest, CreateRewardTransactionRequest, UpdatePointsRequest, UpdateRewardRequest
from serializers import points_row_to_dict, reward_row_to_dict, reward_transaction_row_to_dict

router = APIRouter()
# ==========================================
# REWARD AND POINTS ENDPOINTS
# ==========================================
@router.get("/api/points/{child_id}")
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


@router.patch("/api/points/{child_id}")
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


@router.get("/api/reward-transactions/{child_id}")
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

@router.post("/api/reward-transactions")
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


@router.post("/api/rewards/claim")
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


@router.get("/api/rewards")
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


@router.post("/api/rewards")
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


@router.patch("/api/rewards/{reward_id}")
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


@router.delete("/api/rewards/{reward_id}")
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
