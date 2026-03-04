# Roo Trading System - Arhitektūras Shēma

## Sistēmas Plūsma (Workflow)
Sistēma darbojas kā daļēji automatizēts (Semi-Automated) cikls. Tā dalās 3 galvenajos blokos: Uztveršana, Reāllaika Maršrutizēšana (Ieeja), un Autopilots (Izeja).

```text
[ Telegram: Felix Channel ]
         │
         ▼ (Telethon API)
┌─────────────────────────────────┐
│ 1. UZTVERŠANA                   │
│ Skripts: telegram_bot/          │
│          main_listener.py       │
│ PM2 Name: telegram_listener     │
└────────────────┬────────────────┘
                 │ (1. Saglabā jaunu signālu / 2. Ja Reply - apdeito SL)
                 ├──> latest_signals.json (UI/Logi)
                 └──> active_trades.json (Ja tiek labots aktīvs SL)
                 │
                 ▼ (Nodod tālāko rīcību Signal Routerim)
┌─────────────────────────────────┐
│ 2. REĀLLAIKA SIGNAL ROUTER      │
│ Skripts: signal_router.js       │
│ PM2 Name: signal_router         │
│ * Nolasa JSON, dinamiski piemēro│
│ bāzes valūtu (currencyCode) un  │
│ izsauc IG REST API cancel/open  │
└────────────────┬────────────────┘
                 │ (REST API POST /positions/otc vai DELETE limitam)
                 ▼ 
        [ IG Brokeris ] ──(Atgriež DealID un Atvēršanas Cenu)──┐
                                                               │
┌──────────────────────────────────────────────────────────────▼───┐
│ 3. AUTOPILOTS (Klausās cenu izmaiņas)                            │
│ Ieraksta: active_trades.json (Entry, Mērķus TP1-TP3, SL iekš Pt) │
│ Dzinējs:  sync_watcher.js                                        │
│ PM2 Name: sync_watcher                                           │
└────────────────┬─────────────────────────────────────────────────┘
                 │ (Salīdzina IG atvērtās pozīcijas ar lokālajiem)
                 │ (TP/SL/Trailing SL mērķiem no active_trades)
                 ▼
[ IG Brokeris (REST DELETE) ] <── (Pozīcijas slēgšana kad sasniegts mērķis)
```

## Galvenie Faili un Moduļi

### Atmiņa un Datu struktūras
*   `active_trades.json` - Sistēmas sirds (Single Source of Truth) aktīvajām pozīcijām. Autopilotam nav savas atmiņas, tas paļaujas uz šo atskaites punktu.
*   `latest_signals.json` - Pēdējo Telegram kanāla ziņu vēsture.
*   `processed_signals.json` - Reģistrē jau apstrādātos Signal IDs no `signal_router`, lai nedublētu vienus un tos pašus orderus.

### Infrastruktūras Skripti un PM2 Servisi
Sistēma fona režīmā (Always-On) uztur **4 obligātos PM2 procesus**, kas saglabāti ar `pm2 save` sistēmas automātiskai startēšanai (reboot izturība):

1.  **`telegram_listener`** (Python) - Uztver Telegram ziņas reāllaikā. Ja ir atbilde (Reply) par StopLoss izmaiņām, tieši raksta datubāzē `active_trades.json`. Citos gadījumos noliek jaunos signālus `latest_signals.json`.
2.  **`signal_router`** (Node.js) - Pārtver `latest_signals.json` izmaiņas, izanalizē ziņojuma dabu (Cancel, Buy, Sell) un izsauc IG API darījuma atvēršanai/limit dzēšanai. **Svarīgi:** Ietver dinamiskās valūtas koda (`currencyCode`) aizsardzību, kur instrumenta "Quote" (otrais) pāris vienlaikus ir bāzes pieprasījuma vērtība (piem., GBPJPY pieprasa `JPY`, bet EURUSD `USD`).
3.  **`sync_watcher`** (Node.js) - Galvenais Tirdzniecības Autopilots. Sinhronizē lokālo datubāzi ar reālo IG kontu apstrādājot Phase 1 un Phase 2 loģiku (Trailling SL / TP hit apstrāde) reāllaikā. Automātiski slēdz un validē "fake/orphan" orderus, kā arī izpilda signālu mērķus, kad tirgus cena tos nolauž.
4.  **`mission-control`** (Node.js) - Sistēmas lokālais reāllaika mērinstrumentu un logu panelis.

*   Zemā līmeņa pamata kodols: `ig_rest_api.js` - Modulis standartizētai API saziņai ar IG (Atvērt/Aizvērt darījumus).

---
**Piezīme Man pašam (Roo):** 
Katras darba sesijas beigās šim failam ir jābūt caurskatītam un atjauninātam, ja sistēmas arhitektūrā, failu nosaukumos, loģikā vai PM2 pakalpojumu stāvoklī ir veiktas jebkādas izmaiņas!


### IG API Position Closing Logic
Kļūda labota 04-03-2026: IG REST API pozicionēšanas (Delete POST requests) metodē turpmāk tiek precīzāk pārbaudīts un adaptēts `size` mainīgais uz decimāldaļām (`parseFloat()`), lai izvērtētu 0.1 mini/micro parametrus.
Atvērts automātiskai mērīšanai bez kļūdām ar pretējo operācijas virzienu! 