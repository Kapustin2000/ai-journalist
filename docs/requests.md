# AI Journalist Testing Playbook

A structured set of scenarios to exercise the orchestration pipeline (Root Agent → Segment Editor → Segment Writer) and validate that `pending_segment_updates` aggregates every change.

---
## Phase 1 · Baseline Tasks
1. **Compact Title & Lead**  
   _Prompt_: “Сократи заголовок и первый параграф, сохранив упоминания BlockJam 2025 и Theta Network.”  
   _Flow_: Segment Editor rewrites heading + first paragraph (Writer optional) → queue contains two tighten actions.

2. **Context Before First Question**  
   _Prompt_: “Добавь перед первым вопросом короткий абзац, где объясняется, что такое хакатон и почему он важен для Theta Network.”  
   _Flow_: Writer generates explanatory paragraph → Segment Editor inserts `new_segment` with positional metadata.

3. **Inspirational Closing**  
   _Prompt_: “Перепиши заключительный параграф, чтобы он звучал более вдохновляюще и содержал явный призыв следить за обновлениями.”  
   _Flow_: Writer crafts new closing, Segment Editor rewrites block, queue logs rewrite.

---
## Phase 2 · Advanced Revisions
4. **Tightened Q&A + Bridge**  
   _Prompt_: “Сократи второй и третий вопросы, переформулируй ответы так, чтобы звучали как короткие цитаты, и вставь мостик между ними.”  
   _Flow_: Identify `block_b73b79d1` / `block_b0e717c8`; Writer outputs concise quotes; Segment Editor updates both blocks + inserts bridge; queue shows two rewrites + one insert.

5. **Factoid + CTA Rewrite**  
   _Prompt_: “Добавь после абзаца про инкубатор (block_b0e717c8) фактоид: 5-дневный формат, 20+ команд, и объясни, зачем это Theta. Потом перепиши заключение с призывом подписаться на Telegram-канал конференции.”  
   _Flow_: Insert factoid after `block_b0e717c8`, rewrite final block; queue captures insert + rewrite actions with writer notes.

6. **New Intro Tone**  
   _Prompt_: “Сделай вводную полностью новым тоном: короткий лид (две строки), затем h2 ‘Почему важно’ с абзацем, укажи, что статья — часть серии интервью.”  
   _Flow_: Replace title/lead, insert new heading + paragraph, optionally remove old intro block; queue accumulates multiple actions per segment id, showcasing history.

---
### Usage
Run prompts sequentially, inspecting `pending_segment_updates` after each to confirm Writer/Segment Editor coordination, action aggregation, and placement metadata.
