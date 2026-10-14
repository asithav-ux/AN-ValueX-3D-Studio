import React, { useState } from 'react';
import {
  Sliders,
  Sun,
  Palette,
  Maximize2,
  Box,
  Droplets,
  Layers,
  ChevronDown,
  BookmarkPlus,
  Check
} from 'lucide-react';
import type {
  BackgroundPresetId,
  BackgroundSettings,
  BoxDimensions,
  LabelDimensions,
  LightingSettings,
  MaterialPresetId,
  MaterialSettings,
  MeasurementUnit,
  PackagingProject,
  PouchDimensions,
  StudioLightingPresetId,
} from '../types/packaging';
import { fromBaseCm, toBaseCm, formatDimension, getUnitStep } from '../utils/units';
import { useAuth } from '../context/AuthContext';

interface RightSidebarProps {
  project: PackagingProject;
  onUpdateBoxDimensions: (dims: Partial<BoxDimensions>) => void;
  onUpdateLabelDimensions: (dims: Partial<LabelDimensions>) => void;
  onUpdatePouchDimensions: (dims: Partial<PouchDimensions>) => void;
  onUpdateMaterial: (mat: Partial<MaterialSettings>) => void;
  onUpdateLighting: (light: Partial<LightingSettings>) => void;
  onUpdateBackground: (bg: Partial<BackgroundSettings>) => void;
}

export const RightSidebar: React.FC<RightSidebarProps> = ({
  project,
  onUpdateBoxDimensions,
  onUpdateLabelDimensions,
  onUpdatePouchDimensions,
  onUpdateMaterial,
  onUpdateLighting,
  onUpdateBackground,
}) => {
  const { authFetch, isAuthenticated } = useAuth();
  const [activeSection, setActiveSection] = useState<'dimensions' | 'materials' | 'lighting' | 'environment'>('dimensions');
  const [templateSaved, setTemplateSaved] = useState(false);
  const unit = project.displayUnit || 'mm';

  // Material Presets
  const materialPresets: { id: MaterialPresetId; label: string; desc: string }[] = [
    { id: 'matte-paper', label: 'Matte Paper', desc: 'Natural uncoated stock' },
    { id: 'glossy-paper', label: 'Glossy Paper', desc: 'Smooth reflective paper' },
    { id: 'kraft-paper', label: 'Kraft Paper', desc: 'Raw recycled brown fibers' },
    { id: 'matte-laminate', label: 'Matte Laminate', desc: 'Soft-touch velvet finish' },
    { id: 'gloss-laminate', label: 'Gloss Laminate', desc: 'High-shine protective film' },
    { id: 'metallic-foil-gold', label: 'Metallic Gold Foil', desc: 'Specular gold metallic base' },
    { id: 'metallic-foil-silver', label: 'Metallic Silver', desc: 'Polished chrome mirror' },
    { id: 'metallic-foil-champagne', label: 'Champagne Foil', desc: 'Subtle pale gold sheen' },
    { id: 'clear-glass', label: 'Clear Glass', desc: 'Transparent optical bottle' },
    { id: 'frosted-glass', label: 'Frosted Glass', desc: 'Diffused satin glass' },
    { id: 'amber-glass', label: 'Amber Glass', desc: 'UV protective pharmaceutical' },
    { id: 'cosmetic-plastic', label: 'Cosmetic Plastic', desc: 'HDPE / PET smooth finish' },
    { id: 'metal-tin', label: 'Metal Tin', desc: 'Brushed aluminum / tinplate' },
  ];

  // Studio Lighting Presets
  const lightingPresets: { id: StudioLightingPresetId; label: string; desc: string }[] = [
    { id: 'soft-studio', label: 'Soft Studio', desc: 'Balanced commercial softbox' },
    { id: 'luxury-product', label: 'Luxury Showcase', desc: 'High-contrast dramatic rim' },
    { id: 'ecommerce-bright', label: 'E-Commerce Bright', desc: 'Clean high-key 360° light' },
    { id: 'dramatic-dark', label: 'Dramatic Dark', desc: 'Moody spotlight in obsidian' },
    { id: 'natural-daylight', label: 'Natural Daylight', desc: 'Warm organic ambient sunlight' },
  ];

  // Background Presets
  const bgPresets: { id: BackgroundPresetId; label: string; color: string }[] = [
    { id: 'dark-charcoal', label: 'Dark Charcoal', color: '#0f172a' },
    { id: 'pure-white', label: 'Pure White', color: '#ffffff' },
    { id: 'light-grey', label: 'Studio Grey', color: '#f1f5f9' },
    { id: 'warm-beige', label: 'Warm Beige', color: '#f5ebe0' },
    { id: 'luxury-black', label: 'Obsidian Black', color: '#080808' },
    { id: 'transparent', label: 'Transparent', color: 'transparent' },
  ];

  // Save current model dimensions as template
  const handleSaveAsTemplate = async () => {
    if (!isAuthenticated) {
      alert('Please log in or sign up for free to save custom model templates.');
      return;
    }
    const templateName = prompt('Enter a name for this custom model template:', `${project.name} Template`);
    if (!templateName) return;

    try {
      const dimensions =
        project.category === 'box'
          ? project.boxDimensions
          : project.category === 'label'
          ? project.labelDimensions
          : project.pouchDimensions;

      await authFetch('/api/templates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: templateName,
          category: project.category,
          modelType: project.modelType,
          displayUnit: project.displayUnit,
          dimensions,
        }),
      });

      setTemplateSaved(true);
      setTimeout(() => setTemplateSaved(false), 2500);
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <aside className="w-80 h-full bg-neutral-900 border-l border-neutral-800 flex flex-col z-20 text-neutral-200 select-none">
      {/* Top Tabs */}
      <div className="flex border-b border-neutral-800 p-1.5 gap-1 bg-neutral-950/60 overflow-x-auto">
        <button
          onClick={() => setActiveSection('dimensions')}
          className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap cursor-pointer ${
            activeSection === 'dimensions'
              ? 'bg-neutral-800 text-amber-300 border border-neutral-700/50 shadow-sm'
              : 'text-neutral-400 hover:text-neutral-200'
          }`}
        >
          Dimensions ({unit.toUpperCase()})
        </button>
        <button
          onClick={() => setActiveSection('materials')}
          className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap cursor-pointer ${
            activeSection === 'materials'
              ? 'bg-neutral-800 text-amber-300 border border-neutral-700/50 shadow-sm'
              : 'text-neutral-400 hover:text-neutral-200'
          }`}
        >
          Materials
        </button>
        <button
          onClick={() => setActiveSection('lighting')}
          className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap cursor-pointer ${
            activeSection === 'lighting'
              ? 'bg-neutral-800 text-amber-300 border border-neutral-700/50 shadow-sm'
              : 'text-neutral-400 hover:text-neutral-200'
          }`}
        >
          Lighting
        </button>
        <button
          onClick={() => setActiveSection('environment')}
          className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap cursor-pointer ${
            activeSection === 'environment'
              ? 'bg-neutral-800 text-amber-300 border border-neutral-700/50 shadow-sm'
              : 'text-neutral-400 hover:text-neutral-200'
          }`}
        >
          Backdrop
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-5 custom-scrollbar">
        {/* SECTION 1: PHYSICAL DIMENSIONS (WITH UNIT SUPPORT) */}
        {activeSection === 'dimensions' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-neutral-400">
                Parametric Scale ({unit.toUpperCase()})
              </span>
              <button
                onClick={handleSaveAsTemplate}
                className="text-[11px] text-amber-400 hover:text-amber-300 flex items-center gap-1 cursor-pointer"
                title="Save current dimensions as reusable template"
              >
                {templateSaved ? <Check className="w-3 h-3 text-emerald-400" /> : <BookmarkPlus className="w-3 h-3" />}
                <span>{templateSaved ? 'Saved!' : 'Save Template'}</span>
              </button>
            </div>

            {/* Box Dimensions */}
            {project.category === 'box' && (
              <div className="space-y-3 bg-neutral-950/60 p-3.5 rounded-xl border border-neutral-800">
                {/* Width */}
                <div>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-neutral-400">Width (W)</span>
                    <span className="font-mono text-neutral-200">
                      {formatDimension(project.boxDimensions.width, unit)}
                    </span>
                  </div>
                  <input
                    type="range"
                    min="3"
                    max="30"
                    step="0.2"
                    value={project.boxDimensions.width}
                    onChange={(e) =>
                      onUpdateBoxDimensions({ width: parseFloat(e.target.value) })
                    }
                    className="w-full accent-amber-400 h-1 bg-neutral-800 rounded-lg appearance-none cursor-pointer"
                  />
                </div>

                {/* Height */}
                <div>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-neutral-400">Height (H)</span>
                    <span className="font-mono text-neutral-200">
                      {formatDimension(project.boxDimensions.height, unit)}
                    </span>
                  </div>
                  <input
                    type="range"
                    min="4"
                    max="40"
                    step="0.2"
                    value={project.boxDimensions.height}
                    onChange={(e) =>
                      onUpdateBoxDimensions({ height: parseFloat(e.target.value) })
                    }
                    className="w-full accent-amber-400 h-1 bg-neutral-800 rounded-lg appearance-none cursor-pointer"
                  />
                </div>

                {/* Depth */}
                <div>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-neutral-400">Depth (D)</span>
                    <span className="font-mono text-neutral-200">
                      {formatDimension(project.boxDimensions.depth, unit)}
                    </span>
                  </div>
                  <input
                    type="range"
                    min="2"
                    max="25"
                    step="0.2"
                    value={project.boxDimensions.depth}
                    onChange={(e) =>
                      onUpdateBoxDimensions({ depth: parseFloat(e.target.value) })
                    }
                    className="w-full accent-amber-400 h-1 bg-neutral-800 rounded-lg appearance-none cursor-pointer"
                  />
                </div>

                {/* Paperboard Caliper Thickness */}
                <div>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-neutral-400">Board Caliper Thickness</span>
                    <span className="font-mono text-neutral-200">
                      {(project.boxDimensions.paperThickness * 1000).toFixed(0)} μm
                    </span>
                  </div>
                  <input
                    type="range"
                    min="0.2"
                    max="1.5"
                    step="0.05"
                    value={project.boxDimensions.paperThickness}
                    onChange={(e) =>
                      onUpdateBoxDimensions({ paperThickness: parseFloat(e.target.value) })
                    }
                    className="w-full accent-amber-400 h-1 bg-neutral-800 rounded-lg appearance-none cursor-pointer"
                  />
                </div>

                {/* Lid Height (for rigid gift box or sleeve) */}
                {(project.modelType === 'rigid-gift-box' || project.modelType === 'lid-and-base') && (
                  <div>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-neutral-400">Lid Lip Overlap</span>
                      <span className="font-mono text-neutral-200">
                        {formatDimension(project.boxDimensions.lidHeight || 4.0, unit)}
                      </span>
                    </div>
                    <input
                      type="range"
                      min="1.5"
                      max={project.boxDimensions.height * 0.8}
                      step="0.2"
                      value={project.boxDimensions.lidHeight || 4.0}
                      onChange={(e) =>
                        onUpdateBoxDimensions({ lidHeight: parseFloat(e.target.value) })
                      }
                      className="w-full accent-amber-400 h-1 bg-neutral-800 rounded-lg appearance-none cursor-pointer"
                    />
                  </div>
                )}
              </div>
            )}

            {/* Label / Bottle Dimensions */}
            {project.category === 'label' && (
              <div className="space-y-3 bg-neutral-950/60 p-3.5 rounded-xl border border-neutral-800">
                {/* Diameter */}
                <div>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-neutral-400">Container Diameter / Width</span>
                    <span className="font-mono text-neutral-200">
                      Ø {formatDimension(project.labelDimensions.diameter, unit)}
                    </span>
                  </div>
                  <input
                    type="range"
                    min="3"
                    max="16"
                    step="0.2"
                    value={project.labelDimensions.diameter}
                    onChange={(e) =>
                      onUpdateLabelDimensions({ diameter: parseFloat(e.target.value) })
                    }
                    className="w-full accent-amber-400 h-1 bg-neutral-800 rounded-lg appearance-none cursor-pointer"
                  />
                </div>

                {/* Total Height */}
                <div>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-neutral-400">Total Body Height</span>
                    <span className="font-mono text-neutral-200">
                      {formatDimension(project.labelDimensions.height, unit)}
                    </span>
                  </div>
                  <input
                    type="range"
                    min="6"
                    max="35"
                    step="0.5"
                    value={project.labelDimensions.height}
                    onChange={(e) =>
                      onUpdateLabelDimensions({ height: parseFloat(e.target.value) })
                    }
                    className="w-full accent-amber-400 h-1 bg-neutral-800 rounded-lg appearance-none cursor-pointer"
                  />
                </div>

                {/* Label Height */}
                <div>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-neutral-400">Applied Label Height</span>
                    <span className="font-mono text-neutral-200">
                      {formatDimension(project.labelDimensions.labelHeight, unit)}
                    </span>
                  </div>
                  <input
                    type="range"
                    min="2"
                    max={project.labelDimensions.height - 3}
                    step="0.5"
                    value={project.labelDimensions.labelHeight}
                    onChange={(e) =>
                      onUpdateLabelDimensions({ labelHeight: parseFloat(e.target.value) })
                    }
                    className="w-full accent-amber-400 h-1 bg-neutral-800 rounded-lg appearance-none cursor-pointer"
                  />
                </div>

                {/* Wraparound Coverage */}
                <div>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-neutral-400">Wraparound Circumference</span>
                    <span className="font-mono text-neutral-200">
                      {Math.round((project.labelDimensions.labelCoverage || 0.9) * 100)}%
                    </span>
                  </div>
                  <input
                    type="range"
                    min="0.3"
                    max="1.0"
                    step="0.02"
                    value={project.labelDimensions.labelCoverage || 0.9}
                    onChange={(e) =>
                      onUpdateLabelDimensions({ labelCoverage: parseFloat(e.target.value) })
                    }
                    className="w-full accent-amber-400 h-1 bg-neutral-800 rounded-lg appearance-none cursor-pointer"
                  />
                </div>
              </div>
            )}

            {/* Pouch Dimensions */}
            {project.category === 'pouch' && (
              <div className="space-y-3 bg-neutral-950/60 p-3.5 rounded-xl border border-neutral-800">
                {/* Width */}
                <div>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-neutral-400">Pouch Width</span>
                    <span className="font-mono text-neutral-200">
                      {formatDimension(project.pouchDimensions.width, unit)}
                    </span>
                  </div>
                  <input
                    type="range"
                    min="8"
                    max="28"
                    step="0.5"
                    value={project.pouchDimensions.width}
                    onChange={(e) =>
                      onUpdatePouchDimensions({ width: parseFloat(e.target.value) })
                    }
                    className="w-full accent-amber-400 h-1 bg-neutral-800 rounded-lg appearance-none cursor-pointer"
                  />
                </div>

                {/* Height */}
                <div>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-neutral-400">Pouch Height</span>
                    <span className="font-mono text-neutral-200">
                      {formatDimension(project.pouchDimensions.height, unit)}
                    </span>
                  </div>
                  <input
                    type="range"
                    min="10"
                    max="35"
                    step="0.5"
                    value={project.pouchDimensions.height}
                    onChange={(e) =>
                      onUpdatePouchDimensions({ height: parseFloat(e.target.value) })
                    }
                    className="w-full accent-amber-400 h-1 bg-neutral-800 rounded-lg appearance-none cursor-pointer"
                  />
                </div>

                {/* Bottom Gusset Depth */}
                <div>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-neutral-400">Bottom Gusset Depth</span>
                    <span className="font-mono text-neutral-200">
                      {formatDimension(project.pouchDimensions.gussetDepth, unit)}
                    </span>
                  </div>
                  <input
                    type="range"
                    min="2"
                    max="12"
                    step="0.5"
                    value={project.pouchDimensions.gussetDepth}
                    onChange={(e) =>
                      onUpdatePouchDimensions({ gussetDepth: parseFloat(e.target.value) })
                    }
                    className="w-full accent-amber-400 h-1 bg-neutral-800 rounded-lg appearance-none cursor-pointer"
                  />
                </div>

                {/* Volumetric Bulge Fullness */}
                <div>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-neutral-400">Product Fill Bulge</span>
                    <span className="font-mono text-neutral-200">
                      {Math.round((project.pouchDimensions.fullness || 0.6) * 100)}%
                    </span>
                  </div>
                  <input
                    type="range"
                    min="0.2"
                    max="1.0"
                    step="0.05"
                    value={project.pouchDimensions.fullness}
                    onChange={(e) =>
                      onUpdatePouchDimensions({ fullness: parseFloat(e.target.value) })
                    }
                    className="w-full accent-amber-400 h-1 bg-neutral-800 rounded-lg appearance-none cursor-pointer"
                  />
                </div>
              </div>
            )}
          </div>
        )}

        {/* SECTION 2: MATERIALS & FINISHES */}
        {activeSection === 'materials' && (
          <div className="space-y-4">
            <div>
              <label className="text-[11px] font-semibold uppercase tracking-wider text-neutral-400 block mb-2">
                Substrate & Material Preset
              </label>
              <div className="space-y-1.5 max-h-56 overflow-y-auto pr-1 custom-scrollbar">
                {materialPresets.map((m) => (
                  <button
                    key={m.id}
                    onClick={() => onUpdateMaterial({ preset: m.id })}
                    className={`w-full text-left p-2 rounded-lg border text-xs transition-colors cursor-pointer ${
                      project.material.preset === m.id
                        ? 'bg-neutral-800 border-amber-500/60 text-white shadow-sm'
                        : 'bg-neutral-950/40 border-neutral-800 hover:border-neutral-700 text-neutral-300'
                    }`}
                  >
                    <div className="font-medium text-neutral-100">{m.label}</div>
                    <div className="text-[10px] text-neutral-400">{m.desc}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Base Material Color Swatches */}
            <div>
              <label className="text-[11px] font-semibold uppercase tracking-wider text-neutral-400 block mb-2">
                Substrate Tint Color
              </label>
              <div className="flex items-center gap-2">
                {[
                  { label: 'Obsidian', hex: '#181716' },
                  { label: 'White', hex: '#ffffff' },
                  { label: 'Cream', hex: '#f6f3eb' },
                  { label: 'Kraft', hex: '#9e7d58' },
                  { label: 'Forest', hex: '#17271e' },
                  { label: 'Navy', hex: '#101e2e' },
                  { label: 'Amber', hex: '#3d1d07' },
                ].map((c) => (
                  <button
                    key={c.hex}
                    onClick={() => onUpdateMaterial({ baseColor: c.hex })}
                    className={`w-6 h-6 rounded-full border transition-transform cursor-pointer ${
                      project.material.baseColor === c.hex
                        ? 'scale-125 border-amber-400 shadow-md ring-1 ring-amber-400/50'
                        : 'border-neutral-700 hover:scale-110'
                    }`}
                    style={{ backgroundColor: c.hex }}
                    title={c.label}
                  />
                ))}
                <input
                  type="color"
                  value={project.material.baseColor || '#ffffff'}
                  onChange={(e) => onUpdateMaterial({ baseColor: e.target.value })}
                  className="w-6 h-6 rounded border border-neutral-700 bg-transparent cursor-pointer ml-auto"
                  title="Custom tint color"
                />
              </div>
            </div>

            {/* Fine PBR Tuning */}
            <div className="space-y-3 bg-neutral-950/60 p-3.5 rounded-xl border border-neutral-800">
              {/* Roughness */}
              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-neutral-400">Surface Roughness</span>
                  <span className="font-mono text-neutral-300">
                    {Math.round((project.material.roughness ?? 0.5) * 100)}%
                  </span>
                </div>
                <input
                  type="range"
                  min="0.0"
                  max="1.0"
                  step="0.02"
                  value={project.material.roughness ?? 0.5}
                  onChange={(e) =>
                    onUpdateMaterial({ roughness: parseFloat(e.target.value) })
                  }
                  className="w-full accent-amber-400 h-1 bg-neutral-800 rounded-lg appearance-none cursor-pointer"
                />
              </div>

              {/* Metalness */}
              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-neutral-400">Metalness / Reflectivity</span>
                  <span className="font-mono text-neutral-300">
                    {Math.round((project.material.metalness ?? 0.0) * 100)}%
                  </span>
                </div>
                <input
                  type="range"
                  min="0.0"
                  max="1.0"
                  step="0.02"
                  value={project.material.metalness ?? 0.0}
                  onChange={(e) =>
                    onUpdateMaterial({ metalness: parseFloat(e.target.value) })
                  }
                  className="w-full accent-amber-400 h-1 bg-neutral-800 rounded-lg appearance-none cursor-pointer"
                />
              </div>

              {/* Clearcoat */}
              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-neutral-400">Clearcoat Gloss Sheen</span>
                  <span className="font-mono text-neutral-300">
                    {Math.round((project.material.clearcoat ?? 0.0) * 100)}%
                  </span>
                </div>
                <input
                  type="range"
                  min="0.0"
                  max="1.0"
                  step="0.05"
                  value={project.material.clearcoat ?? 0.0}
                  onChange={(e) =>
                    onUpdateMaterial({ clearcoat: parseFloat(e.target.value) })
                  }
                  className="w-full accent-amber-400 h-1 bg-neutral-800 rounded-lg appearance-none cursor-pointer"
                />
              </div>
            </div>
          </div>
        )}

        {/* SECTION 3: STUDIO LIGHTING RIG */}
        {activeSection === 'lighting' && (
          <div className="space-y-4">
            <div>
              <label className="text-[11px] font-semibold uppercase tracking-wider text-neutral-400 block mb-2">
                Studio Lighting Preset
              </label>
              <div className="space-y-1.5">
                {lightingPresets.map((l) => (
                  <button
                    key={l.id}
                    onClick={() => onUpdateLighting({ preset: l.id })}
                    className={`w-full text-left p-2.5 rounded-lg border text-xs transition-colors cursor-pointer ${
                      project.lighting.preset === l.id
                        ? 'bg-neutral-800 border-amber-500/60 text-white shadow-sm'
                        : 'bg-neutral-950/40 border-neutral-800 hover:border-neutral-700 text-neutral-300'
                    }`}
                  >
                    <div className="font-medium text-neutral-100">{l.label}</div>
                    <div className="text-[10px] text-neutral-400">{l.desc}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Light Controls */}
            <div className="space-y-3 bg-neutral-950/60 p-3.5 rounded-xl border border-neutral-800">
              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-neutral-400">Key Light Rotation Angle</span>
                  <span className="font-mono text-neutral-300">
                    {project.lighting.lightAngle || 45}°
                  </span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="360"
                  step="5"
                  value={project.lighting.lightAngle || 45}
                  onChange={(e) =>
                    onUpdateLighting({ lightAngle: parseFloat(e.target.value) })
                  }
                  className="w-full accent-amber-400 h-1 bg-neutral-800 rounded-lg appearance-none cursor-pointer"
                />
              </div>

              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-neutral-400">Exposure</span>
                  <span className="font-mono text-neutral-300">
                    {(project.lighting.exposure || 1.1).toFixed(2)}
                  </span>
                </div>
                <input
                  type="range"
                  min="0.5"
                  max="2.0"
                  step="0.05"
                  value={project.lighting.exposure || 1.1}
                  onChange={(e) =>
                    onUpdateLighting({ exposure: parseFloat(e.target.value) })
                  }
                  className="w-full accent-amber-400 h-1 bg-neutral-800 rounded-lg appearance-none cursor-pointer"
                />
              </div>
            </div>
          </div>
        )}

        {/* SECTION 4: ENVIRONMENT & BACKGROUND */}
        {activeSection === 'environment' && (
          <div className="space-y-4">
            <div>
              <label className="text-[11px] font-semibold uppercase tracking-wider text-neutral-400 block mb-2">
                Studio Backdrop
              </label>
              <div className="grid grid-cols-2 gap-2">
                {bgPresets.map((b) => (
                  <button
                    key={b.id}
                    onClick={() => onUpdateBackground({ preset: b.id })}
                    className={`p-2.5 rounded-lg border text-left flex items-center gap-2.5 text-xs transition-colors cursor-pointer ${
                      project.background.preset === b.id
                        ? 'bg-neutral-800 border-amber-500/60 text-white'
                        : 'bg-neutral-950/40 border-neutral-800 text-neutral-300 hover:border-neutral-700'
                    }`}
                  >
                    <div
                      className={`w-4 h-4 rounded-full border border-neutral-700 shrink-0 ${
                        b.id === 'transparent'
                          ? 'bg-[radial-gradient(#71717a_1px,transparent_1px)] [background-size:4px_4px]'
                          : ''
                      }`}
                      style={{ backgroundColor: b.id !== 'transparent' ? b.color : undefined }}
                    />
                    <span className="truncate">{b.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {project.background.preset === 'custom' && (
              <div className="p-3 bg-neutral-950/60 rounded-xl border border-neutral-800 flex items-center justify-between">
                <span className="text-xs text-neutral-300">Custom Backdrop Hex</span>
                <input
                  type="color"
                  value={project.background.customColor || '#18181b'}
                  onChange={(e) => onUpdateBackground({ customColor: e.target.value })}
                  className="w-8 h-8 rounded border border-neutral-700 bg-transparent cursor-pointer"
                />
              </div>
            )}

            <div className="space-y-3 bg-neutral-950/60 p-3.5 rounded-xl border border-neutral-800">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-neutral-400 block">
                Floor Shadow & Reflection
              </span>

              <div className="flex items-center justify-between">
                <div>
                  <div className="text-xs text-neutral-200">Floor Contact Shadow</div>
                  <div className="text-[10px] text-neutral-500">Radial ambient occlusion grounding</div>
                </div>
                <input
                  type="checkbox"
                  checked={project.background.showFloorShadow !== false}
                  onChange={(e) =>
                    onUpdateBackground({ showFloorShadow: e.target.checked })
                  }
                  className="w-4 h-4 accent-amber-400 rounded cursor-pointer"
                />
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-neutral-800/80">
                <div>
                  <div className="text-xs text-neutral-200">Polished Floor Reflection</div>
                  <div className="text-[10px] text-neutral-500">Glossy surface bounce under product</div>
                </div>
                <input
                  type="checkbox"
                  checked={!!project.background.showFloorReflection}
                  onChange={(e) =>
                    onUpdateBackground({ showFloorReflection: e.target.checked })
                  }
                  className="w-4 h-4 accent-amber-400 rounded cursor-pointer"
                />
              </div>
            </div>
          </div>
        )}
      </div>
    </aside>
  );
};
