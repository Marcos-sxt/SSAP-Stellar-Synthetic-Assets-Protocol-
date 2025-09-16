const ReflectorService = require('./ReflectorService');
const ChainlinkService = require('./ChainlinkService');
const CommodityAPIService = require('./CommodityAPIService');

class MultiFeedOracleService {
  constructor() {
    this.reflector = new ReflectorService();
    this.chainlink = new ChainlinkService();
    this.commodityAPI = new CommodityAPIService();
    this.binance = null;   // TODO: Implement BinanceService
    
    // Feed priority configuration
    this.feedPriority = {
      crypto: ['REFLECTOR', 'BINANCE'],
      commodities: ['COMMODITY_API', 'BINANCE', 'YAHOO']
    };
  }

  /**
   * Get crypto price with fallback strategy
   * @param {string} symbol - Asset symbol (XLM, ETH, SOL, BTC)
   * @returns {Promise<Object>} Price data with source information
   */
  async getCryptoPrice(symbol) {
    console.log(`🪙 Getting ${symbol} price (crypto priority: Reflector → Chainlink → Binance)`);
    
    // Try Reflector first (Stellar native)
    try {
      const price = await this.reflector.getPrice(symbol);
      console.log(`✅ ${symbol} price from Reflector: $${price.price.toFixed(6)}`);
      return price;
    } catch (error) {
      console.warn(`⚠️ Reflector failed for ${symbol}: ${error.message}`);
    }

    // Try Chainlink fallback
    try {
      if (this.chainlink) {
        const price = await this.chainlink.getPrice(symbol);
        console.log(`✅ ${symbol} price from Chainlink: $${price.price.toFixed(6)}`);
        return price;
      }
    } catch (error) {
      console.warn(`⚠️ Chainlink failed for ${symbol}: ${error.message}`);
    }

    // Try Binance fallback
    try {
      if (this.binance) {
        const price = await this.binance.getPrice(symbol);
        console.log(`✅ ${symbol} price from Binance: $${price.price.toFixed(6)}`);
        return price;
      }
    } catch (error) {
      console.warn(`⚠️ Binance failed for ${symbol}: ${error.message}`);
    }

    // All feeds failed
    throw new Error(`All feeds failed for ${symbol}`);
  }

  /**
   * Get commodity price with fallback strategy
   * @param {string} symbol - Commodity symbol (WTI, GOLD, SILVER, NATGAS)
   * @returns {Promise<Object>} Price data with source information
   */
  async getCommodityPrice(symbol) {
    console.log(`🛢️ Getting ${symbol} price (commodity priority: CommodityAPI → Binance → Yahoo)`);
    
    // Try Commodity APIs first (most reliable for commodities)
    try {
      const price = await this.commodityAPI.getPrice(symbol);
      console.log(`✅ ${symbol} price from CommodityAPI: $${price.price.toFixed(6)}`);
      return price;
    } catch (error) {
      console.warn(`⚠️ CommodityAPI failed for ${symbol}: ${error.message}`);
    }

    // Try Binance fallback
    try {
      if (this.binance) {
        const price = await this.binance.getPrice(symbol);
        console.log(`✅ ${symbol} price from Binance: $${price.price.toFixed(6)}`);
        return price;
      }
    } catch (error) {
      console.warn(`⚠️ Binance failed for ${symbol}: ${error.message}`);
    }

    // Try Yahoo fallback
    try {
      if (this.yahoo) {
        const price = await this.yahoo.getPrice(symbol);
        console.log(`✅ ${symbol} price from Yahoo: $${price.price.toFixed(6)}`);
        return price;
      }
    } catch (error) {
      console.warn(`⚠️ Yahoo failed for ${symbol}: ${error.message}`);
    }

    // All feeds failed
    throw new Error(`All feeds failed for ${symbol}`);
  }

  /**
   * Get price for any asset (crypto or commodity)
   * @param {string} symbol - Asset symbol
   * @returns {Promise<Object>} Price data
   */
  async getPrice(symbol) {
    const cryptoAssets = ['XLM', 'ETH', 'SOL', 'BTC', 'USDC'];
    const commodityAssets = ['WTI', 'GOLD', 'SILVER', 'NATGAS'];
    
    if (cryptoAssets.includes(symbol)) {
      return await this.getCryptoPrice(symbol);
    } else if (commodityAssets.includes(symbol)) {
      return await this.getCommodityPrice(symbol);
    } else {
      throw new Error(`Asset ${symbol} not supported`);
    }
  }

  /**
   * Get multiple prices
   * @param {Array<string>} symbols - Array of asset symbols
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
        // Continue with other assets
      }
    }
    
    return prices;
  }

  /**
   * Get spread price between two assets
   * @param {string} asset1 - First asset
   * @param {string} asset2 - Second asset
   * @returns {Promise<Object>} Spread data
   */
  async getSpreadPrice(asset1, asset2) {
    try {
      const [price1, price2] = await Promise.all([
        this.getPrice(asset1),
        this.getPrice(asset2)
      ]);
      
      const spread = price1.price - price2.price;
      const spreadPercent = (spread / price2.price) * 100;
      
      return {
        asset1: price1,
        asset2: price2,
        spread: spread,
        spreadPercent: spreadPercent,
        timestamp: Date.now()
      };
    } catch (error) {
      throw new Error(`Failed to calculate spread ${asset1}/${asset2}: ${error.message}`);
    }
  }

  /**
   * Test all feed connections
   * @returns {Promise<Object>} Connection status for each feed
   */
  async testAllFeeds() {
    const results = {
      reflector: false,
      chainlink: false,
      binance: false,
      yahoo: false
    };

    // Test Reflector
    try {
      results.reflector = await this.reflector.testConnection();
    } catch (error) {
      console.error('Reflector test failed:', error.message);
    }

    // Test Chainlink
    try {
      results.chainlink = await this.chainlink.testConnection();
    } catch (error) {
      console.error('Chainlink test failed:', error.message);
    }

    // Test Commodity APIs
    try {
      results.commodityAPI = await this.commodityAPI.testConnection();
    } catch (error) {
      console.error('CommodityAPI test failed:', error.message);
    }

    // Test Binance (if implemented)
    if (this.binance) {
      try {
        results.binance = await this.binance.testConnection();
      } catch (error) {
        console.error('Binance test failed:', error.message);
      }
    }

    return results;
  }

  /**
   * Get feed status and reliability
   * @returns {Object} Feed status information
   */
  getFeedStatus() {
    return {
      reflector: {
        available: true,
        priority: 1,
        reliability: 100,
        description: 'Stellar native oracle'
      },
      chainlink: {
        available: true,
        priority: 2,
        reliability: 95,
        description: 'Decentralized oracle network'
      },
      commodityAPI: {
        available: true,
        priority: 3,
        reliability: 80,
        description: 'Public commodity APIs (Commodities-API, Metals-API, API Ninjas)'
      },
      binance: {
        available: this.binance !== null,
        priority: 3,
        reliability: 90,
        description: 'Centralized exchange API'
      },
      yahoo: {
        available: this.yahoo !== null,
        priority: 4,
        reliability: 80,
        description: 'Financial data API'
      }
    };
  }

  /**
   * Get all crypto prices
   * @returns {Promise<Object>} All crypto prices
   */
  async getCryptoPrices() {
    const cryptos = ['XLM', 'ETH', 'SOL', 'BTC', 'USDC'];
    const prices = {};
    
    for (const crypto of cryptos) {
      try {
        prices[crypto] = await this.getCryptoPrice(crypto);
      } catch (error) {
        console.warn(`⚠️ Failed to get ${crypto} price: ${error.message}`);
        prices[crypto] = { price: 0, source: 'ERROR', error: error.message };
      }
    }
    
    return prices;
  }

  /**
   * Get all commodity prices
   * @returns {Promise<Object>} All commodity prices
   */
  async getCommodityPrices() {
    const commodities = ['WTI', 'Brent', 'Gold', 'Silver', 'Copper', 'NaturalGas'];
    const prices = {};
    
    for (const commodity of commodities) {
      try {
        prices[commodity] = await this.getCommodityPrice(commodity);
      } catch (error) {
        console.warn(`⚠️ Failed to get ${commodity} price: ${error.message}`);
        prices[commodity] = { price: 0, source: 'ERROR', error: error.message };
      }
    }
    
    return prices;
  }
}

module.exports = MultiFeedOracleService;
