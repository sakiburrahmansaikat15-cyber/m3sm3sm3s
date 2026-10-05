// Production entry for cPanel "Setup Node.js App" (Application startup file: server.js).
// Passenger provides the port; locally it falls back to 3000.
const { createServer } = require("http");
const { parse } = require("url");
const next = require("next");

const port = parseInt(process.env.PORT || "3000", 10);
const opts = { dev: false, dir: __dirname };
// Tell Next the real port when we know it (Passenger may not set PORT)
if (process.env.PORT && /^\d+$/.test(process.env.PORT)) Object.assign(opts, { hostname: "localhost", port });
const app = next(opts);
const handle = app.getRequestHandler();

app.prepare().then(() => {
  createServer((req, res) => handle(req, res, parse(req.url, true))).listen(port, () => {
    console.log(`> M3S ready on port ${port}`);
  });
});
