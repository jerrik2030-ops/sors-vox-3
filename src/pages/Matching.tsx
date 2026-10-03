import { useEffect, useState, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStore, Match } from '../store';
import { 
  Globe, 
  X, 
  Check, 
  Sparkles, 
  Flame, 
  Users, 
  MessageSquare, 
  Zap, 
  Plus, 
  Compass, 
  ArrowRight,
  TrendingUp
} from 'lucide-react';
import { cn } from '../lib/utils';
import { socket } from '../lib/socket';
import { 
  TOPIC_ICEBREAKERS, 
  INTEREST_CATEGORIES, 
  getIcebreakerForTopics 
} from '../lib/interestsData';

// Simulated suggested peers that appear on the match radar based on user interests
const SIMULATED_RADAR_PEERS = [
  { username: 'Marcus', country: 'CA', flag: '🇨🇦', tags: ['PC Gaming', 'Software Engineering', 'Sci-Fi & Fantasy'], affinity: 96 },
  { username: 'Elena', country: 'DE', flag: '🇩🇪', tags: ['Deep Conversations', 'Philosophy & Ethics', 'Cinema & Film'], affinity: 94 },
  { username: 'Kenji', country: 'JP', flag: '🇯🇵', tags: ['Artificial Intelligence', 'Anime & Manga', 'Indie Games'], affinity: 92 },
  { username: 'Amara', country: 'GB', flag: '🇬🇧', tags: ['Music & Audio', 'Travel & Backpacking', 'Digital Art & Design'], affinity: 90 },
  { username: 'Lucas', country: 'BR', flag: '🇧🇷', tags: ['PC Gaming', 'Multiplayer & FPS', 'Startups & Tech'], affinity: 95 },
  { username: 'Sofia', country: 'ES', flag: '🇪🇸', tags: ['Space & Astronomy', 'Physics & Math', 'Books & Literature'], affinity: 93 },
];

export function Matching() {
  const navigate = useNavigate();
  const { 
    user, 
    updateUser, 
    startMatching, 
    stopMatching, 
    setMatch, 
    setSelectedIcebreaker 
  } = useStore();

  const [waitingContent, setWaitingContent] = useState({ 
    type: 'THOUGHT', 
    text: 'Connecting to global community...' 
  });
  const [waitTime, setWaitTime] = useState(0);
  const [isFound, setIsFound] = useState(false);
  const [foundMatch, setFoundMatch] = useState<Match | null>(null);
  const [focusedTopic, setFocusedTopic] = useState<string | null>(null);
  const [activeIcebreakerIndex, setActiveIcebreakerIndex] = useState(0);
  const [armedIcebreaker, setArmedIcebreaker] = useState<string>('');

  const userInterests = useMemo(() => {
    return user?.interests && user.interests.length > 0 
      ? user.interests 
      : ['Casual Chat', 'Deep Conversations'];
  }, [user?.interests]);

  // Suggested icebreakers tailored to the user's active interests
  const suggestedIcebreakers = useMemo(() => {
    const list: string[] = [];
    userInterests.forEach(topic => {
      if (TOPIC_ICEBREAKERS[topic]) {
        list.push(...TOPIC_ICEBREAKERS[topic]);
      }
    });

    if (list.length === 0) {
      list.push(
        'What has been the highlight of your week so far?',
        'If you could master any skill overnight, what would it be?',
        'What is a topic you could talk about for hours without stopping?'
      );
    }
    // Return up to 4 unique prompts
    return Array.from(new Set(list)).slice(0, 4);
  }, [userInterests]);

  // Current armed icebreaker defaults to first suggested
  useEffect(() => {
    if (suggestedIcebreakers.length > 0 && !armedIcebreaker) {
      setArmedIcebreaker(suggestedIcebreakers[0]);
      setSelectedIcebreaker(suggestedIcebreakers[0]);
    }
  }, [suggestedIcebreakers, armedIcebreaker, setSelectedIcebreaker]);

  // Find related topics to suggest for expanding match pool
  const suggestedComplementaryTopics = useMemo(() => {
    const suggestions: string[] = [];
    // Scan categories that contain user's current interests
    for (const cat of INTEREST_CATEGORIES) {
      const hasTopic = cat.topics.some(t => userInterests.includes(t));
      if (hasTopic) {
        for (const t of cat.topics) {
          if (!userInterests.includes(t) && !suggestions.includes(t)) {
            suggestions.push(t);
            if (suggestions.length >= 3) break;
          }
        }
      }
      if (suggestions.length >= 3) break;
    }
    return suggestions.slice(0, 3);
  }, [userInterests]);

  // Suggested potential match radar tailored to user interests
  const radarSuggestedMatches = useMemo(() => {
    return SIMULATED_RADAR_PEERS.map(peer => {
      const shared = peer.tags.filter(t => userInterests.includes(t));
      const calculatedScore = shared.length > 0 
        ? Math.min(99, 82 + shared.length * 6)
        : Math.floor(70 + Math.random() * 10);
      return {
        ...peer,
        sharedTags: shared.length > 0 ? shared : [peer.tags[0]],
        affinity: calculatedScore
      };
    }).sort((a, b) => b.affinity - a.affinity).slice(0, 3);
  }, [userInterests]);

  // Fetch rotating jokes, facts, and quotes
  const fetchContent = useCallback(async () => {
    try {
      const types = ['FACT', 'JOKE', 'THOUGHT'];
      const randomType = types[Math.floor(Math.random() * types.length)];
      
      let text = '';
      if (randomType === 'FACT') {
        const res = await fetch('https://uselessfacts.jsph.pl/api/v2/facts/random');
        const data = await res.json();
        text = data.text;
      } else if (randomType === 'JOKE') {
        const res = await fetch('https://v2.jokeapi.dev/joke/Any?safe-mode');
        const data = await res.json();
        if (data.type === 'single') {
          text = data.joke;
        } else {
          text = `${data.setup} ... ${data.delivery}`;
        }
      } else {
        const res = await fetch('https://dummyjson.com/quotes/random');
        const data = await res.json();
        text = data.quote;
      }
      
      if (text) {
        setWaitingContent({ type: randomType, text });
      }
    } catch (err) {
      console.error("Failed to fetch waiting content", err);
    }
  }, []);

  // Quick add a recommended topic directly while in queue
  const handleAddTopic = (topic: string) => {
    if (!user) return;
    const newInterests = [...userInterests, topic];
    updateUser({ interests: newInterests });
    // Update queue payload on server
    socket.emit('update_interests', { interests: newInterests });
  };

  // Toggle preferred focus topic
  const handleToggleFocus = (topic: string) => {
    const nextTopic = focusedTopic === topic ? null : topic;
    setFocusedTopic(nextTopic);
    socket.emit('update_focus', { preferredTopic: nextTopic });
  };

  useEffect(() => {
    if (!user) return;
    
    if (!socket.connected) {
      socket.connect();
    }
    
    startMatching();
    socket.emit('join_queue', {
      ...user,
      preferredTopic: focusedTopic
    });
    
    const onMatched = (matchData: Match) => {
      setFoundMatch(matchData);
      setIsFound(true);
      
      // Arm the icebreaker if provided by server, else keep selected
      if (matchData.icebreaker) {
        setSelectedIcebreaker(matchData.icebreaker);
      }
      
      setTimeout(() => {
        setMatch(matchData);
        navigate('/chat');
      }, 2500);
    };
    
    socket.on('matched', onMatched);
    
    fetchContent();
    const contentInterval = setInterval(fetchContent, 8000);
    
    const timeInterval = setInterval(() => {
      setWaitTime(t => t + 1);
    }, 1000);

    return () => {
      clearInterval(contentInterval);
      clearInterval(timeInterval);
      socket.off('matched', onMatched);
      if (!isFound) {
        socket.emit('leave_queue');
      }
    };
  }, [fetchContent, focusedTopic, isFound, navigate, setMatch, setSelectedIcebreaker, startMatching, user]);

  const handleCancel = () => {
    socket.emit('leave_queue');
    stopMatching();
    navigate('/');
  };

  return (
    <div className="flex-1 flex flex-col justify-start items-center max-w-4xl mx-auto w-full py-4 sm:py-6 px-3 sm:px-6 relative h-full">
      
      {!isFound ? (
        <div className="flex flex-col items-center w-full space-y-6 animate-in fade-in duration-300">
          
          {/* Top Status & Search Radar Animation */}
          <div className="flex flex-col items-center text-center">
            <div className="relative flex justify-center items-center w-24 h-24 mb-4">
              <div className="absolute inset-0 border-4 border-neutral-200/60 rounded-full animate-ping opacity-60"></div>
              <div className="absolute inset-3 border-4 border-neutral-300/40 rounded-full animate-ping opacity-40 animation-delay-300"></div>
              <div className="bg-black text-white rounded-full w-16 h-16 flex items-center justify-center z-10 shadow-xl ring-4 ring-white">
                <Globe className="w-8 h-8 animate-spin-slow text-neutral-100" />
              </div>
            </div>

            <div className="inline-flex items-center space-x-2 bg-neutral-100 text-neutral-700 text-xs font-bold px-3 py-1 rounded-full mb-2 border border-neutral-200">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              <span>Scanning Talkers Worldwide • {waitTime}s</span>
            </div>

            <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-neutral-900">
              Finding Your Best Match
            </h2>
            <p className="text-neutral-500 text-xs sm:text-sm font-medium mt-1 max-w-md">
              Filtering peers based on mutual interests for higher chemistry and deeper conversations.
            </p>
          </div>

          {/* ACTIVE INTERESTS BAR & TOPIC FOCUS */}
          <div className="w-full bg-white p-4 sm:p-5 rounded-3xl border border-neutral-200 shadow-sm">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
              <div className="flex items-center space-x-2">
                <Flame className="w-4 h-4 text-amber-500" />
                <span className="text-xs font-black uppercase tracking-wider text-neutral-700">
                  Matching on Your Interests ({userInterests.length})
                </span>
              </div>
              <span className="text-[11px] text-neutral-400 font-medium">
                Tap any tag to prioritize that specific topic
              </span>
            </div>

            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => setFocusedTopic(null)}
                className={cn(
                  "px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center space-x-1.5",
                  focusedTopic === null
                    ? "bg-black text-white shadow-sm"
                    : "bg-neutral-100 text-neutral-600 hover:bg-neutral-200"
                )}
              >
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                <span>All Interests (Balanced)</span>
              </button>

              {userInterests.map(interest => {
                const isFocused = focusedTopic === interest;
                return (
                  <button
                    key={interest}
                    type="button"
                    onClick={() => handleToggleFocus(interest)}
                    className={cn(
                      "px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center space-x-1.5",
                      isFocused
                        ? "bg-amber-500 text-black ring-2 ring-amber-400 shadow-sm"
                        : "bg-neutral-50 hover:bg-neutral-100 text-neutral-800 border border-neutral-200"
                    )}
                  >
                    <span>{interest}</span>
                    {isFocused && (
                      <span className="text-[10px] uppercase font-black tracking-wider bg-black text-white px-1.5 py-0.2 rounded">
                        Priority
                      </span>
                    )}
                  </button>
                );
              })}

              <button
                type="button"
                onClick={() => navigate('/onboarding')}
                className="px-3 py-1.5 rounded-xl text-xs font-semibold text-neutral-400 hover:text-black border border-dashed border-neutral-300 hover:border-black transition-colors"
              >
                + Edit Interests
              </button>
            </div>
          </div>

          {/* TWO COLUMN GRID: SUGGESTED MATCH RADAR & SMART ICEBREAKERS */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full">
            
            {/* Suggested Potential Matches Radar */}
            <div className="bg-white p-5 rounded-3xl border border-neutral-200 shadow-sm flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center space-x-2">
                    <TrendingUp className="w-4 h-4 text-emerald-600" />
                    <h3 className="text-xs font-black uppercase tracking-wider text-neutral-800">
                      Live Match Radar & Affinities
                    </h3>
                  </div>
                  <span className="text-[11px] text-emerald-600 font-bold bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                    High Queue Activity
                  </span>
                </div>

                <div className="space-y-2.5">
                  {radarSuggestedMatches.map((peer, i) => (
                    <div 
                      key={i}
                      className="p-3 rounded-2xl bg-neutral-50 border border-neutral-200/80 flex items-center justify-between text-left hover:bg-neutral-100/80 transition-colors"
                    >
                      <div className="flex items-center space-x-3 min-w-0">
                        <div className="w-9 h-9 rounded-xl bg-neutral-900 text-white font-bold text-xs flex items-center justify-center shrink-0">
                          {peer.flag}
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center space-x-1.5">
                            <span className="font-bold text-xs text-neutral-900 truncate">{peer.username}</span>
                            <span className="text-[10px] text-neutral-400 font-medium">({peer.country})</span>
                          </div>
                          <div className="flex flex-wrap gap-1 mt-0.5">
                            {peer.sharedTags.map((t, idx) => (
                              <span key={idx} className="text-[10px] font-semibold text-neutral-600 bg-white border border-neutral-200 px-1.5 py-0.5 rounded-md truncate max-w-[120px]">
                                {t}
                              </span>
                            ))}
                          </div>
                        </div>
                      </div>

                      <div className="text-right shrink-0 pl-2">
                        <span className="text-xs font-black text-neutral-900 block">
                          {peer.affinity}%
                        </span>
                        <span className="text-[9px] uppercase font-bold text-neutral-400">
                          Affinity
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Expand Reach Topic Suggestion */}
              {suggestedComplementaryTopics.length > 0 && (
                <div className="mt-4 pt-3 border-t border-neutral-100 flex items-center justify-between text-xs">
                  <span className="text-neutral-500 font-medium text-[11px]">
                    Expand matches:
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {suggestedComplementaryTopics.map(topic => (
                      <button
                        key={topic}
                        type="button"
                        onClick={() => handleAddTopic(topic)}
                        className="inline-flex items-center space-x-1 text-[11px] font-bold text-neutral-700 bg-neutral-100 hover:bg-black hover:text-white px-2 py-0.5 rounded-lg transition-colors border border-neutral-200"
                        title="Add this topic to search queue"
                      >
                        <Plus className="w-3 h-3" />
                        <span>{topic}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Smart Icebreakers & Conversation Starters */}
            <div className="bg-white p-5 rounded-3xl border border-neutral-200 shadow-sm flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center space-x-2">
                    <MessageSquare className="w-4 h-4 text-indigo-600" />
                    <h3 className="text-xs font-black uppercase tracking-wider text-neutral-800">
                      Tailored Match Icebreakers
                    </h3>
                  </div>
                  <span className="text-[11px] text-neutral-400 font-medium">
                    Pre-select an opening line
                  </span>
                </div>

                <div className="space-y-2">
                  {suggestedIcebreakers.map((prompt, i) => {
                    const isSelected = armedIcebreaker === prompt;
                    return (
                      <button
                        key={i}
                        type="button"
                        onClick={() => {
                          setArmedIcebreaker(prompt);
                          setSelectedIcebreaker(prompt);
                        }}
                        className={cn(
                          "w-full text-left p-3 rounded-2xl border text-xs font-medium transition-all flex items-start justify-between space-x-2",
                          isSelected
                            ? "bg-neutral-900 text-white border-black shadow-sm"
                            : "bg-neutral-50 text-neutral-700 border-neutral-200/80 hover:bg-neutral-100"
                        )}
                      >
                        <span className="leading-snug">"{prompt}"</span>
                        {isSelected && (
                          <Check className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5 stroke-[3]" />
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="mt-3 pt-2 text-[11px] text-neutral-400 text-center font-medium">
                Armed icebreaker will appear in chat for 1-click delivery.
              </div>
            </div>

          </div>

          {/* DYNAMIC CONTENT CARD (Internet facts/jokes/thoughts) */}
          <div className="bg-neutral-900 text-white p-5 rounded-3xl shadow-sm w-full flex flex-col items-center justify-center text-center transition-all min-h-24">
            <span className="text-[10px] font-black text-amber-400 tracking-widest uppercase mb-1.5 flex items-center space-x-1">
              <Zap className="w-3 h-3 text-amber-400" />
              <span>While You Wait • {waitingContent.type}</span>
            </span>
            <p className="text-sm sm:text-base font-medium text-neutral-200 italic max-w-xl">
              "{waitingContent.text}"
            </p>
          </div>

          {/* CANCEL SEARCH BUTTON */}
          <button 
            onClick={handleCancel}
            className="flex items-center space-x-2 text-neutral-400 hover:text-black font-semibold text-xs py-2 px-5 rounded-full hover:bg-neutral-100 transition-colors"
          >
            <X className="w-4 h-4" />
            <span>Cancel Search</span>
          </button>

        </div>
      ) : (
        /* CONNECTED SCREEN REVEAL */
        <div className="flex flex-col items-center justify-center space-y-6 w-full max-w-lg mx-auto py-12 animate-in fade-in zoom-in-95 duration-500">
          
          <div className="relative">
            <div className="bg-emerald-500 text-white rounded-full w-20 h-20 flex items-center justify-center shadow-xl shadow-emerald-500/25 ring-8 ring-emerald-50">
              <Check className="w-10 h-10 stroke-[3]" />
            </div>
            <div className="absolute -bottom-2 -right-2 bg-black text-white text-[11px] font-black px-2 py-0.5 rounded-full border-2 border-white shadow">
              {foundMatch?.matchScore || 96}% MATCH
            </div>
          </div>

          <div className="text-center space-y-1">
            <h2 className="text-3xl font-black tracking-tight text-neutral-900">
              Match Connected!
            </h2>
            <p className="text-neutral-500 font-medium text-sm">
              Paired with <strong className="text-black font-bold">{foundMatch?.user.username}</strong> from {foundMatch?.user.country || 'Global'}
            </p>
          </div>

          {/* Shared Interests Highlights */}
          {foundMatch && foundMatch.sharedInterests.length > 0 && (
            <div className="bg-white p-4 rounded-2xl border border-neutral-200 shadow-sm w-full text-center space-y-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-neutral-400">
                Shared Mutual Interests
              </span>
              <div className="flex flex-wrap justify-center gap-2">
                {foundMatch.sharedInterests.map(interest => (
                  <span
                    key={interest}
                    className="inline-flex items-center space-x-1 bg-emerald-50 text-emerald-800 border border-emerald-200 px-3 py-1 rounded-xl text-xs font-bold"
                  >
                    <Check className="w-3 h-3 text-emerald-600 stroke-[3]" />
                    <span>{interest}</span>
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Icebreaker Preview */}
          <div className="bg-neutral-50 p-4 rounded-2xl border border-neutral-200 text-center w-full">
            <span className="text-[10px] font-black uppercase tracking-wider text-neutral-400 block mb-1">
              Suggested Conversation Starter
            </span>
            <p className="text-xs font-semibold text-neutral-800 italic">
              "{armedIcebreaker || foundMatch?.icebreaker || 'Hey there! What are you most excited to talk about today?'}"
            </p>
          </div>

          <p className="text-xs text-neutral-400 font-medium animate-pulse">
            Entering conversation room...
          </p>

        </div>
      )}
    </div>
  );
}
