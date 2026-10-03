import { Outlet, Link, useNavigate } from 'react-router-dom';
import { useStore } from '../store';
import { LogOut, Settings, User } from 'lucide-react';
import { cn } from '../lib/utils';

export function Layout() {
  const { isAuthenticated, logout } = useStore();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/auth');
  };

  return (
    <div className="min-h-screen bg-neutral-50 flex flex-col text-neutral-900 font-sans">
      <header className="bg-white border-b border-neutral-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Link to="/" className="flex items-center space-x-2">
              {/* Simple Text Logo for Sors Vox */}
              <div className="bg-black text-white p-2 rounded-xl flex items-center justify-center font-bold text-xl tracking-tight leading-none w-10 h-10">
                SV
              </div>
              <span className="font-bold text-xl tracking-tight">Sors Vox</span>
            </Link>
            
            {isAuthenticated && (
              <nav className="flex items-center space-x-1 sm:space-x-4">
                <Link
                  to="/settings"
                  className="p-2 text-neutral-500 hover:text-black hover:bg-neutral-100 rounded-full transition-colors"
                  title="Settings"
                >
                  <Settings className="w-5 h-5" />
                </Link>
                <button
                  onClick={handleLogout}
                  className="p-2 text-neutral-500 hover:text-red-600 hover:bg-red-50 rounded-full transition-colors"
                  title="Logout"
                >
                  <LogOut className="w-5 h-5" />
                </button>
              </nav>
            )}
          </div>
        </div>
      </header>
      
      <main className="flex-1 flex flex-col max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8">
        <Outlet />
      </main>
    </div>
  );
}
