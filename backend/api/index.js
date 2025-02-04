const express = require('express');

const path = require('path');
const fs = require('fs');
const mysql = require('mysql2/promise');

// Initializing the Router
const app = express.Router();

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
const categorias = ["bebidas", "comidas", "menus_carne", "menus_peixe", "menus_carne_peixe", "menus_pastelaria"];

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
        res.status(500).json({ error: "Failed to fetch items" });
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

// Route to export sales to txt file
app.post("/exportar", async (req, res) => {
    // Make sure the provided password is the correct one
    if (req.body === undefined || !req.body.hasOwnProperty("password") || req.body.password !== process.env.POPSDINER_PASSWORD) {
        res.status(401).json({ error: "Unauthorized" });
        return;
    }

    // Fetch all sales that are after the stored timestamp in the database
    try {
        const [registryRows] = await mysqlPool.query(`SELECT a.* FROM registo AS a LEFT JOIN ultima_exportacao b ON a.timestamp <= b.timestamp WHERE b.timestamp IS NULL`);

        // If there are no new sales, return
        if (registryRows.length === 0) {
            res.status(404).json({ error: "No new sales to export" });
            return
        }

        // Check for the table with the latest export
        const [latestExport] = await mysqlPool.query(`SELECT * FROM ultima_exportacao ORDER BY timestamp DESC LIMIT 1`);

        // If there isn't a timestamp stored in the database, insert one
        if (latestExport.length === 0) {
            await mysqlPool.query(`INSERT INTO ultima_exportacao(timestamp) VALUES (?)`, [registryRows[registryRows.length - 1].timestamp]);
        } else {
            await mysqlPool.query(`UPDATE ultima_exportacao SET timestamp = ?`, [registryRows[registryRows.length - 1].timestamp]);
        }

        const data = registryRows.map(row => {
            return {
                id: row.id,
                vendedor: row.vendedor,
                items: JSON.parse(row.items),
                valor: row.valor
            };
        });

        // Generate the name of the file
        const initialDate = registryRows[0].timestamp;
        const finalDate = registryRows[registryRows.length - 1].timestamp;
        const fileName = `historico-${initialDate.getUTCFullYear()}-${initialDate.getUTCMonth() + 1}-${initialDate.getUTCDate()}_${initialDate.getUTCHours()}-${initialDate.getUTCMinutes()}-${initialDate.getUTCSeconds()}--${finalDate.getUTCFullYear()}-${finalDate.getUTCMonth() + 1}-${finalDate.getUTCDate()}_${finalDate.getUTCHours()}-${finalDate.getUTCMinutes()}-${finalDate.getUTCSeconds()}.txt`;


        // Loop through the sales and create the content
        let content = "";
        for (let sale of data) {
            // Get the details of all items in the sale
            let items = [];
            let nonDiscountableItemsSum = 0;
            for (let item of sale.items) {
                const [rows] = await mysqlPool.query(`SELECT * FROM cardapio WHERE id = ?`, [item]);
                items.push({
                        id: rows[0].id,
                        nome: rows[0].nome,
                        preco: rows[0].preço,
                });

                if (rows[0].descontável === 0) {
                    nonDiscountableItemsSum += rows[0].preço;
                }
            }

            let bruto = items.reduce((sum, item) => sum + item.preco, 0);

            content += `==== Venda #${sale.id} ====\n`;
            content += `Funcionário: ${sale.vendedor}\n`;
            content += `Preço Bruto: ${bruto} €\n`;
            content += `Desconto Aplicado: ${(1 - ((sale.valor - nonDiscountableItemsSum) / (bruto - nonDiscountableItemsSum))) * 100}%\n`;
            content += `Preço Final: ${sale.valor} €\n`;
            content += "Items:\n";

            for (let i = 0; i < items.length; i++) {
                let count = 0;
                for (let j = 0; j < items.length; j++) {
                    if (items[i].id === items[j].id) {
                        count++;
                    } else {
                        break;
                    }
                }

                content += `- x${count} ${items[i].nome}\n`;
            }
            content += "\n";
        }

        // Create the text file and place the content in it
        fs.writeFile(path.join(__dirname, "..", "history", fileName), content, () => {
            res.json({ url: `historico/${fileName}` });
        });
    } catch (e) {
        console.error(e);
        res.status(500).json({ error: "Failed to export sales" });
    }
});


// Exporting the Router
module.exports = app;