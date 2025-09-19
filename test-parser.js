const { CommandParser } = require('./lib/components/CommandParser.ts');

// Test cases
const testCases = [
  '@split Dinner ₹120',
  '@split Lunch $50 @alice',
  '@split Coffee 30',
  '@addexpense Coffee ₹25 category:Food',
  '@addexpense Taxi $15',
  '@addexpense Movie 200 category:Entertainment'
];

console.log('Testing CommandParser:');
testCases.forEach((test, index) => {
  console.log(`Test ${index + 1}: ${test}`);
  try {
    const result = CommandParser.parse(test);
    console.log('Result:', JSON.stringify(result, null, 2));
  } catch (error) {
    console.log('Error:', error.message);
  }
});