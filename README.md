# madlik-code-server

An experimental mobile UI fork of [Coder's code-server](https://github.com/coder/code-server),
based on code-server **4.141.0 / VS Code 1.141.0**.

On narrow browser windows (≤ 768 CSS pixels), switch between the native Explorer,
Source Control, editor and terminal using a bottom navigation bar. Each section
uses the available work area. The terminal also has touch buttons for Ctrl+C,
Esc, Tab and arrow keys. Wider windows retain the standard desktop interface.

This changes the VS Code workbench through a small patch in the existing quilt
stack. It is a custom distribution, **not a standalone VS Code extension**.
The editor, Git UI and terminal are the original VS Code components.

## Status

Early experimental implementation. Chromium viewport tests cover 390 × 844,
375 × 667 and 1440 × 900, native file/diff opening, stage/unstage, terminal process
survival, simultaneous desktop/mobile clients and desktop layout restoration.
Real iPhone keyboard and touch behavior still need validation. No standalone
production release packages are published yet.

Development used AI assistance. The validation performed and remaining limitations
are documented in [madlik/TESTING.md](madlik/TESTING.md); test results do not replace
testing on a real mobile device.

## Development

- [Fork setup and preview instructions (Czech)](README.madlik.md)
- [Architecture](madlik/ARCHITECTURE.md)
- [Mobile workbench patch](patches/madlik-mobile.diff)
- [Upstream documentation](docs/README.md)
- [Upstream contributing guide](docs/CONTRIBUTING.md)

The upstream license is preserved; see [LICENSE](LICENSE).
