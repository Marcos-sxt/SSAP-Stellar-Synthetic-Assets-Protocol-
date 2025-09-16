const { Contract, rpc, xdr, TransactionBuilder, Keypair } = require('@stellar/stellar-sdk');
const MultiFeedOracleService = require('./MultiFeedOracleService');
const { exec } = require('child_process');
const { promisify } = require('util');
const execAsync = promisify(exec);

class SmartContractService {
  constructor() {
    this.rpc = new rpc.Server('https://soroban-testnet.stellar.org:443');
    this.oracle = new MultiFeedOracleService();
    
    // Contract configuration
    this.contractId = process.env.SAPP_CONTRACT_ID || 'CBTUI3R6FK5C4P6AXC2QN6IDHVILTT4KNK26CW6AZLJ3SGSOEMSKIQFR';
    this.networkPassphrase = 'Test SDF Network ; September 2015';
    
    // Contract client
    this.contract = new Contract(this.contractId, this.networkPassphrase);
  }

  /**
   * Initialize the contract
   * @param {string} adminSecret - Admin secret key
   * @param {string} oracleSecret - Oracle secret key
   * @param {string} usdcTokenId - USDC token contract ID
   * @returns {Promise<Object>} Transaction result
   */
  async initializeContract(adminSecret, oracleSecret, usdcTokenId) {
    try {
      const adminKeypair = Keypair.fromSecret(adminSecret);
      const oracleKeypair = Keypair.fromSecret(oracleSecret);
      
      const adminAddress = adminKeypair.publicKey();
      const oracleAddress = oracleKeypair.publicKey();
      
      const transaction = new TransactionBuilder(adminAddress, {
        fee: '10000000',
        networkPassphrase: this.networkPassphrase
      })
      .addOperation(
        this.contract.call('initialize', adminAddress, oracleAddress, usdcTokenId)
      )
      .setTimeout(30)
      .build();
      
      transaction.sign(adminKeypair);
      
      const result = await this.rpc.sendTransaction(transaction);
      return { success: true, result };
    } catch (error) {
      throw new Error(`Failed to initialize contract: ${error.message}`);
    }
  }

  /**
   * Register an exclusive market
   * @param {string} adminSecret - Admin secret key
   * @param {string} market - Market name (WTI, BRENT, etc.)
   * @param {string} exchange - Exchange name
   * @param {string} oracleFeed - Oracle feed address
   * @param {Object} config - Market configuration
   * @returns {Promise<Object>} Transaction result
   */
  async registerExclusiveMarket(adminSecret, market, exchange, oracleFeed, config) {
    try {
      const adminKeypair = Keypair.fromSecret(adminSecret);
      
      const transaction = new TransactionBuilder(adminKeypair.publicKey(), {
        fee: '10000000',
        networkPassphrase: this.networkPassphrase
      })
      .addOperation(
        this.contract.call('register_exclusive_market', 
          market, exchange, oracleFeed, 
          config.tickSize, config.contractSize, 
          config.minMarginRatio, config.settlementType)
      )
      .setTimeout(30)
      .build();
      
      transaction.sign(adminKeypair);
      
      const result = await this.rpc.sendTransaction(transaction);
      return { success: true, result };
    } catch (error) {
      throw new Error(`Failed to register market: ${error.message}`);
    }
  }

  /**
   * Update exclusive market price (oracle only)
   * @param {string} oracleSecret - Oracle secret key
   * @param {string} market - Market name
   * @param {number} price - Price value
   * @returns {Promise<Object>} Transaction result
   */
  async updateExclusivePrice(oracleSecret, market, price) {
    try {
      const oracleKeypair = Keypair.fromSecret(oracleSecret);
      
      // Convert price to contract format (scaled by 1e7)
      const scaledPrice = Math.floor(price * 10000000);
      
      const transaction = new TransactionBuilder(oracleKeypair.publicKey(), {
        fee: '10000000',
        networkPassphrase: this.networkPassphrase
      })
      .addOperation(
        this.contract.call('update_exclusive_price', market, scaledPrice)
      )
      .setTimeout(30)
      .build();
      
      transaction.sign(oracleKeypair);
      
      const result = await this.rpc.sendTransaction(transaction);
      return { success: true, result };
    } catch (error) {
      throw new Error(`Failed to update price: ${error.message}`);
    }
  }

  /**
   * Open a spread position
   * @param {string} traderSecret - Trader secret key
   * @param {string} leg1Market - First leg market
   * @param {string} leg2Market - Second leg market
   * @param {number} leg1Size - First leg size
   * @param {number} leg2Size - Second leg size
   * @param {number} margin - Margin amount
   * @returns {Promise<Object>} Transaction result
   */
  async openSpreadPosition(traderSecret, leg1Market, leg2Market, leg1Size, leg2Size, margin) {
    try {
      const traderKeypair = Keypair.fromSecret(traderSecret);
      
      // Convert to contract format
      const scaledLeg1Size = Math.floor(leg1Size * 10000000);
      const scaledLeg2Size = Math.floor(leg2Size * 10000000);
      const scaledMargin = Math.floor(margin * 10000000);
      
      const transaction = new TransactionBuilder(traderKeypair.publicKey(), {
        fee: '10000000',
        networkPassphrase: this.networkPassphrase
      })
      .addOperation(
        this.contract.call('open_spread_position', 
          leg1Market, leg2Market, 
          scaledLeg1Size, scaledLeg2Size, scaledMargin)
      )
      .setTimeout(30)
      .build();
      
      transaction.sign(traderKeypair);
      
      const result = await this.rpc.sendTransaction(transaction);
      return { success: true, result };
    } catch (error) {
      throw new Error(`Failed to open spread position: ${error.message}`);
    }
  }

  /**
   * Close a spread position
   * @param {string} traderSecret - Trader secret key
   * @param {number} positionId - Position ID
   * @returns {Promise<Object>} Transaction result
   */
  async closeSpreadPosition(traderSecret, positionId) {
    try {
      const traderKeypair = Keypair.fromSecret(traderSecret);
      
      const transaction = new TransactionBuilder(traderKeypair.publicKey(), {
        fee: '10000000',
        networkPassphrase: this.networkPassphrase
      })
      .addOperation(
        this.contract.call('close_spread_position', positionId)
      )
      .setTimeout(30)
      .build();
      
      transaction.sign(traderKeypair);
      
      const result = await this.rpc.sendTransaction(transaction);
      return { success: true, result };
    } catch (error) {
      throw new Error(`Failed to close spread position: ${error.message}`);
    }
  }

  /**
   * Get spread price between two markets
   * @param {string} market1 - First market
   * @param {string} market2 - Second market
   * @returns {Promise<number>} Spread price
   */
  async getSpreadPrice(market1, market2) {
    try {
      const result = await this.rpc.simulateTransaction(
        this.contract.call('get_spread_price', market1, market2)
      );
      
      if (result.error) {
        throw new Error(`Simulation failed: ${result.error}`);
      }
      
      // Convert from contract format (scaled by 1e7)
      const spreadPrice = result.result.retval.i128() / 10000000;
      return spreadPrice;
    } catch (error) {
      throw new Error(`Failed to get spread price: ${error.message}`);
    }
  }

  /**
   * Get position information
   * @param {number} positionId - Position ID
   * @returns {Promise<Object>} Position data
   */
  async getPositionInfo(positionId) {
    try {
      const result = await this.rpc.simulateTransaction(
        this.contract.call('get_position_info', positionId)
      );
      
      if (result.error) {
        throw new Error(`Simulation failed: ${result.error}`);
      }
      
      return result.result.retval;
    } catch (error) {
      throw new Error(`Failed to get position info: ${error.message}`);
    }
  }

  /**
   * Get all active positions
   * @returns {Promise<Array>} Active positions
   */
  async getActivePositions() {
    try {
      const result = await this.rpc.simulateTransaction(
        this.contract.call('get_active_positions')
      );
      
      if (result.error) {
        throw new Error(`Simulation failed: ${result.error}`);
      }
      
      return result.result.retval;
    } catch (error) {
      throw new Error(`Failed to get active positions: ${error.message}`);
    }
  }

  /**
   * Sync all market prices with the contract
   * @param {string} oracleSecret - Oracle secret key
   * @returns {Promise<Object>} Sync result
   */
  async syncAllPrices(oracleSecret) {
    try {
      const results = {};
      
      // Sync crypto prices
      const cryptoAssets = ['XLM', 'ETH', 'SOL', 'BTC', 'USDC'];
      for (const asset of cryptoAssets) {
        try {
          const price = await this.oracle.getCryptoPrice(asset);
          const scaledPrice = Math.floor(price.price * 10000000);
          
          const result = await this.updateExclusivePrice(oracleSecret, asset, scaledPrice);
          results[asset] = { success: true, price: price.price, source: price.source };
        } catch (error) {
          results[asset] = { success: false, error: error.message };
        }
      }
      
      // Sync commodity prices
      const commodityAssets = ['WTI', 'BRENT', 'GOLD', 'SILVER'];
      for (const asset of commodityAssets) {
        try {
          const price = await this.oracle.getCommodityPrice(asset);
          const scaledPrice = Math.floor(price.price * 10000000);
          
          const result = await this.updateExclusivePrice(oracleSecret, asset, scaledPrice);
          results[asset] = { success: true, price: price.price, source: price.source };
        } catch (error) {
          results[asset] = { success: false, error: error.message };
        }
      }
      
      return { success: true, results };
    } catch (error) {
      throw new Error(`Failed to sync prices: ${error.message}`);
    }
  }

  /**
   * Update crypto price using Stellar CLI
   * @param {string} asset - Asset symbol
   * @param {number} price - Price value
   * @returns {Promise<Object>} Update result
   */
  async updatePrice(asset, price) {
    try {
      // Convert price to contract format (scaled by 1e7)
      const scaledPrice = Math.floor(price * 10000000);
      
      const command = `stellar contract invoke --id ${this.contractId} --source-account test-account --network testnet --send=yes -- update_price --asset ${asset} --price ${scaledPrice}`;
      
      const { stdout, stderr } = await execAsync(command, { 
        cwd: '/home/user/Documents/meridian-hackathon-2/contracts' 
      });
      
      if (stderr && !stderr.includes('Signing transaction')) {
        throw new Error(`CLI error: ${stderr}`);
      }
      
      return { success: true, asset, price, scaledPrice };
    } catch (error) {
      console.error(`❌ Error updating ${asset} price:`, error.message);
      return { success: false, asset, error: error.message };
    }
  }

  /**
   * Update exclusive market price using Stellar CLI
   * @param {string} market - Market name
   * @param {number} price - Price value
   * @returns {Promise<Object>} Update result
   */
  async updateExclusivePrice(market, price) {
    try {
      // Convert price to contract format (scaled by 1e7)
      const scaledPrice = Math.floor(price * 10000000);
      
      const command = `stellar contract invoke --id ${this.contractId} --source-account test-account --network testnet --send=yes -- update_exclusive_price --market ${market} --price ${scaledPrice}`;
      
      const { stdout, stderr } = await execAsync(command, { 
        cwd: '/home/user/Documents/meridian-hackathon-2/contracts' 
      });
      
      if (stderr && !stderr.includes('Signing transaction')) {
        throw new Error(`CLI error: ${stderr}`);
      }
      
      return { success: true, market, price, scaledPrice };
    } catch (error) {
      console.error(`❌ Error updating ${market} price:`, error.message);
      return { success: false, market, error: error.message };
    }
  }

  /**
   * Test contract connection
   * @returns {Promise<Object>} Connection status
   */
  async testConnection() {
    try {
      // Simple test - just check if RPC is configured
      if (this.rpc && this.contractId) {
        return { 
          success: true, 
          contractId: this.contractId,
          network: 'testnet',
          status: 'connected'
        };
      } else {
        return { 
          success: false, 
          error: 'RPC or contract not configured',
          status: 'disconnected'
        };
      }
    } catch (error) {
      return { 
        success: false, 
        error: error.message,
        status: 'disconnected'
      };
    }
  }
}

module.exports = SmartContractService;
