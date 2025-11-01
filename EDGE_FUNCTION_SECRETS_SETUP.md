# Edge Function Secrets Setup

## ⚠️ IMPORTANT: Set These Secrets

Your Edge Functions need these environment variables to work:

### Required Secrets:

1. **OPENAI_API_KEY** - For generating prompts
2. **BACKEND_URL** - Your backend server URL
3. **SUPABASE_SERVICE_ROLE_KEY** - Auto-set by Supabase

---

## 🔧 How to Set Secrets

### Option 1: Via Supabase Dashboard (Recommended)

1. Go to https://supabase.com/dashboard/project/khtffpkhiocchuaxuaij/settings/functions
2. Click on each Edge Function
3. Go to "Secrets" tab
4. Add the following:

**For Both Functions:**
- `OPENAI_API_KEY` = Your OpenAI API key
- `BACKEND_URL` = `http://localhost:8787` (for local testing) or your production URL

### Option 2: Via Supabase CLI

```bash
# Navigate to project
cd /Users/maxhenkes/Desktop/Crashout

# Create secrets file
cat > .env.supabase << 'SECRETS'
OPENAI_API_KEY=your_openai_key_here
BACKEND_URL=http://localhost:8787
SECRETS

# Deploy secrets (requires Supabase CLI)
supabase secrets set --env-file .env.supabase --project-ref khtffpkhiocchuaxuaij
```

### Option 3: Individual Secret Setting

```bash
supabase secrets set OPENAI_API_KEY=your_key --project-ref khtffpkhiocchuaxuaij
supabase secrets set BACKEND_URL=http://localhost:8787 --project-ref khtffpkhiocchuaxuaij
```

---

## ✅ Verify Secrets Are Set

After setting secrets, redeploy the Edge Functions or wait for them to restart automatically.

Test with:
```bash
curl -X POST https://khtffpkhiocchuaxuaij.supabase.co/functions/v1/generate-daily-challenge \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtodGZmcGtoaW9jY2h1YXh1YWlqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjE5NDUxNTIsImV4cCI6MjA3NzUyMTE1Mn0.9LZvFX0kTHCTqj_YDoz5gRR9lOrHyZjDD05H7ndhqkM" \
  -H "Content-Type: application/json" \
  -d '{}'
```

---

## 📝 Current Status

- ✅ Edge Functions deployed
- ⚠️ Secrets need to be set manually
- ✅ Database ready
- ✅ Cron scheduled
- ✅ Frontend ready

**Once secrets are set, the system will be fully operational.**
