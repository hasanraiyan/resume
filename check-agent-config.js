const mongoose = require('mongoose');
const dotenv = require('dotenv');
dotenv.config();

async function main() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    const collection = mongoose.connection.collection('agentconfigs');
    const configs = await collection.find({ agentId: 'image_analyzer' }).toArray();
    console.log('Configs found:', JSON.stringify(configs, null, 2));
  } catch (e) {
    console.error('Error:', e);
  } finally {
    await mongoose.disconnect();
  }
}
main();
