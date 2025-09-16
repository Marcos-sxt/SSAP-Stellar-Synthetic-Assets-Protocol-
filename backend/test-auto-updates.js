const MultiFeedOracleService = require('./services/MultiFeedOracleService');
const SmartContractService = require('./services/SmartContractService');

class AutoPriceUpdater {
    constructor() {
        this.oracleService = new MultiFeedOracleService();
        this.contractService = new SmartContractService();
        this.updateInterval = null;
    }

    async start() {
        console.log('🚀 Starting automatic price updates...');
        
        // Test initial connection
        const connection = await this.contractService.testConnection();
        console.log('📡 Contract connection:', connection);
        
        if (!connection.success) {
            console.error('❌ Cannot connect to contract. Please check configuration.');
            return;
        }

        // Start updating every 2 minutes
        this.updateInterval = setInterval(async () => {
            await this.updateAllPrices();
        }, 120000); // 2 minutes

        // Do initial update
        await this.updateAllPrices();
    }

    async updateAllPrices() {
        try {
            console.log('\n📊 Starting price update cycle...');
            
            // Update crypto prices
            const cryptoAssets = ['XLM', 'ETH', 'SOL', 'BTC', 'USDC'];
            for (const asset of cryptoAssets) {
                try {
                    const priceData = await this.oracleService.getCryptoPrice(asset);
                    if (priceData && priceData.price > 0) {
                        const result = await this.contractService.updatePrice(asset, priceData.price);
                        console.log(`✅ ${asset}: ${priceData.price} (${priceData.source}) - ${result.success ? 'SUCCESS' : 'FAILED'}`);
                    }
                } catch (error) {
                    console.error(`❌ Error updating ${asset}:`, error.message);
                }
            }
            
            // Update commodity prices
            const commodityAssets = ['WTI', 'Brent', 'Gold', 'Silver'];
            for (const asset of commodityAssets) {
                try {
                    const priceData = await this.oracleService.getCommodityPrice(asset);
                    if (priceData && priceData.price > 0) {
                        const result = await this.contractService.updateExclusivePrice(asset, priceData.price);
                        console.log(`✅ ${asset}: ${priceData.price} (${priceData.source}) - ${result.success ? 'SUCCESS' : 'FAILED'}`);
                    }
                } catch (error) {
                    console.error(`❌ Error updating ${asset}:`, error.message);
                }
            }
            
            console.log('📊 Price update cycle completed');
            
        } catch (error) {
            console.error('❌ Error in price update cycle:', error);
        }
    }

    stop() {
        if (this.updateInterval) {
            clearInterval(this.updateInterval);
            console.log('🛑 Automatic price updates stopped');
        }
    }
}

// Start if run directly
if (require.main === module) {
    const updater = new AutoPriceUpdater();
    
    updater.start().catch(console.error);
    
    // Graceful shutdown
    process.on('SIGINT', () => {
        console.log('\n🛑 Shutting down auto updater...');
        updater.stop();
        process.exit(0);
    });
}

module.exports = AutoPriceUpdater;
