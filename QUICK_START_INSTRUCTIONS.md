# Quick Start Instructions - AutoBench Daily Challenges 🚀

## ✅ System Status: FULLY BUILT

Everything is ready! Follow these 3 simple steps:

---

## 📝 Step 1: Set Edge Function Secrets (5 minutes)

### Go to Supabase Dashboard:
https://supabase.com/dashboard/project/khtffpkhiocchuaxuaij/functions

### For BOTH Edge Functions:
1. Click `generate-daily-challenge`
2. Click "Secrets" tab
3. Add these secrets:
   - **OPENAI_API_KEY**: (Get from your .env.local file)
   - **BACKEND_URL**: `http://localhost:8787`

4. Repeat for `evaluate-models` function

### Get Your OpenAI Key:
```bash
grep VITE_OPENAI_API_KEY /Users/maxhenkes/Desktop/Crashout/.env.local
```

---

## 🚀 Step 2: Start Servers

```bash
cd /Users/maxhenkes/Desktop/Crashout

# Option 1: Both at once (recommended)
npm run dev:all

# Option 2: Separate terminals
# Terminal 1:
npm run dev:server

# Terminal 2:
npm run dev
```

**Frontend will be at:** http://localhost:5174/

---

## 🧪 Step 3: Test It!

### 3a. Trigger First Challenge

1. Visit: http://localhost:5174/testing
2. Click "🚀 Generate New Challenge"
3. Wait ~5 seconds for success message

### 3b. View Daily Challenge

1. Navigate to: http://localhost:5174/daily
2. Watch models complete in real-time (30-90 seconds)
3. See live code previews appear
4. Vote on your favorites!

---

## 🎯 URLs

- **Model Comparison:** http://localhost:5174/ (original tool)
- **Daily Challenges:** http://localhost:5174/daily (NEW)
- **Testing Dashboard:** http://localhost:5174/testing (NEW)

---

## 🎉 That's It!

Your system is now:
- ✅ Fully automated (runs daily at 2pm Berlin time)
- ✅ Voting enabled
- ✅ Real-time updates
- ✅ 8 models competing
- ✅ Ready for production

---

## 🔍 Troubleshooting

### If models don't respond:
- Check that backend server is running on port 8787
- Check Edge Function secrets are set correctly
- View logs: https://supabase.com/dashboard/project/khtffpkhiocchuaxuaij/functions

### If page doesn't load:
- Check frontend is running on http://localhost:5174/
- Check browser console for errors
- Verify Supabase credentials in .env.local

### If votes don't work:
- Check browser console
- Verify RLS policies are enabled
- Check Supabase logs

---

**Need help?** Check `COMPLETE_SYSTEM_GUIDE.md` for detailed documentation.
