# madlik-code-server

- Vlastní fork code-serveru, základ v madlik/upstream.json; vstupní dokument README.madlik.md.
- Zachovat upstream strukturu. Mobilní integraci držet jako malý samostatný quilt patch.
- Nikdy neupravovat systémový /usr/lib/code-server, existující služby, Caddy, SSH, Tailscale
  nebo firewall bez výslovného zadání pro nasazení.
- Nezasahovat do ostatních projektů ve working ani do jejich Git konfigurace.
- Vývojový server spouštět pouze izolovaně s vlastním config/user-data/extensions,
  dočasným workspace a loopback listenerem; nepoužívat upstream výchozí port bez ověření.
- Neoslabovat CSP. Nepřidávat runtime injekci přes proxy ani křehké DOM selektory.
- Zachovat desktop a klientskou izolaci; mobilní layout nesmí přepsat uložený desktopový stav.
- Nepovažovat Git merge ani sestavení za ověření mobilního chování.
- Nepublikovat ani nenasazovat výsledek bez zadání. Stav implementace a ověření uvádět pravdivě.
