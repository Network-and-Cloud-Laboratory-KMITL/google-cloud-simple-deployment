from pydantic import BaseModel, Field
from typing import Optional, Literal
from datetime import datetime
from uuid import uuid4


def generate_uuid() -> str:
    return str(uuid4())


def get_current_datetime() -> datetime:
    return datetime.utcnow()


class TagBase(BaseModel):
    name: str
    color: str = Field(..., pattern=r"^#[0-9A-Fa-f]{6}$")


class TagCreate(TagBase):
    pass


class TagUpdate(BaseModel):
    name: Optional[str] = None
    color: Optional[str] = Field(None, pattern=r"^#[0-9A-Fa-f]{6}$")


class Tag(TagBase):
    id: str = Field(default_factory=generate_uuid)
    createdAt: datetime = Field(default_factory=get_current_datetime)
    updatedAt: datetime = Field(default_factory=get_current_datetime)


class SubTaskBase(BaseModel):
    title: str


class SubTaskCreate(SubTaskBase):
    pass


class SubTaskUpdate(BaseModel):
    title: Optional[str] = None
    completed: Optional[bool] = None


class SubTask(SubTaskBase):
    id: str = Field(default_factory=generate_uuid)
    completed: bool = False


class TaskCreate(BaseModel):
    title: str
    type: Literal["simple", "advanced"]
    tags: list[str] = []
    subTasks: list[SubTaskCreate] = []


class TaskUpdate(BaseModel):
    title: Optional[str] = None
    completed: Optional[bool] = None
    archived: Optional[bool] = None
    tags: Optional[list[str]] = None


class Task(BaseModel):
    id: str = Field(default_factory=generate_uuid)
    title: str
    type: Literal["simple", "advanced"]
    completed: bool = False
    archived: bool = False
    createdAt: datetime = Field(default_factory=get_current_datetime)
    completedAt: Optional[datetime] = None
    updatedAt: datetime = Field(default_factory=get_current_datetime)
    tags: list[str] = []
    subTasks: list[SubTask] = []


class PaginationInfo(BaseModel):
    page: int
    limit: int
    total: int
    totalPages: int


class TaskListResponse(BaseModel):
    data: list[Task]
    pagination: PaginationInfo


class TaskResponse(BaseModel):
    data: Task


class TagListResponse(BaseModel):
    data: list[Tag]


class TagResponse(BaseModel):
    data: Tag


class TaskStatistics(BaseModel):
    total: int
    completed: int
    active: int
    advanced: int
    archived: int


class StatsResponse(BaseModel):
    data: TaskStatistics


class ContributionDay(BaseModel):
    date: str
    count: int


class ContributionSummary(BaseModel):
    totalContributions: int
    longestStreak: int
    currentStreak: int


class ContributionResponse(BaseModel):
    data: list[ContributionDay]
    summary: ContributionSummary

class ErrorDetail(BaseModel):
    code: str
    message: str
    details: Optional[dict] = None


class ErrorResponse(BaseModel):
    error: ErrorDetail
