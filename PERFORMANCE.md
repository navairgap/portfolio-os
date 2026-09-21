# PERFORMANCE — 60fps window manager

Drag/resize use pointer capture + direct DOM mutation: during pointermove the element's
transform/width/height are written imperatively (translate3d), keeping work on the compositor thread.
Zustand state (x/y/w/h) updates exactly once on pointerup — zero re-renders during the gesture.
Refs hold cursor offsets and pending rects. No mousemove listeners; no top/left animation.

Other: localStorage writes debounced 200–300ms; matrix rain capped 30fps (15fps as wallpaper)
and paused on document.hidden; DPR capped 1.5; apps lazy-loaded via React.lazy + Suspense;
boot renders lines via setTimeout chains yielding between phases; sounds gated by
visibility and reduced-motion.
