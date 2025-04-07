require('dotenv').config();
const express = require('express');
const { MongoClient } = require('mongodb');
const cors = require('cors');

const app = express();

// Autorise CORS et parsing JSON
app.use(cors());
app.use(express.json());

// Variables de connexion MongoDB
const uri = process.env.MONGODB_URI || '';
const dbName = process.env.MONGODB_DB_NAME || 'lego';

let client;
let db;

// Fonction de connexion "lazy"
async function connectIfNeeded() {
  if (!client) {
    console.log('Tentative de connexion à MongoDB...');
    client = new MongoClient(uri);
    await client.connect();
    db = client.db(dbName);
    console.log('✅ Connected to MongoDB, db =', dbName);
  }
}

// Middleware pour s'assurer que la connexion est établie avant chaque requête
app.use(async (req, res, next) => {
  try {
    await connectIfNeeded();
    next();
  } catch (err) {
    console.error('Erreur de connexion MongoDB:', err);
    res.status(500).json({ error: 'Impossible de se connecter à MongoDB' });
  }
});

// Route test pour l'API
app.get('/', (req, res) => {
  res.json({ ack: true });
});

// Exemple d'endpoint GET pour récupérer des deals
app.get('/api/deals/search', async (req, res) => {
  try {
    const { limit = 12, price, date, filterBy } = req.query;
    const query = {};
    if (price) query.price = { $lte: Number(price) };
    if (date) query.published = { $gte: new Date(date).getTime() / 1000 };
    if (filterBy === 'best-discount') query.discount = { $gte: 20 };
    if (filterBy === 'most-commented') query.comments = { $gte: 10 };

    const results = await db.collection('dealabs')
      .find(query)
      .sort({ price: 1 })
      .limit(Number(limit))
      .toArray();

    res.json({ limit, total: results.length, results });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Endpoint POST pour ajouter un nouveau deal
app.post('/api/deals', async (req, res) => {
  try {
    const newDeal = req.body;
    if (!newDeal.id) {
      return res.status(400).json({ error: 'Le champ "id" est requis.' });
    }
    const result = await db.collection('dealabs').insertOne(newDeal);
    res.status(201).json({
      acknowledged: result.acknowledged,
      insertedId: result.insertedId
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Endpoint PUT pour mettre à jour un deal existant
app.put('/api/deals/:id', async (req, res) => {
  try {
    const dealId = req.params.id;
    const updateData = req.body;
    if (!updateData || Object.keys(updateData).length === 0) {
      return res.status(400).json({ error: 'Aucune donnée fournie pour la mise à jour.' });
    }
    const result = await db.collection('dealabs').updateOne(
      { id: dealId },
      { $set: updateData }
    );
    if (result.matchedCount === 0) {
      return res.status(404).json({ error: 'Deal non trouvé.' });
    }
    res.json({
      matchedCount: result.matchedCount,
      modifiedCount: result.modifiedCount
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Démarrage du serveur en local (pour tester avec "node server/api.js")
const PORT = process.env.PORT || 8092;
if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`📡 Server running on port ${PORT}`);
  });
}

module.exports = app;
