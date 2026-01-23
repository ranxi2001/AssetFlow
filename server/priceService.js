import axios from 'axios';
import { getCachedPrice, updatePriceCache, getExchangeRate, updateExchangeRate, addPriceHistory } from './db.js';

const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes in milliseconds

// CoinGecko ID mapping
const COINGECKO_IDS = {
  'BNB': 'binancecoin',
  'BTC': 'bitcoin',
  'ETH': 'ethereum',
  'SOL': 'solana',
  'DOGE': 'dogecoin',
  'ADA': 'cardano',
  'DOT': 'polkadot',
  'MATIC': 'matic-network',
  'AVAX': 'avalanche-2',
  'LINK': 'chainlink'
};

// Check if cache is valid
function isCacheValid(cachedAt) {
  if (!cachedAt) return false;
  const cachedTime = new Date(cachedAt).getTime();
  return Date.now() - cachedTime < CACHE_DURATION;
}

// Fetch crypto price from CoinGecko
async function fetchCryptoPrice(symbol) {
  const coinId = COINGECKO_IDS[symbol.toUpperCase()];
  if (!coinId) return null;

  try {
    const response = await axios.get(
      `https://api.coingecko.com/api/v3/simple/price`,
      {
        params: {
          ids: coinId,
          vs_currencies: 'usd,cny'
        },
        timeout: 10000
      }
    );

    const data = response.data[coinId];
    if (data) {
      return {
        priceUsd: data.usd,
        priceCny: data.cny,
        source: 'coingecko'
      };
    }
  } catch (error) {
    console.error(`Failed to fetch ${symbol} price:`, error.message);
  }
  return null;
}

// Fetch gold price (XAU per gram)
async function fetchGoldPrice() {
  try {
    // Using a free gold price API - price per troy ounce
    const response = await axios.get(
      'https://api.coingecko.com/api/v3/simple/price',
      {
        params: {
          ids: 'pax-gold',
          vs_currencies: 'usd,cny'
        },
        timeout: 10000
      }
    );

    // PAX Gold is pegged to 1 troy ounce of gold
    // 1 troy ounce = 31.1035 grams
    const data = response.data['pax-gold'];
    if (data) {
      const pricePerGramUsd = data.usd / 31.1035;
      const pricePerGramCny = data.cny / 31.1035;
      return {
        priceUsd: pricePerGramUsd,
        priceCny: pricePerGramCny,
        source: 'coingecko-paxg'
      };
    }
  } catch (error) {
    console.error('Failed to fetch gold price:', error.message);
  }
  return null;
}

// Fetch USD/CNY exchange rate
async function fetchUsdCnyRate() {
  try {
    // Use a simple approach - get from CoinGecko's USDT price
    const response = await axios.get(
      'https://api.coingecko.com/api/v3/simple/price',
      {
        params: {
          ids: 'tether',
          vs_currencies: 'usd,cny'
        },
        timeout: 10000
      }
    );

    const data = response.data['tether'];
    if (data && data.usd && data.cny) {
      return data.cny / data.usd;
    }
  } catch (error) {
    console.error('Failed to fetch exchange rate:', error.message);
  }
  // Fallback rate
  return 7.2;
}

// Get price for a symbol with caching
export async function getPrice(symbol, forceRefresh = false) {
  const upperSymbol = symbol.toUpperCase();

  // Check cache first
  if (!forceRefresh) {
    const cached = getCachedPrice(upperSymbol);
    if (cached && isCacheValid(cached.cached_at)) {
      return {
        symbol: upperSymbol,
        priceUsd: cached.price_usd,
        priceCny: cached.price_cny,
        source: cached.source,
        cached: true,
        cachedAt: cached.cached_at
      };
    }
  }

  let priceData = null;

  // Fetch based on symbol type
  if (COINGECKO_IDS[upperSymbol]) {
    priceData = await fetchCryptoPrice(upperSymbol);
  } else if (upperSymbol === 'XAU') {
    priceData = await fetchGoldPrice();
  } else if (upperSymbol === 'USD1') {
    // USD1 价格 = USD1/USDT * USDT/USD
    const usd1Price = await fetchUsd1UsdtPrice();
    const rate = await fetchUsdCnyRate();
    priceData = {
      priceUsd: usd1Price,
      priceCny: usd1Price * rate,
      source: 'coingecko-usd1'
    };
  } else if (upperSymbol === 'USDT' || upperSymbol === 'USDC') {
    // USDT/USDC 固定 $1
    const rate = await fetchUsdCnyRate();
    priceData = {
      priceUsd: 1,
      priceCny: rate,
      source: 'pegged'
    };
  } else if (upperSymbol === 'CNY') {
    // CNY - get the inverse rate
    const rate = await fetchUsdCnyRate();
    priceData = {
      priceUsd: 1 / rate,
      priceCny: 1,
      source: 'exchange-rate'
    };
  }

  // Update cache if we got data
  if (priceData) {
    updatePriceCache(upperSymbol, priceData.priceUsd, priceData.priceCny, priceData.source);
    // Also save to price history for charts
    addPriceHistory(upperSymbol, priceData.priceUsd, priceData.priceCny);
    return {
      symbol: upperSymbol,
      priceUsd: priceData.priceUsd,
      priceCny: priceData.priceCny,
      source: priceData.source,
      cached: false,
      cachedAt: new Date().toISOString()
    };
  }

  // Return cached data even if expired, as fallback
  const cached = getCachedPrice(upperSymbol);
  if (cached) {
    return {
      symbol: upperSymbol,
      priceUsd: cached.price_usd,
      priceCny: cached.price_cny,
      source: cached.source,
      cached: true,
      stale: true,
      cachedAt: cached.cached_at
    };
  }

  return null;
}

// Get all prices for given symbols
export async function getAllPrices(symbols, forceRefresh = false) {
  const prices = {};
  for (const symbol of symbols) {
    const price = await getPrice(symbol, forceRefresh);
    if (price) {
      prices[symbol.toUpperCase()] = price;
    }
  }
  return prices;
}

// Refresh all prices
export async function refreshAllPrices(assets) {
  const symbols = [...new Set(assets.map(a => a.symbol).filter(Boolean))];
  return getAllPrices(symbols, true);
}

// 获取历史价格数据 (CoinGecko market_chart API)
export async function fetchHistoricalPrices(symbol, days = 30) {
  const upperSymbol = symbol.toUpperCase();
  const coinId = COINGECKO_IDS[upperSymbol];

  // 获取汇率用于计算CNY价格
  const usdCnyRate = await fetchUsdCnyRate();

  // 黄金特殊处理
  if (upperSymbol === 'XAU') {
    try {
      const response = await axios.get(
        'https://api.coingecko.com/api/v3/coins/pax-gold/market_chart',
        {
          params: { vs_currency: 'usd', days: days, interval: 'daily' },
          timeout: 15000
        }
      );

      const prices = response.data.prices || [];
      return prices.map(([timestamp, price]) => {
        const date = new Date(timestamp).toISOString().split('T')[0];
        const pricePerGram = price / 31.1035;
        return {
          symbol: upperSymbol,
          price_usd: pricePerGram,
          price_cny: pricePerGram * usdCnyRate,
          recorded_at: date
        };
      });
    } catch (error) {
      console.error(`Failed to fetch ${upperSymbol} history:`, error.message);
      return [];
    }
  }

  // 加密货币
  if (coinId) {
    try {
      const response = await axios.get(
        `https://api.coingecko.com/api/v3/coins/${coinId}/market_chart`,
        {
          params: { vs_currency: 'usd', days: days, interval: 'daily' },
          timeout: 15000
        }
      );

      const prices = response.data.prices || [];
      return prices.map(([timestamp, price]) => {
        const date = new Date(timestamp).toISOString().split('T')[0];
        return {
          symbol: upperSymbol,
          price_usd: price,
          price_cny: price * usdCnyRate,
          recorded_at: date
        };
      });
    } catch (error) {
      console.error(`Failed to fetch ${upperSymbol} history:`, error.message);
      return [];
    }
  }

  // 稳定币历史（固定$1）
  if (['USD1', 'USDT', 'USDC'].includes(upperSymbol)) {
    const result = [];
    const today = new Date();
    for (let i = days; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      result.push({
        symbol: upperSymbol,
        price_usd: 1,
        price_cny: usdCnyRate,
        recorded_at: date.toISOString().split('T')[0]
      });
    }
    return result;
  }

  return [];
}

// 获取多个资产的历史价格
export async function fetchAllHistoricalPrices(symbols, days = 30) {
  const allRecords = [];

  for (const symbol of symbols) {
    console.log(`Fetching ${days} days history for ${symbol}...`);
    const records = await fetchHistoricalPrices(symbol, days);
    allRecords.push(...records);
    // 添加延迟避免API限流
    await new Promise(resolve => setTimeout(resolve, 500));
  }

  return allRecords;
}

// 获取 Binance USDT C2C 汇率 (场外交易价格)
async function fetchUsdtC2cRate() {
  try {
    // 使用 Binance P2P API
    const response = await axios.post(
      'https://p2p.binance.com/bapi/c2c/v2/friendly/c2c/adv/search',
      {
        asset: 'USDT',
        fiat: 'CNY',
        merchantCheck: true,
        page: 1,
        rows: 10,
        tradeType: 'SELL' // 卖出USDT = 买入CNY的价格
      },
      {
        headers: { 'Content-Type': 'application/json' },
        timeout: 10000
      }
    );

    const ads = response.data?.data || [];
    if (ads.length > 0) {
      // 取前5个广告的平均价格
      const prices = ads.slice(0, 5).map(ad => parseFloat(ad.adv.price));
      const avgPrice = prices.reduce((a, b) => a + b, 0) / prices.length;
      return avgPrice;
    }
  } catch (error) {
    console.error('Failed to fetch USDT C2C rate:', error.message);
  }
  return null;
}

// 获取 USD1/USDT 价格 (从 Binance)
async function fetchUsd1UsdtPrice() {
  try {
    // USD1 可能在某些交易所有交易对，尝试获取
    // 如果没有，返回 1 (因为都是稳定币)
    const response = await axios.get(
      'https://api.coingecko.com/api/v3/simple/price',
      {
        params: {
          ids: 'usual-usd',
          vs_currencies: 'usd'
        },
        timeout: 10000
      }
    );

    const price = response.data?.['usual-usd']?.usd;
    if (price) return price;
  } catch (error) {
    console.error('Failed to fetch USD1 price:', error.message);
  }
  return 1; // 默认1:1
}

// 获取所有汇率信息
export async function fetchAllRates() {
  const [officialRate, c2cRate, usd1Price] = await Promise.all([
    fetchUsdCnyRate(),
    fetchUsdtC2cRate(),
    fetchUsd1UsdtPrice()
  ]);

  return {
    usdCny: officialRate,           // 官方美元/人民币汇率
    usdtC2c: c2cRate || officialRate, // USDT C2C 场外汇率
    usd1Usdt: usd1Price,            // USD1/USDT 价格
    updatedAt: new Date().toISOString()
  };
}
