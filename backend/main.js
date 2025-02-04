const express = require('express');
const serveIndex = require('serve-index');
const path = require('path');
const fs = require('fs');

// Make sure the history folder exists
if (!fs.existsSync(path.join(__dirname, 'history'))) {
  fs.mkdirSync(path.join(__dirname, 'history'));
}

// Initializing the Router
const app = express.Router();

// Serving the frontend files
app.use(express.static(path.join(__dirname, '..', 'frontend')));

// Serving the history files
app.use("/historico", express.static(path.join(__dirname, 'history')), serveIndex(path.join(__dirname, 'history'), { icons: true, view: 'details' }));

// Adding the API Router
app.use("/api", require('./api/index.js'));

// Adding the index route
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'frontend', 'index.html'));
});

// Exporting the Router
module.exports = app;