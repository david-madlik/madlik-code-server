# Mobile workbench architecture

## Integration boundary

The mobile UI is compiled into the existing VS Code workbench through
`patches/madlik-mobile.diff`, after code-server's upstream quilt patches. It uses
internal workbench services deliberately; it is not a portable extension API.
No proxy script injection, runtime edits to installed bundles, CSP weakening or
replacement Explorer/Git/editor/terminal is used.

The tested baseline is code-server 4.141.0 / VS Code 1.141.0. Review internal APIs
and rerun the UI tests when upgrading.

## Layout and client isolation

`MadlikMobile` uses `matchMedia('(max-width: 768px)')`, resize and visualViewport
events. Mobile mode and its section, keyboard provider and typing state live in
memory for the current browser window. `auto | on | off` commands remain in the
command palette; the navigation contains only Explorer/Git/Editor/Terminal and
the grouped keyboard control.

The layout service maximizes the selected native sidebar, editor or panel and
reserves the measured navigation/keyboard height. A snapshot retains desktop view
visibility, sizes and hidden-view caches; desktop sizes recorded before narrowing
are preferred over mobile grid sizes. Mobile changes do not persist mobile view
sizes or the active mobile container as desktop preferences. Restoration is queued
and generation-guarded against stale section switches.

File/diff opening switches Explorer or Git to Editor through editor service events.
Terminals are hidden between sections and are never killed by a section switch.

## Focus and device keyboard

`base/browser/mobileKeyboard.ts` maintains a WeakMap per Window. Native InputBox,
Monaco textarea/NativeEditContext and xterm inputs register themselves on creation
and unregister on disposal. Browsing sets `inputmode=none` and rejects text focus;
inputmode alone is not a reliable keyboard suppression mechanism on iOS. The last
attempted input target is remembered.

The grouped footer has the **Code/Native switch on the left and ⌨ on the right**.
The switch exposes `role=switch` and `aria-checked=true` for Native. ⌨ opens/closes
the selected keyboard. Changing provider while closed only selects a provider.
Native focus is restored synchronously during a user gesture. Touchend handles
provider switching, with compatibility-click deduplication; pointerdown preserves
the current input even when the target is a nested label/track span.

Switching sections returns to browsing. Leaving mobile restores original inputmode
attributes and native focus behavior. The indicator represents our typing state;
it cannot reliably observe the OS keyboard being dismissed independently. Extension
iframes/webviews are not included in the focus gate.

## Code keyboard

`MobileCodeKeyboard` wraps locally vendored simple-keyboard 3.8.194 (MIT), with ABC,
123, symbol and Fn layers, Ctrl/Alt latches and Shift. It initializes lazily on first
open. Leaving mobile destroys it and restores the previous `document.onpointerup`.
The vendored license/provenance and exact bundle SHA are recorded next to the source.
Four `innerHTML` assignments are replaced with `textContent`; labels are plain text,
so no Trusted Types policy or CSP exception is required. There is no runtime CDN
or speech API.

Printable keys, space and deletion use the library's 500 ms delay / 100 ms repeat.
A modifier snapshot is retained for the held key so Ctrl/Alt combinations do not
turn into plain letters during repeat. Capture release/cancel/blur listeners and
hide/deactivate stop holding, including after a shifted-layout rerender.
Navigation and key labels explicitly disable selection and touch callouts; this
scope excludes terminal text selection and the paste dialog.

Input routing uses the last visible registered input, native Monaco commands or
terminal services. Terminal targeting matches the remembered public xterm textarea
against terminal instances, falling back to activeInstance. `terminalCodeKey`
encodes printable/control text, application cursor mode, modifiers and F1–F12.
The terminal helper row participates in modifier routing while Code is open.

Editor support uses Monaco typing/deletion/cursor commands and explicit common
Ctrl and default function-key commands. Arbitrary user keybindings and extension
webview inputs are not hardware-keyboard emulation; Native remains available.
Ordinary input fields use `setRangeText` and their normal input event.

## Terminal selection and clipboard

`TerminalTouchSelection` attaches to each opened xterm. A 450 ms hold selects a
word through public buffer/select APIs; xterm's renderer draws the selection.
Two touch handles adjust it, selecting the nearest handle when hit areas overlap.
Touch selection/clipboard controls do not emit mouse input into the TUI. Moving
more than 10 px becomes scrolling with a short inertia phase; a short unselected
tap is replayed through xterm mouse handling. Mobile sticky command headers are
hidden because their overlay intercepts selection gestures.

Copy prefers a synchronous native copy event with a scoped clipboard payload,
then falls back to Clipboard API. On success it closes the menu and clears the
selection; failure retains the selection and reports an error. Clipboard controls
handle real touch gestures rather than relying on compatibility clicks after a drag.

The context menu is selection-only: Copy and an enlarged × to clear/close selection. Paste lives in the persistent
terminal helper row. Its native click handler starts `navigator.clipboard.readText`
synchronously before any asynchronous work, then sends the result through public
`raw.paste`. A terminal/controller WeakMap routes to the active terminal without
DOM lookups. While pending, repeated requests are ignored, but the button stays enabled,
focused and visually unchanged; no modal or focus change hides
the browser's authorization callout. A generation guard cancels stale results.

Denied, empty or unanswered (15-second timeout) clipboard reads open a native HTML
dialog outside xterm. Its ordinary textarea supports the browser's Paste action.
Only **Paste into terminal** sends the reviewed value; Cancel/Escape sends nothing.
Late clipboard results cannot paste after the timeout. The field is cleared on
reopening. There is no clipboard polling or simulated Shift+Insert. xterm handles
bracketed paste and line endings without an extra Enter. The dialog is outside the
terminal to avoid terminal focus, gesture and context-menu interception.

## xterm scroll compatibility

The pinned `@xterm/xterm` 6.1.0-beta.304 emits inertia CHANGE events without
clientX/clientY. Under SGR mouse reporting this can send NaN coordinates into
interactive TUI input. `terminalTouchCoordinates.ts` captures the terminal's
**internal** `-xterm-gesturestart/change` events, retains valid coordinates and
rejects positionless gestures. The selection adapter also supplies valid coordinates
when forwarding scroll gestures. These event names are update-sensitive; remove
the workaround if upstream fixes it. No dependency distribution file is patched.

## Font scaling and theme

Window-local MobileFontScale applies a factor of 0.75 to native editor and terminal
font metrics and triggers layout recalculation. MobileFonts derives scoped font CSS
from loaded workbench stylesheets through CSSOM: absolute font sizes are scaled,
relative sizes inherit the smaller base. User settings and original stylesheets
are unchanged. Extension iframes/webviews and arbitrary extension inline fonts are
not universally covered. Leaving mobile restores the original metrics.

Code keyboard colors use live VS Code theme variables. Key geometry is separate
from font scaling: navigation retains touch-sized controls and Code uses compact
38 px keys. Layout tracks visualViewport and safe-area insets for device keyboards.

## Mobile title bar rows

The multiple-editor-tab title uses CSS grid for an actions row above the full-width
native scrolling tab strip. `MultiEditorTabsControl` reserves two tab heights in
mobile mode and keeps its tab strip horizontally scrollable even when desktop tab
wrapping is configured; no user setting is changed. The group relayout propagates
title height changes to Monaco and diff editor dimensions. Desktop keeps its normal
height and wrapping behavior.

The panel title uses the same actions-first structure. `PartLayout` reserves two
title rows only for `Parts.PANEL_PART` while the window's mobile layout is active.
The panel title receives its computed height through a CSS variable, so fixed
upstream title CSS cannot compress the two rows. The panel composite bar measures
its lower row independently of the toolbar width,
so labels have the full row. Sidebar titles and desktop part dimensions retain
their existing behavior. Existing toolbar actions and native tabs stay in their
owned DOM nodes; CSS changes their placement rather than cloning controls.

The Code keyboard is appended after the section buttons and grouped provider/toggle
control. Its full-width grid row is the bottommost navigation child, immediately
above the existing device safe-area padding. Showing/hiding it uses the existing
window-local layout reservation; native keyboard mode is unchanged.

Native is the default provider; choosing Code remains a window-local switch. The
four section controls render native Codicons (files, source-control, code, terminal)
with English aria-labels/tooltips rather than visible text. Code keyboard selection
is prevented in capture pointer/touch/selectstart handlers before shifted layouts
rerender, in addition to scoped user-select:none CSS. A selectionchange guard clears
only ranges touching Code keyboard labels, leaving editor/terminal selection alone.

The contribution subscribes to IThemeService for mobile browser color-scheme and
html/body background synchronization. It uses actual theme colors (not CSS vars
scoped to the workbench), snapshots inline values/priorities on entering mobile,
and restores them on desktop/disposal. This requests matching native browser
control colors; iOS accessory bar appearance is still controlled by the OS/browser.
