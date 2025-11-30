from google.adk.agents.llm_agent import Agent
from ai_journalist.tools import markup_blocks, memory, agent_utils
from .tools.memory import load_context
from .sub_agents.segment_editor.agent import segment_editor as segment_editor_agent
from google.adk.tools import AgentTool

try:
    from dotenv import load_dotenv
    load_dotenv()
    print("Loaded environment variables from .env file")
except ImportError:
    # dotenv not installed, environment variables should be set manually
    pass

root_agent = Agent(
    model='gemini-2.5-flash',
    name='journalist_agent',
    description='A specialized AI agent for journalistic article writing assistance. Helps with block markup, editing suggestions, and formatting standardization.',
    instruction=agent_utils.load_instructions(),
    tools=[
        markup_blocks.markup_article_blocks,
        AgentTool(segment_editor_agent),
    ],
    before_agent_callback=load_context
)
