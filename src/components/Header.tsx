import React, { useState } from 'react';
import {
  Box,
  Share2,
  Download,
  FolderOpen,
  Save,
  Sparkles,
  Check,
  Layers,
  ChevronDown,
  LayoutDashboard,
  LogIn,
  Sliders
} from 'lucide-react';
import type { MeasurementUnit, PackagingProject } from '../types/packaging';
import { useAuth } from '../context/AuthContext';

interface HeaderProps {
  project: PackagingProject;
  onUpdateProjectName: (name: string) => void;
  onUpdateUnit: (unit: MeasurementUnit) => void;
  onSelectPreset: (presetKey: 'box' | 'bottle' | 'pouch') => void;
  onSaveProject: () => void;
  isSaving: boolean;
  saveSuccess: boolean;
  onOpenProjects: () => void;
  onOpenExport: () => void;
  onOpenShare: () => void;
  onOpenDieline: () => void;
  onNavigate: (path: string) => void;
}

export const Header: React.FC<HeaderProps> = ({
  project,
  onUpdateProjectName,
  onUpdateUnit,
  onSelectPreset,
  onSaveProject,
  isSaving,
  saveSuccess,
  onOpenProjects,
  onOpenExport,
  onOpenShare,
  onOpenDieline,
  onNavigate,
}) => {
  const { user, isAuthenticated } = useAuth();
  const [isEditingName, setIsEditingName] = useState(false);
  const [tempName, setTempName] = useState(project.name);
  const [showPresetMenu, setShowPresetMenu] = useState(false);

  const handleNameSubmit = () => {
    if (tempName.trim()) {
      onUpdateProjectName(tempName.trim());
    } else {
      setTempName(project.name);
    }
    setIsEditingName(false);
  };

  return (
    <header className="h-14 bg-neutral-900/95 border-b border-neutral-800/80 px-4 flex items-center justify-between gap-3 z-30 select-none backdrop-blur-md">
      {/* Zone 1: Wordmark & Navigation Back to Dashboard/Home */}
      <div className="flex items-center gap-3 shrink-0">
        <button
          onClick={() => onNavigate(isAuthenticated ? '/dashboard' : '/')}
          className="flex items-center gap-2.5 text-left group cursor-pointer"
          title={isAuthenticated ? 'Back to Dashboard' : 'Back to Home'}
        >
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-amber-500/20 to-neutral-800 border border-amber-500/30 flex items-center justify-center text-amber-400 shadow-sm group-hover:border-amber-400 transition-colors">
            <Box className="w-4 h-4" />
          </div>
          <div className="hidden sm:flex flex-col">
            <div className="flex items-center gap-1.5">
              <span className="font-bold text-xs tracking-tight text-white whitespace-nowrap">
                AN ValueX
              </span>
              <span className="text-[10px] font-semibold text-amber-400 bg-amber-500/10 px-1 py-0.2 rounded border border-amber-500/20">
                3D
              </span>
            </div>
          </div>
        </button>

        {/* Return to Dashboard Badge */}
        {isAuthenticated && (
          <button
            onClick={() => onNavigate('/dashboard')}
            className="hidden md:flex items-center gap-1 text-[11px] font-medium text-neutral-400 hover:text-white px-2 py-1 rounded bg-neutral-800/50 hover:bg-neutral-800 border border-neutral-700/40 transition-colors cursor-pointer"
          >
            <LayoutDashboard className="w-3 h-3 text-amber-400" />
            <span>Dashboard</span>
          </button>
        )}
      </div>

      {/* Zone 2: Project Name, Universal Unit Switcher & Presets */}
      <div className="flex items-center gap-2.5 overflow-hidden">
        {/* Editable Project Title */}
        <div className="flex items-center gap-1.5 max-w-[200px] sm:max-w-xs truncate bg-neutral-800/50 hover:bg-neutral-800/80 border border-neutral-700/40 rounded-md px-2.5 py-1 transition-colors">
          {isEditingName ? (
            <input
              type="text"
              value={tempName}
              onChange={(e) => setTempName(e.target.value)}
              onBlur={handleNameSubmit}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleNameSubmit();
                if (e.key === 'Escape') {
                  setTempName(project.name);
                  setIsEditingName(false);
                }
              }}
              autoFocus
              className="bg-transparent text-xs text-neutral-200 outline-none w-40 font-medium"
            />
          ) : (
            <button
              onClick={() => {
                setTempName(project.name);
                setIsEditingName(true);
              }}
              className="text-xs font-medium text-neutral-200 hover:text-white truncate cursor-pointer text-left"
              title="Click to rename project"
            >
              {project.name}
            </button>
          )}
        </div>

        {/* Universal Unit Switcher (mm / cm / in) */}
        <div className="flex items-center p-0.5 bg-neutral-950 rounded-md border border-neutral-800 text-[11px] font-mono">
          {(['mm', 'cm', 'in'] as MeasurementUnit[]).map((u) => (
            <button
              key={u}
              onClick={() => onUpdateUnit(u)}
              className={`px-2 py-0.5 rounded transition-colors uppercase ${
                (project.displayUnit || 'mm') === u
                  ? 'bg-neutral-800 text-amber-300 font-bold shadow-sm'
                  : 'text-neutral-500 hover:text-neutral-300'
              }`}
              title={`Switch dimensions to ${u.toUpperCase()}`}
            >
              {u}
            </button>
          ))}
        </div>

        {/* Demo Switcher Dropdown */}
        <div className="relative hidden lg:block">
          <button
            onClick={() => setShowPresetMenu(!showPresetMenu)}
            className="flex items-center gap-1.5 text-xs text-neutral-400 hover:text-neutral-200 bg-neutral-800/40 hover:bg-neutral-800 border border-neutral-700/30 px-2 py-1 rounded transition-colors whitespace-nowrap cursor-pointer"
          >
            <Sparkles className="w-3 h-3 text-amber-400" />
            <span>Mockup Templates</span>
            <ChevronDown className="w-3 h-3 text-neutral-500" />
          </button>

          {showPresetMenu && (
            <div
              className="absolute top-full mt-1 left-0 w-64 bg-neutral-900 border border-neutral-800 rounded-lg shadow-2xl py-1 z-50 text-xs"
              onMouseLeave={() => setShowPresetMenu(false)}
            >
              <div className="px-3 py-1.5 text-[10px] uppercase font-semibold text-neutral-500 tracking-wider">
                Production Mockup Presets
              </div>
              <button
                onClick={() => {
                  onSelectPreset('box');
                  setShowPresetMenu(false);
                }}
                className="w-full text-left px-3 py-2 hover:bg-neutral-800 text-neutral-200 flex flex-col gap-0.5 cursor-pointer"
              >
                <span className="font-medium text-amber-300">Cosmetic Night Serum Box</span>
                <span className="text-[11px] text-neutral-400">Folding carton with gold foil stamping</span>
              </button>
              <button
                onClick={() => {
                  onSelectPreset('bottle');
                  setShowPresetMenu(false);
                }}
                className="w-full text-left px-3 py-2 hover:bg-neutral-800 text-neutral-200 flex flex-col gap-0.5 cursor-pointer"
              >
                <span className="font-medium text-amber-300">Nordic Cold Brew Bottle</span>
                <span className="text-[11px] text-neutral-400">Amber glass bottle with wraparound label</span>
              </button>
              <button
                onClick={() => {
                  onSelectPreset('pouch');
                  setShowPresetMenu(false);
                }}
                className="w-full text-left px-3 py-2 hover:bg-neutral-800 text-neutral-200 flex flex-col gap-0.5 cursor-pointer"
              >
                <span className="font-medium text-amber-300">Uji Matcha Reserve Pouch</span>
                <span className="text-[11px] text-neutral-400">Stand-up doypack with bottom gusset</span>
              </button>
            </div>
          )}
        </div>

        {/* Dieline tool trigger */}
        {project.category === 'box' && (
          <button
            onClick={onOpenDieline}
            className="hidden sm:flex items-center gap-1.5 text-xs text-neutral-300 hover:text-white bg-neutral-800/40 hover:bg-neutral-800 border border-neutral-700/40 px-2 py-1 rounded transition-colors whitespace-nowrap cursor-pointer"
            title="Flat dieline unwrap & multi-panel slice"
          >
            <Layers className="w-3.5 h-3.5 text-neutral-400" />
            <span>Flat Dieline</span>
          </button>
        )}
      </div>

      {/* Zone 3: Actions (Save, Export, Share, User Status) */}
      <div className="flex items-center gap-2 shrink-0">
        <button
          onClick={onSaveProject}
          disabled={isSaving}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium border transition-colors cursor-pointer ${
            saveSuccess
              ? 'bg-emerald-950/40 border-emerald-600/40 text-emerald-300'
              : 'bg-neutral-800/60 hover:bg-neutral-800 border-neutral-700/50 text-neutral-200'
          }`}
          title="Save project to your private account"
        >
          {saveSuccess ? (
            <Check className="w-3.5 h-3.5 text-emerald-400" />
          ) : (
            <Save className="w-3.5 h-3.5 text-neutral-400" />
          )}
          <span>{saveSuccess ? 'Saved' : isSaving ? 'Saving...' : 'Save'}</span>
        </button>

        <button
          onClick={onOpenExport}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium bg-neutral-800 hover:bg-neutral-700 text-neutral-100 border border-neutral-700/60 shadow-sm transition-colors cursor-pointer"
          title="Export high-resolution PNG render (1K, 2K, 4K)"
        >
          <Download className="w-3.5 h-3.5 text-amber-400" />
          <span className="hidden sm:inline">Export PNG</span>
        </button>

        <button
          onClick={onOpenShare}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold bg-amber-500 hover:bg-amber-400 text-neutral-950 shadow-sm transition-colors cursor-pointer"
          title="Generate 360 interactive client preview link"
        >
          <Share2 className="w-3.5 h-3.5" />
          <span>Share 360°</span>
        </button>

        {!isAuthenticated && (
          <button
            onClick={() => onNavigate('/signup')}
            className="hidden xl:flex items-center gap-1 text-[11px] font-semibold text-amber-400 bg-amber-500/10 border border-amber-500/20 px-2 py-1 rounded"
          >
            <span>Sign Up Free</span>
          </button>
        )}
      </div>
    </header>
  );
};
