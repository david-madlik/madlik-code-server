# Temporary standalone clipboard diagnostic

Two static files, with no workbench scripts, styles, custom touch handlers or iframe.
The native click handler calls readText immediately. It leaves the page unchanged
until success, rejection or the 15-second diagnostic timer. It displays only context
flags, error information and character count; clipboard text is never displayed,
transmitted or persisted.

For the temporary VPS trial these files were copied into the running fork release
under `madlik-diagnostics/`, served by the existing `/_static` route through the
existing authenticated `/code/` gateway. No proxy, authentication or service config
changes, new ports or process restarts are needed. This test is not part of preview
build staging; a later release will not automatically include it.

The owner reported that confirming the native Paste option on this standalone page
also enabled the workbench Paste button, including after restarting the browser.
This is a device observation, not a guarantee of permission lifetime. The floating
workbench test button was removed; this standalone page is retained as a fallback.

Latest device report: direct Paste has stopped working again while Explorer context
menus work. The page is a diagnostic/fallback aid, not a guaranteed persistent
permission grant. See [the current investigation](../CLIPBOARD.md).
