import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import {
  modelOptions,
  modelOptionMap,
  SAMPLE_TASK,
  SCRIPT_LANGS,
  JS_LANGS,
  HTML_LANGS,
  STYLE_LANGS,
  FLAG_LABELS,
  CANVAS_CONFIG,
} from './constants';

const describeFlag = (flag) => FLAG_LABELS[flag] ?? flag.replace(/_/g, ' ');

const looksLikePython = (language, code) => {
  const lang = (language || '').toLowerCase();
  if (lang.includes('python') || lang === 'py') {
    return true;
  }

  const pythonPatterns = [
    /\bimport\s+(pygame|numpy|math|sys|os)\b/i,
    /\bpip install\b/i,
    /^def\s+\w+\s*\(.*\)\s*:/m,
    /^class\s+\w+\s*\(?.*\)?:/m,
    /\bif\s+__name__\s*==\s*['"]__main__['"]\s*:/,
    /\bprint\(/,
  ];

  return pythonPatterns.some((pattern) => pattern.test(code));
};

const sanitizeScript = (code) => code.replace(/<\/script>/gi, '<\\/script>');

const isDomAvailable = () => typeof window !== 'undefined' && typeof document !== 'undefined';

const serializeDocument = (doc) => `<!DOCTYPE html>\n${doc.documentElement.outerHTML}`;

const createInitialRunState = (option) => ({
  optionId: option?.id ?? '',
  provider: option?.provider ?? 'groq',
  apiModel: option?.apiModel ?? '',
  response: '',
  primaryResponse: '',
  codeBlocks: [],
  selectedBlockIndex: -1,
  autoConversionAttempted: false,
  conversionStatus: 'idle',
  conversionError: '',
  normalizationFlags: [],
  hasError: false,
  error: null,
});

const getOrCreateHead = (doc) => {
  if (!doc.head) {
    const head = doc.createElement('head');
    doc.documentElement.insertBefore(head, doc.body || null);
  }
  return doc.head;
};

const getOrCreateBody = (doc) => {
  if (!doc.body) {
    const body = doc.createElement('body');
    doc.documentElement.appendChild(body);
  }
  return doc.body;
};

const composeHtmlDocument = (blocks, baseIndex) => {
  const flags = new Set();
  const baseBlock = blocks[baseIndex];
  const baseHtml = baseBlock.code.trim() || '<div id="root"></div>';

  if (!isDomAvailable() || typeof DOMParser === 'undefined') {
    flags.add('composed_html_without_domparser');
    const baseStyleTag = `<style id="groq-preview-base-style">
  html, body {
    margin: 0;
    height: 100%;
    background: #020617;
    color: #e2e8f0;
    font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
  }
</style>`;
    const html = baseHtml.replace(/<script[\s\S]*?<\/script>/gi, '');
    const styles = blocks
      .filter((block, index) => index !== baseIndex && (STYLE_LANGS.has(block.language) || block.language === 'style'))
      .map((block) => block.code)
      .join('\n');
    const scripts = blocks
      .filter(
        (block, index) =>
          index !== baseIndex && SCRIPT_LANGS.has(block.language) && !looksLikePython(block.language, block.code),
      )
      .map((block) => sanitizeScript(block.code))
      .join('\n');

    const flagList = Array.from(flags).sort();
    return {
      doc: `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <title>Groq Preview</title>
    ${baseStyleTag}
    ${styles ? `<style>${styles}</style>` : ''}
  </head>
  <body>
    ${html}
    ${scripts ? `<script>${scripts}</script>` : ''}
  </body>
</html>`,
      flags: flagList,
    };
  }

  const parser = new DOMParser();
  const doc = parser.parseFromString(baseHtml, 'text/html');

  const inlineScripts = [];
  doc.querySelectorAll('script').forEach((node) => {
    if (node.src && node.src.trim()) {
      node.remove();
      flags.add('stripped_external_script_src');
      return;
    }

    inlineScripts.push(node.textContent ?? '');
    node.remove();
  });
  doc.querySelectorAll('link[rel="stylesheet"]').forEach((node) => node.remove());

  const head = getOrCreateHead(doc);
  const body = getOrCreateBody(doc);
  if (!doc.title) {
    doc.title = 'Groq Preview';
  }

  if (!doc.getElementById('groq-preview-base-style')) {
    const baseStyle = doc.createElement('style');
    baseStyle.id = 'groq-preview-base-style';
    baseStyle.textContent = `
      html, body {
        margin: 0;
        height: 100%;
        background: #020617;
        color: #e2e8f0;
        font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
      }
    `;
    head.appendChild(baseStyle);
    flags.add('injected_base_style');
  }

  blocks
    .filter((block, index) => index !== baseIndex && (STYLE_LANGS.has(block.language) || block.language === 'style'))
    .forEach((block, index) => {
      if (block.source?.startsWith('style-tag')) {
        flags.add('preserved_style_tag');
        return;
      }
      const styleEl = doc.createElement('style');
      styleEl.id = `groq-preview-inline-styles-${index}`;
      styleEl.textContent = block.code;
      head.appendChild(styleEl);
      flags.add('appended_additional_style_block');
    });

  inlineScripts.forEach((code, index) => {
    const scriptEl = doc.createElement('script');
    scriptEl.id = `groq-preview-inline-script-${index}`;
    scriptEl.textContent = code;
    body.appendChild(scriptEl);
    flags.add('reinserted_inline_script');
  });

  blocks
    .filter(
      (block, index) =>
        index !== baseIndex && SCRIPT_LANGS.has(block.language) && !looksLikePython(block.language, block.code),
    )
    .forEach((block, index) => {
      if (block.source?.startsWith('inline-script')) {
        flags.add('preserved_inline_script_block');
        return;
      }
      const scriptEl = doc.createElement('script');
      scriptEl.id = `groq-preview-script-${index}`;
      scriptEl.textContent = block.code;
      body.appendChild(scriptEl);
      flags.add('appended_additional_script_block');
    });

  const flagList = Array.from(flags).sort();
  return { doc: serializeDocument(doc), flags: flagList };
};

const composeScriptDocument = (blocks, selectedIndex) => {
  const flags = new Set();
  const selected = blocks[selectedIndex];
  const cssBlocks = blocks.filter(
    (block, index) => index !== selectedIndex && (STYLE_LANGS.has(block.language) || block.language === 'style'),
  );

  if (!isDomAvailable()) {
    flags.add('composed_js_without_dom');
    const styles = cssBlocks.map((block) => block.code).join('\n\n');
    const flagList = Array.from(flags).sort();
    return {
      doc: `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <title>Groq Preview</title>
    <style id="groq-preview-base-style">
      html, body {
        margin: 0;
        height: 100%;
        background: #020617;
        color: #e2e8f0;
        font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
      }
      canvas {
        display: block;
        margin: 0 auto;
        background: radial-gradient(circle at center, rgba(56, 189, 248, 0.2), transparent 65%);
      }
    </style>
    ${styles ? `<style>${styles}</style>` : ''}
  </head>
  <body>
    <canvas id="canvas" width="${CANVAS_CONFIG.WIDTH}" height="${CANVAS_CONFIG.HEIGHT}"></canvas>
    <div id="root"></div>
    <script>
      try {
${sanitizeScript(
        selected.code
          .split('\n')
          .map((line) => `        ${line}`)
          .join('\n'),
      )}
      } catch (error) {
        const msg = document.createElement('pre');
        msg.textContent = 'Preview error: ' + error.message;
        msg.style.color = '#f87171';
        msg.style.padding = '16px';
        document.body.innerHTML = '';
        document.body.appendChild(msg);
      }
    </script>
  </body>
</html>`,
      flags: flagList,
    };
  }

  const doc = document.implementation.createHTMLDocument('Groq Preview');
  const head = getOrCreateHead(doc);
  const body = getOrCreateBody(doc);
  doc.title = 'Groq Preview';

  const baseStyle = doc.createElement('style');
  baseStyle.id = 'groq-preview-base-style';
  baseStyle.textContent = `
    html, body {
      margin: 0;
      height: 100%;
      background: #020617;
      color: #e2e8f0;
      font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
    }
    canvas {
      display: block;
      margin: 0 auto;
      background: radial-gradient(circle at center, rgba(56, 189, 248, 0.2), transparent 65%);
    }
  `;
  head.appendChild(baseStyle);
  flags.add('injected_base_style');

  cssBlocks.forEach((block, index) => {
    if (block.source?.startsWith('style-tag')) {
      flags.add('preserved_style_tag');
      return;
    }
    const styleEl = doc.createElement('style');
    styleEl.id = `groq-preview-inline-styles-${index}`;
    styleEl.textContent = block.code;
    head.appendChild(styleEl);
    flags.add('appended_additional_style_block');
  });

  const canvas = doc.createElement('canvas');
  canvas.id = 'canvas';
  canvas.width = CANVAS_CONFIG.WIDTH;
  canvas.height = CANVAS_CONFIG.HEIGHT;
  body.appendChild(canvas);
  flags.add('injected_canvas');

  const root = doc.createElement('div');
  root.id = 'root';
  body.appendChild(root);

  const scriptEl = doc.createElement('script');
  scriptEl.textContent = selected.code;
  body.appendChild(scriptEl);
  flags.add('injected_script_wrapper');

  const flagList = Array.from(flags).sort();
  return { doc: serializeDocument(doc), flags: flagList };
};

const fallbackBlocksFromContent = (content) => {
  const flags = [];
  const blocks = [];

  const htmlMatch =
    content.match(/<!DOCTYPE html[\s\S]*?<\/html>/i) || content.match(/<html[\s\S]*?<\/html>/i);
  if (htmlMatch) {
    blocks.push({ language: 'html', rawLanguage: 'html', code: htmlMatch[0].trim() });
    flags.push('extracted_html_tag');
  }

  if (blocks.length === 0) {
    const bodyMatch = content.match(/<body[\s\S]*?<\/body>/i);
    if (bodyMatch) {
      blocks.push({
        language: 'html',
        rawLanguage: 'html',
        code: `<html>\n${bodyMatch[0].trim()}\n</html>`,
      });
      flags.push('wrapped_body_in_html');
    }
  }

  const cssMatches = Array.from(content.matchAll(/<style[^>]*>([\s\S]*?)<\/style>/gi));
  cssMatches.forEach((match, index) => {
    const css = match[1]?.trim();
    if (css) {
      blocks.push({ language: 'css', rawLanguage: 'css', code: css, source: `style-tag-${index}` });
      flags.push('extracted_style_tag');
    }
  });

  const jsMatches = Array.from(content.matchAll(/<script[^>]*>([\s\S]*?)<\/script>/gi));
  jsMatches.forEach((match, index) => {
    const attrs = match[0].match(/<script([^>]*)>/i)?.[1] ?? '';
    if (/\bsrc=/.test(attrs)) {
      return;
    }
    const js = match[1]?.trim();
    if (js) {
      blocks.push({
        language: '',
        rawLanguage: 'javascript',
        code: js,
        source: `inline-script-${index}`,
      });
      flags.push('extracted_inline_script');
    }
  });

  if (blocks.length === 0) {
    const jsSectionMatch = content.match(/(?:JavaScript|JS)[^\n]*\n+([\s\S]+)/i);
    if (jsSectionMatch) {
      const snippet = jsSectionMatch[1].trim();
      if (snippet) {
        blocks.push({ language: 'javascript', rawLanguage: 'javascript', code: snippet });
        flags.push('extracted_plain_js');
      }
    }
  }

  return { blocks, flags: Array.from(new Set(flags)) };
};

const extractCodeBlocks = (content) => {
  // Step 1: Strip out reasoning/thinking tags
  let cleanedContent = content.replace(/<think>[\s\S]*?<\/think>/gi, '');

  // Step 2: Look for markdown code blocks first (most reliable)
  const markdownRegex = /```(\w+)?\s*([\s\S]*?)```/g;
  const blocks = [];
  let match;

  while ((match = markdownRegex.exec(cleanedContent)) !== null) {
    const rawLanguage = match[1]?.trim() ?? '';
    const language = rawLanguage.toLowerCase();
    const code = match[2].trim();
    if (code) {
      blocks.push({ language, rawLanguage, code });
    }
  }

  // If we found markdown blocks, return ONLY those (ignore surrounding text)
  if (blocks.length > 0) {
    return { blocks, flags: [] };
  }

  // Step 3: Extract HTML document if present (even if surrounded by text)
  // Look for complete HTML document from <!DOCTYPE or <html> to </html>
  const htmlDocMatch = cleanedContent.match(/(<!DOCTYPE[\s\S]*?<\/html>|<html[\s\S]*?<\/html>)/i);
  if (htmlDocMatch) {
    const htmlCode = htmlDocMatch[1].trim();
    blocks.push({ language: 'html', rawLanguage: 'html', code: htmlCode });
    return { blocks, flags: ['extracted_embedded_html'] };
  }

  // Step 4: Look for <script> or <style> tags with surrounding minimal HTML
  const scriptMatch = cleanedContent.match(/(<(?:script|style|canvas|svg)[\s\S]*?<\/(?:script|style|canvas|svg)>)/i);
  if (scriptMatch) {
    // Wrap in minimal HTML if needed
    const code = scriptMatch[1].includes('<html') ? scriptMatch[1] : 
      `<!DOCTYPE html>\n<html>\n<body>\n${scriptMatch[1]}\n</body>\n</html>`;
    blocks.push({ language: 'html', rawLanguage: 'html', code: code.trim() });
    return { blocks, flags: ['extracted_script_block'] };
  }

  // Step 5: Check if content starts with code-like patterns (after stripping text)
  // Remove common explanation phrases aggressively
  const codeOnlyContent = cleanedContent
    .replace(/^[\s\S]*?(?=<!DOCTYPE|<html|<script|const |let |var |function |class )/i, '') // Remove everything before code
    .replace(/(?<=<\/html>)[\s\S]*$/i, '') // Remove everything after </html>
    .replace(/(?<=<\/script>)[\s\S]*$/i, '') // Remove everything after </script>
    .trim();
  
  const looksLikeCode = /^(<!DOCTYPE|<html|<script|<style|<canvas|const |let |var |function |class )/i.test(codeOnlyContent);
  
  if (looksLikeCode && codeOnlyContent.length > 50) {
    // Determine if it's HTML or JavaScript
    if (/^(<!DOCTYPE|<html|<script|<style)/i.test(codeOnlyContent)) {
      blocks.push({ language: 'html', rawLanguage: 'html', code: codeOnlyContent });
      return { blocks, flags: ['extracted_direct_html'] };
    } else {
      blocks.push({ language: 'javascript', rawLanguage: 'javascript', code: codeOnlyContent });
      return { blocks, flags: ['extracted_direct_js'] };
    }
  }

  // Fallback to existing HTML extraction logic
  return fallbackBlocksFromContent(cleanedContent);
};

const pickDefaultBlockIndex = (blocks) => {
  if (blocks.length === 0) {
    return -1;
  }
  const htmlIndex = blocks.findIndex((block) => block.language === 'html');
  if (htmlIndex !== -1) {
    return htmlIndex;
  }
  const scriptIndex = blocks.findIndex((block) => SCRIPT_LANGS.has(block.language));
  if (scriptIndex !== -1) {
    return scriptIndex;
  }
  return 0;
};

// Create blob URL from HTML string for reliable iframe rendering
const createPreviewUrl = (htmlContent) => {
  if (!htmlContent) return null;
  try {
    const blob = new Blob([htmlContent], { type: 'text/html; charset=utf-8' });
    return URL.createObjectURL(blob);
  } catch (error) {
    console.error('Failed to create blob URL:', error);
    return null;
  }
};

function App() {
  const defaultPrimaryOption = modelOptions[0];
  const defaultSecondaryOption = modelOptions[1] ?? modelOptions[0];

  const [primaryModel, setPrimaryModel] = useState(defaultPrimaryOption.id);
  const [secondaryModel, setSecondaryModel] = useState(defaultSecondaryOption.id);
  const [task, setTask] = useState(SAMPLE_TASK);
  const [runs, setRuns] = useState({
    primary: createInitialRunState(defaultPrimaryOption),
    secondary: createInitialRunState(defaultSecondaryOption),
  });
  const [lastSubmittedTask, setLastSubmittedTask] = useState('');
  const [status, setStatus] = useState('idle');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [lastRequestTime, setLastRequestTime] = useState(0);
  const MIN_REQUEST_INTERVAL = 2000; // 2 seconds between requests
  
  // Abort controller for request cancellation
  const abortControllerRef = useRef(null);
  const blobUrlsRef = useRef({});

  const slotConfigs = useMemo(() => {
    const primaryOption = modelOptionMap[primaryModel] ?? defaultPrimaryOption;
    const secondaryOption = modelOptionMap[secondaryModel] ?? defaultSecondaryOption;

    return [
      { key: 'primary', label: 'Model A', option: primaryOption },
      { key: 'secondary', label: 'Model B', option: secondaryOption },
    ];
  }, [defaultPrimaryOption, defaultSecondaryOption, primaryModel, secondaryModel]);

  const updateRun = useCallback(
    (slot, updater) => {
      setRuns((prev) => {
        const fallbackOption =
          slot === 'primary'
            ? modelOptionMap[primaryModel] ?? defaultPrimaryOption
            : modelOptionMap[secondaryModel] ?? defaultSecondaryOption;
        const current = prev[slot] ?? createInitialRunState(fallbackOption);
        const updated = typeof updater === 'function' ? updater(current) : { ...current, ...updater };
        return { ...prev, [slot]: updated };
      });
    },
    [defaultPrimaryOption, defaultSecondaryOption, primaryModel, secondaryModel],
  );

  useEffect(() => {
    const option = modelOptionMap[primaryModel] ?? defaultPrimaryOption;
    updateRun('primary', createInitialRunState(option));
  }, [defaultPrimaryOption, primaryModel, updateRun]);

  useEffect(() => {
    const option = modelOptionMap[secondaryModel] ?? defaultSecondaryOption;
    updateRun('secondary', createInitialRunState(option));
  }, [defaultSecondaryOption, secondaryModel, updateRun]);

  // Cleanup blob URLs on unmount
  useEffect(() => {
    return () => {
      Object.values(blobUrlsRef.current).forEach(url => {
        if (url) {
          URL.revokeObjectURL(url);
        }
      });
      blobUrlsRef.current = {};
    };
  }, []);

  const resetRun = useCallback(
    (slot, option) => {
      updateRun(slot, createInitialRunState(option));
    },
    [updateRun],
  );

  const determinePreviewSupport = useCallback((block) => {
    if (!block) {
      return { supported: false, reason: '', mode: 'html' };
    }

    const { language, code } = block;
    const normalized = (language || '').toLowerCase();
    const codeLooksLikeHtml = /<!doctype|<html[\s>]|<body[\s>]|<canvas[\s>]|<svg[\s>]/i.test(code);

    if (looksLikePython(language, code)) {
      return {
        supported: false,
        reason: 'Preview not available: Python requires a runtime we do not support in-browser.',
        mode: 'html',
      };
    }

    if (HTML_LANGS.has(normalized) || codeLooksLikeHtml) {
      return { supported: true, reason: '', mode: 'html' };
    }

    if (JS_LANGS.has(normalized) || (!normalized && /\b(const|let|var|function|class)\b/.test(code))) {
      return { supported: true, reason: '', mode: 'js' };
    }

    return {
      supported: false,
      reason: `${language || 'This code block'} requires a runtime we do not support in-browser.`,
      mode: 'html',
    };
  }, []);

  const fetchCompletion = useCallback(async (providerKey, modelId, messages, signal) => {
    const res = await fetch('/api/chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ provider: providerKey, model: modelId, messages }),
      signal,
    });

    if (!res.ok) {
      let errorMessage = `Request failed (${res.status})`;
      // Clone response before reading to avoid "body already read" errors
      const clonedRes = res.clone();
      try {
        const data = await res.json();
        errorMessage = data.error || errorMessage;
      } catch (jsonError) {
        // If JSON parsing fails, try reading as text from the clone
        try {
          const text = await clonedRes.text();
          errorMessage = text || errorMessage;
        } catch (textError) {
          console.error('Failed to read error response:', textError);
        }
      }
      
      // Provide user-friendly error messages
      const USER_FRIENDLY_ERRORS = {
        429: 'Rate limit exceeded. Please wait a moment and try again.',
        401: 'Authentication error. Please check your API keys.',
        403: 'Access forbidden. Please check your API keys.',
        404: 'Model not found. Please select a different model.',
        500: 'Server error. Please try again in a moment.',
        502: 'Service temporarily unavailable. Please try again.',
        503: 'Service temporarily unavailable. Please try again.',
        timeout: 'Request timed out. The model took too long to respond. Try a simpler prompt.',
      };
      
      if (USER_FRIENDLY_ERRORS[res.status]) {
        errorMessage = USER_FRIENDLY_ERRORS[res.status];
      } else if (errorMessage.includes('timeout')) {
        errorMessage = USER_FRIENDLY_ERRORS.timeout;
      }
      
      throw new Error(errorMessage);
    }

    const data = await res.json();
    const content = data?.content?.trim();

    if (!content) {
      throw new Error('The model returned an empty response.');
    }

    return content;
  }, []);
  
  const handleCancel = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    setStatus('idle');
    setIsSubmitting(false);
    setError('Request cancelled');
  }, []);

  const systemPrompt = useMemo(
    () =>
      'You are a coding assistant. Return ONLY executable code - no explanations, no markdown, no comments. Provide a single, complete, self-contained HTML document with inline JavaScript and CSS that fulfills the user request. The code must run immediately in a browser without external dependencies. Do not include any text before or after the code.',
    [],
  );

  const handleSubmit = useCallback(async (event) => {
    event?.preventDefault();
    
    // Prevent duplicate submissions
    if (isSubmitting) {
      return;
    }
    
    // Rate limiting: prevent requests too quickly
    const now = Date.now();
    const timeSinceLastRequest = now - lastRequestTime;
    if (timeSinceLastRequest < MIN_REQUEST_INTERVAL) {
      const waitTime = Math.ceil((MIN_REQUEST_INTERVAL - timeSinceLastRequest) / 1000);
      setError(`Please wait ${waitTime} second${waitTime !== 1 ? 's' : ''} before trying again.`);
      setStatus('error');
      return;
    }
    setLastRequestTime(now);
    
    const trimmedTask = task.trim();
    if (!trimmedTask) {
      setError('Add a task description before sending it to the models.');
      setStatus('error');
      return;
    }

    setIsSubmitting(true);
    setStatus('loading');
    setError('');
    setLastSubmittedTask(trimmedTask);

    // Create new abort controller
    abortControllerRef.current = new AbortController();

    // Reset all runs and clear previous errors
    slotConfigs.forEach(({ key, option }) => {
      resetRun(key, option);
    });

    try {
      // Use Promise.allSettled() to handle partial success
      const results = await Promise.allSettled(
        slotConfigs.map(async ({ key, option }) => {
          try {
            const content = await fetchCompletion(
              option.provider, 
              option.apiModel, 
              [
                { role: 'system', content: systemPrompt },
                { 
                  role: 'user', 
                  content: `${trimmedTask}\n\nIMPORTANT: Return ONLY executable code. No explanations, no markdown text, no comments. Just the code.` 
                },
              ],
              abortControllerRef.current.signal
            );

            const { blocks, flags } = extractCodeBlocks(content);
            updateRun(key, (prev) => ({
              ...prev,
              optionId: option.id,
              provider: option.provider,
              apiModel: option.apiModel,
              response: content,
              primaryResponse: content,
              codeBlocks: blocks,
              selectedBlockIndex: pickDefaultBlockIndex(blocks),
              normalizationFlags: flags,
              hasError: false,
              error: null,
            }));
            
            return { key, success: true, content };
          } catch (err) {
            // Don't show error if request was cancelled
            if (err.name === 'AbortError') {
              throw err;
            }
            
            // Update individual run with error
            const errorMessage = err instanceof Error ? err.message : 'Unexpected error while requesting model outputs.';
            updateRun(key, (prev) => ({
              ...prev,
              hasError: true,
              error: errorMessage,
              response: '',
              codeBlocks: [],
            }));
            
            return { key, success: false, error: errorMessage };
          }
        }),
      );

      // Check if we have any successes
      const hasSuccess = results.some(result => 
        result.status === 'fulfilled' && result.value.success
      );
      
      // Check if we have any failures
      const hasFailures = results.some(result => 
        result.status === 'rejected' || 
        (result.status === 'fulfilled' && !result.value.success)
      );

      // Set status based on results
      if (hasSuccess) {
        setStatus('success');
        // Only show error if both failed
        if (hasFailures && results.every(result => 
          result.status === 'rejected' || 
          (result.status === 'fulfilled' && !result.value.success)
        )) {
          const errorMessages = results
            .map(result => 
              result.status === 'rejected' 
                ? result.reason?.message 
                : result.value?.error
            )
            .filter(Boolean)
            .join('; ');
          setError(`Both models failed: ${errorMessages}`);
        }
      } else {
        // All failed
        const errorMessages = results
          .map(result => 
            result.status === 'rejected' 
              ? result.reason?.message 
              : result.value?.error
          )
          .filter(Boolean)
          .join('; ');
        setError(errorMessages || 'Both models failed. Please try again.');
        setStatus('error');
      }
    } catch (err) {
      // Don't show error if request was cancelled
      if (err.name === 'AbortError') {
        return;
      }
      setError(err instanceof Error ? err.message : 'Unexpected error while requesting model outputs.');
      setStatus('error');
    } finally {
      setIsSubmitting(false);
      abortControllerRef.current = null;
    }
  }, [isSubmitting, task, slotConfigs, resetRun, fetchCompletion, systemPrompt, updateRun, lastRequestTime]);

  const convertToBrowserFriendly = useCallback(async (slotKey) => {
    const run = runs[slotKey];
    if (!run) {
      return;
    }

    if (!run.apiModel || !run.provider) {
      updateRun(slotKey, (prev) => ({
        ...prev,
        conversionStatus: 'failed',
        conversionError: 'No model selected for conversion.',
        normalizationFlags: Array.from(new Set([...prev.normalizationFlags, 'auto_conversion_failed'])),
      }));
      return;
    }

    if (!lastSubmittedTask) {
      updateRun(slotKey, (prev) => ({
        ...prev,
        conversionStatus: 'failed',
        conversionError: 'No prompt captured to convert.',
        normalizationFlags: Array.from(new Set([...prev.normalizationFlags, 'auto_conversion_failed'])),
      }));
      return;
    }

    updateRun(slotKey, (prev) => ({
      ...prev,
      autoConversionAttempted: true,
      conversionStatus: 'converting',
      conversionError: '',
      normalizationFlags: Array.from(new Set([...prev.normalizationFlags, 'auto_conversion_attempted'])),
    }));

    try {
      const messages = [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: lastSubmittedTask },
      ];

      if (run.primaryResponse) {
        messages.push({ role: 'assistant', content: run.primaryResponse });
      }

      messages.push({
        role: 'user',
        content:
          'The previous solution relied on unsupported runtimes. Rewrite it as a single self-contained HTML document with inline JavaScript (canvas/WebGL allowed) and no external dependencies. Return ONLY the code - no explanations, no markdown, no text. Just the complete HTML document.',
      });

      const conversionContent = await fetchCompletion(run.provider, run.apiModel, messages);

      const { blocks: newBlocks, flags } = extractCodeBlocks(conversionContent);
      updateRun(slotKey, (prev) => ({
        ...prev,
        conversionStatus: 'ready',
        conversionError: '',
        response: prev.primaryResponse
          ? `${prev.primaryResponse}\n\n---\n\n**Browser-friendly rewrite**\n\n${conversionContent}`
          : conversionContent,
        codeBlocks: newBlocks,
        selectedBlockIndex: pickDefaultBlockIndex(newBlocks),
        normalizationFlags: Array.from(
          new Set([...prev.normalizationFlags, 'auto_conversion_generated', ...flags]),
        ),
      }));
    } catch (err) {
      updateRun(slotKey, (prev) => ({
        ...prev,
        conversionStatus: 'failed',
        conversionError: err instanceof Error ? err.message : 'Conversion failed.',
        normalizationFlags: Array.from(new Set([...prev.normalizationFlags, 'auto_conversion_failed'])),
      }));
    }
  }, [fetchCompletion, lastSubmittedTask, runs, systemPrompt, updateRun]);

  const handleBrowserFriendlyReplay = useCallback(
    (slotKey) => {
      convertToBrowserFriendly(slotKey);
    },
    [convertToBrowserFriendly],
  );

  const slotPresentations = useMemo(() =>
    slotConfigs.map(({ key, label, option }) => {
      const fallbackOption = key === 'primary' ? defaultPrimaryOption : defaultSecondaryOption;
      const selectedOption = option ?? modelOptionMap[runs[key]?.optionId] ?? fallbackOption;
      const run = runs[key] ?? createInitialRunState(selectedOption);
      const selectedBlock = run.codeBlocks[run.selectedBlockIndex] ?? null;
      const previewSupport = determinePreviewSupport(selectedBlock);
      let composedPreview = { doc: '', flags: [] };
      if (previewSupport.supported) {
        composedPreview =
          previewSupport.mode === 'html'
            ? composeHtmlDocument(run.codeBlocks, run.selectedBlockIndex)
            : composeScriptDocument(run.codeBlocks, run.selectedBlockIndex);
      }
      const combinedFlags = Array.from(
        new Set([...run.normalizationFlags, ...(composedPreview.flags ?? [])]),
      ).sort();

      return {
        key,
        label,
        option: selectedOption,
        run,
        selectedBlock,
        previewSupport,
        composedPreview,
        combinedFlags,
      };
    }),
  [defaultPrimaryOption, defaultSecondaryOption, determinePreviewSupport, runs, slotConfigs]);

  useEffect(() => {
    if (status !== 'success') {
      return;
    }

    slotPresentations.forEach(({ key, run, previewSupport, selectedBlock }) => {
      if (
        selectedBlock &&
        !previewSupport.supported &&
        previewSupport.reason &&
        !run.autoConversionAttempted &&
        run.conversionStatus !== 'converting'
      ) {
        convertToBrowserFriendly(key);
      }
    });
  }, [convertToBrowserFriendly, slotPresentations, status]);

  return (
    <div className="app">
      <header>
        <h1>LLM Code Comparison</h1>
        <p>Compare the actual output from different models side-by-side. Select two models, describe the coding task, and see their rendered results.</p>
      </header>

      <main>
        <div className="sidebar">
          <form className="control-panel" onSubmit={handleSubmit}>
            <label className="field">
              <span>Model A</span>
              <select value={primaryModel} onChange={(event) => setPrimaryModel(event.target.value)}>
                {modelOptions.map((option) => (
                  <option key={option.id} value={option.id}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>

            <label className="field">
              <span>Model B</span>
              <select value={secondaryModel} onChange={(event) => setSecondaryModel(event.target.value)}>
                {modelOptions.map((option) => (
                  <option key={option.id} value={option.id}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>

            <label className="field">
              <span>Task</span>
              <textarea
                value={task}
                onChange={(event) => setTask(event.target.value)}
                placeholder="Describe the coding task you want solved..."
                rows={10}
              />
            </label>

            <div className="actions">
              <button
                type="button"
                className="secondary"
                onClick={() => setTask(SAMPLE_TASK)}
                disabled={isSubmitting}
                aria-label="Load sample firefly simulation prompt"
              >
                Use Firefly Simulation Prompt
              </button>

              {isSubmitting ? (
                <button 
                  type="button" 
                  className="secondary"
                  onClick={handleCancel}
                  aria-label="Cancel current request"
                >
                  Cancel Request
                </button>
              ) : (
                <button 
                  type="submit" 
                  disabled={isSubmitting}
                  aria-busy={isSubmitting}
                  aria-label="Submit task to both models"
                >
                  Ask Models
                </button>
              )}
            </div>
          </form>

          <section className="response-panel" aria-live="polite">
            <h2>Run Status</h2>
            {status === 'idle' && (
              <p className="placeholder">Pick two models, describe the task, and send it to compare their outputs.</p>
            )}
            {status === 'loading' && <p className="placeholder">Requesting responses from both models…</p>}
            {status === 'error' && <p className="error">{error}</p>}
            {status === 'success' && (
              <div className="status-list">
                {slotPresentations.map(({ key, label, option, run }) => (
                  <div key={key} className="status-card">
                    <strong>{label}</strong>
                    <span className="status-model">{option.label}</span>
                    <span className="status-message">
                      {run.hasError ? (
                        <span className="error" style={{ color: '#d92d20', fontWeight: 600 }}>
                          Error: {run.error || 'Failed to get response'}
                        </span>
                      ) : run.response ? (
                        'Rendered output ready'
                      ) : (
                        'No response from this model'
                      )}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>

        <section className="preview-container" aria-live="polite">
          {slotPresentations.map(({ key, label, option, run, composedPreview, combinedFlags, previewSupport }) => {
            const previewDocument = composedPreview.doc;
            const slotLoading = status === 'loading' && !run.response;

            return (
              <div key={key} className="preview-panel">
                <div className="preview-header">
                  <div className="preview-title">
                    <span>{label}</span>
                    <small>{option.label}</small>
                  </div>
                  {run.codeBlocks.length > 1 && (
                    <select
                      className="preview-selector"
                      value={run.selectedBlockIndex}
                      onChange={(event) =>
                        updateRun(key, (prev) => ({
                          ...prev,
                          selectedBlockIndex: Number(event.target.value),
                        }))
                      }
                    >
                      {run.codeBlocks.map((block, index) => (
                        <option key={`${block.rawLanguage || block.language}-${index}`} value={index}>
                          Block {index + 1}: {block.rawLanguage || block.language || 'plain text'}
                        </option>
                      ))}
                    </select>
                  )}
                </div>

                {combinedFlags.length > 0 && (
                  <div className="assist-flag-list">
                    {combinedFlags.map((flag) => (
                      <span key={flag} className="assist-flag">
                        {describeFlag(flag)}
                      </span>
                    ))}
                  </div>
                )}

                <div className="preview-frame">
                  {run.hasError ? (
                    <div className="preview-warning">
                      <p className="error" style={{ color: '#d92d20', fontWeight: 600, marginBottom: '12px' }}>
                        ⚠️ {label} Error: {run.error || 'Failed to get response'}
                      </p>
                      <button
                        type="button"
                        className="secondary"
                        onClick={() => {
                          // Retry this specific model
                          handleSubmit({ preventDefault: () => {} });
                        }}
                        disabled={status === 'loading'}
                      >
                        Retry {label}
                      </button>
                    </div>
                  ) : previewDocument ? (
                    <iframe
                      title={`${label} Preview`}
                      srcDoc={previewDocument}
                      sandbox="allow-scripts allow-same-origin allow-popups allow-forms"
                      loading="lazy"
                      onError={(e) => console.error(`iframe error:`, e)}
                      onLoad={() => console.log(`iframe loaded - canvas & forms enabled`)}
                    />
                  ) : previewSupport.reason ? (
                    <div className="preview-warning">
                      {run.conversionStatus === 'converting' ? (
                        <p>Converting this solution into a browser-friendly preview…</p>
                      ) : (
                        <>
                          <p>{previewSupport.reason}</p>
                          {run.conversionStatus === 'failed' && (
                            <p className="error">
                              Auto conversion failed: {run.conversionError || 'Please try again.'}
                            </p>
                          )}
                          <button
                            type="button"
                            className="secondary"
                            onClick={() => handleBrowserFriendlyReplay(key)}
                            disabled={status === 'loading' || run.conversionStatus === 'converting'}
                          >
                            Ask for Browser-Friendly Code
                          </button>
                        </>
                      )}
                    </div>
                  ) : (
                    <p className="placeholder">
                      {slotLoading ? 'Waiting for the model response…' : 'No runnable code found for this block.'}
                    </p>
                  )}
                </div>

                <div className="preview-response" style={{ display: 'none' }}>
                  {run.response ? (
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>{run.response}</ReactMarkdown>
                  ) : (
                    <p className="placeholder">Response has not arrived yet.</p>
                  )}
                </div>
              </div>
            );
          })}
        </section>
      </main>
    </div>
  );
}

export default App;
