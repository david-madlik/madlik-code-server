# madlik-code-server

A mobile UI fork of [Coder's code-server](https://github.com/coder/code-server),
based on **code-server 4.141.0 / VS Code 1.141.0**.

Use the original VS Code Explorer, Source Control, editor, diff editor and terminal
on a phone, with one working section filling the available area and a touch-friendly
navigation bar. Windows wider than 768 CSS pixels retain the desktop layout.
This is a custom code-server distribution, not a standalone VS Code extension.

## Mobile controls

- **Explorer / Git / Editor / Terminal** switch between native workbench sections.
  Opening a file or Git diff switches to Editor. Switching sections preserves
  terminal processes and closes the keyboard.
- **Code** is the default keyboard: compact ABC, 123, #+= and Fn layouts, Ctrl,
  Alt and F1–F12. There is no desktop numeric keypad. Holding printable keys,
  space or deletion repeats input; releasing or hiding the keyboard stops it.
- The bottom keyboard control combines a **Code / Native switch on the left**
  and **⌨ on the right**. The switch selects the keyboard type; ⌨ opens/closes it.
  Native uses the device keyboard, including its own dictation where available.
- Keyboard colors follow the current VS Code theme, including light/dark changes.
  Mobile workbench, editor and terminal fonts use 75% of their configured size
  without rewriting settings. Touching the editor or terminal does not open the
  device keyboard automatically.
- Terminal helpers provide **Ctrl+C, Esc, Tab, ← ↓ ↑ → and Enter**. The four arrows
  each use half a regular button's width; Enter stays on the far right.
- Long-press terminal text to select a word. Drag the two handles to adjust the
  native xterm selection. **Copy** writes to the device clipboard, closes the menu
  and clears the selection. Ordinary touch drags scroll the terminal/TUI.
- **Paste** opens a regular text field in a separate dialog. Use the device's
  native Paste action (or Ctrl+V / ⌘V), review the text, then choose
  **Paste into terminal**. Cancel sends nothing; confirmation adds no Enter.
  Automatic clipboard reads and simulated Shift+Insert are not used.

The mobile UI is in English. The built-in keyboard uses a locally bundled
[simple-keyboard](https://github.com/hodgef/simple-keyboard) 3.8.194 (MIT), with
plain-text labels. There is no runtime CDN, Web Speech API or added speech service.

## Status and limitations

This is an experimental fork used on a Debian VPS. Automated Chromium tests cover
390 × 844, 375 × 667 and 1440 × 900, native file/Git/diff operations, terminal process
survival, clipboard selection/paste, keyboard input/repeat, theme switching and
mobile/desktop layout restoration. The owner has also tried the UI on an iPhone
and reported working selection, copy and dialog paste; this is not a complete
Safari/device compatibility test suite. See [validation and limitations](madlik/TESTING.md).

The Code keyboard routes input to native VS Code components. Arbitrary customized
editor shortcuts and extension webview inputs are not fully emulated; switch to
Native when needed. Browser clipboard permissions and native iOS keyboard UI
remain controlled by the browser/OS. No standalone release packages are published.

## Development

The workbench changes live in [patches/madlik-mobile.diff](patches/madlik-mobile.diff)
and use the existing quilt stack. The pinned VS Code submodule is not a separate
fork that needs to be pushed. CSP and the installed system code-server files are
not patched at runtime.

- [Setup, controls and isolated preview](README.madlik.md)
- [Architecture and update-sensitive APIs](madlik/ARCHITECTURE.md)
- [Tests and validation record](madlik/TESTING.md)
- [VPS deployment and rollback](madlik/DEPLOYMENT.md)
- [Upstream documentation](docs/README.md) and [contributing guide](docs/CONTRIBUTING.md)

Development used AI assistance. The upstream license is preserved in [LICENSE](LICENSE);
the keyboard license and local adaptation are included in the mobile patch and
copied into preview/release distributions as `LICENSE.simple-keyboard`.
