const WebSocket = require('ws');
const http = require('http');
const MultiFeedOracleService = require('./services/MultiFeedOracleService');
const SmartContractService = require('./services/SmartContractService');

class SAPPWebSocketServer {
    constructor(port = 8080) {
        this.port = port;
        this.oracleService = new MultiFeedOracleService();
        this.contractService = new SmartContractService();
        this.clients = new Set();
        this.priceUpdateInterval = null;
        this.contractUpdateInterval = null;
        
        this.setupServer();
        this.startPriceUpdates();
        this.startContractUpdates();
    }

    setupServer() {
        this.server = http.createServer();
        this.wss = new WebSocket.Server({ server: this.server });

        this.wss.on('connection', (ws) => {
            console.log('🔌 New WebSocket client connected');
            this.clients.add(ws);

            // Send initial data
            this.sendInitialData(ws);

            ws.on('close', () => {
                console.log('🔌 WebSocket client disconnected');
                this.clients.delete(ws);
            });

            ws.on('error', (error) => {
                console.error('❌ WebSocket error:', error);
                this.clients.delete(ws);
            });
        });

        this.server.listen(this.port, () => {
            console.log(`🚀 SAPP WebSocket Server running on port ${this.port}`);
        });
    }

    async sendInitialData(ws) {
        try {
            const cryptoPrices = await this.oracleService.getCryptoPrices();
            const commodityPrices = await this.oracleService.getCommodityPrices();
            
            const initialData = {
                type: 'initial_data',
                timestamp: Date.now(),
                crypto: cryptoPrices,
                commodities: commodityPrices
            };

            if (ws.readyState === WebSocket.OPEN) {
                ws.send(JSON.stringify(initialData));
            }
        } catch (error) {
            console.error('❌ Error sending initial data:', error);
        }
    }

    broadcast(data) {
        const message = JSON.stringify(data);
        this.clients.forEach((client) => {
            if (client.readyState === WebSocket.OPEN) {
                client.send(message);
            }
        });
    }

    startPriceUpdates() {
        // Update prices every 30 seconds
        this.priceUpdateInterval = setInterval(async () => {
            try {
                console.log('📊 Fetching latest prices...');
                
                const cryptoPrices = await this.oracleService.getCryptoPrices();
                const commodityPrices = await this.oracleService.getCommodityPrices();
                
                const priceData = {
                    type: 'price_update',
                    timestamp: Date.now(),
                    crypto: cryptoPrices,
                    commodities: commodityPrices
                };

                this.broadcast(priceData);
                console.log('📊 Prices broadcasted to', this.clients.size, 'clients');
                
            } catch (error) {
                console.error('❌ Error updating prices:', error);
            }
        }, 30000); // 30 seconds
    }

    startContractUpdates() {
        // Update contract prices every 5 minutes
        this.contractUpdateInterval = setInterval(async () => {
            try {
                console.log('🔄 Updating contract prices...');
                
                // Get latest prices
                const cryptoPrices = await this.oracleService.getCryptoPrices();
                const commodityPrices = await this.oracleService.getCommodityPrices();
                
                // Update crypto prices in contract
                for (const [asset, priceData] of Object.entries(cryptoPrices)) {
                    if (priceData.price && priceData.price > 0) {
                        await this.contractService.updatePrice(asset, priceData.price);
                        console.log(`✅ Updated ${asset} price: ${priceData.price}`);
                    }
                }
                
                // Update commodity prices in contract
                for (const [market, priceData] of Object.entries(commodityPrices)) {
                    if (priceData.price && priceData.price > 0) {
                        await this.contractService.updateExclusivePrice(market, priceData.price);
                        console.log(`✅ Updated ${market} price: ${priceData.price}`);
                    }
                }
                
                console.log('🔄 Contract prices updated successfully');
                
            } catch (error) {
                console.error('❌ Error updating contract prices:', error);
            }
        }, 300000); // 5 minutes
    }

    stop() {
        if (this.priceUpdateInterval) {
            clearInterval(this.priceUpdateInterval);
        }
        if (this.contractUpdateInterval) {
            clearInterval(this.contractUpdateInterval);
        }
        this.server.close();
    }
}

// Start server if run directly
if (require.main === module) {
    const server = new SAPPWebSocketServer();
    
    // Graceful shutdown
    process.on('SIGINT', () => {
        console.log('\n🛑 Shutting down WebSocket server...');
        server.stop();
        process.exit(0);
    });
}

module.exports = SAPPWebSocketServer;
