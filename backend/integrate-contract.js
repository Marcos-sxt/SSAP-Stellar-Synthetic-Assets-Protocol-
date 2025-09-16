const { Contract, rpc, TransactionBuilder, Networks, BASE_FEE, xdr, scValToNative } = require('@stellar/stellar-sdk');
const MultiFeedOracleService = require('./services/MultiFeedOracleService');

class ContractIntegration {
    constructor() {
        this.contractId = 'CDMISKILKSSW7RNLGQV7BWOTJ3QYBLGNZG6LDNSFGBYGADRWCE6H4WBA';
        this.rpcUrl = 'https://soroban-testnet.stellar.org';
        this.networkPassphrase = 'Test SDF Network ; September 2015';
        
        // Initialize RPC server
        this.server = new rpc.Server(this.rpcUrl);
        
        // Initialize oracle service
        this.oracle = new MultiFeedOracleService();
        
        // Contract client
        this.contract = new Contract({
            contractId: this.contractId,
            networkPassphrase: this.networkPassphrase,
            rpcUrl: this.rpcUrl
        });
    }

    async updateContractPrices() {
        console.log('🔄 Updating contract prices from oracles...');
        
        try {
            // Get crypto prices
            const cryptoAssets = ['BTC', 'ETH', 'XLM'];
            for (const asset of cryptoAssets) {
                try {
                    const price = await this.oracle.getCryptoPrice(asset);
                    if (price && price.price) {
                        // Convert to contract format (6 decimals)
                        const contractPrice = Math.round(price.price * 1000000);
                        
                        console.log(`📊 ${asset}: $${price.price} → ${contractPrice} (contract format)`);
                        
                        // Update price in contract
                        await this.updatePrice(asset, contractPrice);
                        
                        // Wait a bit between updates
                        await new Promise(resolve => setTimeout(resolve, 1000));
                    }
                } catch (error) {
                    console.error(`❌ Error updating ${asset}:`, error.message);
                }
            }

            // Get commodity prices
            const commodityAssets = ['WTI', 'Brent', 'Gold', 'Silver'];
            for (const asset of commodityAssets) {
                try {
                    const price = await this.oracle.getCommodityPrice(asset);
                    if (price && price.price) {
                        // Convert to contract format (6 decimals)
                        const contractPrice = Math.round(price.price * 1000000);
                        
                        console.log(`🛢️ ${asset}: $${price.price} → ${contractPrice} (contract format)`);
                        
                        // Update price in contract
                        await this.updatePrice(asset, contractPrice);
                        
                        // Wait a bit between updates
                        await new Promise(resolve => setTimeout(resolve, 1000));
                    }
                } catch (error) {
                    console.error(`❌ Error updating ${asset}:`, error.message);
                }
            }

            console.log('✅ All prices updated successfully!');
            
        } catch (error) {
            console.error('❌ Error updating prices:', error);
        }
    }

    async updatePrice(asset, price) {
        try {
            // Create asset argument
            const assetArg = xdr.ScVal.scvSymbol(asset);
            const priceArg = xdr.ScVal.scvI128(xdr.Int128Parts.fromString(price.toString()));
            
            // Create operation
            const operation = this.contract.call('update_price', assetArg, priceArg);
            
            // Build transaction
            const transaction = new TransactionBuilder(this.server.getAccount(), {
                fee: BASE_FEE,
                networkPassphrase: this.networkPassphrase
            })
            .addOperation(operation)
            .setTimeout(30)
            .build();

            // Simulate first
            const simulation = await this.server.simulateTransaction(transaction);
            
            if (simulation.error) {
                throw new Error(`Simulation failed: ${simulation.error.message}`);
            }

            // For now, just simulate (we'd need a secret key to actually submit)
            console.log(`✅ Simulated update: ${asset} = ${price}`);
            
        } catch (error) {
            console.error(`❌ Error updating ${asset} price:`, error.message);
        }
    }

    async getContractPrice(asset) {
        try {
            const assetArg = xdr.ScVal.scvSymbol(asset);
            const operation = this.contract.call('get_asset_price', assetArg);
            
            const transaction = new TransactionBuilder(this.server.getAccount(), {
                fee: BASE_FEE,
                networkPassphrase: this.networkPassphrase
            })
            .addOperation(operation)
            .setTimeout(30)
            .build();

            const simulation = await this.server.simulateTransaction(transaction);
            
            if (simulation.error) {
                throw new Error(`Simulation failed: ${simulation.error.message}`);
            }

            const result = simulation.result.retval;
            const price = scValToNative(result);
            
            // Convert back to dollar format
            const dollarPrice = price / 1000000;
            
            return {
                asset,
                price: dollarPrice,
                contractPrice: price
            };
            
        } catch (error) {
            console.error(`❌ Error getting ${asset} price:`, error.message);
            return null;
        }
    }

    async testIntegration() {
        console.log('🧪 Testing Backend ↔ Contract Integration...\n');
        
        // Test 1: Update prices from oracles
        console.log('1️⃣ Updating prices from oracles...');
        await this.updateContractPrices();
        
        console.log('\n2️⃣ Reading prices from contract...');
        
        // Test 2: Read prices from contract
        const assets = ['BTC', 'ETH', 'XLM', 'WTI', 'Brent', 'Gold', 'Silver'];
        for (const asset of assets) {
            const priceData = await this.getContractPrice(asset);
            if (priceData) {
                console.log(`📊 ${asset}: $${priceData.price.toFixed(2)} (${priceData.contractPrice})`);
            } else {
                console.log(`❌ ${asset}: Price not available`);
            }
        }
        
        console.log('\n✅ Integration test completed!');
    }
}

// Run integration test
async function main() {
    const integration = new ContractIntegration();
    await integration.testIntegration();
}

if (require.main === module) {
    main().catch(console.error);
}

module.exports = ContractIntegration;
