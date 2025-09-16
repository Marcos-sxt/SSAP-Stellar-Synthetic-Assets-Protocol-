const ReflectorService = require('./services/ReflectorService');
const MultiFeedOracleService = require('./services/MultiFeedOracleService');

async function testReflector() {
  console.log('🚀 Testing Reflector Integration...\n');
  
  const reflector = new ReflectorService();
  const multiFeed = new MultiFeedOracleService();
  
  try {
    // Test 1: Basic connection
    console.log('📡 Test 1: Testing Reflector connection...');
    const isConnected = await reflector.testConnection();
    console.log(`Connection status: ${isConnected ? '✅ SUCCESS' : '❌ FAILED'}\n`);
    
    if (!isConnected) {
      console.log('❌ Reflector connection failed. Stopping tests.');
      return;
    }
    
    // Test 2: Get individual prices
    console.log('💰 Test 2: Getting individual prices...');
    const assets = ['XLM', 'ETH', 'SOL'];
    
    for (const asset of assets) {
      try {
        const price = await reflector.getPrice(asset);
        console.log(`${asset}: $${price.price.toFixed(6)} (source: ${price.source})`);
      } catch (error) {
        console.error(`❌ Failed to get ${asset} price:`, error.message);
      }
    }
    console.log('');
    
    // Test 3: Get multiple prices
    console.log('📊 Test 3: Getting multiple prices...');
    try {
      const prices = await reflector.getMultiplePrices(assets);
      console.log(`Retrieved ${prices.length} prices:`);
      prices.forEach(price => {
        console.log(`  ${price.symbol}: $${price.price.toFixed(6)} (${price.source})`);
      });
    } catch (error) {
      console.error('❌ Failed to get multiple prices:', error.message);
    }
    console.log('');
    
    // Test 4: Multi-feed service (crypto only)
    console.log('🔄 Test 4: Testing Multi-Feed service (crypto)...');
    try {
      const xlmPrice = await multiFeed.getCryptoPrice('XLM');
      console.log(`XLM via Multi-Feed: $${xlmPrice.price.toFixed(6)} (${xlmPrice.source})`);
      
      const ethPrice = await multiFeed.getCryptoPrice('ETH');
      console.log(`ETH via Multi-Feed: $${ethPrice.price.toFixed(6)} (${ethPrice.source})`);
    } catch (error) {
      console.error('❌ Multi-Feed test failed:', error.message);
    }
    console.log('');
    
    // Test 5: Feed status
    console.log('📈 Test 5: Feed status...');
    const feedStatus = multiFeed.getFeedStatus();
    Object.entries(feedStatus).forEach(([feed, status]) => {
      console.log(`${feed.toUpperCase()}: ${status.available ? '✅' : '❌'} (${status.description})`);
    });
    console.log('');
    
    // Test 6: Test all feeds
    console.log('🔍 Test 6: Testing all feeds...');
    const feedResults = await multiFeed.testAllFeeds();
    Object.entries(feedResults).forEach(([feed, status]) => {
      console.log(`${feed.toUpperCase()}: ${status ? '✅' : '❌'}`);
    });
    
    console.log('\n🎉 Reflector integration test completed!');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

// Run the test
testReflector().catch(console.error);
