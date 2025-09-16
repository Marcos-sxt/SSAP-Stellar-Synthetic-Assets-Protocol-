const { exec } = require('child_process');
const { promisify } = require('util');
const execAsync = promisify(exec);

class DummyDataSetup {
  constructor() {
    this.contractId = 'CBTUI3R6FK5C4P6AXC2QN6IDHVILTT4KNK26CW6AZLJ3SGSOEMSKIQFR';
    this.adminKey = 'admin';
    this.network = 'testnet';
  }

  async runCommand(command) {
    try {
      console.log(`🔄 Executando: ${command}`);
      const { stdout, stderr } = await execAsync(command);
      if (stdout) console.log(`✅ Sucesso: ${stdout.trim()}`);
      if (stderr) console.log(`⚠️ Warning: ${stderr.trim()}`);
      return { success: true, output: stdout };
    } catch (error) {
      console.log(`❌ Erro: ${error.message}`);
      return { success: false, error: error.message };
    }
  }

  async setupCryptoPrices() {
    console.log('\n🪙 Configurando preços de criptomoedas...');
    
    const cryptoPrices = [
      { asset: 'BTC', price: 50000000000 },    // $50,000
      { asset: 'ETH', price: 3000000000 },     // $3,000
      { asset: 'XLM', price: 100000000 },      // $0.10
      { asset: 'SOL', price: 20000000000 },    // $200
      { asset: 'USDC', price: 100000000 },     // $1.00
    ];

    for (const { asset, price } of cryptoPrices) {
      const command = `stellar contract invoke --id ${this.contractId} --source-account ${this.adminKey} --network ${this.network} -- update_price --asset ${asset} --price ${price}`;
      await this.runCommand(command);
      await new Promise(resolve => setTimeout(resolve, 1000)); // Wait 1 second between calls
    }
  }

  async setupExclusiveMarkets() {
    console.log('\n🛢️ Registrando mercados exclusivos...');
    
    const markets = [
      {
        market: 'WTI',
        exchange: 'CME',
        tickSize: 100,      // $0.01
        contractSize: 1000, // 1000 barrels
        minMarginRatio: 500, // 5%
        settlementType: 'cash'
      },
      {
        market: 'Brent',
        exchange: 'ICE',
        tickSize: 100,      // $0.01
        contractSize: 1000, // 1000 barrels
        minMarginRatio: 500, // 5%
        settlementType: 'cash'
      },
      {
        market: 'Gold',
        exchange: 'CME',
        tickSize: 10,       // $0.10
        contractSize: 100,  // 100 oz
        minMarginRatio: 500, // 5%
        settlementType: 'cash'
      },
      {
        market: 'Silver',
        exchange: 'CME',
        tickSize: 1,        // $0.01
        contractSize: 5000, // 5000 oz
        minMarginRatio: 500, // 5%
        settlementType: 'cash'
      },
      {
        market: 'Copper',
        exchange: 'CME',
        tickSize: 25,       // $0.25
        contractSize: 25000, // 25000 lbs
        minMarginRatio: 500, // 5%
        settlementType: 'cash'
      },
      {
        market: 'NatGas',
        exchange: 'NYMEX',
        tickSize: 1,        // $0.001
        contractSize: 10000, // 10000 MMBtu
        minMarginRatio: 500, // 5%
        settlementType: 'cash'
      }
    ];

    for (const market of markets) {
      const command = `stellar contract invoke --id ${this.contractId} --source-account ${this.adminKey} --network ${this.network} -- register_exclusive_market --market ${market.market} --exchange ${market.exchange} --oracle-feed GDL7NL5VHCIFEWIYMQRP5JX6SGNCSBS2BP5I3426QLXIR3QLHZHKAMWE --tick-size ${market.tickSize} --contract-size ${market.contractSize} --min-margin-ratio ${market.minMarginRatio} --settlement-type ${market.settlementType}`;
      await this.runCommand(command);
      await new Promise(resolve => setTimeout(resolve, 1000)); // Wait 1 second between calls
    }
  }

  async setupExclusivePrices() {
    console.log('\n💰 Configurando preços dos mercados exclusivos...');
    
    const exclusivePrices = [
      { market: 'WTI', price: 6300000000000 },      // $63.00
      { market: 'Brent', price: 6700000000000 },    // $67.00
      { market: 'Gold', price: 2000000000000 },     // $2000.00
      { market: 'Silver', price: 25000000000 },     // $25.00
      { market: 'Copper', price: 4500000000 },      // $4.50
      { market: 'NatGas', price: 3000000000 },  // $3.00
    ];

    for (const { market, price } of exclusivePrices) {
      const command = `stellar contract invoke --id ${this.contractId} --source-account ${this.adminKey} --network ${this.network} -- update_exclusive_price --market ${market} --price ${price}`;
      await this.runCommand(command);
      await new Promise(resolve => setTimeout(resolve, 1000)); // Wait 1 second between calls
    }
  }

  async verifySetup() {
    console.log('\n🔍 Verificando configuração...');
    
    // Test crypto prices
    const cryptoAssets = ['BTC', 'ETH', 'XLM', 'SOL', 'USDC'];
    for (const asset of cryptoAssets) {
      const command = `stellar contract invoke --id ${this.contractId} --source-account ${this.adminKey} --network ${this.network} -- get_asset_price --asset ${asset}`;
      await this.runCommand(command);
    }

    // Test spread price
    const command = `stellar contract invoke --id ${this.contractId} --source-account ${this.adminKey} --network ${this.network} -- get_spread_price --market1 WTI --market2 Brent`;
    await this.runCommand(command);
  }

  async run() {
    console.log('🚀 Iniciando configuração de dados dummy...');
    console.log(`📋 Contrato: ${this.contractId}`);
    console.log(`🔑 Admin: ${this.adminKey}`);
    console.log(`🌐 Network: ${this.network}\n`);

    try {
      await this.setupCryptoPrices();
      await this.setupExclusiveMarkets();
      await this.setupExclusivePrices();
      await this.verifySetup();
      
      console.log('\n🎉 Configuração concluída com sucesso!');
      console.log('\n📊 Dados configurados:');
      console.log('🪙 Crypto: BTC ($50k), ETH ($3k), XLM ($0.10), SOL ($200), USDC ($1)');
      console.log('🛢️ Commodities: WTI ($63), Brent ($67), Gold ($2k), Silver ($25), Copper ($4.50), NaturalGas ($3)');
      console.log('\n✅ Sistema pronto para trading!');
      
    } catch (error) {
      console.error('❌ Erro durante configuração:', error);
    }
  }
}

// Executar se chamado diretamente
if (require.main === module) {
  const setup = new DummyDataSetup();
  setup.run();
}

module.exports = DummyDataSetup;
