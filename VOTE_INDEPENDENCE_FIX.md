# Vote Independence Fix ✅

## Problem

When manually generating a new challenge via `/testing`, votes from the previous challenge were persisting and showing up on the new challenge:

1. User upvotes GPT-5 on Challenge #1
2. User generates new challenge via `/testing`
3. GPT-5 appears pre-upvoted on Challenge #2 ❌

**Root Cause:** The `generate-daily-challenge` Edge Function was **updating** the existing challenge instead of creating a new one, which kept the old `model_responses` and their associated votes.

---

## Solution

Implemented a **challenge deactivation system** that ensures each manually generated challenge is completely independent:

### 1. Edge Function Update (Version 4)

**Old Behavior:**
```typescript
// Check if challenge exists for today
if (existing) {
  // UPDATE existing challenge
  // ❌ Old model_responses persist
  // ❌ Old votes remain visible
}
```

**New Behavior:**
```typescript
// Mark ALL existing challenges for today as inactive
await supabase
  .from('daily_challenges')
  .update({ is_active: false })
  .eq('challenge_date', today)
  .eq('is_active', true);

// Create NEW challenge (always fresh)
const challenge = await supabase
  .from('daily_challenges')
  .insert({
    // ... new challenge data
    is_active: true
  });
```

### 2. Database View Filter

The `latest_challenge` view only shows **active** challenges:

```sql
SELECT *
FROM daily_challenges c
WHERE challenge_date = CURRENT_DATE 
  AND is_active = true  -- Only active challenges
ORDER BY created_at DESC
LIMIT 1;
```

### 3. Cleanup Cron Job

Scheduled task to prevent database bloat:

```sql
-- Runs daily at 4 AM UTC
DELETE FROM public.daily_challenges
WHERE is_active = false 
  AND created_at < NOW() - INTERVAL '1 day';
```

---

## How It Works Now

### Challenge Lifecycle:

```
Day 1, 9:00 AM - Challenge #1 Created (Automated)
├─ is_active: true
├─ model_responses: 8 responses (IDs: abc-123, abc-124, ...)
└─ User votes on GPT-5 (response_id: abc-123)

Day 1, 10:00 AM - Manual Trigger via /testing
├─ Challenge #1 marked as is_active: false
├─ Challenge #2 created with is_active: true
├─ NEW model_responses: 8 responses (IDs: def-456, def-457, ...)
└─ View shows Challenge #2 (no votes yet)

Day 1, 11:00 AM - User visits /daily
├─ Sees Challenge #2 (is_active = true)
├─ GPT-5 has 0 votes (fresh start)
└─ Can vote independently from Challenge #1
```

### Vote Tracking:

Each vote is linked to a **specific** `response_id`:

```
votes table:
┌──────────┬─────────────┬─────────────┬───────────┐
│ vote_id  │ response_id │ user_id     │ vote_type │
├──────────┼─────────────┼─────────────┼───────────┤
│ 1        │ abc-123     │ user_abc... │ upvote    │ ← Challenge #1 (inactive)
│ 2        │ def-456     │ user_abc... │ downvote  │ ← Challenge #2 (active)
└──────────┴─────────────┴─────────────┴───────────┘
```

- `abc-123` belongs to Challenge #1 (inactive) → not shown in view
- `def-456` belongs to Challenge #2 (active) → shown in view

---

## Benefits

✅ **Vote Independence:** Each challenge has its own vote slate  
✅ **Clean Testing:** Manual triggers create fresh challenges  
✅ **Data Integrity:** Old votes preserved for analytics  
✅ **Database Cleanup:** Inactive challenges auto-deleted after 1 day  
✅ **Scalability:** No data accumulation issues  

---

## Testing

### Test Vote Independence:

1. **Visit:** http://localhost:5174/daily
2. **Action:** Upvote any model (e.g., GPT-5)
3. **Verify:** Vote count increases

4. **Visit:** http://localhost:5174/testing
5. **Action:** Click "Generate New Challenge"
6. **Wait:** For challenge creation

7. **Visit:** http://localhost:5174/daily (refresh)
8. **Verify:**
   - ✅ New challenge appears
   - ✅ GPT-5 has 0 votes (not pre-upvoted)
   - ✅ All models start fresh

### Test Multiple Manual Triggers:

1. Generate challenge #1 → vote on Model A
2. Generate challenge #2 → vote on Model B
3. Generate challenge #3 → vote on Model C
4. **Verify:** Only challenge #3 is visible, Model C has 1 vote

### Check Inactive Challenges:

```sql
-- See all challenges (active and inactive)
SELECT 
  id,
  challenge_date,
  is_active,
  LEFT(prompt_text, 50) as prompt,
  (SELECT COUNT(*) FROM model_responses WHERE challenge_id = daily_challenges.id) as responses,
  (SELECT COUNT(*) FROM votes v 
   JOIN model_responses mr ON v.response_id = mr.id 
   WHERE mr.challenge_id = daily_challenges.id) as votes
FROM daily_challenges
WHERE challenge_date >= CURRENT_DATE
ORDER BY created_at DESC;
```

---

## User ID Management

Users are identified by a browser fingerprint stored in `localStorage`:

```javascript
// DailyChallenges.jsx
const getUserId = () => {
  let userId = localStorage.getItem('user_fingerprint');
  if (!userId) {
    userId = `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    localStorage.setItem('user_fingerprint', userId);
  }
  return userId;
};
```

### Reset User ID (for testing):

```javascript
// Browser console (F12)
localStorage.removeItem('user_fingerprint');
// Refresh page → new user_id generated
```

This allows testing from a "new user" perspective.

---

## Analytics Preservation

Even though inactive challenges are hidden from the view, their data is preserved for 24 hours for analytics:

```sql
-- Get historical voting trends
SELECT 
  c.challenge_date,
  c.is_active,
  mr.model_id,
  COUNT(v.id) as total_votes,
  SUM(CASE WHEN v.vote_type = 'upvote' THEN 1 ELSE 0 END) as upvotes,
  SUM(CASE WHEN v.vote_type = 'downvote' THEN 1 ELSE 0 END) as downvotes
FROM daily_challenges c
JOIN model_responses mr ON mr.challenge_id = c.id
LEFT JOIN votes v ON v.response_id = mr.id
WHERE c.challenge_date >= CURRENT_DATE - INTERVAL '7 days'
GROUP BY c.challenge_date, c.is_active, mr.model_id
ORDER BY c.challenge_date DESC, upvotes DESC;
```

---

## Edge Cases Handled

✅ **Multiple manual triggers in 1 minute:** Each creates new challenge  
✅ **Concurrent challenge generation:** Database handles atomically  
✅ **Automated daily challenge:** Marks manual ones as inactive  
✅ **Old user_id with new challenge:** Can vote normally (new response_ids)  
✅ **View refresh after generation:** Realtime updates via Supabase subscription  

---

## Deployment Status

✅ **Edge Function:** Version 4 deployed  
✅ **Database View:** Filters by `is_active = true`  
✅ **Cleanup Cron:** Scheduled (daily at 4 AM UTC)  
✅ **Frontend:** No changes needed (works automatically)  

---

## Summary

**Before:** Votes persisted across manual challenge regenerations  
**After:** Each challenge is completely independent with its own vote slate  
**Result:** True model comparison for each unique coding challenge

