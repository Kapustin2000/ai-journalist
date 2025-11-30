from pathlib import Path
from typing import Literal, Optional
from uuid import uuid4
from google.adk.agents.callback_context import CallbackContext
from google.adk.models import LlmResponse
import json


from pydantic import BaseModel, model_validator
from google.adk.agents.llm_agent import Agent
from ai_journalist.types.models import (
    Segment,
    SegmentInstruction,
    SegmentNeighbors,
    SegmentConstraints,
    SegmentActionResult,
    SegmentAction,
    SegmentHandoff
)

class SegmentEditorInput(BaseModel):
    segment: Segment
    neighbors: SegmentNeighbors = SegmentNeighbors()
    instructions: list[SegmentInstruction]
    constraints: SegmentConstraints = SegmentConstraints()

    @model_validator(mode="before")
    @classmethod
    def _ensure_segment_id(cls, values: dict) -> dict:
        segment = values.get("segment")
        if isinstance(segment, dict) and not segment.get("id"):
            # Auto-assign a lightweight identifier so downstream validators accept the payload.
            segment = {**segment, "id": f"segment_{uuid4().hex[:8]}"}
            values["segment"] = segment
        return values


class SegmentEditorOutput(BaseModel):
    segment_id: str
    status: Literal["updated", "skipped", "error"]
    actions: list[SegmentAction] = []
    handoff: SegmentHandoff = SegmentHandoff()


def load_segment_editor_instructions() -> str:
    instructions_path = Path(__file__).with_name("instructions.md")
    if instructions_path.exists():
        return instructions_path.read_text(encoding="utf-8")
    return "You are the Segment Editor responsible for editing individual article blocks."

def enqueue_segment_update(
    callback_context: CallbackContext, llm_response: LlmResponse
) -> Optional[LlmResponse]:
    """
    Parse SegmentEditorOutput from tool/model response and push it into
    state['pending_segment_updates'] for later review on the frontend.
    """
    update = _safe_parse_segment_output(llm_response)  # возвращает dict из JSON или пустой
    if not update:
        return llm_response  # ничего не сохраняем

    try:
        segment_update = SegmentEditorOutput.model_validate(update)
    except Exception:
        # можно залогировать или сложить «как есть», если не хочешь ронять flow
        return llm_response

    queue = callback_context.state.setdefault("pending_segment_updates", [])
    new_entry = segment_update.model_dump()
    new_entry["updated_at"] = callback_context.now.isoformat() if hasattr(callback_context, "now") else None

    updated_existing = False
    for entry in queue:
        if entry.get("segment_id") == new_entry.get("segment_id"):
            entry_actions = entry.setdefault("actions", [])
            entry_actions.extend(new_entry.get("actions", []))
            entry["status"] = new_entry.get("status", entry.get("status"))
            entry["handoff"] = new_entry.get("handoff", entry.get("handoff", {}))
            entry["updated_at"] = new_entry["updated_at"]
            updated_existing = True
            break

    if not updated_existing:
        queue.append(new_entry)

    callback_context.state["pending_segment_updates"] = queue.copy()
    
    # опционально пометь, что появились неприменённые правки
    callback_context.state["has_pending_segment_updates"] = True
    return llm_response


def _safe_parse_segment_output(resp: LlmResponse | str) -> Optional[dict]:
    if isinstance(resp, LlmResponse):
        fr = getattr(resp, "function_response", None)
        if isinstance(fr, dict):
            return fr
        if resp.content and resp.content.parts:
            try:
                return json.loads(resp.content.parts[0].text)
            except json.JSONDecodeError:
                pass
    elif isinstance(resp, str) and resp:
        try:
            return json.loads(resp)
        except json.JSONDecodeError:
            pass
    return None

segment_editor = Agent(
    model="gemini-2.5-flash",
    name="segment_editor",
    description="Segment Editor revises a single article block using neighbors, instructions, and constraints.",
    instruction=load_segment_editor_instructions(),
    input_schema=SegmentEditorInput,
    output_schema=SegmentEditorOutput,
    after_model_callback=enqueue_segment_update,
)
