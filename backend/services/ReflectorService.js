const { 
  Contract, 
  rpc, 
  TransactionBuilder, 
  Networks, 
  BASE_FEE,
  xdr,
  scValToNative
} = require('@stellar/stellar-sdk');

class ReflectorService {
  constructor() {
    this.contractId = 'CCYOZJCOPG34LLQQ7N24YXBM7LL62R7ONMZ3G6WZAAYPB5OYKOMJRN63';
    this.rpc = new rpc.Server('https://soroban-testnet.stellar.org');
    this.contract = new Contract(this.contractId);
    
    // Decimal mapping for different assets
    this.decimals = {
      'XLM': 14,
      'SOL': 14,
      'ETH': 18,
      'BTC': 8,
      'USDC': 6
    };
  }

  /**
   * Get price from Reflector Oracle using lastprice method
   * @param {string} asset - Asset symbol (XLM, ETH, SOL, BTC)
   * @returns {Promise<Object>} Price data with price and timestamp
   */
  async getPrice(asset) {
    try {
      console.log(`🔍 Fetching ${asset} price from Reflector...`);
      
      // Create the enum variant for {Other: "XLM"} using xdr directly
      const assetArg = xdr.ScVal.scvVec([
        xdr.ScVal.scvSymbol('Other'),
        xdr.ScVal.scvSymbol(asset)
      ]);

      const operation = this.contract.call('lastprice', assetArg);

      const sourceAccount = await this.rpc.getAccount('GAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAWHF');
      
      const transaction = new TransactionBuilder(sourceAccount, {
        fee: BASE_FEE,
        networkPassphrase: Networks.TESTNET
      })
        .addOperation(operation)
        .setTimeout(30)
        .build();

      const simulationResponse = await this.rpc.simulateTransaction(transaction);
      
      if (simulationResponse.error) {
        throw new Error(`Simulation failed: ${simulationResponse.error}`);
      }

      if (simulationResponse.result) {
        const result = scValToNative(simulationResponse.result.retval);
        
        const rawPrice = parseInt(result.price);
        const timestamp = parseInt(result.timestamp);
        
        // Convert price to real value
        // Reflector returns ALL prices in 14 decimals, regardless of asset
        const realPrice = rawPrice / Math.pow(10, 14);
        
        console.log(`✅ ${asset}: $${realPrice.toFixed(6)} (raw: ${rawPrice})`);
        
        return {
          symbol: asset,
          price: realPrice,
          rawPrice: rawPrice,
          decimals: 14, // Reflector always uses 14 decimals
          timestamp: timestamp,
          source: 'REFLECTOR',
          reliability: 100
        };
      }
      
      throw new Error('No result from simulation');
      
    } catch (error) {
      console.error(`❌ Error fetching ${asset} from Reflector:`, error.message);
      throw error;
    }
  }

  /**
   * Get price using x_last_price method (for price pairs)
   * @param {string} baseAsset - Base asset symbol
   * @param {string} quoteAsset - Quote asset symbol
   * @returns {Promise<Object>} Price data
   */
  async getPricePair(baseAsset, quoteAsset = 'USDC') {
    try {
      console.log(`🔍 Fetching ${baseAsset}/${quoteAsset} price pair from Reflector...`);
      
      // Create enum variants for both assets
      const baseArg = xdr.ScVal.scvVec([
        xdr.ScVal.scvSymbol('Other'),
        xdr.ScVal.scvSymbol(baseAsset)
      ]);
      
      const quoteArg = xdr.ScVal.scvVec([
        xdr.ScVal.scvSymbol('Other'),
        xdr.ScVal.scvSymbol(quoteAsset)
      ]);

      const operation = this.contract.call('x_last_price', baseArg, quoteArg);

      const sourceAccount = await this.rpc.getAccount('GAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAWHF');
      
      const transaction = new TransactionBuilder(sourceAccount, {
        fee: BASE_FEE,
        networkPassphrase: Networks.TESTNET
      })
        .addOperation(operation)
        .setTimeout(30)
        .build();

      const simulationResponse = await this.rpc.simulateTransaction(transaction);
      
      if (simulationResponse.error) {
        throw new Error(`Simulation failed: ${simulationResponse.error}`);
      }

      if (simulationResponse.result) {
        const result = scValToNative(simulationResponse.result.retval);
        
        const rawPrice = parseInt(result.price);
        const timestamp = parseInt(result.timestamp);
        
        // Convert price to real value
        // Reflector returns ALL prices in 14 decimals, regardless of asset
        const realPrice = rawPrice / Math.pow(10, 14);
        
        console.log(`✅ ${baseAsset}/${quoteAsset}: $${realPrice.toFixed(6)} (raw: ${rawPrice})`);
        
        return {
          symbol: `${baseAsset}/${quoteAsset}`,
          price: realPrice,
          rawPrice: rawPrice,
          decimals: 14, // Reflector always uses 14 decimals
          timestamp: timestamp,
          source: 'REFLECTOR',
          reliability: 100
        };
      }
      
      throw new Error('No result from simulation');
      
    } catch (error) {
      console.error(`❌ Error fetching ${baseAsset}/${quoteAsset} from Reflector:`, error.message);
      throw error;
    }
  }

  /**
   * Get multiple crypto prices
   * @param {Array<string>} assets - Array of asset symbols
   * @returns {Promise<Array>} Array of price data
   */
  async getMultiplePrices(assets) {
    const prices = [];
    
    for (const asset of assets) {
      try {
        const priceData = await this.getPrice(asset);
        prices.push(priceData);
      } catch (error) {
        console.error(`Failed to get ${asset} price:`, error.message);
        // Continue with other assets
      }
    }
    
    return prices;
  }

  /**
   * Test Reflector connection
   * @returns {Promise<boolean>} Connection status
   */
  async testConnection() {
    try {
      console.log('🔍 Testing Reflector connection...');
      const price = await this.getPrice('XLM');
      console.log('✅ Reflector connection successful');
      return true;
    } catch (error) {
      console.error('❌ Reflector connection failed:', error.message);
      return false;
    }
  }

  /**
   * Get available assets from Reflector
   * @returns {Array<string>} List of supported assets
   */
  getSupportedAssets() {
    return ['XLM', 'ETH', 'SOL', 'BTC'];
  }
}

module.exports = ReflectorService;
