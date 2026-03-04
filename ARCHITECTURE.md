# Roo Trading System - Arhitektūras Shēma

## Sistēmas Plūsma (Workflow)
Sistēma darbojas kā daļēji automatizēts (Semi-Automated) cikls. Tā dalās 3 galvenajos blokos: Uztveršana, Manuālā Validācija (Ieeja), un Autopilots (Izeja).

```text
[ Telegram: Felix Channel ]
         │
         ▼ (Telethon API)
┌─────────────────────────────────┐
│ 1. UZTVERŠANA (Background PM2)  │
│ Skripts: telegram_bot/          │
│          main_listener.py       │
│ PM2 Name: telegram_listener     │
└────────────────┬────────────────┘
                 │ (1. Saglabā jaunu signālu / 2. Ja Reply - apdeito SL)
                 ├──> latest_signals.json (UI/Logi)
                 └──> active_trades.json (Ja tiek labots aktīvs SL)
                 │
                 ▼ (Es formēju tālāko rīcību pēc komandas)
┌─────────────────────────────────┐
│ 2. VALIDĀCIJA & IZPILDE         │
│ Skripts: manual_trade_*.js      │
│ (piem. manual_trade_xauusd.js)  │
└────────────────┬────────────────┘
                 │ (REST API POST /positions/otc)
                 ▼ 
        [ IG Brokeris ] ──(Atgriež DealID un Atvēršanas Cenu)──┐
                                                               │
┌──────────────────────────────────────────────────────────────▼───┐
│ 3. AUTOPILOTS (Background PM2)                                   │
│ Ieraksta: active_trades.json (Entry, Mērķus TP1-TP3, SL iekš Pt) │
│ Dzinējs:  trading_engine.js / sync_watcher.js                    │
│ PM2 Name: sync_watcher                                           │
└────────────────┬─────────────────────────────────────────────────┘
                 │ (Klausās cenu izmaiņas caur IG WebSocket)
                 │ (Salīdzina ar active_trades.json mērķiem)
                 ▼
[ IG Brokeris (REST DELETE) ] <── (Pozīcijas daļēja/pilna slēgšana kad SL/TP sasniegts)
```

## Galvenie Faili un Moduļi

### Atmiņa un Datu struktūras
*   `active_trades.json` - Sistēmas sirds (Single Source of Truth) aktīvajām pozīcijām. Autopilots vadās tikai no šī.
*   `latest_signals.json` - Pēdējo Telegram kanāla ziņu vēsture misijas kontrolei un nolasīšanai.

### Infrastruktūras Skripti
*   `telegram_bot/main_listener.py` - Uztver Telegram ziņas reāllaikā. Ja ir atbilde (Reply) par StopLoss izmaiņām esošam signālam, tas pa tiešo raksta datubāzē `active_trades.json`.
*   `manual_trade_*.js` - Pielāgoti ieejas palaidēji, kuros ierakstām precīzus instrumentus un punktu aprēķinu (12pt SL, 1.5pt TP1 utt), lai atrisinātu spreda atšķirību starp Felix un mūsu IG demo cenām.
*   `ig_rest_api.js` - Zemā līmeņa modulis API saziņai ar IG (Atvērt/Aizvērt).
*   `sync_watcher.js` (PM2) - Fona process, kas sinhronizē lokālo datubāzi ar reālo IG kontu. Pasargā no iestrēgušiem izpildes stāvokļiem ("Orphan" orderiem).

---
**Piezīme Man pašam (Roo):** 
Katras darba sesijas beigās šim failam ir jābūt caurskatītam un atjauninātam, ja sistēmas arhitektūrā, failu nosaukumos vai loģikā ir veiktas jebkādas izmaiņas!
