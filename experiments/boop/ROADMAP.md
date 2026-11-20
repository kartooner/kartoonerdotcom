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
- The block buddy (mascot): breathes, blinks and looks around, wiggles when tapped
- Tips in order: every new thing gets a callout pointing at it the first time it shows up; the buddy's tour covers the basics (launching, hits, nails, then the rest), one at a time; How to play trimmed to a short reference
- Clearing a zone gives +5 shots through depth 10

## v1.2
Tester feedback on controls (mouse and phone):
- **No dead window between shots:** today input is ignored until every block stops moving (up to 3s, longer with hanging blocks). Let you start aiming as soon as the balls are gone; the guide updates as things come to rest, and the shot waits until the board is ready. Gently swinging blocks shouldn't hold up the turn.
- **Point-to-aim with a mouse:** drag-anywhere works on a phone, but with a mouse people expect to point where they want to shoot. On a mouse, the launcher follows the cursor and a click fires; touch keeps drag-anywhere.
- **A way to cancel:** drag back to where you started and the guide fades (letting go there doesn't fire); Esc or a right-click also cancels on desktop without pausing.

Sound:
- **Sound:** a soft "boop" on hits, a pop when a block breaks, a chime for +1, a zone-clear sting.
- **Haptics:** light taps on hits and pops on phones that support it.
- **Mute:** a sound on/off toggle that's always within reach and remembered between visits. Haptics follow the same toggle or get their own.

## Saving (first pass, in v1)
- The run is saved in the browser's local storage at the start of every turn: the physics world snapshot plus the game state. On return the start screen offers Continue.
- Game over and New game clear it. One save per browser; clearing site data loses it.
- Closing mid-shot goes back to before that shot (the shot isn't spent).
- Later: a version check so an update to the game can't load an incompatible save (today an unreadable save is just dropped); maybe a "Continue" summary (depth, shots left).
