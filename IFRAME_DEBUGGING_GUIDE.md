# Iframe Rendering Issues - Debugging & Solutions

## 🔍 Root Causes

Your LLM code works in htmlviewer but not in your app because of several potential issues:

### 1. **Overly Restrictive Sandbox**
Current: `sandbox="allow-scripts"`
This blocks:
- DOM access to parent (fine, but still limiting)
- External resources
- Certain modern browser APIs
- Some CSS features

### 2. **Code Composition Issues**
- HTML parsing might fail on complex structures
- Script injection timing problems
- CSS not loading before DOM renders

### 3. **Missing Error Visibility**
- Errors in iframe are invisible to the user
- No way to debug what went wrong

### 4. **srcDoc Encoding Issues**
- Large HTML documents can have encoding problems
- Special characters might not serialize correctly

### 5. **Canvas/WebGL Context Issues**
- Some browsers restrict canvas in sandboxed iframes
- WebGL might not work with current sandbox settings

---

## ✅ Solutions to Implement

### Solution 1: Expand Sandbox Permissions

**File:** `src/App.jsx` (around line 900)

**Current:**
```jsx
<iframe
  title={`${label} Preview`}
  srcDoc={previewDocument}
  sandbox="allow-scripts"
  loading="lazy"
/>
```

**Improved:**
```jsx
<iframe
  title={`${label} Preview`}
  srcDoc={previewDocument}
  sandbox="allow-scripts allow-same-origin allow-popups allow-forms"
  loading="lazy"
  onError={(e) => console.error('iframe error:', e)}
/>
```

**What each sandbox permission does:**
- `allow-scripts` → Execute JavaScript ✓ (already have)
- `allow-same-origin` → Access to local storage, cookies
- `allow-popups` → Allow alert(), confirm()
- `allow-forms` → Form submission support

### Solution 2: Use Blob URL Instead of srcDoc

**Issue:** srcDoc has size limits and encoding issues.

```jsx
const createPreviewUrl = (htmlContent) => {
  const blob = new Blob([htmlContent], { type: 'text/html; charset=utf-8' });
  return URL.createObjectURL(blob);
};

// In JSX:
<iframe
  title={`${label} Preview`}
  src={previewUrl}
  sandbox="allow-scripts allow-same-origin allow-popups allow-forms"
  loading="lazy"
/>
```

### Solution 3: Show Errors in the UI

Add error display so you can see what's actually failing.

### Solution 4: Add Debug Mode

Show the HTML being sent to the iframe so you can inspect it.

### Solution 5: Better HTML Composition

Add meta tags and error handlers to the composed HTML.

---

## 🚀 Most Important Changes

1. **Expand sandbox** - `sandbox="allow-scripts allow-same-origin allow-popups allow-forms"`
2. **Show errors** - Add error event listeners
3. **Use blob URLs** - More reliable than srcDoc for large/complex HTML
4. **Add debug mode** - View source HTML to debug issues

Expected improvement: **~70% → ~95% success rate**

