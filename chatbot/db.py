import os
import psycopg2
import psycopg2.extras
from fastapi import HTTPException
from dotenv import load_dotenv

load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL")

def reward_row_to_dict(row):
    if not row:
        return None

    return {
        "id": str(row.get("reward_id") or row.get("id")),
        "reward_id": str(row.get("reward_id") or row.get("id")),
        "emoji": row.get("emoji") or "🎁",
        "title": row.get("title"),
        "cost": row.get("points_cost"),
        "points_cost": row.get("points_cost"),
        "approved": row.get("approved"),
        "theme": row.get("theme") or "custom",
        "created_at": row["created_at"].isoformat() if row.get("created_at") else None,
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


def transaction_row_to_dict(row):
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


class UpdatePointsRequest(BaseModel):
    points_balance: int


class CreateRewardTransactionRequest(BaseModel):
    child_id: str
    task_id: str | None = None
    points_earned: int
    steps_completed: int = 0
    transaction_type: str = "earn"


class CreateRewardRequest(BaseModel):
    title: str
    emoji: str = "🎁"
    cost: int
    approved: bool = True
    theme: str = "custom"


class UpdateRewardRequest(BaseModel):
    title: str
    emoji: str = "🎁"
    cost: int
    approved: bool = True
    theme: str = "custom"

def get_db_connection():
    if not DATABASE_URL:
        raise HTTPException(status_code=500, detail="Database URL is not configured.")
    return psycopg2.connect(DATABASE_URL)


def fetch_one(query, params=None):
    conn = get_db_connection()
    cur = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)

    try:
        cur.execute(query, params or ())
        row = cur.fetchone()
        return row
    finally:
        cur.close()
        conn.close()


def fetch_all(query, params=None):
    conn = get_db_connection()
    cur = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)

    try:
        cur.execute(query, params or ())
        rows = cur.fetchall()
        return rows
    finally:
        cur.close()
        conn.close()


def execute_returning(query, params=None):
    conn = get_db_connection()
    cur = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)

    try:
        cur.execute(query, params or ())
        row = cur.fetchone()
        conn.commit()
        return row
    except Exception:
        conn.rollback()
        raise
    finally:
        cur.close()
        conn.close()


def execute_only(query, params=None):
    conn = get_db_connection()
    cur = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)

    try:
        cur.execute(query, params or ())
        conn.commit()
    except Exception:
        conn.rollback()
        raise
    finally:
        cur.close()
        conn.close()

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
            INSERT INTO user_points (child_id, points_balance, updated_at)
            VALUES (%s, %s, NOW())
            ON CONFLICT (child_id)
            DO UPDATE SET
                points_balance = EXCLUDED.points_balance,
                updated_at = NOW()
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
                rt.*,
                t.title AS task_title
            FROM reward_transactions rt
            LEFT JOIN tasks t ON t.task_id = rt.task_id
            WHERE rt.child_id = %s
            ORDER BY rt.created_at DESC
            """,
            (child_id,),
        )

        transactions = cur.fetchall()

        cur.close()
        conn.close()

        return [transaction_row_to_dict(row) for row in transactions]

    except Exception as e:
        print(f"Get reward transactions error: {str(e)}")
        raise HTTPException(status_code=500, detail="Could not load reward transactions.")


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

        return transaction_row_to_dict(transaction)

    except Exception as e:
        print(f"Create reward transaction error: {str(e)}")
        raise HTTPException(status_code=500, detail="Could not create reward transaction.")


@app.get("/api/rewards")
async def get_rewards(approved: bool | None = None):
    try:
        conn = get_db_connection()
        cur = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)

        if approved is None:
            cur.execute(
                """
                SELECT *
                FROM rewards_catalog
                ORDER BY points_cost ASC
                """
            )
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

        return [reward_row_to_dict(row) for row in rewards]

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
                title,
                emoji,
                points_cost,
                approved,
                theme,
                created_at
            )
            VALUES (%s, %s, %s, %s, %s, %s, NOW())
            RETURNING *
            """,
            (
                reward_id,
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
                title = %s,
                emoji = %s,
                points_cost = %s,
                approved = %s,
                theme = %s
            WHERE reward_id = %s
            RETURNING *
            """,
            (
                request.title,
                request.emoji,
                request.cost,
                request.approved,
                request.theme,
                reward_id,
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
async def delete_reward(reward_id: str):
    try:
        conn = get_db_connection()
        cur = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)

        cur.execute(
            """
            DELETE FROM rewards_catalog
            WHERE reward_id = %s
            """,
            (reward_id,),
        )

        conn.commit()

        cur.close()
        conn.close()

        return {"id": reward_id}

    except Exception as e:
        print(f"Delete reward error: {str(e)}")
        raise HTTPException(status_code=500, detail="Could not delete reward.")