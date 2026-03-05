# Attīstības Žurnāls (Self-Improving Agent)
## 2026-03-04: IG Broker API Integrācijas & Lokālā TP/SL Loģika

### 🎯 Sasniegtais & Izstrādātais
1. **API Savienojums:** Veiksmīgi nodibināta REST API un Lightstreamer (Websocket) saikne ar IG Demo serveriem.
2. **Koda Moduļi:** 
    - `ig_rest_api.js`: Pilnas Market un Limit orderu atvēršanas / aizvēršanas REST funkcijas.
    - `trading_engine.js`: Reāllaika Websocket dzinējs, kas nolasa `active_trades.json` atmiņu un pielāgo "Phase 1 / Phase 2" loģiku un 10% target buferi (Trailing TP1 mehānisms).
3. **Pielāgošanās (Self-Learning):** 
    - Atteicāmies no cietajiem TP/SL orderiem IG iekšienē, pilnībā pārejot uz vietējo Pi lokālo izpildi, ko kontrolē Roo kods.
    - Kvantitātes (Size) aprēķināšana ir pilnveidota 2% no konta balansējumam, izmantojot SL punktu distanci (algoritmiski sagatavots uzskats mērķiem).

### 🐛 Kļūdu Analīze (Lessons Learned)
*   **API Currency Code:** Demo accounts bieži izmet `validation.null-not-allowed.request.currencyCode` vai pieprasa stingru `USD/GBP` atkarībā no CFD. Tagad lokālais izpildes kods fiksēti un dinamiski veido šo request atkarībā no prasībām, izvairoties no "EUR" defaultēšanas.
*   **REST DELETE Method (Aizvēršana):** IG V2 REST endpointi nepieņem standarta Axios HTTP Delete metodes viegli. Lai slēgtu pozīciju caur POST (`/positions/otc`), ir nepieciešams izmantot Header Override (`X-HTTP-Method-Override: DELETE` vai `_method: DELETE`). Papinājot: lai pilnībā un sekmīgi izdzēstu pozīciju, request bāzē NEDRĪKST saturēt liekus parametrus kā `epic` vai `orderType` (kas izsauc `validation.mutual-exclusive-value.request` kļūdu). Padevei jāsatur tikai `dealId`, pretējais `direction` un `size`.
*   **Idempotences Dublikāti:** Manā agrīnā komandrindas testēšanā komandas retries atvēra 5 dublētas Zelta pozīcijas. Lai no tā izvairītos, izstrādāts "Kills" pārbaudes skripts un viena darījuma stingra fiksēšana lokālajā `active_trades.json`.
*   **Asinhronie Websockets:** Tika apstiprināts tūlītējas reakcijas trūkums "Fona (background)" Node processos komandrindā. Nākotnē Lightstreamer dzinējs nedrīkst tikt restartēts caur exec; tas būs long-running process vai PM2 service.

### 🔜 Nākamais Posms
- Uzlabot Telegram signālu manuālo saņemšanu, izmantojot asistent-tēmu "Persona", bez parseriem.
- Sagatavot 1:1 Live Signāla testu ar pilno Pip Kalkulatoru un apstiprināt WebSockets trigger fāzes.

## 2026-03-05: Signālu Apstrādes Un Market/Limit Sinhronizācija

### 🎯 Sasniegtais & Izstrādātais
1. **Pilnīgs "signal_router.js" Parseris:** Fiksēta Regex loģika, kas atpazīst atšķirību starp īstu `MARKET` darījumu (piem. "BUY GBPUSD") un `LIMIT` pasūtījumu (piem. "BUY LIMIT EURUSD"). Tas spēj izdalīt cenas un nodod pareizos `createMarketOrder` un `createLimitOrder` API pieprasījumus.
2. **Deal ID Piesaiste:** Uztvērēja skriptā tika izbūvēts `confirms` rest izsaukums, jo sākotnējais dealReference nederēja "sync_watcher.js" atskaitei. Tagad skripts māk izilkt pašu reālo `Deal ID` 2 sekundes pēc atvēršanas.
3. **Array Konflikti:** Nodrošināts, ka `active_trades.json` fails strukturēts kā Javascript Array `[]` lai PM2 fona serveri nesamulst par savādākiem objektu piesaistes formātiem saglabājot datubāzi.

### 📍 Statuss
*   Visas demonstrācijas / fiktīvās pozīcijas no maniem testiem pilnībā dzēstas un iztīrītas.
*   `signal_router` aktīvs un gatavs saņemt turpmākos Felix mērķus caur `latest_signals.json`
*   PM2 procesi strādā tīri.
