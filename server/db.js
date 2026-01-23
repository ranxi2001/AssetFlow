import initSqlJs from 'sql.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DB_PATH = path.join(__dirname, '..', 'data', 'assetflow.db');

let db = null;

export async function initDatabase() {
  const SQL = await initSqlJs();

  // Load existing database or create new one
  if (fs.existsSync(DB_PATH)) {
    const buffer = fs.readFileSync(DB_PATH);
    db = new SQL.Database(buffer);
    // Ensure new tables exist in existing database
    ensureTablesInternal();
  } else {
    db = new SQL.Database();
    createTables();
    insertInitialData();
    saveDatabase();
  }

  return db;
}

function ensureTablesInternal() {
  // Check if price_history table exists
  const result = db.exec("SELECT name FROM sqlite_master WHERE type='table' AND name='price_history'");
  if (result.length === 0 || result[0].values.length === 0) {
    db.run(`
      CREATE TABLE IF NOT EXISTS price_history (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        symbol TEXT NOT NULL,
        price_usd REAL,
        price_cny REAL,
        recorded_at DATE NOT NULL,
        UNIQUE(symbol, recorded_at)
      )
    `);
  }
  const result2 = db.exec("SELECT name FROM sqlite_master WHERE type='table' AND name='app_settings'");
  if (result2.length === 0 || result2[0].values.length === 0) {
    db.run(`
      CREATE TABLE IF NOT EXISTS app_settings (
        key TEXT PRIMARY KEY,
        value TEXT
      )
    `);
  }

  saveDatabase();
}

function saveDatabase() {
  const data = db.export();
  const buffer = Buffer.from(data);
  fs.writeFileSync(DB_PATH, buffer);
}

function createTables() {
  // Assets table
  db.run(`
    CREATE TABLE IF NOT EXISTS assets (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      category TEXT NOT NULL,
      type TEXT NOT NULL,
      symbol TEXT,
      amount REAL NOT NULL,
      unit TEXT DEFAULT '个',
      location TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Price cache table
  db.run(`
    CREATE TABLE IF NOT EXISTS price_cache (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      symbol TEXT NOT NULL UNIQUE,
      price_usd REAL,
      price_cny REAL,
      source TEXT,
      cached_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Exchange rates table
  db.run(`
    CREATE TABLE IF NOT EXISTS exchange_rates (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      from_currency TEXT NOT NULL,
      to_currency TEXT NOT NULL,
      rate REAL NOT NULL,
      cached_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(from_currency, to_currency)
    )
  `);

  // Price history table for charts
  db.run(`
    CREATE TABLE IF NOT EXISTS price_history (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      symbol TEXT NOT NULL,
      price_usd REAL,
      price_cny REAL,
      recorded_at DATE NOT NULL,
      UNIQUE(symbol, recorded_at)
    )
  `);

  // App settings table for password
  db.run(`
    CREATE TABLE IF NOT EXISTS app_settings (
      key TEXT PRIMARY KEY,
      value TEXT
    )
  `);
}

function insertInitialData() {
  const initialAssets = [
    { name: 'BNB', category: 'web3', type: 'crypto', symbol: 'BNB', amount: 9.3, unit: '个', location: '币安钱包' },
    { name: 'USD1', category: 'web3', type: 'stablecoin', symbol: 'USD1', amount: 16000, unit: '个', location: '币安钱包' },
    { name: '黄金', category: 'physical', type: 'gold', symbol: 'XAU', amount: 15, unit: 'g', location: '实物' },
    { name: '支付宝', category: 'web2', type: 'alipay', symbol: 'CNY', amount: 150000, unit: 'CNY', location: '支付宝' }
  ];

  const stmt = db.prepare(`
    INSERT INTO assets (name, category, type, symbol, amount, unit, location)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);

  for (const asset of initialAssets) {
    stmt.run([asset.name, asset.category, asset.type, asset.symbol, asset.amount, asset.unit, asset.location]);
  }
  stmt.free();
}

// 批量插入历史价格数据
export function batchInsertPriceHistory(records) {
  const stmt = db.prepare(`
    INSERT OR REPLACE INTO price_history (symbol, price_usd, price_cny, recorded_at)
    VALUES (?, ?, ?, ?)
  `);

  for (const record of records) {
    stmt.run([record.symbol, record.price_usd, record.price_cny, record.recorded_at]);
  }
  stmt.free();
  saveDatabase();
}

// Asset operations
export function getAllAssets() {
  const result = db.exec('SELECT * FROM assets ORDER BY category, name');
  if (result.length === 0) return [];
  return resultToObjects(result[0]);
}

export function getAssetById(id) {
  const stmt = db.prepare('SELECT * FROM assets WHERE id = ?');
  stmt.bind([id]);
  const result = [];
  while (stmt.step()) {
    result.push(stmt.getAsObject());
  }
  stmt.free();
  return result[0] || null;
}

export function createAsset(asset) {
  const stmt = db.prepare(`
    INSERT INTO assets (name, category, type, symbol, amount, unit, location)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);
  stmt.run([asset.name, asset.category, asset.type, asset.symbol, asset.amount, asset.unit, asset.location]);
  stmt.free();
  const id = db.exec('SELECT last_insert_rowid() as id')[0].values[0][0];
  saveDatabase();
  return getAssetById(id);
}

export function updateAsset(id, asset) {
  const stmt = db.prepare(`
    UPDATE assets
    SET name = ?, category = ?, type = ?, symbol = ?, amount = ?, unit = ?, location = ?, updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `);
  stmt.run([asset.name, asset.category, asset.type, asset.symbol, asset.amount, asset.unit, asset.location, id]);
  stmt.free();
  saveDatabase();
  return getAssetById(id);
}

export function deleteAsset(id) {
  const asset = getAssetById(id);
  if (!asset) return null;
  const stmt = db.prepare('DELETE FROM assets WHERE id = ?');
  stmt.run([id]);
  stmt.free();
  saveDatabase();
  return asset;
}

// Price cache operations
export function getCachedPrice(symbol) {
  const stmt = db.prepare('SELECT * FROM price_cache WHERE symbol = ?');
  stmt.bind([symbol]);
  const result = [];
  while (stmt.step()) {
    result.push(stmt.getAsObject());
  }
  stmt.free();
  return result[0] || null;
}

export function getAllCachedPrices() {
  const result = db.exec('SELECT * FROM price_cache');
  if (result.length === 0) return [];
  return resultToObjects(result[0]);
}

export function updatePriceCache(symbol, priceUsd, priceCny, source) {
  const stmt = db.prepare(`
    INSERT OR REPLACE INTO price_cache (symbol, price_usd, price_cny, source, cached_at)
    VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP)
  `);
  stmt.run([symbol, priceUsd, priceCny, source]);
  stmt.free();
  saveDatabase();
}

// Exchange rate operations
export function getExchangeRate(from, to) {
  const stmt = db.prepare('SELECT * FROM exchange_rates WHERE from_currency = ? AND to_currency = ?');
  stmt.bind([from, to]);
  const result = [];
  while (stmt.step()) {
    result.push(stmt.getAsObject());
  }
  stmt.free();
  return result[0] || null;
}

export function updateExchangeRate(from, to, rate) {
  const stmt = db.prepare(`
    INSERT OR REPLACE INTO exchange_rates (from_currency, to_currency, rate, cached_at)
    VALUES (?, ?, ?, CURRENT_TIMESTAMP)
  `);
  stmt.run([from, to, rate]);
  stmt.free();
  saveDatabase();
}

// Helper function to convert sql.js results to object array
function resultToObjects(result) {
  const columns = result.columns;
  return result.values.map(row => {
    const obj = {};
    columns.forEach((col, i) => {
      obj[col] = row[i];
    });
    return obj;
  });
}

export function getDb() {
  return db;
}

// Price history operations
export function addPriceHistory(symbol, priceUsd, priceCny) {
  const today = new Date().toISOString().split('T')[0];
  const stmt = db.prepare(`
    INSERT OR REPLACE INTO price_history (symbol, price_usd, price_cny, recorded_at)
    VALUES (?, ?, ?, ?)
  `);
  stmt.run([symbol, priceUsd, priceCny, today]);
  stmt.free();
  saveDatabase();
}

export function getPriceHistory(symbol, days = 30) {
  const stmt = db.prepare(`
    SELECT * FROM price_history
    WHERE symbol = ?
    ORDER BY recorded_at DESC
    LIMIT ?
  `);
  stmt.bind([symbol, days]);
  const result = [];
  while (stmt.step()) {
    result.push(stmt.getAsObject());
  }
  stmt.free();
  return result.reverse();
}

export function getAllPriceHistory(days = 30) {
  const result = db.exec(`
    SELECT * FROM price_history
    WHERE recorded_at >= date('now', '-${days} days')
    ORDER BY recorded_at ASC
  `);
  if (result.length === 0) return [];
  return resultToObjects(result[0]);
}

// App settings operations
export function getSetting(key) {
  const stmt = db.prepare('SELECT value FROM app_settings WHERE key = ?');
  stmt.bind([key]);
  let value = null;
  if (stmt.step()) {
    value = stmt.getAsObject().value;
  }
  stmt.free();
  return value;
}

export function setSetting(key, value) {
  const stmt = db.prepare(`
    INSERT OR REPLACE INTO app_settings (key, value) VALUES (?, ?)
  `);
  stmt.run([key, value]);
  stmt.free();
  saveDatabase();
}

// Ensure tables exist on database load
export function ensureTables() {
  // Check if price_history table exists
  const result = db.exec("SELECT name FROM sqlite_master WHERE type='table' AND name='price_history'");
  if (result.length === 0 || result[0].values.length === 0) {
    db.run(`
      CREATE TABLE IF NOT EXISTS price_history (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        symbol TEXT NOT NULL,
        price_usd REAL,
        price_cny REAL,
        recorded_at DATE NOT NULL,
        UNIQUE(symbol, recorded_at)
      )
    `);
    db.run(`
      CREATE TABLE IF NOT EXISTS app_settings (
        key TEXT PRIMARY KEY,
        value TEXT
      )
    `);
    saveDatabase();
  }
}
