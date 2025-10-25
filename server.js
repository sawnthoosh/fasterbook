// Aura-Fake-Booking-Demo with UI
// Node.js + Express + beautiful frontend demo for food + movie booking API

const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');

const app = express();
const PORT = process.env.PORT || 3000;

// Serve static files from 'public' folder (if you add any)
app.use(express.static('public'));

app.use(cors());
app.use(bodyParser.json());

// ======= CONFIG =======
const VALID_API_KEY = 'AURA-TEST-KEY-12345';
const bookings = { food: [], movies: [] };

function requireApiKey(req, res, next) {
  const key = req.header('x-api-key') || req.query.api_key;
  if (!key) return res.status(401).json({ error: 'missing api key' });
  if (key !== VALID_API_KEY) return res.status(403).json({ error: 'invalid api key' });
  next();
}

// ======= API ENDPOINTS =======
app.post('/api/book-food', requireApiKey, (req, res) => {
  const { itemId, quantity, address } = req.body || {};
  if (!itemId || !quantity || !address) return res.status(400).json({ error: 'itemId, quantity and address required' });
  const id = `FOOD-${Date.now()}`;
  const record = { id, itemId, quantity, address, status: 'confirmed', createdAt: new Date().toISOString() };
  bookings.food.push(record);
  res.json({ success: true, booking: record });
});

app.post('/api/book-movie', requireApiKey, (req, res) => {
  const { movieId, seats, showTime } = req.body || {};
  if (!movieId || !Array.isArray(seats) || seats.length === 0 || !showTime) return res.status(400).json({ error: 'movieId, seats, showTime required' });
  const id = `MOV-${Date.now()}`;
  const record = { id, movieId, seats, showTime, status: 'tickets_issued', createdAt: new Date().toISOString() };
  bookings.movies.push(record);
  res.json({ success: true, booking: record });
});

app.get('/api/bookings', requireApiKey, (req, res) => res.json(bookings));

// ======= FRONTEND =======
app.get('/', (req, res) => {
  res.type('html').send(`... your HTML here ...`);
});

app.listen(PORT, () => {
  console.log(`FasterBook Demo running at http://localhost:${PORT}`);
  console.log(`Demo API key: ${VALID_API_KEY}`);
});
