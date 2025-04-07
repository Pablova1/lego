require('dotenv').config();
const { MongoClient } = require('mongodb');

async function main() {
  console.log('URI =>', process.env.MONGODB_URI);
  try {
    const client = new MongoClient(process.env.MONGODB_URI);
    await client.connect();
    console.log('✅ Connecté !');
    await client.close();
    console.log('✅ Fermeture OK');
  } catch (err) {
    console.error('❌ Erreur de connexion :', err);
  }
}

main();
