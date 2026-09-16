# LaBye UX Contract

## Sources

| Area | Source |
|---|---|
| Assessment questions and scoring | Google Doc `Proposal_LaBye_Website`, section containing the 20-item stress assessment |
| Data ownership and privacy | `supabase/schema.sql` Row Level Security policies |
| Visual language | `DESIGN.md` and `assets/css/base.css` |

## Canonical Owners

| Capability | Owner | Contract |
|---|---|---|
| Form status and auth error copy | `assets/js/ui.js` | Thai inline status; raw backend messages are not shown |
| Form fields | Native HTML controls styled by `assets/css/auth.css` | Labels activate fields; app validation uses `aria-invalid` and associated errors |
| Dialog | `openModal`, `closeModal`, `bindCloseButtons` in `assets/js/ui.js` | Focus enters, stays inside, Escape closes, and focus returns to trigger |
| Assessment questions and levels | `assets/js/data.js` | Registration and retakes use the same 20 questions, five options, and thresholds |
| Stress history | `stress_tests` plus its owner-only RLS policies | Read and insert only; previous results cannot be edited or deleted from the client |
| Global scrollbar | `assets/css/base.css` | Mint themed standards-based scrollbar with native forced-color fallback |

## Registration Flow

1. The user completes email, password, faculty, and year.
2. The user answers all 20 assessment questions before account creation is available.
3. The review step shows the calculated result and lets the user edit answers.
4. One submit action creates the Auth account and receives a session immediately, then `complete_registration` writes profile and first assessment in one transaction.
5. Duplicate submission is blocked. A failed database write preserves form and assessment values so the user can retry.
6. Successful completion opens the result screen, then the board.

## Retake and History Flow

- The board always exposes “ประเมินอีกครั้ง” and “ดูประวัติ”.
- Retakes append a new `post` assessment; existing records remain unchanged.
- The board summary shows the latest level, score, and Thai-localized date.
- History is newest first and shows the score difference from the immediately preceding assessment.
- Loading, empty, and recoverable error states remain in the history surface.

## Board Ownership and Identity

- The board can be filtered to all posts, posts liked by the current user, or posts authored by the current user; mood and time filters continue to apply.
- Comments show only the author's selected fruit profile. Email, faculty, year, and user ID are never exposed in the comment response.
- Owners can delete their own posts and comments after an explicit inline confirmation. Database RLS remains the final authorization boundary.
- Deleting a post removes its comments and likes through database foreign-key cascades and removes the card from the board immediately.
- A successful post resets its submission state so another post can be created without reloading the page.

## Data and Failure Behavior

- Passwords and assessment answers are not stored in localStorage, sessionStorage, query strings, or logs.
- Only the score is placed in the result URL for presentation; the database remains the history source of truth.
- Confirm email is disabled for this prototype, so no assessment answers need to pass through Auth user metadata.
- Profile and first assessment are written through an authenticated database function after account creation.
