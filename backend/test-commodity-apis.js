const CommodityAPIService = require('./services/CommodityAPIService');
const MultiFeedOracleService = require('./services/MultiFeedOracleService');

async function testCommodityAPIs() {
  console.log('🛢️ Testing Commodity APIs Integration...\n');
  
  const commodityAPI = new CommodityAPIService();
  const multiFeed = new MultiFeedOracleService();
  
  try {
    // Test 1: Basic connection
    console.log('📡 Test 1: Testing Commodity APIs connection...');
    const isConnected = await commodityAPI.testConnection();
    console.log(`Connection status: ${isConnected ? '✅ SUCCESS' : '❌ FAILED'}\n`);
    
    if (!isConnected) {
      console.log('❌ Commodity APIs connection failed. Stopping tests.');
      return;
    }
    
    // Test 2: Get individual commodity prices
    console.log('💰 Test 2: Getting individual commodity prices...');
    const commodities = ['WTI', 'GOLD', 'SILVER', 'NATGAS'];
    
    for (const commodity of commodities) {
      try {
        const price = await commodityAPI.getPrice(commodity);
        console.log(`${commodity}: $${price.price.toFixed(6)} (source: ${price.source})`);
      } catch (error) {
        console.error(`❌ Failed to get ${commodity} price:`, error.message);
      }
    }
    console.log('');
    
    // Test 3: Get multiple commodity prices
    console.log('📊 Test 3: Getting multiple commodity prices...');
    try {
      const prices = await commodityAPI.getMultiplePrices(commodities);
      console.log(`Retrieved ${prices.length} prices:`);
      prices.forEach(price => {
        console.log(`  ${price.symbol}: $${price.price.toFixed(6)} (${price.source})`);
      });
    } catch (error) {
      console.error('❌ Failed to get multiple prices:', error.message);
    }
    console.log('');
    
    // Test 4: Multi-feed service (commodities)
    console.log('🔄 Test 4: Testing Multi-Feed service (commodities)...');
    try {
      const wtiPrice = await multiFeed.getCommodityPrice('WTI');
      console.log(`WTI via Multi-Feed: $${wtiPrice.price.toFixed(6)} (${wtiPrice.source})`);
      
      const goldPrice = await multiFeed.getCommodityPrice('GOLD');
      console.log(`GOLD via Multi-Feed: $${goldPrice.price.toFixed(6)} (${goldPrice.source})`);
    } catch (error) {
      console.error('❌ Multi-Feed commodity test failed:', error.message);
    }
    console.log('');
    
    // Test 5: Mixed assets (crypto + commodities)
    console.log('🔄 Test 5: Testing mixed assets...');
    try {
      const xlmPrice = await multiFeed.getPrice('XLM');
      console.log(`XLM (crypto): $${xlmPrice.price.toFixed(6)} (${xlmPrice.source})`);
      
      const wtiPrice = await multiFeed.getPrice('WTI');
      console.log(`WTI (commodity): $${wtiPrice.price.toFixed(6)} (${wtiPrice.source})`);
    } catch (error) {
      console.error('❌ Mixed assets test failed:', error.message);
    }
    console.log('');
    
    // Test 6: Feed status
    console.log('📈 Test 6: Feed status...');
    const feedStatus = multiFeed.getFeedStatus();
    Object.entries(feedStatus).forEach(([feed, status]) => {
      console.log(`${feed.toUpperCase()}: ${status.available ? '✅' : '❌'} (${status.description})`);
    });
    console.log('');
    
    // Test 7: Test all feeds
    console.log('🔍 Test 7: Testing all feeds...');
    const feedResults = await multiFeed.testAllFeeds();
    Object.entries(feedResults).forEach(([feed, status]) => {
      console.log(`${feed.toUpperCase()}: ${status ? '✅' : '❌'}`);
    });
    console.log('');
    
    // Test 8: Cache status
    console.log('💾 Test 8: Cache status...');
    const cacheStatus = commodityAPI.getCacheStatus();
    console.log(`Cache size: ${cacheStatus.size}`);
    console.log(`Cached keys: ${cacheStatus.keys.join(', ')}`);
    console.log(`Max age: ${cacheStatus.maxAge}ms`);
    
    console.log('\n🎉 Commodity APIs integration test completed!');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

// Run the test
testCommodityAPIs().catch(console.error);
