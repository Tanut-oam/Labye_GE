# LaBye Design Context

## North Star

LaBye should feel like a quiet, friendly corner on campus: warm enough to invite honest reflection, clear enough that a stressed student never has to guess what happens next.

## Product Character

- Thai-first, calm, private, and supportive.
- Soft paper surfaces on mint backgrounds, with warm yellow accents and color-coded feelings.
- Plain language, short actions, and visible recovery when a network request fails.

## Visual System

- Runtime tokens live in `assets/css/base.css`; feature styles must consume those variables.
- Noto Sans Thai is the primary typeface. Body text stays at a readable 15–16px with generous Thai line height.
- Cards use rounded paper surfaces. Primary actions use `--mint-deep`; warnings use `--danger` and always include text.
- Motion is brief and functional. `prefers-reduced-motion` removes nonessential transitions.

## Interaction Principles

- One clear primary action per step.
- Long tasks show progress and preserve completed answers while the page remains open.
- Authentication secrets remain only in password fields and are never written to URL or browser storage.
- Every async mutation blocks duplicate submission, keeps its action width stable, and shows a persistent status message.
- Assessment history is private to the signed-in owner and ordered newest first.

## Accessibility

- Controls use native buttons, links, fields, and fieldsets with visible labels.
- Keyboard focus remains visible; dialogs trap focus, close with Escape, and restore focus.
- Selected and status states use text or ARIA in addition to color.
- Important touch targets aim for 44px, and layouts reflow to one column on narrow screens.

## Content Boundaries

- Assessment wording and score thresholds come from the maintained project proposal.
- Results support self-reflection and do not present a medical diagnosis.
- High stress results keep the 1323 mental health helpline visible.

