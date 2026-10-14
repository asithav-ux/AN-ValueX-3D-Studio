import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Navbar } from './components/Navbar';
import { Footer } from './components/Footer';
import { HomePage } from './pages/HomePage';
import { FeaturesPage } from './pages/FeaturesPage';
import { ModelsCatalogPage } from './pages/ModelsCatalogPage';
import { HowItWorksPage } from './pages/HowItWorksPage';
import { SignUpPage } from './pages/SignUpPage';
import { LoginPage } from './pages/LoginPage';
import { ForgotPasswordPage } from './pages/ForgotPasswordPage';
import { DashboardPage } from './pages/DashboardPage';
import { PrivacyPolicyPage } from './pages/PrivacyPolicyPage';
import { TermsPage } from './pages/TermsPage';
import { StudioWorkspace } from './components/StudioWorkspace';
import { ClientViewer } from './components/ClientViewer';
import type { PackagingCategory, PackagingModelType, PackagingProject } from './types/packaging';
import {
  createDefaultBottleProject,
  createDefaultBoxProject,
  createDefaultPouchProject,
} from './utils/presets';

function AppContent() {
  const { isAuthenticated, authFetch } = useAuth();

  // URL / Path state
  const [currentPath, setCurrentPath] = useState<string>(() => {
    return window.location.pathname || '/';
  });

  // Query parameter for shared client preview: ?preview=<token>
  const [previewToken, setPreviewToken] = useState<string | null>(() => {
    const params = new URLSearchParams(window.location.search);
    return params.get('preview');
  });

  // Active Packaging Project state
  const [project, setProject] = useState<PackagingProject>(() => createDefaultBoxProject());

  // Listen to browser Back / Forward buttons
  useEffect(() => {
    const handlePopState = () => {
      const params = new URLSearchParams(window.location.search);
      const prev = params.get('preview');
      setPreviewToken(prev);
      setCurrentPath(window.location.pathname || '/');
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const navigate = (path: string) => {
    window.history.pushState({}, '', path);
    setCurrentPath(path);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleOpenProjectInStudio = async (projectId: string) => {
    try {
      const res = await authFetch(`/api/projects/${projectId}`);
      if (res.ok) {
        const fullProj = await res.json();
        setProject(fullProj);
        navigate('/studio');
      }
    } catch (err) {
      console.error('Failed to load project into studio:', err);
      navigate('/studio');
    }
  };

  const handleCreateNewProject = (category: PackagingCategory) => {
    let newProj: PackagingProject;
    if (category === 'label') {
      newProj = createDefaultBottleProject();
    } else if (category === 'pouch') {
      newProj = createDefaultPouchProject();
    } else {
      newProj = createDefaultBoxProject();
    }
    newProj.id = 'proj_' + Math.random().toString(36).substring(2, 9);
    setProject(newProj);
    navigate('/studio');
  };

  const handleSelectModelForStudio = (category: PackagingCategory, modelType: PackagingModelType) => {
    let baseProj: PackagingProject;
    if (category === 'label') {
      baseProj = createDefaultBottleProject();
    } else if (category === 'pouch') {
      baseProj = createDefaultPouchProject();
    } else {
      baseProj = createDefaultBoxProject();
    }
    setProject({
      ...baseProj,
      id: 'proj_' + Math.random().toString(36).substring(2, 9),
      category,
      modelType,
    });
    navigate('/studio');
  };

  // 1. PUBLIC CLIENT 360° PREVIEW MODE (?preview=<token>)
  if (previewToken) {
    return (
      <ClientViewer
        previewToken={previewToken}
        onExitClientMode={() => {
          window.history.replaceState({}, '', '/');
          setPreviewToken(null);
          setCurrentPath('/');
        }}
      />
    );
  }

  // 2. FULL 3D STUDIO WORKSPACE MODE (/studio)
  if (currentPath === '/studio') {
    return (
      <StudioWorkspace
        project={project}
        setProject={setProject}
        onNavigate={navigate}
      />
    );
  }

  // 3. PUBLIC PLATFORM & DASHBOARD PAGES WITH NAVBAR & FOOTER
  return (
    <div className="min-h-screen flex flex-col bg-neutral-950 text-neutral-100 font-sans">
      <Navbar currentPath={currentPath} onNavigate={navigate} />

      <main className="flex-1">
        {currentPath === '/' && <HomePage onNavigate={navigate} />}
        {currentPath === '/features' && <FeaturesPage onNavigate={navigate} />}
        {currentPath === '/models' && (
          <ModelsCatalogPage
            onNavigate={navigate}
            onSelectModelForStudio={handleSelectModelForStudio}
          />
        )}
        {currentPath === '/how-it-works' && <HowItWorksPage onNavigate={navigate} />}
        {currentPath === '/signup' && <SignUpPage onNavigate={navigate} />}
        {currentPath === '/login' && <LoginPage onNavigate={navigate} />}
        {currentPath === '/forgot-password' && <ForgotPasswordPage onNavigate={navigate} />}
        {currentPath === '/dashboard' && (
          <DashboardPage
            onNavigate={navigate}
            onOpenProjectInStudio={handleOpenProjectInStudio}
            onCreateNewProject={handleCreateNewProject}
          />
        )}
        {currentPath === '/privacy' && <PrivacyPolicyPage onNavigate={navigate} />}
        {currentPath === '/terms' && <TermsPage onNavigate={navigate} />}
      </main>

      <Footer onNavigate={navigate} />
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}
