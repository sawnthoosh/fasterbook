// server.js (for your FasterBook project)

const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// --- API Key Middleware ---
const API_KEY = process.env.FASTERBOOK_API_KEY || 'your_default_key_here';

const apiKeyAuth = (req, res, next) => {
  const userApiKey = req.get('x-api-key');
  if (!userApiKey || userApiKey !== API_KEY) {
    return res.status(401).json({ error: 'Unauthorized: Missing or invalid API key' });
  }
  next();
};

app.use(bodyParser.json());
app.use(cors());

// Serve static files from 'public' directory
app.use(express.static(path.join(__dirname, 'public')));

// --- Mock Database ---

// Food Menu
const foodMenu = [
  { id: 'f1', name: 'Chicken Biryani', price: 250, category: 'Main Course', available: true, description: 'Aromatic rice dish with spiced chicken.' },
  { id: 'f2', name: 'Paneer Butter Masala', price: 220, category: 'Main Course', available: true, description: 'Creamy tomato gravy with soft paneer.' },
  { id: 'f3', name: 'Gobi Manchurian', price: 180, category: 'Starters', available: true, description: 'Crispy cauliflower florets in a tangy sauce.' },
  { id: 'f4', name: 'Butter Naan', price: 40, category: 'Breads', available: true, description: 'Soft leavened bread with butter.' },
  { id: 'f5', name: 'Coke (250ml)', price: 20, category: 'Beverages', available: false, description: 'Chilled soft drink.' }
];
const foodCategories = ['Starters', 'Main Course', 'Breads', 'Beverages'];

// Movie Listings
const movieMenu = [
  { id: 'm1', title: 'Leo', duration: 164, price: 150 },
  { id: 'm2', title: 'Jailer', duration: 168, price: 180 },
  { id: 'm3', title: 'Vikram', duration: 175, price: 170 }
];

// User Bookings (Temporary - will be replaced by notifications)
let userFoodBookings = [];
let userMovieBookings = [];

// --- API Routes ---

// --- Food Booking ---
app.post('/api/book/food', apiKeyAuth, (req, res) => {
  const { itemId, quantity, address } = req.body;

  if (!itemId || !quantity || !address) {
    return res.status(400).json({ error: 'Missing required fields: itemId, quantity, address' });
  }

  if (!address.toLowerCase().includes('ongole')) {
    return res.status(400).json({ error: 'Sorry, we only deliver to the Ongole area.' });
  }

  const item = foodMenu.find(i => i.id === itemId);
  if (!item) {
    return res.status(404).json({ error: 'Item not found' });
  }
  if (!item.available) {
    return res.status(400).json({ error: 'Sorry, this item is currently unavailable' });
  }

  const totalPrice = item.price * quantity;
  const bookingId = `fb_${Date.now()}`;
  
  // This is the full response object AURA expects
  const bookingResponse = {
    bookingId: bookingId,
    itemId,
    itemName: item.name,
    quantity,
    totalPrice,
    address,
    status: 'Confirmed',
    estimatedDelivery: '30-45 minutes'
  };

  userFoodBookings.push(bookingResponse); // Still useful for /bookings route

  // --- ADD THIS NOTIFICATION BLOCK ---
  try {
    const webhookUrl = process.env.DISCORD_WEBHOOK_URL;
    if (webhookUrl) {
      // fetch is built into Node.js (v18+), no install needed.
      fetch(webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content: `🎉 **New Food Order!** - ${bookingId}`,
          embeds: [{
            title: `Order: ${item.name} (x${quantity})`,
            color: 5814783, // A nice green color
            fields: [
              { name: 'Customer Address', value: address, inline: false },
              { name: 'Total Price', value: `₹${totalPrice}`, inline: true },
              { name: 'Status', value: 'Confirmed', inline: true }
            ],
            timestamp: new Date().toISOString()
          }]
        })
      });
    }
  } catch (notifyError) {
    console.error("Failed to send Discord notification:", notifyError);
  }
  // --- END NOTIFICATION BLOCK ---

  res.status(201).json(bookingResponse);
});

// --- Movie Booking ---
app.post('/api/book/movie', apiKeyAuth, (req, res) => {
  const { movieId, seats } = req.body;

  if (!movieId || !seats || !Array.isArray(seats) || seats.length === 0) {
    return res.status(400).json({ error: 'Missing required fields: movieId and an array of seats' });
  }

  const movie = movieMenu.find(m => m.id === movieId);
  if (!movie) {
    return res.status(404).json({ error: 'Movie not found' });
  }

  const totalPrice = movie.price * seats.length;
  const bookingId = `mb_${Date.now()}`;

  const bookingResponse = {
    bookingId: bookingId,
    movieId,
    movieTitle: movie.title,
    seats,
    totalPrice,
    status: 'Confirmed'
  };

  userMovieBookings.push(bookingResponse); // Still useful for /bookings route

  // --- ADD THIS NOTIFICATION BLOCK (for movies) ---
  try {
    const webhookUrl = process.env.DISCORD_WEBHOOK_URL;
    if (webhookUrl) {
      fetch(webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content: `🎟️ **New Movie Booking!** - ${bookingId}`,
          embeds: [{
            title: `Movie: ${movie.title}`,
            color: 5814783, // A nice blue color
            fields: [
              { name: 'Seats', value: seats.join(', '), inline: true },
              { name: 'Total Price', value: `₹${totalPrice}`, inline: true }
            ],
            timestamp: new Date().toISOString()
          }]
        })
      });
    }
  } catch (notifyError) {
    console.error("Failed to send Discord notification:", notifyError);
  }
  // --- END NOTIFICATION BLOCK ---

  res.status(201).json(bookingResponse);
});

// --- Get All Bookings ---
app.get('/api/bookings', apiKeyAuth, (req, res) => {
  res.status(200).json({
    foodBookings: userFoodBookings,
    movieBookings: userMovieBookings
  });
});

// --- Get Food Menu Route ---
app.get('/api/menu', apiKeyAuth, (req, res) => {
  try {
    const availableItems = foodMenu.filter(item => item.available);
    
    res.status(200).json({
      items: availableItems,
      categories: foodCategories
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to load menu' });
  }
});


// --- Root - Serves the HTML page ---
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// --- Start Server ---
app.listen(PORT, () => {
  console.log(`FasterBook server running on port ${PORT}`);
});
