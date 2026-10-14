import React, { useState, useEffect } from 'react';
import {
  X,
  FolderOpen,
  Plus,
  Copy,
  Trash2,
  Calendar,
  Layers,
  ArrowRight,
  Check,
  Edit2
} from 'lucide-react';
import type { PackagingCategory, PackagingProject } from '../types/packaging';

interface ProjectsModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentProjectId: string;
  onLoadProject: (project: PackagingProject) => void;
  onCreateNew: (category: PackagingCategory) => void;
}

interface ProjectSummary {
  id: string;
  name: string;
  category: PackagingCategory;
  modelType: string;
  createdAt: string;
  updatedAt: string;
  artworkCount: number;
}

export const ProjectsModal: React.FC<ProjectsModalProps> = ({
  isOpen,
  onClose,
  currentProjectId,
  onLoadProject,
  onCreateNew,
}) => {
  const [projects, setProjects] = useState<ProjectSummary[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showNewPicker, setShowNewPicker] = useState(false);

  const fetchProjects = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/projects');
      if (!res.ok) throw new Error('Failed to fetch projects');
      const data = await res.json();
      setProjects(data);
    } catch (err: any) {
      console.error('Fetch projects error:', err);
      // Fallback: check localStorage
      try {
        const local = localStorage.getItem('vx_projects_cache');
        if (local) setProjects(JSON.parse(local));
      } catch {}
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchProjects();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSelectProject = async (id: string) => {
    try {
      setIsLoading(true);
      const res = await fetch(`/api/projects/${id}`);
      if (!res.ok) throw new Error('Project not found');
      const fullProject = await res.json();
      onLoadProject(fullProject);
      onClose();
    } catch (err: any) {
      setError(err.message || 'Could not load project');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDuplicate = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    try {
      const res = await fetch(`/api/projects/${id}/duplicate`, { method: 'POST' });
      if (res.ok) {
        fetchProjects();
      }
    } catch (err) {
      console.error('Duplicate error:', err);
    }
  };

  const handleDelete = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (!confirm('Are you sure you want to permanently delete this project?')) return;

    try {
      const res = await fetch(`/api/projects/${id}`, { method: 'DELETE' });
      if (res.ok) {
        setProjects((prev) => prev.filter((p) => p.id !== id));
      }
    } catch (err) {
      console.error('Delete error:', err);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm select-none">
      <div className="w-full max-w-2xl bg-neutral-900 border border-neutral-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col text-neutral-200 animate-in fade-in zoom-in-95 duration-150 max-h-[85vh]">
        {/* Header */}
        <div className="px-5 py-4 border-b border-neutral-800 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-amber-500/10 text-amber-400 border border-amber-500/20">
              <FolderOpen className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-neutral-100">Saved Packaging Projects</h2>
              <p className="text-xs text-neutral-400">Manage designs, mockups & client presentations</p>
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
        <div className="p-5 flex-1 overflow-y-auto space-y-4 custom-scrollbar">
          {/* Action Bar */}
          <div className="flex items-center justify-between">
            <span className="text-xs text-neutral-400">
              {projects.length} Saved {projects.length === 1 ? 'Project' : 'Projects'}
            </span>
            <button
              onClick={() => setShowNewPicker(true)}
              className="px-3 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-neutral-950 font-semibold text-xs flex items-center gap-1.5 transition-colors shadow-sm"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>New Project</span>
            </button>
          </div>

          {/* New Project Format Picker */}
          {showNewPicker && (
            <div className="p-4 bg-neutral-950 border border-amber-500/30 rounded-xl space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-amber-300">
                  Select Packaging Category for New Project
                </span>
                <button
                  onClick={() => setShowNewPicker(false)}
                  className="text-neutral-500 hover:text-neutral-300 text-xs"
                >
                  Cancel
                </button>
              </div>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { cat: 'box' as const, title: 'Box & Carton', desc: 'Folding cartons, gift boxes, tubes' },
                  { cat: 'label' as const, title: 'Bottles & Tins', desc: 'Glass, plastic bottles, tins & jars' },
                  { cat: 'pouch' as const, title: 'Pouches & Bags', desc: 'Stand-up doypacks, zipper bags' },
                ].map((item) => (
                  <button
                    key={item.cat}
                    onClick={() => {
                      onCreateNew(item.cat);
                      setShowNewPicker(false);
                      onClose();
                    }}
                    className="p-3 rounded-lg border border-neutral-800 hover:border-amber-500/50 bg-neutral-900/60 hover:bg-neutral-900 text-left transition-colors group"
                  >
                    <div className="text-xs font-semibold text-neutral-200 group-hover:text-amber-300">
                      {item.title}
                    </div>
                    <div className="text-[11px] text-neutral-500 mt-0.5">{item.desc}</div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Projects List */}
          {isLoading && projects.length === 0 ? (
            <div className="text-center py-10 text-xs text-neutral-500">
              Loading projects from storage...
            </div>
          ) : projects.length === 0 ? (
            <div className="text-center py-12 border border-dashed border-neutral-800 rounded-xl bg-neutral-950/40">
              <FolderOpen className="w-8 h-8 text-neutral-600 mx-auto mb-2" />
              <p className="text-xs text-neutral-400 font-medium">No saved projects yet</p>
              <p className="text-[11px] text-neutral-500 mt-1">
                Click "Save" in the top bar to save your current packaging mockup.
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {projects.map((p) => {
                const isCurrent = p.id === currentProjectId;
                return (
                  <div
                    key={p.id}
                    onClick={() => handleSelectProject(p.id)}
                    className={`p-3.5 rounded-xl border transition-all flex items-center justify-between cursor-pointer ${
                      isCurrent
                        ? 'bg-neutral-800/80 border-amber-500/60 text-white shadow-sm'
                        : 'bg-neutral-950/40 border-neutral-800 hover:border-neutral-700 text-neutral-300'
                    }`}
                  >
                    <div className="flex-1 min-w-0 pr-4">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-xs text-neutral-100 truncate">
                          {p.name}
                        </span>
                        {isCurrent && (
                          <span className="text-[10px] bg-amber-500/20 text-amber-300 px-1.5 py-0.5 rounded border border-amber-500/30">
                            Active
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-3 text-[11px] text-neutral-500 mt-1">
                        <span className="capitalize">{p.category}</span>
                        <span>·</span>
                        <span className="capitalize">{p.modelType.replace(/-/g, ' ')}</span>
                        <span>·</span>
                        <span>{p.artworkCount} mapped surfaces</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={(e) => handleDuplicate(e, p.id)}
                        className="p-1.5 rounded-lg hover:bg-neutral-800 text-neutral-400 hover:text-neutral-200 transition-colors"
                        title="Duplicate project"
                      >
                        <Copy className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={(e) => handleDelete(e, p.id)}
                        className="p-1.5 rounded-lg hover:bg-red-950/40 text-neutral-500 hover:text-red-400 transition-colors"
                        title="Delete project"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-neutral-800 bg-neutral-950/80 flex items-center justify-between text-xs text-neutral-500">
          <span>Projects saved with full 3D geometry & texture states</span>
          <button
            onClick={onClose}
            className="px-3 py-1.5 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-200 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
