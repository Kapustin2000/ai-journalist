import re
import uuid
from typing import List, Dict, Any
from google.adk.agents.llm_agent import ToolContext


def markup_article_blocks(article_content: str, tool_context: ToolContext) -> dict:
    """
    Parse article content and mark each block with a unique ID.
    For markdown, adds HTML comments with block IDs before each block.
    
    Args:
        article_content: The article content in markdown or plain text format.
        tool_context: The ADK tool context.
    
    Returns:
        A dictionary containing:
        - marked_content: Article with block IDs added
        - blocks: List of block metadata with IDs, types, and content
        - total_blocks: Total number of blocks identified
    """
    if not article_content or not article_content.strip():
        return {
            "status": "error",
            "message": "Article content is empty",
            "blocks": [],
            "total_blocks": 0
        }
    
    blocks = []
    marked_lines = []
    current_block_id = None
    current_block_type = None
    current_block_content = []
    current_block_level = None
    block_counter = 0
    
    lines = article_content.split('\n')
    
    def detect_block_type(line: str) -> tuple:
        """Detect block type and level from a line."""
        stripped = line.strip()
        
        # Headings (H1-H6)
        heading_match = re.match(r'^(#+)\s+', stripped)
        if heading_match:
            level = len(heading_match.group(1))
            return (f"heading_h{level}", level)
        
        # Horizontal rule
        if re.match(r'^[-*_]{3,}$', stripped):
            return ("horizontal_rule", None)
        
        # Code blocks (fenced)
        if stripped.startswith('```'):
            return ("code_block", None)
        
        # Blockquotes
        if stripped.startswith('>'):
            return ("blockquote", None)
        
        # Lists (ordered or unordered)
        if re.match(r'^\s*[-*+]\s+', stripped) or re.match(r'^\s*\d+\.\s+', stripped):
            return ("list_item", None)
        
        # Tables
        if re.match(r'^\|.+\|', stripped):
            return ("table_row", None)
        
        # Empty line
        if not stripped:
            return ("empty_line", None)
        
        # Regular paragraph
        return ("paragraph", None)
    
    def should_start_new_block(current_type: str, new_type: str, current_content: list) -> bool:
        """Determine if we should start a new block."""
        # First block
        if current_type is None:
            return True
        
        # Empty line always starts new block (but we'll skip it)
        if new_type == "empty_line":
            return True
        
        # Headings always start new blocks
        if new_type.startswith("heading_"):
            return True
        
        # Different block types
        if current_type != new_type:
            return True
        
        # Same type continues
        return False
    
    for i, line in enumerate(lines):
        block_type, block_level = detect_block_type(line)
        
        # Handle empty lines - they end current block but don't create new content blocks
        if block_type == "empty_line":
            # Save current block if exists
            if current_block_id and current_block_content:
                block_content = '\n'.join(current_block_content).strip()
                if block_content:
                    blocks.append({
                        "id": current_block_id,
                        "type": current_block_type,
                        "level": current_block_level,
                        "content": block_content,
                        "position": block_counter,
                    })
                    block_counter += 1
                    
                    # Add HTML comment before block content
                    marked_lines.append(f"<!-- block_id:{current_block_id} block_type:{current_block_type} -->")
                    marked_lines.extend(current_block_content)
            
            # Reset current block
            current_block_id = None
            current_block_type = None
            current_block_content = []
            current_block_level = None
            
            # Add empty line to output
            marked_lines.append("")
            continue
        
        # Check if we should start a new block
        if should_start_new_block(current_block_type, block_type, current_block_content):
            # Save previous block
            if current_block_id and current_block_content:
                block_content = '\n'.join(current_block_content).strip()
                if block_content:
                    blocks.append({
                        "id": current_block_id,
                        "type": current_block_type,
                        "level": current_block_level,
                        "content": block_content,
                        "position": block_counter,
                    })
                    block_counter += 1
                    
                    # Add HTML comment before block content
                    marked_lines.append(f"<!-- block_id:{current_block_id} block_type:{current_block_type} -->")
                    marked_lines.extend(current_block_content)
            
            # Start new block
            current_block_id = f"block_{uuid.uuid4().hex[:8]}"
            current_block_type = block_type
            current_block_level = block_level
            current_block_content = [line]
        else:
            # Continue current block
            current_block_content.append(line)
    
    # Save last block
    if current_block_id and current_block_content:
        block_content = '\n'.join(current_block_content).strip()
        if block_content:
            blocks.append({
                "id": current_block_id,
                "type": current_block_type,
                "level": current_block_level,
                "content": block_content,
                "position": block_counter,
            })
            block_counter += 1
            
            # Add HTML comment before block content
            marked_lines.append(f"<!-- block_id:{current_block_id} block_type:{current_block_type} -->")
            marked_lines.extend(current_block_content)
    
    marked_content = '\n'.join(marked_lines)
    
    # Store blocks in tool context state
    tool_context.state['article_blocks'] = blocks
    
    return {
        "status": "success",
        "total_blocks": len(blocks),
        "message": f"Successfully marked {len(blocks)} blocks in the article"
    }

