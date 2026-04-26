const mongoose = require('mongoose');
async function test() {
  try {
    await mongoose.connect('mongodb://localhost:27017/test');
    console.log('Connected');
  } catch (e) {
    console.log('Error', e.message);
  } finally {
    await mongoose.disconnect();
  }
}
test();
