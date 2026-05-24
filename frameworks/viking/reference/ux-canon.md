# Viking Design Framework: UX Canon Reference

This document is the shared intellectual foundation for all seven council roles.
Every agent should draw from it. It does not replace methodology — it sharpens it.

---

## 1. Jesse James Garrett — The Elements of User Experience

The five planes of UX, from abstract to concrete. Work top-down in strategy;
validate bottom-up in review. Never design a surface before defining the plane above it.

| Plane | Question it answers | Owner in this framework |
|---|---|---|
| **Strategy** | Why are we building this? Who is it for? | Creative Director + Creative Strategist |
| **Scope** | What are we building? What is out? | Creative Strategist |
| **Structure** | How does it work? How does it connect? | Systems Architect |
| **Skeleton** | Where does everything go? | Flow Designer |
| **Surface** | What does it look, feel, and sound like? | Content Designer + Handoff Specialist |

**Application rule:** If a council member is working on a plane below one that is
unresolved, stop and escalate. Surface decisions without Strategy are guesses.

---

## 2. Steve Krug — Don't Make Me Think

Users do not read. They scan, satisfice, and muddle through. Design for the
lowest-effort correct interpretation, not the ideal reading.

### Core laws
- **Self-evidence over explanation.** If it needs a label, rethink the design.
- **Conventions are your friends.** Use patterns users already know. Innovation
  has a cost. Spend it only when the gain is real.
- **Omit needless words.** Cut 50% of the copy. Then cut half of what remains.
- **Obvious navigation.** Users should always know: Where am I? What can I do here?
  How do I get back?
- **Happy path clarity.** The most important action on any screen must be visually
  dominant. Everything else is secondary.
- **Test early, test often.** One hallway test beats a thousand design debates.
  Five users reveal most usability problems.

**Application rule:** The Flow Designer and Content Designer must apply Krug's
scan-pattern test before handoff. If a first-time user cannot identify the
primary action in 5 seconds, it is not done.

---

## 3. Don Norman — The Design of Everyday Things

The foundational theory of how people understand and interact with objects and systems.
Every interface is a designed object. Apply Norman's model before designing any interaction.

### Core concepts

**Affordances** — What an object suggests it can do. A button affords pressing. A slider affords
sliding. If users try to interact with something that does not respond, the affordance is wrong.
Design the affordance before designing the visual.

**Signifiers** — The signal that communicates where the action is. A door handle is a signifier.
An underlined link is a signifier. Affordances without signifiers produce confusion. This is
the root cause of most "I didn't know I could click that" problems.

**Feedback** — The system's response to an action. Immediate, informative, clear. Latency without
feedback creates doubt. AI actions must always have feedback — even if the result is "still working."

**Conceptual models** — The user's mental model of how the system works. Design must match the
user's model, not the engineer's model. When they diverge, the user is always wrong in their
mind but right in ours. Close the gap through signifiers and feedback, not documentation.

**Mappings** — The relationship between controls and their effects. A stove dial that maps
left-to-right to a front-to-back burner layout is a bad mapping. Design controls so the
relationship between action and effect is obvious.

**Constraints** — Limiting the actions available to prevent error. Physical, logical, semantic,
cultural. Use constraints to make the wrong action impossible before using copy to warn about it.

**Seven stages of action** (applied to UX):
1. Goal — What does the user want?
2. Plan — How do they think they will get it?
3. Specify — What action do they choose?
4. Perform — What do they actually do?
5. Perceive — What do they observe after?
6. Interpret — What does it mean to them?
7. Compare — Did it match their goal?

Map every primary flow against these seven stages. If the gap between stages 2 and 3 is large,
the interaction is too complex. If stage 5 produces no signal, feedback is missing.

**Application rule:** The Flow Designer applies Norman's seven stages to every primary task flow.
The Content Designer applies affordance + signifier thinking to every label and CTA. If the copy
is doing the job that the design should do, the design is not finished.

---

## 4. Jon Yablonski — Laws of UX

Psychological and perceptual laws that govern how users experience interfaces.
Apply these as constraints, not suggestions.

| Law | Principle | Design implication |
|---|---|---|
| **Fitts's Law** | Time to acquire a target increases with distance and decreases with size | Make primary actions large and close to the user's current position |
| **Hick's Law** | Decision time increases with the number and complexity of choices | Limit options per screen. Progressive disclosure for advanced paths |
| **Miller's Law** | Working memory holds ~7 (±2) items | Chunk related information. Never show more than 7 items without grouping |
| **Jakob's Law** | Users spend most time on other sites; they expect yours to work the same | Default to conventions. Deviate only with strong evidence |
| **Peak-End Rule** | Users judge an experience by its peak moment and its end, not the average | Design the highest-stakes moment and the completion state with care |
| **Aesthetic-Usability Effect** | Users perceive attractive designs as more usable | Visual quality is not decoration — it builds trust and tolerance |
| **Von Restorff Effect** | The item that differs from the rest is most remembered | Use visual distinction for one thing only. Everything highlighted = nothing highlighted |
| **Doherty Threshold** | Productivity spikes when system response is under 400ms | Spec loading states for anything over 400ms. Skeleton screens beat spinners |
| **Zeigarnik Effect** | Incomplete tasks are remembered better than complete ones | Progress indicators and save states reduce abandonment anxiety |
| **Tesler's Law** | Every system has inherent complexity; it cannot be eliminated, only moved | If the UI is simple, the backend or the user bears the complexity. Be intentional about who holds it |
| **Goal-Gradient Effect** | Effort increases as users get closer to a goal | Show progress. Reinforce proximity to completion |
| **Serial Position Effect** | Users best remember the first and last items in a list | Put the most critical action or information at the top or bottom, not the middle |

**Application rule:** The Flow Designer must run a Laws of UX check on every
primary flow. Flag any violation. Either fix the design or document the deliberate
trade-off.

---

## 4. Laura Klein — Build Better Products

UX as hypothesis-driven risk reduction. Do not build features — build experiments
that answer questions. Ship the smallest thing that can generate signal.

### Core principles
- **Define success before you design.** What does the user do differently after
  this feature ships? If you cannot answer this, you are not ready to design.
- **Research is risk reduction.** Every dollar spent on research saves multiples
  in rework. Match research depth to decision reversibility.
- **Assume you are wrong.** Your first solution is a hypothesis. Design to be
  proven wrong quickly and cheaply.
- **Segment ruthlessly.** "Users" is not a segment. Different user types have
  different mental models, tolerance levels, and jobs. Design for one hat at a time.
- **Measure behavior, not sentiment.** "I would use this" is not signal. "I used
  this" is signal.
- **Phase it.** The minimum scope that generates learning is the right scope.
  Phase 2 exists. Use it.

### The three research questions (before any design begins)
1. Does this problem actually exist for this user?
2. Would they use a solution if they had one?
3. Will they use *this* solution?

**Application rule:** The UX Researcher must answer Klein's three questions before
the 5 Gates run. If question 1 is unanswered, no design proceeds.

---

## 5. Tom Greever — Articulating Design Decisions

Design decisions only survive if you can explain them. Rationale is not defensive
justification — it is the mechanism that turns design from opinion into direction.

### The three-part decision structure
Every design choice must be explainable in this form:
1. **What you made** — a plain description of the design element.
2. **Why you made it** — the user need, business goal, or principle it serves.
3. **How it makes things better** — the specific improvement in outcome.

### Stakeholder communication principles
- **Lead with the user.** Stakeholders respond to "users struggle with X" more
  than "I think Y looks better."
- **Anticipate the objection.** Name the concern before they do. Offer the
  trade-off honestly.
- **One recommendation, not options.** Presenting three versions signals
  indecision. Make a choice. Defend it. Invite critique.
- **Business language, always.** Translate design rationale into retention,
  conversion, time-on-task, or support deflection.
- **Document the why.** The decision is only as durable as its documentation.
  If it is not written, the next person will reverse it.

**Application rule:** The Handoff Specialist must apply Greever's three-part
structure to every component in the Component Contract. "Because it looks clean"
is not a rationale. "Reduces cognitive load at the decision moment, which
increases action rate" is.

---

## 6. Nielsen's 10 Usability Heuristics

The baseline quality check for every interface. Run this as a review lens,
not a design checklist. Violations are design debt.

| # | Heuristic | Common failure in AI-powered UX |
|---|---|---|
| 1 | **Visibility of system status** | AI processing with no loading state or confidence signal |
| 2 | **Match system to real world** | Using model terminology ("token," "context window") in user-facing copy |
| 3 | **User control and freedom** | No undo or override for AI-generated content |
| 4 | **Consistency and standards** | AI states that behave differently from non-AI states |
| 5 | **Error prevention** | No validation before AI acts on ambiguous input |
| 6 | **Recognition over recall** | Burying AI output so users must remember where it appeared |
| 7 | **Flexibility and efficiency** | No way for power users to shortcut or pre-configure AI behavior |
| 8 | **Aesthetic and minimalist design** | AI surfaces that surface everything the model produced instead of curating |
| 9 | **Help users recover from errors** | AI failure states with no actionable next step |
| 10 | **Help and documentation** | No explanation of how the AI signal was generated (Glassbox gap) |

**Application rule:** The Creative Director runs a heuristic pass at every
milestone review. Any H1 (visibility) or H3 (user control) violation on an
AI feature is a blocker. All others are logged and triaged.

---

## 7. Accessibility Baseline

Accessibility is not a post-launch audit. It is a structural requirement built
into every plane of UX. No feature ships without meeting this baseline.

### POUR principles (WCAG 2.2 AA)
| Principle | What it means | Design implication |
|---|---|---|
| **Perceivable** | All information is available to all senses | Color is never the only signal. Every image has alt text. Captions for video. |
| **Operable** | All functionality is reachable by keyboard and pointer | Focus order follows reading order. No keyboard traps. Touch targets ≥ 44×44px. |
| **Understandable** | Language and behavior are predictable | Reading level ≤ 8th grade for UI copy. Error messages name the problem and the fix. |
| **Robust** | Content is compatible with current and future assistive tech | Use semantic HTML. ARIA only when native elements fall short. |

### Minimum requirements per deliverable

**Flow Designer:**
- Every flow must include a keyboard-only path.
- Focus states must be explicitly called out in recipes — not assumed.

**Content Designer:**
- All error copy must name what went wrong and what to do next.
- Button labels must be descriptive in isolation (no "click here").
- AI-generated copy disclosure must work as plain text for screen readers.

**Handoff Specialist:**
- Color contrast: 4.5:1 minimum for body text, 3:1 for large text and UI components.
- Every interactive element must have a visible focus indicator.
- All states (Loading, Error, Empty) must be announced to screen readers via
  live regions or ARIA roles.
- Touch target size ≥ 44×44px for all primary controls.

### AI-specific accessibility considerations
- AI confidence signals must never rely on color alone (e.g., "red = risky").
- AI-generated content must be identifiable to screen readers without being intrusive.
- Override and correction controls must be keyboard-accessible.
- Loading and processing states must use ARIA live regions so screen reader users
  are notified when AI output arrives.

---

## Application Map — When Each Agent Uses the Canon

| Council Role | Primary canon |
|---|---|
| Creative Director | Garrett (Strategy plane), Nielsen H1/H3 as review lens, Greever (stakeholder communication) |
| UX Researcher | Klein (three research questions, hypothesis framing), Nielsen (heuristic evaluation) |
| Creative Strategist | Garrett (Strategy + Scope planes), Klein (segment ruthlessly, define success first) |
| Systems Architect | Garrett (Structure plane), Norman (conceptual models, mappings, constraints), Tesler's Law, Doherty Threshold |
| Flow Designer | Garrett (Skeleton plane), Norman (seven stages of action, affordances, feedback), Fitts's Law, Hick's Law, Miller's Law, Krug (happy path), Accessibility (keyboard + focus) |
| Content Designer | Norman (signifiers, affordances — copy fills gaps design should close), Krug (omit needless words, self-evidence), Peak-End Rule, Nielsen H2/H9/H10, Accessibility (copy requirements) |
| Handoff Specialist | Greever (three-part rationale), Garrett (Surface plane), Norman (feedback in spec — every state must respond), Accessibility (contrast, targets, ARIA) |

---

---

## Source Credits & Required Reading

The principles in this document are drawn directly from these works. Agents should
treat them as primary sources — not summaries. When a rationale is in dispute,
go back to the book.

| Author | Title | Year | What it contributes to this framework |
|---|---|---|---|
| Don Norman | *The Design of Everyday Things* (revised and expanded ed.) | 2013, Basic Books | Affordances, signifiers, feedback, conceptual models, mappings, constraints, and the seven stages of action — the foundational vocabulary for how users understand and interact with designed systems |
| Jesse James Garrett | *The Elements of User Experience: User-Centered Design for the Web and Beyond* (2nd ed.) | 2010, New Riders | The five-plane model that governs the council's work sequence: Strategy → Scope → Structure → Skeleton → Surface |
| Steve Krug | *Don't Make Me Think, Revisited: A Common Sense Approach to Web Usability* (3rd ed.) | 2014, New Riders | Self-evident design, scan-pattern thinking, conventions, and hallway usability testing |
| Jon Yablonski | *Laws of UX: Using Psychology to Design Better Products & Services* (2nd ed.) | 2024, O'Reilly | Psychological and perceptual laws applied as design constraints — Fitts, Hick, Miller, Jakob, Peak-End, and more |
| Laura Klein | *Build Better Products: A Modern Approach to Building Successful User-Centered Products* | 2016, Rosenfeld Media | Hypothesis-driven design, lean UX research, segmentation, and defining success before building |
| Tom Greever | *Articulating Design Decisions: Communicate with Stakeholders, Keep Your Sanity, and Deliver the Best User Experience* (2nd ed.) | 2020, O'Reilly | The three-part decision structure, stakeholder communication, and making design rationale durable |
| Jakob Nielsen | *10 Usability Heuristics for User Interface Design* | 1994, Nielsen Norman Group (updated 2020) | The baseline quality review lens applied at every milestone by the Creative Director |
| W3C Web Accessibility Initiative | *Web Content Accessibility Guidelines (WCAG) 2.2* | 2023, W3C Recommendation | POUR principles and the minimum accessibility requirements built into every deliverable |

**Full reading list:** https://www.kartooner.com/recommended-books/
