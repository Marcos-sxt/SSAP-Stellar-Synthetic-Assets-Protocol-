const { exec } = require('child_process');
const { promisify } = require('util');
const MultiFeedOracleService = require('./services/MultiFeedOracleService');

const execAsync = promisify(exec);

class ContractPriceUpdater {
    constructor() {
        this.contractId = 'CDMISKILKSSW7RNLGQV7BWOTJ3QYBLGNZG6LDNSFGBYGADRWCE6H4WBA';
        this.oracle = new MultiFeedOracleService();
    }

    async updatePrice(asset, price) {
        try {
            // Convert to contract format (6 decimals)
            const contractPrice = Math.round(price * 1000000);
            
            console.log(`📊 Updating ${asset}: $${price} → ${contractPrice} (contract format)`);
            
            // Use Stellar CLI to update price (with --send=yes to actually submit)
            const command = `stellar contract invoke --id ${this.contractId} --source-account admin --network testnet --send=yes -- update_price --asset ${asset} --price ${contractPrice}`;
            
            const { stdout, stderr } = await execAsync(command, { 
                cwd: '/home/user/Documents/meridian-hackathon-2/contracts' 
            });
            
            // Check if stderr contains actual errors (not just signing messages)
            if (stderr && !stderr.includes('Signing transaction')) {
                console.error(`❌ Error updating ${asset}:`, stderr);
                return false;
            }
            
            console.log(`✅ ${asset} updated successfully`);
            return true;
            
        } catch (error) {
            console.error(`❌ Error updating ${asset}:`, error.message);
            return false;
        }
    }

    async getPrice(asset) {
        try {
            const command = `stellar contract invoke --id ${this.contractId} --source-account admin --network testnet -- get_asset_price --asset ${asset}`;
            
            const { stdout, stderr } = await execAsync(command, { 
                cwd: '/home/user/Documents/meridian-hackathon-2/contracts' 
            });
            
            if (stderr) {
                console.error(`❌ Error getting ${asset}:`, stderr);
                return null;
            }
            
            // Parse the price from output
            const match = stdout.match(/"(\d+)"/);
            if (match) {
                const contractPrice = parseInt(match[1]);
                const dollarPrice = contractPrice / 1000000;
                return { asset, price: dollarPrice, contractPrice };
            }
            
            return null;
            
        } catch (error) {
            console.error(`❌ Error getting ${asset}:`, error.message);
            return null;
        }
    }

    async updateAllPrices() {
        console.log('🔄 Updating all prices from oracles...\n');
        
        // Update crypto prices
        const cryptoAssets = ['BTC', 'ETH', 'XLM'];
        for (const asset of cryptoAssets) {
            try {
                const priceData = await this.oracle.getCryptoPrice(asset);
                if (priceData && priceData.price) {
                    await this.updatePrice(asset, priceData.price);
                    await this.sleep(1000); // Wait 1 second between updates
                }
            } catch (error) {
                console.error(`❌ Error updating ${asset}:`, error.message);
            }
        }
        
        // Update commodity prices
        const commodityAssets = ['WTI', 'Brent', 'Gold', 'Silver', 'NatGas', 'Copper'];
        for (const asset of commodityAssets) {
            try {
                const priceData = await this.oracle.getCommodityPrice(asset);
                if (priceData && priceData.price) {
                    await this.updatePrice(asset, priceData.price);
                    await this.sleep(1000); // Wait 1 second between updates
                }
            } catch (error) {
                console.error(`❌ Error updating ${asset}:`, error.message);
            }
        }
        
        console.log('\n✅ All prices updated!');
    }

    async readAllPrices() {
        console.log('📊 Reading all prices from contract...\n');
        
        const assets = ['BTC', 'ETH', 'XLM', 'WTI', 'Brent', 'Gold', 'Silver', 'NatGas', 'Copper'];
        for (const asset of assets) {
            const priceData = await this.getPrice(asset);
            if (priceData) {
                console.log(`📊 ${asset}: $${priceData.price.toFixed(2)} (${priceData.contractPrice})`);
            } else {
                console.log(`❌ ${asset}: Price not available`);
            }
        }
    }

    async testIntegration() {
        console.log('🧪 Testing Backend ↔ Contract Integration...\n');
        
        // Test 1: Update prices from oracles
        console.log('1️⃣ Updating prices from oracles...');
        await this.updateAllPrices();
        
        console.log('\n2️⃣ Reading prices from contract...');
        await this.readAllPrices();
        
        console.log('\n✅ Integration test completed!');
    }

    sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}

// Run integration test
async function main() {
    const updater = new ContractPriceUpdater();
    await updater.testIntegration();
}

if (require.main === module) {
    main().catch(console.error);
}

module.exports = ContractPriceUpdater;
