# Edge Function Secrets - ALL API Keys Required ⚠️

## Problem Fixed

The Edge Functions now call LLM APIs **directly** instead of routing through your local backend. This means they need ALL API keys.

---

## 🔑 Required Secrets (4 API Keys)

Go to: https://supabase.com/dashboard/project/khtffpkhiocchuaxuaij/functions

### For BOTH Edge Functions:

1. Click `generate-daily-challenge`
2. Go to "Secrets" tab
3. Add these secrets:

```
OPENAI_API_KEY = (your OpenAI key)
ANTHROPIC_API_KEY = (your Anthropic key)  
GOOGLE_API_KEY = (your Google key)
GROQ_API_KEY = (your Groq key)
```

4. Repeat for `evaluate-models` function

---

## 📋 Get Your API Keys

Run these commands to get your keys:

```bash
cd /Users/maxhenkes/Desktop/Crashout

echo "OPENAI_API_KEY:"
grep VITE_OPENAI_API_KEY .env.local | cut -d '=' -f2

echo ""
echo "ANTHROPIC_API_KEY:"
grep VITE_ANTHROPIC_API_KEY .env.local | cut -d '=' -f2

echo ""
echo "GOOGLE_API_KEY:"
grep VITE_GOOGLE_API_KEY .env.local | cut -d '=' -f2

echo ""
echo "GROQ_API_KEY:"
grep VITE_GROQ_API_KEY .env.local | cut -d '=' -f2
```

---

## ✅ After Setting Secrets

1. Wait ~30 seconds for functions to restart
2. Visit: http://localhost:5174/testing
3. Click "Generate New Challenge"
4. Navigate to: http://localhost:5174/daily
5. Watch 8 models complete successfully! 🎉

---

## 🔍 Why This Changed

**Before:** Edge Function → Your local backend → LLM APIs  
**Problem:** Edge Functions can't access localhost on your machine

**After:** Edge Function → LLM APIs directly  
**Solution:** Direct API calls from Supabase cloud

---

## 📝 Secrets Needed Per Function

### generate-daily-challenge:
- ✅ OPENAI_API_KEY (for prompt generation)

### evaluate-models:
- ✅ OPENAI_API_KEY (for GPT models)
- ✅ ANTHROPIC_API_KEY (for Claude models)
- ✅ GOOGLE_API_KEY (for Gemini models)
- ✅ GROQ_API_KEY (for Groq models)

---

**Status:** Edge Functions updated and redeployed  
**Version:** evaluate-models v3 (NEW)

Set all 4 API keys and test again!
