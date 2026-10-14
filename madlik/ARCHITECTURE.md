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

## Řízení mobilní klávesnice

Sdílený `base/browser/mobileKeyboard.ts` drží stav ve WeakMap podle okna.
Nativní InputBox, oba editorové vstupy (textarea i NativeEditContext) a xterm
registrují vlastní vstup přímo při vytvoření, s odregistrováním při dispose.
Neprohledáváme DOM a nezasahujeme do readonly stavu editoru nebo terminálu.
Prohlížení nastaví `inputmode=none` a synchronně odmítne textový fokus, protože
samotný inputmode není na všech prohlížečích závazný. Poslední pokus o zaměření
se pamatuje; tlačítko klávesnice obnoví atribut a focus synchronně v uživatelském
gestu, což Safari potřebuje pro otevření softwarové klávesnice.
Přepnutí části vrací prohlížení. Deaktivace mobilu obnoví původní atributy
vstupů a standardní fokusování; stav se neukládá ani nesdílí s desktopem.
Klávesnice operačního systému nemá spolehlivé webové API pro zjištění otevření:
indikátor znamená povolené psaní. Vlastní iframe/webview vstupy nejsou pokryté.

## Kompatibilita dotykového scrollování xterm

Závislost `@xterm/xterm` 6.1.0-beta.304 vytváří při inerciální fázi dotykového
scrollování události CHANGE bez clientX/clientY. Při zapnutém mouse reportingu
(SGR, např. Codex CLI) se souřadnice změní na NaN a poškodí vstup aplikace.
`terminalTouchCoordinates.ts` registruje capture listenery přímo na nativním
terminálovém elementu. Pamatuje poslední platnou polohu každého gesta, doplní ji
při inercii a zahodí gesto bez použitelné polohy. Existující platné souřadnice
se zachovají. Umožňuje dál scrollovat uvnitř aplikace i s vypnutým psaním.

Jde o dočasný adaptér na **interní** události `-xterm-gesturestart/change`,
nikoli veřejné xterm API. Při aktualizaci xterm ověřit jejich názvy a odstranit
adaptér, až opravu zajistí upstream. Neopravujeme node_modules ani distribuční
soubory; adaptér se sestaví ze zdrojů společně s workbenchem.
Regresní test používá raw-mode Python fixture s mouse reportingem v izolovaném
náhledu, skutečná dotyková gesta přes CDP i explicitní událost bez souřadnic.
