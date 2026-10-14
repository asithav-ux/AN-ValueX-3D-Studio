import React, { useState, useEffect } from 'react';
import {
  X,
  Share2,
  Copy,
  Check,
  ExternalLink,
  ShieldCheck,
  Sparkles,
  Smartphone,
  Eye,
  Ban
} from 'lucide-react';
import type { PackagingProject } from '../types/packaging';
import { useAuth } from '../context/AuthContext';

interface ShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  project: PackagingProject;
  onSaveProject: () => Promise<boolean>;
}

export const ShareModal: React.FC<ShareModalProps> = ({
  isOpen,
  onClose,
  project,
  onSaveProject,
}) => {
  const { authFetch } = useAuth();
  const [copied, setCopied] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [shareToken, setShareToken] = useState<string>(project.shareToken || project.id);
  const [isPublic, setIsPublic] = useState<boolean>(project.isPublicShare !== false);

  useEffect(() => {
    if (isOpen) {
      // Ensure project is saved and public link enabled
      handleEnableShare();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleEnableShare = async () => {
    setIsSyncing(true);
    await onSaveProject();

    try {
      const res = await authFetch(`/api/projects/${project.id}/share`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'enable' }),
      });
      if (res.ok) {
        const data = await res.json();
        setShareToken(data.shareToken || project.id);
        setIsPublic(true);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsSyncing(false);
    }
  };

  const handleRevokeShare = async () => {
    setIsSyncing(true);
    try {
      const res = await authFetch(`/api/projects/${project.id}/share`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'revoke' }),
      });
      if (res.ok) {
        setIsPublic(false);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsSyncing(false);
    }
  };

  const shareUrl = `${window.location.origin}/?preview=${shareToken}`;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm select-none">
      <div className="w-full max-w-lg bg-neutral-900 border border-neutral-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col text-neutral-200 animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="px-5 py-4 border-b border-neutral-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-amber-500/10 text-amber-400 border border-amber-500/20">
              <Share2 className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-neutral-100">Share Client 360° Presentation</h2>
              <p className="text-xs text-neutral-400">Interactive 3D presentation link for clients</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg hover:bg-neutral-800 text-neutral-400 hover:text-white transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 space-y-4">
          {isPublic ? (
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs font-semibold uppercase tracking-wider text-neutral-400">
                  Active Client Preview Link
                </label>
                <button
                  onClick={handleRevokeShare}
                  disabled={isSyncing}
                  className="text-[11px] text-red-400 hover:text-red-300 flex items-center gap-1 cursor-pointer"
                  title="Revoke client access immediately"
                >
                  <Ban className="w-3 h-3" />
                  <span>Revoke Link</span>
                </button>
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="text"
                  readOnly
                  value={shareUrl}
                  className="flex-1 bg-neutral-950 border border-neutral-800 rounded-lg px-3 py-2 text-xs text-neutral-300 font-mono select-all outline-none"
                />
                <button
                  onClick={handleCopy}
                  disabled={isSyncing}
                  className={`px-4 py-2 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors shrink-0 cursor-pointer ${
                    copied
                      ? 'bg-emerald-600 text-white'
                      : 'bg-amber-500 hover:bg-amber-400 text-neutral-950'
                  }`}
                >
                  {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copied ? 'Copied!' : 'Copy Link'}</span>
                </button>
              </div>

              <p className="text-[11px] text-neutral-500 mt-2">
                Saved in persistent database. Clients can orbit, zoom, and inspect your mockup on any desktop or mobile browser without signing in.
              </p>
            </div>
          ) : (
            <div className="p-4 rounded-xl bg-neutral-950 border border-neutral-800 space-y-3 text-center">
              <Ban className="w-6 h-6 text-neutral-500 mx-auto" />
              <div>
                <h4 className="text-xs font-semibold text-neutral-200">Public Link Revoked</h4>
                <p className="text-[11px] text-neutral-500 mt-0.5">
                  External clients can no longer access this 3D presentation.
                </p>
              </div>
              <button
                onClick={handleEnableShare}
                disabled={isSyncing}
                className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-neutral-950 text-xs font-semibold rounded-lg transition-colors cursor-pointer"
              >
                Re-Enable Public Sharing
              </button>
            </div>
          )}

          {/* Client Experience Highlights */}
          <div className="bg-neutral-950/60 p-4 rounded-xl border border-neutral-800 space-y-3">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-neutral-400 block">
              Presentation Security & Experience
            </span>
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="flex items-start gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <div>
                  <span className="font-medium text-neutral-200">Read-Only Safety</span>
                  <p className="text-[11px] text-neutral-500">Internal editing controls are completely hidden.</p>
                </div>
              </div>
              <div className="flex items-start gap-2">
                <Sparkles className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                <div>
                  <span className="font-medium text-neutral-200">Full 360° Orbit</span>
                  <p className="text-[11px] text-neutral-500">Clients can rotate, zoom, and toggle turntable spin.</p>
                </div>
              </div>
              <div className="flex items-start gap-2">
                <Smartphone className="w-4 h-4 text-sky-400 shrink-0 mt-0.5" />
                <div>
                  <span className="font-medium text-neutral-200">Mobile & Touch Ready</span>
                  <p className="text-[11px] text-neutral-500">Touch orbit and pinch-to-zoom on iOS & Android.</p>
                </div>
              </div>
              <div className="flex items-start gap-2">
                <Eye className="w-4 h-4 text-purple-400 shrink-0 mt-0.5" />
                <div>
                  <span className="font-medium text-neutral-200">PBR Studio Lighting</span>
                  <p className="text-[11px] text-neutral-500">Retains realistic materials, foil finishes & lighting.</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 py-4 border-t border-neutral-800 bg-neutral-950/80 flex items-center justify-between">
          <span className="text-xs text-neutral-400">
            Project: <strong className="text-neutral-200">{project.name}</strong>
          </span>
          {isPublic && (
            <button
              onClick={() => window.open(shareUrl, '_blank')}
              className="px-3.5 py-1.5 rounded-lg text-xs font-medium text-neutral-200 hover:text-white bg-neutral-800 hover:bg-neutral-700 border border-neutral-700/60 flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <span>Test Client View</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
