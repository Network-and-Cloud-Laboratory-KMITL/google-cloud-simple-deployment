from fastapi import APIRouter, HTTPException
from datetime import datetime

from app.models import Tag, TagCreate, TagUpdate, TagResponse, TagListResponse
from app.storage import storage

router = APIRouter(prefix="/tags", tags=["Tags"])


@router.get("", response_model=TagListResponse)
def get_all_tags():
    """Get all tags"""
    tags = storage.get_all_tags()
    return TagListResponse(data=tags)


@router.get("/{tag_id}", response_model=TagResponse)
def get_tag(tag_id: str):
    """Get a single tag by ID"""
    tag = storage.get_tag(tag_id)
    if not tag:
        raise HTTPException(
            status_code=404,
            detail={"code": "NOT_FOUND", "message": f"Tag with id '{tag_id}' not found"},
        )
    return TagResponse(data=tag)


@router.post("", response_model=TagResponse, status_code=201)
def create_tag(tag_data: TagCreate):
    """Create a new tag"""
    # Check for duplicate name
    existing_tags = storage.get_all_tags()
    for existing in existing_tags:
        if existing.name.lower() == tag_data.name.lower():
            raise HTTPException(
                status_code=409,
                detail={
                    "code": "CONFLICT",
                    "message": f"Tag with name '{tag_data.name}' already exists",
                },
            )

    tag = Tag(name=tag_data.name, color=tag_data.color)
    created_tag = storage.create_tag(tag)
    return TagResponse(data=created_tag)


@router.patch("/{tag_id}", response_model=TagResponse)
def update_tag(tag_id: str, tag_data: TagUpdate):
    """Update an existing tag"""
    tag = storage.get_tag(tag_id)
    if not tag:
        raise HTTPException(
            status_code=404,
            detail={"code": "NOT_FOUND", "message": f"Tag with id '{tag_id}' not found"},
        )

    # Check for duplicate name if name is being updated
    if tag_data.name is not None:
        existing_tags = storage.get_all_tags()
        for existing in existing_tags:
            if existing.id != tag_id and existing.name.lower() == tag_data.name.lower():
                raise HTTPException(
                    status_code=409,
                    detail={
                        "code": "CONFLICT",
                        "message": f"Tag with name '{tag_data.name}' already exists",
                    },
                )

    tag_dict = tag.model_dump()

    if tag_data.name is not None:
        tag_dict["name"] = tag_data.name
    if tag_data.color is not None:
        tag_dict["color"] = tag_data.color

    tag_dict["updatedAt"] = datetime.utcnow()

    updated_tag = Tag(**tag_dict)
    storage.update_tag(tag_id, updated_tag)
    return TagResponse(data=updated_tag)


@router.delete("/{tag_id}", status_code=204)
def delete_tag(tag_id: str):
    """Delete a tag"""
    if not storage.delete_tag(tag_id):
        raise HTTPException(
            status_code=404,
            detail={"code": "NOT_FOUND", "message": f"Tag with id '{tag_id}' not found"},
        )
    return None
