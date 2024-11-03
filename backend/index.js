const express = require('express');
const path = require('path');

// Initializing the Router
const app = express.Router();

// Serving the static files
app.use(express.static(path.join(__dirname, '..', 'frontend')));

// Adding the API Router
app.use("/api", require('./api/index.js'));

// Adding the index route
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'frontend', 'index.html'));
});

// Exporting the Router
module.exports = app;