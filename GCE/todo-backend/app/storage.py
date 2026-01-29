from app.models import Task, Tag, SubTask
from datetime import datetime, timedelta
from typing import Optional


class InMemoryStorage:
    def __init__(self):
        self.tasks: dict[str, Task] = {}
        self.tags: dict[str, Tag] = {}
        self._init_sample_data()

    def _init_sample_data(self):
        """Initialize with some sample data"""
        sample_tags = [
        ]
        for tag in sample_tags:
            self.tags[tag.id] = tag

        now = datetime.utcnow()
        sample_tasks = []
        for task in sample_tasks:
            self.tasks[task.id] = task

    def get_all_tasks(
        self,
        status: str = "all",
        archived: bool = False,
        tags: Optional[list[str]] = None,
        page: int = 1,
        limit: int = 50,
    ) -> tuple[list[Task], int]:
        filtered_tasks = list(self.tasks.values())

        filtered_tasks = [t for t in filtered_tasks if t.archived == archived]

        if status == "active":
            filtered_tasks = [t for t in filtered_tasks if not t.completed]
        elif status == "completed":
            filtered_tasks = [t for t in filtered_tasks if t.completed]

        if tags:
            filtered_tasks = [
                t for t in filtered_tasks if any(tag in t.tags for tag in tags)
            ]

        filtered_tasks.sort(key=lambda t: t.createdAt, reverse=True)

        total = len(filtered_tasks)

        start = (page - 1) * limit
        end = start + limit
        paginated_tasks = filtered_tasks[start:end]

        return paginated_tasks, total

    def get_task(self, task_id: str) -> Optional[Task]:
        return self.tasks.get(task_id)

    def create_task(self, task: Task) -> Task:
        self.tasks[task.id] = task
        return task

    def update_task(self, task_id: str, task: Task) -> Optional[Task]:
        if task_id in self.tasks:
            self.tasks[task_id] = task
            return task
        return None

    def delete_task(self, task_id: str) -> bool:
        if task_id in self.tasks:
            del self.tasks[task_id]
            return True
        return False

    def get_all_tags(self) -> list[Tag]:
        return list(self.tags.values())

    def get_tag(self, tag_id: str) -> Optional[Tag]:
        return self.tags.get(tag_id)

    def create_tag(self, tag: Tag) -> Tag:
        self.tags[tag.id] = tag
        return tag

    def update_tag(self, tag_id: str, tag: Tag) -> Optional[Tag]:
        if tag_id in self.tags:
            self.tags[tag_id] = tag
            return tag
        return None

    def delete_tag(self, tag_id: str) -> bool:
        if tag_id in self.tags:
            del self.tags[tag_id]
            return True
        return False

    def get_statistics(self) -> dict:
        tasks = list(self.tasks.values())
        return {
            "total": len(tasks),
            "completed": len([t for t in tasks if t.completed and not t.archived]),
            "active": len([t for t in tasks if not t.completed and not t.archived]),
            "advanced": len([t for t in tasks if t.type == "advanced"]),
            "archived": len([t for t in tasks if t.archived]),
        }

    def get_contributions(
        self, start_date: Optional[str] = None, end_date: Optional[str] = None, days: int = 365
    ) -> tuple[list[dict], dict]:
        today = datetime.utcnow().date()

        if end_date:
            end = datetime.strptime(end_date, "%Y-%m-%d").date()
        else:
            end = today

        if start_date:
            start = datetime.strptime(start_date, "%Y-%m-%d").date()
        else:
            start = end - timedelta(days=days - 1)

        contributions = {}
        for task in self.tasks.values():
            if task.completedAt:
                date_str = task.completedAt.strftime("%Y-%m-%d")
                task_date = task.completedAt.date()
                if start <= task_date <= end:
                    contributions[date_str] = contributions.get(date_str, 0) + 1

        contribution_list = []
        current = end
        while current >= start:
            date_str = current.strftime("%Y-%m-%d")
            contribution_list.append({
                "date": date_str,
                "count": contributions.get(date_str, 0)
            })
            current -= timedelta(days=1)

        total_contributions = sum(c["count"] for c in contribution_list)
        
        current_streak = 0
        longest_streak = 0
        temp_streak = 0
        
        for contrib in contribution_list:
            if contrib["count"] > 0:
                temp_streak += 1
                longest_streak = max(longest_streak, temp_streak)
            else:
                temp_streak = 0

        for contrib in contribution_list:
            if contrib["count"] > 0:
                current_streak += 1
            else:
                break

        summary = {
            "totalContributions": total_contributions,
            "longestStreak": longest_streak,
            "currentStreak": current_streak,
        }

        return contribution_list, summary


storage = InMemoryStorage()
