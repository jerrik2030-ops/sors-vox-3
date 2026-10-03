import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStore } from '../store';
import { cn } from '../lib/utils';
import { 
  Check, 
  ChevronRight, 
  ChevronLeft, 
  Search, 
  Plus, 
  X, 
  Sparkles, 
  Compass, 
  Users, 
  Zap, 
  Flame
} from 'lucide-react';
import { 
  INTEREST_CATEGORIES, 
  POPULAR_PRESET_PACKS 
} from '../lib/interestsData';

const AVATAR_COLORS = [
  { name: 'Classic Dark', bg: 'bg-neutral-900', text: 'text-white', border: 'border-neutral-800' },
  { name: 'Indigo', bg: 'bg-indigo-600', text: 'text-white', border: 'border-indigo-500' },
  { name: 'Emerald', bg: 'bg-emerald-600', text: 'text-white', border: 'border-emerald-500' },
  { name: 'Rose', bg: 'bg-rose-600', text: 'text-white', border: 'border-rose-500' },
  { name: 'Amber', bg: 'bg-amber-600', text: 'text-white', border: 'border-amber-500' },
  { name: 'Violet', bg: 'bg-violet-600', text: 'text-white', border: 'border-violet-500' },
  { name: 'Cyan', bg: 'bg-cyan-600', text: 'text-white', border: 'border-cyan-500' },
];

const COUNTRIES = [
  { code: 'US', name: 'United States', flag: '🇺🇸' },
  { code: 'GB', name: 'United Kingdom', flag: '🇬🇧' },
  { code: 'CA', name: 'Canada', flag: '🇨🇦' },
  { code: 'AU', name: 'Australia', flag: '🇦🇺' },
  { code: 'DE', name: 'Germany', flag: '🇩🇪' },
  { code: 'FR', name: 'France', flag: '🇫🇷' },
  { code: 'JP', name: 'Japan', flag: '🇯🇵' },
  { code: 'KR', name: 'South Korea', flag: '🇰🇷' },
  { code: 'IN', name: 'India', flag: '🇮🇳' },
  { code: 'BR', name: 'Brazil', flag: '🇧🇷' },
  { code: 'MX', name: 'Mexico', flag: '🇲🇽' },
  { code: 'ES', name: 'Spain', flag: '🇪🇸' },
  { code: 'IT', name: 'Italy', flag: '🇮🇹' },
  { code: 'NL', name: 'Netherlands', flag: '🇳🇱' },
  { code: 'SE', name: 'Sweden', flag: '🇸🇪' },
  { code: 'Other', name: 'Worldwide / Other', flag: '🌍' },
];

export function Onboarding() {
  const { user, updateUser } = useStore();
  const navigate = useNavigate();

  const [step, setStep] = useState(user?.username && user?.country ? 2 : 1);
  const [username, setUsername] = useState(user?.username || '');
  const [country, setCountry] = useState(user?.country || 'US');
  const [bio, setBio] = useState(user?.bio || '');
  const [avatarColor, setAvatarColor] = useState(user?.avatarColor || AVATAR_COLORS[0].bg);
  const [interests, setInterests] = useState<string[]>(user?.interests || []);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [customInput, setCustomInput] = useState('');

  // Toggle interest
  const toggleInterest = (topic: string) => {
    setInterests(prev =>
      prev.includes(topic)
        ? prev.filter(i => i !== topic)
        : [...prev, topic]
    );
  };

  // Add custom interest
  const handleAddCustom = (textToAdd?: string) => {
    const topic = (textToAdd || customInput || searchQuery).trim();
    if (!topic) return;
    
    // Capitalize first letter of each word nicely
    const formatted = topic
      .split(' ')
      .map(w => w.charAt(0).toUpperCase() + w.slice(1))
      .join(' ');

    if (!interests.includes(formatted)) {
      setInterests(prev => [...prev, formatted]);
    }
    setCustomInput('');
    setSearchQuery('');
  };

  // Apply a preset pack
  const applyPresetPack = (packInterests: string[]) => {
    setInterests(prev => {
      const merged = new Set([...prev, ...packInterests]);
      return Array.from(merged);
    });
  };

  // Filter topics based on active category and search query
  const filteredCategories = useMemo(() => {
    let list = INTEREST_CATEGORIES;
    if (activeCategory !== 'all') {
      list = list.filter(c => c.id === activeCategory);
    }
    
    if (!searchQuery.trim()) {
      return list;
    }

    const q = searchQuery.toLowerCase().trim();
    return list.map(c => ({
      ...c,
      topics: c.topics.filter(t => t.toLowerCase().includes(q))
    })).filter(c => c.topics.length > 0);
  }, [activeCategory, searchQuery]);

  const allFilteredTopics = useMemo(() => {
    const topics: string[] = [];
    filteredCategories.forEach(cat => {
      cat.topics.forEach(t => {
        if (!topics.includes(t)) topics.push(t);
      });
    });
    return topics;
  }, [filteredCategories]);

  const handleNext = () => {
    if (step === 1) {
      if (!username.trim() || !country) return;
      setStep(2);
    } else {
      // If user has not selected any, default to at least one so matching engine has tags
      const finalInterests = interests.length > 0 ? interests : ['General Conversation', 'Deep Conversations'];
      updateUser({
        username: username.trim(),
        country,
        bio: bio.trim(),
        avatarColor,
        interests: finalInterests,
      });
      navigate('/');
    }
  };

  // Calculate estimated match score based on selected count
  const estimatedMatchScore = Math.min(99, Math.max(65, 60 + interests.length * 7));

  return (
    <div className="flex-1 flex flex-col max-w-4xl mx-auto w-full py-6 sm:py-8 px-2 sm:px-4">
      {/* Header & Stepper */}
      <div className="mb-6 sm:mb-8">
        <div className="flex items-center space-x-2 text-sm font-semibold text-neutral-400 mb-2">
          <button 
            onClick={() => setStep(1)} 
            className={cn("transition-colors hover:text-black", step === 1 ? "text-black" : "")}
          >
            1. Profile
          </button>
          <ChevronRight className="w-4 h-4 text-neutral-300" />
          <button 
            onClick={() => {
              if (username.trim() && country) setStep(2);
            }} 
            className={cn("transition-colors hover:text-black", step === 2 ? "text-black font-bold" : "")}
          >
            2. Match Interests & Topics
          </button>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div>
            <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-neutral-900">
              {step === 1 ? 'Set Up Your Profile' : 'Select Your Interests'}
            </h1>
            <p className="text-neutral-500 mt-1 text-base">
              {step === 1
                ? 'Introduce yourself to the Sors Vox community before meeting talkers worldwide.'
                : 'Choose topics you love. We use these to suggest and pair you with the best matches.'}
            </p>
          </div>

          {step === 2 && (
            <div className="flex items-center space-x-3 bg-neutral-100 border border-neutral-200 px-4 py-2 rounded-2xl self-start sm:self-auto">
              <div className="flex items-center text-xs font-bold text-neutral-600 space-x-1.5">
                <Flame className="w-4 h-4 text-amber-500" />
                <span>Match Precision:</span>
              </div>
              <span className="text-xs font-black px-2 py-0.5 rounded-lg bg-black text-white">
                {estimatedMatchScore}%
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Step Content Container */}
      <div className="bg-white rounded-3xl shadow-sm border border-neutral-200/80 p-6 sm:p-8 flex-1 flex flex-col">
        {step === 1 ? (
          <div className="space-y-6 flex-1 max-w-2xl mx-auto w-full">
            {/* Live Profile Card Preview */}
            <div className="p-4 sm:p-5 rounded-2xl bg-neutral-50 border border-neutral-200 flex items-center space-x-4">
              <div className={cn(
                "w-16 h-16 rounded-2xl flex items-center justify-center font-bold text-2xl shadow-sm transition-colors",
                avatarColor,
                "text-white"
              )}>
                {username.trim() ? username.trim().charAt(0).toUpperCase() : '?'}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center space-x-2">
                  <h3 className="font-bold text-lg text-neutral-900 truncate">
                    {username.trim() || 'Your Username'}
                  </h3>
                  <span className="text-xs font-medium px-2 py-0.5 rounded-md bg-white border border-neutral-200 text-neutral-600">
                    {COUNTRIES.find(c => c.code === country)?.flag || '🌍'} {country || 'Global'}
                  </span>
                </div>
                <p className="text-xs text-neutral-500 line-clamp-1 mt-0.5">
                  {bio.trim() || 'Add a bio below to tell peers what you enjoy talking about.'}
                </p>
              </div>
            </div>

            {/* Username Input */}
            <div>
              <label className="block text-sm font-bold text-neutral-700 mb-1.5">
                Username <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                maxLength={24}
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full px-4 py-3.5 rounded-xl border border-neutral-200 focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent font-medium"
                placeholder="e.g. Alex, Stargazer, CyberNomad"
              />
            </div>

            {/* Avatar Theme Color */}
            <div>
              <label className="block text-sm font-bold text-neutral-700 mb-2">
                Avatar Accent
              </label>
              <div className="flex flex-wrap gap-2.5">
                {AVATAR_COLORS.map(col => (
                  <button
                    type="button"
                    key={col.name}
                    onClick={() => setAvatarColor(col.bg)}
                    className={cn(
                      "w-9 h-9 rounded-xl transition-all flex items-center justify-center shadow-sm",
                      col.bg,
                      avatarColor === col.bg 
                        ? "ring-2 ring-offset-2 ring-black scale-110" 
                        : "opacity-80 hover:opacity-100 hover:scale-105"
                    )}
                    title={col.name}
                  >
                    {avatarColor === col.bg && <Check className="w-4 h-4 text-white stroke-[3]" />}
                  </button>
                ))}
              </div>
            </div>

            {/* Country Selector */}
            <div>
              <label className="block text-sm font-bold text-neutral-700 mb-1.5">
                Your Country / Region <span className="text-red-500">*</span>
              </label>
              <select
                value={country}
                onChange={(e) => setCountry(e.target.value)}
                className="w-full px-4 py-3.5 rounded-xl border border-neutral-200 focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent font-medium bg-white"
                required
              >
                {COUNTRIES.map(c => (
                  <option key={c.code} value={c.code}>
                    {c.flag} {c.name} ({c.code})
                  </option>
                ))}
              </select>
            </div>

            {/* Bio Input */}
            <div>
              <div className="flex justify-between items-center mb-1.5">
                <label className="block text-sm font-bold text-neutral-700">
                  About You / Vibe (Optional)
                </label>
                <span className="text-xs text-neutral-400 font-mono">
                  {bio.length}/140
                </span>
              </div>
              <textarea
                value={bio}
                maxLength={140}
                onChange={(e) => setBio(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-neutral-200 focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent font-medium resize-none h-24 text-sm"
                placeholder="What brings you to Sors Vox? e.g. 'Looking to debate sci-fi movies and meet gamers worldwide!'"
              />

              {/* Quick bio starter pills */}
              <div className="flex flex-wrap gap-1.5 mt-2">
                <span className="text-xs text-neutral-400 py-1 font-medium mr-1">Inspirations:</span>
                {[
                  "Passionate about tech & deep conversations.",
                  "Here to meet friendly people and learn languages.",
                  "Late night gamer & movie enthusiast.",
                ].map((preset, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => setBio(preset)}
                    className="text-xs bg-neutral-100 hover:bg-neutral-200 text-neutral-700 px-2.5 py-1 rounded-lg transition-colors text-left"
                  >
                    "{preset.slice(0, 28)}..."
                  </button>
                ))}
              </div>
            </div>
          </div>
        ) : (
          /* STEP 2: INTEREST SELECTION */
          <div className="space-y-6 flex-1 flex flex-col">
            {/* Top Bar: Search, Custom Tag Input, & Selected Summary */}
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row gap-3">
                {/* Search Bar */}
                <div className="relative flex-1">
                  <Search className="w-5 h-5 absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-400" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAddCustom();
                      }
                    }}
                    placeholder="Search 50+ topics or type a custom interest..."
                    className="w-full pl-11 pr-4 py-3 rounded-xl border border-neutral-200 focus:outline-none focus:ring-2 focus:ring-black text-sm font-medium"
                  />
                  {searchQuery && (
                    <button
                      onClick={() => setSearchQuery('')}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-black"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>

                {/* Custom Add Button if typed */}
                {searchQuery.trim() && (
                  <button
                    type="button"
                    onClick={() => handleAddCustom()}
                    className="bg-black text-white px-5 py-3 rounded-xl font-bold text-sm hover:bg-neutral-800 transition-colors flex items-center justify-center space-x-1.5 shrink-0"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Add "{searchQuery.slice(0, 16)}"</span>
                  </button>
                )}
              </div>

              {/* Selected Interests Bar */}
              <div className="p-4 rounded-2xl bg-neutral-50 border border-neutral-200/80">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center space-x-2">
                    <span className="text-xs font-black uppercase tracking-wider text-neutral-500">
                      Your Selected Interests ({interests.length})
                    </span>
                    {interests.length >= 3 ? (
                      <span className="text-[11px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                        ✓ Optimal Match Power
                      </span>
                    ) : (
                      <span className="text-[11px] font-medium text-neutral-400">
                        (Pick {3 - interests.length} more for best accuracy)
                      </span>
                    )}
                  </div>
                  {interests.length > 0 && (
                    <button
                      type="button"
                      onClick={() => setInterests([])}
                      className="text-xs text-neutral-400 hover:text-red-500 font-medium transition-colors"
                    >
                      Clear all
                    </button>
                  )}
                </div>

                {interests.length === 0 ? (
                  <p className="text-xs text-neutral-400 italic py-1">
                    No interests chosen yet. Click topics below or choose a starter pack to instantly configure your match preferences.
                  </p>
                ) : (
                  <div className="flex flex-wrap gap-2 pt-1 max-h-32 overflow-y-auto">
                    {interests.map(item => (
                      <span
                        key={item}
                        className="inline-flex items-center space-x-1.5 px-3 py-1.5 bg-black text-white rounded-xl text-xs font-semibold shadow-sm group animate-in fade-in zoom-in-95 duration-150"
                      >
                        <span>{item}</span>
                        <button
                          type="button"
                          onClick={() => toggleInterest(item)}
                          className="text-neutral-400 hover:text-white p-0.5 rounded-md hover:bg-neutral-800 transition-colors"
                          title="Remove interest"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* Popular Starter Packs */}
              <div className="flex items-center space-x-2 overflow-x-auto pb-1 text-xs">
                <span className="font-bold text-neutral-400 flex items-center space-x-1 shrink-0">
                  <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                  <span>Quick Packs:</span>
                </span>
                {POPULAR_PRESET_PACKS.map(pack => (
                  <button
                    key={pack.id}
                    type="button"
                    onClick={() => applyPresetPack(pack.interests)}
                    className="shrink-0 bg-white hover:bg-neutral-100 border border-neutral-200 text-neutral-700 px-3 py-1.5 rounded-xl font-medium transition-all hover:scale-102 flex items-center space-x-1.5"
                  >
                    <span>{pack.emoji}</span>
                    <span>{pack.name}</span>
                  </button>
                ))}
              </div>

              {/* Category Filter Tabs */}
              <div className="flex gap-1.5 overflow-x-auto pb-1 border-b border-neutral-100">
                <button
                  type="button"
                  onClick={() => setActiveCategory('all')}
                  className={cn(
                    "px-3.5 py-1.5 rounded-xl text-xs font-bold transition-colors shrink-0",
                    activeCategory === 'all'
                      ? "bg-black text-white"
                      : "bg-neutral-100 text-neutral-600 hover:bg-neutral-200"
                  )}
                >
                  All Topics ({INTEREST_CATEGORIES.reduce((acc, c) => acc + c.topics.length, 0)})
                </button>
                {INTEREST_CATEGORIES.map(cat => (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => setActiveCategory(cat.id)}
                    className={cn(
                      "px-3.5 py-1.5 rounded-xl text-xs font-bold transition-colors shrink-0 flex items-center space-x-1.5",
                      activeCategory === cat.id
                        ? "bg-black text-white"
                        : "bg-neutral-100 text-neutral-600 hover:bg-neutral-200"
                    )}
                  >
                    <span>{cat.emoji}</span>
                    <span>{cat.name}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Topics Grid */}
            <div className="flex-1 overflow-y-auto space-y-6 max-h-[380px] pr-1">
              {filteredCategories.length === 0 ? (
                <div className="py-12 text-center">
                  <Compass className="w-10 h-10 text-neutral-300 mx-auto mb-3" />
                  <p className="text-neutral-500 font-medium">No matching predefined topic found.</p>
                  <button
                    type="button"
                    onClick={() => handleAddCustom()}
                    className="mt-3 inline-flex items-center space-x-2 text-sm font-bold bg-neutral-900 text-white px-4 py-2 rounded-xl hover:bg-neutral-800 transition-colors"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Add "{searchQuery}" as a custom interest</span>
                  </button>
                </div>
              ) : (
                filteredCategories.map(category => (
                  <div key={category.id} className="space-y-2.5">
                    <div className="flex items-center space-x-2">
                      <span className="text-lg">{category.emoji}</span>
                      <h4 className="font-bold text-sm text-neutral-800">{category.name}</h4>
                      <span className="text-xs text-neutral-400 font-medium">• {category.description}</span>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
                      {category.topics.map(topic => {
                        const isSelected = interests.includes(topic);
                        return (
                          <button
                            key={topic}
                            type="button"
                            onClick={() => toggleInterest(topic)}
                            className={cn(
                              "flex items-center justify-between p-3 rounded-xl border text-left transition-all text-xs font-semibold",
                              isSelected
                                ? "border-black bg-neutral-950 text-white shadow-sm"
                                : "border-neutral-200 bg-white text-neutral-700 hover:border-neutral-300 hover:bg-neutral-50"
                            )}
                          >
                            <span className="truncate pr-1">{topic}</span>
                            {isSelected && (
                              <Check className="w-3.5 h-3.5 text-white shrink-0 stroke-[3]" />
                            )}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Bottom Insight Banner */}
            <div className="bg-neutral-900 text-neutral-200 p-4 rounded-2xl flex items-center justify-between text-xs">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 rounded-xl bg-white/10 flex items-center justify-center text-white shrink-0">
                  <Zap className="w-4 h-4 text-amber-400" />
                </div>
                <div>
                  <span className="font-bold text-white block">How interests affect matching</span>
                  <span className="text-neutral-400">
                    When you enter the queue, Sors Vox scans active peers worldwide and prioritizes those with mutual interests.
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Footer Navigation Buttons */}
        <div className="mt-8 pt-4 border-t border-neutral-100 flex items-center justify-between">
          {step === 2 ? (
            <button
              type="button"
              onClick={() => setStep(1)}
              className="text-neutral-500 hover:text-black font-semibold text-sm py-3 px-5 rounded-xl hover:bg-neutral-100 transition-colors flex items-center space-x-2"
            >
              <ChevronLeft className="w-4 h-4" />
              <span>Back to Profile</span>
            </button>
          ) : (
            <div />
          )}

          <button
            type="button"
            onClick={handleNext}
            disabled={step === 1 && (!username.trim() || !country)}
            className="bg-black text-white font-bold text-sm py-3.5 px-8 rounded-xl hover:bg-neutral-800 transition-all disabled:opacity-40 disabled:cursor-not-allowed flex items-center space-x-2 shadow-sm ml-auto"
          >
            <span>{step === 1 ? 'Next: Pick Interests' : 'Complete & Start Matching'}</span>
            {step === 1 ? (
              <ChevronRight className="w-4 h-4" />
            ) : (
              <Sparkles className="w-4 h-4 text-amber-400" />
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
