# Ověření mobilního rozhraní

Datum: 2026-10-14. Základ: code-server 4.141.0 / VS Code 1.141.0.

Ověřeno:

- Sestavení 19 server-web bundle souborů upstream esbuild pipeline.
- Cílená kontrola TypeScript typů změněných produkčních modulů a jejich závislostí
  pomocí `madlik/tsconfig.json` bez chyb. Úplný upstream projekt včetně všech testů
  se tím nekontroluje.
- Opakované odstranění a aplikace vlastního quilt patche bez konfliktů.
- Chromium přes Playwright proti izolované instanci na 127.0.0.1:18110.
- 390 × 844 a 375 × 667: čtyři režimy a jejich rozměry, původní Explorer,
  otevření souboru, nativní Git stage/unstage a diff, automatický přechod na Editor.
- Terminál: spuštění foreground procesu a zachování shell PID přes přepnutí
  Soubory → Editor → Terminál. Proces se testuje ve fixture workspace.
- Mobilní kontexty s `hasTouch` a `isMobile`: odmítnutí textového fokusu v editoru
  a terminálu při prohlížení, povolení fokusu tlačítkem `⌨`, opětovné zavření,
  terminálové Enter a Ctrl+C se zavřenou klávesnicí, dotyk terminálové plochy.
- Standardní textový fokus palety příkazů na desktopu před mobilním režimem
  a po jeho vypnutí; mobilní paleta funguje při povoleném psaní.
- Ruční vypnutí/zapnutí, automatický režim a změna orientace přes hranici 768 px.
- 1440 × 900: standardní desktop, nezměněná geometrie při souběžném mobilním
  klientovi a jeho reloadu, obnovení stejné geometrie po zúžení a opětovném rozšíření.
- Žádné nezachycené JavaScriptové výjimky ve finálním browser testu.
- Pracovní code-server zůstal spuštěný; síťové konfigurace se neměnily.

Podrobný lokální výsledek: `.madlik/test-results.json`; snímky: `.madlik/screenshots/`.
Soubor s výsledky se vytváří pouze po úspěchu celé testovací sady.

Neověřeno:

- Skutečný iPhone / Safari / Brave, softwarová klávesnice, zoom a safe-area na zařízení.
- Skutečná interaktivní relace Codex CLI (prohlížečový test používá obyčejný shell proces).
- Commit/push do skutečných repozitářů; test mění pouze lokální fixture.
- Kompletní produkční balení, lokalizace a aktualizace na jinou verzi upstreamu.
- Synchronizované profily, přesunuté vlastní view kontejnery a všechny kombinace
  rozdělených editorů / Zen Mode / maximalizované sekundární lišty.

Vývojový incident: počáteční neomezený souběh kompilace a plné typové kontroly
vyčerpal RAM VPS a systém ukončil Unity editor. Následující buildy běžely pod
limitem paměti systemd. Build náhledu odmítá start pod 6 GiB dostupné RAM.
Plná kontrola všech upstream typů nebyla dokončena; nepovažovat esbuild za typovou kontrolu.
