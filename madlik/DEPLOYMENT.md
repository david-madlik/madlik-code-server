# Nasazení na VPS

Nasazeno 2026-10-14 namísto původního code-serveru.

- Release: `/opt/madlik-code-server/releases/7a5b0a227b215d7422a4ba70f9b7e52dc2e755b4`.
- Běží stejná služba `code-server@david`, uživatel david, interní port `127.0.0.1:18101`.
- Vlastní ExecStart je v `/etc/systemd/system/code-server@david.service.d/20-madlik-fork.conf`.
- Služba používá Node dodaný v release a nezávisí na nvm ani vývojové pracovní kopii.
- Konfigurace: `/home/david/.config/code-server/config.yaml`.
- Data a rozšíření: `/home/david/.local/share/code-server` (původní data).
- Přihlášení, portál projektů, Caddy a Tailscale zůstaly v původní konfiguraci.
- Release je vlastněný rootem; další preview build nepřepisuje nasazenou kopii.
- Originální systémový balíček `/usr/lib/code-server` zůstává dostupný pro rollback.

Před přepnutím byla zastavena služba a vytvořena záloha její konfigurace a dat:
`/opt/madlik-code-server/backups/before-mobile-20261014/david-code-server.tar.gz`.
Archiv je dostupný pouze rootovi. Jeho obnovení by přepsalo novější data; pro obyčejný
návrat na původní binárku není potřeba.

## Návrat na původní code-server

```sh
sudo mv /etc/systemd/system/code-server@david.service.d/20-madlik-fork.conf /etc/systemd/system/code-server@david.service.d/20-madlik-fork.conf.disabled
sudo systemctl daemon-reload
sudo systemctl restart code-server@david
```

Rollback používá původní balíček a aktuální uživatelská data. Restart odpojí editory
a může ukončit terminálové procesy. Pro opětovné nasazení forku vrátit název souboru
na `.conf`, provést daemon-reload a restart služby.

## Aktualizace ovládání klávesnice

2026-10-14: Enter na konci terminálové řady a stálé tlačítko `⌨` pro přepnutí
prohlížení/psaní. Nasazeno po izolovaném sestavení, typové kontrole a Playwright
scénářích; žádné změny přihlášení nebo síťové konfigurace.
Předchozí release `e070b58cc143a4904d64bb3c62e63b0a0ba3b4c9` zůstává zachovaný.
Předchozí systemd drop-in je v
`/opt/madlik-code-server/backups/before-keyboard-20261014/20-madlik-fork.conf`.
Pro návrat pouze k předchozímu forku obnovit tento drop-in, provést daemon-reload
a restart služby; data editoru se neobnovují ze zálohy.
