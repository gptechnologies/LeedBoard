# Well Kept interface review

Review date: 2026-09-13. Mode: **full**, using [Make Interfaces Feel Better](https://github.com/jakubkrehel/make-interfaces-feel-better/blob/main/skills/make-interfaces-feel-better/SKILL.md) as a rubric and `DESIGN.md` as the product-specific authority. Framework: Next.js 16, React 19, Tailwind 4, substantial plain CSS, Radix, Framer Motion, and Lucide. The scope is the public entry and authentication path, homeowner app, cleaner app, invited-cleaner response, and checkout outcomes. Static legal pages and internal admin tools are outside this customer-facing pass.

This is a **potential-change list**, not a claim that every authenticated state was visually tested. The public screens were checked in a local browser at 390×844 and 320×720. Authenticated screens and data-dependent states were inspected in source because this review did not create users, jobs, bids, or payments in the configured database. Existing image files were used as design references only, not as evidence of the current rendered app.

## Screen-by-screen coverage

| Screen | Evidence | Potential changes |
| --- | --- | --- |
| `/` landing | Browser at 390px and 320px; `app/page.tsx` | F11: shorten or rebalance the long mobile hero. |
| `/login` role chooser | Browser at 390px; `components/auth/auth-role-chooser.tsx` | No specific change from this pass. |
| `/login?role=CUSTOMER` and `?role=CLEANER` | Homeowner in browser; both variants in `components/auth/otp-start-form.tsx` | F9: enlarge small public navigation links; cleaner variant still needs a live check. |
| `/signup?role=CUSTOMER` and `?role=CLEANER` | Both in browser at 390px; homeowner also at 320px | F9 applies to header links; the main input and CTA were comfortably sized. |
| `/verify` | Browser at 320px with a fictitious address; `app/verify/page.tsx` | F8: make “Send a new code” visibly secondary; F9: enlarge text-link hit areas. |
| `/verify-contact`, `/welcome` | Source: `app/verify-contact/page.tsx`, `app/welcome/page.tsx` | No specific change from source; live layout and error-state check pending. |
| `/onboarding/homeowner` | Source: `app/onboarding/homeowner/page.tsx`, `components/onboarding/homeowner-onboarding-flow.tsx` | No specific change from source; live step transitions pending. |
| `/customer`, `/customer/jobs` | Source: both pages and `components/marketplace/homeowner-jobs-workspace.tsx` | F4: visible multi-job navigation; F6: reduce long-running radar motion; F10: tabular position count. Both routes render the same workspace. |
| `/customer/jobs/new` | Source: page, `components/marketplace/simple-job-request-form.tsx`, post route | F1: remove or complete photo upload. Entrance motion should be checked in a live signed-in session. |
| `/customer/jobs/[id]` | Source: page, `components/marketplace/homeowner-open-job-card.tsx` | F5: shared route motion; no additional screen-specific change from source. |
| `/customer/jobs/[id]/bids` | Source: page, bid card and provider selection drawer | F3: confirm and dismiss buttons use the 32px shared button variant; check their rendered size in a live session. |
| `/customer/jobs/[id]/priority` | Source: page and existing `market-*` styles | No specific change from source; selected/focus states need a live check. |
| `/customer/messages` | Source: page and `components/marketplace/homeowner-messages-inbox.tsx` | F9: search button is 43px at common mobile widths. |
| `/customer/messages/[bidId]` | Source: page and `components/marketplace/message-composer.tsx` | F2: dead options button; F7: unexplained jump to SMS; F9: header controls; F12: unsupported response-speed claim. |
| `/customer/account` | Source: page, form, and account CSS | F3: 36px stepper controls. |
| `/customer/my-home` | Source: page and `components/marketplace/home-presets-manager.tsx` | No specific change from source; add/edit/delete states need a live check. |
| `/customer/bookings/[id]` | Source: page | No specific change from source; live data-state check pending. |
| `/checkout/success`, `/checkout/cancel` | Source: both pages | No specific change from source; payment states were not triggered. |
| `/cleaner` with jobs | Source: page, feed, swipe deck, and CSS | F4: visible multi-job navigation; F5: shared route motion. |
| `/cleaner` with no jobs | Source: searching-state component and CSS | F6: reduce long-running radar motion. |
| `/cleaner/jobs/[id]` and bid drawer | Source: page and `components/marketplace/fast-bid-drawer.tsx` | No specific change from source; price, loading, error, success, and drawer motion need a live check. |
| `/cleaner/messages` | Source: page and `components/marketplace/activity-screen.tsx` | No specific change from source; segmented and expanded states need a live check. |
| `/cleaner/messages/[bidId]` | Source: page and coordination summary | No specific change from source; completion state needs a live check. |
| `/cleaner/account`, `/cleaner/account/passed-jobs` | Source: both pages, settings form, and passed-jobs disclosure | No specific change from source; live settings and notification states pending. The “Save defaults” submit button inherits a 48px global minimum. |
| `/invite/cleaner/[token]` | Source: page and response form | No specific change from source; a valid invite was not opened. |

`/cleaner/bids` redirects to `/cleaner/messages` and is not a separate screen.

## Rubric coverage

| Category | Evidence inspected | Result |
| --- | --- | --- |
| Typography | Public mobile screenshots; heading, counter, and form styles; `DESIGN.md` | F10, F11. Existing tabular prices and balanced headings are good foundations. |
| Surfaces | Public mobile screenshots; shared buttons, stepper, auth controls, drawer, and card CSS | F3, F8, F9. Core card radii and elevation generally follow the design contract. |
| Animations | Route shell, homeowner broadcast, cleaner search, form entrance, CSS reduced-motion rules | F5, F6. Motion was not replayed at 10% speed in authenticated screens. |
| Icons | Lucide usage, nav selection, conversation header, upload and stepper controls | F2. No systemic icon stroke mismatch was established from source alone. |
| Performance | Transition declarations, carousel track, `will-change`, reduced-motion rules | F5, F6. No runtime performance trace was taken. |

## Findings

### Misleading or nonfunctional feedback

| Severity | Location | Before | After | Why |
| --- | --- | --- | --- | --- |
| **HIGH · F1** | `components/marketplace/simple-job-request-form.tsx:294`; `app/customer/jobs/create/route.ts:28` | “Add photos” lets users select files and shows a selected count, but the input has no `name` and the post route does not persist photos. | Either implement attachment validation, upload, persistence, and review; or remove the photo control until that path exists. | Selection looks like successful attachment, so the posted request can silently omit information a homeowner expected cleaners to see. |
| **HIGH · F2** | `app/customer/messages/[bidId]/page.tsx:54` | “Conversation options” is an enabled button with no handler or menu. | Give it real actions or remove it. | A tappable control that does nothing makes the conversation feel broken. |
| **HIGH · F7** | `components/marketplace/message-composer.tsx:9`; `app/customer/messages/[bidId]/page.tsx:90` | The composer says “Send message,” but submitting opens the device SMS app with a draft. The in-app conversation does not gain a new message. | If SMS is the intended path, label the action “Open SMS,” explain that the user finishes sending there, and do not imply the in-app thread will update. Otherwise build in-app messaging. | The action and resulting state differ from what the chat-shaped UI promises. |
| **MEDIUM · F12** | `app/customer/messages/[bidId]/page.tsx:52` | Every provider is labelled “Responds quickly” without a response-time field or condition. | Derive the statement from measured response data, or use neutral provider metadata. | An unsupported trust cue can mislead someone choosing a cleaner. |

### Hit areas and navigation

| Severity | Location | Before | After | Why |
| --- | --- | --- | --- | --- |
| **MEDIUM · F3** | `components/ui/button.tsx:25`; `components/marketplace/provider-selection-drawer.tsx:113`; `app/customer/homeowner.css:3565` | The provider-selection drawer's confirm and dismiss buttons use the shared 32px default size; account steppers expose 36×36px targets inside a 48px row. | Give these app-facing buttons and steppers a minimum 44×44px target, keeping the visible icon/button shape if desired. Confirm the drawer's computed size in a signed-in browser. | Both the skill and `DESIGN.md` call for touch targets around 44px; the current controls are harder to hit. |
| **MEDIUM · F4** | `app/customer/homeowner.css:1014`; `components/marketplace/nearby-job-swipe-carousel.tsx:140`; `components/marketplace/cleaner-jobs-feed.tsx:155` | Homeowner multi-job arrows are hidden; cleaner jobs expose a count and swipe/keyboard movement without visible previous/next controls. | Show restrained 44px previous/next controls when there is more than one job, while retaining swipes and dots. | A count indicates more jobs but does not make the next action obvious or equally available to every input method. |
| **LOW · F9** | `app/customer/homeowner.css:1173`; public `/verify` at 320px | Customer message header controls are 43px. In the live verification screen, “Change email address” measured 22px tall, and header “Sign In” measured 36px. | Extend the interactive boxes to 44px without enlarging the visible glyphs or text. | Small controls are easy to miss on touch screens. |

### Motion and hierarchy

| Severity | Location | Before | After | Why |
| --- | --- | --- | --- | --- |
| **MEDIUM · F5** | `components/marketplace/role-swipe-shell.tsx:66` | Every pathname change enters with a 20px slide or 8px lift, exits with a slide, and the active-nav selection uses a spring with bounce. | Keep routine tab changes static or use a brief opacity cue; reserve directional movement for a true spatial transition. Use the existing reduced-motion behavior as the baseline. | Repeated navigation motion conflicts with `DESIGN.md`’s restraint rule and compounds with screen-specific entrances. |
| **MEDIUM · F6** | `app/globals.css:2605`; `app/cleaner/provider.css:1067`; `app/cleaner/provider.css:1179` | Homeowner “Notifying Cleaners” and cleaner “Searching for jobs” run multiple infinite radar/status animations for as long as the state persists. | Let the animation play once or briefly on a real status change; then keep the status legible and still. Preserve the current reduced-motion fallbacks. | An ordinary waiting state may last minutes. Continuous motion repeatedly pulls attention without conveying new information. |
| **MEDIUM · F8** | `app/verify/page.tsx:85`; `app/verify/page.tsx:104`; `app/globals.css:6635` | The live `/verify` screen displays both “Verify email” and “Send a new code” as filled green submit buttons, despite the latter’s `secondary-submit` class. Its plainer heading also breaks the visual sequence from sign-up. | Make resend a quiet text/outline action and align verification typography and spacing with the preceding auth card. | Two primary-looking actions compete at the point where the user should enter the code. |
| **LOW · F10** | `components/marketplace/homeowner-jobs-workspace.tsx:98`; `app/customer/homeowner.css:1009` | “1 of 3” uses proportional numbers as the selected job changes. | Add `font-variant-numeric: tabular-nums` to the position label. | Keeps the carousel position from shifting a few pixels. |
| **LOW · F11** | `app/page.tsx:34`; live `/` at 320px | The hero headline occupies six lines and pushes the explanation and second audience action toward/below the first viewport. | Try a shorter headline or a slightly smaller mobile type scale while keeping the editorial serif treatment. | A tighter wrap lets both audience actions appear sooner without sacrificing readability. |

## Considered but rejected

| Location | Candidate | Rejected because |
| --- | --- | --- |
| `app/globals.css:3662` | Apply the skill's exact 0.96 press scale everywhere. | `DESIGN.md` specifies 0.975 and the existing system already provides tactile feedback; changing the value alone would reduce consistency. |
| `components/marketplace/simple-job-request-form.tsx:151` | Remove all post-form entrance motion. | The post screen is a focused, infrequent task. The current staged entrance may help its hierarchy; it needs a live 10%-speed check before removal. |
| `app/cleaner/provider.css:157` | Remove the carousel track's `will-change: transform`. | This is a continuously dragged transform surface, where compositing may be justified; runtime profiling would decide it. |

## Verification and verdict

The local Next.js server rendered `/`, `/login`, both sign-up roles, the homeowner login form, and `/verify` with a fictitious address. Mobile screenshots were inspected at 390×844 and 320×720. The verification screen's button appearance and touch-box dimensions were confirmed from the live DOM. Source review covered the route and component files named above and checked that the photo flow has no upload persistence. The Playwright CLI wrapper could not fetch its package because the npm registry was unreachable, so the local browser was driven through the available computer-use browser instead.

**Not verified:** authenticated screens with real job/bid data; hover, focus, active, loading, error, empty, and completion states across those screens; reduced-motion rendering; and animation playback at 10% speed. Those checks should accompany implementation before any finding is considered closed.

**Verdict under the skill's rubric: Block** while F1, F2, and F7 remain. This is a UI-review classification, not a deployment or security assessment. The next implementation pass should resolve those misleading controls first, then touch targets and navigation, then motion and low-level polish.
