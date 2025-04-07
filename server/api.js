require('dotenv').config(); // charge le .env
const express = require('express');
const { MongoClient } = require('mongodb');
const cors = require('cors');

////////////////////////////////////////////////////////////////////////////////
// CONFIGURATION GLOBALE
////////////////////////////////////////////////////////////////////////////////

const app = express();
app.use(cors());

// Récupère la config Mongo
const uri = process.env.MONGODB_URI || '';
const dbName = process.env.MONGODB_DB_NAME || 'lego';

// Variables globales
let client; // on stocke le client Mongo au niveau global
let db;     // on stocke la db Mongo au niveau global

/**
 * connectIfNeeded
 * Se connecte à Mongo UNIQUEMENT si on ne l'a pas déjà fait.
 */
async function connectIfNeeded() {
  // Si on a déjà un client initialisé, on ne refait pas de connexion.
  if (!client) {
    console.log('Tentative de connexion à MongoDB...');
    client = new MongoClient(uri);
    await client.connect();
    db = client.db(dbName);
    console.log('✅ Connected to MongoDB, db =', dbName);
  }
}

/**
 * Middleware (app.use) : avant de traiter une route, on s'assure que la connexion est faite.
 */
app.use(async (req, res, next) => {
  try {
    await connectIfNeeded();
  } catch (err) {
    console.error('❌ MongoDB connection error:', err);
    return res.status(500).json({ error: 'Impossible de se connecter à MongoDB' });
  }
  // si la connexion est OK, on passe au handler de la route
  next();
});

////////////////////////////////////////////////////////////////////////////////
// ROUTES
////////////////////////////////////////////////////////////////////////////////

/**
 * GET / -> simple test
 */
app.get('/', (req, res) => {
  res.json({ 
    ack: true 
  });
});


/**
 * GET /deals/search
 * exemple : http://localhost:3000/deals/search
 */
app.get('/deals/search', async (req, res) => {
  try {
    const { limit = 12 } = req.query;
    const results = await db
      .collection('dealabs')
      .find({})
      .limit(Number(limit))
      .toArray();

    res.json({ limit, total: results.length, results });
  } catch (err) {
    console.error('Erreur /deals/search:', err);
    res.status(500).send({ error: err.message });
  }
});

/**
 * GET /sales/search
 * exemple : http://localhost:3000/sales/search
 */
app.get('/sales/search', async (req, res) => {
  try {
    const { limit = 12 } = req.query;
    const results = await db
      .collection('sales')
      .find({})
      .limit(Number(limit))
      .toArray();

    res.json({ limit, total: results.length, results });
  } catch (err) {
    console.error('Erreur /sales/search:', err);
    res.status(500).send({ error: err.message });
  }
});

////////////////////////////////////////////////////////////////////////////////
// LANCEMENT EN LOCAL ou EXPORT POUR VERCEL
////////////////////////////////////////////////////////////////////////////////

const PORT = 8092;

// Si on exécute "node api.js" directement, on démarre un server local sur 8092
if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`📡 Running on port ${PORT}`);
  });
}

// Sinon, on exporte pour Vercel
module.exports = app;
