const { ethers } = require('ethers');

class ChainlinkService {
  constructor() {
    // Chainlink Aggregator V3 ABI (simplificado)
    this.aggregatorV3InterfaceABI = [
      {
        "inputs": [],
        "name": "latestRoundData",
        "outputs": [
          { "internalType": "uint80", "name": "roundId", "type": "uint80" },
          { "internalType": "int256", "name": "answer", "type": "int256" },
          { "internalType": "uint256", "name": "startedAt", "type": "uint256" },
          { "internalType": "uint256", "name": "updatedAt", "type": "uint256" },
          { "internalType": "uint80", "name": "answeredInRound", "type": "uint80" }
        ],
        "stateMutability": "view",
        "type": "function"
      }
    ];

    // Chainlink feed addresses (Ethereum Sepolia testnet)
    this.feeds = {
      WTI: "0x4e4a6c4d4e4a6c4d4e4a6c4d4e4a6c4d4e4a6c4d", // Placeholder - need real address
      GOLD: "0x4e4a6c4d4e4a6c4d4e4a6c4d4e4a6c4d4e4a6c4d", // Placeholder - need real address
      SILVER: "0x4e4a6c4d4e4a6c4d4e4a6c4d4e4a6c4d4e4a6c4d", // Placeholder - need real address
      NATGAS: "0x4e4a6c4d4e4a6c4d4e4a6c4d4e4a6c4d4e4a6c4d" // Placeholder - need real address
    };

    // Ethereum Sepolia testnet RPC
    this.rpcUrl = process.env.ETH_RPC_URL || 'https://sepolia.infura.io/v3/YOUR_PROJECT_ID';
    
    // Only create provider if we have a valid RPC URL
    if (this.rpcUrl && !this.rpcUrl.includes('YOUR_PROJECT_ID')) {
      this.provider = new ethers.JsonRpcProvider(this.rpcUrl);
    } else {
      this.provider = null;
    }
    
    // Decimal mapping for Chainlink feeds (usually 8 decimals)
    this.decimals = {
      'WTI': 8,
      'GOLD': 8,
      'SILVER': 8,
      'NATGAS': 8
    };
  }

  /**
   * Get price from Chainlink Oracle
   * @param {string} symbol - Commodity symbol (WTI, GOLD, SILVER, NATGAS)
   * @returns {Promise<Object>} Price data with source information
   */
  async getPrice(symbol) {
    try {
      console.log(`🔗 Fetching ${symbol} price from Chainlink...`);
      
      // Check if provider is available
      if (!this.provider) {
        throw new Error('Chainlink provider not configured - missing valid RPC URL');
      }
      
      const feedAddress = this.feeds[symbol];
      if (!feedAddress) {
        throw new Error(`Feed address not found for ${symbol}`);
      }

      // Create contract instance
      const feed = new ethers.Contract(feedAddress, this.aggregatorV3InterfaceABI, this.provider);
      
      // Get latest round data
      const roundData = await feed.latestRoundData();
      
      // Extract data
      const [roundId, answer, startedAt, updatedAt, answeredInRound] = roundData;
      
      // Convert price to real value (Chainlink uses 8 decimals)
      const decimals = this.decimals[symbol] || 8;
      const realPrice = Number(answer) / Math.pow(10, decimals);
      
      console.log(`✅ ${symbol}: $${realPrice.toFixed(6)} (raw: ${answer.toString()})`);
      
      return {
        symbol: symbol,
        price: realPrice,
        rawPrice: answer.toString(),
        decimals: decimals,
        timestamp: Number(updatedAt),
        roundId: Number(roundId),
        source: 'CHAINLINK',
        reliability: 95
      };
      
    } catch (error) {
      console.error(`❌ Error fetching ${symbol} from Chainlink:`, error.message);
      throw error;
    }
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
        // Continue with other assets
      }
    }
    
    return prices;
  }

  /**
   * Test Chainlink connection
   * @returns {Promise<boolean>} Connection status
   */
  async testConnection() {
    try {
      console.log('🔗 Testing Chainlink connection...');
      
      // Check if provider is available
      if (!this.provider) {
        console.log('⚠️ Chainlink provider not configured - missing valid RPC URL');
        return false;
      }
      
      // Test with a simple call to get network info
      const network = await this.provider.getNetwork();
      console.log(`✅ Chainlink connection successful (network: ${network.name})`);
      
      return true;
    } catch (error) {
      console.error('❌ Chainlink connection failed:', error.message);
      return false;
    }
  }

  /**
   * Get available commodities from Chainlink
   * @returns {Array<string>} List of supported commodities
   */
  getSupportedCommodities() {
    return Object.keys(this.feeds);
  }

  /**
   * Update feed addresses (for different networks)
   * @param {Object} newFeeds - New feed addresses
   */
  updateFeedAddresses(newFeeds) {
    this.feeds = { ...this.feeds, ...newFeeds };
    console.log('📝 Chainlink feed addresses updated');
  }

  /**
   * Get feed information
   * @param {string} symbol - Commodity symbol
   * @returns {Object} Feed information
   */
  getFeedInfo(symbol) {
    return {
      symbol: symbol,
      address: this.feeds[symbol],
      decimals: this.decimals[symbol],
      network: 'Ethereum Sepolia',
      source: 'CHAINLINK'
    };
  }
}

module.exports = ChainlinkService;
