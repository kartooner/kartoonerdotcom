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
- **Vines (from depth 9):** green vines with leaves, always in the middle or lower part of a zone so they don't get in the way of early shots. Two kinds: **strung** across a short gap (2–4 cells, block to block or block to wall, never wall to wall) with a little sag, and **hanging** under a block, sometimes with a little one-square block dangling from its end like a chandelier (with clear space below so it lands with a thump). Vines stay dormant unless something happens to them: a ball passes close (its breeze sways them a little), a ball hits one, or the block it hangs from moves. A zone never has two hanging vines: two vines are always one garland and one hanging. Each link takes 3 hits. A snapped strung vine leaves two halves dangling; anything no longer held by a block or wall falls, and a popped block drops what it held. Depth 9 shows one strung vine on its own; depths 10–12 one vine plus one familiar prop; from 13, one or two.
- **Bombs (from depth 15), a treat:** a round cartoon bomb (charcoal body, white shine, crayon shading, a small cap, a curved grey fuse and an orange spark; lifted to slate in dark mode so it reads), sitting in a gap snug among blocks. Not a block: no number, nothing to clear. The first hit gives it a jolt and a flare; the second lights the fuse: the spark flares, the bomb shivers, and half a second later it bursts: every block within reach loses half its starting number, unpinned blocks (resting or hanging) get thrown, nailed ones just jolt like any hit (their nails stay), vines snap, and other bombs light. Introduced at depth 15, then in about one zone in three (deeper down, now and then two).

Pacing, so it never overwhelms. Every new thing follows the same arc (the Nintendo way: show it, teach it, then use it freely once it's familiar):
1. **Show:** it first appears on its own, somewhere safe and easy to hit, with a pointing tip that says what it does. Nothing else new in that zone.
2. **Teach:** for the next few zones it keeps appearing, alone or with one familiar thing, so playing with it teaches how it behaves (a vine holding a block, a bomb next to a tough block).
3. **Familiar:** after that it's a known thing and shows up more often, mixed in with everything else, sometimes in combinations that ask a little more of you.
- Never overcrowded: a new kind of thing only every few depths (vines at 9, bombs at 15), never two at once, and at most two kinds of props in a zone.

Zones that stay fresh: past the first couple, interlocking shapes (L, T, S and their big versions) come up about twice as often, long bars are rare early, big rectangles are toned down, and a few more blocks rest loose mid-game. Straight pieces went from about two thirds of a zone to about half.

Performance and smoothness pass (mid game onward):
- Vines stay dormant (asleep) unless a ball comes close, hits one, or its block moves; they hang from small pins that follow their block, so they never pull on it.
- GPU memory is freed as things leave the board (it used to grow every zone).
- The board idles at ~10 redraws a second while you aim, in every zone (grey blocks, popped nails, paused windmills and mushrooms used to keep it at 60).
- A ball winds down after 40s however busy it is, so no turn drags past about a minute.
- A tidy-up every 5 zones, as the next zone slides in, so nothing left over can pile up over a long run.
- Vines and bombs added to How to play.
- Speech bubble tails tucked into the bubble's edge, so they read as one shape.
- Trackpads and mice: a pinch or scroll over the board no longer zooms or moves the page mid-aim; pointing right next to the launcher holds the aim instead of swinging it; pressing, dragging off the board and letting go cancels the shot.

Not planned: one-way flaps (dropped for now), seesaws, bumpers (same job as mushrooms), portals, moving blocks, magnets.

Sound (moved up from v1.2.1), chill and never annoying:
- **Feel:** soft, warm chiptune: rounded tones (not buzzy square waves), quiet, short. Generated in the browser, no sound files.
- **Always in key:** every note comes from one gentle five-note scale, so overlapping sounds harmonise.
- **Combo phrases (in the spirit of Wind Waker's sword combos):** each hit in a shot plays the next note of a short phrase, and popping a block lands the phrase's closing note. Our own little phrases, no borrowed melodies. Resets every shot.
- **Never a wall of noise:** only a few sounds at once, hits on the same block a split second apart merge, a soft limiter, low volume. Silent while paused or when the tab is hidden.
- **What makes a sound:** block hit (soft "boop", next note of the phrase), block pop (brighter pluck + a tiny crayon-scratch puff), nail pops out ("tink"), +1 ring (rising chime), jelly pass (squishy wobble), mushroom ("boing"), vine snap (low pluck), bomb (soft low thump), zone clear (short jingle), game over (gentle three notes down), launch (soft "fwip"). Walls, grey blocks, windmills and buttons stay silent. M toggles sound from the keyboard.
- **Off by default.** People play in quiet places, and browsers block sound until a tap anyway.
- **Sound toggle next to Pause:** a speaker icon in the board's top-left corner beside the pause button, with a slash while sound is off. 44pt, one tap from anywhere in the game, remembered between visits. The tap that turns it on also starts the audio (iPhones require a tap first).
- **Letting people know, without nagging:**
  - A quiet line under Play on the start screen, "Sound is off · Turn on", in the same style as Send feedback. Gone once you've chosen either way.
  - The first time you pop a block, the muted speaker gives one small wiggle: a hint that sound exists for moments like this. Once, no message.
  - Not one of Boop's tips: his two are for how to play.

## v1.2.2
- **What's new, for feature releases only** (hotfixes add nothing). A returning player sees the link beside Send feedback read "● New in 1.2" until they open it or start playing; on tall screens (tablets, desktop) Boop also says it in one line above his head, in place of the tagline. The What's new page (same style as How to play) lists each feature release with a picture per item. New players don't get the nudge: everything is new to them.
- How to play's "Things you'll meet" and the What's new page share one roomier layout: one column, the picture beside each title, the description underneath, hairlines between items, and a more solid backdrop so the board doesn't show through.
- To announce a future feature release: add one entry at the top of `WHATS_NEW` in game.js.
- If the game can't start (say, a cache serving a mix of old and new files right after an update), a plain panel explains and offers Reload; errors are shown, not swallowed, so a screenshot is a bug report.

- The start screen's "Sound is off · Turn on" line is gone: the speaker beside Pause does it, and How to play says so.
- Start screen footer is one quiet line: version · What's new · Feedback. The credit ("Boop! is made by Erik Sagen") moved to the end of How to play.
- A phone turned on its side pauses the game and shows "Boop plays best upright. Turn your phone to keep going." (Safari's bars leave too little height to play, and web pages can't lock rotation.) Turning back finds the pause screen. Tablets and desktops still play in landscape.
- A grey block knocked fully loose crumbles once it lands, so unbreakable rubble can never wall off a block you need to pop.

## Later
- **Haptics:** web pages can't vibrate on iPhone, so haptics wait for a possible App Store / Play Store release.

## Saving (first pass, in v1)
- The run is saved in the browser's local storage at the start of every turn: the physics world snapshot plus the game state. On return the start screen offers Continue.
- Game over and New game clear it. One save per browser; clearing site data loses it.
- Closing mid-shot goes back to before that shot (the shot isn't spent).
- Later: a version check so an update to the game can't load an incompatible save (today an unreadable save is just dropped); maybe a "Continue" summary (depth, shots left).

## v1.2.3
- **Hold to speed up.** While balls are flying, keeping a finger, the mouse button or Space down plays the turn three times as fast (same physics, more steps per frame), for a ball stuck looping between a block and the ceiling. Let go, the turn ends, or the game pauses: back to normal. The press that sped things up never turns into an aim or a shot.
- Boop mentions it once, after the first turn that runs longer than 10 seconds. How to play lists it as step 4; the keyboard line says "Space fires (hold it to speed up)".
- In a private tab (Safari, Firefox), Boop says once after the first zone that runs can't be saved there. Browsers throw a private tab's storage away when it closes.
- **Run summary** on game over, one quiet line under "You reached depth N": "38 blocks popped · 6 zones under par" (the par part only when there are any). Counted in the run's state, so it survives a save.
- **Add to Home Screen:** a web app manifest and Boop's face as the icon (180/192/512, plus a maskable one), so it opens full screen with no browser bars. Storage there is separate from Safari's.
- **Screen stays on while you play** (Screen Wake Lock). Paused, a screen up, game over or the tab hidden: released, and the phone's own timer applies again.

## v1.3 plan: keep the deep end fresh
Past depth 16 nothing new arrives (bombs at 15 and the last launcher upgrade at 16 are the last); only the numbers grow, and around depth 18–20 zones start to feel the same. The plan: something new every 3–4 zones through 30, landmark zones every 5 from 20, and bonus stages you earn. Everything builds on pieces that already exist, and each new thing gets one Boop tip.

| Depth | New | Builds on | What it adds |
|---|---|---|---|
| 13 | **Seesaw**: a long block with one nail in its middle | nails, resting blocks | tips when hit; whatever rests on it slides off; knock the nail out and it drops |
| 18 | **Hanging bomb**: a bomb on a vine in place of a chandelier block, over a short target block | vines, bombs | hit it twice and it bursts where it hangs; cut the vine and it bursts where it lands |
| 24 | **Split ring**: a ball through it splits in two for that shot | +1 rings, multishot | a burst of power against big numbers |
| 27 | **Block on rails**: slides along a short track when hit, then stays | resting blocks | opens and closes paths; still while you aim, so the guide stays exact |
| 30 | **Switch**: hit it and every grey block's nails pop, so they crumble | grey blocks | one clever shot clears the walls |

- **Landmark zones** every 5 from 20, built from known pieces, and Boop names them: 20 bomb field, 25 vine garden, 30 jelly maze, 35 the cave (grey channels and a switch); then they come round again.
- **Bonus stages**, earned: from depth 12, about one zone in four has a gold block. Pop it before the zone is cleared and the next stage is a bonus: 3 free shots (supply untouched), no depth, then on to the next zone. What you collect becomes shots, capped (about +8, tuned with bots); clearing it all adds a little. Three kinds, in turn: **ring run** (no blocks, mushrooms and windmills, lots of +1 rings), **piñata** (tiny 1–3 blocks, every 3 pops +1), **chain reaction** (bombs between low blocks, +1 per block the chain pops).
- **Challenge past 20:** slow the growth of block numbers and lean on layout (traps, tighter gaps, fewer rings) instead, so it's harder without just taking longer. Numbers from bot runs.
- **Build order:** 1) seesaw and hanging bomb (done in v1.3: seesaws from 13 in about half the zones, one nail just under the number, a weak pull back to level and a slippery top; hanging bombs from 18 in about half the chandeliers, always over a short target block. A heavy TON weight came first and was swapped for the bomb); 2) gold block and bonus stages (ring run first); 3) split ring, rails, switch; 4) landmark zones and the challenge retune.

- **Mid- and late-game things are surprises:** no What's new entry and no How to play listing; Boop's tip the first time each one shows up is the introduction. What's new is for things every player touches.

## Seasons
- The game dresses up around holidays, picked from the date on the player's device (a tiny script at the top of index.html sets `data-season` before anything draws). Rules never change; `?season=fall` or `?season=none` in the address forces one, for testing.
- **Fall / Thanksgiving** (Nov 1 to the Sunday after Thanksgiving): warmer paper, harvest block colours (still light to dark as numbers climb, same patterns), cranberry jelly, autumn vines, leaves drifting from popped blocks, one full leaf pile every third zone (1, 4, 7...) on the block with the widest open top, which flutters off when the block is hit and heaps up on the floor (for show only, never the physics), and a knit hat with a pompom for Boop. In Thanksgiving week the start screen says "Happy Thanksgiving!" before the best depth.
- **Christmas / winter** (Dec 1 to Jan 1, added in v1.3.3): crisp paper, mint and ice blue climbing to cranberry and pine (light numbers on the two darkest), icy jelly, snowflakes from popped blocks, a snow cap on one block every third zone that puffs off when hit and drifts into a bank on the floor, garland vines strung with little coloured lights, and a Santa hat for Boop. "Merry Christmas!" from Dec 18 to 26, "Happy New Year!" on Dec 31 and Jan 1. `?season=winter` forces it.
- **Later:** maybe New Year's and Halloween; the season system takes a palette, a crumb shape and a hat.

## v1.3.1: the retune
Measured with bots at two skill levels (random aim, and best of two aims). An average player now gets past 20–25; past 25 zones grow again a little each time, so the deep end ramps up.
- **New things keep coming:** windmills and cups 2, resting blocks 3, mushrooms 4, jelly 5, two balls 6, grey 7, vines 9, three balls 11, seesaws 13, bombs 15, four balls 16, hanging bombs 18.
- **Zone recipes:** each zone leans on one (plain, windmill garden, tower, pinball, jelly, grey maze, vines, seesaws, bombs), never the same twice running; a zone that introduces something stays plain. From depth 25 zones can mix two (about half of them from 30).
- **Variety in the blocks:** jelly in small, medium and large right after it's introduced; from depth 8 a block or two start hanging crooked from one nail; more resting blocks deep down; pieces try a few spots and take the snuggest, so L, T and S shapes interlock (more so deeper and in packed layouts).
- **Numbers read like size:** a zone's numbers are handed out biggest block first, so a small piece never shows more than a bigger one beside it (jelly keeps half, resting blocks a little less).
- **Par is a real target again:** fitted per depth band to an average player, beaten about a third of the time; it pays up to +5 shots.
- **Shorter deep zones:** numbers trimmed from depth 11 (more from 16) and growing slower past 16, so a deep zone is a few minutes, not five; past 25 they grow again for the ramp.
- **Calmer boards:** at most two windmills a zone (three only in an occasional windmill garden), at most three windmills and mushrooms together.
- **Deeper looks deeper:** the field darkens a step every 10 depths, like layers of earth.
- **Jelly feel:** inside jelly a ball still slows, but holds the line it came in on (only a touch of sag) and leaves the far side at full speed in that direction. Fixed a long-standing bug where a ball nicking a jelly's edge stayed marked as "inside" after the jelly shrank from the hit, crawling slowly until it faded.

## v1.3.2: optimization pass
- Measured first: the physics step is 40–66 µs, the aim guide ~4–6 ms (already spaced out on slow devices), zone build 13–28 ms. Drawing is the main cost on phones.
- **Nails drawn inside each block's shader** instead of as meshes of their own: about a quarter to a third fewer draw calls (e.g. 105 → 76 at depth 20) and ~30 fewer materials per zone. They look and behave the same (wear, tilt, jolt, pop spray).
- **Block numbers redraw at most every 50 ms** while a block is being hammered (the latest number always shows): fewer texture uploads.
- No allocations in the per-block, per-frame loop; dead code from the TON weight removed; the leaf shape shared between crumbs and leaf piles.
- Checked: memory flat across 26 zones, idle redraws ~10/s, aim guide exact, smoke 28/28.

## v1.3.4: bonus stages
- **Gold block** (from depth 12; always the first time, then about one zone in seven): a deep gold block that looks like metal: lighter at the top, a bevelled rim, twinkling flecks and a sheen that sweeps across now and then, plus a little white star in its corner. (The bevel is measured to each cell's outer sides, so joins between cells don't show a seam.) Pop it before the zone is cleared and the next stage is a bonus. Boop explains it the first time.
- **Bonus stage:** three free shots, one ball each (so aim matters), your supply untouched, no depth. The par box reads "Bonus · free shots, N left". Three kinds in turn:
  - **Ring run:** seven +1 rings, three wall mushrooms, a few sturdier little blocks.
  - **Piñata:** lots of little blocks; every five pops is +1.
  - **Chain reaction:** a row of bombs among little blocks; every four pops is +1.
- **Payout capped at +5**, plus +1 for clearing the whole stage; "Bonus +N" shows as the next zone comes in. Measured with random aim: 3–6, about 4.5 on average.

## v1.3.5: small comforts
- **Nails pop sooner:** a nail's strength grows slowly with its block's number and tops out at 10 hits (deep nails used to take 30–50). Bots: about half of nails pop from depth 6 on, up from about a quarter; end depth about the same.
- **Last shot:** three faint dashes from the launcher along the angle you last fired, shown while aiming (hidden when you're aiming right along them). Cleared on a new run.
- **Nearly-out nails:** a crack across the head on the second-to-last hit, two cracks on the last.
- **Reduce Motion** (the phone's setting) now reaches the board too: no screen shake, the gold block's sheen and star stay still, and leaves and snow drop without swaying or spinning.
- **Best depth on the pause screen:** under "Paused · Depth 12", a quieter "Best depth: 27", or "New best! (was 27)" in the accent colour once you've passed it. (Tried first as a note next to Depth in the top bar; it looked out of place there.)
