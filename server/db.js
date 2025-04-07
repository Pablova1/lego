// db.js
const { MongoClient } = require('mongodb');
const dotenv = require('dotenv');
dotenv.config();

const uri = process.env.MONGODB_URI; // ex: "mongodb+srv://..."
const dbName = process.env.MONGODB_DB_NAME || 'lego';

let db;

async function connectToMongo() {
  const client = new MongoClient(uri);
  await client.connect();
  db = client.db(dbName);
  console.log("✅ MongoDB connected");
  return db;
}

function getDb() {
  if (!db) {
    throw new Error("❌ DB not initialized. Call connectToMongo first.");
  }
  return db;
}

module.exports = { connectToMongo, getDb };
