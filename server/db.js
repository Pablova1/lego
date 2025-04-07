require('dotenv').config();
const { MongoClient } = require('mongodb');

const MONGODB_URI = process.env.MONGODB_URI;
const MONGODB_DB_NAME = 'lego';

let client;
let db;

async function connectToMongo() {
  if (!client) {
    client = new MongoClient(MONGODB_URI);
    await client.connect();
    db = client.db(MONGODB_DB_NAME);
    console.log('✅ Connexion à MongoDB établie');
  }
  return { client, db };
}

module.exports = { connectToMongo };
