# Viking Design Framework: GitHub Distribution Guide

To make the Viking Design Framework "installable" like Design with Intent or Impeccably, you need to structure it as a distributable package.

## 1. Preparation for GitHub

Structure your repository like this:

```text
viking-design-framework/
├── SKILL.md                 # Core framework instructions
├── AGENTS.md                # Global agent instructions
├── reference/               # Detailed methodology guides
│   ├── gate.md
│   ├── map.md
│   └── skill-chain.md
├── agents/                  # Specialized agent profiles
│   ├── viking-director.md
│   └── viking-architect.md
├── scripts/                 # (Optional) Automation scripts
└── package.json             # Necessary for npm distribution
```

## 2. The "NPM Install" Experience

The Viking Design Framework is optimized for `npm` and `npx` distribution.

### Option A: The `npx` Installer (Recommended for new users)
Users can run your methodology without a permanent global install:

**Command:**
`npx @eriksagen/viking-design setup`

This executes `bin/install.js`, which:
- Detects the OS (Windows/Mac/Linux).
- Creates the local `.gemini/extensions/viking-design` directory.
- Configures the global `viking-design` command path.

### Option B: Global NPM Install
For frequent contributors or power users:

**Command:**
`npm install -g @eriksagen/viking-design`

## 3. How to Use (User Instructions)

Include this in your `README.md` so people know how to evoke it:

### Usage in Gemini CLI / Claude Code
Once installed, you can evoke the framework using:

**1. The Hub:**
`> viking-design`
*Displays the command menu and guides you through the process.*

**2. The 5 Gates:**
`> viking-design gate`
*Activates **2. Mimir** to determine if your project actually needs AI.*

**3. The Skill Chain:**
`> viking-design chain`
*Hands off the project through the **Nordic High Council** (1. Odin -> 7. Thor).*

---

## 4. Final Polish for Public Release
1. **License**: Add an MIT license file.
2. **Credits**: Ensure the `SKILL.md` footer explicitly credits Impeccably and Design with Intent.
3. **Screenshots/Examples**: Add a `docs/` folder with examples of a "Viking-styled" `DESIGN.md` output.
