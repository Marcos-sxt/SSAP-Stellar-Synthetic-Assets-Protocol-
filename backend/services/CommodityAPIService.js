const axios = require('axios');

class CommodityAPIService {
  constructor() {
    // API configurations
    this.apis = {
      alphaVantage: {
        baseUrl: 'https://www.alphavantage.co/query',
        apiKey: process.env.ALPHA_VANTAGE_KEY || 'demo',
        rateLimit: 5, // requests per minute (free tier)
        cacheTime: 60000 // 1 minute
      },
      yahooFinance: {
        baseUrl: 'https://query1.finance.yahoo.com/v8/finance/chart',
        apiKey: null, // No key needed
        rateLimit: 1000, // requests per hour
        cacheTime: 30000 // 30 seconds
      }
    };

    // Cache for prices
    this.cache = new Map();
    
    // Commodity mapping
    this.commodityMapping = {
      'WTI': {
        alphaVantage: 'CL=F', // WTI Crude Oil Futures
        yahooFinance: 'CL=F'
      },
      'Brent': {
        alphaVantage: 'BZ=F', // Brent Crude Oil Futures
        yahooFinance: 'BZ=F'
      },
      'Gold': {
        alphaVantage: 'GC=F', // Gold Futures
        yahooFinance: 'GC=F'
      },
      'Silver': {
        alphaVantage: 'SI=F', // Silver Futures
        yahooFinance: 'SI=F'
      },
      'NatGas': {
        alphaVantage: 'NG=F', // Natural Gas Futures
        yahooFinance: 'NG=F'
      },
      'NaturalGas': {
        alphaVantage: 'NG=F', // Natural Gas Futures
        yahooFinance: 'NG=F'
      },
      'Copper': {
        alphaVantage: 'HG=F', // Copper Futures
        yahooFinance: 'HG=F'
      }
    };
  }

  /**
   * Get price from Alpha Vantage
   * @param {string} symbol - Commodity symbol
   * @returns {Promise<Object>} Price data
   */
  async getFromAlphaVantage(symbol) {
    try {
      const mapping = this.commodityMapping[symbol]?.alphaVantage;
      if (!mapping) throw new Error(`No mapping for ${symbol}`);

      const response = await axios.get(this.apis.alphaVantage.baseUrl, {
        params: {
          function: 'GLOBAL_QUOTE',
          symbol: mapping,
          apikey: this.apis.alphaVantage.apiKey
        }
      });

      const data = response.data['Global Quote'];
      if (!data || !data['05. price']) {
        throw new Error('No price data available');
      }
      
      const price = parseFloat(data['05. price']);
      
      return {
        symbol: symbol,
        price: price,
        source: 'ALPHA_VANTAGE',
        timestamp: Date.now(),
        reliability: 85
      };
    } catch (error) {
      throw new Error(`Alpha Vantage failed: ${error.message}`);
    }
  }

  /**
   * Get price from Yahoo Finance
   * @param {string} symbol - Commodity symbol
   * @returns {Promise<Object>} Price data
   */
  async getFromYahooFinance(symbol) {
    try {
      const mapping = this.commodityMapping[symbol]?.yahooFinance;
      if (!mapping) throw new Error(`No mapping for ${symbol}`);

      const response = await axios.get(`${this.apis.yahooFinance.baseUrl}/${mapping}`);

      const data = response.data.chart.result[0];
      if (!data || !data.meta || !data.meta.regularMarketPrice) {
        throw new Error('No price data available');
      }
      
      const price = data.meta.regularMarketPrice;
      const timestamp = data.meta.regularMarketTime * 1000; // Convert to milliseconds
      
      return {
        symbol: symbol,
        price: price,
        source: 'YAHOO_FINANCE',
        timestamp: timestamp,
        reliability: 90
      };
    } catch (error) {
      throw new Error(`Yahoo Finance failed: ${error.message}`);
    }
  }

  /**
   * Get price from API Ninjas
   * @param {string} symbol - Commodity symbol
   * @returns {Promise<Object>} Price data
   */
  async getFromAPINinjas(symbol) {
    try {
      const mapping = this.commodityMapping[symbol]?.apiNinjas;
      if (!mapping) throw new Error(`No mapping for ${symbol}`);

      const response = await axios.get(`${this.apis.apiNinjas.baseUrl}/${mapping}`, {
        headers: {
          'X-Api-Key': this.apis.apiNinjas.apiKey
        }
      });

      const data = response.data;
      const price = data.price || data.value;
      
      return {
        symbol: symbol,
        price: price,
        source: 'API_NINJAS',
        timestamp: Date.now(),
        reliability: 75
      };
    } catch (error) {
      throw new Error(`API Ninjas failed: ${error.message}`);
    }
  }

  /**
   * Get commodity price with fallback strategy
   * @param {string} symbol - Commodity symbol
   * @returns {Promise<Object>} Price data
   */
  async getPrice(symbol) {
    console.log(`🛢️ Getting ${symbol} price from commodity APIs...`);
    
    // Check cache first
    if (this.cache.has(symbol)) {
      const cached = this.cache.get(symbol);
      if (Date.now() - cached.timestamp < this.apis.yahooFinance.cacheTime) {
        console.log(`✅ ${symbol} from cache: $${cached.price.toFixed(6)}`);
        return cached;
      }
    }

    // Try APIs in order of reliability
    const apis = [
      () => this.getFromYahooFinance(symbol),
      () => this.getFromAlphaVantage(symbol)
    ];

    for (const apiCall of apis) {
      try {
        const price = await apiCall();
        
        // Cache the result
        this.cache.set(symbol, price);
        
        console.log(`✅ ${symbol}: $${price.price.toFixed(6)} (${price.source})`);
        return price;
      } catch (error) {
        console.warn(`⚠️ ${error.message}`);
      }
    }

    throw new Error(`All commodity APIs failed for ${symbol}`);
  }

  /**
   * Get multiple commodity prices
   * @param {Array<string>} symbols - Array of commodity symbols
   * @returns {Promise<Array>} Array of price data
   */
  async getMultiplePrices(symbols) {
    const prices = [];
    
    for (const symbol of symbols) {
      try {
        const price = await this.getPrice(symbol);
        prices.push(price);
      } catch (error) {
        console.error(`Failed to get ${symbol} price:`, error.message);
      }
    }
    
    return prices;
  }

  /**
   * Test commodity APIs connection
   * @returns {Promise<boolean>} Connection status
   */
  async testConnection() {
    try {
      console.log('🛢️ Testing commodity APIs connection...');
      
      // Test with Gold (most reliable)
      const price = await this.getPrice('GOLD');
      console.log(`✅ Commodity APIs connection successful (${price.source})`);
      
      return true;
    } catch (error) {
      console.error('❌ Commodity APIs connection failed:', error.message);
      return false;
    }
  }

  /**
   * Get supported commodities
   * @returns {Array<string>} List of supported commodities
   */
  getSupportedCommodities() {
    return Object.keys(this.commodityMapping);
  }

  /**
   * Clear cache
   */
  clearCache() {
    this.cache.clear();
    console.log('🗑️ Commodity API cache cleared');
  }

  /**
   * Get cache status
   * @returns {Object} Cache information
   */
  getCacheStatus() {
    return {
      size: this.cache.size,
      keys: Array.from(this.cache.keys()),
      maxAge: this.apis.yahooFinance.cacheTime
    };
  }
}

module.exports = CommodityAPIService;
