# Motion & Animation Rules

1. **Animate Everything That Changes**: To ensure Keynote-level visual fidelity, you MUST animate all changing properties (width, height, top, left, colors, scaling, opacity, etc.). 
2. **FLIP Technique for Transitions**: When dealing with layout changes across states, utilize the FLIP approach (Measure Initial -> Measure Final -> Invert via Transforms -> Play/Animate) where appropriate to maintain performance.
3. **High-Fidelity Over Minor Reflow Concerns**: While avoiding reflows is generally a good practice, in this presentation engine, *visual fidelity takes absolute priority*. If animating `width`/`height`/`top`/`left` is required for a smooth, Keynote-like transition, you must animate it.
4. **Debounced Storage**: For high-frequency interactions (dragging, resizing), state serialization to IndexedDB must be skipped or debounced to maintain a smooth 60fps framerate.
