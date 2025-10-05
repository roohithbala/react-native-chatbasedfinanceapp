const mongoose = require('mongoose');
const reminderService = require('./utils/reminderService');
require('dotenv').config({ path: './.env' });

async function processReminders() {
  try {
    console.log('🔄 Starting reminder processing job...');

    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/securefinance', {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    console.log('✅ Connected to MongoDB');

    // Process due reminders
    const result = await reminderService.processDueReminders();

    console.log(`✅ Processed ${result.processed} split bills with due reminders`);

    // Close connection
    await mongoose.connection.close();
    console.log('✅ Database connection closed');

  } catch (error) {
    console.error('❌ Error processing reminders:', error);
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  processReminders();
}

module.exports = { processReminders };