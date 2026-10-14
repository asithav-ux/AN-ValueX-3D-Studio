import React, { useRef, useState } from 'react';
import {
  Upload,
  Image as ImageIcon,
  AlertTriangle,
  RotateCw,
  Sliders,
  Trash2,
  Sparkles,
  Layers,
  FileText,
  ChevronRight,
  Maximize2
} from 'lucide-react';
import type {
  ArtworkMapping,
  BoxPanelId,
  FoilColor,
  LabelPanelId,
  PackagingCategory,
  PackagingModelType,
  PackagingProject,
  PouchPanelId,
} from '../types/packaging';
import { getPanelAspectRatio, processUploadedFile } from '../utils/artwork';

interface LeftSidebarProps {
  project: PackagingProject;
  onUpdateCategory: (category: PackagingCategory, modelType: PackagingModelType) => void;
  onUpdateArtwork: (panelId: string, mapping: ArtworkMapping | null) => void;
  onOpenDieline: () => void;
}

export const LeftSidebar: React.FC<LeftSidebarProps> = ({
  project,
  onUpdateCategory,
  onUpdateArtwork,
  onOpenDieline,
}) => {
  const [activeTab, setActiveTab] = useState<'models' | 'artworks'>('artworks');
  const [selectedPanel, setSelectedPanel] = useState<string>('front');
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [isProcessingFile, setIsProcessingFile] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Model categories definition
  const boxModels = [
    { id: 'folding-carton', label: 'Standard Folding Carton', desc: 'Everyday tuck carton' },
    { id: 'cosmetic-box', label: 'Luxury Cosmetic Box', desc: 'Heavy caliper board & sharp edges' },
    { id: 'square-box', label: 'Square Cube Box', desc: 'Equilateral dimension ratio' },
    { id: 'tall-carton', label: 'Tall Tea Carton', desc: 'Elongated packaging box' },
    { id: 'tuck-end-carton', label: 'Tuck-End Carton', desc: 'Standard friction lock edges' },
    { id: 'reverse-tuck-end', label: 'Reverse Tuck-End', desc: 'Opposing flap orientations' },
    { id: 'straight-tuck-end', label: 'Straight Tuck-End', desc: 'Clean front fold flaps' },
    { id: 'auto-bottom-carton', label: 'Auto-Bottom Carton', desc: 'Crash lock base carton' },
    { id: 'sleeve-box', label: 'Sleeve & Inner Tray', desc: 'Sliding outer sleeve + inner box' },
    { id: 'rigid-gift-box', label: 'Rigid Gift Box', desc: 'Base with overlapping lid lip' },
    { id: 'lid-and-base', label: 'Lid-and-Base Box', desc: 'Two-piece telescoping rigid box' },
    { id: 'drawer-box', label: 'Drawer Box with Ribbon', desc: 'Pull-out matchbox style with tab' },
    { id: 'cylinder-tube', label: 'Round Cylinder Tube', desc: 'Spiral-wound canister tube' },
  ];

  const labelModels = [
    { id: 'cylindrical-bottle', label: 'Cylindrical Bottle', desc: 'Glass or PET cold brew/spirit' },
    { id: 'square-bottle', label: 'Square Profile Bottle', desc: 'Angular olive oil or craft gin' },
    { id: 'rectangular-bottle', label: 'Rectangular Flask Bottle', desc: 'Flat perfume / spirits flask' },
    { id: 'oval-bottle', label: 'Oval Ergonomic Bottle', desc: 'Curved shampoo / bodywash bottle' },
    { id: 'cosmetic-dropper', label: 'Cosmetic Dropper Bottle', desc: 'Active serum pipette bottle' },
    { id: 'shampoo-pump', label: 'Shampoo / Lotion Pump', desc: 'Mechanical dispenser pump nozzle' },
    { id: 'lotion-bottle', label: 'Squeeze Lotion Bottle', desc: 'Standard flip-cap bottle' },
    { id: 'perfume-bottle', label: 'Luxury Perfume Flacon', desc: 'Heavy glass base + gold atomizer' },
    { id: 'glass-jar', label: 'Wide Glass Cream Jar', desc: 'Heavy glass cosmetics jar' },
    { id: 'plastic-jar', label: 'Plastic Cosmetic Jar', desc: 'Lightweight double-wall jar' },
    { id: 'metal-tin', label: 'Metal Tinplate Canister', desc: 'Rolled rim slip lid tea caddy' },
    { id: 'flat-container', label: 'Flat Container / Flask', desc: 'Slim pocket flask profile' },
  ];

  const pouchModels = [
    { id: 'stand-up-pouch', label: 'Stand-Up Doypack', desc: 'Expanding bottom gusset pouch' },
    { id: 'zipper-pouch', label: 'Resealable Zipper Pouch', desc: 'Grip-seal with tear notch' },
    { id: 'coffee-valve-pouch', label: 'Coffee Valve Pouch', desc: 'One-way degassing aroma valve' },
    { id: 'spout-pouch', label: 'Liquid Spout Pouch', desc: 'Welded pouring spout & screw cap' },
    { id: 'flat-pouch', label: 'Flat 3-Side Seal Sachet', desc: 'Single-serve sample packet' },
    { id: 'doypack-gusset', label: 'Heavy Doypack Gusset', desc: 'Deep expanded standing base' },
    { id: 'side-gusset-pouch', label: 'Side-Gusset Pouch', desc: 'Accordion folds for coffee/tea' },
    { id: 'bottom-gusset-pouch', label: 'Round Bottom Gusset', desc: 'Circular folded bottom pouch' },
    { id: 'flat-bottom-pouch', label: 'Flat-Bottom Box Pouch', desc: 'Brick-pack box pouch' },
  ];

  const getPanelsForCategory = (): { id: string; label: string; desc: string }[] => {
    if (project.category === 'box') {
      return [
        { id: 'front', label: 'Front Face', desc: 'Main display panel' },
        { id: 'back', label: 'Back Face', desc: 'Ingredients, instructions & barcode' },
        { id: 'left', label: 'Left Side', desc: 'Side branding & certifications' },
        { id: 'right', label: 'Right Side', desc: 'Side branding & specs' },
        { id: 'top', label: 'Top Lid', desc: 'Top opening flap or monogram' },
        { id: 'bottom', label: 'Bottom Base', desc: 'Batch code & recycling' },
      ];
    }
    if (project.category === 'label') {
      return [
        { id: 'wraparoundLabel', label: 'Wraparound Label', desc: 'Full 360° or partial sleeve' },
        { id: 'frontLabel', label: 'Front Label', desc: 'Primary face label' },
        { id: 'backLabel', label: 'Back Label', desc: 'Secondary facts & barcode' },
      ];
    }
    return [
      { id: 'front', label: 'Pouch Front', desc: 'Primary display panel' },
      { id: 'back', label: 'Pouch Back', desc: 'Preparation & nutrition panel' },
    ];
  };

  const currentPanels = getPanelsForCategory();
  const currentArtwork = project.artworks[selectedPanel];

  const targetRatio = getPanelAspectRatio(
    project.category,
    selectedPanel,
    project.boxDimensions,
    project.labelDimensions,
    project.pouchDimensions
  );

  const hasAspectMismatch =
    currentArtwork &&
    currentArtwork.aspectRatio &&
    Math.abs(currentArtwork.aspectRatio - targetRatio) > 0.08;

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadError(null);
    setIsProcessingFile(true);

    try {
      const res = await processUploadedFile(file);

      const newMapping: ArtworkMapping = {
        panelId: selectedPanel,
        dataUrl: res.dataUrl,
        fileName: res.fileName,
        fileSize: res.fileSize,
        naturalWidth: res.naturalWidth,
        naturalHeight: res.naturalHeight,
        aspectRatio: res.aspectRatio,
        fit: currentArtwork?.fit || 'fit',
        scale: currentArtwork?.scale || 1.0,
        offsetX: currentArtwork?.offsetX || 0,
        offsetY: currentArtwork?.offsetY || 0,
        rotation: currentArtwork?.rotation || 0,
        foilColor: currentArtwork?.foilColor || 'none',
        foilThreshold: currentArtwork?.foilThreshold || 0.5,
        embossDepth: currentArtwork?.embossDepth || 0,
        spotVarnish: currentArtwork?.spotVarnish || false,
        opacity: currentArtwork?.opacity ?? 1.0,
      };

      onUpdateArtwork(selectedPanel, newMapping);
    } catch (err: any) {
      console.error('File upload error:', err);
      setUploadError(err.message || 'Failed to process artwork file');
    } finally {
      setIsProcessingFile(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleUpdateCurrentArtwork = (updates: Partial<ArtworkMapping>) => {
    if (!currentArtwork) return;
    onUpdateArtwork(selectedPanel, { ...currentArtwork, ...updates });
  };

  return (
    <aside className="w-80 h-full bg-neutral-900 border-r border-neutral-800 flex flex-col z-20 text-neutral-200 select-none">
      {/* Top Sidebar Navigation Tabs */}
      <div className="flex border-b border-neutral-800 p-1.5 gap-1 bg-neutral-950/60">
        <button
          onClick={() => setActiveTab('artworks')}
          className={`flex-1 py-1.5 text-xs font-medium rounded-md transition-colors cursor-pointer ${
            activeTab === 'artworks'
              ? 'bg-neutral-800 text-amber-300 shadow-sm border border-neutral-700/50'
              : 'text-neutral-400 hover:text-neutral-200'
          }`}
        >
          Artwork Surfaces
        </button>
        <button
          onClick={() => setActiveTab('models')}
          className={`flex-1 py-1.5 text-xs font-medium rounded-md transition-colors cursor-pointer ${
            activeTab === 'models'
              ? 'bg-neutral-800 text-amber-300 shadow-sm border border-neutral-700/50'
              : 'text-neutral-400 hover:text-neutral-200'
          }`}
        >
          Packaging Models
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-5 custom-scrollbar">
        {/* TAB 1: MODEL SELECTOR */}
        {activeTab === 'models' && (
          <div className="space-y-5">
            <div>
              <label className="text-[11px] font-semibold uppercase tracking-wider text-neutral-400 block mb-2">
                Packaging Format
              </label>
              <div className="grid grid-cols-3 gap-1.5 p-1 bg-neutral-950 rounded-lg border border-neutral-800">
                {(['box', 'label', 'pouch'] as PackagingCategory[]).map((cat) => (
                  <button
                    key={cat}
                    onClick={() => {
                      const defaultModel =
                        cat === 'box'
                          ? 'folding-carton'
                          : cat === 'label'
                          ? 'cylindrical-bottle'
                          : 'stand-up-pouch';
                      onUpdateCategory(cat, defaultModel);
                      setSelectedPanel(cat === 'label' ? 'wraparoundLabel' : 'front');
                    }}
                    className={`py-1.5 text-xs font-medium capitalize rounded transition-colors cursor-pointer ${
                      project.category === cat
                        ? 'bg-neutral-800 text-amber-300 shadow-sm font-semibold'
                        : 'text-neutral-400 hover:text-neutral-200'
                    }`}
                  >
                    {cat === 'box' ? 'Boxes' : cat === 'label' ? 'Containers' : 'Pouches'}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-[11px] font-semibold uppercase tracking-wider text-neutral-400">
                  Select 3D Geometry
                </label>
                <span className="text-[10px] text-neutral-500 font-mono">
                  {project.category === 'box' ? '13 Formats' : project.category === 'label' ? '12 Formats' : '9 Formats'}
                </span>
              </div>

              <div className="space-y-1.5">
                {(project.category === 'box'
                  ? boxModels
                  : project.category === 'label'
                  ? labelModels
                  : pouchModels
                ).map((m) => (
                  <button
                    key={m.id}
                    onClick={() => onUpdateCategory(project.category, m.id as PackagingModelType)}
                    className={`w-full text-left p-2.5 rounded-lg border transition-all flex items-center justify-between cursor-pointer ${
                      project.modelType === m.id
                        ? 'bg-neutral-800/90 border-amber-500/50 text-white shadow-sm'
                        : 'bg-neutral-950/40 border-neutral-800 hover:border-neutral-700 text-neutral-300'
                    }`}
                  >
                    <div>
                      <div className="text-xs font-medium text-neutral-100">{m.label}</div>
                      <div className="text-[11px] text-neutral-400">{m.desc}</div>
                    </div>
                    {project.modelType === m.id && (
                      <div className="w-2 h-2 rounded-full bg-amber-400 shrink-0" />
                    )}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: ARTWORK UPLOAD & SURFACE MAPPING */}
        {activeTab === 'artworks' && (
          <div className="space-y-4">
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-[11px] font-semibold uppercase tracking-wider text-neutral-400">
                  Target Surface
                </label>
                {project.category === 'box' && (
                  <button
                    onClick={onOpenDieline}
                    className="text-[11px] text-amber-400 hover:text-amber-300 flex items-center gap-1 cursor-pointer"
                  >
                    <Layers className="w-3 h-3" />
                    <span>Dieline Unfolder</span>
                  </button>
                )}
              </div>

              <div className="grid grid-cols-2 gap-1.5">
                {currentPanels.map((p) => {
                  const hasArt = !!project.artworks[p.id]?.dataUrl;
                  const isSelected = selectedPanel === p.id;
                  return (
                    <button
                      key={p.id}
                      onClick={() => setSelectedPanel(p.id)}
                      className={`text-left p-2 rounded-md border text-xs transition-all cursor-pointer ${
                        isSelected
                          ? 'bg-neutral-800 border-amber-500/60 text-white'
                          : 'bg-neutral-950/50 border-neutral-800 hover:border-neutral-700 text-neutral-300'
                      }`}
                    >
                      <div className="font-medium truncate">{p.label}</div>
                      <div className="text-[10px] text-neutral-500 truncate">
                        {hasArt ? '✓ Artwork mapped' : 'Empty'}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="bg-neutral-950/60 border border-neutral-800 rounded-xl p-3.5 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-neutral-200">
                  {currentPanels.find((p) => p.id === selectedPanel)?.label}
                </span>
                {currentArtwork?.dataUrl && (
                  <button
                    onClick={() => onUpdateArtwork(selectedPanel, null)}
                    className="text-[11px] text-red-400 hover:text-red-300 flex items-center gap-1 cursor-pointer"
                    title="Remove artwork from this panel"
                  >
                    <Trash2 className="w-3 h-3" />
                    <span>Clear</span>
                  </button>
                )}
              </div>

              {currentArtwork?.dataUrl ? (
                <div className="relative group rounded-lg overflow-hidden border border-neutral-700/60 bg-neutral-900/60">
                  <div className="h-36 flex items-center justify-center p-2 bg-[radial-gradient(#27272a_1px,transparent_1px)] [background-size:12px_12px]">
                    <img
                      src={currentArtwork.dataUrl}
                      alt="Uploaded artwork"
                      referrerPolicy="no-referrer"
                      className="max-h-full max-w-full object-contain drop-shadow"
                    />
                  </div>
                  <div className="p-2 bg-neutral-900 border-t border-neutral-800 flex items-center justify-between text-[11px]">
                    <span className="text-neutral-300 truncate max-w-[140px]">
                      {currentArtwork.fileName}
                    </span>
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      className="text-amber-400 hover:text-amber-300 font-medium cursor-pointer"
                    >
                      Replace
                    </button>
                  </div>
                </div>
              ) : (
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="border-2 border-dashed border-neutral-800 hover:border-amber-500/50 rounded-xl p-6 flex flex-col items-center justify-center text-center cursor-pointer transition-colors bg-neutral-950/40 hover:bg-neutral-950/80"
                >
                  <Upload className="w-7 h-7 text-neutral-500 mb-2" />
                  <div className="text-xs font-medium text-neutral-200">
                    {isProcessingFile ? 'Processing file...' : 'Upload artwork file'}
                  </div>
                  <div className="text-[11px] text-neutral-500 mt-1">
                    Drag & drop or browse PNG, JPG, WebP, SVG, PDF
                  </div>
                </div>
              )}

              <input
                ref={fileInputRef}
                type="file"
                accept="image/png,image/jpeg,image/webp,image/svg+xml,application/pdf"
                onChange={handleFileUpload}
                className="hidden"
              />

              {uploadError && (
                <div className="p-2 rounded bg-red-950/40 border border-red-800/40 text-[11px] text-red-300 flex items-start gap-1.5">
                  <AlertTriangle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                  <span>{uploadError}</span>
                </div>
              )}

              {hasAspectMismatch && (
                <div className="p-2.5 rounded-lg bg-amber-950/30 border border-amber-800/40 text-[11px] text-amber-300 space-y-1">
                  <div className="flex items-center gap-1.5 font-medium">
                    <AlertTriangle className="w-3.5 h-3.5 shrink-0 text-amber-400" />
                    <span>Aspect Ratio Notice</span>
                  </div>
                  <div className="text-amber-200/80 leading-relaxed">
                    Artwork ratio ({(currentArtwork.aspectRatio).toFixed(2)}) differs from the panel’s physical ratio ({targetRatio.toFixed(2)}). Use Fit or Fill below to preserve design without distortion.
                  </div>
                </div>
              )}
            </div>

            {currentArtwork?.dataUrl && (
              <div className="space-y-4 pt-2 border-t border-neutral-800">
                <div>
                  <label className="text-[11px] font-semibold uppercase tracking-wider text-neutral-400 block mb-1.5">
                    Mapping Mode
                  </label>
                  <div className="grid grid-cols-3 gap-1 bg-neutral-950 p-1 rounded-lg border border-neutral-800 text-xs">
                    {(['fit', 'fill', 'stretch'] as const).map((mode) => (
                      <button
                        key={mode}
                        onClick={() => handleUpdateCurrentArtwork({ fit: mode })}
                        className={`py-1 rounded capitalize font-medium transition-colors cursor-pointer ${
                          currentArtwork.fit === mode
                            ? 'bg-neutral-800 text-amber-300 shadow-sm'
                            : 'text-neutral-400 hover:text-neutral-200'
                        }`}
                      >
                        {mode}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-neutral-400">Scale</span>
                    <span className="font-mono text-neutral-300">
                      {Math.round((currentArtwork.scale || 1) * 100)}%
                    </span>
                  </div>
                  <input
                    type="range"
                    min="0.5"
                    max="2.5"
                    step="0.05"
                    value={currentArtwork.scale || 1.0}
                    onChange={(e) =>
                      handleUpdateCurrentArtwork({ scale: parseFloat(e.target.value) })
                    }
                    className="w-full accent-amber-400 h-1 bg-neutral-800 rounded-lg appearance-none cursor-pointer"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-neutral-400">Offset X</span>
                      <span className="font-mono text-neutral-300">
                        {Math.round((currentArtwork.offsetX || 0) * 100)}%
                      </span>
                    </div>
                    <input
                      type="range"
                      min="-1"
                      max="1"
                      step="0.02"
                      value={currentArtwork.offsetX || 0}
                      onChange={(e) =>
                        handleUpdateCurrentArtwork({ offsetX: parseFloat(e.target.value) })
                      }
                      className="w-full accent-amber-400 h-1 bg-neutral-800 rounded-lg appearance-none cursor-pointer"
                    />
                  </div>
                  <div>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-neutral-400">Offset Y</span>
                      <span className="font-mono text-neutral-300">
                        {Math.round((currentArtwork.offsetY || 0) * 100)}%
                      </span>
                    </div>
                    <input
                      type="range"
                      min="-1"
                      max="1"
                      step="0.02"
                      value={currentArtwork.offsetY || 0}
                      onChange={(e) =>
                        handleUpdateCurrentArtwork({ offsetY: parseFloat(e.target.value) })
                      }
                      className="w-full accent-amber-400 h-1 bg-neutral-800 rounded-lg appearance-none cursor-pointer"
                    />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-xs mb-1.5">
                    <span className="text-neutral-400">Rotation</span>
                    <span className="font-mono text-neutral-300">{currentArtwork.rotation || 0}°</span>
                  </div>
                  <div className="grid grid-cols-4 gap-1 text-xs">
                    {([0, 90, 180, 270] as const).map((deg) => (
                      <button
                        key={deg}
                        onClick={() => handleUpdateCurrentArtwork({ rotation: deg })}
                        className={`py-1 rounded font-mono border transition-colors cursor-pointer ${
                          (currentArtwork.rotation || 0) === deg
                            ? 'bg-neutral-800 border-amber-500/50 text-amber-300'
                            : 'bg-neutral-950/60 border-neutral-800 text-neutral-400 hover:text-neutral-200'
                        }`}
                      >
                        {deg}°
                      </button>
                    ))}
                  </div>
                </div>

                <div className="pt-3 border-t border-neutral-800 space-y-3">
                  <div className="text-[11px] font-semibold uppercase tracking-wider text-neutral-400">
                    Surface Finishes
                  </div>

                  <div>
                    <label className="text-xs text-neutral-400 block mb-1">
                      Metallic Foil Stamping
                    </label>
                    <select
                      value={currentArtwork.foilColor || 'none'}
                      onChange={(e) =>
                        handleUpdateCurrentArtwork({ foilColor: e.target.value as FoilColor })
                      }
                      className="w-full bg-neutral-950 border border-neutral-800 rounded-md px-2.5 py-1.5 text-xs text-neutral-200 outline-none focus:border-amber-500"
                    >
                      <option value="none">No Foil (Standard Print)</option>
                      <option value="gold">Yellow Gold Foil</option>
                      <option value="champagne">Champagne Gold Foil</option>
                      <option value="silver">Silver Chrome Foil</option>
                      <option value="copper">Warm Copper Foil</option>
                      <option value="rosegold">Rose Gold Foil</option>
                    </select>
                  </div>

                  <div>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-neutral-400">Emboss / Deboss Relief</span>
                      <span className="font-mono text-neutral-300">
                        {currentArtwork.embossDepth === 0
                          ? 'Flat'
                          : currentArtwork.embossDepth! > 0
                          ? `+${Math.round(currentArtwork.embossDepth! * 100)}% (Emboss)`
                          : `${Math.round(currentArtwork.embossDepth! * 100)}% (Deboss)`}
                      </span>
                    </div>
                    <input
                      type="range"
                      min="-1"
                      max="1"
                      step="0.05"
                      value={currentArtwork.embossDepth || 0}
                      onChange={(e) =>
                        handleUpdateCurrentArtwork({ embossDepth: parseFloat(e.target.value) })
                      }
                      className="w-full accent-amber-400 h-1 bg-neutral-800 rounded-lg appearance-none cursor-pointer"
                    />
                  </div>

                  <div className="flex items-center justify-between pt-1">
                    <span className="text-xs text-neutral-400">Spot UV High Gloss</span>
                    <input
                      type="checkbox"
                      checked={!!currentArtwork.spotVarnish}
                      onChange={(e) =>
                        handleUpdateCurrentArtwork({ spotVarnish: e.target.checked })
                      }
                      className="w-4 h-4 accent-amber-400 rounded cursor-pointer"
                    />
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </aside>
  );
};
