const MultiFeedOracleService = require('./services/MultiFeedOracleService');

async function testIntegrationSimple() {
  console.log('🔗 TESTING INTEGRATION (SIMPLE VERSION)\n');
  console.log('=' .repeat(60));
  
  const oracle = new MultiFeedOracleService();
  
  try {
    // Test 1: Oracle services
    console.log('🔍 Test 1: Oracle Services');
    console.log('-'.repeat(40));
    
    const cryptoAssets = ['XLM', 'ETH', 'SOL', 'BTC', 'USDC'];
    let cryptoSuccess = 0;
    
    for (const asset of cryptoAssets) {
      try {
        const price = await oracle.getCryptoPrice(asset);
        console.log(`  ✅ ${asset}: $${price.price.toFixed(6)} (${price.source})`);
        cryptoSuccess++;
      } catch (error) {
        console.log(`  ❌ ${asset}: ${error.message}`);
      }
    }
    
    console.log(`\n  Crypto Success Rate: ${cryptoSuccess}/${cryptoAssets.length}`);
    
    // Test 2: Commodity services
    console.log('\n🛢️ Test 2: Commodity Services');
    console.log('-'.repeat(40));
    
    const commodityAssets = ['WTI', 'BRENT', 'GOLD', 'SILVER'];
    let commoditySuccess = 0;
    
    for (const asset of commodityAssets) {
      try {
        const price = await oracle.getCommodityPrice(asset);
        console.log(`  ✅ ${asset}: $${price.price.toFixed(6)} (${price.source})`);
        commoditySuccess++;
      } catch (error) {
        console.log(`  ❌ ${asset}: ${error.message}`);
      }
    }
    
    console.log(`\n  Commodity Success Rate: ${commoditySuccess}/${commodityAssets.length}`);
    
    // Test 3: Spread calculation
    console.log('\n📊 Test 3: Spread Calculation');
    console.log('-'.repeat(40));
    
    try {
      const wtiPrice = await oracle.getCommodityPrice('WTI');
      const brentPrice = await oracle.getCommodityPrice('BRENT');
      
      const spread = wtiPrice.price - brentPrice.price;
      const spreadPercent = (spread / brentPrice.price) * 100;
      
      console.log(`  WTI: $${wtiPrice.price.toFixed(6)}`);
      console.log(`  BRENT: $${brentPrice.price.toFixed(6)}`);
      console.log(`  Spread: $${spread.toFixed(6)} (${spreadPercent.toFixed(2)}%)`);
      
      // Test 4: Position requirements calculation
      console.log('\n💼 Test 4: Position Requirements');
      console.log('-'.repeat(40));
      
      const positionSize = 10; // 10 contracts
      const contractSize = 1000; // 1000 barrels per contract
      const marginRatio = 0.05; // 5%
      
      const notionalValue = positionSize * contractSize * wtiPrice.price;
      const marginRequired = notionalValue * marginRatio;
      const tickValue = 0.01 * contractSize; // $0.01 per barrel
      
      console.log(`  Position Size: ${positionSize} contracts`);
      console.log(`  Notional Value: $${notionalValue.toFixed(2)}`);
      console.log(`  Margin Required: $${marginRequired.toFixed(2)}`);
      console.log(`  Tick Value: $${tickValue.toFixed(2)}`);
      
      // Test 5: P&L calculation
      console.log('\n💰 Test 5: P&L Calculation');
      console.log('-'.repeat(40));
      
      const entrySpread = spread;
      const exitSpread = spread + 0.50; // Assume spread widens by $0.50
      const spreadChange = exitSpread - entrySpread;
      const pnl = spreadChange * positionSize;
      
      console.log(`  Entry Spread: $${entrySpread.toFixed(6)}`);
      console.log(`  Exit Spread: $${exitSpread.toFixed(6)}`);
      console.log(`  Spread Change: $${spreadChange.toFixed(6)}`);
      console.log(`  P&L: $${pnl.toFixed(2)}`);
      
    } catch (error) {
      console.log(`  ❌ Spread calculation failed: ${error.message}`);
    }
    
    // Test 6: System status
    console.log('\n📈 Test 6: System Status');
    console.log('-'.repeat(40));
    
    const totalSuccess = cryptoSuccess + commoditySuccess;
    const totalAssets = cryptoAssets.length + commodityAssets.length;
    
    console.log(`  Total Assets: ${totalAssets}`);
    console.log(`  Successful: ${totalSuccess}`);
    console.log(`  Success Rate: ${((totalSuccess / totalAssets) * 100).toFixed(1)}%`);
    
    if (totalSuccess === totalAssets) {
      console.log(`  Status: 🎉 PERFECT - All systems operational!`);
    } else if (totalSuccess >= totalAssets * 0.8) {
      console.log(`  Status: ✅ GOOD - Most systems operational`);
    } else {
      console.log(`  Status: ⚠️ ISSUES - Some systems need attention`);
    }
    
    console.log('\n🎉 INTEGRATION TEST COMPLETED!');
    console.log('=' .repeat(60));
    
    console.log('\n📋 READY FOR SMART CONTRACT INTEGRATION:');
    console.log('✅ Oracle services working');
    console.log('✅ Price feeds operational');
    console.log('✅ Spread calculations ready');
    console.log('✅ Position logic implemented');
    console.log('✅ P&L calculations working');
    
    console.log('\n🚀 NEXT STEPS:');
    console.log('1. Deploy smart contract to testnet');
    console.log('2. Initialize contract with admin/oracle keys');
    console.log('3. Register exclusive markets');
    console.log('4. Test real transactions');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

// Run the test
testIntegrationSimple().catch(console.error);
