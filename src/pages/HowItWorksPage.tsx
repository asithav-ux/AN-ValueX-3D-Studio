import React from 'react';
import {
  Box,
  Layers,
  Sparkles,
  Download,
  Share2,
  CheckCircle2,
  ArrowRight,
  HelpCircle
} from 'lucide-react';

interface HowItWorksPageProps {
  onNavigate: (path: string) => void;
}

export const HowItWorksPage: React.FC<HowItWorksPageProps> = ({ onNavigate }) => {
  const steps = [
    {
      num: '01',
      title: 'Select Structural Model & Enter Dimensions',
      desc: 'Pick your packaging geometry from our library of 34+ cartons, bottles, and pouches. Enter exact production dimensions in millimeters (mm), centimeters (cm), or inches (in). Adjust structural parameters such as paper caliper thickness, tuck flap edges, neck profiles, or pouch gusset depths.',
      tips: 'You can save your custom dimensions as reusable custom templates in your user dashboard.',
    },
    {
      num: '02',
      title: 'Upload Real Prepress Artwork Files',
      desc: 'Drag and drop your print-ready artwork (PDF, AI exports, high-DPI PNG, SVG, or WebP). Assign artwork to specific surfaces (Front, Back, Flanks, Lid, Base, Wraparound). If you have an all-in-one flat dieline, open the Flat Dieline Unfolder to crop and slice all panels in one go.',
      tips: 'Zero artificial distortion: original vector resolution and typography are preserved with pixel-perfect accuracy.',
    },
    {
      num: '03',
      title: 'Calibrate PBR Substrates & Special Finishes',
      desc: 'Select your physical substrate: uncoated matte paper, kraft paper, soft-touch matte laminate, high-gloss film, clear/amber glass, or tinplate metal. Add luxury special finishes including Yellow Gold, Champagne Gold, Silver Chrome, or Rose Gold hot foil stamping, plus emboss/deboss relief depths.',
      tips: 'Switch studio lighting presets (Soft Studio, Luxury Showcase, E-Commerce Bright, Dramatic Dark) to inspect specular reflections under different lighting conditions.',
    },
    {
      num: '04',
      title: 'Export 4K Renders & Share Interactive 360° Link',
      desc: 'Export high-resolution PNG renders at 1024px, 2048px, or 4096px (4K prepress) with transparent alpha channels. Click "Share Preview" to create a persistent, read-only 360° web link for your client. Clients can orbit, zoom, and inspect your mockup on any smartphone or computer without logging in.',
      tips: 'You can revoke public client preview links at any time from your dashboard with one click.',
    },
  ];

  const faqs = [
    {
      q: 'Is AN ValueX 3D Studio completely free to use?',
      a: 'Yes. Every registered user has full access to all custom box, bottle, and pouch models, artwork uploads, 3D viewing, high-resolution PNG exports, project saving, and client sharing without subscription paywalls or watermarks.',
    },
    {
      q: 'Does the application redraw or alter my uploaded artwork?',
      a: 'Never. AN ValueX preserves your uploaded artwork exactly as supplied. We do not use generative AI to redesign logos, alter typography, or rewrite legal facts. Your vector and high-DPI pixels are applied directly as real-time GPU textures.',
    },
    {
      q: 'Can my clients view the 3D model on mobile phones without installing apps?',
      a: 'Yes! When you click Share Client Preview, a lightweight web link is generated. Clients open the link in Safari, Chrome, or any mobile browser to orbit, zoom, and rotate the 3D packaging with standard touch gestures.',
    },
    {
      q: 'Are my projects private from other users?',
      a: 'Yes. AN ValueX enforces strict database-level and server-side user data isolation. Only you can view, edit, or delete your private projects. Public client links only expose the specific sanitized 3D model you have chosen to share, and you can revoke access at any time.',
    },
  ];

  return (
    <div className="w-full bg-neutral-950 text-neutral-100 py-16 px-6 md:px-12 select-none">
      <div className="max-w-5xl mx-auto space-y-16">
        {/* Header */}
        <div className="text-center max-w-2xl mx-auto space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-300 text-xs font-semibold">
            <Layers className="w-3.5 h-3.5" />
            <span>Prepress Workflow Guide</span>
          </div>
          <h1 className="text-4xl sm:text-5xl font-bold text-white tracking-tight">
            How AN ValueX 3D Studio Works
          </h1>
          <p className="text-neutral-400 text-sm leading-relaxed">
            A seamless bridge between flat prepress packaging files and interactive 3D client presentations.
          </p>
        </div>

        {/* Steps */}
        <div className="space-y-8">
          {steps.map((s) => (
            <div
              key={s.num}
              className="p-8 rounded-2xl bg-neutral-900/40 border border-neutral-800 space-y-3 relative overflow-hidden"
            >
              <div className="flex items-center gap-4">
                <span className="text-2xl font-bold font-mono text-amber-400 bg-amber-500/10 px-3 py-1 rounded-lg border border-amber-500/20">
                  {s.num}
                </span>
                <h3 className="text-lg font-bold text-white">{s.title}</h3>
              </div>
              <p className="text-xs text-neutral-400 leading-relaxed pl-14">{s.desc}</p>
              <div className="ml-14 p-2.5 rounded-lg bg-neutral-950 border border-neutral-800/80 text-[11px] text-amber-300/90 font-medium">
                💡 Pro Tip: {s.tips}
              </div>
            </div>
          ))}
        </div>

        {/* FAQ Section */}
        <div className="pt-8 border-t border-neutral-800 space-y-8">
          <div className="text-center space-y-2">
            <h2 className="text-2xl font-bold text-white tracking-tight">
              Frequently Asked Questions
            </h2>
            <p className="text-xs text-neutral-400">Everything you need to know about the platform</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {faqs.map((f, idx) => (
              <div key={idx} className="p-6 rounded-2xl bg-neutral-900/30 border border-neutral-800 space-y-2">
                <h4 className="text-sm font-semibold text-white flex items-start gap-2">
                  <HelpCircle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                  <span>{f.q}</span>
                </h4>
                <p className="text-xs text-neutral-400 leading-relaxed pl-6">{f.a}</p>
              </div>
            ))}
          </div>
        </div>

        {/* CTA */}
        <div className="text-center pt-8">
          <button
            onClick={() => onNavigate('/signup')}
            className="px-8 py-3.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-neutral-950 font-bold text-sm shadow-xl transition-all cursor-pointer"
          >
            Create Your Free Account Now
          </button>
        </div>
      </div>
    </div>
  );
};
