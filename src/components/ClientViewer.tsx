import React, { useEffect, useRef, useState } from 'react';
import {
  Box,
  RotateCw,
  Compass,
  ZoomIn,
  ZoomOut,
  Maximize,
  Minimize,
  RefreshCw,
  Edit3,
  AlertCircle,
  ArrowRight
} from 'lucide-react';
import type { CameraPreset, PackagingProject } from '../types/packaging';
import { PackagingEngine } from '../three/PackagingEngine';
import { formatDimension } from '../utils/units';

interface ClientViewerProps {
  previewToken: string;
  onExitClientMode?: () => void;
}

export const ClientViewer: React.FC<ClientViewerProps> = ({
  previewToken,
  onExitClientMode,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const engineRef = useRef<PackagingEngine | null>(null);
  const [project, setProject] = useState<PackagingProject | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [activeAngle, setActiveAngle] = useState<CameraPreset>('three-quarter');
  const [turntableActive, setTurntableActive] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Fetch sanitized project from server
  useEffect(() => {
    setIsLoading(true);
    fetch(`/api/public/preview/${previewToken}`)
      .then((res) => {
        if (!res.ok) {
          throw new Error('This client presentation is inactive, revoked by the designer, or has expired.');
        }
        return res.json();
      })
      .then((data: PackagingProject) => {
        setProject(data);
      })
      .catch((err) => {
        setErrorMsg(err.message || 'Failed to load client presentation');
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, [previewToken]);

  // Setup Three.js scene once project is loaded
  useEffect(() => {
    if (!project || !canvasRef.current) return;

    const engine = new PackagingEngine(canvasRef.current);
    engineRef.current = engine;

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
  }, [project]);

  const handleAngleSelect = (angle: CameraPreset) => {
    setActiveAngle(angle);
    engineRef.current?.setCameraPreset(angle, true);
  };

  const handleToggleTurntable = () => {
    const next = !turntableActive;
    setTurntableActive(next);
    if (engineRef.current) engineRef.current.isTurntableActive = next;
  };

  const handleToggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
      setIsFullscreen(true);
    } else {
      document.exitFullscreen().catch(() => {});
      setIsFullscreen(false);
    }
  };

  const formatDimensions = () => {
    if (!project) return '';
    const unit = project.displayUnit || 'mm';
    if (project.category === 'box') {
      const { width, height, depth } = project.boxDimensions;
      return `${formatDimension(width, unit)} × ${formatDimension(height, unit)} × ${formatDimension(depth, unit)}`;
    }
    if (project.category === 'label') {
      const { diameter, height } = project.labelDimensions;
      return `Ø ${formatDimension(diameter, unit)} × ${formatDimension(height, unit)}`;
    }
    if (project.category === 'pouch') {
      const { width, height, gussetDepth } = project.pouchDimensions;
      return `${formatDimension(width, unit)} × ${formatDimension(height, unit)} (+ ${formatDimension(gussetDepth, unit)})`;
    }
    return '';
  };

  if (isLoading) {
    return (
      <div className="w-screen h-screen bg-neutral-950 flex flex-col items-center justify-center text-neutral-400 gap-3">
        <RefreshCw className="w-6 h-6 animate-spin text-amber-400" />
        <span className="text-xs">Loading 3D Client Presentation...</span>
      </div>
    );
  }

  if (errorMsg || !project) {
    return (
      <div className="w-screen h-screen bg-neutral-950 flex flex-col items-center justify-center p-6 text-center select-none">
        <div className="max-w-md bg-neutral-900 border border-neutral-800 rounded-3xl p-8 space-y-4 shadow-2xl">
          <div className="w-12 h-12 rounded-2xl bg-amber-500/10 text-amber-400 border border-amber-500/20 flex items-center justify-center mx-auto">
            <Box className="w-6 h-6" />
          </div>
          <h2 className="text-lg font-bold text-white">Presentation Link Inactive</h2>
          <p className="text-xs text-neutral-400 leading-relaxed">
            {errorMsg || 'This 3D presentation link has been revoked or has expired.'}
          </p>
          <div className="pt-2">
            <button
              onClick={() => {
                window.location.href = '/';
              }}
              className="px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-neutral-950 font-bold text-xs shadow-md transition-colors inline-flex items-center gap-1.5 cursor-pointer"
            >
              <span>Explore AN ValueX 3D Studio</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-neutral-950 text-neutral-100 select-none">
      {/* 3D WebGL Canvas */}
      <canvas
        ref={canvasRef}
        className="w-full h-full block outline-none cursor-grab active:cursor-grabbing"
      />

      {/* Top Presentation Bar */}
      <div className="absolute top-0 left-0 right-0 p-4 md:p-6 flex items-start justify-between pointer-events-none z-20">
        <div className="pointer-events-auto bg-neutral-900/80 backdrop-blur-md border border-neutral-800/80 rounded-2xl p-4 shadow-2xl max-w-sm">
          <div className="flex items-center gap-2 mb-1.5">
            <div className="w-5 h-5 rounded bg-amber-500/20 text-amber-400 flex items-center justify-center border border-amber-500/30">
              <Box className="w-3 h-3" />
            </div>
            <span className="text-xs font-bold text-neutral-200">
              AN ValueX 3D Presentation
            </span>
          </div>
          <h1 className="text-sm font-bold text-white leading-snug">
            {project.name}
          </h1>
          <div className="flex items-center gap-2 text-[11px] text-neutral-400 mt-1 font-mono">
            <span className="capitalize">{project.modelType.replace(/-/g, ' ')}</span>
            <span>·</span>
            <span>{formatDimensions()}</span>
          </div>
        </div>

        <div className="pointer-events-auto flex items-center gap-2">
          {onExitClientMode && (
            <button
              onClick={onExitClientMode}
              className="px-3.5 py-2 rounded-xl bg-neutral-900/80 hover:bg-neutral-800 border border-neutral-800 backdrop-blur-md text-xs font-semibold text-neutral-300 hover:text-white flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Edit3 className="w-3.5 h-3.5 text-amber-400" />
              <span>Open in Designer</span>
            </button>
          )}

          <button
            onClick={handleToggleFullscreen}
            className="p-2 rounded-xl bg-neutral-900/80 hover:bg-neutral-800 border border-neutral-800 backdrop-blur-md text-neutral-400 hover:text-white transition-colors cursor-pointer"
            title="Toggle Fullscreen"
          >
            {isFullscreen ? <Minimize className="w-4 h-4" /> : <Maximize className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Bottom Floating Client Controls */}
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-20 pointer-events-auto flex items-center gap-1.5 p-1.5 rounded-2xl bg-neutral-900/90 border border-neutral-800/90 shadow-2xl backdrop-blur-md text-xs max-w-[94vw] overflow-x-auto">
        <div className="flex items-center gap-1 pr-2 border-r border-neutral-800">
          {(['three-quarter', 'front', 'back', 'left', 'right', 'top'] as CameraPreset[]).map((angle) => (
            <button
              key={angle}
              onClick={() => handleAngleSelect(angle)}
              className={`px-3 py-1 rounded-lg text-[11px] font-medium transition-colors whitespace-nowrap cursor-pointer ${
                activeAngle === angle
                  ? 'bg-neutral-800 text-amber-300 border border-neutral-700/60 shadow-sm font-semibold'
                  : 'text-neutral-400 hover:text-neutral-200'
              }`}
            >
              {angle === 'three-quarter' ? '3/4 Angle' : angle.charAt(0).toUpperCase() + angle.slice(1)}
            </button>
          ))}
        </div>

        <button
          onClick={handleToggleTurntable}
          className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-[11px] font-medium transition-colors whitespace-nowrap cursor-pointer ${
            turntableActive
              ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 font-semibold'
              : 'text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800/40'
          }`}
        >
          <RotateCw className={`w-3 h-3 ${turntableActive ? 'animate-spin' : ''}`} />
          <span>360° Turntable</span>
        </button>

        <div className="flex items-center gap-0.5 pl-1.5 border-l border-neutral-800">
          <button
            onClick={() => engineRef.current?.zoomIn()}
            className="p-1 rounded hover:bg-neutral-800 text-neutral-400 hover:text-neutral-200 cursor-pointer"
            title="Zoom In"
          >
            <ZoomIn className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => engineRef.current?.zoomOut()}
            className="p-1 rounded hover:bg-neutral-800 text-neutral-400 hover:text-neutral-200 cursor-pointer"
            title="Zoom Out"
          >
            <ZoomOut className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => {
              setActiveAngle('three-quarter');
              engineRef.current?.resetCamera();
            }}
            className="p-1 rounded hover:bg-neutral-800 text-neutral-400 hover:text-neutral-200 cursor-pointer"
            title="Reset Angle"
          >
            <Compass className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};
