const axios = require('axios');

async function testRealAPIs() {
  console.log('🔍 Testing Real Commodity APIs...\n');
  
  // Test 1: Oil Price API (sem chave - ver se tem endpoint público)
  console.log('🛢️ Test 1: Oil Price API (public endpoint)');
  try {
    const response = await axios.get('https://api.oilpriceapi.com/v1/prices/latest?by_code=WTI_USD');
    console.log('✅ Oil Price API response:', response.data);
  } catch (error) {
    console.log('❌ Oil Price API failed:', error.response?.status, error.message);
  }
  console.log('');

  // Test 2: MetalpriceAPI (sem chave - ver se tem endpoint público)
  console.log('🥇 Test 2: MetalpriceAPI (public endpoint)');
  try {
    const response = await axios.get('https://metalpriceapi.com/api/XAU/USD');
    console.log('✅ MetalpriceAPI response:', response.data);
  } catch (error) {
    console.log('❌ MetalpriceAPI failed:', error.response?.status, error.message);
  }
  console.log('');

  // Test 3: API Ninjas (sem chave - ver se tem endpoint público)
  console.log('🔧 Test 3: API Ninjas (public endpoint)');
  try {
    const response = await axios.get('https://api.api-ninjas.com/v1/commodity?name=gold');
    console.log('✅ API Ninjas response:', response.data);
  } catch (error) {
    console.log('❌ API Ninjas failed:', error.response?.status, error.message);
  }
  console.log('');

  // Test 4: Alternativas gratuitas
  console.log('🌐 Test 4: Alternative free APIs');
  
  // Test Alpha Vantage (tem endpoint gratuito limitado)
  try {
    const response = await axios.get('https://www.alphavantage.co/query?function=GLOBAL_QUOTE&symbol=GC=F&apikey=demo');
    console.log('✅ Alpha Vantage response:', response.data);
  } catch (error) {
    console.log('❌ Alpha Vantage failed:', error.response?.status, error.message);
  }

  // Test Yahoo Finance (não oficial, mas pode funcionar)
  try {
    const response = await axios.get('https://query1.finance.yahoo.com/v8/finance/chart/GC=F');
    console.log('✅ Yahoo Finance response:', response.data);
  } catch (error) {
    console.log('❌ Yahoo Finance failed:', error.response?.status, error.message);
  }
}

testRealAPIs().catch(console.error);
