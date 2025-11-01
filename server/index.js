import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import crypto from 'crypto';

dotenv.config({ path: '.env.local' });
dotenv.config();

const app = express();
const PORT = Number(process.env.PORT || 8787);

// Configuration constants
const CONFIG = {
  REQUEST_TIMEOUT: 90000, // 90 seconds (increased for complex models)
  MAX_TOKENS: 8192,
  TEMPERATURE: 0.2,
  MAX_MESSAGES: 20,
  MAX_REQUEST_SIZE: 100000, // 100KB
  CACHE_TTL: 3600000, // 1 hour in milliseconds
  MAX_CACHE_SIZE: 100, // Maximum number of cached responses
};

// Simple in-memory cache with TTL
class ResponseCache {
  constructor(ttl = CONFIG.CACHE_TTL, maxSize = CONFIG.MAX_CACHE_SIZE) {
    this.cache = new Map();
    this.ttl = ttl;
    this.maxSize = maxSize;
  }

  getCacheKey(provider, model, messages) {
    // Normalize messages to ensure consistent cache keys
    // Sort messages to handle order-independent equality
    const normalized = JSON.stringify(messages.map(msg => ({
      role: msg.role,
      content: msg.content
    })));
    return `${provider}:${model}:${normalized}`;
  }

  get(provider, model, messages) {
    const key = this.getCacheKey(provider, model, messages);
    const entry = this.cache.get(key);
    
    if (!entry) {
      return null;
    }
    
    // Check if expired
    if (Date.now() - entry.timestamp > this.ttl) {
      this.cache.delete(key);
      return null;
    }
    
    return entry.content;
  }

  set(provider, model, messages, content) {
    // Implement simple LRU by deleting oldest entries when max size reached
    if (this.cache.size >= this.maxSize) {
      const firstKey = this.cache.keys().next().value;
      this.cache.delete(firstKey);
    }
    
    const key = this.getCacheKey(provider, model, messages);
    this.cache.set(key, {
      content,
      timestamp: Date.now(),
    });
  }

  clear() {
    this.cache.clear();
  }

  get size() {
    return this.cache.size;
  }
}

const responseCache = new ResponseCache();

// CORS configuration - restrict in production
const corsOptions = {
  origin: process.env.NODE_ENV === 'production' 
    ? process.env.ALLOWED_ORIGIN || 'http://localhost:5173'
    : ['http://localhost:5173', 'http://localhost:3000'],
  credentials: true,
  optionsSuccessStatus: 200
};

app.use(cors(corsOptions));
app.use(express.json({ limit: '1mb' }));

// Security headers
app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  next();
});

// Fetch with timeout
const fetchWithTimeout = async (url, options, timeout = CONFIG.REQUEST_TIMEOUT) => {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);
  
  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal
    });
    clearTimeout(timeoutId);
    return response;
  } catch (error) {
    clearTimeout(timeoutId);
    if (error.name === 'AbortError') {
      throw new Error('Request timeout - the model took too long to respond');
    }
    throw error;
  }
};

// Input validation
const validateChatRequest = (body) => {
  if (!body || typeof body !== 'object') {
    throw new Error('Invalid request body');
  }

  if (!body.provider || typeof body.provider !== 'string') {
    throw new Error('Invalid or missing provider');
  }

  if (!body.model || typeof body.model !== 'string') {
    throw new Error('Invalid or missing model');
  }

  if (!Array.isArray(body.messages)) {
    throw new Error('Messages must be an array');
  }

  if (body.messages.length === 0) {
    throw new Error('Messages array cannot be empty');
  }

  if (body.messages.length > CONFIG.MAX_MESSAGES) {
    throw new Error(`Too many messages (max ${CONFIG.MAX_MESSAGES})`);
  }

  // Validate message structure and size
  const totalSize = JSON.stringify(body.messages).length;
  if (totalSize > CONFIG.MAX_REQUEST_SIZE) {
    throw new Error('Request too large');
  }

  body.messages.forEach((msg, index) => {
    if (!msg || typeof msg !== 'object') {
      throw new Error(`Invalid message at index ${index}`);
    }
    if (!msg.role || typeof msg.role !== 'string') {
      throw new Error(`Missing or invalid role at message index ${index}`);
    }
    if (!msg.content || typeof msg.content !== 'string') {
      throw new Error(`Missing or invalid content at message index ${index}`);
    }
  });
};

const convertMessagesForAnthropic = (messages = []) => {
  let system = '';
  const converted = [];

  messages.forEach((message) => {
    if (!message) {
      return;
    }
    if (message.role === 'system') {
      system = system ? `${system}\n${message.content}` : message.content;
      return;
    }

    const role = message.role === 'assistant' ? 'assistant' : 'user';
    converted.push({
      role,
      content: [{ type: 'text', text: message.content ?? '' }],
    });
  });

  if (converted.length === 0) {
    converted.push({ role: 'user', content: [{ type: 'text', text: '' }] });
  }

  return { system: system || undefined, converted };
};

const convertMessagesForGemini = (messages = []) => {
  let systemInstruction = '';
  const contents = [];

  messages.forEach((message) => {
    if (!message) {
      return;
    }

    if (message.role === 'system') {
      systemInstruction = systemInstruction
        ? `${systemInstruction}\n${message.content}`
        : message.content;
      return;
    }

    const role = message.role === 'assistant' ? 'model' : 'user';
    contents.push({ role, parts: [{ text: message.content ?? '' }] });
  });

  if (contents.length === 0) {
    contents.push({ role: 'user', parts: [{ text: '' }] });
  }

  return { systemInstruction: systemInstruction || undefined, contents };
};

const providerConfigs = {
  groq: {
    name: 'Groq',
    envVar: 'VITE_GROQ_API_KEY',
    buildRequest: (apiKey, model, messages) => ({
      url: 'https://api.groq.com/openai/v1/chat/completions',
      options: {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({ 
          model, 
          messages, 
          temperature: CONFIG.TEMPERATURE, 
          max_tokens: CONFIG.MAX_TOKENS 
        }),
      },
      parse: (json) => json?.choices?.[0]?.message?.content?.trim() ?? '',
    }),
  },
  openai: {
    name: 'OpenAI',
    envVar: 'VITE_OPENAI_API_KEY',
    buildRequest: (apiKey, model, messages) => ({
      url: 'https://api.openai.com/v1/chat/completions',
      options: {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({ 
          model, 
          messages, 
          temperature: CONFIG.TEMPERATURE, 
          max_tokens: CONFIG.MAX_TOKENS 
        }),
      },
      parse: (json) => json?.choices?.[0]?.message?.content?.trim() ?? '',
    }),
  },
  anthropic: {
    name: 'Anthropic',
    envVar: 'VITE_ANTHROPIC_API_KEY',
    buildRequest: (apiKey, model, messages) => {
      const { system, converted } = convertMessagesForAnthropic(messages);
      return {
        url: 'https://api.anthropic.com/v1/messages',
        options: {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-api-key': apiKey,
            'anthropic-version': '2023-06-01',
          },
          body: JSON.stringify({
            model,
            max_tokens: CONFIG.MAX_TOKENS,
            system,
            messages: converted,
          }),
        },
        parse: (json) =>
          (json?.output_text ?? json?.content?.map((part) => part.text).join('\n') ?? '').trim(),
      };
    },
  },
  google: {
    name: 'Google',
    envVar: 'VITE_GOOGLE_API_KEY',
    buildRequest: (apiKey, model, messages) => {
      const { systemInstruction, contents } = convertMessagesForGemini(messages);
      const body = {
        contents,
        generationConfig: { 
          temperature: CONFIG.TEMPERATURE, 
          maxOutputTokens: CONFIG.MAX_TOKENS 
        },
      };
      if (systemInstruction) {
        body.systemInstruction = { parts: [{ text: systemInstruction }] };
      }
      return {
        url: `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
        options: {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        },
        parse: (json) =>
          (json?.candidates?.[0]?.content?.parts?.map((part) => part.text).join('\n') ?? '').trim(),
      };
    },
  },
};

app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok',
    cache: {
      size: responseCache.size,
      maxSize: CONFIG.MAX_CACHE_SIZE,
      ttl: CONFIG.CACHE_TTL
    }
  });
});

app.post('/api/cache/clear', (req, res) => {
  responseCache.clear();
  console.log('Cache cleared');
  res.json({ success: true, message: 'Cache cleared' });
});

app.post('/api/chat', async (req, res) => {
  const requestId = crypto.randomUUID();
  const startTime = Date.now();
  
  try {
    // Validate request
    validateChatRequest(req.body);
    
    const { provider, model, messages } = req.body;
    
    // Check cache first
    const cachedContent = responseCache.get(provider, model, messages);
    if (cachedContent) {
      const duration = Date.now() - startTime;
      console.log(`[${requestId}] Cache hit: ${provider}/${model} (${duration}ms)`);
      res.json({ content: cachedContent, cached: true });
    return;
  }
    
    console.log(`[${requestId}] Request: ${provider}/${model} (${messages.length} messages)`);

  const providerConfig = providerConfigs[provider];
  if (!providerConfig) {
      console.warn(`[${requestId}] Unsupported provider: ${provider}`);
    res.status(400).json({ error: `Unsupported provider: ${provider}` });
    return;
  }

  const apiKey = process.env[providerConfig.envVar];
  if (!apiKey) {
      console.warn(`[${requestId}] Missing API key for ${providerConfig.envVar}`);
      res.status(500).json({ 
        error: `API key not configured for ${providerConfig.name}. Please contact the administrator.` 
      });
    return;
  }

    // Build request
    const { url, options, parse } = providerConfig.buildRequest(apiKey, model, messages);
    
    // Make request with timeout
    const response = await fetchWithTimeout(url, options);

    if (!response.ok) {
      // Read response body once and safely
      let errorMessage = response.statusText || `Request failed with status ${response.status}`;
      try {
        const text = await response.text();
        // Try to parse as JSON if possible
        try {
          const json = JSON.parse(text);
          errorMessage = json.error || json.message || text || errorMessage;
        } catch {
          errorMessage = text || errorMessage;
        }
      } catch (readError) {
        console.error(`[${requestId}] Failed to read error response:`, readError);
        // Use default error message
      }
      
      // Provide user-friendly error messages
      if (response.status === 429) {
        errorMessage = 'Rate limit exceeded. Please try again in a moment.';
      } else if (response.status === 401 || response.status === 403) {
        errorMessage = 'Authentication error. Please check your API keys.';
      } else if (response.status === 404) {
        errorMessage = `Model "${model}" not found. Please select a different model.`;
      } else if (response.status === 500 || response.status === 502 || response.status === 503) {
        errorMessage = 'Service temporarily unavailable. Please try again in a moment.';
      }
      
      console.error(`[${requestId}] Provider error (${response.status}):`, errorMessage);
      res.status(response.status).json({ error: errorMessage });
      return;
    }

    // Only reach here if response.ok is true
    let json;
    try {
      json = await response.json();
    } catch (parseError) {
      console.error(`[${requestId}] Failed to parse response JSON:`, parseError);
      res.status(502).json({ error: 'Invalid response format from the model. Please try again.' });
      return;
    }
    const content = (parse ? parse(json) : '').trim();
    
    if (!content) {
      console.warn(`[${requestId}] Empty response from provider`);
      res.status(502).json({ error: 'Received an empty response from the model. Please try again.' });
      return;
    }

    const duration = Date.now() - startTime;
    console.log(`[${requestId}] Success in ${duration}ms (${content.length} chars)`);
    
    // Cache the response
    responseCache.set(provider, model, messages, content);

    res.json({ content });
  } catch (error) {
    const duration = Date.now() - startTime;
    console.error(`[${requestId}] Error after ${duration}ms:`, error.message);
    
    // Provide user-friendly error messages
    let errorMessage = error.message;
    if (error.message.includes('fetch failed') || error.message.includes('network')) {
      errorMessage = 'Network error. Please check your connection and try again.';
    } else if (error.message.includes('timeout')) {
      errorMessage = 'Request timeout. The model took too long to respond. Please try again.';
    }
    
    res.status(error.message.includes('Invalid') || error.message.includes('Missing') ? 400 : 500)
       .json({ error: errorMessage });
  }
});

// Validate environment on startup
const validateEnvironment = () => {
  console.log('🔍 Checking API key configuration...');
  
  const required = Object.entries(providerConfigs).map(([key, config]) => ({
    provider: key,
    name: config.name,
    envVar: config.envVar,
    hasKey: !!process.env[config.envVar]
  }));
  
  required.forEach(({ name, envVar, hasKey }) => {
    if (hasKey) {
      console.log(`  ✓ ${name} (${envVar})`);
    } else {
      console.warn(`  ⚠ ${name} (${envVar}) - Missing! This provider will not be available.`);
    }
  });
  
  const availableProviders = required.filter(p => p.hasKey).length;
  if (availableProviders === 0) {
    console.error('❌ ERROR: No API keys configured! Please add at least one API key to .env.local');
    console.error('   Example: VITE_GROQ_API_KEY=your_key_here');
  } else {
    console.log(`✓ ${availableProviders}/${required.length} providers configured\n`);
  }
};

validateEnvironment();

// Process error handlers for crash recovery
process.on('uncaughtException', (error) => {
  console.error('❌ Uncaught exception:', error);
  // Log to monitoring service (if configured)
  // Gracefully shutdown on critical errors
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ Unhandled rejection:', reason);
  // Log but don't crash - allow server to continue
});

app.listen(PORT, () => {
  console.log(`🚀 Server listening on http://localhost:${PORT}`);
  console.log(`   Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`   CORS: ${corsOptions.origin}`);
  console.log(`   Cache: ${CONFIG.MAX_CACHE_SIZE} entries, ${CONFIG.CACHE_TTL / 1000 / 60} min TTL`);
  console.log(`   Request timeout: ${CONFIG.REQUEST_TIMEOUT / 1000}s\n`);
});
