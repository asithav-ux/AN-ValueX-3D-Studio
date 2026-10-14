import React from 'react';
import { ShieldCheck, Lock, Database, ArrowLeft } from 'lucide-react';

interface PrivacyPolicyPageProps {
  onNavigate: (path: string) => void;
}

export const PrivacyPolicyPage: React.FC<PrivacyPolicyPageProps> = ({ onNavigate }) => {
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
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-xs font-semibold">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Strict User Data Isolation</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold text-white tracking-tight">
            Privacy Policy & Data Security
          </h1>
          <p className="text-xs text-neutral-400">
            Last updated: October 2026 · AN ValueX 3D Studio
          </p>
        </div>

        <div className="space-y-8 text-xs text-neutral-300 leading-relaxed">
          <section className="space-y-3 bg-neutral-900/30 p-6 rounded-2xl border border-neutral-800">
            <h2 className="text-sm font-bold text-white">1. Strict Multi-User Data Isolation</h2>
            <p>
              Every project, 3D model configuration, uploaded prepress artwork file, and personal setting belongs exclusively to your authenticated account.
              Our server enforces strict authorization at the database layer. No user can view, edit, duplicate, or delete another user's private projects by manipulating URLs, IDs, or client-side variables.
            </p>
          </section>

          <section className="space-y-3 bg-neutral-900/30 p-6 rounded-2xl border border-neutral-800">
            <h2 className="text-sm font-bold text-white">2. Your Artwork Ownership & Intellectual Property</h2>
            <p>
              You retain 100% ownership, copyright, and trademarks of all artwork, logos, packaging graphics, and dieline files you upload to AN ValueX 3D Studio.
              We do not train generative AI models on your designs. We do not sell, license, or expose your proprietary prepress files to third parties.
            </p>
          </section>

          <section className="space-y-3 bg-neutral-900/30 p-6 rounded-2xl border border-neutral-800">
            <h2 className="text-sm font-bold text-white">3. Public Client Previews & Instant Revocation</h2>
            <p>
              When you generate an interactive 360° client preview link, our system creates a sanitized read-only representation containing only the 3D geometry and mapped textures required for the viewer.
              Public previews never disclose your email address, account password, other projects, or private dashboard. You retain full control to revoke any shared link instantly from your dashboard. Once revoked, external access is immediately severed.
            </p>
          </section>

          <section className="space-y-3 bg-neutral-900/30 p-6 rounded-2xl border border-neutral-800">
            <h2 className="text-sm font-bold text-white">4. Password Protection & Cryptographic Security</h2>
            <p>
              Passwords are never stored in plain text. We utilize salted PBKDF2/scrypt cryptographic hashing with unique random salts for every account. Authenticated communication uses secure tokens over HTTPS.
            </p>
          </section>

          <section className="space-y-3 bg-neutral-900/30 p-6 rounded-2xl border border-neutral-800">
            <h2 className="text-sm font-bold text-white">5. Account Deletion & Right to Be Forgotten</h2>
            <p>
              You can permanently delete your account and all associated projects at any time from your Account Settings page. Account deletion immediately purges all user records, projects, and custom templates from the database.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
};
