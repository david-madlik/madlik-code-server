# Clipboard investigation: Safari/iPhone

## Current device status

The owner currently reports that Explorer context menus work, but pressing the
terminal Paste helper does not show the system Paste confirmation. Direct reading
can remain pending until the 15-second timeout. The textarea dialog fallback works.
Earlier, the system Paste confirmation appeared but Explorer context menus were
blocked or disrupted. Do not reverse these observations or treat the earlier
standalone-page success as permanent clipboard permission.

The native keyboard accessory-bar background now follows the VS Code theme;
the owner confirmed the color-scheme change fixed that visual issue. The temporal
association with clipboard behavior is not proof that color-scheme caused it.

## Findings in the pinned VS Code source

- ExplorerView.onContextMenu awaits clipboardService.hasResources before showing
  the Explorer menu. BrowserClipboardService.hasResources calls clipboard.read.
  This can explain the earlier native Paste prompt before the Explorer menu.
  It does not by itself explain why the current terminal readText prompt is absent.
- BrowserClipboardService installs a Safari/WebKit deferred-write workaround on
  workbench click and keydown events. It prepares a clipboard.write request whose
  data promise is completed by a later writeText call. Interaction with pending
  reads is a hypothesis to investigate, not an established cause.
- The mobile terminal helper calls readText directly in a native click handler,
  stops click propagation, and keeps the button enabled and unchanged while
  waiting. Earlier diagnostics reported trusted=true, activation=true, secure=true,
  top=true and focused=true while the read still remained pending.
- The workbench is the top-level HTTPS document; its worker-extension iframe does
  not contain the helper. The tested page's clipboard-read policy was allowed.

## Relevant primary sources

- [WebKit async clipboard security model](https://webkit.org/blog/10855/async-clipboard-api/):
  native confirmation may be required; further interaction can reject a request.
- [WebKit issue 266569](https://bugs.webkit.org/show_bug.cgi?id=266569): intermittent
  missing Paste label in the iOS confirmation callout. This is related evidence,
  not an exact confirmed reproduction of this application's missing callout.
- [WebKit iOS implementation](https://github.com/WebKit/WebKit/blob/main/Source/WebKit/UIProcess/ios/WKContentViewInteraction.mm):
  _requestDOMPasteAccessForCategory shows the native menu; a replacement request
  denies the previous one. Touch begin, key handling, menu hiding and responder
  changes include paths that deny a pending DOM paste request. This is current
  upstream implementation; the device's exact installed revision is unverified.
- [VS Code Safari clipboard assessment](https://github.com/microsoft/vscode/issues/108349):
  custom Paste actions may need browser confirmation. This historical assessment
  does not establish the cause of the present behavior.

## Next diagnostic scope

Preserve the currently working Explorer menu. Compare clipboard read/write request
ordering and focus/menu events on an actual iPhone, using only operation names,
trusted/activation flags, timing and errors; never log clipboard contents. A/B-test
one suspected interaction at a time in an isolated instance. Do not disable the
Explorer precheck or global Safari workaround on the working instance based only
on the hypotheses above. Retain the textarea fallback while investigating.

The optional same-origin standalone diagnostic is documented in
[diagnostics/README.md](diagnostics/README.md). Its success can distinguish browser
access from workbench interactions but does not guarantee future direct reads.
