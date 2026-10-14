import React from 'react';
import {
  Box,
  Layers,
  Sparkles,
  Download,
  Share2,
  ShieldCheck,
  Sliders,
  CheckCircle2,
  Droplets,
  Sun,
  Eye,
  Scissors,
  FileCheck
} from 'lucide-react';

interface FeaturesPageProps {
  onNavigate: (path: string) => void;
}

export const FeaturesPage: React.FC<FeaturesPageProps> = ({ onNavigate }) => {
  return (
    <div className="w-full bg-neutral-950 text-neutral-100 py-16 px-6 md:px-12 select-none">
      <div className="max-w-6xl mx-auto space-y-16">
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-300 text-xs font-semibold">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Platform Capabilities</span>
          </div>
          <h1 className="text-4xl sm:text-5xl font-bold text-white tracking-tight">
            Features Built for Packaging Prepress & Visualization
          </h1>
          <p className="text-neutral-400 text-sm sm:text-base leading-relaxed">
            AN ValueX 3D Studio merges precision CAD-like structural packaging parameters with photorealistic Three.js rendering and client-ready presentation sharing.
          </p>
        </div>

        {/* Feature Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Feature 1 */}
          <div className="p-8 rounded-2xl bg-neutral-900/40 border border-neutral-800 space-y-4">
            <div className="w-12 h-12 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20 flex items-center justify-center">
              <Box className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-white">Parametric Packaging Geometry</h3>
            <p className="text-xs text-neutral-400 leading-relaxed">
              Every dimension you adjust modifies the actual 3D mesh in real time. Switch between millimeters (mm), centimeters (cm), and inches (in) with instantaneous physical accuracy. Supports folding carton flaps, board caliper thicknesses, bottle shoulder curvatures, and flexible pouch volumetric expansion.
            </p>
            <div className="pt-2 flex flex-wrap gap-2 text-[11px] font-mono text-neutral-300">
              <span className="bg-neutral-800 px-2 py-1 rounded">13 Box Formats</span>
              <span className="bg-neutral-800 px-2 py-1 rounded">12 Bottle/Jar Styles</span>
              <span className="bg-neutral-800 px-2 py-1 rounded">9 Pouch Structures</span>
            </div>
          </div>

          {/* Feature 2 */}
          <div className="p-8 rounded-2xl bg-neutral-900/40 border border-neutral-800 space-y-4">
            <div className="w-12 h-12 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20 flex items-center justify-center">
              <Layers className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-white">Artwork Fidelity & Prepress PDF Engine</h3>
            <p className="text-xs text-neutral-400 leading-relaxed">
              Zero artificial distortion. We render your original vector artwork and high-DPI PDFs directly on GPU textures using 300+ DPI canvas rasterization. Never alters brand logos, typography, legal facts, or barcodes. If your artwork doesn't match the panel aspect ratio, visual calibration guides prevent silent stretching.
            </p>
            <div className="pt-2 flex flex-wrap gap-2 text-[11px] font-mono text-neutral-300">
              <span className="bg-neutral-800 px-2 py-1 rounded">PDF First Page Render</span>
              <span className="bg-neutral-800 px-2 py-1 rounded">SVG / PNG / WebP</span>
              <span className="bg-neutral-800 px-2 py-1 rounded">Transparent PNG Layering</span>
            </div>
          </div>

          {/* Feature 3 */}
          <div className="p-8 rounded-2xl bg-neutral-900/40 border border-neutral-800 space-y-4">
            <div className="w-12 h-12 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20 flex items-center justify-center">
              <Scissors className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-white">Flat Dieline Unfolder & Panel Slicer</h3>
            <p className="text-xs text-neutral-400 leading-relaxed">
              Received an all-in-one dieline from an agency or printer? Drop the flat dieline sheet into our interactive dieline unfolder. Calibrate crop regions for Front, Back, Sides, Top Lid, and Bottom Base, and automatically map them onto individual 3D faces in a single click.
            </p>
            <div className="pt-2 flex flex-wrap gap-2 text-[11px] font-mono text-neutral-300">
              <span className="bg-neutral-800 px-2 py-1 rounded">Interactive 2D Crop</span>
              <span className="bg-neutral-800 px-2 py-1 rounded">Standard FEFCO/ECMA Layouts</span>
              <span className="bg-neutral-800 px-2 py-1 rounded">Multi-Surface Assignment</span>
            </div>
          </div>

          {/* Feature 4 */}
          <div className="p-8 rounded-2xl bg-neutral-900/40 border border-neutral-800 space-y-4">
            <div className="w-12 h-12 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20 flex items-center justify-center">
              <Droplets className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-white">PBR Packaging Materials & Special Finishes</h3>
            <p className="text-xs text-neutral-400 leading-relaxed">
              Simulate high-end finishes without complex 3D software. Includes Kraft paper with fibrous grain, soft-touch matte lamination, high-gloss clearcoat, clear and amber optical glass, and hot foil stamping in Yellow Gold, Champagne Gold, Silver Chrome, and Rose Gold with real-time embossing and debossing relief.
            </p>
            <div className="pt-2 flex flex-wrap gap-2 text-[11px] font-mono text-neutral-300">
              <span className="bg-neutral-800 px-2 py-1 rounded">Metallic Foil Stamping</span>
              <span className="bg-neutral-800 px-2 py-1 rounded">Embossing / Debossing</span>
              <span className="bg-neutral-800 px-2 py-1 rounded">Spot UV High Gloss</span>
            </div>
          </div>

          {/* Feature 5 */}
          <div className="p-8 rounded-2xl bg-neutral-900/40 border border-neutral-800 space-y-4">
            <div className="w-12 h-12 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20 flex items-center justify-center">
              <Download className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-white">True 4K WebGL Render Export</h3>
            <p className="text-xs text-neutral-400 leading-relaxed">
              Our export engine renders the 3D scene directly to an offscreen buffer at 1024×1024, 2048×2048 (2K), or 4096×4096 (4K prepress print resolution). Not a UI screenshot. Preserves true alpha transparency so you can place the isolated product with contact shadow directly into your client pitches.
            </p>
            <div className="pt-2 flex flex-wrap gap-2 text-[11px] font-mono text-neutral-300">
              <span className="bg-neutral-800 px-2 py-1 rounded">Up to 4K Print Renders</span>
              <span className="bg-neutral-800 px-2 py-1 rounded">Transparent Alpha PNG</span>
              <span className="bg-neutral-800 px-2 py-1 rounded">Batch 5-Angle Export</span>
            </div>
          </div>

          {/* Feature 6 */}
          <div className="p-8 rounded-2xl bg-neutral-900/40 border border-neutral-800 space-y-4">
            <div className="w-12 h-12 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20 flex items-center justify-center">
              <Share2 className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-white">Interactive Client 360° Previews</h3>
            <p className="text-xs text-neutral-400 leading-relaxed">
              Generate persistent, read-only 3D links for your clients. Clients can orbit, zoom, and inspect your mockup on any desktop or mobile browser without installing plugins or software. Strictly hides your private editing controls and allows instant link revocation whenever you choose.
            </p>
            <div className="pt-2 flex flex-wrap gap-2 text-[11px] font-mono text-neutral-300">
              <span className="bg-neutral-800 px-2 py-1 rounded">Zero-Client Install</span>
              <span className="bg-neutral-800 px-2 py-1 rounded">One-Click Link Revoke</span>
              <span className="bg-neutral-800 px-2 py-1 rounded">Strict Data Isolation</span>
            </div>
          </div>
        </div>

        {/* CTA */}
        <div className="text-center pt-8">
          <button
            onClick={() => onNavigate('/studio')}
            className="px-8 py-3.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-neutral-950 font-bold text-sm shadow-xl transition-all cursor-pointer"
          >
            Open 3D Studio & Try All Features
          </button>
        </div>
      </div>
    </div>
  );
};
