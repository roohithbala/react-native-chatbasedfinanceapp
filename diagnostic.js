#!/usr/bin/env node

/**
 * Diagnostic Script for Insights & Media Issues
 * Run this to check the health of your setup
 */

const fs = require('fs');
const path = require('path');

console.log('🔍 Running Diagnostics...\n');

// Check if we're in the right directory
const appJsonPath = path.join(process.cwd(), 'app.json');
if (!fs.existsSync(appJsonPath)) {
  console.error('❌ Not in project root. Please cd to react-native-chatbasedfinanceapp');
  process.exit(1);
}

// 1. Check app.json for plugins
console.log('1️⃣ Checking app.json configuration...');
try {
  const appJson = JSON.parse(fs.readFileSync(appJsonPath, 'utf8'));
  const plugins = appJson.expo?.plugins || [];
  
  const hasCameraPlugin = plugins.some(p => 
    (Array.isArray(p) && p[0] === 'expo-camera') || p === 'expo-camera'
  );
  const hasAvPlugin = plugins.some(p => 
    (Array.isArray(p) && p[0] === 'expo-av') || p === 'expo-av'
  );
  
  if (hasCameraPlugin && hasAvPlugin) {
    console.log('   ✅ expo-camera plugin configured');
    console.log('   ✅ expo-av plugin configured');
  } else {
    if (!hasCameraPlugin) console.log('   ❌ expo-camera plugin missing');
    if (!hasAvPlugin) console.log('   ❌ expo-av plugin missing');
  }
} catch (error) {
  console.error('   ❌ Error reading app.json:', error.message);
}

// 2. Check if expo-camera and expo-av are installed
console.log('\n2️⃣ Checking installed packages...');
const packageJsonPath = path.join(process.cwd(), 'package.json');
try {
  const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
  const deps = { ...packageJson.dependencies, ...packageJson.devDependencies };
  
  if (deps['expo-camera']) {
    console.log(`   ✅ expo-camera@${deps['expo-camera']} installed`);
  } else {
    console.log('   ❌ expo-camera not installed - run: npx expo install expo-camera');
  }
  
  if (deps['expo-av']) {
    console.log(`   ✅ expo-av@${deps['expo-av']} installed`);
  } else {
    console.log('   ❌ expo-av not installed - run: npx expo install expo-av');
  }
  
  if (deps['react-native-chart-kit']) {
    console.log(`   ✅ react-native-chart-kit@${deps['react-native-chart-kit']} installed`);
  } else {
    console.log('   ⚠️  react-native-chart-kit not installed (for Insights charts)');
  }
} catch (error) {
  console.error('   ❌ Error reading package.json:', error.message);
}

// 3. Check if node_modules exist
console.log('\n3️⃣ Checking node_modules...');
const nodeModulesPath = path.join(process.cwd(), 'node_modules');
if (fs.existsSync(nodeModulesPath)) {
  console.log('   ✅ node_modules directory exists');
  
  // Check specific modules
  const cameraModulePath = path.join(nodeModulesPath, 'expo-camera');
  const avModulePath = path.join(nodeModulesPath, 'expo-av');
  
  if (fs.existsSync(cameraModulePath)) {
    console.log('   ✅ expo-camera module found');
  } else {
    console.log('   ❌ expo-camera module not found');
  }
  
  if (fs.existsSync(avModulePath)) {
    console.log('   ✅ expo-av module found');
  } else {
    console.log('   ❌ expo-av module not found');
  }
} else {
  console.log('   ❌ node_modules not found - run: npm install');
}

// 4. Check Insights components
console.log('\n4️⃣ Checking Insights components...');
const insightsComponents = [
  'app/components/InsightsHeader.tsx',
  'app/components/SpendingTrendChart.tsx',
  'app/components/CategoryBreakdownChart.tsx',
  'app/components/EmotionalAnalysis.tsx',
  'app/components/AIInsightsSection.tsx',
  'app/components/BudgetUtilization.tsx',
  'app/components/QuickStats.tsx',
  'app/components/PreviousMonthSpendings.tsx',
];

let missingComponents = 0;
insightsComponents.forEach(component => {
  const componentPath = path.join(process.cwd(), component);
  if (fs.existsSync(componentPath)) {
    console.log(`   ✅ ${path.basename(component)}`);
  } else {
    console.log(`   ❌ ${path.basename(component)} - MISSING`);
    missingComponents++;
  }
});

if (missingComponents === 0) {
  console.log('   ✅ All Insights components present');
}

// 5. Check hooks
console.log('\n5️⃣ Checking Insights hooks...');
const hooks = [
  'hooks/useInsightsData.ts',
  'hooks/useInsightsCalculations.ts',
];

hooks.forEach(hook => {
  const hookPath = path.join(process.cwd(), hook);
  if (fs.existsSync(hookPath)) {
    console.log(`   ✅ ${path.basename(hook)}`);
  } else {
    console.log(`   ❌ ${path.basename(hook)} - MISSING`);
  }
});

// 6. Check for .expo cache
console.log('\n6️⃣ Checking cache directories...');
const expoCachePath = path.join(process.cwd(), '.expo');
if (fs.existsSync(expoCachePath)) {
  console.log('   ⚠️  .expo cache exists (may need clearing if issues persist)');
  console.log('      Clear with: rm -rf .expo && npx expo start -c');
} else {
  console.log('   ✅ No .expo cache (clean state)');
}

// 7. Check MediaManager
console.log('\n7️⃣ Checking MediaManager...');
const mediaManagerPath = path.join(process.cwd(), 'lib/services/MediaManager.ts');
if (fs.existsSync(mediaManagerPath)) {
  console.log('   ✅ MediaManager.ts exists');
  const content = fs.readFileSync(mediaManagerPath, 'utf8');
  
  if (content.includes('requestPermissionsAsync')) {
    console.log('   ✅ Permission request code present');
  } else {
    console.log('   ⚠️  Permission request code may be missing');
  }
  
  if (content.includes('expo-camera') || content.includes('Camera')) {
    console.log('   ✅ Camera module usage found');
  }
  
  if (content.includes('expo-av') || content.includes('Audio')) {
    console.log('   ✅ Audio module usage found');
  }
} else {
  console.log('   ❌ MediaManager.ts not found');
}

// Summary
console.log('\n📊 Diagnostic Summary:');
console.log('=' .repeat(50));

console.log('\n🔧 Recommended Actions:');
console.log('1. Clear Metro cache: npx expo start -c');
console.log('2. Rebuild native: npx expo prebuild --clean');
console.log('3. Run on device: npx expo run:android');
console.log('4. Grant permissions when prompted\n');

console.log('📖 For detailed fixes, see: COMPLETE_FIX_SUMMARY.md\n');
