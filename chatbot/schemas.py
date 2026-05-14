from typing import List, Optional

from pydantic import BaseModel


class RiskRequest(BaseModel):
    hours_slept: float
    overwhelmed_count: int
    tasks_abandoned: int
    tasks_completed: int

class TaskRequest(BaseModel):
    task_name: str
    pet_type: str = "bear" # Default fallback

# 2. ADD: The data model for the new chat widget
class ChatMessage(BaseModel):
    role: str
    content: str

class ChatRequest(BaseModel):
    message: str
    pet_type: str = "bear"
    history: List[ChatMessage] = []
    user_role: str = "child" # NEW: Default to child for safety
    tasks_context: str = ""
    active_task_context: str = ""

class SignInRequest(BaseModel):
    identifier: str
    password: str


class RegisterParentRequest(BaseModel):
    name: str
    email: str
    password: str


class CreateChildRequest(BaseModel):
    parentId: str
    name: str
    username: str
    password: str
    age: int


class UpdateChildPasswordRequest(BaseModel):
    parentId: str
    childId: str
    password: str


class UpdateParentPasswordRequest(BaseModel):
    parentId: str
    password: str

class CreateTaskRequest(BaseModel):
    child_id: str
    created_by: str
    title: str
    description: str
    status: str = "pending"
    total_steps: int = 0
    completed_steps: int = 0
    priority_type: Optional[str] = None
    priority_rank: Optional[int] = None


class UpdateTaskRequest(BaseModel):
    title: str
    description: str
    priority_type: Optional[str] = None
    priority_rank: Optional[int] = None


class CreateTaskStepRequest(BaseModel):
    task_id: str
    step_order: int
    step_title: str
    step_description: Optional[str] = None
    is_completed: bool = False
    completed_at: Optional[str] = None
    visual_hint: Optional[str] = None
    example_text: Optional[str] = None


class UpdateTaskStepRequest(BaseModel):
    step_order: int
    step_title: str
    step_description: Optional[str] = None
    visual_hint: Optional[str] = None
    example_text: Optional[str] = None

class UpdateRoutineItemRequest(BaseModel):
    is_completed: bool


class CreateEmotionLogRequest(BaseModel):
    child_id: str
    emotion_type: str
    linked_task_id: Optional[str] = None
    notes: Optional[str] = None


class UpdatePointsRequest(BaseModel):
    points_balance: int


class CreateRewardTransactionRequest(BaseModel):
    child_id: str
    task_id: Optional[str] = None
    points_earned: int
    steps_completed: int = 0
    transaction_type: str = "earn"


class ClaimRewardRequest(BaseModel):
    child_id: str
    reward_id: str


class CreateRewardRequest(BaseModel):
    parent_id: str
    title: str
    emoji: str = "🎁"
    cost: int
    approved: bool = True
    theme: str = "custom"


class UpdateRewardRequest(BaseModel):
    parent_id: str
    title: str
    emoji: str = "🎁"
    cost: int
    approved: bool = True
    theme: str = "custom"

class CreateTriggerRequest(BaseModel):
    child_id: str
    trigger_title: str
    trigger_type: str
    notes: Optional[str] = None


class CreateRoutineRequest(BaseModel):
    child_id: str
    title: str
    description: Optional[str] = None
    display_order: int = 0


class CreateRoutineItemRequest(BaseModel):
    routine_id: str
    item_order: int = 0
    title: str
    description: Optional[str] = None
    reminder_time: Optional[str] = None


class CreateCommunicationPromptRequest(BaseModel):
    child_id: Optional[str] = None
    title: str
    prompt_text: str
    category: str = "general"


class CreateSupportResourceRequest(BaseModel):
    title: str
    category: str
    description: str
    url: Optional[str] = None
