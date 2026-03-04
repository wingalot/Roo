const fs = require('fs');

if (fs.existsSync('active_trades.json')) {
    const activeTrades = JSON.parse(fs.readFileSync('active_trades.json', 'utf8'));
    const epic = 'CS.D.EURUSD.CFD.IP';
    if(activeTrades[epic]) {
        // EURUSD pašreizējā cena ap 11634.7
        // Uzliksim SL tuvāk (piem 11630.0), lai varētu izsist un notestēt aizvēršanos,
        // Vai TP1 tuvāk (piem 11636.0), lai notestētu Phase 2.
        
        console.log("Esošie mērķi:", JSON.stringify(activeTrades[epic], null, 2));
        
        // Pārrakstīsim, lai notestētu aizvēršanos (piemēram uzliekam TP dīvainus, lai nesasniedz, bet SL uzliekam ļoti tuvu esošajai cenai, lai izsit, vai vienkārši TP3 ļoti tuvu, lai aizver plusā).
        // Cena ir ap 11634.7
        // Aizvērsim ar TP3 rīt, vai uzliksim TP3 = 11635.0, lai aizveras uzreiz augšā.
        
        activeTrades[epic].tp3 = 11635.5; // Tuvs TP3
        activeTrades[epic].sl = 11633.0; // Tuvs SL
        
        fs.writeFileSync('active_trades.json', JSON.stringify(activeTrades, null, 2));
        console.log("Jauni testa mērķi saglabāti!");
    }
}
