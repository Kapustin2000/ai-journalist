from pathlib import Path
from typing import Optional

from pydantic import BaseModel
from google.adk.agents.llm_agent import Agent

from ai_journalist.types.models import (
    Segment,
    SegmentInstruction,
    SegmentNeighbors,
    SegmentConstraints,
    WriterContext,
    WriterOutput,
)


class WriterAgentInput(BaseModel):
    segment: Optional[Segment] = None
    neighbors: SegmentNeighbors = SegmentNeighbors()
    instructions: list[SegmentInstruction]
    constraints: SegmentConstraints = SegmentConstraints()
    context: WriterContext = WriterContext()


def load_writer_instructions() -> str:
    instructions_path = Path(__file__).with_name("instructions.md")
    if instructions_path.exists():
        return instructions_path.read_text(encoding="utf-8")
    return "You are a writer agent producing polished journalistic segments."


writer_agent = Agent(
    model="gemini-2.5-flash",
    name="segment_writer",
    description="Segment Writer crafts or rewrites individual article segments based on instructions and supporting context.",
    instruction=load_writer_instructions(),
    input_schema=WriterAgentInput,
    output_schema=WriterOutput,
)
