# LangGraph Designer — Guide for Designers

## What is this?

LangGraph Designer lets you map out how an AI assistant thinks and behaves. You do it visually, by placing cards on a canvas and connecting them with arrows.

Each card is called a **node**. Think of it like a sticky note that says "the AI does this here." A good way to picture it: if you have ever drawn a flowchart, LangGraph is that same picture except it actually runs. Every box becomes a function, every arrow becomes a path the AI follows, every diamond becomes a real decision.

Connect enough nodes together and you have a picture of how the AI moves through a conversation from start to finish.

When you are done, the tool exports a Python file your developer can drop straight into their project. You do not write any code. Your job is to design the flow.

---

## What is LangGraph?

LangGraph is the engineering layer that makes multi-step AI behavior possible. It is a Python framework that models an AI agent's logic as a graph of nodes and edges.

Three things make it work:

**Nodes** are the actions. Each node is a Python function that does one thing: call the AI, search a database, ask a human, handle an error. The node receives the current state, does its work, and passes an updated state forward.

**Edges** are the arrows between nodes. A simple edge says "always go here next." A conditional edge says "go here if this is true, go there if that is true." Edges are what give the AI its decision-making ability.

**State** is the memory. It is a shared data structure that every node can read from and write to. Think of it as a save point in a video game. Every time a node runs, it picks up where the last one left off. The state carries context, conversation history, results from tools, whatever the AI needs to keep track of.

LangGraph is what turns a single "ask a question, get an answer" moment into a real workflow with branching, looping, error handling, and human oversight built in.

---

## Why does this matter for designers?

Consider a simple payroll assistant that helps admins track missing employee documents:

1. System flags a new hire with missing paperwork
2. Agent pulls the employee record
3. Agent checks what is missing: W-4, I-9, direct deposit form
4. Agent sends a plain-language reminder email
5. Agent waits for a response
6. If docs come in, it files them and closes the case
7. If nothing comes in after three days, it escalates to a payroll admin
8. If the HR system is unavailable, it falls back gracefully

Every one of those steps is a design decision. When does the agent ask vs. act? What does the admin see while it is working? When does a human take over? What happens when it fails?

Those are not engineering questions. They are UX questions hiding inside a technical system.

This tool gives you a way to design the answers before your developer builds them.

---

## The node types

Each card on the canvas represents one step the AI can take.

### Prompt / ask (purple)
The AI says or asks something. Any step where the AI generates language. A response, a question, a summary. Most of what a user sees comes from prompt nodes.

Example: "Send reminder to employee" or "Ask the user to clarify their request"

### Decision (orange)
The AI reaches a fork. It looks at the current state and picks which path to follow. Decision nodes have two output ports, one for each direction.

Example: "Docs missing?" branches to yes or no.

### Tool call (green)
The AI runs a tool. Searching a database, fetching a document, calling an API, running a calculation. The result comes back and the flow continues.

Example: "Pull employee record" or "Search knowledge base"

### Human handoff (pink)
The flow pauses and a real person steps in. Used for approvals, reviews, or situations where the stakes are too high to let the AI decide alone.

Example: "Admin review" or "Flag for manager approval"

### Fallback (red)
Something went wrong, or the AI hit a dead end. This node handles error conditions: logging the problem, retrying, or letting the user know gracefully.

Example: "Handle system error" or "No results found, suggest alternatives"

### End (gray)
The flow is done. The conversation reached a resolution, successful or not.

### Note (yellow)
A sticky note for the canvas. Leave questions for your developer, flag decisions that need input, or add context for stakeholders. Notes show up as comments at the top of the exported Python file so your dev sees them right away.

---

## Connecting nodes

Every node has small circles on its edges. These are ports.

The circle at the top is the input, where connections arrive. The circle at the bottom (or left and right for Decision nodes) is the output, where connections leave.

To connect two nodes: hover over an output port until it highlights, then click and drag to an input port on another node. Release.

Decision nodes have two output ports so you can wire each branch separately. Click an edge (the arrow between two nodes) to give it a condition label. Something like "has context" and "needs more info" is enough to make the flow readable for everyone.

---

## The happy path

Not all paths through a flow are equal. The happy path is the route a user takes when everything goes right. No errors, no missing information, no human intervention needed.

Select any node and toggle "happy path" in the properties panel on the right. Mark each node that belongs to the normal successful route. Those nodes glow, and the edges between them highlight. This makes it easy for stakeholders and your developer to see the intended primary experience at a glance.

The unhappy paths (errors, fallbacks, escalations) are just as important to design. But the happy path is where to start.

---

## Working the canvas

| What you want | How |
|---------------|-----|
| Add a node | Drag from the toolbar, or press Enter or Space on a palette chip |
| Move a node | Click and drag |
| Connect nodes | Drag from output port to input port |
| Select a node or edge | Click it |
| Edit properties | Select it, then use the right panel |
| Pan the canvas | Hold Space, then drag |
| Zoom | Scroll wheel, or use the + and - buttons |
| Fit everything to screen | Three-dot menu, then "Fit to screen" |
| Undo / redo | Ctrl+Z / Ctrl+Y |
| Delete selected | Delete key |
| Navigate nodes by keyboard | Tab to move between nodes, Enter to select |
| Close selection | Escape |

---

## Saving your work

**Save canvas** downloads a `.json` file. Your entire canvas, positions, labels, notes, and theme setting. Use this to pick up where you left off, or share with your developer so they can see the full picture.

**Load canvas** restores a saved `.json` file exactly as you left it.

Both live in the three-dot menu in the top right corner.

---

## Exporting for your developer

When the flow looks good, click **export .py** in the top bar.

This generates a Python file with:

- A state definition (the information the AI tracks as it moves through the flow)
- A stubbed function for every node you placed, labeled with your node name and description
- All the edges and conditional branches wired together
- Your annotation notes as comments at the top

The developer takes that file and fills in the actual logic inside each function. Your labels and descriptions are the brief. They tell the developer what each step is supposed to do.

The clearer your labels and descriptions, the less guesswork for everyone.

---

## Importing an existing file

If your developer already has a LangGraph file, you can import it to see how it works.

**Option 1:** Drop a `.py` file anywhere on the canvas. A drop zone appears.

**Option 2:** Click the "import .py" tab in the right panel, then drop or paste the code.

The tool parses the file and draws the graph on canvas. It handles any variable name your developer used (graph, workflow, builder, app, anything), multiline calls, `START` and `END` sentinels, `__start__` and `__end__` string literals, list-style path maps, and conditional edges with or without an explicit mapping dict.

Node types are inferred from naming patterns. Anything called `search_tool` becomes a Tool node. `human_review` becomes a Handoff node. Terminal nodes with no outgoing edges become End nodes regardless of name. You can always re-label or re-type nodes after import.

Once imported, the canvas fits to screen automatically. From there you can move nodes around, add annotations, tag the happy path, and export a cleaner version back to your developer.

---

## Tips for working with your developer

**Start with the happy path.** Map out what success looks like before getting into errors and edge cases. Get alignment on the core flow first.

**Name nodes from the user's perspective.** "Send reminder to employee" is clearer than "notification_dispatch_node." Your developer will thank you.

**Use the description field.** One sentence like "User gave a vague query, ask one focused follow-up" saves ten minutes of back-and-forth.

**Use notes for open questions.** Anything you are unsure about, put it in an annotation. It lands at the top of the Python file where your developer will see it.

**Start simple.** Three to five nodes is a real flow. Add branches and fallbacks once the core is solid.

**Use the example flow.** It shows a payroll missing-documents agent with a real-world decision branch, error handling, and a human review escalation. A good reference for what a complete flow looks like before you build your own.

---

## A quick first run

Open the app. You will see a starter flow on the canvas: a payroll agent that handles missing employee documents.

Try this:

1. Click the "Docs missing?" decision node. Notice the two output ports on the sides.
2. Click an arrow between two nodes. Add a condition label in the right panel.
3. Click "Pull employee record." Toggle "happy path" on.
4. Do the same for the other nodes on the main success route.
5. Watch the happy path glow.
6. Add an annotation note somewhere on the canvas.
7. Hit "export .py" and read through the generated code.

You will see your node labels and your annotation at the top. That file is ready for a developer to build from.

---

## Keyboard and accessibility

The app is fully keyboard navigable:

- **Tab** moves focus between toolbar buttons, palette chips, and canvas nodes
- **Enter or Space** on a palette chip adds that node type to the canvas center
- **Arrow keys** navigate between sidebar tabs
- **Delete or Backspace** removes the selected node or edge
- **Escape** clears the current selection
- **Ctrl+Z / Ctrl+Y** undo and redo
- **Space + drag** pans the canvas

All interactive elements have visible focus indicators. Screen readers receive announcements when nodes are added or removed.

---

What you build here becomes the architecture of the AI, the logic for how it thinks and what it does next.
