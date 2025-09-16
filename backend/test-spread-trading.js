const SpreadTradingService = require('./services/SpreadTradingService');

async function testSpreadTrading() {
  console.log('📈 TESTING SPREAD TRADING LOGIC\n');
  console.log('=' .repeat(60));
  
  const spreadService = new SpreadTradingService();
  
  try {
    // Test 1: Get available spreads
    console.log('🔍 Test 1: Available Spreads');
    console.log('-'.repeat(40));
    const spreads = spreadService.getAvailableSpreads();
    spreads.forEach(spread => {
      console.log(`  ${spread.name}: ${spread.description}`);
      console.log(`    Min Spread: $${spread.minSpread}, Max Spread: $${spread.maxSpread}`);
      console.log(`    Contract Size: ${spread.contractSize}, Margin: ${(spread.marginRatio * 100)}%`);
    });
    
    // Test 2: Get current spread prices
    console.log('\n💰 Test 2: Current Spread Prices');
    console.log('-'.repeat(40));
    
    for (const spread of spreads) {
      try {
        const spreadData = await spreadService.getSpreadPrice(spread.name);
        console.log(`  ${spread.name}:`);
        console.log(`    ${spreadData.leg1.asset}: $${spreadData.leg1.price.toFixed(6)} (${spreadData.leg1.source})`);
        console.log(`    ${spreadData.leg2.asset}: $${spreadData.leg2.price.toFixed(6)} (${spreadData.leg2.source})`);
        console.log(`    Spread: $${spreadData.spread.toFixed(6)} (${spreadData.spreadPercent.toFixed(2)}%)`);
        console.log('');
      } catch (error) {
        console.log(`  ❌ ${spread.name}: ${error.message}`);
      }
    }
    
    // Test 3: Calculate position requirements
    console.log('📊 Test 3: Position Requirements');
    console.log('-'.repeat(40));
    
    const testPositions = [
      { spread: 'WTI-BRENT', size: 10 },
      { spread: 'GOLD-SILVER', size: 5 }
    ];
    
    for (const test of testPositions) {
      try {
        const requirements = spreadService.calculatePositionRequirements(test.spread, test.size);
        console.log(`  ${test.spread} (Size: ${test.size}):`);
        console.log(`    Notional Value: $${requirements.notionalValue.toFixed(2)}`);
        console.log(`    Margin Required: $${requirements.marginRequired.toFixed(2)}`);
        console.log(`    Max Position Size: ${requirements.maxPositionSize}`);
        console.log(`    Tick Value: $${requirements.tickValue.toFixed(2)}`);
        console.log('');
      } catch (error) {
        console.log(`  ❌ ${test.spread}: ${error.message}`);
      }
    }
    
    // Test 4: Open and close positions
    console.log('🎯 Test 4: Position Management');
    console.log('-'.repeat(40));
    
    const traderId = 'test-trader-001';
    const testSpread = 'WTI-BRENT';
    const testSize = 5;
    const testMargin = 1000;
    
    try {
      // Open position
      console.log(`Opening ${testSpread} position...`);
      const openResult = await spreadService.openSpreadPosition(traderId, testSpread, testSize, testMargin);
      console.log(`  ✅ Position opened: ID ${openResult.positionId}`);
      console.log(`  Entry Spread: $${openResult.position.entrySpread.toFixed(6)}`);
      console.log(`  Margin: $${openResult.position.margin}`);
      
      // Check position status
      console.log('\nChecking position status...');
      const status = await spreadService.getPositionStatus(openResult.positionId);
      console.log(`  Current Spread: $${status.currentSpread.toFixed(6)}`);
      console.log(`  Unrealized P&L: $${status.unrealizedPnl.toFixed(2)}`);
      
      // Wait a moment (simulate time passing)
      console.log('\nWaiting 2 seconds...');
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Check status again
      const status2 = await spreadService.getPositionStatus(openResult.positionId);
      console.log(`  Updated Spread: $${status2.currentSpread.toFixed(6)}`);
      console.log(`  Updated P&L: $${status2.unrealizedPnl.toFixed(2)}`);
      
      // Close position
      console.log('\nClosing position...');
      const closeResult = await spreadService.closeSpreadPosition(openResult.positionId);
      console.log(`  ✅ Position closed`);
      console.log(`  Exit Spread: $${closeResult.position.exitSpread.toFixed(6)}`);
      console.log(`  P&L: $${closeResult.pnl.toFixed(2)}`);
      console.log(`  Total Return: $${closeResult.totalReturn.toFixed(2)}`);
      console.log(`  Return %: ${closeResult.returnPercent.toFixed(2)}%`);
      
    } catch (error) {
      console.log(`  ❌ Position test failed: ${error.message}`);
    }
    
    // Test 5: Statistics
    console.log('\n📈 Test 5: Trading Statistics');
    console.log('-'.repeat(40));
    const stats = spreadService.getStatistics();
    console.log(`  Total Positions: ${stats.totalPositions}`);
    console.log(`  Open Positions: ${stats.openPositions}`);
    console.log(`  Closed Positions: ${stats.closedPositions}`);
    console.log(`  Total P&L: $${stats.totalPnl.toFixed(2)}`);
    console.log(`  Total Volume: ${stats.totalVolume}`);
    console.log(`  Average P&L: $${stats.averagePnl.toFixed(2)}`);
    
    console.log('\n🎉 SPREAD TRADING LOGIC TEST COMPLETED!');
    console.log('=' .repeat(60));
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

// Run the test
testSpreadTrading().catch(console.error);
