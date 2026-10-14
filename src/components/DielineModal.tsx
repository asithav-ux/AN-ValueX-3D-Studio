import React, { useRef, useState, useEffect } from 'react';
import {
  X,
  Layers,
  Upload,
  Check,
  RotateCw,
  Sliders,
  Scissors
} from 'lucide-react';
import type { BoxDimensions, BoxPanelId, PackagingProject } from '../types/packaging';
import { cropDielinePanel, getDefaultBoxDielineRects, type DielinePanelRect } from '../utils/dieline';
import { processUploadedFile } from '../utils/artwork';

interface DielineModalProps {
  isOpen: boolean;
  onClose: () => void;
  project: PackagingProject;
  onApplyDielinePanels: (croppedPanels: Record<BoxPanelId, string>) => void;
}

export const DielineModal: React.FC<DielineModalProps> = ({
  isOpen,
  onClose,
  project,
  onApplyDielinePanels,
}) => {
  const [dielineImage, setDielineImage] = useState<string | null>(null);
  const [panelRects, setPanelRects] = useState<DielinePanelRect[]>(() =>
    getDefaultBoxDielineRects(project.boxDimensions)
  );
  const [activePanelId, setActivePanelId] = useState<BoxPanelId>('front');
  const [isProcessing, setIsProcessing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    setPanelRects(getDefaultBoxDielineRects(project.boxDimensions));
  }, [project.boxDimensions]);

  if (!isOpen) return null;

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsProcessing(true);
    try {
      const res = await processUploadedFile(file);
      setDielineImage(res.dataUrl);
    } catch (err) {
      console.error('Failed to load dieline:', err);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleApplyTo3D = async () => {
    if (!dielineImage) return;

    setIsProcessing(true);
    try {
      const cropped: Record<string, string> = {};

      for (const rect of panelRects) {
        const panelDataUrl = await cropDielinePanel(dielineImage, rect);
        cropped[rect.panelId] = panelDataUrl;
      }

      onApplyDielinePanels(cropped as Record<BoxPanelId, string>);
      onClose();
    } catch (err) {
      console.error('Failed to crop dieline panels:', err);
    } finally {
      setIsProcessing(false);
    }
  };

  const activeRect = panelRects.find((r) => r.panelId === activePanelId);

  const updateActiveRect = (updates: Partial<DielinePanelRect>) => {
    setPanelRects((prev) =>
      prev.map((r) => (r.panelId === activePanelId ? { ...r, ...updates } : r))
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm select-none">
      <div className="w-full max-w-4xl bg-neutral-900 border border-neutral-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col text-neutral-200 animate-in fade-in zoom-in-95 duration-150 h-[88vh]">
        {/* Header */}
        <div className="px-5 py-4 border-b border-neutral-800 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-amber-500/10 text-amber-400 border border-amber-500/20">
              <Layers className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-neutral-100">
                Flat Packaging Dieline Unfolder & Panel Slicer
              </h2>
              <p className="text-xs text-neutral-400">
                Map a single flat prepress dieline sheet onto individual 3D box faces
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg hover:bg-neutral-800 text-neutral-400 hover:text-white transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content Split: 2D Viewer on Left, Panel Calibration on Right */}
        <div className="flex-1 flex overflow-hidden">
          {/* Main 2D Dieline Canvas Area */}
          <div className="flex-1 bg-neutral-950 p-4 flex flex-col items-center justify-center relative overflow-hidden">
            {dielineImage ? (
              <div className="relative max-w-full max-h-full border border-neutral-800 rounded-lg overflow-hidden shadow-2xl flex items-center justify-center">
                <img
                  src={dielineImage}
                  alt="Flat dieline sheet"
                  referrerPolicy="no-referrer"
                  className="max-h-[60vh] max-w-full object-contain pointer-events-none"
                />

                {/* Overlay Panel Region Guides */}
                <div className="absolute inset-0 pointer-events-none">
                  {panelRects.map((r) => {
                    const isSelected = r.panelId === activePanelId;
                    return (
                      <div
                        key={r.panelId}
                        style={{
                          left: `${r.x * 100}%`,
                          top: `${r.y * 100}%`,
                          width: `${r.width * 100}%`,
                          height: `${r.height * 100}%`,
                        }}
                        className={`absolute border-2 transition-all flex items-center justify-center ${
                          isSelected
                            ? 'border-amber-400 bg-amber-500/20 z-10'
                            : 'border-neutral-500/50 bg-black/30'
                        }`}
                      >
                        <span className="text-[10px] font-bold uppercase tracking-wider bg-black/70 px-1 py-0.5 rounded text-white shadow">
                          {r.label}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            ) : (
              <div
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-neutral-800 hover:border-amber-500/50 rounded-2xl p-10 flex flex-col items-center justify-center text-center cursor-pointer transition-colors max-w-md bg-neutral-900/40"
              >
                <Upload className="w-10 h-10 text-neutral-500 mb-3" />
                <h3 className="text-sm font-semibold text-neutral-200">
                  Upload Flat Prepress Dieline Sheet
                </h3>
                <p className="text-xs text-neutral-400 mt-1">
                  Upload an all-in-one PDF, AI export, SVG, or high-res PNG dieline. The system will slice it into Front, Back, Sides, Top, and Bottom panels.
                </p>
                <button className="mt-4 px-4 py-2 bg-neutral-800 hover:bg-neutral-700 text-neutral-100 rounded-lg text-xs font-medium border border-neutral-700">
                  Select Dieline File
                </button>
              </div>
            )}

            <input
              ref={fileInputRef}
              type="file"
              accept="image/png,image/jpeg,image/webp,image/svg+xml,application/pdf"
              onChange={handleFileUpload}
              className="hidden"
            />
          </div>

          {/* Right Panel Region Tuner */}
          <div className="w-80 bg-neutral-900 border-l border-neutral-800 p-4 flex flex-col justify-between overflow-y-auto custom-scrollbar">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-wider text-neutral-400">
                  Panels to Extract
                </span>
                {dielineImage && (
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="text-[11px] text-amber-400 hover:text-amber-300"
                  >
                    Replace Image
                  </button>
                )}
              </div>

              {/* Panel Selection List */}
              <div className="space-y-1.5">
                {panelRects.map((r) => (
                  <button
                    key={r.panelId}
                    onClick={() => setActivePanelId(r.panelId)}
                    className={`w-full p-2.5 rounded-lg border text-left text-xs transition-colors flex items-center justify-between ${
                      r.panelId === activePanelId
                        ? 'bg-neutral-800 border-amber-500/60 text-white font-medium shadow-sm'
                        : 'bg-neutral-950/40 border-neutral-800 text-neutral-400 hover:text-neutral-200'
                    }`}
                  >
                    <span>{r.label}</span>
                    <span className="text-[10px] font-mono text-neutral-500">
                      {Math.round(r.width * 100)}% × {Math.round(r.height * 100)}%
                    </span>
                  </button>
                ))}
              </div>

              {/* Position and Scale Controls for Active Panel */}
              {activeRect && (
                <div className="p-3 bg-neutral-950/60 rounded-xl border border-neutral-800 space-y-3">
                  <div className="text-xs font-semibold text-neutral-300">
                    Adjust {activeRect.label} Boundary
                  </div>

                  {/* Horizontal Position */}
                  <div>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-neutral-400">Position X</span>
                      <span className="font-mono text-neutral-300">
                        {Math.round(activeRect.x * 100)}%
                      </span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="0.8"
                      step="0.01"
                      value={activeRect.x}
                      onChange={(e) => updateActiveRect({ x: parseFloat(e.target.value) })}
                      className="w-full accent-amber-400 h-1 bg-neutral-800 rounded-lg appearance-none cursor-pointer"
                    />
                  </div>

                  {/* Vertical Position */}
                  <div>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-neutral-400">Position Y</span>
                      <span className="font-mono text-neutral-300">
                        {Math.round(activeRect.y * 100)}%
                      </span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="0.8"
                      step="0.01"
                      value={activeRect.y}
                      onChange={(e) => updateActiveRect({ y: parseFloat(e.target.value) })}
                      className="w-full accent-amber-400 h-1 bg-neutral-800 rounded-lg appearance-none cursor-pointer"
                    />
                  </div>

                  {/* Region Width */}
                  <div>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-neutral-400">Crop Width</span>
                      <span className="font-mono text-neutral-300">
                        {Math.round(activeRect.width * 100)}%
                      </span>
                    </div>
                    <input
                      type="range"
                      min="0.05"
                      max="0.6"
                      step="0.01"
                      value={activeRect.width}
                      onChange={(e) => updateActiveRect({ width: parseFloat(e.target.value) })}
                      className="w-full accent-amber-400 h-1 bg-neutral-800 rounded-lg appearance-none cursor-pointer"
                    />
                  </div>

                  {/* Region Height */}
                  <div>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-neutral-400">Crop Height</span>
                      <span className="font-mono text-neutral-300">
                        {Math.round(activeRect.height * 100)}%
                      </span>
                    </div>
                    <input
                      type="range"
                      min="0.05"
                      max="0.6"
                      step="0.01"
                      value={activeRect.height}
                      onChange={(e) => updateActiveRect({ height: parseFloat(e.target.value) })}
                      className="w-full accent-amber-400 h-1 bg-neutral-800 rounded-lg appearance-none cursor-pointer"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Apply Slices Button */}
            <div className="pt-4 border-t border-neutral-800 space-y-2">
              <button
                onClick={handleApplyTo3D}
                disabled={!dielineImage || isProcessing}
                className="w-full py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-neutral-950 font-semibold text-xs shadow-md transition-colors flex items-center justify-center gap-1.5 disabled:opacity-50"
              >
                <Scissors className="w-3.5 h-3.5" />
                <span>{isProcessing ? 'Slicing Panels...' : 'Apply Slices to 3D Model'}</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
