// Quick test for CommandParser
const { CommandParser } = require('./lib/components/CommandParser');

console.log('Testing "hi how are you":', JSON.stringify(CommandParser.parse('hi how are you'), null, 2));
console.log('Testing "@hi how are you":', JSON.stringify(CommandParser.parse('@hi how are you'), null, 2));
console.log('Testing "@split hi how are you":', JSON.stringify(CommandParser.parse('@split hi how are you'), null, 2));
console.log('Testing "@split @john hi 50":', JSON.stringify(CommandParser.parse('@split @john hi 50'), null, 2));