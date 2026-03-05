# Attīstības Žurnāls (Self-Improving Agent)
## 2026-03-04 & 2026-03-05: IG Broker API Integrācijas, Lokālā TP/SL Loģika & Signālu Uztvērēja Fiksēšana

### 🎯 Sasniegtais & Izstrādātais
1. **API Savienojums:** Veiksmīgi nodibināta REST API un Lightstreamer (Websocket) saikne ar IG Demo serveriem.
2. **Koda Moduļi:** 
    - `ig_rest_api.js`: Pilnas Market un Limit orderu atvēršanas / aizvēršanas REST funkcijas.
    - `trading_engine.js`: Reāllaika Websocket dzinējs, kas nolasa `active_trades.json` atmiņu un pielāgo "Phase 1 / Phase 2" loģiku un 10% target buferi (Trailing TP1 mehānisms).
3. **Pielāgošanās (Self-Learning):** 
    - Atteicāmies no cietajiem TP/SL orderiem IG iekšienē, pilnībā pārejot uz vietējo Pi lokālo izpildi, ko kontrolē Roo kods.
    - Kvantitātes (Size) aprēķināšana ir pilnveidota 2% no konta balansējumam, izmantojot SL punktu distanci (algoritmiski sagatavots uzskats mērķiem).
4. **Signālu Uztvērējs (PM2 Process: signal_router.js):**
    - Sākotnēji signālu uztvērējs tikai pārbaudīja "Cancel" limit orderus un ignorēja "BUY/SELL". Šī loģika tika pārrakstīta.
    - Tika salabots Regex parseris, lai precīzi atšķirtu LIMIT orderus no MARKET orderiem.
    - Tika veiksmīgi novadīts un pārbaudīts reāllaika Buy signāla lokālās izpildes tests (GBPJPY un GBPUSD pozīciju atvēršana un sekmīga aizvēršana caur IG REST API un `active_trades.json` reģistru).

### 🐛 Kļūdu Analīze (Lessons Learned)
*   **API Currency Code:** Demo accounts bieži izmet `validation.null-not-allowed.request.currencyCode` vai pieprasa stingru `USD/GBP` atkarībā no CFD. Tagad lokālais izpildes kods fiksēti un dinamiski veido šo request atkarībā no prasībām, izvairoties no "EUR" defaultēšanas.
*   **REST DELETE Method (Aizvēršana):** IG V2 REST endpointi nepieņem standarta Axios HTTP Delete metodes viegli. Lai slēgtu pozīciju caur POST (`/positions/otc`), ir nepieciešams izmantot Header Override (`X-HTTP-Method-Override: DELETE` vai `_method: DELETE`). Papinājot: lai pilnībā un sekmīgi izdzēstu pozīciju, request bāzē NEDRĪKST saturēt liekus parametrus kā `epic` vai `orderType` (kas izsauc `validation.mutual-exclusive-value.request` kļūdu). Padevei jāsatur tikai `dealId`, pretējais `direction` un `size`.
*   **Idempotences Dublikāti:** Manā agrīnā komandrindas testēšanā komandas retries atvēra 5 dublētas Zelta pozīcijas. Lai no tā izvairītos, izstrādāts "Kills" pārbaudes skripts un viena darījuma stingra fiksēšana lokālajā `active_trades.json`.
*   **Asinhronie Websockets:** Tika apstiprināts tūlītējas reakcijas trūkums "Fona (background)" Node processos komandrindā. Nākotnē Lightstreamer dzinējs nedrīkst tikt restartēts caur exec; tas būs long-running process vai PM2 service. Uzstādīts PM2 sync_watcher.js.

### 🔜 Nākamais Posms
- [ ] Pievienot Reply ID signālu parsēšanu: kad kanālā atnāk update uz iepriekšējo signālu (Move stoploss to X), automātiski atjaunināt 'sl' vērtību 'active_trades.json' atbilstošajam orderim.
