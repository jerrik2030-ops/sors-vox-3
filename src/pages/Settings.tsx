import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStore } from '../store';
import { 
  User, 
  Bell, 
  Shield, 
  HelpCircle, 
  Heart, 
  LogOut, 
  ChevronRight, 
  ShieldCheck, 
  X, 
  AlertTriangle,
  Lock,
  Check
} from 'lucide-react';

export function Settings() {
  const { user, logout } = useStore();
  const navigate = useNavigate();
  const [showSafetyModal, setShowSafetyModal] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/auth');
  };

  if (!user) return null;

  const SETTINGS_SECTIONS = [
    {
      title: 'Account',
      items: [
        { icon: User, label: 'Edit Profile & Interests', onClick: () => navigate('/onboarding') },
        { icon: Shield, label: 'Safety, Moderation & Privacy', onClick: () => setShowSafetyModal(true) },
        { icon: Bell, label: 'Notifications', onClick: () => {} },
      ]
    },
    {
      title: 'Support',
      items: [
        { icon: HelpCircle, label: 'Help Center', onClick: () => setShowSafetyModal(true) },
        { icon: Heart, label: 'Donation', onClick: () => navigate('/donation') },
      ]
    }
  ];

  return (
    <div className="flex-1 flex flex-col max-w-2xl mx-auto w-full py-8 px-4">
      <h1 className="text-3xl font-black tracking-tight mb-8">Settings</h1>
      
      <div className="space-y-8">
        
        {/* User Card */}
        <div className="bg-white p-6 rounded-3xl border border-neutral-200 flex items-center space-x-5 shadow-sm">
          <div className="w-16 h-16 bg-neutral-900 text-white rounded-2xl flex items-center justify-center font-bold text-2xl shadow-sm">
            {user.username.charAt(0).toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="text-xl font-bold truncate">{user.username}</h2>
            <p className="text-neutral-500 text-sm">{user.country || 'Global'}</p>
            {user.interests && user.interests.length > 0 && (
              <p className="text-xs text-neutral-400 mt-1 truncate">
                {user.interests.length} topics configured
              </p>
            )}
          </div>
        </div>

        {/* Setting Groups */}
        {SETTINGS_SECTIONS.map((section, idx) => (
          <div key={idx}>
            <h3 className="text-xs font-black tracking-widest uppercase text-neutral-400 mb-3 ml-2">
              {section.title}
            </h3>
            <div className="bg-white rounded-3xl border border-neutral-200 overflow-hidden shadow-sm">
              {section.items.map((item, i) => (
                <button
                  key={i}
                  onClick={item.onClick}
                  className="w-full flex items-center justify-between p-5 hover:bg-neutral-50 transition-colors border-b last:border-0 border-neutral-100"
                >
                  <div className="flex items-center space-x-4">
                    <item.icon className="w-5 h-5 text-neutral-500" />
                    <span className="font-bold text-sm text-neutral-800">{item.label}</span>
                  </div>
                  <ChevronRight className="w-5 h-5 text-neutral-300" />
                </button>
              ))}
            </div>
          </div>
        ))}

        <div>
          <button 
            onClick={handleLogout}
            className="w-full bg-red-50 text-red-600 font-bold py-4 rounded-3xl hover:bg-red-100 transition-colors flex justify-center items-center space-x-2 border border-red-200"
          >
            <LogOut className="w-5 h-5" />
            <span>Log Out</span>
          </button>
        </div>

      </div>

      {/* Safety & Moderation Modal */}
      {showSafetyModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl p-6 sm:p-7 max-w-lg w-full shadow-2xl border border-neutral-200 space-y-5">
            <div className="flex items-start justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-emerald-600 border border-emerald-200 flex items-center justify-center">
                  <ShieldCheck className="w-6 h-6 stroke-[2.5]" />
                </div>
                <div>
                  <h3 className="text-xl font-black text-neutral-900">Safety & Moderation</h3>
                  <p className="text-xs text-neutral-500">Community Trust & Safety at Sors Vox</p>
                </div>
              </div>
              <button 
                onClick={() => setShowSafetyModal(false)}
                className="p-1.5 text-neutral-400 hover:text-black rounded-full hover:bg-neutral-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3.5 text-xs text-neutral-600 leading-relaxed">
              <div className="p-3.5 rounded-2xl bg-neutral-50 border border-neutral-200 space-y-1">
                <span className="font-bold text-neutral-900 block flex items-center space-x-1.5">
                  <AlertTriangle className="w-4 h-4 text-amber-500" />
                  <span>In-Chat Reporting & Evidence</span>
                </span>
                <p>
                  You can click <strong>Report User</strong> in any active chat or hover over any message to flag inappropriate conduct, harassment, NSFW content, or scams.
                </p>
              </div>

              <div className="p-3.5 rounded-2xl bg-neutral-50 border border-neutral-200 space-y-1">
                <span className="font-bold text-neutral-900 block flex items-center space-x-1.5">
                  <Lock className="w-4 h-4 text-indigo-500" />
                  <span>Instant Blocking & Anti-Pairing</span>
                </span>
                <p>
                  When you report a user with the block option enabled, our matchmaking queue automatically ensures you will never be matched with that peer again.
                </p>
              </div>

              <div className="p-3.5 rounded-2xl bg-neutral-50 border border-neutral-200 space-y-1">
                <span className="font-bold text-neutral-900 block flex items-center space-x-1.5">
                  <Check className="w-4 h-4 text-emerald-600 stroke-[3]" />
                  <span>Automated & Human Moderation</span>
                </span>
                <p>
                  Flagged conversations are submitted to our moderation queue with automated safety verification to take swift action against repeat offenders.
                </p>
              </div>
            </div>

            <button
              onClick={() => setShowSafetyModal(false)}
              className="w-full py-3.5 rounded-xl bg-black text-white font-bold text-xs hover:bg-neutral-800 transition-colors"
            >
              Understood
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
