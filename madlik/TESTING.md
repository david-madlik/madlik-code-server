# Validation

Baseline: **code-server 4.141.0 / VS Code 1.141.0**. Validation date: **2026-10-14**.
Automated browser checks use Chromium/Playwright, isolated loopback code-server,
a temporary Git workspace and separate user/shared/extension data. They do not
modify working projects or their Git configuration.

## Automated coverage

| Suite | Coverage |
| --- | --- |
| `test-mobile.mjs` | 390×844 and 375×667 sections, native file/diff opening, Git stage/unstage, terminal process survival, native focus gate and helper keys; 1440×900 simultaneous desktop/mobile isolation, reload and layout restoration |
| `test-terminal-touch.mjs` | Real touch/scroll/inertia, SGR 1006 and 1016, missing-coordinate events, rejection of invalid gestures and no NaN input |
| `test-clipboard.mjs` | Native xterm word/range selection and both handles, touch and mouse Copy, closing/clearing on copy, enlarged × close, absence of Select All, persistent Paste with real clipboard and bracketed PTY input, pending request without disabling/changing the click target, rejected-read fallback, real browser Ctrl+V into the separate dialog, explicit bracketed paste, Cancel, reopening and mobile resize |
| `test-code-keyboard.mjs` | Exact raw PTY bytes for text, symbols, Ctrl/Alt, F1/F12, Shift+F5 and Ctrl+Left; Backspace/Ctrl hold and release; no label selection; grouped Native/Code switch and focus; actual light/dark theme selection; 375×667 fit; Monaco edit/delete; desktop input restoration |

The focused TypeScript check covers the changed production modules and imported
dependencies, not every upstream test. The server-web build produces 19 bundles
through upstream esbuild. Final browser suites reported no uncaught page exceptions.
The mobile quilt patch has also been removed/reapplied to verify reproducibility.

The final switch order is **Code/Native on the left, ⌨ on the right**. This last
presentation-only change was built and deployed with a health check; the same
switch behavior was exercised by the keyboard suite before that order change.
The owner then confirmed the arrangement on the phone.

## Running

Build and start the isolated preview using [README.madlik.md](../README.madlik.md),
then run these sequentially from the repository root:

```sh
node lib/vscode/node_modules/playwright/cli.js install chromium
node madlik/test-mobile.mjs
node madlik/test-terminal-touch.mjs
node madlik/test-clipboard.mjs
node madlik/test-code-keyboard.mjs
```

For repeatable raw PTY tests, use a fresh isolated user-data/shared profile per
suite. Stop the preview, archive `.madlik/user-data` and `.madlik/shared`, create
`.madlik/user-data/User`, retain its settings.json, and restart. Restoring terminals
from disconnected earlier test browser contexts can change the active PTY and
invalidate fixture setup. Do not reset production data or run concurrent suites
against the same profile.

For the focused typecheck:

```sh
lib/vscode/node_modules/.bin/tsc -p madlik/tsconfig.json --noEmit --skipLibCheck
```

Build/typecheck separately with a 4 GiB memory limit. The build requires at least
6 GiB available RAM including reserve. An early uncapped build/full-typecheck
combination exhausted VPS RAM and the OS terminated a Unity editor; subsequent
checks use caps. A complete upstream typecheck was not completed.

## Artifacts

All generated artifacts are ignored under `.madlik/`, including:

- `test-results.json`
- `test-terminal-touch-results.json`
- `test-clipboard-results.json`
- `test-code-keyboard-results.json`
- logs and `screenshots/code-keyboard-light.png`, `code-keyboard-375.png`,
  `direct-terminal-selection.png`

Result JSON files are written after the corresponding suite succeeds. Historical
logs from removed clipboard prototypes do not describe the current implementation.

## Device feedback and limits

The owner has tested the mobile UI on an iPhone and reported working selection,
copy and paste through the manual dialog, and a usable Code keyboard. Automated
checks do not prove all Safari/Brave behavior, physical keyboard repeat, actual
native dictation, zoom, orientation or safe-area combinations on iOS.

Raw-mode fixtures exercise the terminal input protocols used by interactive tools;
there is no complete automated interactive Codex CLI session on a physical iPhone.
Production commit/push operations in user projects are not part of the test suite.

Other unverified areas include all custom shortcuts, extension webviews,
synchronized profiles, moved custom view containers, every split-editor/Zen Mode
combination, full portable distribution packaging and updates to another upstream
release. No automated Safari/WebKit device suite is provided.

The persistent direct Paste button is covered in Chromium; Safari/iPhone clipboard
authorization and callout behavior still require a device trial.

Device follow-up: the owner reported successful direct Paste after confirming the
native Paste callout on the standalone same-origin diagnostic, and reported that
it continued to work after restarting the browser. The precise browser cause and
permission lifetime are unconfirmed.

The mobile layout suite now also checks editor and terminal header geometry at
390 × 844 and 375 × 667: toolbar above tabs, full-width tab row, content below the
entire title, and desktop editor toolbar/tab alignment before and after mobile
resize restoration. Screenshots capture both stacked headers.

Native-default follow-up: the keyboard suite now starts with Native, verifies focus
on opening it, switches to Code for real PTY input and holds, and checks that a
selection touching a key label is cleared. Existing clipboard/touch fixtures choose
Native explicitly only when necessary. Live smoke checks navigation Codicons and
English accessible labels.

Latest device feedback supersedes the earlier successful direct-Paste observation:
Explorer context menus currently work, but direct Paste may stall without a native
confirmation; textarea fallback still works. The owner confirmed the browser
color-scheme change fixed the native keyboard accessory-bar background. The
clipboard issue is open; see [CLIPBOARD.md](CLIPBOARD.md). Chromium results do not
establish Safari correctness, and no new clipboard fix is claimed in this checkpoint.

Latest follow-up: the owner reports direct Paste and Explorer context menus working
again without opening either A/B URL. The A/B experiment has no device result and
has been removed along with standalone manual diagnostics. Normal upstream
clipboard handling and regression suites remain; the intermittent cause is still
unconfirmed.
