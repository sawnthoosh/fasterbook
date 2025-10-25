// Aura-Fake-Booking-Demo with UI
// Save as server.js
// Node.js + Express + beautiful frontend demo for food + movie booking API
const app = express();
app.use(express.static('public'));

const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const app = express();
const PORT = process.env.PORT || 3000;

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
  res.type('html').send(`
<!doctype html>
<html>
<head>
  <meta charset="utf-8" />
  <title>FasterBook - Food & Movie Booking</title>
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <link href="https://fonts.googleapis.com/css2?family=Roboto:wght@400;700&display=swap" rel="stylesheet">
  <style>
    body{font-family:'Roboto',sans-serif;margin:0;padding:0;background:#f4f6f8;color:#333;}
    header{background:#4CAF50;color:white;padding:20px;text-align:center;font-size:24px;font-weight:bold;}
    main{padding:20px;max-width:900px;margin:auto;}
    .card{background:white;border-radius:10px;box-shadow:0 4px 8px rgba(0,0,0,0.1);padding:20px;margin-bottom:20px;}
    label{display:block;margin-top:10px;font-weight:bold;}
    input, select, textarea{width:100%;padding:10px;margin-top:5px;border-radius:5px;border:1px solid #ccc;}
    button{padding:10px 20px;margin-top:15px;border:none;border-radius:5px;background:#4CAF50;color:white;font-weight:bold;cursor:pointer;transition:0.3s;}
    button:hover{background:#45a049;}
    pre{background:#f0f0f0;padding:10px;border-radius:5px;overflow-x:auto;}
  </style>
</head>
<body>
<header>FasterBook</header>
<main>
  <div class="card">
    <h2>API Key (for AURA)</h2>
    <input id="apiKey" value="AURA-TEST-KEY-12345" />
    <small>Use this key in <code>x-api-key</code> header.</small>
  </div>

  <div class="card">
    <h2>Book Food</h2>
    <label>Item</label>
    <select id="foodItem">
      <option value="pizza_margherita">Pizza Margherita</option>
      <option value="burger_classic">Burger Classic</option>
      <option value="biryani_chicken">Chicken Biryani</option>
    </select>
    <label>Quantity</label>
    <input id="foodQty" type="number" value="1" />
    <label>Delivery Address</label>
    <textarea id="foodAddress">Dorm A, Room 12</textarea>
    <button onclick="bookFood()">Book Food</button>
    <pre id="foodResult"></pre>
  </div>

  <div class="card">
    <h2>Book Movie Tickets</h2>
    <label>Movie</label>
    <select id="movieId">
      <option value="mov_101">Space Adventures</option>
      <option value="mov_200">Romcom Express</option>
      <option value="mov_303">Action Blast</option>
    </select>
    <label>Seats (comma separated)</label>
    <input id="movieSeats" value="A1,A2" />
    <label>Show Time</label>
    <input id="showTime" value="2025-10-30T19:30:00" />
    <button onclick="bookMovie()">Book Movie</button>
    <pre id="movieResult"></pre>
  </div>

<script>
  async function bookFood(){
    const key=document.getElementById('apiKey').value;
    const itemId=document.getElementById('foodItem').value;
    const quantity=Number(document.getElementById('foodQty').value);
    const address=document.getElementById('foodAddress').value;
    const resEl=document.getElementById('foodResult');
    resEl.textContent='...';
    try{
      const r=await fetch('/api/book-food',{method:'POST',headers:{'Content-Type':'application/json','x-api-key':key},body:JSON.stringify({itemId,quantity,address})});
      const j=await r.json();
      resEl.textContent=JSON.stringify(j,null,2);
    }catch(e){resEl.textContent=String(e);}
  }

  async function bookMovie(){
    const key=document.getElementById('apiKey').value;
    const movieId=document.getElementById('movieId').value;
    const seats=document.getElementById('movieSeats').value.split(',').map(s=>s.trim()).filter(Boolean);
    const showTime=document.getElementById('showTime').value;
    const resEl=document.getElementById('movieResult');
    resEl.textContent='...';
    try{
      const r=await fetch('/api/book-movie',{method:'POST',headers:{'Content-Type':'application/json','x-api-key':key},body:JSON.stringify({movieId,seats,showTime})});
      const j=await r.json();
      resEl.textContent=JSON.stringify(j,null,2);
    }catch(e){resEl.textContent=String(e);}
  }
</script>
</main>
</body>
</html>
  `);
});

app.listen(PORT, () => {
  console.log(`FasterBook Demo running at http://localhost:${PORT}`);
  console.log(`Demo API key: ${VALID_API_KEY}`);
});
