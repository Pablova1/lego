const express = require('express');
const { connectToMongo } = require('./db');
require('dotenv').config();

const app = express();
const PORT = 8092;

let db;

app.use(express.json());

// ✅ GET /deals/:id
app.get('/deals/:id', async (req, res) => {
  try {
    const { db } = await connectToMongo();
    const deal = await db.collection('dealabs').findOne({ id: req.params.id });
    if (!deal) return res.status(404).json({ error: 'Deal non trouvé' });
    res.json(deal);
  } catch (err) {
    console.error("❌ Erreur /deals/:id :", err.message);
    res.status(500).json({ error: err.message });
  }
});

// ✅ GET /deals/search?limit=&price=&date=&filterBy=
app.get('/deals/search', async (req, res) => {
  try {
    const { db } = await connectToMongo();
    const { limit = 12, price, date, filterBy } = req.query;

    const query = {};
    if (price) query.price = { $lte: parseFloat(price) };
    if (date) query.published = { $gte: new Date(date).getTime() / 1000 };

    if (filterBy === 'best-discount') query.discount = { $gte: 20 };
    if (filterBy === 'most-commented') query.comments = { $gte: 10 };

    const results = await db.collection('dealabs')
      .find(query)
      .sort({ price: 1 })
      .limit(parseInt(limit))
      .toArray();

    res.json({ limit: parseInt(limit), total: results.length, results });
  } catch (err) {
    console.error("❌ Erreur /deals/search :", err.message);
    res.status(500).json({ error: err.message });
  }
});

// ✅ GET /sales/search?limit=&legoSetId=
app.get('/sales/search', async (req, res) => {
  try {
    const { db } = await connectToMongo();
    const { limit = 12, legoSetId } = req.query;

    const query = {};
    if (legoSetId) query.legoSetId = legoSetId;

    const results = await db.collection('sales')
      .find(query)
      .sort({ published: -1 })
      .limit(parseInt(limit))
      .toArray();

    res.json({ limit: parseInt(limit), total: results.length, results });
  } catch (err) {
    console.error("❌ Erreur /sales/search :", err.message);
    res.status(500).json({ error: err.message });
  }
});

app.get('/deals/search', async (req, res) => {
  try {
    const db = await connectToMongo();
    const collection = db.collection('dealabs');

    const limit = parseInt(req.query.limit) || 12;
    const price = parseFloat(req.query.price);
    const date = req.query.date ? new Date(req.query.date) : null;
    const filterBy = req.query.filterBy;

    const query = {};

    if (!isNaN(price)) {
      query.price = { $lte: price };
    }

    if (date) {
      query.published = { $gte: date };
    }

    const sort = {};
    if (filterBy === 'best-discount') {
      sort.discount = -1;
    } else if (filterBy === 'most-commented') {
      sort.comments = -1;
    } else {
      sort.price = 1;
    }

    const results = await collection.find(query).sort(sort).limit(limit).toArray();

    res.json({
      limit,
      total: results.length,
      results
    });
  } catch (error) {
    console.error('❌ Erreur /deals/search :', error);
    res.status(500).json({ error: 'Erreur serveur interne' });
  }
});

app.get('/sales/search', async (req, res) => {
  try {
    const db = await connectToMongo();
    const collection = db.collection('sales');

    const limit = parseInt(req.query.limit) || 12;
    const legoSetId = req.query.legoSetId;

    const query = {};
    if (legoSetId) {
      query.legoSetId = legoSetId;
    }

    const results = await collection.find(query).sort({ published: -1 }).limit(limit).toArray();

    res.json({
      limit,
      total: results.length,
      results
    });
  } catch (error) {
    console.error('❌ Erreur /sales/search :', error);
    res.status(500).json({ error: 'Erreur serveur interne' });
  }
});


app.listen(PORT, () => {
  console.log(`📡 Running on port ${PORT}`);
});
