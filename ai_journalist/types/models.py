from typing import Any, Dict, List, Literal, Optional
from pydantic import BaseModel, Field

class Segment(BaseModel):
    id: str
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
