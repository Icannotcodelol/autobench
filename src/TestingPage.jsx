import { useState } from 'react';
import { createClient } from '@supabase/supabase-js';
import './TestingPage.css';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseAnonKey);

export default function TestingPage() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');

  const triggerChallenge = async () => {
    setLoading(true);
    setError('');
    setResult(null);

    try {
      const { data, error: rpcError } = await supabase.rpc('trigger_challenge_generation');

      if (rpcError) {
        throw rpcError;
      }

      setResult(data);
      
      // Show success message
      setTimeout(() => {
        window.location.href = '/daily';
      }, 3000);

    } catch (err) {
      console.error('Error triggering challenge:', err);
      setError(err.message || 'Failed to trigger challenge generation');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="testing-page">
      <div className="testing-container">
        <h1>🧪 Testing Dashboard</h1>
        <p>Manually trigger 3 new daily challenges (🎬 Animations, 🎮 Interactive, 🎨 UI) for testing purposes.</p>

        <div className="testing-actions">
          <button
            className="trigger-btn"
            onClick={triggerChallenge}
            disabled={loading}
          >
            {loading ? 'Generating 3 Challenges...' : '🚀 Generate 3 New Challenges'}
          </button>
        </div>

        {error && (
          <div className="message error">
            ❌ Error: {error}
          </div>
        )}

        {result && (
          <div className="message success">
            ✅ Success! Challenge generation triggered.
            <br />
            <small>Request ID: {result.request_id}</small>
            <br />
            <small>Redirecting to daily challenges page...</small>
          </div>
        )}

        <div className="testing-info">
          <h3>What this does:</h3>
          <ol>
            <li>Calls the <code>trigger_challenge_generation()</code> database function</li>
            <li>Edge Function generates 3 coding prompts (one per category) using GPT-4o</li>
            <li>Each prompt is stored with its category (animations, interactive, ui)</li>
            <li>All 8 evaluation models receive all 3 prompts (24 total evaluations)</li>
            <li>Results appear on the Daily Challenges page with 3 tabs</li>
          </ol>

          <h3>⚠️ Note:</h3>
          <p>This will create a new challenge even if one already exists for today. The automatic scheduler runs at 2pm Berlin time daily.</p>
        </div>

        <div className="testing-links">
          <a href="/daily">← Back to Daily Challenges</a>
          <a href="/">← Back to Model Comparison</a>
        </div>
      </div>
    </div>
  );
}

