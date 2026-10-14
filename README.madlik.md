# madlik-code-server

Vlastní distribuce code-serveru s mobilním rozhraním **madlik-mobile**.
Používá existující Explorer, Source Control, editor, diff editor a terminál VS Code.
Projekt není nový editor ani samostatná univerzální VS Code extension.

## Aktuální stav

Repozitář je založený na upstream release **v4.141.0**, stejném jako pracovní instance na VPS.
První mobilní integrace je v [patches/madlik-mobile.diff](patches/madlik-mobile.diff).
Používá skutečnou šířku okna, nativní workbench služby a dočasné rozložení bez změn nastavení.
Testovací build používá samostatnou kopii distribuce na localhostu; není to produkční vydání.
Na tomto VPS byl fork na výslovné zadání nasazen místo původního editoru;
podrobnosti a rollback jsou v [madlik/DEPLOYMENT.md](madlik/DEPLOYMENT.md).
Systémový balíček, přístupové údaje a síťová konfigurace zůstávají nedotčené.

## Ovládání

- Automatická aktivace při šířce ≤ 768 CSS px, reakce na resize a orientaci.
- Spodní navigace: Soubory / Git / Editor / Terminál.
- Soubory a Git používají původní sidebar přes celou pracovní plochu.
- Otevření souboru nebo diffu přepne na Editor.
- Terminál se při přepínání neruší. Pomocná řada nabízí Ctrl+C, Esc, Tab a šipky.
- Tlačítko `⋯` nabízí automatický režim, ruční zapnutí/vypnutí a paletu příkazů.
- V paletě jsou příkazy `Madlik Mobile: Automaticky`, `Zapnout` a `Vypnout`.
- Ruční volba platí pro aktuální okno do obnovení stránky; neukládá se jako společné nastavení.

## Izolovaný náhled

Po inicializaci submodulu a aplikaci patchů potřebuje preview Node.js 24 a závislosti:

```sh
git submodule update --init --depth 1
quilt push -a
npm ci --ignore-scripts --no-audit --no-fund
npm --prefix lib/vscode ci --ignore-scripts --no-audit --no-fund
npm --prefix lib/vscode/build ci --ignore-scripts --no-audit --no-fund
bash madlik/build-preview.sh
bash madlik/start-preview.sh
```

Preview vyžaduje instalovanou základní distribuci **4.141.0** v `/usr/lib/code-server`,
případně cestu v `MADLIK_BASE_DISTRIBUTION`. Všechny úpravy sestaveného kódu se provádějí
jen v `.madlik/runtime`. Preview používá vlastní config, data, sdílené úložiště,
extensions-dir a testovací Git workspace. Poslouchá pouze na **127.0.0.1:18110**.

Build se spouští pod limitem 4 GiB RAM přes uživatelský systemd; požaduje alespoň
6 GiB dostupné paměti včetně rezervy. Současně nespouštět další kompilace.
Náhled je anglický upstream workbench s českou mobilní navigací, sestavený bez NLS
optimalizace. Úplné distribuční balení a lokalizované produkční vydání jsou další krok.

Pro přístup z počítače lze vytvořit SSH tunel (bez změn serverové konfigurace):

```sh
ssh -N -L 18110:127.0.0.1:18110 user@your-server
```

Potom otevřít `http://localhost:18110`. Server není vystaven veřejně ani přes Caddy.
Pokud náhled běží jako dočasná služba `madlik-mobile-preview`, zastaví se příkazem
`sudo systemctl stop madlik-mobile-preview`. Systémový `code-server@david` se tím nemění.

## Prohlížečové kontroly

```sh
node lib/vscode/node_modules/playwright/cli.js install chromium
node madlik/test-mobile.mjs
```

Test běží pouze proti náhledu na localhostu a jeho fixture repozitáři. Výsledky a snímky
ukládá do `.madlik/`. Skutečný iPhone, softwarová klávesnice a interaktivní Codex
vyžadují následné ověření na zařízení. Úspěšný browser test není potvrzením těchto vlastností.
Rozsah již provedeného ověření je v [madlik/TESTING.md](madlik/TESTING.md).
Pro cílenou typovou kontrolu použij `lib/vscode/node_modules/.bin/tsc -p madlik/tsconfig.json --noEmit --skipLibCheck`;
náročné kontroly spouštěj postupně a s limitem paměti.

## Git

- Pracovní větev: `madlik/main`.
- Veřejný fork / remote `origin`: https://github.com/david-madlik/madlik-code-server.git.
- Remote `upstream`: https://github.com/coder/code-server.git.
- Výchozí release: `madlik/upstream.json`.
- Místní repozitář má načtenou historii upstreamu. U mělkého klonu ji před rebase
  doplň pomocí `git fetch --unshallow --no-recurse-submodules --no-tags upstream tag v4.141.0`.

Mobilní změny jsou samostatný patch v upstream systému `patches/series`.
Upravený VS Code submodule se samostatně nepushuje; přenos změn zajišťuje quilt patch.
Neupravujeme soubory nainstalovaného `/usr/lib/code-server` ani generované bundle soubory.
Původní upstream dokumentace je v [docs/README.md](docs/README.md) a [docs/CONTRIBUTING.md](docs/CONTRIBUTING.md).

## Návrh a vývoj

Viz [madlik/ARCHITECTURE.md](madlik/ARCHITECTURE.md).

Build používá upstream nástroje: Node.js 24, npm, Git submodule VS Code a quilt.
Build předpokládá inicializovaný submodule, aplikované patche a nainstalované závislosti;
přesný postup pro úplnou distribuci je v upstream CONTRIBUTING.
Příkaz `npm run watch` se bez izolované konfigurace nesmí spouštět: upstream má vlastní výchozí porty.

Přenos na jiný server bude probíhat prostřednictvím připravené distribuce/image,
nikoli kopírováním úprav do systémové instalace. Formát prvního vydání zatím není zvolený.

## Aktualizace

1. Vybrat konkrétní upstream release a načíst jeho tag.
2. Integrovat upstream změny do pracovní větve, zachovat vlastní mobilní patche.
3. Aktualizovat VS Code submodule podle upstreamu a ověřit aplikaci všech patchů.
4. Sestavit izolovanou testovací distribuci.
5. Spustit scénáře popsané v architektuře, včetně současného desktopového klienta.
6. Teprve po ověření vydat vlastní verzi; předchozí balíček zachovat pro rollback.

Samotný úspěšný merge nebo aplikace patchů není ověřením kompatibility rozhraní.
