const express = require('express');
const bodyParser = require('body-parser');
const env = require('dotenv');
const path = require("path");
// Loading the environment variables
env.config({path: path.join(__dirname, '.env')});

// Creating the app
const app = express();

// Initializing the body parser
app.use(bodyParser.json());

// Adding the router
app.use("/portugalia/calculadora_popsdiner", require('./main.js'));

// Starting the server
app.listen(process.env["HTTP_PORT"], () => {
    console.log(`Server listening on port ${process.env["HTTP_PORT"]}`);
});