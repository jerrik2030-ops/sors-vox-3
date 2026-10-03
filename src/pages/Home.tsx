import { useNavigate } from 'react-router-dom';
import { useStore } from '../store';
import { Globe, MessageCircle, Sparkles, SlidersHorizontal, Flame } from 'lucide-react';

export function Home() {
  const navigate = useNavigate();
  const { user } = useStore();

  const handleStartTalking = () => {
    navigate('/matching');
  };

  const interestsCount = user?.interests?.length || 0;

  return (
    <div className="flex-1 flex flex-col justify-center items-center text-center max-w-3xl mx-auto w-full py-8 sm:py-12 px-4">
      
      <div className="mb-8 sm:mb-10">
        <div className="inline-flex items-center space-x-2 bg-neutral-100 text-neutral-800 text-xs font-bold px-3 py-1.5 rounded-full mb-3 border border-neutral-200">
          <Flame className="w-3.5 h-3.5 text-amber-500" />
          <span>Interest-Powered Matchmaking</span>
        </div>
        <h1 className="text-4xl sm:text-6xl font-black tracking-tight mb-3 text-neutral-900">
          Talk to Anyone
        </h1>
        <p className="text-lg sm:text-xl text-neutral-500 font-medium max-w-md mx-auto">
          Meet compatible talkers worldwide, connected by the topics you care about.
        </p>
      </div>

      <div className="bg-white p-6 sm:p-8 rounded-[2.5rem] shadow-sm border border-neutral-200 w-full max-w-md mb-8">
        <div className="flex justify-center mb-6">
          <div className="flex -space-x-3">
             <div className="w-14 h-14 rounded-2xl border-4 border-white bg-neutral-900 text-white flex items-center justify-center font-bold text-lg shadow-md z-10">
               {user?.username ? user.username.charAt(0).toUpperCase() : 'SV'}
             </div>
             <div className="w-14 h-14 rounded-2xl border-4 border-white bg-amber-500 text-white flex items-center justify-center font-bold text-lg shadow-md z-20">
               ?
             </div>
          </div>
        </div>
        
        <p className="text-neutral-600 text-sm sm:text-base mb-6 leading-relaxed">
          {interestsCount > 0 ? (
            <span>
              Searching with <strong className="text-black font-bold">{interestsCount} selected {interestsCount === 1 ? 'topic' : 'topics'}</strong> for higher chemistry and deeper discussions.
            </span>
          ) : (
            <span>
              You'll be paired with peers worldwide. Select your interests for higher-precision compatibility!
            </span>
          )}
        </p>

        <button 
          onClick={handleStartTalking}
          className="w-full bg-black text-white font-black text-lg py-5 px-6 rounded-2xl hover:bg-neutral-800 hover:scale-[1.02] active:scale-[0.98] transition-all flex justify-center items-center space-x-3 shadow-lg shadow-black/10"
        >
          <MessageCircle className="w-6 h-6" />
          <span>START TALKING</span>
        </button>
      </div>

      <div className="flex items-center justify-center space-x-2 text-neutral-500 text-xs font-semibold bg-white px-5 py-2.5 rounded-full border border-neutral-200 shadow-sm mb-6">
        <Globe className="w-4 h-4 text-emerald-600" />
        <span>Worldwide Queue Active</span>
      </div>

      {/* User Interests section */}
      <div className="mt-4 flex flex-col items-center w-full max-w-lg">
        {user && interestsCount > 0 ? (
          <div className="w-full bg-white p-5 rounded-3xl border border-neutral-200 shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-black uppercase tracking-wider text-neutral-500">
                Your Match Preferences ({interestsCount})
              </span>
              <button 
                onClick={() => navigate('/onboarding')}
                className="text-xs font-bold text-black hover:text-neutral-600 flex items-center space-x-1"
              >
                <SlidersHorizontal className="w-3.5 h-3.5" />
                <span>Edit</span>
              </button>
            </div>
            <div className="flex flex-wrap justify-center gap-1.5">
              {user.interests.map(interest => (
                <span 
                  key={interest} 
                  className="px-3 py-1 bg-neutral-50 text-neutral-800 rounded-xl text-xs font-bold border border-neutral-200/80"
                >
                  {interest}
                </span>
              ))}
            </div>
          </div>
        ) : (
          <button
            onClick={() => navigate('/onboarding')}
            className="inline-flex items-center space-x-2 bg-white hover:bg-neutral-50 border border-neutral-200 text-neutral-800 px-5 py-3 rounded-2xl text-xs font-bold shadow-sm transition-all hover:scale-102"
          >
            <Sparkles className="w-4 h-4 text-amber-500" />
            <span>Select Your Interests to Unlock Precision Matching</span>
          </button>
        )}
      </div>

    </div>
  );
}
