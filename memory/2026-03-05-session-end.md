# Veiktās Darbības un Pārbaužu Sesija (2026-03-05)

### Uzstādītais tests un Mērķis
Pēc 10 testa signālu iebarošanas (dažāda formāta, tostarp Limit orderiem, ar emoji saturu, piem., `⭐️ USDCHF ⭐️\n📈 BUY NOW...`), mērķis bija apstiprināt sistēmas end-to-end plūsmu caur PM2 moduļiem:  `signal_router` (saņem signālu), `ig_rest_api` (atver/nosūta pa taisno IG API) un pēc tam lokālā datubāze `active_trades.json`. 

### Kas tika novērots
1. **RegExp Kļūmīgas Ekstrakcijas:** Sākotnējais signālu parsētājs laida cauri visus nepareizos pārus (piemēram "BUY EURUSD" pārveidoja pa `RUSD`).  
  **Kā labojām**: Salabots ar stingru RegExp plūsmu programmā `signal_router.js`. Tagad uztver dažādus Telegram formātus.
2. **IG Order Size Types:** Aizverot 9 pēkšņi vaļā esošus testa orderus,  Aizvēršanas (DELETE metode OTC) IG atgrieza \`validation.null-not-allowed.request.size\`. Tika atklāts, ka IG prasa nevis float skaitli (piem. `1`), bet gan `string` formātu (piem. `"1"`).
  **Kā labojām**: Labojumi programmā `ig_rest_api.js` funkcijā `closePositionAPI` nodrošina piespiedu `.toString()` pārveidošanu pie Size, gan MARKET pieprasījumiem, gan slēgšanas pozīcijām.
3. **Pāru epic dinamika:** `CS.D.GOLD.CFD` utt.  tika pievienots dinamiskais ģenerators  (\`CS.D.\${pair}.CFD.IP\`). Līdz ar to visi pamata pāri darbojas bez masīviem IF-ELSE blokiem.

### Nākamā soļa izmantošanas rīki
Mēs saglabājām testēšanas skriptus:
* `sim_trigger.js` - izšauj vienu pēc otra visus 10 signālus (lielā pārbaude).
* `wipe_ig_bot.js` - avārijas IG dzēšējs, ja kontā vēl paliek reālas atvērtas pozīcijas. 

Šie rīki tagad atrodas sākuma direktorijā, un IG konts ir gatavs turpmākajai attīstībai un testam.
