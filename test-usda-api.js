import dotenv from 'dotenv';
import axios from 'axios';

dotenv.config();

async function testUSDAAPI() {
  console.log('🧪 Testing USDA API connection...');
  console.log(`API Key: ${process.env.USDA_API_KEY?.slice(0, 8)}...`);
  
  try {
    const response = await axios.post('https://api.nal.usda.gov/fdc/v1/foods/search', {
      query: 'banana',
      pageSize: 5,
      pageNumber: 1
    }, {
      params: {
        api_key: process.env.USDA_API_KEY
      },
      headers: {
        'Content-Type': 'application/json'
      }
    });

    console.log('✅ USDA API connection successful!');
    console.log(`📊 Found ${response.data.totalHits} total foods matching "banana"`);
    console.log('🍌 First few results:');
    
    response.data.foods.slice(0, 3).forEach((food, index) => {
      console.log(`   ${index + 1}. ${food.description}`);
      console.log(`      Data Type: ${food.dataType}`);
      console.log(`      FDC ID: ${food.fdcId}`);
    });
    
    return true;
  } catch (error) {
    console.error('❌ USDA API test failed:');
    if (error.response) {
      console.error(`   Status: ${error.response.status}`);
      console.error(`   Message: ${error.response.data?.message || error.response.statusText}`);
    } else {
      console.error(`   Error: ${error.message}`);
    }
    return false;
  }
}

testUSDAAPI().then(success => {
  if (success) {
    console.log('\n🚀 Ready to run food database seeding!');
    console.log('   Next: npm run seed:food:dry-run');
  } else {
    console.log('\n🔧 Please fix API connection before proceeding');
  }
  process.exit(success ? 0 : 1);
});