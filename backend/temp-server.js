const express = require('express');

// Creating the app
const app = express();

// Adding the router
app.use("/portugalia/calculadora_popsdiner", require('./index.js'));

// Starting the server
app.listen(3000);