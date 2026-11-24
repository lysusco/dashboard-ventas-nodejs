# Contexto del Proyecto 2: Dashboard de Ventas (Node.js / Express)

> Archivo de contexto para iniciar un nuevo chat en OpenCode trabajando específicamente en este proyecto.

## Identidad del desarrollador
- **Nombre:** Luis Ernesto Corredor Jiménez
- **Perfil:** Desarrollador pragmático, nivel básico–intermedio, experiencia en ERP (GeneXus, Java, JS, PHP, Spring Boot, Laravel).
- **GitHub:** https://github.com/lysusco
- **Objetivo:** Demostrar manejo de Node.js/Express con complejidad limitada pero funcional.

## Proyecto
- **Nombre:** Dashboard de Ventas
- **Ruta local:** `C:\Users\jimen\OneDrive\Documentos\InformacionTrabajo\dashboard-ventas-nodejs`
- **Repo GitHub:** https://github.com/lysusco/dashboard-ventas-nodejs
- **Complejidad objetivo:** básica–intermedia (API REST simple + frontend con gráficos, sin sobre-ingeniería).

## Stack
- Node.js 24 + npm 11
- Express 4
- MySQL (MariaDB 10.4, vía XAMPP) — base de datos `minimercado_el_ahorro` (reutiliza datos del proyecto MiniMarket)
- Chart.js (CDN) en el frontend
- Puerto del servidor: **3000**

## Estructura de archivos
```
dashboard-ventas-nodejs/
├── package.json
├── server.js
├── .env.example
├── routes/ventas.js        (reservado para futuras rutas)
├── public/index.html       (frontend con Chart.js)
└── README.md
```

## Endpoints disponibles
- `GET /api/ventas/resumen` — totales del día, del mes, cartera, ticket promedio, ventas por tipo
- `GET /api/ventas/por-dia?desde=&hasta=` — ventas agrupadas por día (filtros opcionales)
- `GET /api/ventas/top-productos?desde=&hasta=` — top 5 productos (filtros opcionales)
- `GET /api/ventas/por-categoria` — ventas por categoría (mes en curso)
- `GET /api/clientes/cartera` — clientes con saldo pendiente y días de antigüedad
- `GET /api/clientes/top` — top 5 clientes por compras
- `GET /api/productos/stock-bajo` — productos con stock <= mínimo

## Tablas usadas en la BD (minimercado_el_ahorro)
- `ventas` (id, cliente_id, fecha, total, estado[pagada/parcial], created_at)
- `detalle_ventas` (venta_id, producto_id, cantidad)
- `productos` (id, nombre)
- `clientes` (id, nombre, saldo, activo)
- `abonos` (venta_id, monto, fecha)

## Cómo ejecutar
```bash
cd C:\Users\jimen\OneDrive\Documentos\InformacionTrabajo\dashboard-ventas-nodejs
copy .env.example .env
npm install
npm start
# Abre http://localhost:3000
```
MySQL debe estar corriendo (XAMPP). Verifica credenciales en `.env`.

## Herramientas del entorno
- Node: `node -v` (v24)
- npm: `npm -v` (11)
- MySQL: `C:\xampp\mysql\bin\mysql.exe`
- Git/GitHub CLI (`gh`) autenticado como `lysusco`.

## Notas importantes
- El frontend usa Chart.js vía CDN (sin build step).
- La BD se reutiliza del proyecto MiniMarketElAhorro (`minimercado_el_ahorro`).
- Complejidad limitada: sin autenticación, sin WebSockets, sin ORM. Priorizar endpoints claros y gráficos simples.
- El README y el portafolio ya referencian este proyecto.

## Prompt sugerido para el nuevo chat
> "Trabajo en el proyecto Node.js/Express de dashboard de ventas ubicado en `C:\Users\jimen\OneDrive\Documentos\InformacionTrabajo\dashboard-ventas-nodejs`. Lee el archivo `CONTEXTO.md` para tener todo el contexto. Quiero [describe aquí el cambio o adición]."
