import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStore } from '../store';
import { LogIn, UserPlus } from 'lucide-react';

export function Auth() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const login = useStore((state) => state.login);
  const navigate = useNavigate();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Simulate auth
    if (email && password) {
      login({
        id: Math.random().toString(36).substr(2, 9),
        username: email.split('@')[0] || 'User',
        country: '',
        bio: '',
        interests: [],
      });
      
      // If signing up, go to onboarding, else home
      navigate(isLogin ? '/' : '/onboarding');
    }
  };

  return (
    <div className="flex-1 flex flex-col justify-center items-center max-w-md mx-auto w-full">
      <div className="text-center mb-10">
        <div className="mx-auto bg-black text-white p-4 rounded-2xl flex items-center justify-center font-bold text-4xl tracking-tight leading-none w-20 h-20 mb-6 shadow-xl">
          SV
        </div>
        <h1 className="text-3xl font-bold tracking-tight mb-2">Sors Vox</h1>
        <p className="text-neutral-500 text-lg uppercase tracking-widest font-medium">Talk to Anyone</p>
      </div>

      <div className="bg-white p-8 rounded-3xl shadow-sm border border-neutral-200 w-full">
        <h2 className="text-2xl font-bold mb-6 text-center">
          {isLogin ? 'Welcome back' : 'Create an account'}
        </h2>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-1">Email</label>
            <input 
              type="email" 
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-neutral-300 focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent transition-shadow"
              placeholder="you@example.com"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-1">Password</label>
            <input 
              type="password" 
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-neutral-300 focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent transition-shadow"
              placeholder="••••••••"
            />
          </div>
          
          <button 
            type="submit" 
            className="w-full bg-black text-white font-medium py-3 px-4 rounded-xl hover:bg-neutral-800 transition-colors flex justify-center items-center space-x-2 mt-6"
          >
            {isLogin ? <LogIn className="w-5 h-5" /> : <UserPlus className="w-5 h-5" />}
            <span>{isLogin ? 'Sign In' : 'Create new'}</span>
          </button>
        </form>

        <div className="relative my-6">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-neutral-200"></div>
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-white px-2 text-neutral-400 font-bold">Or</span>
          </div>
        </div>

        <button
          type="button"
          onClick={() => {
            login({
              id: Math.random().toString(36).substr(2, 9),
              username: 'Alex',
              country: 'US',
              bio: 'Passionate about gaming and exploring new tech ideas.',
              interests: ['PC Gaming', 'Artificial Intelligence', 'Space & Astronomy'],
            });
            navigate('/onboarding');
          }}
          className="w-full bg-neutral-100 hover:bg-neutral-200 text-neutral-800 font-bold py-3 px-4 rounded-xl transition-colors text-sm"
        >
          Quick Guest Demo / Setup Profile
        </button>

        <div className="mt-6 text-center text-sm text-neutral-500">
          {isLogin ? "Don't have an account? " : "Already have an account? "}
          <button 
            onClick={() => setIsLogin(!isLogin)}
            className="text-black font-medium hover:underline"
          >
            {isLogin ? 'Create new' : 'Log in'}
          </button>
        </div>
      </div>
    </div>
  );
}
