from fastapi import APIRouter, HTTPException
import uuid
import psycopg2.extras

from core import get_db_connection
from schemas import (
    CreateChildRequest,
    RegisterParentRequest,
    SignInRequest,
    UpdateChildPasswordRequest,
    UpdateParentPasswordRequest,
)
from serializers import user_row_to_dict

router = APIRouter()
# ==========================================
# AUTH ENDPOINTS
# ==========================================
@router.post("/api/auth/sign-in")
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


@router.post("/api/auth/register-parent")
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


@router.post("/api/auth/create-child")
async def create_child(request: CreateChildRequest):
    parent_id = request.parentId
    name = request.name.strip()
    username = request.username.strip().lower()
    password = request.password
    age = request.age
    gender = request.gender.strip().lower()

    if not parent_id or not name or not username or not password or age is None or not gender:
        raise HTTPException(status_code=400, detail="Please complete all child account fields.")

    if age < 1 or age > 17:
        raise HTTPException(status_code=400, detail="Child age must be between 1 and 17.")

    if gender not in ("male", "female"):
        raise HTTPException(status_code=400, detail="Please select Male or Female.")

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
                gender,
                parent_id,
                pin_code,
                created_at
            )
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, NOW())
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
                gender,
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


@router.get("/api/auth/children/{parent_id}")
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


@router.put("/api/auth/children/{child_id}/password")
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


@router.put("/api/auth/parents/{parent_id}/password")
async def update_parent_password(parent_id: str, request: UpdateParentPasswordRequest):
    request_parent_id = request.parentId
    password = request.password

    if not request_parent_id or not password:
        raise HTTPException(status_code=400, detail="Please complete the parent password fields.")

    if str(parent_id) != str(request_parent_id):
        raise HTTPException(status_code=400, detail="Parent account details do not match.")

    try:
        conn = get_db_connection()
        cur = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)

        cur.execute(
            """
            UPDATE users
            SET password = %s
            WHERE user_id = %s AND role = 'parent'
            RETURNING *
            """,
            (password, parent_id),
        )

        updated_parent = cur.fetchone()

        if not updated_parent:
            cur.close()
            conn.close()
            raise HTTPException(status_code=404, detail="Parent account not found.")

        conn.commit()

        cur.close()
        conn.close()

        return user_row_to_dict(updated_parent)

    except HTTPException:
        raise
    except Exception as e:
        print(f"Update parent password error: {str(e)}")
        raise HTTPException(status_code=500, detail="Could not update the parent password.")
