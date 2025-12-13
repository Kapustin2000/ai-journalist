from flask import Flask, request, jsonify
from flask_cors import CORS
import os
from ai_journalist.runner import process_article
from ai_journalist.tools.markup_blocks import markup_article_blocks

app = Flask(__name__)
CORS(app)

@app.route('/health', methods=['GET'])
def health():
    return jsonify({'status': 'ok', 'service': 'ai-journalist'})

@app.route('/api/v1/rewrite-block', methods=['POST'])
def rewrite_block():
    """Rewrite a specific block"""
    data = request.json
    block_id = data.get('blockId')
    content = data.get('content')
    instruction = data.get('instruction')
    context = data.get('context', '')
    
    prompt = f"""You are a journalistic AI assistant. Use your tools to rewrite this text block.

Context (surrounding text):
{context}

Text to rewrite:
{content}

Instruction: {instruction}

Please use your segment_editor tool if needed to improve the text, then return ONLY the rewritten text, no explanations."""
    
    try:
        # Use agent through process_article (agent has segment_editor sub-agent for text editing)
        result = process_article(prompt)
        response_text = result.get('response', result.get('response_text', '')).strip()
        
        return jsonify({
            'newContent': response_text,
            'note': f'Rewritten: {instruction[:50]}...',
            'blockId': block_id,
            'tokensUsed': result.get('tokens_used', 0)
        })
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/v1/insert-block', methods=['POST'])
def insert_block():
    """Insert new block after specified block"""
    data = request.json
    insert_after = data.get('insertAfter')
    instruction = data.get('instruction')
    context = data.get('context', '')
    
    prompt = f"""You are a journalistic AI assistant. Use your tools to write new content.

Context (surrounding text):
{context}

Instruction: {instruction}

Please use your segment_editor tool to create well-written content that fits the context, then return ONLY the new content, no explanations."""
    
    try:
        # Use agent through process_article (agent has segment_editor sub-agent for content creation)
        result = process_article(prompt)
        response_text = result.get('response', result.get('response_text', '')).strip()
        
        return jsonify({
            'newContent': response_text,
            'note': f'Inserted: {instruction[:50]}...',
            'insertAfter': insert_after,
            'tokensUsed': result.get('tokens_used', 0)
        })
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/v1/chat', methods=['POST'])
def chat():
    """Chat about document"""
    import json
    print("\n" + "=" * 80)
    print("🌐 API Request: /api/v1/chat")
    print("=" * 80)
    
    data = request.json
    document_content = data.get('documentContent', '')
    message = data.get('message', '')
    selected_block_id = data.get('selectedBlockId')
    document_info = data.get('documentInfo', '')
    
    print(f"📨 User message: {message}")
    print(f"📄 Document content length: {len(document_content)} chars")
    print(f"📋 Document info: {document_info}")
    print(f"🎯 Selected block ID: {selected_block_id}")
    
    # Parse document to get structured blocks
    try:
        print("\n🔍 Parsing document blocks...")
        markup_result = markup_article_blocks(document_content, None)
        blocks = markup_result.get('blocks', [])
        print(f"   Found {len(blocks)} blocks")
        
        context = f"""Document structure:
{document_info}

Total blocks: {len(blocks)}

User message: {message}"""
        
        if selected_block_id:
            selected_block = next((b for b in blocks if b.get('id') == selected_block_id), None)
            if selected_block:
                context += f"\n\nSelected block: {selected_block.get('content', '')}"
                print(f"   Selected block content: {len(selected_block.get('content', ''))} chars")
        
        prompt = f"""{context}

You are a journalistic AI assistant. Use your tools to analyze and improve this article.

User request: {message}

Please:
1. Use markup_article_blocks tool if needed to understand document structure
2. Provide helpful suggestions for improving the article
3. Be specific and actionable
4. If you suggest changes, describe them clearly and use your tools when appropriate."""
        
        print(f"\n💬 Prompt length: {len(prompt)} chars")
        print(f"💬 Prompt preview: {prompt[:300]}...")
        
        # Use agent through process_article (uses ADK Runner with root_agent)
        # The agent has access to: markup_article_blocks tool and segment_editor sub-agent
        print("\n🤖 Calling process_article (agent)...")
        result = process_article(prompt)
        
        response_text = result.get('response', result.get('response_text', '')).strip()
        print(f"\n📤 Agent response length: {len(response_text)} chars")
        print(f"📤 Agent response: {response_text[:500]}...")
        print(f"📊 Result keys: {list(result.keys())}")
        print(f"📊 Events count: {result.get('events_count', 0)}")
        
        print("=" * 80 + "\n")
        
        return jsonify({
            'message': response_text,
            'updates': [],  # Can be populated with specific suggestions
            'tokensUsed': result.get('tokens_used', 0)
        })
    except Exception as e:
        import traceback
        print(f"\n❌ ERROR in /api/v1/chat:")
        print(f"   {str(e)}")
        print(f"   Traceback:")
        traceback.print_exc()
        print("=" * 80 + "\n")
        return jsonify({'error': str(e)}), 500

@app.route('/api/v1/improve-article', methods=['POST'])
def improve_article():
    """Improve entire article"""
    data = request.json
    document_id = data.get('documentId')
    content = data.get('content', {})
    
    prompt = """You are a journalistic AI assistant. Analyze this article and suggest specific improvements.

Use your tools:
1. Use markup_article_blocks to understand the document structure
2. Use segment_editor to analyze and improve specific sections

For each suggestion:
1. Identify the specific block/section
2. Explain what needs improvement
3. Provide the improved version using your tools

Focus on:
- Clarity and conciseness
- Flow and structure
- Grammar and style
- Engagement and readability"""
    
    try:
        # Use agent through process_article (agent has markup_article_blocks and segment_editor tools)
        result = process_article(prompt)
        response_text = result.get('response', result.get('response_text', '')).strip()
        
        return jsonify({
            'message': response_text,
            'updates': [],  # Can be parsed from response
            'tokensUsed': result.get('tokens_used', 0)
        })
    except Exception as e:
        return jsonify({'error': str(e)}), 500

if __name__ == '__main__':
    port = int(os.getenv('AI_SERVICE_PORT', 5001))
    debug = os.getenv('AI_SERVICE_DEBUG', 'true').lower() == 'true'
    
    print(f"""
╔══════════════════════════════════════╗
║   AI Journalist Service Started      ║
╠══════════════════════════════════════╣
║   Port: {port}                          ║
║   Debug: {debug}                       ║
║   Endpoints:                         ║
║   - POST /api/v1/rewrite-block       ║
║   - POST /api/v1/insert-block        ║
║   - POST /api/v1/chat                ║
║   - POST /api/v1/improve-article     ║
╚══════════════════════════════════════╝
    """)
    
    app.run(host='0.0.0.0', port=port, debug=debug)

