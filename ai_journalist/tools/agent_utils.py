from pathlib import Path


def load_instructions() -> str:
    """Load instructions from instructions.md file."""
    # instructions.md is in the root ai_journalist directory
    instructions_path = Path(__file__).parent.parent / "instructions.md"
    if instructions_path.exists():
        return instructions_path.read_text(encoding='utf-8')
    return "You are a helpful assistant for journalistic article writing."

