# Boop! roadmap

## v1
- Crayon bits when a block pops
- Next zone comes up as soon as the last block pops
- Pause (button, Esc or P, and automatically when the tab is hidden)
- Keyboard play: ← → aim (Shift for fine aim), Space or Enter fires
- No card on /games while it's in active testing

## v1.1
- Nails on pinned blocks, so it's clear what can tumble; the nails pop out when a block is knocked loose
- Resting blocks drop into place as a new zone slides in
- Ball fuse: a ball greys as it goes without hitting a block, and brightens again on a hit
- The block buddy (mascot): breathes, blinks and looks around, wiggles when tapped

## v1.2
- **Sound:** a soft "boop" on hits, a pop when a block breaks, a chime for +1, a zone-clear sting.
- **Haptics:** light taps on hits and pops on phones that support it.
- **Mute:** a sound on/off toggle that's always within reach and remembered between visits. Haptics follow the same toggle or get their own.

## Saving (first pass, in v1)
- The run is saved in the browser's local storage at the start of every turn: the physics world snapshot plus the game state. On return the start screen offers Continue.
- Game over and New game clear it. One save per browser; clearing site data loses it.
- Closing mid-shot goes back to before that shot (the shot isn't spent).
- Later: a version check so an update to the game can't load an incompatible save (today an unreadable save is just dropped); maybe a "Continue" summary (depth, shots left).
