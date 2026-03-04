const mongoose = require('mongoose');
const dotenv = require('dotenv');
dotenv.config();

async function main() {
  await mongoose.connect(process.env.MONGODB_URI);
  const ProviderSettings = mongoose.model(
    'ProviderSettings',
    new mongoose.Schema({ providerId: String, name: String })
  );
  const providers = await ProviderSettings.find({});
  console.log('Available providers:', JSON.stringify(providers, null, 2));
  await mongoose.disconnect();
}
main();
