# EvoLegal / Hugo — Audit and Cleanup Plan

## Honest diagnosis

The design isn't failing because of any one button. The problem is how we've been working. Over the last six rounds the button style flipped between gradient, white, black and back to gradient, and each round stacked new styles on top of the old ones without removing anything. So the app now has competing visual systems, and every fix shows up in some places but not others. Until that stops, more polish won't hold.

## 1. Visual identity: what looks cheap and what goes

What we found:
- The main stylesheet is 957 lines, with about 62 glass, glow and gradient rules and 20 animations.
- Five card and surface styles compete across about 30 screens (glass-card, glass-strong, surface-card, surface-bar, cyber-cta). So one card looks different from the next.
- The primary button has been redefined so many times that the styles fight each other. Different screens get different results.
- Blur shows up everywhere: bars, cards, drawers and chat. On a weak phone it looks muddy and runs slowly.
- The logo appears on 9 screens, in different sizes and with different effects. On the home page the big E and the navbar E compete for attention.

What we remove completely:
- Every glass style except one (used only for the top bar and pop-up panels).
- Glows on everything except the single primary button per screen.
- Decorative gradients on text, borders and cards. Gradient stays only on the main action button and the E.
- Multiple shadow levels. We keep one hairline border level and one raised level.

What we keep (your stated preferences):
- Dark background #0a0a12.
- Cyan-to-violet gradient with a soft glow on the one primary button per screen.
- The big slanted E on the home page, mobile included.
- Calm tabs and toggles.

## 2. Code bloat and dead ends

- Components nobody uses (safe to delete): ScalesOfJustice, SphereLoader, NavLink.
- Five overlapping loaders (EvoLoader, InitialLoader, InlineELoader, LoadingOverlay, HugoConsiliumLoader). We cut these down to two: the full-page E and Hugo's thinking signature.
- Very large files that do too many jobs: ExpertDashboard (1,194 lines), ExpertChat (634), McCloderPanel (557), HugoDemoBubble (502). Each gets split along its natural seams, with no change in behavior.
- 41 files load the animation library, even for simple fades. We switch simple fades and slides to plain CSS and keep the library only for real gestures and layout transitions. That makes the first download smaller on phones.
- The animated background is on 8 screens. It stays on the home page only. The working screens (dashboard, chat, settings) get a plain background.

## 3. Mobile ergonomics and layout

Root causes of overlaps:
- Three floating layers compete for the bottom corner: the Hugo demo bubble, the cookie banner and the bottom nav bar. Nothing coordinates them.
- Spacing is set one screen at a time with fixed padding, so headings and the logo crowd each other.

Permanent fix:
- One bottom-corner area that only one floating item can use at a time. The cookie banner shows first; Hugo's bubble appears only after it closes and sits above the bottom bar and iPhone home bar.
- Fixed spacing and text sizes shared by every screen, so headings never shrink below 15px of body text on a phone.
- Every tappable item is at least 44×44px. We check this automatically on a 402px screen across all main pages and fail the check if anything overlaps or gets cut off.

## 4. Sound on phones: the definitive answer

The facts:
- A browser only allows sound after you tap the page. We already listen for the first tap, so that part works.
- On iPhone, the ring/silent switch mutes web sounds completely. No code can override that. This is the most likely reason you hear nothing.
- iPhone also pauses sound when you switch apps or lock the screen, so it needs another tap to resume.

The professional fix:
1. When you turn Sound Effects on, a short confirmation chime plays right away. That tap both unlocks sound and proves it works.
2. If the browser still blocks sound, the setting shows a small "Tap to enable sound" hint instead of failing silently. One tap fixes it.
3. A short iPhone note under the switch: "Sound follows your silent switch."
4. We stop guessing in the background and keep one clear state: Off, Ready, or Needs a tap.

## Order of work (each step leaves the app working)

1. Delete unused components and extra loaders. Check: build and all 114 tests pass.
2. Merge all card and surface styles into one style system and remove the competing CSS. Check: screenshots of home, dashboard, chat and settings on phone and desktop, compared with the current version.
3. Coordinate the bottom-corner floating items and the shared spacing. Check: automated 402px test for overlaps and tap-target size.
4. Switch sound to the Off / Ready / Needs a tap states, with the confirmation chime. Check: works in the browser; you confirm on a real iPhone.
5. Split the oversized screens and move simple animations to CSS. Check: tests pass and the download size gets smaller.

I'll ask for your approval on how things look after steps 2 and 3, before going further.

## Technical details

- One surface system: tokens `--surface-0/1/2` and `--hairline` in index.css. Remove `.glass-*`, `.surface-*` duplicates and `.cyber-cta`; the `hero` button variant is the only gradient.
- Bottom-slot coordinator: one small context in App that keeps a priority queue (cookie banner, Prism, toasts) and sets offsets using `env(safe-area-inset-bottom)` and the bottom nav height.
- Sound: an `audioState` store (`off | locked | ready`). `enableSound()` runs inside the switch's click handler and plays the chime synchronously. If `ctx.state !== "running"` after resume, the state becomes `locked` and the hint appears.
- Playwright test: iterate routes at 402×725 and assert there are no intersecting fixed elements and that all interactive bounding boxes are at least 44px.
