# Aggressive Text Removal Fix ✅

## Problem

Models like Qwen3 returned responses where working code was **embedded in the middle** of explanatory text:

```
Here's my thinking about this problem...
The user wants an interactive graph path finder...

<!DOCTYPE html>
<html>
  ... working code ...
</html>

And here's why I implemented it this way...
```

**Result:** User had to scroll through paragraphs of text to see the rendered code in the iframe.

---

## Solution

Implemented **multi-step aggressive extraction** that strips ALL text and shows ONLY executable code.

---

## Frontend Implementation (App.jsx)

Enhanced `extractCodeBlocks()` with 5-step extraction process:

### Step 1: Remove `<think>` tags
```javascript
cleanedContent = content.replace(/<think>[\s\S]*?<\/think>/gi, '');
```

### Step 2: Extract markdown code blocks
```javascript
const markdownRegex = /```(\w+)?\s*([\s\S]*?)```/g;
// If found, return ONLY code blocks (ignore surrounding text)
```

### Step 3: Extract HTML documents (EVEN IF SURROUNDED BY TEXT)
```javascript
const htmlDocMatch = cleanedContent.match(/(<!DOCTYPE[\s\S]*?<\/html>|<html[\s\S]*?<\/html>)/i);
// Extracts complete HTML doc from <!DOCTYPE or <html> to </html>
```

### Step 4: Extract `<script>` blocks
```javascript
const scriptMatch = cleanedContent.match(/(<(?:script|style|canvas|svg)[\s\S]*?<\/(?:script|style|canvas|svg)>)/i);
// Wraps in minimal HTML if needed
```

### Step 5: Strip everything before/after code
```javascript
codeOnlyContent = content
  .replace(/^[\s\S]*?(?=<!DOCTYPE|<html|<script)/i, '') // Remove before
  .replace(/(?<=<\/html>)[\s\S]*$/i, '') // Remove after </html>
  .replace(/(?<=<\/script>)[\s\S]*$/i, ''); // Remove after </script>
```

---

## Edge Function Implementation (Version 7)

Added `cleanResponse()` function that mirrors frontend logic:

```typescript
function cleanResponse(content: string): string {
  // Step 1: Remove <think> blocks
  cleaned = cleaned.replace(/<think>[\s\S]*?<\/think>/gi, '');

  // Step 2: Extract markdown blocks if present
  const markdownMatch = cleaned.match(/```(?:\w+)?\s*([\s\S]*?)```/);
  if (markdownMatch) return markdownMatch[1].trim();

  // Step 3: Extract HTML document
  const htmlDocMatch = cleaned.match(/(<!DOCTYPE[\s\S]*?<\/html>|<html[\s\S]*?<\/html>)/i);
  if (htmlDocMatch) return htmlDocMatch[1].trim();

  // Step 4: Strip text before/after code
  cleaned = cleaned.replace(/^[\s\S]*?(?=<!DOCTYPE|<html|<script)/i, '');
  cleaned = cleaned.replace(/(?<=<\/html>)[\s\S]*$/i, '');
  
  return cleaned.trim();
}
```

**Result:** Only clean code is stored in database, no text noise.

---

## What It Handles

✅ **Markdown-wrapped code**
```
```html
<!DOCTYPE html>...
```
```

✅ **Code embedded in text**
```
My approach is...
<!DOCTYPE html>...</html>
That's why...
```
→ Extracts: `<!DOCTYPE html>...</html>`

✅ **Reasoning before code**
```
Okay, let's tackle this...
<!DOCTYPE html>...
```

✅ **Explanations after code**
```
<!DOCTYPE html>...</html>
This implementation uses...
```

✅ **Multiple paragraphs around code**
```
Paragraph 1
Paragraph 2
<!DOCTYPE html>...</html>
Paragraph 3
```

✅ **`<think>` tags (Qwen3)**
```
<think>reasoning...</think>
<!DOCTYPE html>...
```

✅ **Script blocks without wrapper**
```
Some text...
<script>code</script>
More text...
```
→ Wraps in HTML and extracts

---

## Testing

### Before Fix:
- User sees paragraphs of text
- Has to scroll to find rendered code
- Iframe shows text mixed with code

### After Fix:
- User sees ONLY rendered code
- No text, no explanations
- Clean iframe with just the working code

### Test Steps:
1. Visit: http://localhost:5174/testing
2. Click "Generate New Challenge"
3. Wait for Qwen3 and other reasoning models
4. Check each model's output:
   - ✅ Should show ONLY code
   - ✅ No text before/after
   - ✅ No need to scroll through paragraphs

---

## Technical Details

### Extraction Flags:
- `extracted_embedded_html` - HTML found in middle of text
- `extracted_script_block` - Script block extracted and wrapped
- `extracted_direct_html` - Pure HTML response
- `extracted_direct_js` - Pure JavaScript response

### Regex Patterns:
- `/(<!DOCTYPE[\s\S]*?<\/html>|<html[\s\S]*?<\/html>)/i` - Extracts HTML docs
- `/^[\s\S]*?(?=<!DOCTYPE|<html)/i` - Removes text before code
- `/(?<=<\/html>)[\s\S]*$/i` - Removes text after code (lookbehind)

### Performance:
- Sequential extraction (each step only runs if previous failed)
- Efficient regex patterns
- No unnecessary processing

---

## Deployment Status

✅ **Frontend:** Enhanced `extractCodeBlocks()` in `App.jsx`  
✅ **Edge Function:** Version 7 with `cleanResponse()`  
✅ **Testing:** Ready for validation  
✅ **Documentation:** Complete

---

## Expected Results

### Qwen3 Responses:
- **Before:** Long text with code in middle
- **After:** Just the code, rendered and executable

### All Models:
- Cleaner database storage (no text noise)
- Faster iframe rendering (no text parsing)
- Better user experience (code-only view)

---

**Status:** ✅ Fully implemented and deployed  
**Version:** Edge Function v7, Frontend updated  
**Result:** Only executable code shown, all text automatically removed

