import React from 'react';
import { Box, ShieldCheck, Heart, Sparkles } from 'lucide-react';

interface FooterProps {
  onNavigate: (path: string) => void;
}

export const Footer: React.FC<FooterProps> = ({ onNavigate }) => {
  return (
    <footer className="w-full bg-neutral-950 border-t border-neutral-800 text-neutral-400 text-xs py-12 px-6 md:px-12 select-none">
      <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
        {/* Col 1: Brand & Manifesto */}
        <div className="space-y-3 md:col-span-1">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-amber-500/20 text-amber-400 flex items-center justify-center border border-amber-500/30">
              <Box className="w-4 h-4" />
            </div>
            <span className="font-bold text-sm text-neutral-100 tracking-tight">
              AN ValueX 3D Studio
            </span>
          </div>
          <p className="text-xs text-neutral-400 leading-relaxed">
            Professional browser-based 3D packaging visualization for prepress designers, brand managers, and packaging artists.
          </p>
          <div className="text-[11px] text-amber-400/90 font-medium">
            Tagline: Design. Visualize. Present.
          </div>
        </div>

        {/* Col 2: Platform Links */}
        <div className="space-y-2.5">
          <div className="text-[11px] font-semibold uppercase tracking-wider text-neutral-300">
            Platform
          </div>
          <ul className="space-y-1.5">
            <li>
              <button onClick={() => onNavigate('/')} className="hover:text-white transition-colors">
                Home Overview
              </button>
            </li>
            <li>
              <button onClick={() => onNavigate('/features')} className="hover:text-white transition-colors">
                Packaging Features
              </button>
            </li>
            <li>
              <button onClick={() => onNavigate('/models')} className="hover:text-white transition-colors">
                Packaging Model Catalog
              </button>
            </li>
            <li>
              <button onClick={() => onNavigate('/how-it-works')} className="hover:text-white transition-colors">
                How Prepress Workflow Works
              </button>
            </li>
            <li>
              <button onClick={() => onNavigate('/studio')} className="hover:text-white transition-colors text-amber-400">
                Launch 3D Studio
              </button>
            </li>
          </ul>
        </div>

        {/* Col 3: Multi-User Account */}
        <div className="space-y-2.5">
          <div className="text-[11px] font-semibold uppercase tracking-wider text-neutral-300">
            Account & Workspace
          </div>
          <ul className="space-y-1.5">
            <li>
              <button onClick={() => onNavigate('/signup')} className="hover:text-white transition-colors">
                Create Free Account
              </button>
            </li>
            <li>
              <button onClick={() => onNavigate('/login')} className="hover:text-white transition-colors">
                Sign In to Dashboard
              </button>
            </li>
            <li>
              <button onClick={() => onNavigate('/dashboard')} className="hover:text-white transition-colors">
                My Projects & Models
              </button>
            </li>
            <li>
              <button onClick={() => onNavigate('/forgot-password')} className="hover:text-white transition-colors">
                Password Recovery
              </button>
            </li>
          </ul>
        </div>

        {/* Col 4: Trust & Transparency */}
        <div className="space-y-2.5">
          <div className="text-[11px] font-semibold uppercase tracking-wider text-neutral-300">
            Data & Privacy
          </div>
          <ul className="space-y-1.5">
            <li>
              <button onClick={() => onNavigate('/privacy')} className="hover:text-white transition-colors">
                Privacy Policy & Isolation
              </button>
            </li>
            <li>
              <button onClick={() => onNavigate('/terms')} className="hover:text-white transition-colors">
                Terms of Service (Free Policy)
              </button>
            </li>
          </ul>
          <div className="pt-2">
            <div className="p-2.5 rounded-lg bg-neutral-900 border border-neutral-800 text-[11px] text-neutral-300 leading-normal">
              <span className="font-semibold text-emerald-400">100% Free Core Policy:</span> No credit card required. No watermarks on renders. Private user data isolation.
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto pt-6 border-t border-neutral-900 flex flex-col sm:flex-row items-center justify-between gap-3 text-[11px] text-neutral-500">
        <div>
          © {new Date().getFullYear()} AN ValueX 3D Studio. All rights reserved. Built for professional packaging visualization.
        </div>
        <div className="flex items-center gap-4">
          <button onClick={() => onNavigate('/privacy')} className="hover:text-neutral-400">
            Privacy
          </button>
          <span>·</span>
          <button onClick={() => onNavigate('/terms')} className="hover:text-neutral-400">
            Terms
          </button>
          <span>·</span>
          <span>Zero-Watermark Exports</span>
        </div>
      </div>
    </footer>
  );
};
