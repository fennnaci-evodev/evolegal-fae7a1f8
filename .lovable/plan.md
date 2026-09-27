# Refine the mobile navigation

## Goal
Replace the oversized, raw mobile dropdown with a compact, polished navigation panel while leaving the page, desktop navigation, and neural background unchanged.

## Changes
- Keep the existing logo, theme control, audit action, and navigation destinations.
- Turn the menu into a contained glass panel below the header with a tighter two-column link layout.
- Add clear selected, pressed, and keyboard-focus states using the existing cyan/purple theme tokens.
- Use a subtle backdrop and short open/close motion; disable motion when reduced-motion is preferred.
- Make the close/menu control and sign-in action feel consistent with the existing button system.
- Verify the result at the current phone size and confirm the menu does not obscure or overflow the viewport.

## Technical details
- Update only `src/components/Navbar.tsx` and the menu-specific styles in `src/index.css`.
- Preserve existing routes and authentication behavior.
- Use semantic color tokens and existing UI controls; no page-content or business-logic changes.
