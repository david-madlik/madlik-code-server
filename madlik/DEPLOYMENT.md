# Current VPS deployment and rollback

Deployment date: **2026-10-14**. These paths describe the current development VPS;
they are not a portable installer or a Git commit ID.

| Item | Current value |
| --- | --- |
| Release directory | `/opt/madlik-code-server/releases/41d769b81d10bf41b9194740364f0c5cd591dc48` |
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
selection with Copy, a manual Paste dialog, compact theme-aware Code keyboard with
hold/Ctrl/Alt/Fn, and the grouped keyboard control with the provider switch on the
left and ⌨ on the right. Automatic clipboard reads, Shift+Insert and the earlier
terminal snapshot/clipboard toolbar are not part of the current UI.

Validation is summarized in [TESTING.md](TESTING.md). The final keyboard-control
order change was a source build plus service health check; earlier behavior checks
covered the switch itself. The owner has since tried the mobile UI on the phone.
The source is published through the root repository's quilt patch; a build identity
hash names the deployed distribution independently of the root Git commit.

## Return to the preceding fork build

Before the final order change, the systemd override was saved at:

```text
/opt/madlik-code-server/backups/before-keyboard-switch-order-20261014/20-madlik-fork.conf
```

Restore that override, reload systemd and restart the service:

```sh
sudo cp /opt/madlik-code-server/backups/before-keyboard-switch-order-20261014/20-madlik-fork.conf /etc/systemd/system/code-server@david.service.d/20-madlik-fork.conf
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
