import dbConnect from './src/lib/dbConnect.js';
import ChatbotSettings from './src/models/ChatbotSettings.js';
import mongoose from 'mongoose';

async function checkSettings() {
  try {
    await dbConnect();
    const settings = await ChatbotSettings.findOne({});
    console.log('Current Chatbot Settings:', JSON.stringify(settings, null, 2));

    // Force isActive to true if it was false
    if (settings && !settings.isActive) {
      console.log('Forcing isActive to true...');
      settings.isActive = true;
      await settings.save();
      console.log('Saved successfully.');
    }

    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

checkSettings();
