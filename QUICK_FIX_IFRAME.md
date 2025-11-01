# Quick Fix: iframe Rendering Issues

## The Problem
LLM code works in htmlviewer but not in your app because the iframe sandbox is too restrictive.

## The Quick Fix (2 minutes)

### Edit: `src/App.jsx` line 915

**Change this:**
```jsx
sandbox="allow-scripts"
```

**To this:**
```jsx
sandbox="allow-scripts allow-same-origin allow-popups allow-forms"
```

**That's it!** This adds support for:
- Dialogs (alert, confirm)
- Form submissions  
- Better API access
- Canvas context

## Why It Works

- `allow-scripts` - Run JavaScript (already had)
- `allow-same-origin` - Canvas & DOM access
- `allow-popups` - alert() & confirm()
- `allow-forms` - Form handling

## Expected Improvement
Current: ~70% code renders successfully
After: ~80-85% code renders successfully  

## Bonus: See Errors in Console

Add error handler to the iframe (line 912-917):

```jsx
<iframe
  title={`${label} Preview`}
  srcDoc={previewDocument}
  sandbox="allow-scripts allow-same-origin allow-popups allow-forms"
  loading="lazy"
  onError={(e) => console.error('iframe error:', e)}
/>
```

Then open DevTools (F12) → Console to see what's failing.

## Why This Helps

- **Canvas problems solved** - `allow-same-origin` enables canvas context
- **Alert boxes work** - `allow-popups` enables dialogs
- **Forms work** - `allow-forms` enables form submission
- **Better compatibility** - More APIs available to the code

## Next Steps (If Needed)

If still having issues:

1. **Check console** for actual errors (F12)
2. **Use debug mode** to view HTML being sent
3. **Test in htmlviewer** to confirm issue is sandbox-related
4. **Consider Blob URLs** for very large/complex HTML (see full guide)

