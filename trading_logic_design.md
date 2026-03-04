# Lokālās TP/SL un Orderu Loģikas Plāns

## 1. Bāzes Principi (100% Lokāla Kontrole)
- **Tikai ordera atvēršana (Market / Limit) notiek IG platformā.** 
- **Nav nekādu IG brokera SL vai TP limitu.** (Nekad neizmantojam brokera tiešo Stop Loss un Take Profit, visas aizvēršanas organizē lokālais mehānisms).
- Sistēma (Roo) saņem tirdzniecības signālus no lietotāja 'Elvi' (Felix signāli), un apstrādā manuskriptu pirms izpildes.

## 2. Riska / Pozīcijas Vadība
- **Riska limits:** Sistēma pastāvīgi izpilda orderus ar fiksētu summu - **2% no konta atbilstošā bilances**. (Jāpieprasa IG API `get_account_balance` pirms katras atvēršanas un jāizveido formulas `(balance * 0.02) / SL=position_size`).

## 3. Dinamiskā Pārvaldība (Pozīcijas Trailing un Fiksācija)

**Situācija Pēc Ordera Atvēršanas (Roo Lokālā Cena Uraudzība):**

* **Initial State:** Roo monitorē live cenu straumi pret atvēršanas līmeni un signāla galveno SL. Ja cena krīt zem SL līmeņa -> Roo dod IG komandu "Close position".
* **Progress:** Cena aug (vai krīt - ja short), un sasniedz **TP2** līmeni.
    - Lokālais SL tiek Pārvietots uz **TP1** vērtību (drošības spilvens).
* **Peļņas Lielā Fāze (Pēc TP2):** Sistēma gaida 2 nosacījumus. Ja viens izpildās - orderis tiek noslēgts ar IG API.
  - **Scenārijs A (10% Atkāpšanās no TP2):** Ja cena nokrīt par 10% no distances starp TP1 un TP2 (piem., ja starpība starp TP1 un TP2 ir 100 pipi, tad kritums par 10 pipiem zem TP2) -> Sūtīt "Close position".
  - **Scenārijs B (Fiksācija):** Ja cena sasniedz apjomu pie **TP3** -> Sūtīt "Close position". Ja signālā nav norādīts TP3 (tikai TP1 un TP2), tad pozīcija tiek automātiski slēgta brīdī, kad sasniegts **TP2**.

## 4. Cita Informācija
- **Pipu kalkulators:** Izolēts modulis, kas konvertē un aprēķina "Stop loss" vai "Limit orderu" pipsus reālās cenās.
- **Instrumenti/Formāti:** Roo manuāli (kā AI aģents) parsēs signāla tekstu, konvertēs un validēs tikeru pirms došanas IG izpildei.
- **Limit vs Market:** Ja signāls norāda "Buy/Sell Limit", tad tiek sūtīts Pending Limit order uz IG. Ja nav minēts - Market izpilde uzreiz.