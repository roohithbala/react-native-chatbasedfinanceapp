// Test file to validate CommandParser behavior
const { CommandParser } = require('./lib/components/CommandParser');

// Test cases that should NOT be parsed as commands
const normalMessages = [
  "Hello world",
  "How are you?",
  "Let's go to dinner",
  "I think @split is cool",
  "@split",
  "@split something",
  "@split @user",
  "@split @user description",
  "@split @user 123", // description is just a number
  "@split @user the 50", // description is meaningless
  "@split @user a 50", // description is meaningless
  "@split @user an 50", // description is meaningless
  "@split @user @something 50", // description starts with @
  "@split @user split 50", // description contains 'split'
  "@split @user expense 50", // description contains 'expense'
  "@addexpense",
  "@addexpense something",
  "@addexpense coffee",
  "@addexpense coffee abc", // invalid amount
  "@addexpense the 50", // meaningless description
  "@addexpense a 50", // meaningless description
  "@addexpense @user coffee 50", // description starts with @
  "I want to split the bill",
  "Let's split dinner @ 8pm",
  "The movie was great @john",
  "Hey @john, how are you?",
  "@predict something extra",
  "@summary with extra text"
];

// Test cases that SHOULD be parsed as commands
const validCommands = [
  "@split @john dinner 500",
  "@split @all movie 200",
  "@split @user123 lunch 45.50",
  "@addexpense coffee 50",
  "@addexpense lunch 200 category:Food",
  "@addexpense taxi 150",
  "@predict",
  "@summary"
];

console.log('Testing CommandParser...\n');

// Test normal messages (should return 'unknown')
console.log('=== Testing Normal Messages (should be unknown) ===');
normalMessages.forEach((message, index) => {
  const result = CommandParser.parse(message);
  const status = result.type === 'unknown' ? '✅ PASS' : '❌ FAIL';
  console.log(`${index + 1}. ${status} "${message}" -> ${result.type}`);
  if (result.type !== 'unknown') {
    console.log('   Details:', result);
  }
});

console.log('\n=== Testing Valid Commands (should be parsed) ===');
validCommands.forEach((message, index) => {
  const result = CommandParser.parse(message);
  const expectedType = message.includes('@split') ? 'split' : message.includes('@addexpense') ? 'expense' : message.includes('@predict') ? 'predict' : 'summary';
  const status = result.type === expectedType ? '✅ PASS' : '❌ FAIL';
  console.log(`${index + 1}. ${status} "${message}" -> ${result.type}`);
  if (result.type === 'unknown') {
    console.log('   Should have been parsed!');
  } else {
    console.log('   Details:', result.data);
  }
});

console.log('\nTest completed!');