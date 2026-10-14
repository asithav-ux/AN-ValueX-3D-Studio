import React, { useState, useRef, useEffect } from 'react';
import type {
  ArtworkMapping,
  BoxDimensions,
  BoxPanelId,
  LabelDimensions,
  LightingSettings,
  MaterialSettings,
  MeasurementUnit,
  PackagingCategory,
  PackagingModelType,
  PackagingProject,
  PouchDimensions,
  BackgroundSettings,
} from '../types/packaging';
import { PackagingEngine } from '../three/PackagingEngine';
import {
  createDefaultBottleProject,
  createDefaultBoxProject,
  createDefaultPouchProject,
} from '../utils/presets';
import { Header } from './Header';
import { Viewport } from './Viewport';
import { LeftSidebar } from './LeftSidebar';
import { RightSidebar } from './RightSidebar';
import { ExportModal } from './ExportModal';
import { ShareModal } from './ShareModal';
import { DielineModal } from './DielineModal';
import { ProjectsModal } from './ProjectsModal';
import { useAuth } from '../context/AuthContext';

interface StudioWorkspaceProps {
  project: PackagingProject;
  setProject: React.Dispatch<React.SetStateAction<PackagingProject>>;
  onNavigate: (path: string) => void;
}

export const StudioWorkspace: React.FC<StudioWorkspaceProps> = ({
  project,
  setProject,
  onNavigate,
}) => {
  const { authFetch, isAuthenticated } = useAuth();
  const [isZenMode, setIsZenMode] = useState<boolean>(false);
  const [turntableActive, setTurntableActive] = useState<boolean>(false);

  // Modals state
  const [showExportModal, setShowExportModal] = useState<boolean>(false);
  const [showShareModal, setShowShareModal] = useState<boolean>(false);
  const [showDielineModal, setShowDielineModal] = useState<boolean>(false);
  const [showProjectsModal, setShowProjectsModal] = useState<boolean>(false);

  // Persistence status
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [saveSuccess, setSaveSuccess] = useState<boolean>(false);

  const engineRef = useRef<PackagingEngine | null>(null);

  // Save project to backend API
  const handleSaveProject = async (): Promise<boolean> => {
    setIsSaving(true);
    setSaveSuccess(false);

    try {
      if (isAuthenticated) {
        const res = await authFetch('/api/projects', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(project),
        });
        if (!res.ok) throw new Error('Failed to save project');
      } else {
        // Guest local storage save
        localStorage.setItem(`vx_guest_${project.id}`, JSON.stringify(project));
      }

      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 2500);
      return true;
    } catch (err) {
      console.error('Save error:', err);
      return false;
    } finally {
      setIsSaving(false);
    }
  };

  // Switch between starter demo presets
  const handleSelectPreset = (presetKey: 'box' | 'bottle' | 'pouch') => {
    let newProj: PackagingProject;
    if (presetKey === 'bottle') {
      newProj = { ...createDefaultBottleProject(), displayUnit: project.displayUnit || 'mm' };
    } else if (presetKey === 'pouch') {
      newProj = { ...createDefaultPouchProject(), displayUnit: project.displayUnit || 'mm' };
    } else {
      newProj = { ...createDefaultBoxProject(), displayUnit: project.displayUnit || 'mm' };
    }
    setProject(newProj);
  };

  const handleUpdateCategory = (category: PackagingCategory, modelType: PackagingModelType) => {
    setProject((prev) => ({
      ...prev,
      category,
      modelType,
    }));
  };

  const handleUpdateArtwork = (panelId: string, mapping: ArtworkMapping | null) => {
    setProject((prev) => {
      const nextArtworks = { ...prev.artworks };
      if (mapping) {
        nextArtworks[panelId] = mapping;
      } else {
        delete nextArtworks[panelId];
      }
      return {
        ...prev,
        artworks: nextArtworks,
      };
    });
  };

  const handleApplyDielinePanels = (croppedPanels: Record<BoxPanelId, string>) => {
    setProject((prev) => {
      const nextArtworks = { ...prev.artworks };

      (Object.keys(croppedPanels) as BoxPanelId[]).forEach((panelId) => {
        const dataUrl = croppedPanels[panelId];
        nextArtworks[panelId] = {
          panelId,
          dataUrl,
          fileName: `dieline_${panelId}.png`,
          fileSize: 150000,
          naturalWidth: 1024,
          naturalHeight: 1024,
          aspectRatio: 1,
          fit: 'fit',
          scale: 1.0,
          offsetX: 0,
          offsetY: 0,
          rotation: 0,
          foilColor: prev.artworks[panelId]?.foilColor || 'none',
          foilThreshold: 0.5,
          embossDepth: prev.artworks[panelId]?.embossDepth || 0,
          spotVarnish: false,
          opacity: 1.0,
        };
      });

      return {
        ...prev,
        artworks: nextArtworks,
      };
    });
  };

  const handleUpdateBoxDimensions = (dims: Partial<BoxDimensions>) => {
    setProject((prev) => ({
      ...prev,
      boxDimensions: { ...prev.boxDimensions, ...dims },
    }));
  };

  const handleUpdateLabelDimensions = (dims: Partial<LabelDimensions>) => {
    setProject((prev) => ({
      ...prev,
      labelDimensions: { ...prev.labelDimensions, ...dims },
    }));
  };

  const handleUpdatePouchDimensions = (dims: Partial<PouchDimensions>) => {
    setProject((prev) => ({
      ...prev,
      pouchDimensions: { ...prev.pouchDimensions, ...dims },
    }));
  };

  const handleUpdateUnit = (displayUnit: MeasurementUnit) => {
    setProject((prev) => ({ ...prev, displayUnit }));
  };

  const handleUpdateMaterial = (mat: Partial<MaterialSettings>) => {
    setProject((prev) => ({
      ...prev,
      material: { ...prev.material, ...mat },
    }));
  };

  const handleUpdateLighting = (light: Partial<LightingSettings>) => {
    setProject((prev) => ({
      ...prev,
      lighting: { ...prev.lighting, ...light },
    }));
  };

  const handleUpdateBackground = (bg: Partial<BackgroundSettings>) => {
    setProject((prev) => ({
      ...prev,
      background: { ...prev.background, ...bg },
    }));
  };

  return (
    <div className="w-screen h-screen flex flex-col bg-neutral-950 text-neutral-100 overflow-hidden font-sans select-none">
      {/* Top Professional Toolbar */}
      <Header
        project={project}
        onUpdateProjectName={(name) => setProject((p) => ({ ...p, name }))}
        onUpdateUnit={handleUpdateUnit}
        onSelectPreset={handleSelectPreset}
        onSaveProject={handleSaveProject}
        isSaving={isSaving}
        saveSuccess={saveSuccess}
        onOpenProjects={() => setShowProjectsModal(true)}
        onOpenExport={() => setShowExportModal(true)}
        onOpenShare={() => setShowShareModal(true)}
        onOpenDieline={() => setShowDielineModal(true)}
        onNavigate={onNavigate}
      />

      {/* Main Studio Workspace */}
      <div className="flex-1 flex overflow-hidden relative">
        {!isZenMode && (
          <LeftSidebar
            project={project}
            onUpdateCategory={handleUpdateCategory}
            onUpdateArtwork={handleUpdateArtwork}
            onOpenDieline={() => setShowDielineModal(true)}
          />
        )}

        <main className="flex-1 h-full relative">
          <Viewport
            project={project}
            engineRef={engineRef}
            isZenMode={isZenMode}
            onToggleZenMode={() => setIsZenMode(!isZenMode)}
            turntableActive={turntableActive}
            onToggleTurntable={() => setTurntableActive(!turntableActive)}
          />
        </main>

        {!isZenMode && (
          <RightSidebar
            project={project}
            onUpdateBoxDimensions={handleUpdateBoxDimensions}
            onUpdateLabelDimensions={handleUpdateLabelDimensions}
            onUpdatePouchDimensions={handleUpdatePouchDimensions}
            onUpdateMaterial={handleUpdateMaterial}
            onUpdateLighting={handleUpdateLighting}
            onUpdateBackground={handleUpdateBackground}
          />
        )}
      </div>

      {/* Modals */}
      <ExportModal
        isOpen={showExportModal}
        onClose={() => setShowExportModal(false)}
        project={project}
        engineRef={engineRef}
      />

      <ShareModal
        isOpen={showShareModal}
        onClose={() => setShowShareModal(false)}
        project={project}
        onSaveProject={handleSaveProject}
      />

      <DielineModal
        isOpen={showDielineModal}
        onClose={() => setShowDielineModal(false)}
        project={project}
        onApplyDielinePanels={handleApplyDielinePanels}
      />

      <ProjectsModal
        isOpen={showProjectsModal}
        onClose={() => setShowProjectsModal(false)}
        currentProjectId={project.id}
        onLoadProject={(loaded) => setProject(loaded)}
        onCreateNew={(cat) => {
          let newProj: PackagingProject;
          if (cat === 'label') newProj = createDefaultBottleProject();
          else if (cat === 'pouch') newProj = createDefaultPouchProject();
          else newProj = createDefaultBoxProject();
          setProject(newProj);
        }}
      />
    </div>
  );
};
