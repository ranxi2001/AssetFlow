import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
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
const PORT = process.env.PORT || 1457;
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const distPath = path.join(__dirname, '../dist');

// 内存缓存 - 用于加速首次加载
const memoryCache = {
  rates: null,
  ratesUpdatedAt: null,
  priceHistory: null,
  priceHistoryUpdatedAt: null,
  RATES_TTL: 10 * 60 * 1000,        // 10分钟
  HISTORY_TTL: 30 * 60 * 1000       // 30分钟
};

// 预加载缓存数据
async function preloadCache() {
  console.log('Preloading cache...');
  try {
    // 预加载汇率
    memoryCache.rates = await fetchAllRates();
    memoryCache.ratesUpdatedAt = Date.now();
    console.log('Rates cached');

    // 预加载价格历史
    const history = getAllPriceHistory(30);
    if (history && history.length > 0) {
      memoryCache.priceHistory = history;
      memoryCache.priceHistoryUpdatedAt = Date.now();
      console.log(`Price history cached: ${history.length} records`);
    }
  } catch (err) {
    console.error('Preload cache error:', err.message);
  }
}

// 后台刷新缓存
function startCacheRefresh() {
  // 每5分钟刷新汇率（从缓存读取，不调用API）
  setInterval(async () => {
    try {
      // 只在有内存缓存时刷新，避免频繁 API 调用
      if (memoryCache.rates) {
        console.log('Rates memory cache still valid');
      }
    } catch (err) {
      console.error('Rates refresh error:', err.message);
    }
  }, 5 * 60 * 1000);

  // 每15分钟刷新价格历史（从数据库）
  setInterval(() => {
    try {
      const history = getAllPriceHistory(30);
      if (history && history.length > 0) {
        memoryCache.priceHistory = history;
        memoryCache.priceHistoryUpdatedAt = Date.now();
      }
    } catch (err) {
      console.error('History refresh error:', err.message);
    }
  }, 15 * 60 * 1000);
}

// 每日自动刷新所有价格（在凌晨2点执行）
function startDailyPriceRefresh() {
  const refreshPricesDaily = async () => {
    console.log('Starting daily price refresh...');
    try {
      const assets = getAllAssets();
      const symbols = [...new Set(assets.map(a => a.symbol).filter(Boolean))];
      // 强制刷新，调用 API
      const prices = await getAllPrices(symbols, true, false);
      console.log(`Daily refresh completed: ${Object.keys(prices).length} prices updated`);

      // 同时刷新汇率
      memoryCache.rates = await fetchAllRates();
      memoryCache.ratesUpdatedAt = Date.now();
      console.log('Daily rates refresh completed');
    } catch (err) {
      console.error('Daily refresh error:', err.message);
    }
  };

  // 计算距离下次凌晨2点的时间
  const scheduleNextRefresh = () => {
    const now = new Date();
    const next = new Date();
    next.setHours(2, 0, 0, 0);
    if (next <= now) {
      next.setDate(next.getDate() + 1);
    }
    const delay = next.getTime() - now.getTime();
    console.log(`Next daily refresh scheduled in ${Math.round(delay / 1000 / 60)} minutes`);

    setTimeout(() => {
      refreshPricesDaily();
      // 之后每24小时执行一次
      setInterval(refreshPricesDaily, 24 * 60 * 60 * 1000);
    }, delay);
  };

  scheduleNextRefresh();

  // 如果服务器刚启动且缓存为空，立即执行一次刷新
  const assets = getAllAssets();
  const symbols = [...new Set(assets.map(a => a.symbol).filter(s => s && s !== 'CNY'))];

  // 检查是否有缓存数据
  setTimeout(async () => {
    const prices = await getAllPrices(symbols, false, true); // cacheOnly
    if (Object.keys(prices).length < symbols.length) {
      console.log('Cache incomplete, triggering initial refresh...');
      await refreshPricesDaily();
    }
  }, 1000);
}

// Middleware
app.use(cors());
app.use(express.json());

// Serve static files from dist folder (production build)
app.use(express.static(distPath));

// Initialize database before starting server
await initDatabase();
console.log('Database initialized');

// 预加载缓存
await preloadCache();
startCacheRefresh();
startDailyPriceRefresh();

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

// GET /api/dashboard - Get dashboard summary (使用缓存模式，秒开)
app.get('/api/dashboard', async (req, res) => {
  try {
    const assets = getAllAssets();
    const symbols = [...new Set(assets.map(a => a.symbol).filter(Boolean))];
    // 默认使用缓存模式，不调用外部 API
    const prices = await getAllPrices(symbols, false, true);

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

// GET /api/price-history - Get price history for charts (使用内存缓存)
app.get('/api/price-history', (req, res) => {
  try {
    const days = parseInt(req.query.days) || 30;
    const symbol = req.query.symbol;

    // 设置缓存头 - 客户端缓存30分钟
    res.set('Cache-Control', 'public, max-age=1800, stale-while-revalidate=3600');

    if (symbol) {
      const history = getPriceHistory(symbol, days);
      res.json(history);
    } else {
      // 对于30天全量数据，优先使用内存缓存
      if (days === 30 && memoryCache.priceHistory &&
        (Date.now() - memoryCache.priceHistoryUpdatedAt) < memoryCache.HISTORY_TTL) {
        return res.json(memoryCache.priceHistory);
      }

      const history = getAllPriceHistory(days);

      // 更新缓存
      if (days === 30) {
        memoryCache.priceHistory = history;
        memoryCache.priceHistoryUpdatedAt = Date.now();
      }

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

// GET /api/rates - 获取所有汇率信息 (使用内存缓存)
app.get('/api/rates', async (req, res) => {
  try {
    // 设置缓存头 - 客户端缓存10分钟
    res.set('Cache-Control', 'public, max-age=600, stale-while-revalidate=1800');

    // 优先使用内存缓存
    if (memoryCache.rates && (Date.now() - memoryCache.ratesUpdatedAt) < memoryCache.RATES_TTL) {
      return res.json(memoryCache.rates);
    }

    // 缓存过期或不存在，重新获取
    const rates = await fetchAllRates();
    memoryCache.rates = rates;
    memoryCache.ratesUpdatedAt = Date.now();
    res.json(rates);
  } catch (error) {
    console.error('Error fetching rates:', error);
    // 如果有旧缓存，返回旧数据
    if (memoryCache.rates) {
      return res.json(memoryCache.rates);
    }
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

// SPA fallback - serve index.html for non-API routes (must be after API routes)
app.get('*', (req, res) => {
  res.sendFile(path.join(distPath, 'index.html'));
});

// Start server
app.listen(PORT, '0.0.0.0', () => {
  console.log(`AssetFlow server running on http://0.0.0.0:${PORT}`);
});
