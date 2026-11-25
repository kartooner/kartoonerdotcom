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
- **Fall / Thanksgiving** (Nov 1 to the Sunday after Thanksgiving): warmer paper, harvest block colours (still light to dark as numbers climb, same patterns), cranberry jelly, autumn vines, leaves drifting from popped blocks, one full leaf pile every third zone (1, 4, 7...) on the block with the widest open top, which flutters off when the block is hit and heaps up on the floor (for show only, never the physics), and a knit hat with a pompom for Boop. In Thanksgiving week Boop says "Happy Thanksgiving!" on the start screen (in the tagline until 1.5).
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
- **Best depth** stays on the game-over screen only (as before). Tried a note next to Depth in the top bar, then a line on the pause screen; both cluttered the UI.
- **Hit stop:** a blink of stillness when a big block (5+ squares) pops (45 ms), a bomb goes off (60 ms) or a nail pops (30 ms); never twice within a quarter second, so chains don't stutter.
- **Pop streaks:** from the third block popped in one turn, a "×3", "×4"... floater that grows a little each time. (The pop sound already climbs in pitch through a turn.)
- **Last balls speed up:** 4 s into a turn, once only one or two balls are left, the game eases up to 1.8× by itself. Holding still speeds it up 3×.
- **Fix:** hand-lettered floaters longer than a few letters ("Hits ×2", "Bonus stage next!") were cut off at both ends; their canvas now fits the text, and they're kept inside the field.

## v1.4: move the launcher
Moving the launcher lets you pick your angle, so you can be more precise against the dynamic blocks. Version label goes to v1.4.
- **Move the launcher:** two ways, so dragging out the guide from the launcher still aims. **Tap it** and it's picked up: a sketchy rail with ticks (far left, centre, far right and steps between) and ‹ › arrows show, the next drag anywhere slides it, and letting go puts it down. Or **press on it and slide sideways** along the top and it moves straight away (a drag that heads down aims, as before). Mouse: click it, move, click to put it down (or press and slide sideways). Keyboard: Alt (Option) + ← → (Shift for small steps). It stays put between shots and is saved with the run.
- **First-time hint:** sketchy ‹ › arrows beside the launcher until you've moved it once (remembered on the device). Hidden while Boop is talking.
- **Start spot:** back in the top-right corner (0.62 in from the wall), moved down a touch (y −0.7, was −0.62). It can go anywhere from 0.62 off either wall.
- **Aim range follows the launcher:** near a wall, shots on that side stop at about 40° below flat (in the corner they used to go nearly flat into the wall, which a tester found awkward); with 2.6+ cells of room, nearly flat. The guide starts wherever the launcher is.
- **Guide inks in:** the dots draw faint (38%) while the aim is moving and fill in to full ink (90%) once it's held steady for about a tenth of a second, so you can feel the aim settle. Boop's own take on a guide that firms up when you commit (no laser line).
- **Touch to aim:** on touch the launcher turns right at your finger the moment it lands and follows it as it moves; lifting fires. A quick tap (under 0.15 s, no slide) only aims, and the guide stays up. Slide off the board and let go to cancel. Replaces "drag anywhere" (aim by drag direction, cancel by dragging back), which testers found fiddly to pinpoint. Finer aim now comes from touching further down the board. (A slow-finger fine aim was tried first; it made the aim drift away from the finger, so it went.)
- **Pause and sound off the board:** the game pauses by itself when you switch apps or tabs (or the window loses focus); Esc and P still pause. **Menu**, centred under the board while playing, opens the pause screen (it took the "Boop!" wordmark's spot). **Settings** (a link on the start/pause screen) is a full screen with a Sound switch ("Turn sound effects on or off."); M still toggles sound. The first-pop speaker wiggle went with the speaker.
- **Tried and dropped: an open top.** Holedown-style, the first ball out the top would set the next launch spot. With Boop's light gravity balls float back out within 1–3 s instead of bouncing for 13–33 s, a shot does 10–40× less, and the bots' runs ended at depth 4 instead of ~30. It would need a full rebalance (many balls per shot, much smaller numbers), so dragging the launcher came instead.
- **Deploy note:** the Pages build for the 1.4 merge picked up the previous commit (1.3.5), so 1.4 didn't go live until the next commit on main.

## v1.4.1 (hotfix)
- **Home Screen app picks up updates:** an app added to the Home Screen (or a tab left open) resumes the page it already has, so it never saw 1.4. The game now asks the server for the current build on start and whenever it comes back to the front (at most every 10 s). If it's newer, it saves the run and reloads, but only while a screen is up (start, pause, game over; leaving the app pauses), never mid-play. Tried once per build, so a stale cache can't loop.
- **Fix: aiming right after picking up the launcher.** Tapping the launcher picked it up, and the next touch always slid it, so tapping where to shoot did nothing (only a drag aimed afterwards). Now, once it's picked up, the next touch only moves it if the finger slides; a touch that doesn't slide aims as usual (hold and lift fires, a quick tap only aims). Mouse unchanged: click to pick up, click to put down.
- **What's new icons:** Touch to aim gets a tapping finger (it had the mouse arrow), and Menu and Settings a cog (it read as a sun).
- **Checked: hold to speed up vs touch to aim.** They never compete: holding only speeds up while balls fly, touching only aims between shots. A hold that lasts past the end of a turn doesn't fire when lifted; a quick tap mid-shot does nothing lasting; the next touch aims and fires as usual.
- **Fix: the rail stays while you move the launcher.** After tapping the launcher, the rail behind it went away as soon as you started dragging. It now stays up from pickup until you let go, and also while sliding the launcher straight from a press on it.
- **Retune for the new aim range.** With no more shots flat into a wall, each shot counts for more. Bots (12 seeds each, random aim and best of two, 1.3 vs 1.4): casual about the same (median 12.5 → 14), average about 3 zones deeper (22 → 25.5). Moving the launcher itself adds almost nothing at the same number of tries. Fewer shots for clearing a zone barely moved it, so block numbers are about 10% bigger from depth 11 on, with par eased a touch from 12 to 25 so it's still beaten about a third of the time. Now: casual 13.5, average 22.5; depths 1-10 unchanged.

## v1.5: Relaxed mode
From watching a tester's kids: they loved popping blocks when the board was simpler. Relaxed mode is a switch in Settings.
- **Its own run.** Turning it on parks the regular run exactly where it is (saved at the last turn); Play then starts or continues the Relaxed run. Turning it off brings the regular run back untouched. Each mode is saved separately, so handing the game to a child and back is one switch each way. A small "Relaxed mode" label under the tagline says which run Play picks up.
- **Simpler zones:** no grey blocks, vines (so no hanging bombs), seesaws, crooked pre-hung blocks, gold blocks or +1 rings. Windmills, mushrooms, cups, jelly and bombs stay. No grey-maze, vine or seesaw recipes.
- **Smaller numbers:** 60% of the regular game's.
- **Shots never run out:** the counter shows ∞, there's no par, and no game over. Relaxed runs don't count toward the best depth.
- **Fewer interruptions:** Boop's tips about new things are skipped (and stay unseen, so the regular game still introduces them). The launcher upgrade note still shows.
- Bots with random aim: zones take about 4–10 shots, about two minutes each, through depth 20.
- How to play mentions it; What's new has a 1.5 entry.
- **Holiday greeting from Boop:** "Happy Thanksgiving!" (and the Christmas and New Year lines) moved out of the tagline, where it crowded the start screen, into Boop's speech bubble above him. Start screen only, not a mid-run pause, and only where there's room (screens at least 620px tall); a What's new line takes the bubble first. Same dates as before. In Relaxed mode the tagline is the short one, so the label fits. Also fixed the start and game-over speech bubbles' tail: it sat 3px off the bubble and didn't wobble with it, so it looked detached. More room under the bubble for a holiday hat.
- **Leaves (and snow) on the floor stir:** a ball skimming the heap kicks the nearest leaves up, harder the faster it goes, and a bomb going off near the floor scatters them; they flutter and settle back. Visual only, as before: as physics bodies they'd slow the aim guide (which runs a copy of the board) and deflect balls. About a thousandth of a millisecond a frame. No idle breeze, so a still board still drops to its low frame rate.
- **Fix:** Boop's What's new line had a taller last line, where the "See what's new" link sits (the link's padding stretched it). The lines are even now; the tap area is unchanged.
- **Depth milestones:** as a zone slides in, a small hand-drawn pennant (notched at one end, same outline as the speech bubbles) fades in over the top of the board, holds, and fades out after about 2.5 seconds: "New best!" the first time a run goes past your best depth (once it's 5 or more), and "Depth 25!", "Depth 40!", "Depth 50!". Nothing to tap, nothing paused (the earlier best-depth notes in the top bar and pause screen cluttered the UI). Relaxed mode gets the milestones only. Testers reach about 30–40, so this gives long runs something to aim for. Not in What's new.
- **Surprise stages (not in What's new or How to play):** little bonus games between zones, a reward for deep runs (gold blocks give earlier players their bonuses): after clearing depth 25 (pachinko), 30 (topple tower), 35 (mini golf) and 40 (hoops), then a random one every 5 zones from 45 (never the same twice running). First built with stages from depth 10; moved deeper so they stay a reward for going deep. Every bonus stage (these and the gold-block ones) has a slightly different background: the faint hatching low on the board becomes a crosshatch and reaches a little higher. Each has its own shots and a cap on what it pays. Not in Relaxed mode. All survive closing the app mid-stage. Paid in tests (30–40 random or 16 aimed runs each): topple tower about 2–5, golf about 2 with random aim and about 5 aimed (after making it harder), pachinko about 9 (2–12), hoops about 3 random and 9 aimed. More free shots means deep runs go a little longer; watch for that.
  - **Tries, like a carnival:** the first time a stage comes up in a run you get plenty of tries to get the hang of it (pachinko 4 drops, topple tower 4 shots, golf 4 tries, hoops 6 shots); each time it comes back deeper in the run, one fewer, down to 2 (3 for hoops). Boop's intro says how many. Random aim pays less each visit (pachinko about 7, then 5, then 3.5).
  - **Arcs:** on golf, hoops and pachinko the ball is slowed down and floats, so shots fly in clear arcs, and the aim guide shows the whole arc up to the first thing it hits. Topple tower keeps the normal fast ball and guide. A ball through a hoop makes its net stretch down, sway and spring back (a swish).
  - **Test link:** `?stage=golf` (or `pachinko`, `tower`, `hoops`) on the game's address starts a fresh run right at that stage, as if the depth before it was just cleared (with four balls a shot and 30 shots). It keeps its own save, so a real run is left alone, and never counts toward the best depth. Not in Relaxed mode.
  - **Topple tower** (replaced a domino run that felt too rigid: fat grey blocks in a grid, a hidden push to keep them falling, the same layout every time): one to three towers, different every time, stacked the way a child stacks blocks: storeys of two pillars (2 or 3 tall) and a plank across, 3 or 4 wide, with something on top (a little block, a bar, a small stack); now and then one stands on a grey ledge higher up. A lone tower is always a tall one. Ordinary resting blocks in the usual colours, but with no number, and they don't break: here you knock them over. A hit shoves a block where it lands, so hitting high topples, hitting low knocks the legs out. Each block that tips well over or drops a good way is +1, up to 10. Three shots (Boop: "Topple the towers: three shots."). Random aim knocks over about 2–3, an aiming bot about 5; about 14 seconds a stage. No hidden help: just the physics. Tower hits don't keep a ball going (it fades as usual), so turns stay short. Board tips about resting blocks don't show on these stages. **Fix (1.5-33):** in 1.5-32 a tower's blocks were left in the next zone; they can't be broken, so that zone could never be cleared (found by the bot study: every run stopped at 31). They now go with the stage, and a save carrying them has them cleared on load.
  - **Mini golf:** a little green hill standing in the water, somewhere new each time anywhere along the bottom (from sketches), shaped like a bell curve: a soft round top, sides that curve in, and long feet flaring out under the water, each side spreading a little differently so no two match; its foot is under the water, which is drawn see-through so the submerged part shows, tinted. Its top levels off into a small flat spot where the hole sits. The hill is drawn the way blocks are, so the bonus stage looks like it belongs with everything else (and like a child's drawing): green with the zigzag pattern and the same crayon-grained edge, a bright green in dark mode too, the way blocks keep their colours. The hole is cut into its top: a dark oval whose back tucks behind the hill's top edge, with a strip of green over the front of its rim, and the flag standing in it (only the hole shows: what matters is the ball going in). Everything stays inside the board's frame, the rings too; under it (not drawn) a bowl catches the ball, and a ball that drops in goes out of sight. The hill's outline is what the ball rolls on. Ledges up top get in the way, and more often than not a small one hangs right over the hole, so dropping straight down on it doesn't work; a notched flag standing in the hole, and a ledge or two up top in the way. Balls fall for real and roll; land on the green and sink it: +8 first try ("Hole in one!"), +6, +4. A sunk ball drops into the hole and disappears (it doesn't bounce back out), and the stage ends. A ball that misses the green or rolls off lands in the water and that try is gone: a plop, a few drops, and rings spreading out on the water from where it went in; the ball floats sitting about half in the water (the see-through water is drawn over its lower half), with white foam rings, ink-edged and sized to it, just below the water's top line and spreading a little way every few tenths of a second; floating leaves drift aside round it (circles seen side-on: flat, passing behind the ball and round its front, a darker blue-grey than the water), then fades. Leaves (and snow) on the floor float up onto the water for the stage (any landing on the hill slide off it into the water), in a loose layer that bobs and drifts; a ball plopping in flips the nearest ones up and pushes the rest out with the ripple, and a floating ball nudges any it drifts into. After the stage they sink back onto their heap. The bobbing keeps the board drawing during this stage only. Miss all three: +1 for trying. Dropping straight down onto the hole works, and that's fine. First version was a flat green across the floor: nearly every shot rolled around until it found the hole. Now random aim pays about 2, an aiming bot (best of 6 tries in a copy of the game) about 4.5: usually in on the second or third try, sometimes all three in the water.
  - **Hoops:** three or four baskets scattered across the board, drawn in crayon like everything else (from a sketch): an oval orange rim seen a little from above and a net hanging from it as a funnel of crossed strokes (light on the dark board); no backboard, and two or three grey blocks to bank shots off (their nails never come out); now and then a mushroom on a wall for a lucky bounce. Five shots, one ball each, falling for real. A ball through a basket from above is +2, once per basket per ball, so one good ball can drop through two; up to 10. A ball is done after 7 seconds at most. Random aim pays about 3, an aiming bot about 10 (the arc makes good aim pay). First version was one basket sliding side to side, which didn't work: it held still while you aimed and moved once you shot.
- **No more walls deep down** (a tester stopped at 66 on a zone they could barely dent: 16 shots for 15% of it against a par of 19). Three things made it: grey pieces and windmills across the top of the zone formed a lid that kept shots off the blocks, nothing gave when a zone dragged, and numbers kept climbing.
  - Grey pieces stay out of a zone's top two rows, at most four a zone; the grey-maze and windmill-garden layouts no longer combine.
  - Catch-up: a zone that's clearly a wall (a full par used and under 40% done, or half as much again and under 70% done) gets hits ×2 from then on, the same "Hits ×2" as the last few blocks. A bad layout is slow, not hopeless; ordinary over-par zones aren't touched.
  - Block numbers stop growing at depth 45 (they'd crept up about 35 a zone); deeper than that the layouts and the bonus stages carry the challenge.
- **UI polish pass** (from an audit on an iPhone 13, an iPhone SE and desktop, light and dark):
  - Fixed: the game-over screen's Feedback link ran into the links along the bottom on small phones (menu screens now centre without ever overflowing them, and the game-over screen tightens up on short screens); the links row wrapped with a stray "·" (now one line: What's new · Settings · Feedback; the version is on the What's new page); outline buttons were see-through on the pause screen (now solid).
  - Calmer: the numbers along the top and any tip bubble hide behind menu screens; pausing shows a smaller title.
  - One word per thing: Feedback, Menu, What's new (it gets a dot when there's something new instead of changing to "New in 1.5"). Settings descriptions are short and plain: Sound "Blips when you hit blocks.", Relaxed mode "Easier zones, endless shots." (that your regular game waits is plain once you switch) Game-over stats one per line.
  - Hand-drawn: the settings switches and the progress bar get the crayon edge the buttons have.
  - Buttons run the full width of each screen's column.
  - Play screen: two hand-drawn glyphs under the board while you play: a menu glyph (three lines) on the left and a moon or sun on the right (it shows where a tap takes you: moon in light mode, sun in dark). Games is on the menu screens, where leaving mid-run takes a deliberate tap; dark mode is also a switch in Settings. The board leaves room for them above the iPhone home bar (the safe area), so they never sit on its frame. "This zone / par" is just "Par". "4 balls per shot" shows for two zones after each upgrade, then the top bar is three numbers. (The ‹ › hint beside the launcher already goes for good once you've moved it.)
  - Uniform exits: Settings, How to play and What's new have just "← Back" (their ✕ did the same thing); the ✕ stays only on the pause screen (close and keep playing), not the start screen, where it was the same as Play. Game over gets the same links row as the start and pause screens (What's new · Settings · Feedback); from there Back returns to game over and the big button says Play again. Settings has lines only between its rows (none under the heading or above Play). Every setting has a one-line description (Dark mode: "Easier on the eyes at night."); Relaxed mode's is "Easy zones, endless shots." so all three fit on one line on an iPhone 13 (on an SE all three wrap alike).
  - Links: every text link underlines alike (1.5px line, 3px below the text, at any size); the arrow on ← Back and ← Games sits outside the line.
  - Sizes: the top bar's labels never wrap (smaller on narrow boards); on desktop the top bar sits right beside the board.
- **Cleanup pass (no change in play):** removed unused code (golf leftovers, a doubled scene add, the never-shown "Boop!" mark under the board and its styles, CSS rules overridden later, test hooks nothing used), shared what was repeated (the big button's words, keyboard aim start, screen positions, bomb recolouring on a theme change, note placement), and cut comments down to what the code needs: tuning history lives here, not in sim.js. Checked: six bot runs to depth 68 match the old build move for move, and every screen, bonus stage and theme switch runs without errors.
- **Laps: endless, in a sense.** Past 80 the game isn't a wall that only gets steeper. At 81 it eases back to about depth 30's difficulty (zones about a quarter smaller: still a challenge, not punishing) and builds back up to depth 80's by around 120, holding there to 160; then it eases again, and so on: room for another 80, and another. The bonus stages start over each lap (the same schedule from 105: pachinko, tower, golf, hoops, then random every 5) with generous tries again. The depth shown, the best depth and the launcher (four balls a shot) follow the real depth; only how hard a zone is follows the lap. Banners: "Depth 80!", then "Lap 2!" at 81, and every 40 after (120, 160, …).
- **Pachinko bonus (a surprise: not in What's new or How to play):** a board of staggered nails and nine pockets along the floor paying +1, +2 and +1 (the edge pockets, where the walls steer balls, pay nothing). Drops of five balls from the launcher (move it and aim before each; each ball after the first goes a little its own way), 4 drops the first time. Balls fall for real and gently and end in a pocket. Pays up to 12, about 7 on a first visit. Earlier versions: one drop of eight (over too soon), then catch cups part-way down that released two more balls (dropped: they didn't make sense). Not in Relaxed mode. Survives closing the app mid-stage.
- **Tried and dropped:** capping the under-par shots back at 3 (from 5) past depth 30. Bots with the depth limit raised to 80: strong ones ended about 3–6 zones sooner (median 64.5 → 58.5), average ones unchanged. Testers end around 30–40, so it would only have cost them a zone or two; worth revisiting if people start reaching 50.
