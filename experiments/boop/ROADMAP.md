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
Sound, chill and never annoying:
- **Feel:** soft, warm chiptune: rounded tones (not buzzy square waves), quiet, short. Generated in the browser, no sound files.
- **Always in key:** every note comes from one gentle five-note scale, so overlapping sounds harmonise.
- **Combo phrases (in the spirit of Wind Waker's sword combos):** each hit in a shot plays the next note of a short phrase, and popping a block lands the phrase's closing note. Our own little phrases, no borrowed melodies. Resets every shot.
- **Never a wall of noise:** only a few sounds at once, hits on the same block a split second apart merge, a soft limiter, low volume. Silent while paused or when the tab is hidden.
- **What makes a sound:** block hit (soft "boop", next note of the phrase), block pop (brighter pluck + a tiny crayon-scratch puff), nail pops out ("tink"), +1 ring (rising chime), jelly pass (squishy wobble), mushroom ("boing"), zone clear (short jingle), game over (gentle three notes down), launch (soft "fwip"). Walls, grey blocks, windmills and buttons stay silent.
- **Off by default.** People play in quiet places, and browsers block sound until a tap anyway.
- **Sound toggle next to Pause:** a speaker icon in the board's top-left corner beside the pause button, with a slash while sound is off. 44pt, one tap from anywhere in the game, remembered between visits. The tap that turns it on also starts the audio (iPhones require a tap first).
- **Letting people know, without nagging:**
  - A quiet line under Play on the start screen, "Sound is off · Turn on", in the same style as Send feedback. Gone once you've chosen either way.
  - The first time you pop a block, the muted speaker gives one small wiggle: a hint that sound exists for moments like this. Once, no message.
  - Not one of Boop's tips: his two are for how to play.

## Later
- **Haptics:** web pages can't vibrate on iPhone, so haptics wait for a possible App Store / Play Store release.

## Saving (first pass, in v1)
- The run is saved in the browser's local storage at the start of every turn: the physics world snapshot plus the game state. On return the start screen offers Continue.
- Game over and New game clear it. One save per browser; clearing site data loses it.
- Closing mid-shot goes back to before that shot (the shot isn't spent).
- Later: a version check so an update to the game can't load an incompatible save (today an unreadable save is just dropped); maybe a "Continue" summary (depth, shots left).
