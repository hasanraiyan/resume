const mongoose = require('mongoose');
const dotenv = require('dotenv');
dotenv.config();

async function main() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    const collection = mongoose.connection.collection('providersettings');
    const providers = await collection.find({}).toArray();
    console.log('Providers found:', JSON.stringify(providers, null, 2));
  } catch (e) {
    console.error('Error:', e);
  } finally {
    await mongoose.disconnect();
  }
}
main();
