# Smooth, coherent neural background

## Outcome
The existing neural background remains visually unchanged in placement and palette, but moves smoothly and connects predictably without visible snapping.

## Changes
- Seed nodes with balanced spatial distribution instead of random clustering.
- Give each node a stable local neighborhood and update link strength continuously, preventing connections from abruptly appearing or disappearing.
- Use bounded, low-frequency motion so nearby points drift together rather than jitter independently.
- Keep signal pulses attached to valid links and recycle them without sudden jumps.
- Preserve mobile performance, reduced-motion behavior, and the rest of the page exactly as-is.

## Verification
- Compare multiple frames on the phone viewport to confirm smooth movement and stable connections.
- Check reduced-motion output and ensure the preview remains error-free.
