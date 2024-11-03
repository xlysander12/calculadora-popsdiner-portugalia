const express = require('express');

// Creating the app
const app = express();

// Adding the router
app.use("/portugalia/calculadora_popsdinner", require('./index.js'));

// Starting the server
app.listen(3000);