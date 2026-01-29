from fastapi import APIRouter, HTTPException, Query
from typing import Optional
from datetime import datetime
from math import ceil

from app.models import (
    Task,
    TaskCreate,
    TaskUpdate,
    TaskResponse,
    TaskListResponse,
    PaginationInfo,
    SubTask,
    SubTaskCreate,
    SubTaskUpdate,
)
from app.storage import storage

router = APIRouter(prefix="/tasks", tags=["Tasks"])


@router.get("", response_model=TaskListResponse)
def get_all_tasks(
    status: str = Query("all", enum=["all", "active", "completed"]),
    archived: bool = Query(False),
    tags: Optional[str] = Query(None, description="Comma-separated tag IDs"),
    page: int = Query(1, ge=1),
    limit: int = Query(50, ge=1, le=100),
):
    """Get all tasks with optional filters and pagination"""
    tag_list = tags.split(",") if tags else None
    tasks, total = storage.get_all_tasks(
        status=status, archived=archived, tags=tag_list, page=page, limit=limit
    )

    return TaskListResponse(
        data=tasks,
        pagination=PaginationInfo(
            page=page,
            limit=limit,
            total=total,
            totalPages=ceil(total / limit) if total > 0 else 1,
        ),
    )


@router.get("/{task_id}", response_model=TaskResponse)
def get_task(task_id: str):
    """Get a single task by ID"""
    task = storage.get_task(task_id)
    if not task:
        raise HTTPException(
            status_code=404,
            detail={"code": "NOT_FOUND", "message": f"Task with id '{task_id}' not found"},
        )
    return TaskResponse(data=task)


@router.post("", response_model=TaskResponse, status_code=201)
def create_task(task_data: TaskCreate):
    """Create a new task"""
    # Validate tags exist
    for tag_id in task_data.tags:
        if not storage.get_tag(tag_id):
            raise HTTPException(
                status_code=400,
                detail={
                    "code": "VALIDATION_ERROR",
                    "message": f"Tag with id '{tag_id}' not found",
                },
            )

    # Create subtasks for advanced tasks
    subtasks = []
    if task_data.type == "advanced":
        for st in task_data.subTasks:
            subtasks.append(SubTask(title=st.title))

    task = Task(
        title=task_data.title,
        type=task_data.type,
        tags=task_data.tags,
        subTasks=subtasks,
    )
    created_task = storage.create_task(task)
    return TaskResponse(data=created_task)


@router.patch("/{task_id}", response_model=TaskResponse)
def update_task(task_id: str, task_data: TaskUpdate):
    """Update an existing task"""
    task = storage.get_task(task_id)
    if not task:
        raise HTTPException(
            status_code=404,
            detail={"code": "NOT_FOUND", "message": f"Task with id '{task_id}' not found"},
        )

    # Validate tags if provided
    if task_data.tags is not None:
        for tag_id in task_data.tags:
            if not storage.get_tag(tag_id):
                raise HTTPException(
                    status_code=400,
                    detail={
                        "code": "VALIDATION_ERROR",
                        "message": f"Tag with id '{tag_id}' not found",
                    },
                )

    # Update fields
    update_dict = task_data.model_dump(exclude_unset=True)
    task_dict = task.model_dump()

    for key, value in update_dict.items():
        task_dict[key] = value

    # Handle completion timestamp
    if task_data.completed is True and not task.completed:
        task_dict["completedAt"] = datetime.utcnow()
    elif task_data.completed is False:
        task_dict["completedAt"] = None

    task_dict["updatedAt"] = datetime.utcnow()

    updated_task = Task(**task_dict)
    storage.update_task(task_id, updated_task)
    return TaskResponse(data=updated_task)


@router.delete("/{task_id}", status_code=204)
def delete_task(task_id: str):
    """Delete a task"""
    if not storage.delete_task(task_id):
        raise HTTPException(
            status_code=404,
            detail={"code": "NOT_FOUND", "message": f"Task with id '{task_id}' not found"},
        )
    return None


@router.patch("/{task_id}/toggle", response_model=TaskResponse)
def toggle_task(task_id: str):
    """Toggle task completion status"""
    task = storage.get_task(task_id)
    if not task:
        raise HTTPException(
            status_code=404,
            detail={"code": "NOT_FOUND", "message": f"Task with id '{task_id}' not found"},
        )

    task_dict = task.model_dump()
    task_dict["completed"] = not task.completed
    task_dict["updatedAt"] = datetime.utcnow()

    if task_dict["completed"]:
        task_dict["completedAt"] = datetime.utcnow()
    else:
        task_dict["completedAt"] = None

    updated_task = Task(**task_dict)
    storage.update_task(task_id, updated_task)
    return TaskResponse(data=updated_task)


@router.patch("/{task_id}/archive", response_model=TaskResponse)
def archive_task(task_id: str):
    """Archive a task"""
    task = storage.get_task(task_id)
    if not task:
        raise HTTPException(
            status_code=404,
            detail={"code": "NOT_FOUND", "message": f"Task with id '{task_id}' not found"},
        )

    task_dict = task.model_dump()
    task_dict["archived"] = True
    task_dict["updatedAt"] = datetime.utcnow()

    updated_task = Task(**task_dict)
    storage.update_task(task_id, updated_task)
    return TaskResponse(data=updated_task)


@router.patch("/{task_id}/restore", response_model=TaskResponse)
def restore_task(task_id: str):
    """Restore a task from archive"""
    task = storage.get_task(task_id)
    if not task:
        raise HTTPException(
            status_code=404,
            detail={"code": "NOT_FOUND", "message": f"Task with id '{task_id}' not found"},
        )

    task_dict = task.model_dump()
    task_dict["archived"] = False
    task_dict["updatedAt"] = datetime.utcnow()

    updated_task = Task(**task_dict)
    storage.update_task(task_id, updated_task)
    return TaskResponse(data=updated_task)


# SubTask endpoints
@router.post("/{task_id}/subtasks", response_model=TaskResponse, status_code=201)
def add_subtask(task_id: str, subtask_data: SubTaskCreate):
    """Add a subtask to an advanced task"""
    task = storage.get_task(task_id)
    if not task:
        raise HTTPException(
            status_code=404,
            detail={"code": "NOT_FOUND", "message": f"Task with id '{task_id}' not found"},
        )

    if task.type != "advanced":
        raise HTTPException(
            status_code=400,
            detail={
                "code": "VALIDATION_ERROR",
                "message": "Cannot add subtasks to a simple task",
            },
        )

    task_dict = task.model_dump()
    new_subtask = SubTask(title=subtask_data.title)
    task_dict["subTasks"].append(new_subtask.model_dump())
    task_dict["updatedAt"] = datetime.utcnow()

    updated_task = Task(**task_dict)
    storage.update_task(task_id, updated_task)
    return TaskResponse(data=updated_task)


@router.patch("/{task_id}/subtasks/{subtask_id}", response_model=TaskResponse)
def update_subtask(task_id: str, subtask_id: str, subtask_data: SubTaskUpdate):
    """Update a subtask"""
    task = storage.get_task(task_id)
    if not task:
        raise HTTPException(
            status_code=404,
            detail={"code": "NOT_FOUND", "message": f"Task with id '{task_id}' not found"},
        )

    task_dict = task.model_dump()
    subtask_found = False

    for subtask in task_dict["subTasks"]:
        if subtask["id"] == subtask_id:
            if subtask_data.title is not None:
                subtask["title"] = subtask_data.title
            if subtask_data.completed is not None:
                subtask["completed"] = subtask_data.completed
            subtask_found = True
            break

    if not subtask_found:
        raise HTTPException(
            status_code=404,
            detail={
                "code": "NOT_FOUND",
                "message": f"SubTask with id '{subtask_id}' not found",
            },
        )

    task_dict["updatedAt"] = datetime.utcnow()
    
    # Check if all subtasks are completed
    all_completed = all(st["completed"] for st in task_dict["subTasks"])
    if all_completed and task_dict["subTasks"]:
        task_dict["completed"] = True
        if not task.completed:
            task_dict["completedAt"] = datetime.utcnow()
    
    updated_task = Task(**task_dict)
    storage.update_task(task_id, updated_task)
    return TaskResponse(data=updated_task)


@router.patch("/{task_id}/subtasks/{subtask_id}/toggle", response_model=TaskResponse)
def toggle_subtask(task_id: str, subtask_id: str):
    """Toggle subtask completion status"""
    task = storage.get_task(task_id)
    if not task:
        raise HTTPException(
            status_code=404,
            detail={"code": "NOT_FOUND", "message": f"Task with id '{task_id}' not found"},
        )

    task_dict = task.model_dump()
    subtask_found = False

    for subtask in task_dict["subTasks"]:
        if subtask["id"] == subtask_id:
            subtask["completed"] = not subtask["completed"]
            subtask_found = True
            break

    if not subtask_found:
        raise HTTPException(
            status_code=404,
            detail={
                "code": "NOT_FOUND",
                "message": f"SubTask with id '{subtask_id}' not found",
            },
        )

    task_dict["updatedAt"] = datetime.utcnow()
    
    # Check if all subtasks are completed
    all_completed = all(st["completed"] for st in task_dict["subTasks"])
    if all_completed and task_dict["subTasks"]:
        task_dict["completed"] = True
        if not task.completed:
            task_dict["completedAt"] = datetime.utcnow()
    else:
        task_dict["completed"] = False
        task_dict["completedAt"] = None

    updated_task = Task(**task_dict)
    storage.update_task(task_id, updated_task)
    return TaskResponse(data=updated_task)


@router.delete("/{task_id}/subtasks/{subtask_id}", response_model=TaskResponse)
def delete_subtask(task_id: str, subtask_id: str):
    """Delete a subtask"""
    task = storage.get_task(task_id)
    if not task:
        raise HTTPException(
            status_code=404,
            detail={"code": "NOT_FOUND", "message": f"Task with id '{task_id}' not found"},
        )

    task_dict = task.model_dump()
    original_length = len(task_dict["subTasks"])
    task_dict["subTasks"] = [st for st in task_dict["subTasks"] if st["id"] != subtask_id]

    if len(task_dict["subTasks"]) == original_length:
        raise HTTPException(
            status_code=404,
            detail={
                "code": "NOT_FOUND",
                "message": f"SubTask with id '{subtask_id}' not found",
            },
        )

    task_dict["updatedAt"] = datetime.utcnow()

    updated_task = Task(**task_dict)
    storage.update_task(task_id, updated_task)
    return TaskResponse(data=updated_task)
