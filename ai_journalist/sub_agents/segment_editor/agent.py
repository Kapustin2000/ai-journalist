from pathlib import Path
from typing import Literal

from pydantic import BaseModel
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

segment_editor = Agent(
    model="gemini-2.5-flash",
    name="segment_editor",
    description="Segment Editor revises a single article block using neighbors, instructions, and constraints.",
    instruction=load_segment_editor_instructions(),
    input_schema=SegmentEditorInput,
    output_schema=SegmentEditorOutput,
)
