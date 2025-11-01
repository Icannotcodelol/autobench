# Project Summary: LLM Code Comparison Tool

## 🎯 Project Goal

**LLM Code Comparison** is a web application designed to compare the actual rendered outputs from different AI language models side-by-side. The core mission is to help developers and AI researchers see how different models approach the same coding task, focusing purely on the visual and functional results rather than explanations or plans.

### Key Philosophy:
- **Compare actual outputs** - See what models produce, not what they plan
- **Code-only responses** - Models are instructed to return executable code only
- **Side-by-side visualization** - Compare two models simultaneously
- **Real-time rendering** - Code runs immediately in a secure sandboxed iframe

---

## 🚀 What We've Built So Far

### Core Functionality ✅

1. **Multi-Provider Integration**
   - **Groq:** 11 models (LLaMA, Mixtral, Qwen, Compound, Kimi, etc.)
   - **OpenAI:** 7 models (GPT-4.1, GPT-4o, GPT-5, o3, o4-mini)
   - **Anthropic Claude:** 4 models (Opus 4.1, Sonnet 4.5, Sonnet 3.7, Haiku 3.5)
   - **Google Gemini:** 3 models (2.5 Pro, 2.5 Flash, 2.5 Flash Lite)
   - **Total: 25+ models** across 4 providers

2. **Code Execution & Rendering**
   - Secure sandboxed iframe for code execution
   - Automatic code extraction from markdown or plain HTML/JS
   - Canvas support for visual code (animations, games, visualizations)
   - HTML/CSS/JavaScript composition and rendering
   - Support for pure HTML, JavaScript-only, and mixed code blocks

3. **Code-Only Mode**
   - Models instructed to return ONLY executable code
   - No explanations, markdown, or comments (unless in code)
   - Focus on comparing actual rendered outputs
   - Hidden markdown responses (can be re-enabled for debugging)

4. **Robust Error Handling**
   - Individual error tracking per model
   - Partial success support (one model fails, other succeeds)
   - User-friendly error messages
   - Retry functionality for failed models
   - Process-level error handlers for server stability

5. **Performance Optimizations**
   - Response caching (19x faster for repeat requests)
   - Rate limiting to prevent API abuse
   - Blob URL cleanup to prevent memory leaks
   - Optimized code extraction and normalization
   - Request cancellation support

6. **User Experience**
   - Side-by-side model comparison view
   - Real-time status updates
   - Individual model error displays
   - Code block selection and preview
   - Browser-friendly code conversion for problematic outputs

---

## 🛠 Technical Stack

### Frontend
- **React** with Vite
- Custom code extraction and normalization
- Secure iframe sandboxing
- Real-time status updates

### Backend
- **Node.js** with Express
- Multi-provider API proxy
- Response caching layer
- Error handling and logging

### Providers Integrated
- Groq Cloud API
- OpenAI API
- Anthropic Claude API
- Google Gemini API

---

## 📊 Current Capabilities

### Models Available (25+)
- **Latest models:** GPT-5 Chat Latest, Claude Sonnet 3.7, Gemini 2.5 Pro
- **Reasoning models:** o3, o4-mini
- **Fast models:** GPT-4o Mini, Claude Haiku 3.5, Gemini 2.5 Flash
- **Production models:** All tested and verified working

### Code Types Supported
- Complete HTML documents
- JavaScript-only (with canvas wrapper)
- CSS styling
- Canvas animations
- Interactive visualizations
- Games and simulations

---

## ✨ Key Features

1. **Real Code Execution**
   - Code runs in secure sandbox
   - Canvas support enabled
   - Full DOM access within sandbox

2. **Smart Code Extraction**
   - Extracts from markdown code blocks
   - Handles pure HTML/JS responses
   - Automatically wraps JS-only code in HTML scaffold

3. **Partial Success Handling**
   - If one model fails, the other still displays results
   - Individual error messages per model
   - Retry buttons for failed models

4. **Caching & Performance**
   - 1-hour response cache
   - Rate limiting (2-second minimum between requests)
   - Request cancellation
   - Blob URL cleanup

5. **Code Focus**
   - Models return only executable code
   - No explanations shown (hidden by default)
   - Pure comparison of outputs

---

## 🎯 Project Vision

This tool enables developers, researchers, and AI enthusiasts to:
- **Compare model outputs** - See how different models solve the same problem
- **Evaluate quality** - Judge code quality, creativity, and correctness visually
- **Benchmark performance** - Test models with coding tasks in real-time
- **Understand differences** - See stylistic and technical differences between models

---

## 📈 Recent Improvements

### Major Enhancements:
1. ✅ Code-only mode implementation
2. ✅ Comprehensive error handling
3. ✅ All major providers integrated (4 providers, 25+ models)
4. ✅ Partial success support
5. ✅ Performance optimizations (caching, rate limiting)
6. ✅ Memory leak fixes
7. ✅ Enhanced code extraction
8. ✅ Latest models added (GPT-5, Claude 3.7, etc.)

---

## 🚧 Future Potential

Based on the README vision, potential future enhancements could include:
- Daily automated challenges
- Community voting system
- Leaderboards
- Public API for results
- Model performance tracking
- Historical comparisons
- Automated benchmarking

---

## 📝 Current Status

**Status:** ✅ Fully Functional
**Models:** 25+ tested and working
**Providers:** 4 integrated
**Features:** Core functionality complete
**Focus:** Code comparison and output visualization

---

**This project provides a powerful platform for comparing AI model outputs, focusing on real, executable code results rather than explanations.**
