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

// Resumen: ventas del día, del mes y cartera pendiente
app.get('/api/ventas/resumen', async (req, res) => {
  try {
    const [[totales]] = await pool.query(`
      SELECT
        COALESCE(SUM(CASE WHEN fecha = CURDATE() THEN total ELSE 0 END), 0) AS hoy,
        COALESCE(SUM(CASE WHEN MONTH(fecha) = MONTH(CURDATE()) AND YEAR(fecha) = YEAR(CURDATE()) THEN total ELSE 0 END), 0) AS mes,
        COALESCE(SUM(CASE WHEN fecha = CURDATE() - INTERVAL 1 DAY THEN total ELSE 0 END), 0) AS hoyAnterior,
        COALESCE(SUM(CASE WHEN MONTH(fecha) = MONTH(CURDATE() - INTERVAL 1 MONTH) AND YEAR(fecha) = YEAR(CURDATE() - INTERVAL 1 MONTH) THEN total ELSE 0 END), 0) AS mesAnterior,
        (SELECT COALESCE(SUM(saldo), 0) FROM clientes WHERE activo = 1) AS cartera,
        COALESCE(AVG(CASE WHEN MONTH(fecha) = MONTH(CURDATE()) AND YEAR(fecha) = YEAR(CURDATE()) THEN total END), 0) AS ticketPromedio
      FROM ventas
    `);
    const [[{ clientesConSaldo }]] = await pool.query(
      `SELECT COUNT(*) AS clientesConSaldo FROM clientes WHERE activo = 1 AND saldo > 0`
    );
    const [[{ ventasMesCantidad }]] = await pool.query(
      `SELECT COUNT(*) AS ventasMesCantidad FROM ventas WHERE MONTH(fecha)=MONTH(CURDATE()) AND YEAR(fecha)=YEAR(CURDATE())`
    );
    const [ventasPorTipo] = await pool.query(`
      SELECT tipo_venta AS tipo, COALESCE(SUM(total),0) AS total, COUNT(*) AS cantidad
      FROM ventas
      WHERE MONTH(fecha)=MONTH(CURDATE()) AND YEAR(fecha)=YEAR(CURDATE())
      GROUP BY tipo_venta
    `);
    res.json({ ...totales, clientesConSaldo, ventasMesCantidad, ventasPorTipo });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// Top 5 productos más vendidos (filtro opcional por fecha)
app.get('/api/ventas/top-productos', async (req, res) => {
  try {
    const { desde, hasta } = req.query;
    const where = [];
    const params = [];
    if (desde) { where.push('v.fecha >= ?'); params.push(desde); }
    if (hasta) { where.push('v.fecha <= ?'); params.push(hasta); }
    const sql = `
      SELECT p.nombre, SUM(dv.cantidad) AS cantidad
      FROM detalle_ventas dv
      JOIN productos p ON p.id = dv.producto_id
      JOIN ventas v ON v.id = dv.venta_id
      ${where.length ? 'WHERE ' + where.join(' AND ') : ''}
      GROUP BY p.id, p.nombre
      ORDER BY cantidad DESC
      LIMIT 5
    `;
    const [rows] = await pool.query(sql, params);
    res.json(rows);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// Ventas agrupadas por día (últimos 14 o rango indicado)
app.get('/api/ventas/por-dia', async (req, res) => {
  try {
    const { desde, hasta } = req.query;
    const where = [];
    const params = [];
    if (desde) { where.push('fecha >= ?'); params.push(desde); }
    if (hasta) { where.push('fecha <= ?'); params.push(hasta); }
    let sql = `SELECT DATE_FORMAT(fecha, '%Y-%m-%d') AS fecha, SUM(total) AS total FROM ventas`;
    if (where.length) sql += ' WHERE ' + where.join(' AND ');
    sql += ' GROUP BY fecha ORDER BY fecha DESC';
    sql += where.length ? '' : ' LIMIT 14';
    const [rows] = await pool.query(sql, params);
    res.json(rows);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// Cartera de clientes: saldo pendiente y días desde la venta parcial más antigua
app.get('/api/clientes/cartera', async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT c.id, c.nombre, c.saldo,
        COALESCE(DATEDIFF(CURDATE(), MIN(v.fecha)), 0) AS dias
      FROM clientes c
      LEFT JOIN ventas v
        ON v.cliente_id = c.id AND v.estado IN ('parcial', 'fiada')
      WHERE c.activo = 1 AND c.saldo > 0
      GROUP BY c.id, c.nombre, c.saldo
      ORDER BY c.saldo DESC
    `);
    res.json(rows);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// Productos con stock bajo (stock_actual <= stock_minimo)
app.get('/api/productos/stock-bajo', async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT p.id, p.nombre, p.stock_actual, p.stock_minimo, c.nombre AS categoria
      FROM productos p
      LEFT JOIN categorias c ON c.id = p.categoria_id
      WHERE p.activo = 1 AND p.stock_actual <= p.stock_minimo
      ORDER BY (p.stock_minimo - p.stock_actual) DESC, p.nombre
    `);
    res.json(rows);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// Top 5 clientes por total comprado
app.get('/api/clientes/top', async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT c.nombre, COALESCE(SUM(v.total), 0) AS total, COUNT(v.id) AS compras
      FROM clientes c
      JOIN ventas v ON v.cliente_id = c.id
      GROUP BY c.id, c.nombre
      ORDER BY total DESC
      LIMIT 5
    `);
    res.json(rows);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// Ventas agrupadas por categoría (mes en curso, basado en detalle_ventas)
app.get('/api/ventas/por-categoria', async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT COALESCE(c.nombre, 'Sin categoría') AS categoria, COALESCE(SUM(dv.subtotal), 0) AS total
      FROM detalle_ventas dv
      JOIN productos p ON p.id = dv.producto_id
      LEFT JOIN categorias c ON c.id = p.categoria_id
      JOIN ventas v ON v.id = dv.venta_id
      WHERE MONTH(v.fecha) = MONTH(CURDATE()) AND YEAR(v.fecha) = YEAR(CURDATE())
      GROUP BY c.id, c.nombre
      ORDER BY total DESC
    `);
    res.json(rows);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Dashboard corriendo en http://localhost:${PORT}`));