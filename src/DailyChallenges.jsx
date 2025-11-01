import { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import './DailyChallenges.css';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseAnonKey);

const CATEGORIES = {
  animations: { emoji: '🎬', label: 'Animations' },
  interactive: { emoji: '🎮', label: 'Interactive' },
  ui: { emoji: '🎨', label: 'UI/UX' }
};

// Generate a simple user fingerprint for anonymous voting
const getUserId = () => {
  let userId = localStorage.getItem('user_fingerprint');
  if (!userId) {
    userId = `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    localStorage.setItem('user_fingerprint', userId);
  }
  return userId;
};

export default function DailyChallenges() {
  // Category tabs
  const [activeCategory, setActiveCategory] = useState('animations');
  const [challenges, setChallenges] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Per-category state
  const [userVotes, setUserVotes] = useState({});
  const [promptExpanded, setPromptExpanded] = useState({});

  // Battle mode state (per category)
  const [currentBattle, setCurrentBattle] = useState({});
  const [availableModels, setAvailableModels] = useState({});
  const [eliminatedModels, setEliminatedModels] = useState({});
  const [battleComplete, setBattleComplete] = useState({});
  const [winner, setWinner] = useState({});
  
  const userId = getUserId();

  // Fetch all 3 challenges
  const fetchChallenges = async () => {
    setLoading(true);
    setError('');

    try {
      const { data, error: fetchError } = await supabase
        .from('latest_challenge')
        .select('*');

      if (fetchError) {
        if (fetchError.code === 'PGRST116') {
          setError('No challenges available for today yet. Check back later!');
        } else {
          throw fetchError;
        }
        return;
      }

      if (!data || data.length === 0) {
        setError('No challenges available for today yet. Check back later!');
        return;
      }

      // Organize challenges by category
      const challengesByCategory = {};
      for (const challenge of data) {
        challengesByCategory[challenge.challenge_category] = challenge;
      }
      
      setChallenges(challengesByCategory);

      // Load user's votes for all responses
      const allResponses = data.flatMap(c => c.model_responses || []);
      if (allResponses.length > 0) {
        const responseIds = allResponses.map(r => r.id);
        const { data: votes } = await supabase
          .from('votes')
          .select('response_id, vote_type')
          .in('response_id', responseIds)
          .eq('user_id', userId);

        const votesMap = {};
        votes?.forEach(vote => {
          votesMap[vote.response_id] = vote.vote_type;
        });
        setUserVotes(votesMap);
      }

      // Initialize battle mode for each category
      const newBattles = {};
      const newAvailable = {};
      const newEliminated = {};
      const newComplete = {};
      const newWinners = {};
      const newExpanded = {};

      for (const [category, challenge] of Object.entries(challengesByCategory)) {
        const completedResponses = (challenge.model_responses || []).filter(r => r.status === 'completed');
        
        if (completedResponses.length >= 2) {
          const shuffled = [...completedResponses].sort(() => Math.random() - 0.5);
          newBattles[category] = [shuffled[0], shuffled[1]];
          newAvailable[category] = shuffled.slice(2);
          newEliminated[category] = [];
          newComplete[category] = false;
          newWinners[category] = null;
        } else {
          newBattles[category] = [null, null];
          newAvailable[category] = [];
          newEliminated[category] = [];
          newComplete[category] = false;
          newWinners[category] = null;
        }
        
        newExpanded[category] = false;
      }

      setCurrentBattle(newBattles);
      setAvailableModels(newAvailable);
      setEliminatedModels(newEliminated);
      setBattleComplete(newComplete);
      setWinner(newWinners);
      setPromptExpanded(newExpanded);

    } catch (err) {
      console.error('Error fetching challenges:', err);
      setError('Failed to load today\'s challenges. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Handle battle selection for a specific category
  const handleBattleChoice = async (category, winnerResponse, loserResponse) => {
    try {
      const battleId = `${userId}_battle_${Date.now()}_${Math.random()}`;
      
      await Promise.all([
        supabase.from('votes').insert({
          response_id: winnerResponse.id,
          user_id: battleId,
          vote_type: 'upvote'
        }),
        supabase.from('votes').insert({
          response_id: loserResponse.id,
          user_id: battleId,
          vote_type: 'downvote'
        })
      ]);

      // Update vote counts optimistically
      setChallenges(prev => ({
        ...prev,
        [category]: {
          ...prev[category],
          model_responses: prev[category].model_responses.map(response => {
            if (response.id === winnerResponse.id) {
              return { ...response, vote_count: (response.vote_count || 0) + 1 };
            }
            if (response.id === loserResponse.id) {
              return { ...response, vote_count: (response.vote_count || 0) - 1 };
            }
            return response;
          })
        }
      }));

      // Update battle state for this category
      setEliminatedModels(prev => ({
        ...prev,
        [category]: [...(prev[category] || []), loserResponse]
      }));

      const available = availableModels[category] || [];
      if (available.length > 0) {
        const nextChallenger = available[0];
        setCurrentBattle(prev => ({
          ...prev,
          [category]: [winnerResponse, nextChallenger]
        }));
        setAvailableModels(prev => ({
          ...prev,
          [category]: available.slice(1)
        }));
      } else {
        setBattleComplete(prev => ({ ...prev, [category]: true }));
        setWinner(prev => ({ ...prev, [category]: winnerResponse }));
      }
    } catch (err) {
      console.error('Error in battle:', err);
      alert('Failed to register choice. Please try again.');
    }
  };

  // Subscribe to real-time updates
  useEffect(() => {
    fetchChallenges();

    const channel = supabase
      .channel('challenge-updates')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'model_responses'
        },
        (payload) => {
          console.log('Model response updated:', payload);
          fetchChallenges();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  // Render loading state
  if (loading) {
    return (
      <div className="daily-challenges">
        <div className="challenge-header">
          <h1>🏆 Daily Code Challenges</h1>
          <p>Loading today's challenges...</p>
        </div>
      </div>
    );
  }

  // Render error state
  if (error || Object.keys(challenges).length === 0) {
    return (
      <div className="daily-challenges">
        <div className="challenge-header">
          <h1>🏆 Daily Code Challenges</h1>
          <p className="error">{error || 'No challenges available'}</p>
        </div>
      </div>
    );
  }

  const challenge = challenges[activeCategory];
  if (!challenge) {
    return (
      <div className="daily-challenges">
        <div className="challenge-header">
          <h1>🏆 Daily Code Challenges</h1>
          <p className="error">Challenge not available for this category</p>
        </div>
      </div>
    );
  }

  const responses = challenge.model_responses || [];
  const completedCount = responses.filter(r => r.status === 'completed').length;
  const [leftModel, rightModel] = currentBattle[activeCategory] || [null, null];
  const isComplete = battleComplete[activeCategory];
  const categoryWinner = winner[activeCategory];
  const eliminated = eliminatedModels[activeCategory] || [];
  const available = availableModels[activeCategory] || [];
  const expanded = promptExpanded[activeCategory];

  // Render battle complete screen
  if (isComplete && categoryWinner) {
    const rankedModels = [...eliminated].reverse();
    rankedModels.unshift(categoryWinner);

    return (
      <div className="daily-challenges">
        <div className="challenge-header">
          <h1>🏆 Battle Complete!</h1>
          <div className="category-tabs">
            {Object.entries(CATEGORIES).map(([cat, { emoji, label }]) => (
              <button
                key={cat}
                className={`category-tab ${activeCategory === cat ? 'active' : ''}`}
                onClick={() => setActiveCategory(cat)}
              >
                {emoji} {label}
              </button>
            ))}
          </div>
        </div>

        <div className="battle-winner">
          <h2>🥇 Winner: {categoryWinner.model_id}</h2>
          <p className="provider-badge">{categoryWinner.model_provider}</p>
          <div className="winner-preview">
            <iframe
              srcDoc={categoryWinner.response_code}
              sandbox="allow-scripts allow-same-origin allow-popups allow-forms"
              title={`Winner: ${categoryWinner.model_id}`}
            />
          </div>
          <div className="winner-stats">
            <span>⚡ {categoryWinner.execution_time_ms}ms</span>
            <span>🗳️ {categoryWinner.vote_count || 0} votes</span>
          </div>
        </div>

        <div className="battle-ranking">
          <h3>Final Ranking</h3>
          <ol>
            {rankedModels.map((model, index) => (
              <li key={model.id} className={index === 0 ? 'rank-winner' : ''}>
                <span className="rank-number">#{index + 1}</span>
                <span className="rank-model">{model.model_id}</span>
                <span className="rank-provider">{model.model_provider}</span>
                <span className="rank-votes">{model.vote_count || 0} votes</span>
              </li>
            ))}
          </ol>
        </div>

        <button className="restart-battle-btn" onClick={() => window.location.reload()}>
          🔄 Start New Battle
        </button>
      </div>
    );
  }

  // Render battle in progress
  if (completedCount >= 2 && leftModel && rightModel) {
    const totalRounds = responses.filter(r => r.status === 'completed').length - 1;
    const currentRound = eliminated.length + 1;

    return (
      <div className="daily-challenges">
        <div className="challenge-header">
          <h1>⚔️ Battle Mode</h1>
          <div className="category-tabs">
            {Object.entries(CATEGORIES).map(([cat, { emoji, label }]) => (
              <button
                key={cat}
                className={`category-tab ${activeCategory === cat ? 'active' : ''}`}
                onClick={() => setActiveCategory(cat)}
              >
                {emoji} {label}
              </button>
            ))}
          </div>
          <div className="battle-progress">
            <span className="round-counter">Round {currentRound} of {totalRounds}</span>
            <span className="remaining">
              {available.length + 1} models remaining
            </span>
          </div>
        </div>

        <div className="challenge-prompt">
          <button 
            className="prompt-toggle"
            onClick={() => setPromptExpanded(prev => ({ ...prev, [activeCategory]: !prev[activeCategory] }))}
          >
            <h2>Challenge {expanded ? '▼' : '▶'}</h2>
          </button>
          {expanded && (
            <div className="prompt-text">
              <ReactMarkdown remarkPlugins={[remarkGfm]}>{challenge.prompt_text}</ReactMarkdown>
            </div>
          )}
        </div>

        <div className="battle-arena">
          <div className="battle-card">
            <div className="battle-card-header">
              <h3>{leftModel.model_id}</h3>
              <span className="provider">{leftModel.model_provider}</span>
            </div>
            <div className="battle-preview">
              <iframe
                srcDoc={leftModel.response_code}
                sandbox="allow-scripts allow-same-origin allow-popups allow-forms"
                title={`Battle: ${leftModel.model_id}`}
              />
            </div>
            <div className="battle-meta">
              <span className="execution-time">⚡ {leftModel.execution_time_ms}ms</span>
            </div>
            <button 
              className="battle-choose-btn"
              onClick={() => handleBattleChoice(activeCategory, leftModel, rightModel)}
            >
              Choose This
            </button>
            <details className="code-details-battle">
              <summary>📄 View Code</summary>
              <pre className="code-display">{leftModel.response_code}</pre>
            </details>
          </div>

          <div className="battle-vs">VS</div>

          <div className="battle-card">
            <div className="battle-card-header">
              <h3>{rightModel.model_id}</h3>
              <span className="provider">{rightModel.model_provider}</span>
            </div>
            <div className="battle-preview">
              <iframe
                srcDoc={rightModel.response_code}
                sandbox="allow-scripts allow-same-origin allow-popups allow-forms"
                title={`Battle: ${rightModel.model_id}`}
              />
            </div>
            <div className="battle-meta">
              <span className="execution-time">⚡ {rightModel.execution_time_ms}ms</span>
            </div>
            <button 
              className="battle-choose-btn"
              onClick={() => handleBattleChoice(activeCategory, rightModel, leftModel)}
            >
              Choose This
            </button>
            <details className="code-details-battle">
              <summary>📄 View Code</summary>
              <pre className="code-display">{rightModel.response_code}</pre>
            </details>
          </div>
        </div>

        {eliminated.length > 0 && (
          <div className="eliminated-section">
            <h4>Eliminated: {eliminated.map(m => m.model_id).join(', ')}</h4>
          </div>
        )}
      </div>
    );
  }

  // Fallback: waiting for models
  return (
    <div className="daily-challenges">
      <div className="challenge-header">
        <h1>🏆 Daily Code Challenges</h1>
        <div className="category-tabs">
          {Object.entries(CATEGORIES).map(([cat, { emoji, label }]) => (
            <button
              key={cat}
              className={`category-tab ${activeCategory === cat ? 'active' : ''}`}
              onClick={() => setActiveCategory(cat)}
            >
              {emoji} {label}
            </button>
          ))}
        </div>
        <div className="challenge-meta">
          <span className="status">
            {completedCount}/{responses.length} models completed
            {completedCount < 2 && ' (waiting for at least 2...)'}
          </span>
        </div>
      </div>

      {responses.length === 0 && (
        <div className="no-responses">
          <p>No model responses yet. Challenge is being evaluated...</p>
        </div>
      )}

      {completedCount > 0 && completedCount < 2 && (
        <div className="no-responses">
          <p>Waiting for at least 2 models to complete before starting battle mode...</p>
          <p>{completedCount}/2 ready</p>
        </div>
      )}
    </div>
  );
}
