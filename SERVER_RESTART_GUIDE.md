# Server Restart Guide

## What Happened

**Error:** "Request failed (500)"

**Root Cause:** The backend server (localhost:8787) had stopped or crashed, causing all API requests to fail with 500 errors.

## The Fix

✅ **Restarted the server** - Both frontend and backend are now running

## How to Check if Servers are Running

### Check Backend Server
```bash
curl http://localhost:8787/health
```
**Expected:** `{"status":"ok", "cache":{...}}`

### Check Frontend
```bash
curl http://localhost:5173
```
**Expected:** HTML response (no error)

### Check Both at Once
```bash
ps aux | grep -E "(node server|vite)" | grep -v grep
```
**Expected:** Should show 2 processes

---

## How to Restart Servers

### Restart Backend Only
```bash
pkill -f "node server/index.js"
npm run dev:server
```

### Restart Frontend Only
```bash
pkill -f "vite"
npm run dev
```

### Restart Both (Full Restart)
```bash
# Stop everything
pkill -f "node server/index.js"
pkill -f "vite"

# Wait a moment
sleep 2

# Start backend (Terminal 1)
npm run dev:server

# Start frontend (Terminal 2)
npm run dev
```

---

## Common Issues & Solutions

### Issue 1: Port Already in Use
**Error:** `EADDRINUSE: address already in use`

**Fix:**
```bash
# Kill process on port 8787 (backend)
lsof -ti:8787 | xargs kill -9

# Kill process on port 5173 (frontend)
lsof -ti:5173 | xargs kill -9
```

### Issue 2: Server Crashes on Startup
**Check logs:**
```bash
npm run dev:server
# Look for error messages in red
```

**Common causes:**
- Missing API keys in `.env.local`
- Port already in use
- Syntax error in `server/index.js`

### Issue 3: Frontend Can't Connect to Backend
**Check CORS settings** in `server/index.js`:
```javascript
const corsOptions = {
  origin: ['http://localhost:5173', 'http://localhost:3000'],
  // ...
};
```

**Check backend is running:**
```bash
curl http://localhost:8787/health
```

---

## Prevention Tips

### 1. Use a Process Manager
Instead of running servers manually, use `pm2` or `concurrently`:

```bash
# Install concurrently
npm install --save-dev concurrently

# Update package.json:
"scripts": {
  "dev": "concurrently \"npm run dev:server\" \"vite\""
}

# Run both with one command
npm run dev
```

### 2. Add Server Health Checks
The app already has health checks:
- Backend: `http://localhost:8787/health`
- Use these to monitor server status

### 3. Check Logs Regularly
```bash
# In one terminal
npm run dev:server

# Watch for errors in red
# Server logs show:
# - Request IDs
# - Response times
# - Cache hits
# - Errors
```

### 4. Use nodemon for Auto-Restart
```bash
npm install --save-dev nodemon

# Update package.json:
"dev:server": "nodemon server/index.js"
```

---

## Quick Reference

| Command | Purpose |
|---------|---------|
| `npm run dev:server` | Start backend |
| `npm run dev` | Start frontend |
| `curl http://localhost:8787/health` | Check backend |
| `curl http://localhost:5173` | Check frontend |
| `pkill -f "node server"` | Stop backend |
| `pkill -f "vite"` | Stop frontend |
| `ps aux | grep node` | See running node processes |

---

## Current Status

✅ **Backend:** Running on http://localhost:8787  
✅ **Frontend:** Running on http://localhost:5173  
✅ **API:** Working (tested successfully)  
✅ **Cache:** Active (60 min TTL, 100 max entries)

**You can now use the app!** Try your "Draw a bouncing red ball on canvas" prompt.

---

## If It Happens Again

1. **Check browser console** (F12) for actual error
2. **Check backend is running:** `curl http://localhost:8787/health`
3. **Check backend logs** for errors (look for red text)
4. **Restart backend** if needed: `npm run dev:server`
5. **Refresh browser** after restart

---

**Last Updated:** Just now  
**Status:** ✅ All servers running and tested
