# Dashboard de Ventas

Panel web para visualizar indicadores de ventas, productos más vendidos y cartera pendiente. Backend en Node.js/Express que expone una API REST y un frontend ligero en JavaScript vanilla con gráficos.

## Idea del proyecto

Dar visibilidad rápida al desempeño comercial: ventas del día, ventas por período, top de productos, clientes con saldo pendiente. Ideal para un negocio pequeño que ya registra ventas en una base de datos.

## Stack tecnológico

- Node.js 20
- Express 4
- MySQL (mysql2)
- JavaScript (vanilla) en el frontend
- Chart.js (CDN) para gráficos
- (Opcional) JWT para autenticación

## Estructura del proyecto

```
dashboard-ventas-nodejs/
├── package.json
├── server.js
├── .env.example
├── routes/
│   └── ventas.js
└── public/
    └── index.html
```

## Cómo ejecutar

1. Instala Node.js 20.
2. Copia `.env.example` a `.env` y configura la conexión a MySQL.
3. Instala dependencias:
   ```bash
   npm install
   ```
4. Ejecuta:
   ```bash
   npm start
   ```
5. Abre `http://localhost:3000`.

## Endpoints principales

- `GET /api/ventas/resumen` — totales del día, mes, cartera, ticket promedio y ventas por tipo
- `GET /api/ventas/por-dia?desde=&hasta=` — ventas agrupadas por día (filtros opcionales)
- `GET /api/ventas/top-productos?desde=&hasta=` — top 5 productos (filtros opcionales)
- `GET /api/ventas/por-categoria` — ventas por categoría (mes en curso)
- `GET /api/clientes/cartera` — clientes con saldo pendiente y días de antigüedad
- `GET /api/clientes/top` — top 5 clientes por compras
- `GET /api/productos/stock-bajo` — productos con stock <= mínimo

## Metodología

Kanban: tablero con columnas Backlog, En progreso, Revisión y Hecho.

## Autor

Luis Ernesto Corredor Jiménez — https://github.com/lysusco
