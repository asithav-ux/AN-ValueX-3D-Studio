import React from 'react';
import { ArrowLeft, CheckCircle2 } from 'lucide-react';

interface TermsPageProps {
  onNavigate: (path: string) => void;
}

export const TermsPage: React.FC<TermsPageProps> = ({ onNavigate }) => {
  return (
    <div className="w-full bg-neutral-950 text-neutral-100 py-16 px-6 md:px-12 select-none">
      <div className="max-w-4xl mx-auto space-y-10">
        <button
          onClick={() => onNavigate('/')}
          className="text-xs text-amber-400 hover:text-amber-300 flex items-center gap-1.5 cursor-pointer"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Home</span>
        </button>

        <div className="space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-300 text-xs font-semibold">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Free-To-Use Charter</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold text-white tracking-tight">
            Terms of Service & Free-to-Use Policy
          </h1>
          <p className="text-xs text-neutral-400">
            Last updated: October 2026 · AN ValueX 3D Studio
          </p>
        </div>

        <div className="space-y-8 text-xs text-neutral-300 leading-relaxed">
          <section className="space-y-3 bg-neutral-900/30 p-6 rounded-2xl border border-neutral-800">
            <h2 className="text-sm font-bold text-white">1. Core Free-to-Use Policy</h2>
            <p>
              AN ValueX 3D Studio is provided as a publicly accessible, free-to-use web platform for packaging designers, brand owners, and prepress artists.
              We do not impose mandatory subscriptions, credit paywalls for basic 3D operations, payment gates for 4K PNG exports, or watermarks on rendered images.
            </p>
          </section>

          <section className="space-y-3 bg-neutral-900/30 p-6 rounded-2xl border border-neutral-800">
            <h2 className="text-sm font-bold text-white">2. Full Commercial Rights to Exported Renders</h2>
            <p>
              Any PNG render, turntable sequence, or client presentation link generated within AN ValueX 3D Studio is 100% royalty-free for personal and commercial use. You may use your renders in pitch decks, portfolio presentations, client approvals, e-commerce storefronts, and marketing materials without attribution fees.
            </p>
          </section>

          <section className="space-y-3 bg-neutral-900/30 p-6 rounded-2xl border border-neutral-800">
            <h2 className="text-sm font-bold text-white">3. Acceptable Use Policy</h2>
            <p>
              Users agree not to upload malicious scripts, viruses, or content that infringes upon third-party copyrights or violates applicable laws. We reserve the right to suspend accounts that engage in automated abuse or deliberate denial-of-service attempts.
            </p>
          </section>

          <section className="space-y-3 bg-neutral-900/30 p-6 rounded-2xl border border-neutral-800">
            <h2 className="text-sm font-bold text-white">4. Availability & Reliability</h2>
            <p>
              We strive to maintain continuous availability and data integrity for all saved projects. However, the service is provided on an "as is" and "as available" basis. Designers are encouraged to download and back up their final 4K renders and project assets locally.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
};
