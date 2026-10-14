import React from 'react';
import { Box, User, ArrowRight, LayoutDashboard, LogIn, Sparkles } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

interface NavbarProps {
  currentPath: string;
  onNavigate: (path: string) => void;
}

export const Navbar: React.FC<NavbarProps> = ({ currentPath, onNavigate }) => {
  const { user, isAuthenticated, logout } = useAuth();

  const navLinks = [
    { label: 'Home', path: '/' },
    { label: 'Features', path: '/features' },
    { label: 'Packaging Models', path: '/models' },
    { label: 'How It Works', path: '/how-it-works' },
  ];

  return (
    <header className="sticky top-0 z-40 w-full bg-neutral-950/90 backdrop-blur-md border-b border-neutral-800/80 px-4 md:px-8 h-16 flex items-center justify-between gap-6 select-none">
      {/* Brand Zone */}
      <button
        onClick={() => onNavigate('/')}
        className="flex items-center gap-3 text-left group cursor-pointer"
      >
        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-amber-500/20 to-neutral-900 border border-amber-500/30 flex items-center justify-center text-amber-400 shadow-sm group-hover:border-amber-400/60 transition-colors">
          <Box className="w-5 h-5" />
        </div>
        <div className="flex flex-col">
          <div className="flex items-center gap-2">
            <span className="font-bold text-sm tracking-tight text-white whitespace-nowrap">
              AN ValueX
            </span>
            <span className="text-[10px] font-semibold text-amber-400 bg-amber-500/10 px-1.5 py-0.5 rounded border border-amber-500/20 uppercase tracking-wider">
              3D Studio
            </span>
          </div>
          <span className="text-[10px] text-neutral-400 hidden sm:inline">Design. Visualize. Present.</span>
        </div>
      </button>

      {/* Nav Links */}
      <nav className="hidden md:flex items-center gap-6 text-xs font-medium text-neutral-300">
        {navLinks.map((link) => {
          const isActive = currentPath === link.path;
          return (
            <button
              key={link.path}
              onClick={() => onNavigate(link.path)}
              className={`transition-colors whitespace-nowrap cursor-pointer ${
                isActive
                  ? 'text-amber-300 font-semibold border-b-2 border-amber-400 pb-0.5'
                  : 'text-neutral-400 hover:text-white'
              }`}
            >
              {link.label}
            </button>
          );
        })}
      </nav>

      {/* Auth / Action Zone */}
      <div className="flex items-center gap-2.5 shrink-0">
        <button
          onClick={() => onNavigate('/studio')}
          className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-neutral-900 hover:bg-neutral-800 text-neutral-200 border border-neutral-700/60 transition-colors"
        >
          <Sparkles className="w-3.5 h-3.5 text-amber-400" />
          <span>Launch 3D Studio</span>
        </button>

        {isAuthenticated && user ? (
          <div className="flex items-center gap-2">
            <button
              onClick={() => onNavigate('/dashboard')}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-neutral-800 hover:bg-neutral-700 text-neutral-100 border border-neutral-700 transition-colors"
            >
              <LayoutDashboard className="w-3.5 h-3.5 text-amber-400" />
              <span className="hidden sm:inline">Dashboard</span>
            </button>
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <button
              onClick={() => onNavigate('/login')}
              className="px-3 py-1.5 rounded-lg text-xs font-medium text-neutral-300 hover:text-white hover:bg-neutral-900 transition-colors"
            >
              Log In
            </button>
            <button
              onClick={() => onNavigate('/signup')}
              className="px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-amber-500 hover:bg-amber-400 text-neutral-950 shadow-sm transition-colors flex items-center gap-1"
            >
              <span>Free Sign Up</span>
              <ArrowRight className="w-3 h-3" />
            </button>
          </div>
        )}
      </div>
    </header>
  );
};
