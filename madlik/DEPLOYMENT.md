# Current VPS deployment and rollback

Deployment date: **2026-10-15**. These paths describe the current development VPS;
they are not a portable installer or a Git commit ID.

| Item | Current value |
| --- | --- |
| Release directory | `/opt/madlik-code-server/releases/ecd030e44847c8aa234409cfb43ee8bfb6259348` |
| Service / user | `code-server@david` / `david` |
| Backend listener | `127.0.0.1:18101` |
| systemd override | `/etc/systemd/system/code-server@david.service.d/20-madlik-fork.conf` |
| Configuration | `/home/david/.config/code-server/config.yaml` |
| User data/extensions | `/home/david/.local/share/code-server` |

The override starts the Node executable and entry point inside the release copy.
The running service does not depend on nvm, the development checkout or subsequent
preview builds. Release directories are root-owned and retained for rollback.
The release includes `LICENSE.simple-keyboard`.

Authentication and the existing project portal, Caddy, Tailscale, SSH and firewall
configuration were not changed by the mobile UI work. The original installed
`/usr/lib/code-server` remains available. No credentials or generated access files
are stored in this repository.

## Current behavior

The release includes English mobile navigation, 75% font scaling, native xterm
selection with Copy / enlarged ×, persistent direct Paste with a manual-dialog
fallback, and the compact theme-aware Code keyboard. The provider switch remains
left of the keyboard icon. The keyboard toggle and four helper arrows use native
VS Code Codicons with accessible English labels. Arrow buttons have zero padding,
center their icons in both axes and use a 0.6px icon stroke. The alignment check
passed at widths 375 and 390 px (center offsets below 0.01px), with screenshot
inspection. The keyboard icon is unchanged. The Code keyboard is now the last child of
the navigation panel, below section controls and terminal helpers. A preview
geometry check and screenshots at widths 375 and 390 verify that the keyboard
ends just above bottom safe-area padding and closes with the keyboard toggle. The floating clipboard probe and standalone diagnostic page were removed. The owner
reported working direct Paste after using that page, including after browser
restart. The precise Safari cause and permission lifetime remain unconfirmed.
The icon change passed the focused TypeScript check and the keyboard suite,
including real Ctrl+Left PTY input, repeats, provider switch, themes and desktop
cleanup.

Native is now the default keyboard provider. Bottom section buttons render
Explorer / Source Control / Code / Terminal Codicons with English accessible
labels and tooltips. The Code keyboard retains user-select:none and additionally
prevents native selection in capture-phase input handlers; only ranges touching
its key labels are cleared. The focused TypeScript check and keyboard suite passed,
including Native startup/focus, Code input, repeats, modifiers, selection clearing,
light/dark themes and desktop cleanup.

Mobile editor and panel title bars now put actions in the upper row and tabs in
the full-width lower row. The layout engine reserves both rows; Monaco, diff and
terminal content are laid out below them. The preceding stacked-title build passed focused TypeScript checking.
Its mobile suite verifies header geometry, file/Git/diff operations, terminal
process persistence, 390 × 844 and 375 × 667 layouts, and simultaneous desktop
plus desktop restoration at 1440 × 900. Earlier clipboard and keyboard suites
cover Paste and keyboard behavior. The reviewed source changes are recorded in the root Git repository through
the quilt patch. The build identity names the distribution independently of the root Git
commit.

## Return to the preceding fork build

Before removing the duplicate mobile footer gap, the systemd override was saved at:

```text
/opt/madlik-code-server/backups/before-remove-double-footer-gap-20261015/20-madlik-fork.conf
```

Restore that override, reload systemd and restart the service:

```sh
sudo cp /opt/madlik-code-server/backups/before-remove-double-footer-gap-20261015/20-madlik-fork.conf /etc/systemd/system/code-server@david.service.d/20-madlik-fork.conf
sudo systemctl daemon-reload
sudo systemctl restart code-server@david
```

This selects the retained preceding fork distribution and keeps current user data.
Restarting disconnects browser clients and may stop terminal processes.

## Return to the original installed code-server

```sh
sudo mv /etc/systemd/system/code-server@david.service.d/20-madlik-fork.conf /etc/systemd/system/code-server@david.service.d/20-madlik-fork.conf.disabled
sudo systemctl daemon-reload
sudo systemctl restart code-server@david
```

To enable the fork again, restore the `.conf` filename, reload systemd and restart.
The original pre-mobile configuration/data archive is root-only:

```text
/opt/madlik-code-server/backups/before-mobile-20261014/david-code-server.tar.gz
```

Ordinary binary rollback does not require restoring that archive. Restoring it
would overwrite newer user data.

## Browser color scheme trial

In mobile mode, html/body now receive the active VS Code theme's dark/light
color-scheme and editor background color. Theme changes update both immediately;
leaving mobile or disposing the contribution restores the previous inline values
and priorities. Focused TypeScript checking and an isolated Chromium test passed
for live Light Modern / Dark Modern switching and desktop style restoration.
The owner confirmed that this change fixed the iOS keyboard accessory-bar
background color. No theme-color meta, network, authentication or CSP settings were changed.

## Clipboard status and diagnostic cleanup

The owner now reports direct Paste and Explorer context menus working together
again without opening the A/B test links. The cause of earlier intermittent Paste
failures remains unconfirmed; the textarea fallback is retained.

The temporary A/B source changes were discarded, and the service was returned to
the accepted release 57a6dc4c649bd400035f883efae73c5f56d34149. The standalone clipboard
HTML/JS diagnostic files were removed from that active release and from the source
repository. No diagnostic page, badge or clipboard-test URL switch remains in the
active distribution. Regression-test scripts remain available. See
[CLIPBOARD.md](CLIPBOARD.md) for investigation notes, which make no fix claim.

## Wider terminal helper arrows

The current release redistributes the existing 7fr terminal-helper row: Ctrl+C and
Enter stay at 1fr, Esc/Tab/Paste use 0.75fr each, and four arrows use 0.6875fr each.
At 390px viewport width, arrows grow from approximately 24.7px to 34px; at 375px,
from 23.6px to 32.5px. Ctrl+C and Enter widths are unchanged. The capped build,
isolated geometry comparison and screenshot inspection passed at both widths,
including arrow centering. This CSS adjustment is included in the stabilized mobile UI checkpoint.

## Mobile panel control cleanup

The mobile stylesheet hides the panel global-actions container (close/maximize)
and the terminal title-toolbar separator item. Existing terminal actions remain
visible and align right. Desktop styles are unaffected. The capped build, preview
checks at 375/390 and desktop style restoration passed; live HTTPS smoke checks
also verify the controls/separator are hidden in the active terminal. This change
and the wider-arrow adjustment are included in the stabilized mobile UI checkpoint.

## Borderless mobile footer

The mobile navigation container now has zero top and bottom borders. Its button
styling is unchanged. Built and deployed directly at the owner's request without
running visual or automated tests for this adjustment. The owner subsequently reported improved stability and requested a Git checkpoint.

## Mobile footer top spacing

The initial reduction from 6px to 4px did not resolve the spacing reported on
the device. The floating workbench part already supplies a 4px bottom margin;
footer top padding is now zero to avoid adding another gap. Footer rows retain
their 4px gap, and side and safe-area bottom padding are unchanged. Built and
deployed without running tests, as requested by the owner; the owner subsequently
reported improved stability and requested a Git checkpoint.
