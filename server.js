// Aura-Fake-Booking-Demo with UI

const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.static('public'));
app.use(cors());
app.use(bodyParser.json());

// ======= CONFIG & MOCK DATA =======
const VALID_API_KEY = 'AURA-TEST-KEY-12345';
const bookings = { food: [], movies: [] };

// CRITICAL MOCK DATA: AURA checks this first via /api/available
const availableItems = {
  success: true,
  food: [
    { id: 'pizza_margherita', name: 'Margherita Pizza' },
    { id: 'biryani_chicken', name: 'Chicken Biryani' },
    { id: 'burger_classic', name: 'Classic Burger' },
    { id: 'taco_fish', name: 'Fish Taco' },
    { id: 'pasta_alfredo', name: 'Fettuccine Alfredo' },
  ],
  movies: [
    { id: 'mov_101', name: 'Space Adventures', showTimes: [new Date(Date.now() + 86400000).toISOString(), new Date(Date.now() + 172800000).toISOString()] },
    { id: 'mov_303', name: 'Action Blast', showTimes: [new Date(Date.now() + 86400000 + 3600000).toISOString()] },
  ]
};

function requireApiKey(req, res, next) {
  const key = req.header('x-api-key') || req.query.api_key;
  if (!key) return res.status(401).json({ error: 'missing api key' });
  if (key !== VALID_API_KEY) return res.status(403).json({ error: 'invalid api key' });
  next();
}

// ======= API ENDPOINTS =======

// 1. MISSING ENDPOINT: Provides the available items list to AURA
app.get('/api/available', requireApiKey, (req, res) => {
  setTimeout(() => {
    res.json(availableItems);
  }, 100);
});

// 2. BOOK FOOD ENDPOINT (Updated to return expected fields)
app.post('/api/book-food', requireApiKey, (req, res) => {
  const { itemId, quantity, address } = req.body || {};
  if (!itemId || !quantity || !address) return res.status(400).json({ success: false, error: 'itemId, quantity and address required' });
  
  const itemDetails = availableItems.food.find(item => item.id === itemId);
  if (!itemDetails) return res.status(404).json({ success: false, message: `Item ID '${itemId}' not found.` });

  const id = `FOOD-${Date.now()}`;
  const price = (itemId === 'biryani_chicken' ? 14.99 : 12.99); // Specific Biryani price mock
  const totalPrice = parseFloat((quantity * price).toFixed(2));
  const deliveryTime = new Date(Date.now() + (45 * 60000)).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });

  const record = { id, itemId, quantity, address, status: 'confirmed', createdAt: new Date().toISOString(), totalPrice, estimatedDelivery: deliveryTime };
  bookings.food.push(record);
  
  res.json({ 
    success: true, 
    bookingId: id,
    itemId,
    quantity,
    address,
    totalPrice,
    estimatedDelivery: deliveryTime,
    message: `${itemDetails.name} order placed successfully! Delivery by ${deliveryTime}.`
  });
});

// 3. BOOK MOVIE ENDPOINT (Updated to return expected fields)
app.post('/api/book-movie', requireApiKey, (req, res) => {
  const { movieId, seats, showTime } = req.body || {};
  if (!movieId || !Array.isArray(seats) || seats.length === 0 || !showTime) return res.status(400).json({ success: false, error: 'movieId, seats, showTime required' });
  
  const movieDetails = availableItems.movies.find(movie => movie.id === movieId);
  if (!movieDetails) return res.status(404).json({ success: false, message: `Movie ID '${movieId}' not found.` });

  const id = `MOV-${Date.now()}`;
  const totalPrice = parseFloat((seats.length * 15.00).toFixed(2));

  const record = { id, movieId, seats, showTime, status: 'tickets_issued', createdAt: new Date().toISOString(), totalPrice, theater: 'Grand Hall' };
  bookings.movies.push(record);

  res.json({ 
    success: true, 
    bookingId: id,
    movieId,
    seats,
    showTime,
    totalPrice,
    theater: 'Grand Cinema Hall 5',
    message: `${movieDetails.name} tickets booked successfully!`
  });
});

// 4. GET BOOKINGS ENDPOINT (Updated to combine and format data)
app.get('/api/bookings', requireApiKey, (req, res) => {
  const allBookings = [
    ...bookings.food.map(b => ({ id: b.id, type: 'food', details: b, timestamp: b.createdAt })),
    ...bookings.movies.map(b => ({ id: b.id, type: 'movie', details: b, timestamp: b.createdAt }))
  ].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

  res.json({
    success: true,
    bookings: allBookings,
    message: `${allBookings.length} bookings found.`
  });
});

// ======= FRONTEND =======
// Optional: Update the HTML served on the root path for local testing
app.get('/', (req, res) => {
  res.type('html').send(`... your updated HTML here ...`);
});

app.listen(PORT, () => {
  console.log(\`FasterBook Demo running at http://localhost:\${PORT}\`);
  console.log(\`Demo API key: \${VALID_API_KEY}\`);
});
