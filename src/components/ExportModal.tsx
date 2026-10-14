import React, { useState } from 'react';
import {
  X,
  Download,
  Image as ImageIcon,
  Check,
  Layers,
  Camera,
  RefreshCw,
  Sparkles
} from 'lucide-react';
import confetti from 'canvas-confetti';
import type { CameraPreset, PackagingProject } from '../types/packaging';
import type { PackagingEngine } from '../three/PackagingEngine';

interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  project: PackagingProject;
  engineRef: React.MutableRefObject<PackagingEngine | null>;
}

export const ExportModal: React.FC<ExportModalProps> = ({
  isOpen,
  onClose,
  project,
  engineRef,
}) => {
  const [resolution, setResolution] = useState<number>(2048);
  const [isCustomRes, setIsCustomRes] = useState<boolean>(false);
  const [customW, setCustomW] = useState<number>(3000);
  const [customH, setCustomH] = useState<number>(3000);
  const [transparentBg, setTransparentBg] = useState<boolean>(true);
  const [selectedAngle, setSelectedAngle] = useState<'current' | CameraPreset>('current');
  const [isExporting, setIsExporting] = useState<boolean>(false);
  const [exportProgress, setExportProgress] = useState<string>('');
  const [previewThumbnail, setPreviewThumbnail] = useState<string | null>(null);

  if (!isOpen) return null;

  const downloadBlob = (dataUrl: string, fileName: string) => {
    const a = document.createElement('a');
    a.href = dataUrl;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const handleSingleExport = async () => {
    if (!engineRef.current) return;

    setIsExporting(true);
    setExportProgress('Rendering 3D scene at full resolution...');

    try {
      const w = isCustomRes ? customW : resolution;
      const h = isCustomRes ? customH : resolution;
      const angle = selectedAngle === 'current' ? undefined : selectedAngle;

      const dataUrl = await engineRef.current.renderHighResPng(w, h, transparentBg, angle);
      setPreviewThumbnail(dataUrl);

      // Clean sanitised filename
      const cleanProjectName = project.name.replace(/[^a-zA-Z0-9_-]/g, '_');
      const angleTag = selectedAngle === 'current' ? 'View' : selectedAngle;
      const fileName = `${cleanProjectName}_${angleTag}_${w}x${h}.png`;

      downloadBlob(dataUrl, fileName);

      confetti({
        particleCount: 40,
        spread: 60,
        origin: { y: 0.8 },
      });

      setExportProgress('Render complete! File downloaded.');
    } catch (err: any) {
      console.error('Export error:', err);
      setExportProgress(`Export failed: ${err.message || 'WebGL memory error'}. Try lower resolution.`);
    } finally {
      setIsExporting(false);
    }
  };

  const handleBatchExport = async () => {
    if (!engineRef.current) return;

    setIsExporting(true);
    const angles: CameraPreset[] = ['front', 'back', 'three-quarter', 'left', 'top'];
    const w = isCustomRes ? customW : resolution;
    const h = isCustomRes ? customH : resolution;
    const cleanProjectName = project.name.replace(/[^a-zA-Z0-9_-]/g, '_');

    try {
      for (let i = 0; i < angles.length; i++) {
        const angle = angles[i];
        setExportProgress(`Rendering angle ${i + 1} of ${angles.length}: ${angle}...`);

        const dataUrl = await engineRef.current.renderHighResPng(w, h, transparentBg, angle);
        downloadBlob(dataUrl, `${cleanProjectName}_${angle}_${w}x${h}.png`);

        // Brief delay between renders to yield event loop
        await new Promise((r) => setTimeout(r, 200));
      }

      confetti({
        particleCount: 80,
        spread: 80,
        origin: { y: 0.8 },
      });

      setExportProgress(`Successfully exported all ${angles.length} angle renders!`);
    } catch (err: any) {
      console.error('Batch export error:', err);
      setExportProgress(`Batch export error: ${err.message}`);
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm select-none">
      <div className="w-full max-w-lg bg-neutral-900 border border-neutral-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col text-neutral-200 animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="px-5 py-4 border-b border-neutral-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-amber-500/10 text-amber-400 border border-amber-500/20">
              <Download className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-neutral-100">Export High-Res PNG Render</h2>
              <p className="text-xs text-neutral-400">Pure WebGL render of your packaging model</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg hover:bg-neutral-800 text-neutral-400 hover:text-white transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="p-5 space-y-4 max-h-[75vh] overflow-y-auto custom-scrollbar">
          {/* Resolution Options */}
          <div>
            <label className="text-xs font-semibold uppercase tracking-wider text-neutral-400 block mb-2">
              Output Resolution
            </label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { px: 1024, label: '1024 × 1024', desc: 'Social & Web' },
                { px: 2048, label: '2048 × 2048', desc: 'Client Deck (2K)' },
                { px: 4096, label: '4096 × 4096', desc: 'Prepress Print (4K)' },
              ].map((item) => (
                <button
                  key={item.px}
                  onClick={() => {
                    setResolution(item.px);
                    setIsCustomRes(false);
                  }}
                  className={`p-2.5 rounded-xl border text-left text-xs transition-colors ${
                    !isCustomRes && resolution === item.px
                      ? 'bg-neutral-800 border-amber-500/60 text-white shadow-sm'
                      : 'bg-neutral-950/40 border-neutral-800 text-neutral-400 hover:border-neutral-700 hover:text-neutral-200'
                  }`}
                >
                  <div className="font-medium text-neutral-100">{item.label}</div>
                  <div className="text-[10px] text-neutral-500">{item.desc}</div>
                </button>
              ))}
            </div>

            {/* Custom Resolution Toggle */}
            <div className="mt-2 flex items-center justify-between text-xs">
              <button
                onClick={() => setIsCustomRes(!isCustomRes)}
                className="text-amber-400 hover:text-amber-300 font-medium"
              >
                {isCustomRes ? '← Use standard presets' : '+ Custom pixel dimensions'}
              </button>
            </div>

            {isCustomRes && (
              <div className="mt-2 grid grid-cols-2 gap-2 bg-neutral-950/60 p-2.5 rounded-lg border border-neutral-800 text-xs">
                <div>
                  <span className="text-neutral-400 text-[11px] block mb-1">Width (px)</span>
                  <input
                    type="number"
                    min="512"
                    max="6000"
                    step="100"
                    value={customW}
                    onChange={(e) => setCustomW(parseInt(e.target.value) || 2048)}
                    className="w-full bg-neutral-900 border border-neutral-700/60 rounded px-2 py-1 text-neutral-200 outline-none"
                  />
                </div>
                <div>
                  <span className="text-neutral-400 text-[11px] block mb-1">Height (px)</span>
                  <input
                    type="number"
                    min="512"
                    max="6000"
                    step="100"
                    value={customH}
                    onChange={(e) => setCustomH(parseInt(e.target.value) || 2048)}
                    className="w-full bg-neutral-900 border border-neutral-700/60 rounded px-2 py-1 text-neutral-200 outline-none"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Camera Angle Selector */}
          <div>
            <label className="text-xs font-semibold uppercase tracking-wider text-neutral-400 block mb-2">
              Camera View Angle
            </label>
            <div className="grid grid-cols-3 gap-1.5 text-xs">
              {[
                { id: 'current', label: 'Current Angle' },
                { id: 'front', label: 'Front View' },
                { id: 'back', label: 'Back View' },
                { id: 'three-quarter', label: '3/4 Perspective' },
                { id: 'left', label: 'Side Left' },
                { id: 'top', label: 'Top Lid' },
              ].map((item) => (
                <button
                  key={item.id}
                  onClick={() => setSelectedAngle(item.id as any)}
                  className={`p-2 rounded-lg border text-center transition-colors ${
                    selectedAngle === item.id
                      ? 'bg-neutral-800 border-amber-500/60 text-white font-medium shadow-sm'
                      : 'bg-neutral-950/40 border-neutral-800 text-neutral-400 hover:text-neutral-200'
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </div>
          </div>

          {/* Background Transparency */}
          <div className="p-3 bg-neutral-950/60 rounded-xl border border-neutral-800 space-y-2">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-xs font-medium text-neutral-200">
                  Transparent Alpha Background
                </div>
                <div className="text-[11px] text-neutral-500">
                  Export product on clean transparent canvas for catalog or pitch decks
                </div>
              </div>
              <input
                type="checkbox"
                checked={transparentBg}
                onChange={(e) => setTransparentBg(e.target.checked)}
                className="w-4 h-4 accent-amber-400 rounded cursor-pointer"
              />
            </div>
          </div>

          {/* Status Message */}
          {exportProgress && (
            <div className="p-3 rounded-lg bg-neutral-950 border border-neutral-800 text-xs text-amber-300 flex items-center gap-2">
              {isExporting && <RefreshCw className="w-3.5 h-3.5 animate-spin shrink-0" />}
              <span>{exportProgress}</span>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="px-5 py-4 border-t border-neutral-800 bg-neutral-950/80 flex items-center justify-between gap-3">
          <button
            onClick={handleBatchExport}
            disabled={isExporting}
            className="px-3 py-2 text-xs font-medium rounded-lg border border-neutral-700/60 text-neutral-300 hover:text-white hover:bg-neutral-800 transition-colors disabled:opacity-50"
            title="Sequentially render and download Front, Back, 3/4, Side and Top angles"
          >
            Batch Export 5 Angles
          </button>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-3 py-2 text-xs font-medium text-neutral-400 hover:text-neutral-200 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSingleExport}
              disabled={isExporting}
              className="px-4 py-2 text-xs font-semibold rounded-lg bg-amber-500 hover:bg-amber-400 text-neutral-950 shadow-md transition-colors flex items-center gap-1.5 disabled:opacity-50"
            >
              {isExporting ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  <span>Rendering...</span>
                </>
              ) : (
                <>
                  <Download className="w-3.5 h-3.5" />
                  <span>Download PNG</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
