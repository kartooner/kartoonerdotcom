# Viking Design Framework: MCP Tooling Strategy

The Viking Design Framework is "Tool-Agile." It detects the Model Context Protocol (MCP) servers connected to your environment and adapts its output accordingly.

## 🛠️ MCP Detection Logic

The **Viking Orchestrator** scans for the following MCP tools to determine which agent "Forge" to activate:

| MCP Server | Viking Use Case | Assigned Agent |
|---|---|---|
| **Pencil MCP** | Rapid Generative UI prototyping (.pen files) | **5. Loki** |
| **Figma MCP** | Production-grade visual design and tokens | **7. Thor** |
| **Miro/FigJam MCP** | System Mapping (Things, States, Rules) | **4. Heimdall** |
| **GitHub/GitLab MCP** | PRD ingestion and technical handoff | **1. Odin / 7. Thor** |
| **Web Browser MCP** | Research and competitive analysis | **2. Mimir** |

---

## 🛡️ Tool-Specific Agent Mandates

### 4. Heimdall (Systems Architect) + Miro/Whimsical
If a whiteboard MCP is detected, Heimdall will **not** output text. He will instead forge a visual **Things, States, Rules** diagram directly on the canvas.

### 5. Loki (Flow Designer) + Pencil/Figma
If a design MCP is detected, Loki will skip "descriptions" and instead **render the UI recipes** as live components or frames.

### 7. Thor (Handoff Specialist) + Figma
If Figma is connected, Thor will automatically push **Normative Tokens** to the Figma variables engine to ensure the "Viking Aesthetic" is locked in.

---

## 🚀 Usage in Command Loop

When you run `/vikingdesign`, the orchestrator will announce its tool-awareness:

`> Viking Orchestrator Active.`
`> Detected: Pencil MCP, GitHub MCP.`
`> High Council is "Design-Ready" — Loki will output live .pen designs.`
