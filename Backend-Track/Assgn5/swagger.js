/**
 * swagger.js  -  Stage 5: Swagger UI with bearer-auth padlocks
 *
 * Run:  node swagger.js
 * Opens Swagger UI at http://localhost:3001/docs
 *
 * All existing routes in server.js are untouched.
 * Start BOTH processes: `node server.js` + `node swagger.js`
 */

const swaggerUi   = require("swagger-ui-express");
const openApiSpec = require("./openapi.json");
const express     = require("express");

const app = express();

// Serve raw spec
app.get("/openapi.json", (_req, res) => res.json(openApiSpec));

// Mount Swagger UI
app.use(
  "/docs",
  swaggerUi.serve,
  swaggerUi.setup(openApiSpec, {
    swaggerOptions: { persistAuthorization: true },
    customSiteTitle: "FlyRank API Docs",
  })
);

const DOCS_PORT = process.env.DOCS_PORT || 3001;
app.listen(DOCS_PORT, () => {
  console.log(`Swagger UI  ->  http://localhost:${DOCS_PORT}/docs`);
  console.log(`Raw spec    ->  http://localhost:${DOCS_PORT}/openapi.json`);
});
