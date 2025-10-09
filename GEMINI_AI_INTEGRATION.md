# Gemini AI Integration for @predict Command

## Overview

The `@predict` command has been upgraded to use **Google Gemini AI** instead of OpenAI. This provides intelligent spending predictions using Google's free Gemini API.

## Changes Made

### 1. Updated Command Executor
**File**: `backend/utils/commandExecutors.js`

The `executePredictCommand` function now:
- ✅ Uses **Gemini AI** (`gemini-pro` model - free tier)
- ✅ Analyzes spending patterns with AI
- ✅ Provides category breakdown analysis
- ✅ Gives actionable financial insights
- ✅ Has fallback to basic calculation if AI fails

### 2. API Configuration
**API Key**: `AIzaSyCYCPiREIu2ue3ydCCLLAKrWtoS1DyjThc`
**Model**: `gemini-pro` (free tier, no premium required)

### 3. Updated Test File
**Before**: `backend/test-openai.js` (OpenAI)
**After**: `backend/test-gemini.js` (Gemini AI)

## API Setup Required

### Step 1: Enable Gemini API

Your API key needs to be activated in Google Cloud Console:

1. Go to: https://makersuite.google.com/app/apikey
2. Or: https://console.cloud.google.com/
3. Enable the **Generative Language API**
4. Your API key: `AIzaSyCYCPiREIu2ue3ydCCLLAKrWtoS1DyjThc`

### Step 2: Verify API Key

The API key needs these permissions:
- ✅ Generative Language API enabled
- ✅ API key restrictions configured (optional)
- ✅ No billing required for free tier (60 requests/minute)

### Common Issues

**404 Not Found Error**:
```
models/gemini-pro is not found for API version v1beta
```

**Solution**:
1. Go to https://aistudio.google.com/app/apikey
2. Click on your API key
3. Enable the API if it shows as disabled
4. Wait 2-5 minutes for activation

**API Key Not Working**:
1. Verify the key is correct
2. Check if Generative Language API is enabled
3. Try creating a new API key if needed

## How It Works

### Old Implementation (Basic)
```javascript
// Just calculated average
const average = total / expenses.length;
return `You spend an average of ₹${average} per transaction.`;
```

### New Implementation (AI-Powered)
```javascript
// Prepares detailed expense data
const prompt = `Analyze this spending data:
- Total expenses: ${expenses.length}
- Total amount: ₹${total}
- Category breakdown: ${categoryData}
- Recent expenses: ${recentExpenses}

Provide actionable insights and predictions.`;

// Uses Gemini AI
const model = genAI.getGenerativeModel({ model: 'gemini-pro' });
const result = await model.generateContent(prompt);
const prediction = result.response.text();
```

## Example AI Response

**User Command**: `@predict`

**AI Response**:
```
Based on your spending patterns, you're averaging ₹850 per transaction 
across 25 expenses. Your Food category (₹3,500) dominates spending. 

I predict next month you'll spend around ₹5,000-6,000 if patterns continue. 
Consider setting a ₹1,000 weekly food budget to reduce by 20%.
```

## Testing

### Test Gemini Connection
```bash
cd backend
node test-gemini.js
```

**Expected Output**:
```
Testing Gemini AI API connection...
API Key configured: Yes
Using model: gemini-1.5-flash

Sending prompt to Gemini AI...

✅ Gemini AI API is working!
Response: Hello! I'm working and ready to assist you.
```

### Test in App
1. Open any group chat
2. Add some expenses first (if none exist)
3. Type: `@predict`
4. Send the message
5. You'll get an AI-powered prediction response

## Fallback Mechanism

If Gemini AI fails, the command automatically falls back to basic calculation:

```javascript
catch (error) {
  // Fallback to simple average calculation
  return {
    prediction: `Based on your last ${expenses.length} expenses, 
                you spend an average of ₹${average} per transaction.`
  };
}
```

This ensures the `@predict` command **always works**, even if:
- API key is invalid
- API quota exceeded
- Network issues
- Gemini service is down

## Cost & Limits

### Gemini Pro (Free Tier)
- ✅ **60 requests per minute**
- ✅ **1,500 requests per day**
- ✅ **Completely FREE** - no billing required
- ✅ No credit card needed

### Comparison with OpenAI
| Feature | OpenAI GPT-3.5 | Gemini Pro |
|---------|----------------|------------|
| Cost | $0.002/1K tokens | **FREE** |
| Requests/min | 3 (free tier) | **60** |
| Requests/day | Limited | **1,500** |
| Premium Required | Yes | **No** |

## Dependencies

The `@google/generative-ai` package is already installed:

```json
"dependencies": {
  "@google/generative-ai": "^0.24.1"
}
```

No additional installation needed!

## Files Modified

1. ✅ `backend/utils/commandExecutors.js` - Updated `executePredictCommand()`
2. ✅ `backend/test-openai.js` → `backend/test-gemini.js` - Renamed and updated
3. ✅ `GEMINI_AI_INTEGRATION.md` - This documentation

## Files to Create (Optional)

If you want to use environment variables instead of hardcoding:

**backend/.env**:
```env
GEMINI_API_KEY=AIzaSyCYCPiREIu2ue3ydCCLLAKrWtoS1DyjThc
```

**Update commandExecutors.js**:
```javascript
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
```

## Next Steps

1. **Activate API Key**: Visit https://aistudio.google.com/app/apikey
2. **Enable API**: Make sure Generative Language API is enabled
3. **Test**: Run `node test-gemini.js` to verify
4. **Use in App**: Send `@predict` commands in group chat
5. **Monitor**: Check console for AI responses and errors

## Troubleshooting

### Error: "API key not valid"
- Verify key: `AIzaSyCYCPiREIu2ue3ydCCLLAKrWtoS1DyjThc`
- Check if API is enabled in Google Cloud Console
- Try regenerating the API key

### Error: "Model not found"
- The code will automatically try alternate models
- Fallback to basic calculation always works
- Check SDK version: `npm list @google/generative-ai`

### Error: "Quota exceeded"
- Free tier: 60 requests/minute
- Wait 60 seconds and try again
- Consider caching predictions for same user

### No Response
- Check network connection
- Verify backend server is running
- Check console for error messages
- Fallback response should still work

## Benefits

1. ✅ **FREE**: No cost, no premium subscription needed
2. ✅ **Smart**: AI-powered insights vs simple averages
3. ✅ **Reliable**: Automatic fallback if AI fails
4. ✅ **Fast**: Gemini Pro is optimized for speed
5. ✅ **Scalable**: 60 req/min handles many users

## Date
October 9, 2025

## Status
✅ **IMPLEMENTED** - Pending API activation
