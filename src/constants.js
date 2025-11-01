// UI Constants
export const CANVAS_CONFIG = {
  WIDTH: 800,
  HEIGHT: 600,
};

// Code block languages
export const SCRIPT_LANGS = new Set(['', 'js', 'javascript', 'jsx', 'ts', 'tsx', 'typescript', 'p5js', 'p5', 'canvas']);
export const JS_LANGS = SCRIPT_LANGS;
export const HTML_LANGS = new Set(['html', 'htm', 'html5']);
export const STYLE_LANGS = new Set(['css', 'scss', 'sass']);

// Sample task
export const SAMPLE_TASK = `Firefly Simulation
• Runtime: js-canvas
• Animate 50 glowing dots that wander randomly but cluster occasionally (simple flocking).`;

// Flag labels for normalization
export const FLAG_LABELS = {
  extracted_html_tag: 'Extracted HTML from plain text',
  wrapped_body_in_html: 'Wrapped bare <body> in HTML scaffold',
  extracted_style_tag: 'Pulled CSS from <style> tag',
  extracted_inline_script: 'Pulled JS from inline <script>',
  extracted_plain_js: 'Recovered plain JavaScript section',
  composed_html_without_domparser: 'Rendered HTML without DOMParser',
  stripped_external_script_src: 'Removed external script reference',
  injected_base_style: 'Injected default page styling',
  preserved_style_tag: 'Preserved existing style tag',
  appended_additional_style_block: 'Appended extra style block',
  reinserted_inline_script: 'Reinserted inline script block',
  preserved_inline_script_block: 'Preserved inline script as-is',
  appended_additional_script_block: 'Appended extra script block',
  composed_js_without_dom: 'Rendered JS without DOM environment',
  injected_canvas: 'Injected default canvas element',
  injected_script_wrapper: 'Wrapped script in preview scaffold',
  auto_conversion_attempted: 'Auto browser rewrite attempted',
  auto_conversion_generated: 'Auto browser rewrite applied',
  auto_conversion_failed: 'Auto browser rewrite failed',
  extracted_direct_html: 'Extracted HTML code directly (no markdown wrapper)',
  extracted_direct_js: 'Extracted JavaScript code directly (no markdown wrapper)',
};

// Model options
export const modelOptions = [
  // Groq - strong coding/chat models
  {
    id: 'groq-llama-3.3-70b-versatile',
    label: 'Groq · LLaMA 3.3 70B Versatile',
    provider: 'groq',
    apiModel: 'llama-3.3-70b-versatile',
  },
  {
    id: 'groq-llama-3.1-8b-instant',
    label: 'Groq · LLaMA 3.1 8B Instant',
    provider: 'groq',
    apiModel: 'llama-3.1-8b-instant',
  },
  {
    id: 'groq-compound',
    label: 'Groq · Compound',
    provider: 'groq',
    apiModel: 'groq/compound',
  },
  {
    id: 'groq-compound-mini',
    label: 'Groq · Compound Mini',
    provider: 'groq',
    apiModel: 'groq/compound-mini',
  },
  {
    id: 'groq-gpt-oss-120b',
    label: 'Groq · GPT OSS 120B',
    provider: 'groq',
    apiModel: 'openai/gpt-oss-120b',
  },
  {
    id: 'groq-gpt-oss-20b',
    label: 'Groq · GPT OSS 20B',
    provider: 'groq',
    apiModel: 'openai/gpt-oss-20b',
  },
  {
    id: 'groq-llama-4-maverick',
    label: 'Groq · LLaMA 4 Maverick 17B (Preview)',
    provider: 'groq',
    apiModel: 'meta-llama/llama-4-maverick-17b-128e-instruct',
  },
  {
    id: 'groq-llama-4-scout',
    label: 'Groq · LLaMA 4 Scout 17B (Preview)',
    provider: 'groq',
    apiModel: 'meta-llama/llama-4-scout-17b-16e-instruct',
  },
  {
    id: 'groq-kimi-k2',
    label: 'Groq · Kimi K2 (Preview)',
    provider: 'groq',
    apiModel: 'moonshotai/kimi-k2-instruct',
  },
  {
    id: 'groq-kimi-k2-0905',
    label: 'Groq · Kimi K2 0905 (Preview)',
    provider: 'groq',
    apiModel: 'moonshotai/kimi-k2-instruct-0905',
  },
  {
    id: 'groq-qwen3-32b',
    label: 'Groq · Qwen 3 32B (Preview)',
    provider: 'groq',
    apiModel: 'qwen/qwen3-32b',
  },
  // OpenAI - multimodal/chat models suitable for coding
  {
    id: 'openai-gpt-4.1',
    label: 'OpenAI · GPT-4.1',
    provider: 'openai',
    apiModel: 'gpt-4.1',
  },
  {
    id: 'openai-gpt-4.1-mini',
    label: 'OpenAI · GPT-4.1 Mini',
    provider: 'openai',
    apiModel: 'gpt-4.1-mini',
  },
  {
    id: 'openai-o3',
    label: 'OpenAI · o3 (Reasoning)',
    provider: 'openai',
    apiModel: 'o3',
  },
  {
    id: 'openai-o4-mini',
    label: 'OpenAI · o4 Mini (Fast Reasoning)',
    provider: 'openai',
    apiModel: 'o4-mini',
  },
  {
    id: 'openai-gpt-5-chat-latest',
    label: 'OpenAI · GPT-5 Chat (Latest)',
    provider: 'openai',
    apiModel: 'gpt-5-chat-latest',
  },
  {
    id: 'openai-gpt-4o',
    label: 'OpenAI · GPT-4o',
    provider: 'openai',
    apiModel: 'gpt-4o',
  },
  {
    id: 'openai-gpt-4o-mini',
    label: 'OpenAI · GPT-4o Mini',
    provider: 'openai',
    apiModel: 'gpt-4o-mini',
  },
  // Anthropic - Claude coding/chat tiers
  {
    id: 'anthropic-claude-opus-4-1',
    label: 'Anthropic · Claude Opus 4.1',
    provider: 'anthropic',
    apiModel: 'claude-opus-4-1',
  },
  {
    id: 'anthropic-claude-sonnet-4-5',
    label: 'Anthropic · Claude Sonnet 4.5',
    provider: 'anthropic',
    apiModel: 'claude-sonnet-4-5',
  },
  {
    id: 'anthropic-claude-sonnet-3-7',
    label: 'Anthropic · Claude Sonnet 3.7',
    provider: 'anthropic',
    apiModel: 'claude-3-7-sonnet-20250219',
  },
  {
    id: 'anthropic-claude-haiku-3-5',
    label: 'Anthropic · Claude Haiku 3.5',
    provider: 'anthropic',
    apiModel: 'claude-3-5-haiku-20241022',
  },
  // Google Gemini - chat tiers
  {
    id: 'google-gemini-2.5-pro',
    label: 'Google · Gemini 2.5 Pro',
    provider: 'google',
    apiModel: 'gemini-2.5-pro',
  },
  {
    id: 'google-gemini-2.5-flash',
    label: 'Google · Gemini 2.5 Flash',
    provider: 'google',
    apiModel: 'gemini-2.5-flash',
  },
  {
    id: 'google-gemini-2.5-flash-lite',
    label: 'Google · Gemini 2.5 Flash Lite',
    provider: 'google',
    apiModel: 'gemini-2.5-flash-lite',
  },
];

export const modelOptionMap = Object.fromEntries(modelOptions.map((option) => [option.id, option]));


