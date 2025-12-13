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
    
    prompt = f"""Rewrite this text according to the instruction.

Context (surrounding text):
{context}

Text to rewrite:
{content}

Instruction: {instruction}

Return ONLY the rewritten text, no explanations."""
    
    try:
        result = process_article(prompt)
        response_text = result.get('response_text', '').strip()
        
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
    
    prompt = f"""Write new content according to the instruction.

Context (surrounding text):
{context}

Instruction: {instruction}

Return ONLY the new content, no explanations."""
    
    try:
        result = process_article(prompt)
        response_text = result.get('response_text', '').strip()
        
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
    data = request.json
    document_content = data.get('documentContent', '')
    message = data.get('message', '')
    selected_block_id = data.get('selectedBlockId')
    document_info = data.get('documentInfo', '')
    
    # Parse document to get structured blocks
    try:
        markup_result = markup_article_blocks(document_content, None)
        blocks = markup_result.get('blocks', [])
        
        context = f"""Document structure:
{document_info}

Total blocks: {len(blocks)}

User message: {message}"""
        
        if selected_block_id:
            selected_block = next((b for b in blocks if b.get('id') == selected_block_id), None)
            if selected_block:
                context += f"\n\nSelected block: {selected_block.get('content', '')}"
        
        prompt = f"""{context}

Provide helpful suggestions for improving the article. Be specific and actionable.
If you suggest changes, describe them clearly."""
        
        result = process_article(prompt)
        response_text = result.get('response_text', '').strip()
        
        return jsonify({
            'message': response_text,
            'updates': [],  # Can be populated with specific suggestions
            'tokensUsed': result.get('tokens_used', 0)
        })
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/v1/improve-article', methods=['POST'])
def improve_article():
    """Improve entire article"""
    data = request.json
    document_id = data.get('documentId')
    content = data.get('content', {})
    
    prompt = """Analyze this article and suggest specific improvements.

For each suggestion:
1. Identify the specific block/section
2. Explain what needs improvement
3. Provide the improved version

Focus on:
- Clarity and conciseness
- Flow and structure
- Grammar and style
- Engagement and readability"""
    
    try:
        result = process_article(prompt)
        response_text = result.get('response_text', '').strip()
        
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

