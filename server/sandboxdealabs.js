const fs = require('fs');
const path = require('path');
const { scrapeAllDeals } = require('./dealabs');
const { connectToMongo } = require('./db');

async function main() {
  try {
    const deals = await scrapeAllDeals();

    if (!deals.length) {
      console.warn("⚠️ Aucun deal trouvé.");
      return;
    }

    const filePath = path.join(__dirname, 'dealabs.json');
    fs.writeFileSync(filePath, JSON.stringify(deals, null, 2));
    console.log(`📦 ${deals.length} deals sauvegardés dans dealabs.json`);

    const db = await connectToMongo();
    const collection = db.collection('dealabs');
    await collection.insertMany(deals);
    console.log("💾 Données Dealabs insérées dans MongoDB");

  } catch (err) {
    console.error("❌ Erreur :", err.message);
  }
}

main();
