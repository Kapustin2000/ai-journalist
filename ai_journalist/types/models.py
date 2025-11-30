from typing import Any, Dict, List, Literal, Optional
from uuid import uuid4

from pydantic import BaseModel, Field, model_validator

class Segment(BaseModel):
    id: str = Field(default_factory=lambda: f"segment_{uuid4().hex[:8]}")
    type: Literal[
        "heading_h1", "heading_h2", "heading_h3",
        "paragraph", "list_item", "blockquote",
        "code_block", "horizontal_rule", "table_row"
    ]
    content: str
    position: Optional[int] = None
    level: Optional[int] = None          # для заголовков/списков
    status: Literal["active", "pending", "archived"] = "active"
    deletion_status: Literal["none", "mark", "remove"] = "none"

class NeighborContext(BaseModel):
    id: Optional[str] = None
    content: Optional[str] = None
    type: Optional[str] = None
    position: Optional[int] = None
    level: Optional[int] = None
    status: Literal["active", "pending", "archived"] = "active"

class SegmentNeighbors(BaseModel):
    previous: Optional[NeighborContext] = None
    next: Optional[NeighborContext] = None

class SegmentConstraints(BaseModel):
    tone: Optional[str] = None                # пример: "formal", "conversational"
    language: Optional[str] = None            # пример: "ru", "en"
    max_tokens: Optional[int] = None
    min_tokens: Optional[int] = None
    keep_quotes: bool = False
    preserve_links: bool = True
    custom: Dict[str, Any] = Field(default_factory=dict)  # любые дополнительные правила


class SegmentInstruction(BaseModel):
    kind: Literal[
        "rewrite",
        "tighten",
        "expand",
        "mark_for_deletion",
        "remove_flag",
        "annotate",
        "fact_check",
    ]
    message: str
    priority: Literal["low", "normal", "high"] = "normal"
    constraints: Optional[Dict[str, Any]] = None
    metadata: Optional[Dict[str, Any]] = None

class SegmentActionResult(BaseModel):
    content: Optional[str] = None
    notes: Optional[str] = None
    deletion_status: Optional[Literal["none", "mark", "remove"]] = None
    reason: Optional[str] = None
    new_segment: Optional[Segment] = None
    insert_after_segment_id: Optional[str] = None
    insert_before_segment_id: Optional[str] = None

    @model_validator(mode="before")
    @classmethod
    def _ensure_new_segment_id(cls, values: dict) -> dict:
        new_segment = values.get("new_segment")
        if isinstance(new_segment, dict) and not new_segment.get("id"):
            new_segment = {**new_segment, "id": f"segment_{uuid4().hex[:8]}"}
            values["new_segment"] = new_segment
        return values

class SegmentAction(BaseModel):
    type: Literal[
        "rewrite_segment",
        "mark_deletion_status",
        "annotate",
        "tighten",
        "expand",
        "fact_check",
        "insert_segment",
    ]
    result: SegmentActionResult

class SegmentHandoff(BaseModel):
    needs_review: bool = False
    comments: List[str] = Field(default_factory=list)


class SegmentEditorOutput(BaseModel):
    segment_id: str
    status: Literal["updated", "skipped", "error"]
    actions: List[SegmentAction] = Field(default_factory=list)
    handoff: SegmentHandoff = SegmentHandoff()


class WriterContext(BaseModel):
    article_summary: Optional[str] = None
    supporting_facts: List[str] = Field(default_factory=list)
    audience: Optional[str] = None
    style_guide: Optional[str] = None


class WriterInput(BaseModel):
    segment: Optional[Segment] = None
    neighbors: SegmentNeighbors = SegmentNeighbors()
    instructions: List[SegmentInstruction]
    constraints: SegmentConstraints = SegmentConstraints()
    context: WriterContext = WriterContext()


class WriterOutput(BaseModel):
    segment_id: Optional[str] = None
    status: Literal["drafted", "updated", "skipped", "error"]
    segment: Segment
    notes: Optional[str] = None
    citations: List[str] = Field(default_factory=list)
