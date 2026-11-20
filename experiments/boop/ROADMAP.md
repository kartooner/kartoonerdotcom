# Boop! roadmap

## v1
- Crayon bits when a block pops
- Next zone comes up as soon as the last block pops
- Pause (button, Esc or P, and automatically when the tab is hidden)
- Keyboard play: ← → aim (Shift for fine aim), Space or Enter fires
- No card on /games while it's in active testing

## v1.1
- Nails: everything fixed in place (pinned, jelly, grey) is nailed, kitty-corner; resting blocks have none
- Knock nails out by hitting near them: with one left the block hangs and swings from it, with none it falls (jelly and grey too). Single squares' nails are grey and never come out
- Pinned blocks are firmer when hit; resting blocks move freely
- Resting blocks drop into place as a new zone slides in
- Ball fuse: a ball greys as it goes without hitting a block, and brightens again on a hit
- Boop, the block buddy mascot: breathes, blinks and looks around, wiggles when tapped
- Tips in order: every new thing gets a callout pointing at it the first time it shows up; the buddy's tour covers the basics (launching, hits, nails, then the rest), one at a time; How to play trimmed to a short reference
- Clearing a zone gives +5 shots through depth 10

## v1.1.1 (hotfixes)
- iPhone rotation fixed; a phone on its side gets the side-by-side layout
- Steady 60 or steady 30 frame rate; fewer redraws while idle; smoother aim guide; Low Power Mode friendly
- Boop (the mascot, formerly Buddy) introduces himself; his whole tour is two tips (how to play, then nails and shots). They dim the board and wait for "Got it" (no tapping through), only at the start of a turn. Anything that explains itself on screen gets no tip
- Buddy cheers you on at game over
- Speech bubble outlines "boil" slightly, like a hand-drawn cartoon
- Tap targets at least 44pt (Got it, pause, links)

## v1.2
Tester feedback on controls (mouse and phone):
- **No dead window between shots:** today input is ignored until every block stops moving (up to 3s, longer with hanging blocks). Let you start aiming as soon as the balls are gone; the guide updates as things come to rest, and the shot waits until the board is ready. Gently swinging blocks shouldn't hold up the turn.
- **Point-to-aim with a mouse:** drag-anywhere works on a phone, but with a mouse people expect to point where they want to shoot. On a mouse, the launcher follows the cursor and a click fires; touch keeps drag-anywhere.
- **A way to cancel:** drag back to where you started and the guide fades (letting go there doesn't fire); Esc or a right-click also cancels on desktop without pausing.

New props, each introduced with a pointing tip the first time it shows up:
- **Vines (from depth 9):** short hanging vines (3–4 links) drawn as a green crayon line with a few leaves, hanging from the ceiling, a block or a mushroom. They sway when brushed; each link takes a few hits, and a broken vine drops its lower half. Sometimes a vine holds a block up like a chandelier: cut it and the block falls into everything below. At most one or two per zone, kept short so balls don't tangle.
- **One-way flaps (from depth 12):** a small door hinged on a nail. Balls pass through one way and bounce back the other, which makes routes (get a ball in behind a wall where it rattles around). Built from the existing hinge.
- **Bombs (from depth 15):** a block with a little fuse. Popping it bursts it and takes a chunk off its neighbours: a big payoff and a reason to aim at it first. Nothing new to learn.

Pacing, so it never overwhelms. Every new thing follows the same arc (the Nintendo way: show it, teach it, then use it freely once it's familiar):
1. **Show:** it first appears on its own, somewhere safe and easy to hit, with a pointing tip that says what it does. Nothing else new in that zone.
2. **Teach:** for the next few zones it keeps appearing, alone or with one familiar thing, so playing with it teaches how it behaves (a vine holding a block, a flap guarding a pocket, a bomb next to a tough block).
3. **Familiar:** after that it's a known thing and shows up more often, mixed in with everything else, sometimes in combinations that ask a little more of you.
- Never overcrowded: a new kind of thing only every few depths (9, 12, 15), never two at once, and at most two kinds of props in a zone.

Not planned: seesaws, bumpers (same job as mushrooms), portals, moving blocks, magnets.

## v1.2.1
Sound:
- **Sound:** chiptune-style: a soft "boop" on hits, a bright pop when a block bursts, a chime for +1, a zone-clear jingle.
- **Haptics:** light taps on hits and pops on phones that support it.
- **Mute:** a sound on/off toggle that's always within reach and remembered between visits. Haptics follow the same toggle or get their own.

## Saving (first pass, in v1)
- The run is saved in the browser's local storage at the start of every turn: the physics world snapshot plus the game state. On return the start screen offers Continue.
- Game over and New game clear it. One save per browser; clearing site data loses it.
- Closing mid-shot goes back to before that shot (the shot isn't spent).
- Later: a version check so an update to the game can't load an incompatible save (today an unreadable save is just dropped); maybe a "Continue" summary (depth, shots left).
