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
        print("Starting article processing...")
        print(f"Article length: {len(article_content)} characters")
        
        # Runner.run processes the user message and yields events
        # The Runner handles session state updates through SessionService
        # run() requires user_id, session_id, and new_message (Content type)
        new_message = types.UserContent(parts=[types.Part(text=initial_message)])
        events = list(runner.run(
            user_id=user_id,
            session_id=session_id,
            new_message=new_message
        ))
        
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
        response_text = ""
        for event in events:
            if hasattr(event, 'content') and event.content:
                if isinstance(event.content, list):
                    for content_item in event.content:
                        if hasattr(content_item, 'text'):
                            response_text += content_item.text + "\n"
                elif hasattr(event.content, 'text'):
                    response_text += event.content.text + "\n"
        
        result = {
            "status": "success",
            "marked_content": marked_article,
            "blocks": article_blocks,
            "total_blocks": len(article_blocks),
            "response": response_text.strip() if response_text else "Processing completed",
            "events_count": len(events),
        }
        
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

