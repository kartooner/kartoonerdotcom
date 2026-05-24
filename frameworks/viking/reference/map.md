# Viking Design Framework: System Mapping

Use the **Things, States, Rules** framework to define the logic before designing the UI.

## 1. Things
What are the main objects in the system?
- User, Project, Message, Task, Document, Session.

## 2. States
What conditions can each thing be in?
- Loading, Empty, Error, Ready, Done, Locked, Pending.

## 3. Rules
What causes a change? What happens next? Who needs to know?
- "When a Task moves to Done, notify the User."
- "When a Session times out, clear the context."

## 4. AI-Specific Logic
- **Where** does the AI step in?
- **Where** does it hand back to the human?
- **What** happens when it's slow, wrong, or unsure?
- **What** can stay invisible (Blackbox) vs. what must be seen (Glassbox)?
