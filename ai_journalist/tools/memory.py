from google.adk.agents.llm_agent import ToolContext
from google.adk.agents.callback_context import CallbackContext

def memorize_list(key: str, value: str, tool_context: ToolContext) -> dict:
  """
  Memorize pieces of information.

  Args:
      key: the label indexing the memory to store the value.
      value: the information to be stored.
      tool_context: The ADK tool context.

  Returns:
      A status message.
  """
  mem_dict = tool_context.state
  if key not in mem_dict:
    mem_dict[key] = []
  if value not in mem_dict[key]:
    mem_dict[key].append(value)
  return {"status": f'Stored "{key}": "{value}"'}


def memorize(key: str, value: str, tool_context: ToolContext) -> dict:
  """
  Memorize pieces of information, one key-value pair at a time.

  Args:
      key: the label indexing the memory to store the value.
      value: the information to be stored.
      tool_context: The ADK tool context.

  Returns:
      A status message.
  """
  mem_dict = tool_context.state
  mem_dict[key] = value
  mem_dict[key] = value
  return {"status": f'Stored "{key}": "{value}"'}
  
def load_context(callback_context: CallbackContext, llm_request=None) -> None:
    """
    Load article blocks and marked article from the tool context state.

    Args:
        callback_context: The ADK callback context.
    """
    article_segments = callback_context.state.get('article_segments', [
      {
        "id": "block_506ec105",
        "type": "heading_h1",
        "level": 1,
        "content": "# BlockJam 2025: Уникальный хакатон Theta Network с программой инкубатора",
        "position": 0
      },
      {
        "id": "block_0e987eda",
        "type": "paragraph",
        "level": None,
        "content": "**ASRP.media** беседует с Саймоном Пиазоло о европейской конференции Theta Network и хакатоне BlockJam 2025 в Берлине.",
        "position": 1
      },
      {
        "id": "block_ff0aa9a7",
        "type": "horizontal_rule",
        "level": None,
        "content": "---",
        "position": 2
      },
      {
        "id": "block_3440e41b",
        "type": "paragraph",
        "level": None,
        "content": "**ASRP.media:** Привет всем с [THETA EuroCon](https://www.linkedin.com/company/theta-eurocon/) — Европейская конференция Theta Network и хакатон BlockJam 2025 в Берлине. Сегодня мы здесь с Саймоном Пиазоло, одним из соучредителей и организаторов конференции Theta Euro, и он любезно согласился ответить на некоторые наши вопросы. Привет, Саймон. Давайте поговорим о хакатоне. На ваш взгляд, что делает BlockJam уникальным среди других мероприятий, и что участники должны вынести из него?",
        "position": 3
      },
      {
        "id": "block_b0e717c8",
        "type": "paragraph",
        "level": None,
        "content": "**[Саймон Пиазоло](https://www.linkedin.com/in/simon-piazolo/):** Одно из ключевых отличий заключается в том, что вместо 24- или 48-часового хакатона это мероприятие длится 5 дней. Это дает участникам время действительно создать что-то значимое с использованием технологии Theta и применить это к реальным концепциям. А после этого у нас также есть программа инкубатора, предназначенная для того, чтобы помочь превратить проекты в реальные стартапы, а не просто в прототипы хакатона.",
        "position": 4
      },
      {
        "id": "block_114ebcaa",
        "type": "paragraph",
        "level": None,
        "content": "**ASRP.media:** Говоря об участниках, как вы думаете, какова была ключевая выгода для них от участия в хакатоне?",
        "position": 5
      },
      {
        "id": "block_d94e85f6",
        "type": "paragraph",
        "level": None,
        "content": "**Саймон Пиазоло:** Да, я думаю, что основная выгода, очевидно, заключается в нетворкинге на хакатоне — встреча с другими разработчиками и наблюдение за новыми идеями, развивающимися в экосистеме Theta. Но также программа инкубатора после этого является огромным преимуществом. Если они победят, они получат шесть месяцев в инкубаторе с финансированием и нашей поддержкой, так что проект хакатона действительно может превратиться в стартап.",
        "position": 6
      },
      {
        "id": "block_b73b79d1",
        "type": "paragraph",
        "level": None,
        "content": "**ASRP.media:** И наконец, глядя в будущее, вы упомянули ваш инкубатор. Каковы ваши планы по дальнейшему развитию конференции Theta и платформ Theta Cloud?",
        "position": 7
      },
      {
        "id": "block_c404add1",
        "type": "paragraph",
        "level": None,
        "content": "**Саймон Пиазоло:** Да, что касается Theta Edge Cloud, наша цель — продолжать привлекать больше пользователей и позволять стартапам строить непосредственно на платформе. Что касается конференции Theta EuroCon, наш акцент сделан на рост. Хакатон этого года был нашим первым, и наша амбиция на следующий год — удвоить количество участников. В идеале мы хотим видеть, как команды развиваются за пределами стадии хакатона и превращают свои проекты в реальные, устойчивые стартапы.",
        "position": 8
      },
      {
        "id": "block_42470c5a",
        "type": "paragraph",
        "level": None,
        "content": "**ASRP.media:** Саймон, большое спасибо. Оставайтесь с нами и следите за нашими обновлениями на официальных каналах ASRP и в социальных сетях. А для Theta Edge и Симона — увидимся скоро на сцене, открывая конференцию. Спасибо за ваше время.",
        "position": 9
      },
      {
        "id": "block_9a2c6c30",
        "type": "horizontal_rule",
        "level": None,
        "content": "---",
        "position": 10
      },
      {
        "id": "block_2990e920",
        "type": "paragraph",
        "level": None,
        "content": "*Источник: [ASRP.media](http://ASRP.media)*",
        "position": 11
      }
    ])

    callback_context.state['article_segments'] = article_segments

    
    
    

        
