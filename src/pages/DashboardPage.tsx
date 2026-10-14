import React, { useState, useEffect } from 'react';
import {
  FolderOpen,
  Plus,
  Box,
  Copy,
  Trash2,
  Share2,
  Calendar,
  Layers,
  Edit2,
  ExternalLink,
  Search,
  Filter,
  Check,
  AlertCircle,
  ShieldCheck,
  Sliders,
  User,
  Key,
  LogOut,
  RefreshCw,
  Sparkles,
  Link,
  Ban
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import type { PackagingCategory, PackagingModelType, PackagingProject } from '../types/packaging';

interface DashboardPageProps {
  onNavigate: (path: string) => void;
  onOpenProjectInStudio: (projectId: string) => void;
  onCreateNewProject: (category: PackagingCategory) => void;
}

export const DashboardPage: React.FC<DashboardPageProps> = ({
  onNavigate,
  onOpenProjectInStudio,
  onCreateNewProject,
}) => {
  const { user, logout, authFetch, updateProfile, changePassword, deleteAccount } = useAuth();
  const [activeTab, setActiveTab] = useState<'projects' | 'templates' | 'shared' | 'account'>('projects');
  const [projects, setProjects] = useState<any[]>([]);
  const [templates, setTemplates] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<'all' | 'box' | 'label' | 'pouch'>('all');
  const [showNewModal, setShowNewModal] = useState(false);

  // Profile edit state
  const [editName, setEditName] = useState(user?.name || '');
  const [editCompany, setEditCompany] = useState(user?.company || '');
  const [profileMsg, setProfileMsg] = useState<string | null>(null);

  // Password change state
  const [currentPw, setCurrentPw] = useState('');
  const [newPw, setNewPw] = useState('');
  const [pwMsg, setPwMsg] = useState<string | null>(null);
  const [pwErr, setPwErr] = useState<string | null>(null);

  // Copied link indicator
  const [copiedToken, setCopiedToken] = useState<string | null>(null);

  const fetchUserProjects = async () => {
    setIsLoading(true);
    try {
      const res = await authFetch('/api/projects');
      if (res.ok) {
        const data = await res.json();
        setProjects(data);
      }
    } catch (err) {
      console.error('Fetch projects error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchUserTemplates = async () => {
    try {
      const res = await authFetch('/api/templates');
      if (res.ok) {
        const data = await res.json();
        setTemplates(data);
      }
    } catch (err) {
      console.error('Fetch templates error:', err);
    }
  };

  useEffect(() => {
    fetchUserProjects();
    fetchUserTemplates();
  }, []);

  const handleDuplicate = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    try {
      const res = await authFetch(`/api/projects/${id}/duplicate`, { method: 'POST' });
      if (res.ok) {
        fetchUserProjects();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteProject = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (!confirm('Are you sure you want to delete this project?')) return;
    try {
      const res = await authFetch(`/api/projects/${id}`, { method: 'DELETE' });
      if (res.ok) {
        setProjects((prev) => prev.filter((p) => p.id !== id));
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleToggleShare = async (e: React.MouseEvent, id: string, currentShareState: boolean) => {
    e.stopPropagation();
    try {
      const action = currentShareState ? 'revoke' : 'enable';
      const res = await authFetch(`/api/projects/${id}/share`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action }),
      });
      if (res.ok) {
        fetchUserProjects();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleCopyShareLink = (e: React.MouseEvent, tokenOrId: string) => {
    e.stopPropagation();
    const url = `${window.location.origin}/?preview=${tokenOrId}`;
    navigator.clipboard.writeText(url);
    setCopiedToken(tokenOrId);
    setTimeout(() => setCopiedToken(null), 2000);
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setProfileMsg(null);
    const res = await updateProfile(editName, editCompany);
    if (res.success) {
      setProfileMsg('Profile updated successfully');
      setTimeout(() => setProfileMsg(null), 3000);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPwMsg(null);
    setPwErr(null);
    const res = await changePassword(currentPw, newPw);
    if (res.success) {
      setPwMsg('Password updated successfully');
      setCurrentPw('');
      setNewPw('');
      setTimeout(() => setPwMsg(null), 3000);
    } else {
      setPwErr(res.error || 'Password update failed');
    }
  };

  const handleDeleteAccount = async () => {
    if (
      !confirm(
        'WARNING: This will permanently erase your account, all private packaging projects, and saved model templates. This action cannot be undone. Proceed?'
      )
    ) {
      return;
    }
    await deleteAccount();
    onNavigate('/');
  };

  const filteredProjects = projects.filter((p) => {
    const matchesCat = categoryFilter === 'all' || p.category === categoryFilter;
    const matchesSearch =
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.modelType.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCat && matchesSearch;
  });

  const sharedProjects = projects.filter((p) => p.isPublicShare && p.shareToken);

  return (
    <div className="w-full min-h-[calc(100vh-4rem)] bg-neutral-950 text-neutral-100 py-10 px-6 md:px-12 select-none">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Top User Greeting & Action Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 bg-neutral-900/60 border border-neutral-800 rounded-3xl shadow-xl">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-amber-500/20 to-neutral-800 border border-amber-500/30 flex items-center justify-center text-amber-400 font-bold text-lg">
              {user?.name ? user.name.charAt(0).toUpperCase() : 'U'}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-bold text-white tracking-tight">
                  Welcome, {user?.name || 'Designer'}
                </h1>
                <span className="text-[10px] bg-emerald-500/10 text-emerald-400 px-2 py-0.5 rounded border border-emerald-500/20 font-semibold">
                  Free Account
                </span>
              </div>
              <p className="text-xs text-neutral-400 mt-0.5">
                {user?.company ? `${user.company} · ` : ''}{user?.email}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowNewModal(true)}
              className="px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-neutral-950 font-bold text-xs flex items-center gap-1.5 shadow-md transition-all cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Create New Project</span>
            </button>
            <button
              onClick={() => onNavigate('/studio')}
              className="px-4 py-2.5 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-white font-semibold text-xs border border-neutral-700 transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <Box className="w-4 h-4 text-amber-400" />
              <span>Open Studio</span>
            </button>
          </div>
        </div>

        {/* Dashboard Navigation Tabs */}
        <div className="flex border-b border-neutral-800 gap-6 text-xs font-medium">
          <button
            onClick={() => setActiveTab('projects')}
            className={`pb-3 transition-colors cursor-pointer flex items-center gap-2 ${
              activeTab === 'projects'
                ? 'text-amber-300 font-bold border-b-2 border-amber-400'
                : 'text-neutral-400 hover:text-white'
            }`}
          >
            <FolderOpen className="w-4 h-4" />
            <span>My Projects ({projects.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('shared')}
            className={`pb-3 transition-colors cursor-pointer flex items-center gap-2 ${
              activeTab === 'shared'
                ? 'text-amber-300 font-bold border-b-2 border-amber-400'
                : 'text-neutral-400 hover:text-white'
            }`}
          >
            <Share2 className="w-4 h-4" />
            <span>Shared Client Previews ({sharedProjects.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('templates')}
            className={`pb-3 transition-colors cursor-pointer flex items-center gap-2 ${
              activeTab === 'templates'
                ? 'text-amber-300 font-bold border-b-2 border-amber-400'
                : 'text-neutral-400 hover:text-white'
            }`}
          >
            <Sliders className="w-4 h-4" />
            <span>Custom Model Templates ({templates.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('account')}
            className={`pb-3 transition-colors cursor-pointer flex items-center gap-2 ${
              activeTab === 'account'
                ? 'text-amber-300 font-bold border-b-2 border-amber-400'
                : 'text-neutral-400 hover:text-white'
            }`}
          >
            <User className="w-4 h-4" />
            <span>Account & Security</span>
          </button>
        </div>

        {/* TAB 1: PROJECTS */}
        {activeTab === 'projects' && (
          <div className="space-y-6">
            {/* Search & Category Filter */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-2 bg-neutral-900/40 border border-neutral-800 rounded-2xl">
              <div className="flex items-center gap-1.5 p-1 bg-neutral-950 rounded-xl border border-neutral-800/80 w-full sm:w-auto">
                {(['all', 'box', 'label', 'pouch'] as const).map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setCategoryFilter(cat)}
                    className={`flex-1 sm:flex-none px-3.5 py-1.5 rounded-lg text-xs font-medium capitalize transition-colors ${
                      categoryFilter === cat
                        ? 'bg-neutral-800 text-amber-300 font-semibold shadow-sm'
                        : 'text-neutral-400 hover:text-white'
                    }`}
                  >
                    {cat === 'all' ? 'All' : cat === 'box' ? 'Boxes' : cat === 'label' ? 'Bottles & Jars' : 'Pouches'}
                  </button>
                ))}
              </div>

              <div className="relative w-full sm:w-72">
                <Search className="w-4 h-4 text-neutral-500 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search projects by name..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-neutral-950 border border-neutral-800 rounded-xl pl-9 pr-3 py-2 text-xs text-neutral-200 outline-none focus:border-amber-500"
                />
              </div>
            </div>

            {/* Project Grid */}
            {isLoading ? (
              <div className="py-20 text-center text-xs text-neutral-500 flex items-center justify-center gap-2">
                <RefreshCw className="w-4 h-4 animate-spin text-amber-400" />
                <span>Loading your projects...</span>
              </div>
            ) : filteredProjects.length === 0 ? (
              <div className="p-12 text-center rounded-2xl border-2 border-dashed border-neutral-800 bg-neutral-900/20 space-y-4">
                <FolderOpen className="w-10 h-10 text-neutral-600 mx-auto" />
                <div>
                  <h3 className="text-sm font-semibold text-neutral-200">No Projects Found</h3>
                  <p className="text-xs text-neutral-400 mt-1">
                    {searchQuery ? 'Try a different search query' : 'Create your first packaging mockup to get started'}
                  </p>
                </div>
                <button
                  onClick={() => setShowNewModal(true)}
                  className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-neutral-950 rounded-xl text-xs font-bold transition-colors cursor-pointer"
                >
                  Create Project
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredProjects.map((p) => (
                  <div
                    key={p.id}
                    onClick={() => onOpenProjectInStudio(p.id)}
                    className="p-5 rounded-2xl bg-neutral-900/40 border border-neutral-800 hover:border-amber-500/60 transition-all flex flex-col justify-between space-y-4 group cursor-pointer"
                  >
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/20">
                          {p.category}
                        </span>
                        {p.isPublicShare && (
                          <span className="text-[10px] bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded border border-emerald-500/30 flex items-center gap-1">
                            <Share2 className="w-2.5 h-2.5" />
                            <span>Shared</span>
                          </span>
                        )}
                      </div>

                      <h3 className="text-sm font-bold text-white group-hover:text-amber-300 transition-colors line-clamp-1">
                        {p.name}
                      </h3>

                      <div className="flex items-center gap-2 text-xs text-neutral-400">
                        <span className="capitalize">{p.modelType.replace(/-/g, ' ')}</span>
                        <span>·</span>
                        <span>{p.artworkCount} mapped surfaces</span>
                      </div>
                    </div>

                    <div className="pt-3 border-t border-neutral-800/80 flex items-center justify-between text-xs">
                      <span className="text-[11px] text-neutral-500">
                        Updated {new Date(p.updatedAt).toLocaleDateString()}
                      </span>

                      <div className="flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
                        <button
                          onClick={(e) => handleDuplicate(e, p.id)}
                          className="p-1.5 rounded-lg hover:bg-neutral-800 text-neutral-400 hover:text-white transition-colors"
                          title="Duplicate"
                        >
                          <Copy className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={(e) => handleDeleteProject(e, p.id)}
                          className="p-1.5 rounded-lg hover:bg-red-950/40 text-neutral-400 hover:text-red-400 transition-colors"
                          title="Delete"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => onOpenProjectInStudio(p.id)}
                          className="px-3 py-1.5 rounded-lg bg-neutral-800 hover:bg-amber-500 hover:text-neutral-950 text-white font-medium text-xs transition-colors"
                        >
                          Open in 3D
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* TAB 2: SHARED CLIENT PREVIEWS */}
        {activeTab === 'shared' && (
          <div className="space-y-6">
            <div className="p-4 bg-neutral-900/40 border border-neutral-800 rounded-2xl flex items-start gap-3 text-xs text-neutral-300">
              <ShieldCheck className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
              <div>
                <span className="font-semibold text-white">Public Presentation Security:</span>{' '}
                These are the active 360° preview links you have generated for clients. Anyone with the link can view your 3D mockup without signing in. You can revoke any link instantly at any time to disable client access.
              </div>
            </div>

            {sharedProjects.length === 0 ? (
              <div className="p-12 text-center rounded-2xl border-2 border-dashed border-neutral-800 bg-neutral-900/20 space-y-2">
                <Share2 className="w-8 h-8 text-neutral-600 mx-auto" />
                <h3 className="text-sm font-semibold text-neutral-200">No Active Client Links</h3>
                <p className="text-xs text-neutral-400">
                  Open any project in the 3D Studio and click "Share Preview" to create an interactive client presentation.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {sharedProjects.map((p) => {
                  const previewUrl = `${window.location.origin}/?preview=${p.shareToken || p.id}`;
                  const isCopied = copiedToken === (p.shareToken || p.id);
                  return (
                    <div
                      key={p.id}
                      className="p-4 rounded-xl bg-neutral-900/60 border border-neutral-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-sm text-white">{p.name}</span>
                          <span className="text-[10px] bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded font-mono">
                            ACTIVE
                          </span>
                        </div>
                        <div className="text-xs text-neutral-400 font-mono truncate max-w-md">
                          {previewUrl}
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <button
                          onClick={(e) => handleCopyShareLink(e, p.shareToken || p.id)}
                          className="px-3 py-1.5 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-200 text-xs font-semibold flex items-center gap-1.5 transition-colors"
                        >
                          {isCopied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                          <span>{isCopied ? 'Copied' : 'Copy Link'}</span>
                        </button>

                        <button
                          onClick={() => window.open(previewUrl, '_blank')}
                          className="p-1.5 rounded-lg hover:bg-neutral-800 text-neutral-400 hover:text-white transition-colors"
                          title="Open Client View"
                        >
                          <ExternalLink className="w-4 h-4" />
                        </button>

                        <button
                          onClick={(e) => handleToggleShare(e, p.id, true)}
                          className="px-3 py-1.5 rounded-lg bg-red-950/40 hover:bg-red-900/60 border border-red-800/40 text-red-300 text-xs font-medium flex items-center gap-1.5 transition-colors"
                          title="Revoke client access immediately"
                        >
                          <Ban className="w-3.5 h-3.5" />
                          <span>Revoke Link</span>
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* TAB 3: CUSTOM MODEL TEMPLATES */}
        {activeTab === 'templates' && (
          <div className="space-y-6">
            <div className="p-4 bg-neutral-900/40 border border-neutral-800 rounded-2xl flex items-center justify-between text-xs">
              <span className="text-neutral-300">
                Save recurring client box dies and bottle dimensions as templates for 1-click startup.
              </span>
            </div>

            {templates.length === 0 ? (
              <div className="p-12 text-center rounded-2xl border-2 border-dashed border-neutral-800 bg-neutral-900/20 space-y-2">
                <Sliders className="w-8 h-8 text-neutral-600 mx-auto" />
                <h3 className="text-sm font-semibold text-neutral-200">No Saved Custom Templates</h3>
                <p className="text-xs text-neutral-400">
                  You can save dimension presets inside the 3D Studio Right Sidebar.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {templates.map((t) => (
                  <div key={t.id} className="p-5 rounded-2xl bg-neutral-900/40 border border-neutral-800 space-y-3">
                    <span className="text-[10px] font-bold text-amber-400 uppercase tracking-wider">{t.category}</span>
                    <h4 className="text-sm font-bold text-white">{t.name}</h4>
                    <p className="text-xs text-neutral-400 font-mono">Unit: {t.displayUnit}</p>
                    <button
                      onClick={() => onNavigate('/studio')}
                      className="w-full py-2 bg-neutral-800 hover:bg-amber-500 hover:text-neutral-950 text-white text-xs font-semibold rounded-lg transition-colors"
                    >
                      Use Template
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* TAB 4: ACCOUNT & PROFILE SETTINGS */}
        {activeTab === 'account' && (
          <div className="max-w-2xl space-y-8">
            {/* Profile Settings */}
            <form onSubmit={handleSaveProfile} className="p-6 rounded-2xl bg-neutral-900/40 border border-neutral-800 space-y-4">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <User className="w-4 h-4 text-amber-400" />
                <span>Profile Information</span>
              </h3>

              {profileMsg && (
                <div className="p-2.5 rounded-lg bg-emerald-950/40 border border-emerald-800/40 text-xs text-emerald-300">
                  {profileMsg}
                </div>
              )}

              <div>
                <label className="text-xs text-neutral-400 block mb-1">Full Name</label>
                <input
                  type="text"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-2 text-xs text-neutral-200 outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="text-xs text-neutral-400 block mb-1">Studio / Company Name</label>
                <input
                  type="text"
                  value={editCompany}
                  onChange={(e) => setEditCompany(e.target.value)}
                  className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-2 text-xs text-neutral-200 outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="text-xs text-neutral-400 block mb-1">Email Address</label>
                <input
                  type="email"
                  disabled
                  value={user?.email || ''}
                  className="w-full bg-neutral-950/50 border border-neutral-800/60 rounded-xl px-3 py-2 text-xs text-neutral-500 cursor-not-allowed font-mono"
                />
              </div>

              <button
                type="submit"
                className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-neutral-950 font-semibold text-xs rounded-xl transition-colors cursor-pointer"
              >
                Save Profile
              </button>
            </form>

            {/* Change Password */}
            <form onSubmit={handleChangePassword} className="p-6 rounded-2xl bg-neutral-900/40 border border-neutral-800 space-y-4">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Key className="w-4 h-4 text-amber-400" />
                <span>Change Password</span>
              </h3>

              {pwMsg && (
                <div className="p-2.5 rounded-lg bg-emerald-950/40 border border-emerald-800/40 text-xs text-emerald-300">
                  {pwMsg}
                </div>
              )}
              {pwErr && (
                <div className="p-2.5 rounded-lg bg-red-950/40 border border-red-800/40 text-xs text-red-300">
                  {pwErr}
                </div>
              )}

              <div>
                <label className="text-xs text-neutral-400 block mb-1">Current Password</label>
                <input
                  type="password"
                  required
                  value={currentPw}
                  onChange={(e) => setCurrentPw(e.target.value)}
                  className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-2 text-xs text-neutral-200 outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="text-xs text-neutral-400 block mb-1">New Password (Min. 8 characters)</label>
                <input
                  type="password"
                  required
                  minLength={8}
                  value={newPw}
                  onChange={(e) => setNewPw(e.target.value)}
                  className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-2 text-xs text-neutral-200 outline-none focus:border-amber-500"
                />
              </div>

              <button
                type="submit"
                className="px-4 py-2 bg-neutral-800 hover:bg-neutral-700 text-white font-semibold text-xs rounded-xl border border-neutral-700 transition-colors cursor-pointer"
              >
                Update Password
              </button>
            </form>

            {/* Danger Zone: Logout and Delete Account */}
            <div className="p-6 rounded-2xl bg-red-950/20 border border-red-900/40 space-y-4">
              <h3 className="text-base font-bold text-red-400 flex items-center gap-2">
                <AlertCircle className="w-4 h-4" />
                <span>Account Management</span>
              </h3>

              <div className="flex flex-wrap items-center justify-between gap-4 pt-2">
                <button
                  type="button"
                  onClick={async () => {
                    await logout();
                    onNavigate('/');
                  }}
                  className="px-4 py-2 bg-neutral-800 hover:bg-neutral-700 text-white text-xs font-semibold rounded-xl border border-neutral-700 transition-colors flex items-center gap-1.5"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>Log Out of Session</span>
                </button>

                <button
                  type="button"
                  onClick={handleDeleteAccount}
                  className="px-4 py-2 bg-red-600 hover:bg-red-500 text-white text-xs font-semibold rounded-xl shadow-md transition-colors"
                >
                  Delete Account Permanently
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Modal: Create New Project Wizard */}
        {showNewModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm select-none">
            <div className="w-full max-w-lg bg-neutral-900 border border-neutral-800 rounded-3xl p-6 shadow-2xl space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-base font-bold text-white">Create New Packaging Mockup</h3>
                <button
                  onClick={() => setShowNewModal(false)}
                  className="text-neutral-500 hover:text-white text-xs"
                >
                  Cancel
                </button>
              </div>

              <p className="text-xs text-neutral-400">
                Choose the base packaging format to start customizing:
              </p>

              <div className="grid grid-cols-1 gap-3">
                {[
                  {
                    cat: 'box' as const,
                    title: 'Box & Folding Carton',
                    desc: 'Folding cartons, cosmetic boxes, tea boxes, sleeve and rigid gift boxes.',
                  },
                  {
                    cat: 'label' as const,
                    title: 'Bottle, Jar & Metal Tin',
                    desc: 'Cylindrical glass bottles, dropper serums, shampoo pumps, and metal canisters.',
                  },
                  {
                    cat: 'pouch' as const,
                    title: 'Stand-Up Pouch & Flexible Bag',
                    desc: 'Doypacks with bottom gusset expansion, zip seals, coffee valves, and spouts.',
                  },
                ].map((item) => (
                  <button
                    key={item.cat}
                    onClick={() => {
                      onCreateNewProject(item.cat);
                      setShowNewModal(false);
                      onNavigate('/studio');
                    }}
                    className="p-4 rounded-xl border border-neutral-800 hover:border-amber-500/60 bg-neutral-950/60 hover:bg-neutral-950 text-left transition-all group cursor-pointer"
                  >
                    <div className="text-sm font-bold text-white group-hover:text-amber-300">
                      {item.title}
                    </div>
                    <div className="text-xs text-neutral-400 mt-1">{item.desc}</div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
