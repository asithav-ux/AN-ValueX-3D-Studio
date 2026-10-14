import React, { useRef, useEffect } from 'react';
import {
  Box,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  Download,
  Share2,
  CheckCircle2,
  Layers,
  Sliders,
  Eye,
  Check
} from 'lucide-react';
import { PackagingEngine } from '../three/PackagingEngine';
import { createDefaultBoxProject } from '../utils/presets';

interface HomePageProps {
  onNavigate: (path: string) => void;
}

export const HomePage: React.FC<HomePageProps> = ({ onNavigate }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const engineRef = useRef<PackagingEngine | null>(null);

  useEffect(() => {
    if (!canvasRef.current) return;
    const engine = new PackagingEngine(canvasRef.current);
    engineRef.current = engine;

    const sample = createDefaultBoxProject();
    engine.rebuildPackagingModel(
      sample.category,
      sample.modelType,
      sample.boxDimensions,
      sample.labelDimensions,
      sample.pouchDimensions,
      sample.artworks,
      sample.material
    );
    engine.updateLighting(sample.lighting);
    engine.updateBackground({
      preset: 'dark-charcoal',
      customColor: '#0f172a',
      showFloorShadow: true,
      showFloorReflection: true,
      reflectionOpacity: 0.25,
    });
    engine.isTurntableActive = true;
    engine.turntableSpeed = 0.4;

    return () => {
      engine.dispose();
      engineRef.current = null;
    };
  }, []);

  return (
    <div className="w-full flex flex-col bg-neutral-950 text-neutral-100 select-none">
      {/* 1. HERO SECTION */}
      <section className="relative px-6 md:px-12 pt-16 pb-20 max-w-7xl mx-auto w-full">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          {/* Left Hero Copy */}
          <div className="lg:col-span-6 space-y-6">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-300 text-xs font-semibold">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Next-Generation Packaging Visualization</span>
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-white leading-[1.1]">
              Design. Visualize. <span className="text-amber-400">Present.</span>
            </h1>

            <p className="text-base sm:text-lg text-neutral-400 leading-relaxed">
              Transform your 2D packaging artwork into photorealistic 3D folding cartons, bottles, jars, and stand-up pouches. Inspect from every angle, export 4K renders, and share interactive 360° client presentations.
            </p>

            {/* Primary Action Buttons */}
            <div className="flex flex-wrap items-center gap-3 pt-2">
              <button
                onClick={() => onNavigate('/signup')}
                className="px-6 py-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-neutral-950 font-bold text-sm shadow-lg shadow-amber-500/20 transition-all flex items-center gap-2 group cursor-pointer"
              >
                <span>Create Free Account</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </button>

              <button
                onClick={() => onNavigate('/studio')}
                className="px-6 py-3 rounded-xl bg-neutral-900 hover:bg-neutral-800 text-neutral-100 border border-neutral-700/80 font-semibold text-sm transition-all flex items-center gap-2 cursor-pointer"
              >
                <Box className="w-4 h-4 text-amber-400" />
                <span>Launch 3D Studio</span>
              </button>
            </div>

            {/* Free Policy Badges */}
            <div className="pt-4 flex flex-wrap items-center gap-6 text-xs text-neutral-400">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span>100% Free Core Platform</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span>Zero Watermarks</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span>Full Client 360° Sharing</span>
              </div>
            </div>
          </div>

          {/* Right Hero Interactive 3D Canvas */}
          <div className="lg:col-span-6 relative">
            <div className="w-full h-[450px] sm:h-[500px] rounded-3xl overflow-hidden border border-neutral-800 bg-gradient-to-b from-neutral-900 to-neutral-950 shadow-2xl relative group">
              <canvas
                ref={canvasRef}
                className="w-full h-full block cursor-grab active:cursor-grabbing outline-none"
              />

              {/* Floating Interactive Badge */}
              <div className="absolute bottom-4 left-4 right-4 pointer-events-none flex items-center justify-between">
                <div className="px-3 py-1.5 rounded-lg bg-neutral-900/90 backdrop-blur-md border border-neutral-800 text-xs flex items-center gap-2 text-neutral-300">
                  <span className="w-2 h-2 rounded-full bg-emerald-400" />
                  <span>Interactive 3D Demo · Drag to Orbit</span>
                </div>
                <button
                  onClick={() => onNavigate('/studio')}
                  className="pointer-events-auto px-3 py-1.5 rounded-lg bg-amber-500/20 hover:bg-amber-500 text-amber-300 hover:text-neutral-950 border border-amber-500/40 text-xs font-semibold backdrop-blur-md transition-colors"
                >
                  Edit in Studio →
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 2. THREE PILLARS OF AN VALUEX */}
      <section className="border-y border-neutral-800 bg-neutral-950/60 py-20 px-6 md:px-12">
        <div className="max-w-7xl mx-auto space-y-12">
          <div className="text-center max-w-2xl mx-auto space-y-3">
            <h2 className="text-xs uppercase font-bold tracking-widest text-amber-400">
              Engineered For Packaging Professionals
            </h2>
            <p className="text-3xl sm:text-4xl font-bold text-white tracking-tight">
              From Prepress File to Photorealistic 3D Model
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="p-6 rounded-2xl bg-neutral-900/40 border border-neutral-800 space-y-4 hover:border-neutral-700 transition-colors">
              <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20 flex items-center justify-center">
                <Sliders className="w-5 h-5" />
              </div>
              <h3 className="text-base font-semibold text-white">Parametric 3D Geometries</h3>
              <p className="text-xs text-neutral-400 leading-relaxed">
                Full physical dimension control in millimeters, centimeters, and inches. Generate cartons with creases and flaps, bottles with custom necks and caps, and doypacks with volumetric gusset expansion.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-neutral-900/40 border border-neutral-800 space-y-4 hover:border-neutral-700 transition-colors">
              <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20 flex items-center justify-center">
                <Layers className="w-5 h-5" />
              </div>
              <h3 className="text-base font-semibold text-white">Zero-Distortion Artwork Mapping</h3>
              <p className="text-xs text-neutral-400 leading-relaxed">
                Preserve original vector lines, typography, and colors without AI redrawing. Support for PNG, JPG, WebP, SVG, and high-DPI PDF imports with flat dieline unwrap capabilities.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-neutral-900/40 border border-neutral-800 space-y-4 hover:border-neutral-700 transition-colors">
              <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20 flex items-center justify-center">
                <Share2 className="w-5 h-5" />
              </div>
              <h3 className="text-base font-semibold text-white">Interactive Client Presentations</h3>
              <p className="text-xs text-neutral-400 leading-relaxed">
                Send private, read-only 360° links to clients. Clients inspect the product on their phone or desktop with real-time orbit and turntable spin. Revoke links with a single click.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 3. PACKAGING CATEGORIES SHOWCASE */}
      <section className="py-20 px-6 md:px-12 max-w-7xl mx-auto w-full space-y-12">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div>
            <h2 className="text-xs uppercase font-bold tracking-widest text-amber-400">
              Supported Packaging Formats
            </h2>
            <p className="text-3xl font-bold text-white tracking-tight mt-1">
              Complete Structural Library
            </p>
          </div>
          <button
            onClick={() => onNavigate('/models')}
            className="text-xs text-amber-400 hover:text-amber-300 font-semibold flex items-center gap-1"
          >
            <span>Explore Full Catalog (34+ Models)</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Card 1: Box Packaging */}
          <div className="p-6 rounded-2xl bg-neutral-900/40 border border-neutral-800 hover:border-amber-500/50 transition-all flex flex-col justify-between space-y-4">
            <div>
              <div className="text-xs font-semibold text-amber-400 uppercase tracking-wider mb-2">
                Cartons & Boxes
              </div>
              <h3 className="text-lg font-bold text-white mb-2">Folding Cartons & Rigid Boxes</h3>
              <p className="text-xs text-neutral-400 leading-relaxed mb-4">
                Rectangular cartons, square boxes, tall tea boxes, tuck-end cartons, reverse tuck-end, sleeve boxes, rigid lid-and-base, and drawer boxes.
              </p>
              <ul className="text-xs text-neutral-300 space-y-1.5 font-mono">
                <li>· Flap crease & board caliper thickness</li>
                <li>· Front, Back, Sides, Lid & Base mapping</li>
                <li>· Flat dieline region slicer tool</li>
              </ul>
            </div>
            <button
              onClick={() => onNavigate('/studio')}
              className="w-full py-2 bg-neutral-800 hover:bg-neutral-700 text-white rounded-lg text-xs font-semibold transition-colors text-center"
            >
              Open Box Studio
            </button>
          </div>

          {/* Card 2: Bottles & Jars */}
          <div className="p-6 rounded-2xl bg-neutral-900/40 border border-neutral-800 hover:border-amber-500/50 transition-all flex flex-col justify-between space-y-4">
            <div>
              <div className="text-xs font-semibold text-amber-400 uppercase tracking-wider mb-2">
                Labels & Containers
              </div>
              <h3 className="text-lg font-bold text-white mb-2">Bottles, Tins & Cosmetic Jars</h3>
              <p className="text-xs text-neutral-400 leading-relaxed mb-4">
                Cylindrical bottles, square bottles, rectangular flasks, oval bottles, dropper serum bottles, pump shampoo bottles, glass jars, and metal tins.
              </p>
              <ul className="text-xs text-neutral-300 space-y-1.5 font-mono">
                <li>· Clear, frosted, and amber optical glass</li>
                <li>· 360° wraparound or front/back curved labels</li>
                <li>· Pump dispensers, dropper bulbs & caps</li>
              </ul>
            </div>
            <button
              onClick={() => onNavigate('/studio')}
              className="w-full py-2 bg-neutral-800 hover:bg-neutral-700 text-white rounded-lg text-xs font-semibold transition-colors text-center"
            >
              Open Bottle Studio
            </button>
          </div>

          {/* Card 3: Flexible Pouches */}
          <div className="p-6 rounded-2xl bg-neutral-900/40 border border-neutral-800 hover:border-amber-500/50 transition-all flex flex-col justify-between space-y-4">
            <div>
              <div className="text-xs font-semibold text-amber-400 uppercase tracking-wider mb-2">
                Flexible Packaging
              </div>
              <h3 className="text-lg font-bold text-white mb-2">Stand-Up Pouches & Doypacks</h3>
              <p className="text-xs text-neutral-400 leading-relaxed mb-4">
                Stand-up doypacks with expanding bottom gusset, flat 3-side seal sachets, quad-seal pouches, side-gusset coffee pouches, and spout pouches.
              </p>
              <ul className="text-xs text-neutral-300 space-y-1.5 font-mono">
                <li>· Heat seal bands & zipper indentations</li>
                <li>· Volumetric expansion fullness control</li>
                <li>· Degassing valves & pouring spouts</li>
              </ul>
            </div>
            <button
              onClick={() => onNavigate('/studio')}
              className="w-full py-2 bg-neutral-800 hover:bg-neutral-700 text-white rounded-lg text-xs font-semibold transition-colors text-center"
            >
              Open Pouch Studio
            </button>
          </div>
        </div>
      </section>

      {/* 4. WORKFLOW / HOW IT WORKS */}
      <section className="border-t border-neutral-800 bg-neutral-950 py-20 px-6 md:px-12">
        <div className="max-w-7xl mx-auto space-y-12">
          <div className="text-center max-w-2xl mx-auto space-y-2">
            <h2 className="text-xs uppercase font-bold tracking-widest text-amber-400">
              Effortless Prepress Workflow
            </h2>
            <p className="text-3xl font-bold text-white tracking-tight">
              Ready in 4 Simple Steps
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              {
                step: '01',
                title: 'Choose Geometry',
                desc: 'Select from folding cartons, bottles, or pouches. Input physical width, height, and depth in mm, cm, or in.',
              },
              {
                step: '02',
                title: 'Map Artwork',
                desc: 'Drop in your real artwork (PDF, PNG, SVG) onto front, back, flanks, or use the flat dieline slicer.',
              },
              {
                step: '03',
                title: 'Apply Finishes',
                desc: 'Select kraft, matte paper, clear glass, gold/silver hot foil stamping, and emboss/deboss depth.',
              },
              {
                step: '04',
                title: 'Export & Share',
                desc: 'Download 4K print-quality PNG renders with transparency, or generate a 360° interactive link for your client.',
              },
            ].map((item) => (
              <div key={item.step} className="p-6 rounded-2xl bg-neutral-900/30 border border-neutral-800 space-y-2">
                <span className="text-2xl font-bold font-mono text-amber-400/80">{item.step}</span>
                <h4 className="text-sm font-bold text-white">{item.title}</h4>
                <p className="text-xs text-neutral-400 leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 5. CALL TO ACTION BANNER */}
      <section className="py-20 px-6 md:px-12 max-w-5xl mx-auto w-full text-center space-y-6">
        <div className="p-10 rounded-3xl bg-gradient-to-b from-neutral-900 to-neutral-950 border border-neutral-800 space-y-6 shadow-2xl">
          <h2 className="text-3xl sm:text-4xl font-bold text-white tracking-tight">
            Elevate Your Packaging Presentations Today
          </h2>
          <p className="text-neutral-400 text-sm max-w-xl mx-auto leading-relaxed">
            Join professional packaging designers worldwide. Create an account in under 30 seconds. No credit card required, 100% free core platform.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-4 pt-2">
            <button
              onClick={() => onNavigate('/signup')}
              className="px-8 py-3.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-neutral-950 font-bold text-sm shadow-xl transition-all cursor-pointer"
            >
              Sign Up for Free
            </button>
            <button
              onClick={() => onNavigate('/studio')}
              className="px-8 py-3.5 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-white font-semibold text-sm border border-neutral-700 transition-all cursor-pointer"
            >
              Try Studio as Guest
            </button>
          </div>
        </div>
      </section>
    </div>
  );
};
