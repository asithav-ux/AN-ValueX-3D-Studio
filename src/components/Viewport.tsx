import React, { useRef, useEffect, useState } from 'react';
import {
  RotateCw,
  Compass,
  ZoomIn,
  ZoomOut,
  Maximize2,
  Eye,
  Sliders,
  Maximize,
  Minimize,
  RefreshCw
} from 'lucide-react';
import type { CameraPreset, PackagingProject } from '../types/packaging';
import { PackagingEngine } from '../three/PackagingEngine';

interface ViewportProps {
  project: PackagingProject;
  engineRef: React.MutableRefObject<PackagingEngine | null>;
  isZenMode: boolean;
  onToggleZenMode: () => void;
  turntableActive: boolean;
  onToggleTurntable: () => void;
}

export const Viewport: React.FC<ViewportProps> = ({
  project,
  engineRef,
  isZenMode,
  onToggleZenMode,
  turntableActive,
  onToggleTurntable,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [activeAngle, setActiveAngle] = useState<CameraPreset>('three-quarter');
  const [isOrtho, setIsOrtho] = useState(false);
  const [isInitializing, setIsInitializing] = useState(true);

  // Initialize PackagingEngine once
  useEffect(() => {
    if (!canvasRef.current) return;

    const engine = new PackagingEngine(canvasRef.current);
    engineRef.current = engine;
    setIsInitializing(false);

    // Initial model build
    engine.rebuildPackagingModel(
      project.category,
      project.modelType,
      project.boxDimensions,
      project.labelDimensions,
      project.pouchDimensions,
      project.artworks,
      project.material
    );
    engine.updateLighting(project.lighting);
    engine.updateBackground(project.background);

    return () => {
      engine.dispose();
      engineRef.current = null;
    };
  }, []);

  // Sync model changes to engine
  useEffect(() => {
    if (!engineRef.current) return;
    engineRef.current.rebuildPackagingModel(
      project.category,
      project.modelType,
      project.boxDimensions,
      project.labelDimensions,
      project.pouchDimensions,
      project.artworks,
      project.material
    );
  }, [
    project.category,
    project.modelType,
    project.boxDimensions,
    project.labelDimensions,
    project.pouchDimensions,
    project.artworks,
    project.material,
  ]);

  // Sync lighting & background
  useEffect(() => {
    if (!engineRef.current) return;
    engineRef.current.updateLighting(project.lighting);
  }, [project.lighting]);

  useEffect(() => {
    if (!engineRef.current) return;
    engineRef.current.updateBackground(project.background);
  }, [project.background]);

  // Sync turntable
  useEffect(() => {
    if (!engineRef.current) return;
    engineRef.current.isTurntableActive = turntableActive;
  }, [turntableActive]);

  const handlePresetClick = (preset: CameraPreset) => {
    setActiveAngle(preset);
    engineRef.current?.setCameraPreset(preset, true);
  };

  const handleToggleOrtho = () => {
    const nextOrtho = !isOrtho;
    setIsOrtho(nextOrtho);
    engineRef.current?.setCameraType(nextOrtho ? 'orthographic' : 'perspective');
  };

  const formatDimensions = () => {
    if (project.category === 'box') {
      const { width, height, depth } = project.boxDimensions;
      return `${width} × ${height} × ${depth} cm`;
    }
    if (project.category === 'label') {
      const { diameter, height } = project.labelDimensions;
      return `Ø ${diameter} × ${height} cm`;
    }
    if (project.category === 'pouch') {
      const { width, height, gussetDepth } = project.pouchDimensions;
      return `${width} × ${height} + ${gussetDepth} cm`;
    }
    return '';
  };

  return (
    <div className="relative w-full h-full flex items-center justify-center overflow-hidden bg-neutral-950">
      {/* 3D WebGL Canvas */}
      <canvas
        ref={canvasRef}
        className="w-full h-full block outline-none cursor-grab active:cursor-grabbing"
      />

      {/* Loading overlay if initializing */}
      {isInitializing && (
        <div className="absolute inset-0 bg-neutral-950/80 flex items-center justify-center text-xs text-neutral-400">
          <div className="flex items-center gap-2">
            <RefreshCw className="w-4 h-4 animate-spin text-amber-400" />
            <span>Initializing 3D Studio Engine...</span>
          </div>
        </div>
      )}

      {/* Top Floating Info Badge */}
      <div className="absolute top-4 left-4 z-20 pointer-events-none flex items-center gap-2">
        <div className="px-3 py-1.5 rounded-md bg-neutral-900/80 border border-neutral-800/80 backdrop-blur-md shadow-lg flex items-center gap-2 text-xs">
          <span className="font-semibold text-neutral-200 capitalize">
            {project.modelType.replace(/-/g, ' ')}
          </span>
          <span className="text-neutral-500">·</span>
          <span className="font-mono text-neutral-400 tabular-nums">
            {formatDimensions()}
          </span>
        </div>
      </div>

      {/* Top Right Quick Toggles (Zen Mode & Camera Mode) */}
      <div className="absolute top-4 right-4 z-20 flex items-center gap-2 pointer-events-auto">
        <button
          onClick={handleToggleOrtho}
          className={`px-2.5 py-1.5 rounded-md text-xs font-medium border backdrop-blur-md transition-colors ${
            isOrtho
              ? 'bg-amber-500/20 border-amber-500/40 text-amber-300'
              : 'bg-neutral-900/80 border-neutral-800 hover:bg-neutral-800 text-neutral-300'
          }`}
          title="Switch between Perspective and Orthographic camera projection"
        >
          {isOrtho ? 'Orthographic' : 'Perspective'}
        </button>

        <button
          onClick={onToggleZenMode}
          className="p-1.5 rounded-md bg-neutral-900/80 border border-neutral-800 hover:bg-neutral-800 text-neutral-300 backdrop-blur-md transition-colors"
          title={isZenMode ? 'Exit Zen Mode (show panels)' : 'Zen Mode (hide sidebars)'}
        >
          {isZenMode ? <Minimize className="w-4 h-4" /> : <Maximize className="w-4 h-4" />}
        </button>
      </div>

      {/* Ergonomic Floating Bottom Dock (Collapsible, Zero Viewport Occlusion) */}
      <div className="absolute bottom-5 left-1/2 -translate-x-1/2 z-20 pointer-events-auto flex items-center gap-1.5 p-1.5 rounded-xl bg-neutral-900/90 border border-neutral-800/90 shadow-2xl backdrop-blur-md text-xs max-w-[94vw] overflow-x-auto">
        {/* Preset Camera Views */}
        <div className="flex items-center gap-1 pr-2 border-r border-neutral-800">
          {(['three-quarter', 'front', 'back', 'left', 'right', 'top'] as CameraPreset[]).map((angle) => (
            <button
              key={angle}
              onClick={() => handlePresetClick(angle)}
              className={`px-2.5 py-1 rounded-md text-[11px] font-medium transition-colors whitespace-nowrap ${
                activeAngle === angle
                  ? 'bg-neutral-800 text-amber-300 border border-neutral-700/60 shadow-sm'
                  : 'text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800/40'
              }`}
            >
              {angle === 'three-quarter' ? '3/4 View' : angle.charAt(0).toUpperCase() + angle.slice(1)}
            </button>
          ))}
        </div>

        {/* 360 Turntable Auto Spin */}
        <button
          onClick={onToggleTurntable}
          className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-medium transition-colors whitespace-nowrap ${
            turntableActive
              ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
              : 'text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800/40'
          }`}
          title="Toggle 360° continuous turntable rotation"
        >
          <RotateCw className={`w-3 h-3 ${turntableActive ? 'animate-spin' : ''}`} />
          <span>360° Spin</span>
        </button>

        {/* Zoom & Reset Controls */}
        <div className="flex items-center gap-0.5 pl-1.5 border-l border-neutral-800">
          <button
            onClick={() => engineRef.current?.zoomIn()}
            className="p-1 rounded hover:bg-neutral-800 text-neutral-400 hover:text-neutral-200 transition-colors"
            title="Zoom In"
          >
            <ZoomIn className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => engineRef.current?.zoomOut()}
            className="p-1 rounded hover:bg-neutral-800 text-neutral-400 hover:text-neutral-200 transition-colors"
            title="Zoom Out"
          >
            <ZoomOut className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => {
              setActiveAngle('three-quarter');
              engineRef.current?.resetCamera();
            }}
            className="p-1 rounded hover:bg-neutral-800 text-neutral-400 hover:text-neutral-200 transition-colors"
            title="Reset Camera Target and Angle"
          >
            <Compass className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};
