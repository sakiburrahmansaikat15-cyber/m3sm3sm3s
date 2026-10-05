import mysql from 'mysql2/promise';

async function run() {
  const c = await mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'm3s_store'
  });
  
  await c.query('UPDATE products SET model_url = "/amazigh_t-shirt.glb" WHERE slug = "monsoon"');
  await c.query('UPDATE products SET model_url = "/amazigh_traditional_t-shirt.glb" WHERE slug = "code-mode"');
  await c.query('UPDATE products SET model_url = "/amazigh_t-shirt.glb" WHERE slug = "sundarban"');
  await c.query('UPDATE products SET model_url = "/amazigh_traditional_t-shirt.glb" WHERE slug = "old-town"');
  
  // Set default model url in theme settings to ensure moc t-shirt is entirely gone
  await c.query('UPDATE settings SET value = JSON_SET(value, "$.defaultModelUrl", "/amazigh_t-shirt.glb") WHERE `key` = "theme"');
  
  console.log("Updated products and settings");
  process.exit(0);
}

run();
