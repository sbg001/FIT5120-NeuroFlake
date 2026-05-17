import os

import psycopg2
from psycopg2 import extensions
from psycopg2 import InterfaceError, OperationalError
from dotenv import load_dotenv
from fastapi import HTTPException
from psycopg2.pool import SimpleConnectionPool

load_dotenv()

GROQ_API_KEY = os.getenv("GROQ_API_KEY")
DATABASE_URL = os.getenv("DATABASE_URL")
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
        should_discard = (
            self._connection.closed
            or self._connection.get_transaction_status()
            == extensions.TRANSACTION_STATUS_UNKNOWN
        )
        self._pool.putconn(self._connection, close=should_discard)


def ensure_database_columns():
    conn = None
    cur = None
    try:
        conn = psycopg2.connect(DATABASE_URL)
        cur = conn.cursor()
        cur.execute(
            """
            ALTER TABLE users
            ADD COLUMN IF NOT EXISTS gender TEXT
            """
        )
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


def initialize_db_pool():
    global DB_POOL
    if not DATABASE_URL:
        raise RuntimeError("Database URL is not configured.")
    ensure_database_columns()
    if DB_POOL is None:
        DB_POOL = SimpleConnectionPool(
            minconn=1,
            maxconn=10,
            dsn=DATABASE_URL,
        )


def close_db_pool():
    global DB_POOL
    if DB_POOL is not None:
        DB_POOL.closeall()
        DB_POOL = None


def get_db_connection():
    if DB_POOL is None:
        raise HTTPException(status_code=500, detail="Database URL is not configured.")

    for _ in range(2):
        connection = DB_POOL.getconn()

        if connection.closed:
            DB_POOL.putconn(connection, close=True)
            continue

        try:
            with connection.cursor() as cur:
                cur.execute("SELECT 1")
            connection.rollback()
            return PooledConnectionProxy(connection, DB_POOL)
        except (InterfaceError, OperationalError):
            DB_POOL.putconn(connection, close=True)

    raise HTTPException(status_code=500, detail="Database connection is not ready.")


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
