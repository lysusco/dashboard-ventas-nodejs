require('dotenv').config();
const express = require('express');
const cors = require('cors');
const mysql = require('mysql2/promise');

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

const pool = mysql.createPool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT || 3306,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  waitForConnections: true,
  connectionLimit: 10
});

app.get('/api/ventas/resumen', async (req, res) => {
  try {
    const [[totales]] = await pool.query(`
      SELECT
        COALESCE(SUM(CASE WHEN DATE(created_at)=CURDATE() THEN total ELSE 0 END),0) AS hoy,
        COALESCE(SUM(CASE WHEN MONTH(created_at)=MONTH(CURDATE()) AND YEAR(created_at)=YEAR(CURDATE()) THEN total ELSE 0 END),0) AS mes,
        COALESCE(SUM(CASE WHEN estado='fiada' THEN total-abonado ELSE 0 END),0) AS cartera
      FROM ventas
    `);
    res.json(totales);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.get('/api/ventas/top-productos', async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT p.nombre, SUM(dv.cantidad) AS cantidad
      FROM detalle_ventas dv
      JOIN productos p ON p.id = dv.producto_id
      GROUP BY p.id, p.nombre
      ORDER BY cantidad DESC
      LIMIT 5
    `);
    res.json(rows);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.get('/api/ventas/por-dia', async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT DATE(created_at) AS fecha, SUM(total) AS total
      FROM ventas
      GROUP BY DATE(created_at)
      ORDER BY fecha DESC
      LIMIT 14
    `);
    res.json(rows);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Dashboard corriendo en http://localhost:${PORT}`));
