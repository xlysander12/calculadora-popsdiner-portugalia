const express = require('express');
const bodyParser = require('body-parser');
const path = require('path');
const mysql = require('mysql2/promise');
const env = require('dotenv');

// Loading the environment variables
env.config({path: path.join(__dirname, '..', '.env')});

// Initializing the Router
const app = express.Router();

app.use(bodyParser.json());

// Initializing the MySQL connection
const mysqlPool = mysql.createPool({
    host: process.env.POPSDINER_MYSQL_HOST,
    user: process.env.POPSDINER_MYSQL_USER,
    password: process.env.POPSDINER_MYSQL_PASSWORD,
    database: process.env.POPSDINER_MYSQL_DATABASE,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

// Util Vars
const categorias = ["bebidas", "comidas", "menus_carne", "menus_peixe", "menus_carne_peixe"];

// Route to fetch categories
app.get("/categorias/:category", async (req, res) => {
    // Check if category is valid
    const category = req.params.category;
    if (!categorias.includes(category)) {
        res.status(400).json({ error: "Categoria inválida" });
        return;
    }

    // Fetch the items from the category
    try {
        const [rows] = await mysqlPool.query(`SELECT * FROM ${category}`);
        res.json(rows);
    } catch (e) {
        console.error(e);
        res.status(500).json({ error: "Failed to fetch crimes" });
    }
});

// Route to fetch a specific item
app.get("/items/:id", async (req, res) => {
    // Fetch the item from the database
    try {
        const [rows] = await mysqlPool.query(`SELECT * FROM cardapio WHERE id = ?`, [req.params.id]);
        if (rows.length === 0) {
            res.status(404).json({ error: "Item não encontrado" });
            return;
        }
        res.json(rows[0]);
    } catch (e) {
        console.error(e);
        res.status(500).json({ error: "Failed to fetch item" });
    }
});

// Route to submit a sale
app.post("/venda", async (req, res) => {
    // Making sure the body has all required fields
    if (req.body === undefined || !req.body.hasOwnProperty("vendedor") || !req.body.hasOwnProperty("items") || !req.body.hasOwnProperty("valor")) {
        res.status(400).json({ error: "Pedido inválido" });
        return;
    }

    // Add this sale to the database
    try {
        const [result] = await mysqlPool.query(`INSERT INTO registo (vendedor, items, valor) VALUES (?, ?, ?)`, [req.body.vendedor, JSON.stringify(req.body.items), req.body.valor]);
        res.json({ id: result.insertId });
    } catch (e) {
        console.error(e);
        res.status(500).json({ error: "Failed to submit sale" });
    }
});


// Exporting the Router
module.exports = app;