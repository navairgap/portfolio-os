# window manager regression checklist

Check that opening an app creates and focuses one window; closing the focused window selects the topmost visible window; closing the last window leaves the desktop usable; minimized windows cannot receive focus until restored; workspace switches hide inactive windows from keyboard focus; drag and resize stay within the viewport; maximize and restore preserve geometry; and reduced-motion preferences disable nonessential transitions without disabling functionality.

## Z-order invariants

Every visible focused window should be above other visible windows, and focusing or restoring a window should update its stacking order exactly once. Minimizing or closing a window must clear it as the active focus target before selecting the next eligible visible window. Repeated focus events must not produce duplicate window records or unbounded z-index changes. Include cases for two windows with equal initial z values and for restoring an older minimized window.

## Focus restoration

When a window is closed or minimized, move focus to the next eligible visible window or back to the desktop control that opened it. Restoring a minimized window should make it eligible for focus again. Verify that hidden workspaces do not retain keyboard focus and that modal dialogs return focus to their invoking control when dismissed. Keyboard navigation must not become trapped inside a window that is no longer visible.
