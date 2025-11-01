# Daily Code Challenge Architecture with Supabase

## 🎯 System Overview

Automate daily code generation challenges: generate a prompt once per day, send it to all models being evaluated, store results for 24 hours, and display on website.

---

## 📊 Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                    SUPABASE ARCHITECTURE                         │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌──────────────┐      ┌──────────────┐      ┌──────────────┐  │
│  │  pg_cron     │─────>│ Edge Function│─────>│  Postgres DB │  │
│  │  (Scheduler) │      │  (Generator) │      │   (Storage)  │  │
│  └──────────────┘      └──────────────┘      └──────────────┘  │
│       Daily                    │                      │          │
│       Trigger                  │                      │          │
│                                v                      v          │
│                     ┌──────────────────┐   ┌──────────────┐     │
│                     │  Edge Function   │   │  REST API    │     │
│                     │  (Evaluator)     │   │  (Public)    │     │
│                     └──────────────────┘   └──────────────┘     │
│                               │                      │           │
│                               v                      v           │
│                        LLM API Calls          Frontend Query     │
│                     (GPT, Claude, etc)        (Display)          │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘

External Flow:
1. pg_cron triggers at set time (e.g., 12:00 AM UTC)
2. Edge Function generates prompt using "prompt generator" LLM
3. Edge Function sends prompt to all evaluation models
4. Results stored in Postgres with TTL
5. Frontend queries via REST API
6. Data auto-expires after 24 hours
```

---

## 🗄️ Database Schema

### Table: `daily_challenges`
```sql
create table public.daily_challenges (
  id uuid primary key default gen_random_uuid(),
  challenge_date date not null unique,
  prompt_text text not null,
  prompt_metadata jsonb, -- stores generator model info, theme, etc.
  created_at timestamp with time zone default now(),
  expires_at timestamp with time zone not null,
  
  -- Indexes
  constraint unique_challenge_per_day unique (challenge_date)
);

-- Index for fast lookup by date
create index idx_challenges_date on public.daily_challenges(challenge_date desc);

-- Index for cleanup of expired challenges
create index idx_challenges_expires on public.daily_challenges(expires_at);
```

### Table: `model_responses`
```sql
create table public.model_responses (
  id uuid primary key default gen_random_uuid(),
  challenge_id uuid references public.daily_challenges(id) on delete cascade,
  model_id text not null, -- e.g., 'gpt-5-chat-latest', 'claude-sonnet-3-7'
  model_provider text not null, -- 'openai', 'anthropic', 'google', 'groq'
  response_code text, -- the generated code
  response_metadata jsonb, -- execution time, tokens, etc.
  status text not null default 'pending', -- 'pending', 'completed', 'failed'
  error_message text,
  created_at timestamp with time zone default now(),
  completed_at timestamp with time zone,
  
  -- Constraints
  constraint unique_model_per_challenge unique (challenge_id, model_id)
);

-- Index for fast lookup by challenge
create index idx_responses_challenge on public.model_responses(challenge_id);

-- Index for status queries
create index idx_responses_status on public.model_responses(status);
```

---

## 🔄 Implementation Steps

### Step 1: Enable Required Extensions

```sql
-- Enable pg_cron for scheduling
create extension if not exists pg_cron;

-- Enable pg_net for HTTP requests (if using database-triggered approach)
create extension if not exists pg_net;
```

### Step 2: Create Edge Functions

#### **Function 1: `generate-daily-challenge`**
*Generates the coding prompt using a prompt-generator LLM*

```typescript
// supabase/functions/generate-daily-challenge/index.ts

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

serve(async (req) => {
  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    )

    // Call a powerful LLM to generate coding challenge prompt
    const promptResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${Deno.env.get('OPENAI_API_KEY')}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'gpt-4o',
        messages: [{
          role: 'system',
          content: 'Generate creative coding challenges for browser-based HTML/JS/CSS. Return ONLY the prompt text, no explanations.'
        }, {
          role: 'user',
          content: `Create a unique, creative coding challenge for today (${new Date().toDateString()}). It should be visual, interactive, and achievable in ~200 lines of code.`
        }],
        max_tokens: 300
      })
    })

    const promptData = await promptResponse.json()
    const challengePrompt = promptData.choices[0].message.content

    // Store in database
    const today = new Date().toISOString().split('T')[0]
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours

    const { data: challenge, error } = await supabase
      .from('daily_challenges')
      .insert({
        challenge_date: today,
        prompt_text: challengePrompt,
        prompt_metadata: {
          generator_model: 'gpt-4o',
          generated_at: new Date().toISOString()
        },
        expires_at: expiresAt.toISOString()
      })
      .select()
      .single()

    if (error) throw error

    // Trigger evaluation function
    await fetch(`${Deno.env.get('SUPABASE_URL')}/functions/v1/evaluate-models`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${Deno.env.get('SUPABASE_ANON_KEY')}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        challenge_id: challenge.id,
        prompt: challengePrompt
      })
    })

    return new Response(JSON.stringify({ success: true, challenge }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    })

  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    })
  }
})
```

#### **Function 2: `evaluate-models`**
*Sends prompt to all evaluation models and stores results*

```typescript
// supabase/functions/evaluate-models/index.ts

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

// Models to evaluate
const MODELS_TO_EVALUATE = [
  { id: 'gpt-5-chat-latest', provider: 'openai', model: 'gpt-5-chat-latest' },
  { id: 'gpt-4o', provider: 'openai', model: 'gpt-4o' },
  { id: 'claude-sonnet-3-7', provider: 'anthropic', model: 'claude-3-7-sonnet-20250219' },
  { id: 'claude-haiku-3-5', provider: 'anthropic', model: 'claude-3-5-haiku-20241022' },
  { id: 'gemini-2.5-pro', provider: 'google', model: 'gemini-2.5-pro' },
  { id: 'groq-llama-3.3-70b', provider: 'groq', model: 'llama-3.3-70b-versatile' },
  // Add all your models here
]

const SYSTEM_PROMPT = 'You are a coding assistant. Return ONLY executable code - no explanations, no markdown, no comments. Provide a single, complete, self-contained HTML document with inline JavaScript and CSS that fulfills the user request. The code must run immediately in a browser without external dependencies. Do not include any text before or after the code.'

serve(async (req) => {
  try {
    const { challenge_id, prompt } = await req.json()

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    )

    // Create pending responses for all models
    const pendingResponses = MODELS_TO_EVALUATE.map(model => ({
      challenge_id,
      model_id: model.id,
      model_provider: model.provider,
      status: 'pending'
    }))

    await supabase.from('model_responses').insert(pendingResponses)

    // Evaluate each model (in parallel for speed)
    await Promise.allSettled(
      MODELS_TO_EVALUATE.map(async (model) => {
        const startTime = Date.now()
        
        try {
          // Call your backend proxy to get model response
          const response = await fetch(`${Deno.env.get('BACKEND_URL')}/api/chat`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              provider: model.provider,
              model: model.model,
              messages: [
                { role: 'system', content: SYSTEM_PROMPT },
                { role: 'user', content: `${prompt}\n\nIMPORTANT: Return ONLY executable code.` }
              ]
            })
          })

          const data = await response.json()
          const executionTime = Date.now() - startTime

          // Update with success
          await supabase
            .from('model_responses')
            .update({
              response_code: data.content,
              response_metadata: {
                execution_time_ms: executionTime,
                tokens: data.tokens || null
              },
              status: 'completed',
              completed_at: new Date().toISOString()
            })
            .match({ challenge_id, model_id: model.id })

        } catch (error) {
          // Update with failure
          await supabase
            .from('model_responses')
            .update({
              status: 'failed',
              error_message: error.message,
              completed_at: new Date().toISOString()
            })
            .match({ challenge_id, model_id: model.id })
        }
      })
    )

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    })

  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    })
  }
})
```

### Step 3: Schedule with pg_cron

```sql
-- Schedule daily challenge generation at midnight UTC
select cron.schedule(
  'generate-daily-challenge',
  '0 0 * * *', -- Every day at midnight UTC
  $$
  select net.http_post(
    url := (select decrypted_secret from vault.decrypted_secrets where name = 'project_url') || '/functions/v1/generate-daily-challenge',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || (select decrypted_secret from vault.decrypted_secrets where name = 'service_role_key')
    ),
    body := '{}'::jsonb
  ) as request_id;
  $$
);
```

### Step 4: Auto-Cleanup Expired Challenges

```sql
-- Clean up challenges older than 24 hours
select cron.schedule(
  'cleanup-expired-challenges',
  '0 1 * * *', -- Every day at 1 AM UTC
  $$
  delete from public.daily_challenges
  where expires_at < now();
  $$
);
```

### Step 5: Create Public API View

```sql
-- Create a view for public access (read-only)
create or replace view public.latest_challenge as
select
  c.id,
  c.challenge_date,
  c.prompt_text,
  c.created_at,
  (
    select json_agg(
      json_build_object(
        'model_id', r.model_id,
        'model_provider', r.model_provider,
        'response_code', r.response_code,
        'status', r.status,
        'execution_time_ms', r.response_metadata->>'execution_time_ms'
      )
      order by r.created_at
    )
    from public.model_responses r
    where r.challenge_id = c.id
  ) as model_responses
from public.daily_challenges c
where c.challenge_date = current_date
limit 1;

-- Grant access to anonymous users
grant select on public.latest_challenge to anon;
```

---

## 🔒 Row Level Security (RLS)

```sql
-- Enable RLS on tables
alter table public.daily_challenges enable row level security;
alter table public.model_responses enable row level security;

-- Allow public read access to current challenge
create policy "Allow public read access to current challenge"
on public.daily_challenges for select
to anon
using (challenge_date >= current_date - interval '1 day');

-- Allow public read access to responses for current challenge
create policy "Allow public read access to current responses"
on public.model_responses for select
to anon
using (
  challenge_id in (
    select id from public.daily_challenges
    where challenge_date >= current_date - interval '1 day'
  )
);

-- Only service role can insert/update
create policy "Service role can manage challenges"
on public.daily_challenges for all
to service_role
using (true);

create policy "Service role can manage responses"
on public.model_responses for all
to service_role
using (true);
```

---

## 🌐 Frontend Integration

```typescript
// Fetch today's challenge
const { data, error } = await supabase
  .from('latest_challenge')
  .select('*')
  .single()

if (data) {
  console.log('Challenge:', data.prompt_text)
  console.log('Models:', data.model_responses)
}
```

---

## 📊 Benefits of This Architecture

1. **Fully Automated** - No manual intervention needed
2. **Cost Effective** - Only generates once per day
3. **Scalable** - Edge Functions scale automatically
4. **Secure** - RLS policies protect data
5. **Fast** - Cached queries, indexed lookups
6. **Reliable** - Built-in retry logic with pg_cron
7. **Observable** - Query logs and monitor execution
8. **Flexible** - Easy to add/remove models

---

## 💡 Alternative: Realtime Updates

For real-time updates as models complete, subscribe to changes:

```typescript
const channel = supabase
  .channel('challenge-updates')
  .on(
    'postgres_changes',
    {
      event: 'UPDATE',
      schema: 'public',
      table: 'model_responses',
      filter: `challenge_id=eq.${challengeId}`
    },
    (payload) => {
      console.log('Model completed:', payload.new)
      // Update UI in real-time
    }
  )
  .subscribe()
```

---

## 🔧 Maintenance & Monitoring

### Check Scheduled Jobs
```sql
select * from cron.job;
```

### View Job Run History
```sql
select * from cron.job_run_details
order by start_time desc
limit 10;
```

### Manual Trigger (Testing)
```sql
select net.http_post(
  url := 'YOUR_PROJECT_URL/functions/v1/generate-daily-challenge',
  headers := '{"Authorization": "Bearer YOUR_SERVICE_ROLE_KEY"}'::jsonb,
  body := '{}'::jsonb
);
```

---

## 📚 References

- [Supabase pg_cron Documentation](https://supabase.com/docs/guides/database/extensions/pgcron)
- [Supabase Edge Functions](https://supabase.com/docs/guides/functions)
- [Scheduling Edge Functions](https://supabase.com/docs/guides/functions/schedule-functions)
- [Supabase pg_net Extension](https://supabase.com/docs/guides/database/extensions/pg_net)

---

**Status:** Architecture designed and ready for implementation  
**Estimated Setup Time:** 2-3 hours  
**Estimated Cost:** ~$0.50-2.00 per day (depending on model usage)
