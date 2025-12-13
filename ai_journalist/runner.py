"""
Runner for processing articles with the journalist agent.

This script:
1. Reads an article from a file
2. Creates an ADK Runner and Session
3. Processes the article through the agent (markup blocks, formatting)
4. Saves the result

Based on ADK Runtime documentation: https://google.github.io/adk-docs/runtime/
"""

import argparse
import sys
from pathlib import Path
from google.adk.runners import Runner, InMemorySessionService, types
from google.adk.sessions import Session
from ai_journalist.agent import root_agent


def read_article_file(file_path: str) -> str:
    """Read article content from file."""
    article_path = Path(file_path)
    
    # Convert to absolute path if relative
    if not article_path.is_absolute():
        article_path = Path.cwd() / article_path
    
    if not article_path.exists():
        raise FileNotFoundError(f"Article file not found: {file_path} (resolved to: {article_path})")
    
    try:
        content = article_path.read_text(encoding='utf-8')
        if not content.strip():
            raise ValueError(f"Article file is empty: {file_path}")
        return content
    except UnicodeDecodeError:
        # Try with different encoding
        content = article_path.read_text(encoding='latin-1')
        return content


def process_article(article_content: str, output_path: str = None) -> dict:
    """
    Process article through the journalist agent using ADK Runner.
    
    Args:
        article_content: The article content to process
        output_path: Optional path to save the processed article
    
    Returns:
        Dictionary with processing results
    
    Based on ADK Runtime: Runner orchestrates the event loop and manages
    session state through Services (SessionService, etc.)
    """
    # Create session service for managing session state
    session_service = InMemorySessionService()
    
    # Create ADK Runner (orchestrates the event loop)
    # Requires app_name when using agent parameter
    app_name = 'journalist_app'
    runner = Runner(agent=root_agent, app_name=app_name, session_service=session_service)
    
    # Create a new session for this article processing
    # Session requires id, appName, and userId
    import uuid
    user_id = 'user_1'
    session_id = str(uuid.uuid4())
    
    # Create session through session service (using sync method)
    session = session_service.create_session_sync(
        session_id=session_id,
        app_name=app_name,
        user_id=user_id
    )
    
    # Prepare initial message
    initial_message = f"""Please process this article:

{article_content}

Please:
1. Markup all blocks using the markup_article_blocks tool
2. Analyze the article structure
3. Process formatting as needed

Start by marking up the blocks."""
    
    try:
        # Run the agent using Runner (synchronous convenience method)
        # Internally, Runner.run calls Runner.run_async and manages the event loop
        print("=" * 60)
        print("🤖 Starting article processing with AI agent...")
        print(f"📝 Article length: {len(article_content)} characters")
        print(f"📋 Session ID: {session_id}")
        print(f"👤 User ID: {user_id}")
        print(f"💬 Initial message: {initial_message[:200]}...")
        print("=" * 60)
        
        # Runner.run processes the user message and yields events
        # The Runner handles session state updates through SessionService
        # run() requires user_id, session_id, and new_message (Content type)
        new_message = types.UserContent(parts=[types.Part(text=initial_message)])
        
        print("🔄 Running agent...")
        events = []
        for i, event in enumerate(runner.run(
            user_id=user_id,
            session_id=session_id,
            new_message=new_message
        )):
            events.append(event)
            event_type = type(event).__name__
            print(f"📨 Event #{i+1}: {event_type}")
            
            # Log event details
            if hasattr(event, 'content'):
                if isinstance(event.content, list):
                    for j, content_item in enumerate(event.content):
                        if hasattr(content_item, 'text'):
                            text_preview = content_item.text[:100] if content_item.text else "None"
                            print(f"   Content[{j}]: {text_preview}...")
                elif hasattr(event.content, 'text'):
                    text_preview = event.content.text[:100] if event.content.text else "None"
                    print(f"   Content: {text_preview}...")
            
            if hasattr(event, 'tool_calls'):
                print(f"   🔧 Tool calls: {len(event.tool_calls) if event.tool_calls else 0}")
                if event.tool_calls:
                    for tool_call in event.tool_calls[:3]:  # Show first 3
                        tool_name = getattr(tool_call, 'name', 'unknown')
                        print(f"      - {tool_name}")
        
        print(f"✅ Total events received: {len(events)}")
        
        # Get results from session state after processing
        # State is committed by Runner after each event is processed
        # Reload session to get updated state (using sync method)
        # get_session_sync requires app_name, user_id, and session_id
        updated_session = session_service.get_session_sync(
            app_name=app_name,
            user_id=user_id,
            session_id=session_id
        )
        state = updated_session.state if updated_session else {}
        marked_article = state.get('marked_article', '')
        article_blocks = state.get('article_blocks', [])
        
        # Collect response text from events
        print("\n📥 Collecting response from events...")
        response_text = ""
        for i, event in enumerate(events):
            event_type = type(event).__name__
            print(f"\n   Event #{i+1} ({event_type}):")
            
            if hasattr(event, 'content') and event.content:
                print(f"      ✅ Has content (type: {type(event.content).__name__})")
                
                # Handle Content object with parts
                if hasattr(event.content, 'parts'):
                    parts = event.content.parts
                    print(f"      Content has {len(parts)} parts")
                    for j, part in enumerate(parts):
                        part_type = type(part).__name__
                        print(f"         Part[{j}] type: {part_type}")
                        
                        # Check for text in part
                        if hasattr(part, 'text') and part.text:
                            text = part.text
                            response_text += text + "\n"
                            print(f"         ✅ Text found in part[{j}]: {len(text)} chars")
                            print(f"         Text preview: {text[:150]}...")
                        
                        # Check for function_call (tool calls) - skip these
                        if hasattr(part, 'function_call'):
                            print(f"         ⚙️  Part[{j}] is a function_call (tool call), skipping")
                        
                        # Check for function_response (tool responses) - skip these
                        if hasattr(part, 'function_response'):
                            print(f"         ⚙️  Part[{j}] is a function_response (tool response), skipping")
                
                # Fallback: check if content has text directly
                elif hasattr(event.content, 'text') and event.content.text:
                    text = event.content.text
                    response_text += text + "\n"
                    print(f"      ✅ Text found directly: {len(text)} chars")
                
                # Handle list of content items
                elif isinstance(event.content, list):
                    print(f"      Content is list with {len(event.content)} items")
                    for j, content_item in enumerate(event.content):
                        if hasattr(content_item, 'text') and content_item.text:
                            text = content_item.text
                            response_text += text + "\n"
                            print(f"         ✅ Text found in item[{j}]: {len(text)} chars")
                else:
                    print(f"      ⚠️  Content exists but structure unknown")
                    print(f"      Content type: {type(event.content).__name__}")
                    print(f"      Content attributes: {[attr for attr in dir(event.content) if not attr.startswith('_')][:10]}")
            else:
                print(f"      ⚠️  No content or content is None")
            
            # Check for other possible response fields
            if hasattr(event, 'text') and event.text:
                text = event.text
                response_text += text + "\n"
                print(f"      ✅ Found 'text' attribute directly: {len(text)} chars")
        
        # If we got text, use it; otherwise provide helpful message
        if response_text.strip():
            final_response = response_text.strip()
        elif error_occurred and "429" in error_occurred:
            final_response = "I apologize, but I've reached the daily API quota limit (20 requests/day for free tier). Please try again later or upgrade your API plan. For more information: https://ai.google.dev/gemini-api/docs/rate-limits"
        elif error_occurred:
            final_response = f"I encountered an error while processing: {error_occurred}. Please try again."
        else:
            final_response = "Processing completed, but no text response was generated. The agent may have used tools without providing a text response."
        
        print(f"\n📤 Final response length: {len(final_response)} chars")
        print(f"📤 Response preview: {final_response[:200]}...")
        print(f"📊 Marked article length: {len(marked_article)} chars")
        print(f"📊 Blocks found: {len(article_blocks)}")
        if error_occurred:
            print(f"⚠️  Error occurred: {error_occurred}")
        
        result = {
            "status": "success" if not error_occurred else "partial",
            "marked_content": marked_article,
            "blocks": article_blocks,
            "total_blocks": len(article_blocks),
            "response": final_response,
            "events_count": len(events),
            "error": error_occurred if error_occurred else None,
        }
        
        print("=" * 60)
        print("✅ Processing completed successfully")
        print("=" * 60 + "\n")
        
        # Save to file if output path provided
        if output_path:
            output_file = Path(output_path)
            if marked_article:
                output_file.write_text(marked_article, encoding='utf-8')
                print(f"\nProcessed article saved to: {output_path}")
            else:
                # Fallback: save original content if no marked content
                output_file.write_text(article_content, encoding='utf-8')
                print(f"\nArticle saved to: {output_path}")
        
        return result
        
    except Exception as e:
        print(f"Error processing article: {e}", file=sys.stderr)
        import traceback
        traceback.print_exc()
        return {
            "status": "error",
            "error": str(e),
            "marked_content": "",
            "blocks": [],
            "total_blocks": 0,
        }


def main():
    """Main entry point for the runner."""
    parser = argparse.ArgumentParser(
        description="Process journalistic articles with AI agent"
    )
    parser.add_argument(
        "article_file",
        type=str,
        help="Path to the article file (markdown or text)"
    )
    parser.add_argument(
        "-o", "--output",
        type=str,
        default=None,
        help="Output file path (default: adds '_processed' suffix to input filename)"
    )
    parser.add_argument(
        "--no-save",
        action="store_true",
        help="Don't save output to file"
    )
    
    args = parser.parse_args()
    
    # Read article
    try:
        article_content = read_article_file(args.article_file)
        print(f"✓ Read article from: {args.article_file}")
    except Exception as e:
        print(f"✗ Error reading article: {e}", file=sys.stderr)
        sys.exit(1)
    
    # Determine output path
    output_path = None
    if not args.no_save:
        if args.output:
            output_path = args.output
        else:
            # Generate output path by adding _processed suffix
            input_path = Path(args.article_file)
            output_path = input_path.parent / f"{input_path.stem}_processed{input_path.suffix}"
    
    # Process article
    result = process_article(article_content, output_path)
    
    # Print summary
    print("\n" + "="*60)
    print("PROCESSING SUMMARY")
    print("="*60)
    print(f"Status: {result['status']}")
    print(f"Total blocks identified: {result['total_blocks']}")
    
    if result['status'] == 'success':
        print("\nBlock types found:")
        block_types = {}
        for block in result['blocks']:
            block_type = block.get('type', 'unknown')
            block_types[block_type] = block_types.get(block_type, 0) + 1
        
        for block_type, count in sorted(block_types.items()):
            print(f"  - {block_type}: {count}")
        
        if output_path:
            print(f"\n✓ Output saved to: {output_path}")
    else:
        print(f"\n✗ Error: {result.get('error', 'Unknown error')}")
        sys.exit(1)


if __name__ == "__main__":
    main()

