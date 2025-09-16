const MultiFeedOracleService = require('./MultiFeedOracleService');

class SpreadTradingService {
  constructor() {
    this.oracle = new MultiFeedOracleService();
    
    // Spread trading configurations
    this.spreadConfigs = {
      'WTI-BRENT': {
        leg1: 'WTI',
        leg2: 'BRENT',
        minSpread: 0.50, // Minimum spread in USD
        maxSpread: 10.00, // Maximum spread in USD
        tickSize: 0.01, // Minimum price increment
        contractSize: 1000, // Barrels per contract
        marginRatio: 0.05, // 5% margin requirement
        description: 'WTI Crude Oil vs Brent Crude Oil Spread'
      },
      'GOLD-SILVER': {
        leg1: 'GOLD',
        leg2: 'SILVER',
        minSpread: 100.00, // Minimum spread in USD
        maxSpread: 5000.00, // Maximum spread in USD
        tickSize: 0.10, // Minimum price increment
        contractSize: 100, // Ounces per contract
        marginRatio: 0.08, // 8% margin requirement
        description: 'Gold vs Silver Spread'
      }
    };
    
    // Active spread positions
    this.positions = new Map();
    this.positionCounter = 0;
  }

  /**
   * Get current spread price between two assets
   * @param {string} spreadName - Name of the spread (e.g., 'WTI-BRENT')
   * @returns {Promise<Object>} Spread data
   */
  async getSpreadPrice(spreadName) {
    const config = this.spreadConfigs[spreadName];
    if (!config) {
      throw new Error(`Spread configuration not found: ${spreadName}`);
    }

    try {
      // Get prices for both legs
      const [leg1Price, leg2Price] = await Promise.all([
        this.oracle.getCommodityPrice(config.leg1),
        this.oracle.getCommodityPrice(config.leg2)
      ]);

      const spread = leg1Price.price - leg2Price.price;
      const spreadPercent = (spread / leg2Price.price) * 100;

      return {
        spreadName,
        leg1: {
          asset: config.leg1,
          price: leg1Price.price,
          source: leg1Price.source
        },
        leg2: {
          asset: config.leg2,
          price: leg2Price.price,
          source: leg2Price.source
        },
        spread: spread,
        spreadPercent: spreadPercent,
        timestamp: Date.now(),
        config: config
      };
    } catch (error) {
      throw new Error(`Failed to get spread price for ${spreadName}: ${error.message}`);
    }
  }

  /**
   * Calculate spread position requirements
   * @param {string} spreadName - Name of the spread
   * @param {number} size - Position size (positive for long spread, negative for short)
   * @returns {Object} Position requirements
   */
  calculatePositionRequirements(spreadName, size) {
    const config = this.spreadConfigs[spreadName];
    if (!config) {
      throw new Error(`Spread configuration not found: ${spreadName}`);
    }

    const notionalValue = Math.abs(size) * config.contractSize;
    const marginRequired = notionalValue * config.marginRatio;
    const maxPositionSize = Math.floor(100000 / config.contractSize); // Max $100k notional

    return {
      spreadName,
      size,
      notionalValue,
      marginRequired,
      maxPositionSize,
      tickValue: config.tickSize * config.contractSize,
      config
    };
  }

  /**
   * Open a spread position
   * @param {string} traderId - Trader identifier
   * @param {string} spreadName - Name of the spread
   * @param {number} size - Position size
   * @param {number} margin - Margin provided
   * @returns {Promise<Object>} Position data
   */
  async openSpreadPosition(traderId, spreadName, size, margin) {
    const config = this.spreadConfigs[spreadName];
    if (!config) {
      throw new Error(`Spread configuration not found: ${spreadName}`);
    }

    // Get current spread price
    const spreadData = await this.getSpreadPrice(spreadName);
    
    // Calculate requirements
    const requirements = this.calculatePositionRequirements(spreadName, size);
    
    // Validate position
    if (Math.abs(size) > requirements.maxPositionSize) {
      throw new Error(`Position size too large. Max: ${requirements.maxPositionSize}`);
    }
    
    if (margin < requirements.marginRequired) {
      throw new Error(`Insufficient margin. Required: $${requirements.marginRequired.toFixed(2)}`);
    }

    // Create position
    const positionId = ++this.positionCounter;
    const position = {
      id: positionId,
      traderId,
      spreadName,
      size,
      entrySpread: spreadData.spread,
      entryTime: Date.now(),
      margin,
      status: 'OPEN',
      pnl: 0,
      unrealizedPnl: 0
    };

    this.positions.set(positionId, position);
    
    return {
      positionId,
      position,
      spreadData,
      requirements
    };
  }

  /**
   * Close a spread position
   * @param {number} positionId - Position ID
   * @returns {Promise<Object>} Close result
   */
  async closeSpreadPosition(positionId) {
    const position = this.positions.get(positionId);
    if (!position) {
      throw new Error(`Position not found: ${positionId}`);
    }

    if (position.status !== 'OPEN') {
      throw new Error(`Position is not open: ${position.status}`);
    }

    // Get current spread price
    const spreadData = await this.getSpreadPrice(position.spreadName);
    
    // Calculate P&L
    const spreadChange = spreadData.spread - position.entrySpread;
    const pnl = spreadChange * position.size;
    const totalReturn = position.margin + pnl;

    // Update position
    position.exitSpread = spreadData.spread;
    position.exitTime = Date.now();
    position.pnl = pnl;
    position.totalReturn = totalReturn;
    position.status = 'CLOSED';

    return {
      positionId,
      position,
      spreadData,
      pnl,
      totalReturn,
      returnPercent: (pnl / position.margin) * 100
    };
  }

  /**
   * Get position status and unrealized P&L
   * @param {number} positionId - Position ID
   * @returns {Promise<Object>} Position status
   */
  async getPositionStatus(positionId) {
    const position = this.positions.get(positionId);
    if (!position) {
      throw new Error(`Position not found: ${positionId}`);
    }

    if (position.status !== 'OPEN') {
      return {
        positionId,
        position,
        unrealizedPnl: 0,
        currentSpread: null
      };
    }

    // Get current spread price
    const spreadData = await this.getSpreadPrice(position.spreadName);
    
    // Calculate unrealized P&L
    const spreadChange = spreadData.spread - position.entrySpread;
    const unrealizedPnl = spreadChange * position.size;

    // Update position
    position.unrealizedPnl = unrealizedPnl;

    return {
      positionId,
      position,
      unrealizedPnl,
      currentSpread: spreadData.spread,
      spreadData
    };
  }

  /**
   * Get all available spreads
   * @returns {Array} Available spreads
   */
  getAvailableSpreads() {
    return Object.keys(this.spreadConfigs).map(name => ({
      name,
      ...this.spreadConfigs[name]
    }));
  }

  /**
   * Get all positions for a trader
   * @param {string} traderId - Trader identifier
   * @returns {Array} Trader positions
   */
  getTraderPositions(traderId) {
    return Array.from(this.positions.values())
      .filter(pos => pos.traderId === traderId);
  }

  /**
   * Get spread trading statistics
   * @returns {Object} Statistics
   */
  getStatistics() {
    const allPositions = Array.from(this.positions.values());
    const openPositions = allPositions.filter(pos => pos.status === 'OPEN');
    const closedPositions = allPositions.filter(pos => pos.status === 'CLOSED');

    const totalPnl = closedPositions.reduce((sum, pos) => sum + pos.pnl, 0);
    const totalVolume = allPositions.reduce((sum, pos) => sum + Math.abs(pos.size), 0);

    return {
      totalPositions: allPositions.length,
      openPositions: openPositions.length,
      closedPositions: closedPositions.length,
      totalPnl,
      totalVolume,
      averagePnl: closedPositions.length > 0 ? totalPnl / closedPositions.length : 0
    };
  }
}

module.exports = SpreadTradingService;
