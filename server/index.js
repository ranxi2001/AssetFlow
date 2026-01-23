import express from 'express';
import cors from 'cors';
import {
  initDatabase,
  getAllAssets,
  getAssetById,
  createAsset,
  updateAsset,
  deleteAsset,
  getAllCachedPrices,
  addPriceHistory,
  getPriceHistory,
  getAllPriceHistory,
  getSetting,
  setSetting,
  batchInsertPriceHistory
} from './db.js';
import { getPrice, getAllPrices, refreshAllPrices, fetchAllHistoricalPrices, fetchAllRates } from './priceService.js';

const app = express();
const PORT = 1457;

// Middleware
app.use(cors());
app.use(express.json());

// Initialize database before starting server
await initDatabase();
console.log('Database initialized');

// GET /api/assets - Get all assets
app.get('/api/assets', (req, res) => {
  try {
    const assets = getAllAssets();
    res.json(assets);
  } catch (error) {
    console.error('Error getting assets:', error);
    res.status(500).json({ error: 'Failed to get assets' });
  }
});

// GET /api/assets/:id - Get asset by ID
app.get('/api/assets/:id', (req, res) => {
  try {
    const asset = getAssetById(parseInt(req.params.id));
    if (!asset) {
      return res.status(404).json({ error: 'Asset not found' });
    }
    res.json(asset);
  } catch (error) {
    console.error('Error getting asset:', error);
    res.status(500).json({ error: 'Failed to get asset' });
  }
});

// POST /api/assets - Create new asset
app.post('/api/assets', (req, res) => {
  try {
    const { name, category, type, symbol, amount, unit, location } = req.body;

    if (!name || !category || !type || amount === undefined) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const asset = createAsset({
      name,
      category,
      type,
      symbol: symbol || null,
      amount: parseFloat(amount),
      unit: unit || '个',
      location: location || null
    });

    res.status(201).json(asset);
  } catch (error) {
    console.error('Error creating asset:', error);
    res.status(500).json({ error: 'Failed to create asset' });
  }
});

// PUT /api/assets/:id - Update asset
app.put('/api/assets/:id', (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const existing = getAssetById(id);

    if (!existing) {
      return res.status(404).json({ error: 'Asset not found' });
    }

    const { name, category, type, symbol, amount, unit, location } = req.body;

    const asset = updateAsset(id, {
      name: name !== undefined ? name : existing.name,
      category: category !== undefined ? category : existing.category,
      type: type !== undefined ? type : existing.type,
      symbol: symbol !== undefined ? symbol : existing.symbol,
      amount: amount !== undefined ? parseFloat(amount) : existing.amount,
      unit: unit !== undefined ? unit : existing.unit,
      location: location !== undefined ? location : existing.location
    });

    res.json(asset);
  } catch (error) {
    console.error('Error updating asset:', error);
    res.status(500).json({ error: 'Failed to update asset' });
  }
});

// DELETE /api/assets/:id - Delete asset
app.delete('/api/assets/:id', (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const asset = deleteAsset(id);

    if (!asset) {
      return res.status(404).json({ error: 'Asset not found' });
    }

    res.json({ message: 'Asset deleted', asset });
  } catch (error) {
    console.error('Error deleting asset:', error);
    res.status(500).json({ error: 'Failed to delete asset' });
  }
});

// GET /api/prices - Get all cached prices
app.get('/api/prices', async (req, res) => {
  try {
    const assets = getAllAssets();
    const symbols = [...new Set(assets.map(a => a.symbol).filter(Boolean))];
    const prices = await getAllPrices(symbols);
    res.json(prices);
  } catch (error) {
    console.error('Error getting prices:', error);
    res.status(500).json({ error: 'Failed to get prices' });
  }
});

// POST /api/prices/refresh - Force refresh all prices
app.post('/api/prices/refresh', async (req, res) => {
  try {
    const assets = getAllAssets();
    const prices = await refreshAllPrices(assets);
    res.json(prices);
  } catch (error) {
    console.error('Error refreshing prices:', error);
    res.status(500).json({ error: 'Failed to refresh prices' });
  }
});

// GET /api/dashboard - Get dashboard summary
app.get('/api/dashboard', async (req, res) => {
  try {
    const assets = getAllAssets();
    const symbols = [...new Set(assets.map(a => a.symbol).filter(Boolean))];
    const prices = await getAllPrices(symbols);

    // Calculate totals
    let totalUsd = 0;
    let totalCny = 0;

    const assetsWithValue = assets.map(asset => {
      const price = prices[asset.symbol?.toUpperCase()];
      let valueUsd = 0;
      let valueCny = 0;

      if (price) {
        valueUsd = asset.amount * price.priceUsd;
        valueCny = asset.amount * price.priceCny;
      }

      totalUsd += valueUsd;
      totalCny += valueCny;

      return {
        ...asset,
        price: price || null,
        valueUsd,
        valueCny
      };
    });

    // Group by category
    const byCategory = {};
    for (const asset of assetsWithValue) {
      if (!byCategory[asset.category]) {
        byCategory[asset.category] = {
          assets: [],
          totalUsd: 0,
          totalCny: 0
        };
      }
      byCategory[asset.category].assets.push(asset);
      byCategory[asset.category].totalUsd += asset.valueUsd;
      byCategory[asset.category].totalCny += asset.valueCny;
    }

    res.json({
      totalUsd,
      totalCny,
      byCategory,
      assets: assetsWithValue,
      prices,
      updatedAt: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error getting dashboard:', error);
    res.status(500).json({ error: 'Failed to get dashboard data' });
  }
});

// GET /api/price-history - Get price history for charts
app.get('/api/price-history', (req, res) => {
  try {
    const days = parseInt(req.query.days) || 30;
    const symbol = req.query.symbol;

    if (symbol) {
      const history = getPriceHistory(symbol, days);
      res.json(history);
    } else {
      const history = getAllPriceHistory(days);
      res.json(history);
    }
  } catch (error) {
    console.error('Error getting price history:', error);
    res.status(500).json({ error: 'Failed to get price history' });
  }
});

// POST /api/price-history/backfill - 补全历史价格数据
app.post('/api/price-history/backfill', async (req, res) => {
  try {
    const { days = 30 } = req.body;
    const assets = getAllAssets();

    // 获取需要补全的资产符号（排除CNY）
    const symbols = [...new Set(
      assets
        .map(a => a.symbol)
        .filter(s => s && s !== 'CNY')
    )];

    console.log(`Backfilling ${days} days of price history for: ${symbols.join(', ')}`);

    // 获取历史价格
    const records = await fetchAllHistoricalPrices(symbols, days);

    if (records.length > 0) {
      // 批量插入数据库
      batchInsertPriceHistory(records);
      console.log(`Inserted ${records.length} price history records`);
    }

    res.json({
      success: true,
      message: `已补全 ${records.length} 条历史价格记录`,
      symbols,
      days,
      recordCount: records.length
    });
  } catch (error) {
    console.error('Error backfilling price history:', error);
    res.status(500).json({ error: 'Failed to backfill price history: ' + error.message });
  }
});

// POST /api/auth/verify - Verify password
app.post('/api/auth/verify', (req, res) => {
  try {
    const { password } = req.body;
    const storedPassword = getSetting('password');

    // If no password is set, set the provided password
    if (!storedPassword) {
      setSetting('password', password);
      res.json({ success: true, message: 'Password set' });
      return;
    }

    // Verify password
    if (password === storedPassword) {
      res.json({ success: true });
    } else {
      res.status(401).json({ success: false, error: 'Invalid password' });
    }
  } catch (error) {
    console.error('Error verifying password:', error);
    res.status(500).json({ error: 'Failed to verify password' });
  }
});

// GET /api/auth/has-password - Check if password is set
app.get('/api/auth/has-password', (req, res) => {
  try {
    const storedPassword = getSetting('password');
    res.json({ hasPassword: !!storedPassword });
  } catch (error) {
    console.error('Error checking password:', error);
    res.status(500).json({ error: 'Failed to check password' });
  }
});

// GET /api/rates - 获取所有汇率信息
app.get('/api/rates', async (req, res) => {
  try {
    const rates = await fetchAllRates();
    res.json(rates);
  } catch (error) {
    console.error('Error fetching rates:', error);
    res.status(500).json({ error: 'Failed to fetch rates' });
  }
});

// POST /api/auth/change-password - Change password
app.post('/api/auth/change-password', (req, res) => {
  try {
    const { oldPassword, newPassword } = req.body;
    const storedPassword = getSetting('password');

    if (storedPassword && oldPassword !== storedPassword) {
      res.status(401).json({ success: false, error: 'Invalid old password' });
      return;
    }

    setSetting('password', newPassword);
    res.json({ success: true, message: 'Password changed' });
  } catch (error) {
    console.error('Error changing password:', error);
    res.status(500).json({ error: 'Failed to change password' });
  }
});

// 打印所有路由
console.log('Registered routes:');
app._router.stack.forEach((r) => {
  if (r.route && r.route.path) {
    console.log(`  ${Object.keys(r.route.methods).join(',').toUpperCase()} ${r.route.path}`);
  }
});

// Start server
app.listen(PORT, '0.0.0.0', () => {
  console.log(`AssetFlow API server running on http://0.0.0.0:${PORT}`);
});
