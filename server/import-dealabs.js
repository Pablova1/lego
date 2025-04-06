const fs = require('fs');
const path = require('path');
const { connectToMongo } = require('./db');

async function main() {
  try {
    const filePath = path.join(__dirname, 'dealabs.json');
    const fileData = fs.readFileSync(filePath, 'utf-8');
    const deals = JSON.parse(fileData);

    if (!deals.length) {
      console.log('❌ Aucun deal à insérer');
      return;
    }

    const db = await connectToMongo();
    const collection = db.collection('dealabs');

    // Optionnel : clear la collection avant d'insérer
    await collection.deleteMany({});

    const result = await collection.insertMany(deals);
    console.log(`✅ ${result.insertedCount} deals insérés dans MongoDB`);
  } catch (error) {
    console.error('❌ Erreur pendant l\'import dans MongoDB :', error.message);
  }
}

main();
