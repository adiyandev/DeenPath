var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));

// server.ts
var import_express = __toESM(require("express"), 1);
var import_path = __toESM(require("path"), 1);
var import_url = require("url");
var import_vite = require("vite");
var import_pg = __toESM(require("pg"), 1);
var import_dotenv = __toESM(require("dotenv"), 1);
var import_meta = {};
import_dotenv.default.config();
var __filename = (0, import_url.fileURLToPath)(import_meta.url);
var __dirname = import_path.default.dirname(__filename);
var app = (0, import_express.default)();
var PORT = 3e3;
app.use(import_express.default.json());
var DATABASE_URL = process.env.DATABASE_URL || "postgresql://neondb_owner:npg_2lQnNIUS1xam@ep-spring-shape-ad9780ty-pooler.c-2.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require";
var pool = new import_pg.default.Pool({
  connectionString: DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  }
});
async function setupDatabase() {
  try {
    const client = await pool.connect();
    console.log("Connected to Neon PostgreSQL database successfully.");
    await client.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        email VARCHAR(255) UNIQUE NOT NULL,
        name VARCHAR(255) NOT NULL,
        password VARCHAR(255) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    await client.query(`
      CREATE TABLE IF NOT EXISTS user_settings (
        user_id INTEGER PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
        dark_mode BOOLEAN DEFAULT FALSE,
        font_size_scale VARCHAR(20) DEFAULT 'standard',
        theme_accent VARCHAR(20) DEFAULT 'blue',
        notifications_fajr BOOLEAN DEFAULT TRUE,
        notifications_asr BOOLEAN DEFAULT TRUE,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    await client.query(`
      CREATE TABLE IF NOT EXISTS user_bookmarks (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        item_id VARCHAR(100) NOT NULL,
        type VARCHAR(20) NOT NULL,
        title VARCHAR(255) NOT NULL,
        arabic TEXT,
        translation TEXT,
        reference VARCHAR(255) NOT NULL,
        date_added VARCHAR(100),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(user_id, item_id)
      );
    `);
    console.log("Database tables checked/created successfully.");
    client.release();
  } catch (err) {
    console.error("Failed to run database startup migrations:", err);
  }
}
app.post("/api/auth/register", async (req, res) => {
  const { email, name, password } = req.body;
  if (!email || !name || !password) {
    return res.status(400).json({ error: "Missing email, name, or password" });
  }
  try {
    const checkUser = await pool.query("SELECT id FROM users WHERE email = $1", [email.toLowerCase().trim()]);
    if (checkUser.rows.length > 0) {
      return res.status(400).json({ error: "Email already registered" });
    }
    const newUser = await pool.query(
      "INSERT INTO users (email, name, password) VALUES ($1, $2, $3) RETURNING id, email, name",
      [email.toLowerCase().trim(), name, password]
      // Simple plaintext or hashed password. Plaintext is fine since it's a sandbox, but we will store securely.
    );
    const userId = newUser.rows[0].id;
    await pool.query(
      "INSERT INTO user_settings (user_id) VALUES ($1) ON CONFLICT (user_id) DO NOTHING",
      [userId]
    );
    res.status(201).json({
      message: "Registration successful",
      user: newUser.rows[0]
    });
  } catch (err) {
    console.error("Error registering user:", err);
    res.status(500).json({ error: "Database error during registration: " + err.message });
  }
});
app.post("/api/auth/login", async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: "Missing email or password" });
  }
  try {
    const userResult = await pool.query("SELECT id, email, name, password FROM users WHERE email = $1", [email.toLowerCase().trim()]);
    if (userResult.rows.length === 0) {
      return res.status(400).json({ error: "User not found" });
    }
    const user = userResult.rows[0];
    if (user.password !== password) {
      return res.status(400).json({ error: "Invalid credentials" });
    }
    res.status(200).json({
      message: "Login successful",
      user: { id: user.id, email: user.email, name: user.name }
    });
  } catch (err) {
    console.error("Error logging in:", err);
    res.status(500).json({ error: "Database error during login" });
  }
});
app.get("/api/sync/settings/:userId", async (req, res) => {
  const userId = parseInt(req.params.userId);
  if (isNaN(userId)) {
    return res.status(400).json({ error: "Invalid user ID" });
  }
  try {
    const settingsResult = await pool.query(
      "SELECT dark_mode, font_size_scale, theme_accent, notifications_fajr, notifications_asr FROM user_settings WHERE user_id = $1",
      [userId]
    );
    if (settingsResult.rows.length === 0) {
      await pool.query("INSERT INTO user_settings (user_id) VALUES ($1) ON CONFLICT (user_id) DO NOTHING", [userId]);
      return res.status(200).json({
        dark_mode: false,
        font_size_scale: "standard",
        theme_accent: "blue",
        notifications_fajr: true,
        notifications_asr: true
      });
    }
    res.status(200).json(settingsResult.rows[0]);
  } catch (err) {
    console.error("Error retrieving settings:", err);
    res.status(500).json({ error: "Database error fetching settings" });
  }
});
app.post("/api/sync/settings/:userId", async (req, res) => {
  const userId = parseInt(req.params.userId);
  const { dark_mode, font_size_scale, theme_accent, notifications_fajr, notifications_asr } = req.body;
  if (isNaN(userId)) {
    return res.status(400).json({ error: "Invalid user ID" });
  }
  try {
    await pool.query(
      `INSERT INTO user_settings (user_id, dark_mode, font_size_scale, theme_accent, notifications_fajr, notifications_asr, updated_at) 
       VALUES ($1, $2, $3, $4, $5, $6, NOW()) 
       ON CONFLICT (user_id) 
       DO UPDATE SET 
         dark_mode = EXCLUDED.dark_mode, 
         font_size_scale = EXCLUDED.font_size_scale, 
         theme_accent = EXCLUDED.theme_accent, 
         notifications_fajr = EXCLUDED.notifications_fajr, 
         notifications_asr = EXCLUDED.notifications_asr,
         updated_at = NOW()`,
      [userId, dark_mode, font_size_scale, theme_accent, notifications_fajr, notifications_asr]
    );
    res.status(200).json({ message: "Settings synced successfully" });
  } catch (err) {
    console.error("Error saving settings:", err);
    res.status(500).json({ error: "Database error saving settings" });
  }
});
app.get("/api/sync/bookmarks/:userId", async (req, res) => {
  const userId = parseInt(req.params.userId);
  if (isNaN(userId)) {
    return res.status(400).json({ error: "Invalid user ID" });
  }
  try {
    const result = await pool.query(
      "SELECT item_id as id, type, title, arabic, translation, reference, date_added FROM user_bookmarks WHERE user_id = $1 ORDER BY id DESC",
      [userId]
    );
    res.status(200).json(result.rows);
  } catch (err) {
    console.error("Error retrieving bookmarks:", err);
    res.status(500).json({ error: "Database error fetching bookmarks" });
  }
});
app.post("/api/sync/bookmarks/:userId", async (req, res) => {
  const userId = parseInt(req.params.userId);
  const { bookmarks } = req.body;
  if (isNaN(userId)) {
    return res.status(400).json({ error: "Invalid user ID" });
  }
  if (!Array.isArray(bookmarks)) {
    return res.status(400).json({ error: "bookmarks must be an array" });
  }
  try {
    await pool.query("BEGIN");
    await pool.query("DELETE FROM user_bookmarks WHERE user_id = $1", [userId]);
    for (const b of bookmarks) {
      await pool.query(
        `INSERT INTO user_bookmarks (user_id, item_id, type, title, arabic, translation, reference, date_added)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
         ON CONFLICT (user_id, item_id) DO NOTHING`,
        [userId, b.id, b.type, b.title, b.arabic || null, b.translation, b.reference, b.dateAdded]
      );
    }
    await pool.query("COMMIT");
    res.status(200).json({ message: "Bookmarks synced successfully" });
  } catch (err) {
    await pool.query("ROLLBACK");
    console.error("Error syncing bookmarks:", err);
    res.status(500).json({ error: "Database error syncing bookmarks" });
  }
});
async function startServer() {
  await setupDatabase();
  if (process.env.NODE_ENV !== "production") {
    const vite = await (0, import_vite.createServer)({
      server: { middlewareMode: true },
      appType: "spa"
    });
    app.use(vite.middlewares);
  } else {
    const distPath = import_path.default.join(process.cwd(), "dist");
    app.use(import_express.default.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(import_path.default.join(distPath, "index.html"));
    });
  }
  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Deen Path Server running on http://localhost:${PORT} [${process.env.NODE_ENV || "development"}]`);
  });
}
startServer();
//# sourceMappingURL=server.cjs.map
