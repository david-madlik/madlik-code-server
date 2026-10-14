# Mobilní integrace

## Rozhodnutí

Integrace do zdrojového workbenche přes quilt patch, ne vkládání skriptu přes proxy.
TypeScript komponenta a její styly se sestaví společně s VS Code. Tím nepotřebujeme
oslabovat CSP ani veřejný most mezi stránkou a Extension Hostem.
Interní workbench služby jsou v této variantě záměrná závislost vlastního forku;
nepředstíráme, že jde o stabilní veřejné Extension API.

## Cílové chování

- Režim `auto | on | off`, výchozí auto s hranicí viewportu 768 CSS px.
- Detekce skutečného okna pomocí matchMedia, včetně změny orientace.
- Stav mobilního režimu patří klientskému oknu. Nepoužívat serverové preference,
  společná workspace settings ani sdílený uložený layout pro mobilní přepínání.
- Nad hranicí nepřidávat navigaci ani měnit desktopové rozložení.
- Spodní navigace Soubory / Git / Editor / Terminál, aktivní část zvýrazněná.
- Používat workbench layout a view služby, zachovat původní komponenty a jejich stav.
- Při otevření souboru nebo diffu přejít na Editor; sledovat skutečné otevření,
  nikoli pouhou existenci dříve otevřeného editoru při přepnutí režimu.
- Terminál pouze skrývat; nikdy ho při přepínání dispose/kill.
- Respektovat safe-area-inset-bottom a dostupnou výšku při zobrazené klávesnici.
- Uložit předchozí rozložení v paměti klientského okna a při deaktivaci obnovit.
- Mobilní override nesmí přepsat perzistentní desktopový layout. Zvlášť prověřit
  persistenci layout service a sdílení mezi dvěma klienty stejného workspace.

## Implementační kroky

1. Připravit VS Code submodule a prostudovat layout/storage služby konkrétního commitu.
2. Přidat malou workbench contribution: detekce, stav a přístupná navigace.
3. Integrovat čtyři režimy do layoutu bez přesouvání DOM elementů pomocí selektorů.
   Maximalizace primárního sidebaru bude potřebovat vlastní layoutovou úpravu.
4. Oddělit dočasný mobilní layout od ukládání standardního rozložení.
5. Exportovat změny do samostatného patche v patches/series.
6. Build a Playwright na izolované instanci, potom balíček/distribuce.

První implementace používá přímo viditelnost existujících grid views. Snapshot
ukládá viditelnost, rozměry i cache skrytých panelů; editor při návratu absorbuje
zbývající prostor. Poslední desktopové šířky se uchovávají před zúžením okna.
Zápis mobilních rozměrů a posledního aktivního view containeru do desktopových
preferencí je potlačen. Změny rozložení nevolají konfiguraci ani nepřesouvají DOM.
Stav ověření a zbývající limity jsou v [TESTING.md](TESTING.md).

## Testovací plán

Izolovaná instance: vlastní config, user-data-dir, extensions-dir, dočasný Git workspace
a pouze loopback listener na volném portu. Nepoužívat pracovní repozitáře ani běžící server.

Playwright scénáře:

- 390 × 844 a 375 × 667: všechny čtyři režimy, rozměry a ovladatelnost navigace.
- 1440 × 900: žádná mobilní navigace ani změny desktopového layoutu.
- Přechod přes hranici 768 px a otočení telefonu, opakovaně.
- Explorer: otevření souboru a přechod na editor.
- Source Control: stage/unstage a diff na dočasném repozitáři.
- Terminál: interaktivní proces přežije opakované přepínání, návrat do stejné relace.
- Dvě klientská okna stejného workspace: mobilní změny neovlivní desktop,
  včetně obnovy stránky a opětovného připojení.
- Vypnutí mobilního režimu obnoví původní rozložení bez změny uživatelských nastavení.
- CSP bez oslabení; bez injekce přes proxy nebo úprav systémové instalace.

Playwright není plnohodnotnou náhradou ověření iOS klávesnice a interaktivního Codex CLI
na skutečném iPhonu. Finální dotykové a klávesnicové chování ověřit také na zařízení.
