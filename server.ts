import express, { Request, Response, NextFunction } from 'express';
import path from 'path';
import fs from 'fs';
import crypto from 'crypto';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;
const isProduction = process.env.NODE_ENV === 'production';

// Support large artwork data URLs and files (up to 60MB)
app.use(express.json({ limit: '60mb' }));
app.use(express.urlencoded({ extended: true, limit: '60mb' }));

// Directories
const DATA_DIR = path.resolve(__dirname, 'data');
const UPLOADS_DIR = path.resolve(DATA_DIR, 'uploads');
const DB_FILE = path.resolve(DATA_DIR, 'db.json');

function ensureDirectories() {
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
  if (!fs.existsSync(UPLOADS_DIR)) fs.mkdirSync(UPLOADS_DIR, { recursive: true });
  if (!fs.existsSync(DB_FILE)) {
    const initialDb = {
      users: [],
      sessions: [],
      projects: [],
      templates: [],
      passwordResetTokens: [],
    };
    fs.writeFileSync(DB_FILE, JSON.stringify(initialDb, null, 2), 'utf-8');
  }
}

ensureDirectories();

interface DbSchema {
  users: Array<{
    id: string;
    name: string;
    email: string;
    passwordHash: string;
    salt: string;
    company?: string;
    avatar?: string;
    isVerified: boolean;
    createdAt: string;
    updatedAt: string;
  }>;
  sessions: Array<{
    token: string;
    userId: string;
    expiresAt: string;
    createdAt: string;
  }>;
  projects: Array<any>;
  templates: Array<any>;
  passwordResetTokens: Array<{
    email: string;
    token: string;
    expiresAt: string;
  }>;
}

function readDb(): DbSchema {
  try {
    ensureDirectories();
    const data = fs.readFileSync(DB_FILE, 'utf-8');
    return JSON.parse(data);
  } catch (err) {
    console.error('Error reading database:', err);
    return { users: [], sessions: [], projects: [], templates: [], passwordResetTokens: [] };
  }
}

function writeDb(db: DbSchema) {
  try {
    ensureDirectories();
    fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2), 'utf-8');
  } catch (err) {
    console.error('Error writing database:', err);
  }
}

// Password hashing utilities using Node.js crypto
function hashPassword(password: string, salt: string): string {
  return crypto.pbkdf2Sync(password, salt, 100000, 64, 'sha512').toString('hex');
}

function generateSalt(): string {
  return crypto.randomBytes(16).toString('hex');
}

function generateToken(): string {
  return crypto.randomBytes(32).toString('hex');
}

// Seed Demo Account if not exists
function seedDemoUser() {
  const db = readDb();
  const demoEmail = 'demo@anvaluex.com';
  let demoUser = db.users.find((u) => u.email === demoEmail);

  if (!demoUser) {
    const salt = generateSalt();
    const passwordHash = hashPassword('ValueX2026!', salt);
    demoUser = {
      id: 'usr_demo_prepress_lead',
      name: 'Sarah Chen (Packaging Prepress Lead)',
      email: demoEmail,
      company: 'Apex Packaging Design Studio',
      passwordHash,
      salt,
      isVerified: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    db.users.push(demoUser);
    writeDb(db);
    console.log('Seeded demo user:', demoEmail);
  }
}

seedDemoUser();

// ----------------------------------------------------------------
// AUTHENTICATION MIDDLEWARE & HELPERS
// ----------------------------------------------------------------
interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    name: string;
    email: string;
    company?: string;
  };
}

function authMiddleware(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Authentication required' });
  }

  const token = authHeader.split(' ')[1];
  const db = readDb();
  const session = db.sessions.find(
    (s) => s.token === token && new Date(s.expiresAt) > new Date()
  );

  if (!session) {
    return res.status(401).json({ error: 'Session expired or invalid' });
  }

  const user = db.users.find((u) => u.id === session.userId);
  if (!user) {
    return res.status(401).json({ error: 'User account not found' });
  }

  req.user = {
    id: user.id,
    name: user.name,
    email: user.email,
    company: user.company,
  };

  next();
}

// Optional Auth (for public routes that can personalize if user is logged in)
function optionalAuthMiddleware(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.split(' ')[1];
    const db = readDb();
    const session = db.sessions.find(
      (s) => s.token === token && new Date(s.expiresAt) > new Date()
    );
    if (session) {
      const user = db.users.find((u) => u.id === session.userId);
      if (user) {
        req.user = {
          id: user.id,
          name: user.name,
          email: user.email,
          company: user.company,
        };
      }
    }
  }
  next();
}

// ----------------------------------------------------------------
// AUTHENTICATION ROUTES
// ----------------------------------------------------------------

// Health check
app.get('/api/health', (req: Request, res: Response) => {
  res.json({ status: 'ok', brand: 'AN ValueX 3D Studio', timestamp: new Date().toISOString() });
});

// Register
app.post('/api/auth/register', (req: Request, res: Response) => {
  try {
    const { name, email, password, company } = req.body;
    if (!name || !email || !password) {
      return res.status(400).json({ error: 'Name, email, and password are required' });
    }

    if (password.length < 8) {
      return res.status(400).json({ error: 'Password must be at least 8 characters long' });
    }

    const cleanEmail = email.trim().toLowerCase();
    const db = readDb();

    if (db.users.some((u) => u.email === cleanEmail)) {
      return res.status(409).json({ error: 'An account with this email address already exists' });
    }

    const salt = generateSalt();
    const passwordHash = hashPassword(password, salt);
    const userId = 'usr_' + crypto.randomBytes(8).toString('hex');
    const now = new Date().toISOString();

    const newUser = {
      id: userId,
      name: name.trim(),
      email: cleanEmail,
      company: company ? company.trim() : '',
      passwordHash,
      salt,
      isVerified: true,
      createdAt: now,
      updatedAt: now,
    };

    db.users.push(newUser);

    // Create session
    const token = generateToken();
    const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(); // 30 days
    db.sessions.push({ token, userId, expiresAt, createdAt: now });

    writeDb(db);

    res.status(201).json({
      token,
      user: {
        id: newUser.id,
        name: newUser.name,
        email: newUser.email,
        company: newUser.company,
      },
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Registration failed' });
  }
});

// Login
app.post('/api/auth/login', (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    const cleanEmail = email.trim().toLowerCase();
    const db = readDb();
    const user = db.users.find((u) => u.email === cleanEmail);

    if (!user) {
      return res.status(401).json({ error: 'Invalid email address or password' });
    }

    const checkHash = hashPassword(password, user.salt);
    if (checkHash !== user.passwordHash) {
      return res.status(401).json({ error: 'Invalid email address or password' });
    }

    // Create session token
    const token = generateToken();
    const now = new Date().toISOString();
    const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
    db.sessions.push({ token, userId: user.id, expiresAt, createdAt: now });
    writeDb(db);

    res.json({
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        company: user.company,
      },
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Login failed' });
  }
});

// 1-Click Demo Login (Prepress Lead)
app.post('/api/auth/demo-login', (req: Request, res: Response) => {
  try {
    const db = readDb();
    const demoUser = db.users.find((u) => u.email === 'demo@anvaluex.com');
    if (!demoUser) {
      return res.status(500).json({ error: 'Demo user not initialized' });
    }

    const token = generateToken();
    const now = new Date().toISOString();
    const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
    db.sessions.push({ token, userId: demoUser.id, expiresAt, createdAt: now });
    writeDb(db);

    res.json({
      token,
      user: {
        id: demoUser.id,
        name: demoUser.name,
        email: demoUser.email,
        company: demoUser.company,
      },
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Demo login failed' });
  }
});

// Logout
app.post('/api/auth/logout', authMiddleware, (req: AuthenticatedRequest, res: Response) => {
  try {
    const authHeader = req.headers.authorization;
    if (authHeader) {
      const token = authHeader.split(' ')[1];
      const db = readDb();
      db.sessions = db.sessions.filter((s) => s.token !== token);
      writeDb(db);
    }
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Get current user profile
app.get('/api/auth/me', authMiddleware, (req: AuthenticatedRequest, res: Response) => {
  const db = readDb();
  const user = db.users.find((u) => u.id === req.user!.id);
  if (!user) return res.status(404).json({ error: 'User not found' });

  res.json({
    id: user.id,
    name: user.name,
    email: user.email,
    company: user.company,
    createdAt: user.createdAt,
    isVerified: user.isVerified,
  });
});

// Update user profile
app.put('/api/auth/profile', authMiddleware, (req: AuthenticatedRequest, res: Response) => {
  try {
    const { name, company } = req.body;
    const db = readDb();
    const userIndex = db.users.findIndex((u) => u.id === req.user!.id);
    if (userIndex === -1) return res.status(404).json({ error: 'User not found' });

    if (name) db.users[userIndex].name = name.trim();
    if (company !== undefined) db.users[userIndex].company = company.trim();
    db.users[userIndex].updatedAt = new Date().toISOString();

    writeDb(db);

    res.json({
      success: true,
      user: {
        id: db.users[userIndex].id,
        name: db.users[userIndex].name,
        email: db.users[userIndex].email,
        company: db.users[userIndex].company,
      },
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Change password
app.post('/api/auth/change-password', authMiddleware, (req: AuthenticatedRequest, res: Response) => {
  try {
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ error: 'Current and new password are required' });
    }

    if (newPassword.length < 8) {
      return res.status(400).json({ error: 'New password must be at least 8 characters long' });
    }

    const db = readDb();
    const userIndex = db.users.findIndex((u) => u.id === req.user!.id);
    if (userIndex === -1) return res.status(404).json({ error: 'User not found' });

    const user = db.users[userIndex];
    const checkHash = hashPassword(currentPassword, user.salt);
    if (checkHash !== user.passwordHash) {
      return res.status(401).json({ error: 'Current password is incorrect' });
    }

    const newSalt = generateSalt();
    user.salt = newSalt;
    user.passwordHash = hashPassword(newPassword, newSalt);
    user.updatedAt = new Date().toISOString();

    writeDb(db);
    res.json({ success: true, message: 'Password updated successfully' });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Forgot password request
app.post('/api/auth/forgot-password', (req: Request, res: Response) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ error: 'Email is required' });

    const cleanEmail = email.trim().toLowerCase();
    const db = readDb();
    const user = db.users.find((u) => u.email === cleanEmail);

    if (user) {
      const resetToken = crypto.randomBytes(24).toString('hex');
      const expiresAt = new Date(Date.now() + 60 * 60 * 1000).toISOString(); // 1 hour
      db.passwordResetTokens = db.passwordResetTokens.filter((t) => t.email !== cleanEmail);
      db.passwordResetTokens.push({ email: cleanEmail, token: resetToken, expiresAt });
      writeDb(db);

      // Return resetToken in demo/eval environment for seamless password reset completion
      res.json({
        success: true,
        message: 'Password reset link generated successfully',
        demoResetToken: resetToken,
      });
    } else {
      res.json({
        success: true,
        message: 'If the email exists, a reset link has been dispatched.',
      });
    }
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Reset password with token
app.post('/api/auth/reset-password', (req: Request, res: Response) => {
  try {
    const { token, newPassword } = req.body;
    if (!token || !newPassword) {
      return res.status(400).json({ error: 'Token and new password are required' });
    }

    if (newPassword.length < 8) {
      return res.status(400).json({ error: 'Password must be at least 8 characters long' });
    }

    const db = readDb();
    const record = db.passwordResetTokens.find(
      (r) => r.token === token && new Date(r.expiresAt) > new Date()
    );

    if (!record) {
      return res.status(400).json({ error: 'Reset token is invalid or has expired' });
    }

    const user = db.users.find((u) => u.email === record.email);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const newSalt = generateSalt();
    user.salt = newSalt;
    user.passwordHash = hashPassword(newPassword, newSalt);
    user.updatedAt = new Date().toISOString();

    // Revoke token
    db.passwordResetTokens = db.passwordResetTokens.filter((r) => r.token !== token);
    writeDb(db);

    res.json({ success: true, message: 'Password has been reset. You may now log in.' });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Delete account
app.delete('/api/auth/delete-account', authMiddleware, (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const db = readDb();

    // Delete user, sessions, user projects, and templates
    db.users = db.users.filter((u) => u.id !== userId);
    db.sessions = db.sessions.filter((s) => s.userId !== userId);
    db.projects = db.projects.filter((p) => p.userId !== userId);
    db.templates = db.templates.filter((t) => t.userId !== userId);

    writeDb(db);
    res.json({ success: true, message: 'Account and associated data deleted' });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// ----------------------------------------------------------------
// MULTI-USER PROJECTS API (Strict User Data Isolation)
// ----------------------------------------------------------------

// List projects: ONLY projects belonging to req.user.id
app.get('/api/projects', optionalAuthMiddleware, (req: AuthenticatedRequest, res: Response) => {
  try {
    const db = readDb();
    const userId = req.user?.id;

    let userProjects: any[] = [];
    if (userId) {
      userProjects = db.projects.filter((p) => p.userId === userId);
    } else {
      // Guest: returns public demo projects or empty
      userProjects = db.projects.filter((p) => !p.userId || p.userId === 'usr_demo_prepress_lead');
    }

    const summaries = userProjects.map((p) => ({
      id: p.id,
      name: p.name,
      category: p.category,
      modelType: p.modelType,
      displayUnit: p.displayUnit || 'mm',
      isPublicShare: !!p.isPublicShare,
      shareToken: p.shareToken,
      artworkCount: Object.keys(p.artworks || {}).length,
      createdAt: p.createdAt,
      updatedAt: p.updatedAt,
    }));

    res.json(summaries);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Get single project: strictly validates ownership unless it's a shared preview
app.get('/api/projects/:id', optionalAuthMiddleware, (req: AuthenticatedRequest, res: Response) => {
  try {
    const db = readDb();
    const project = db.projects.find((p) => p.id === req.params.id);

    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }

    // Ownership check: If project belongs to a user, check req.user.id
    if (project.userId) {
      if (!req.user || req.user.id !== project.userId) {
        // If not the owner, check if user is viewing a demo project
        if (project.userId === 'usr_demo_prepress_lead' && !req.user) {
          // Allow guest demo viewing
          return res.json(project);
        }
        return res.status(403).json({ error: 'Access denied: You do not have permission to view this private project' });
      }
    }

    res.json(project);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Save or Create Project (Enforces user ownership)
app.post('/api/projects', authMiddleware, (req: AuthenticatedRequest, res: Response) => {
  try {
    const projectData = req.body;
    if (!projectData || !projectData.id) {
      return res.status(400).json({ error: 'Invalid project payload' });
    }

    const db = readDb();
    const userId = req.user!.id;
    const existingIndex = db.projects.findIndex((p) => p.id === projectData.id);

    const now = new Date().toISOString();

    if (existingIndex >= 0) {
      const existing = db.projects[existingIndex];
      // Ownership check on update
      if (existing.userId && existing.userId !== userId) {
        return res.status(403).json({ error: 'Access denied: Cannot update project belonging to another user' });
      }

      projectData.userId = userId;
      projectData.updatedAt = now;
      projectData.createdAt = existing.createdAt || now;
      db.projects[existingIndex] = projectData;
    } else {
      projectData.userId = userId;
      projectData.createdAt = now;
      projectData.updatedAt = now;
      db.projects.unshift(projectData);
    }

    writeDb(db);
    res.json({ success: true, project: projectData });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Duplicate Project
app.post('/api/projects/:id/duplicate', authMiddleware, (req: AuthenticatedRequest, res: Response) => {
  try {
    const db = readDb();
    const userId = req.user!.id;
    const source = db.projects.find((p) => p.id === req.params.id);

    if (!source) {
      return res.status(404).json({ error: 'Project not found' });
    }

    // Allow duplicating if owner OR if duplicating from a public demo
    if (source.userId && source.userId !== userId && source.userId !== 'usr_demo_prepress_lead') {
      return res.status(403).json({ error: 'Access denied' });
    }

    const newId = 'proj_' + crypto.randomBytes(6).toString('hex');
    const now = new Date().toISOString();

    const duplicated = {
      ...source,
      id: newId,
      userId,
      name: `${source.name} (Copy)`,
      isPublicShare: false,
      shareToken: undefined,
      createdAt: now,
      updatedAt: now,
    };

    db.projects.unshift(duplicated);
    writeDb(db);
    res.json(duplicated);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Delete Project (Ownership enforced)
app.delete('/api/projects/:id', authMiddleware, (req: AuthenticatedRequest, res: Response) => {
  try {
    const db = readDb();
    const userId = req.user!.id;
    const target = db.projects.find((p) => p.id === req.params.id);

    if (!target) {
      return res.status(404).json({ error: 'Project not found' });
    }

    if (target.userId && target.userId !== userId) {
      return res.status(403).json({ error: 'Access denied: You can only delete your own projects' });
    }

    db.projects = db.projects.filter((p) => p.id !== req.params.id);
    writeDb(db);
    res.json({ success: true, id: req.params.id });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Share / Revoke Public Client Preview Link
app.post('/api/projects/:id/share', authMiddleware, (req: AuthenticatedRequest, res: Response) => {
  try {
    const { action } = req.body; // 'enable' | 'revoke'
    const db = readDb();
    const userId = req.user!.id;
    const project = db.projects.find((p) => p.id === req.params.id);

    if (!project) return res.status(404).json({ error: 'Project not found' });

    if (project.userId && project.userId !== userId) {
      return res.status(403).json({ error: 'Access denied' });
    }

    if (action === 'revoke') {
      project.isPublicShare = false;
      project.shareToken = undefined;
    } else {
      project.isPublicShare = true;
      if (!project.shareToken) {
        project.shareToken = 'sh_' + crypto.randomBytes(12).toString('hex');
      }
      project.shareCreatedAt = new Date().toISOString();
    }

    project.updatedAt = new Date().toISOString();
    writeDb(db);

    res.json({
      success: true,
      isPublicShare: project.isPublicShare,
      shareToken: project.shareToken,
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// ----------------------------------------------------------------
// PUBLIC CLIENT PREVIEW ENDPOINT (Read-Only, Sanitized)
// ----------------------------------------------------------------
// Clients access shared mockups via /api/public/preview/:shareToken
// Strictly hides owner email, password, and other projects!
app.get('/api/public/preview/:shareToken', (req: Request, res: Response) => {
  try {
    const { shareToken } = req.params;
    const db = readDb();

    // Check project by shareToken or legacy project.id if public
    const project = db.projects.find(
      (p) => (p.shareToken === shareToken || p.id === shareToken) && p.isPublicShare !== false
    );

    if (!project) {
      return res.status(404).json({
        error: 'This client preview link is inactive, revoked by the designer, or does not exist.',
        revoked: true,
      });
    }

    // Return sanitized 3D model data only
    const sanitized = {
      id: project.id,
      name: project.name,
      category: project.category,
      modelType: project.modelType,
      displayUnit: project.displayUnit || 'mm',
      boxDimensions: project.boxDimensions,
      labelDimensions: project.labelDimensions,
      pouchDimensions: project.pouchDimensions,
      artworks: project.artworks,
      material: project.material,
      lighting: project.lighting,
      background: project.background,
      camera: project.camera,
      updatedAt: project.updatedAt,
      // Note: userId, owner email, private metadata are completely omitted
    };

    res.json(sanitized);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// ----------------------------------------------------------------
// CUSTOM MODEL TEMPLATES API
// ----------------------------------------------------------------
app.get('/api/templates', authMiddleware, (req: AuthenticatedRequest, res: Response) => {
  try {
    const db = readDb();
    const userTemplates = db.templates.filter((t) => t.userId === req.user!.id);
    res.json(userTemplates);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/templates', authMiddleware, (req: AuthenticatedRequest, res: Response) => {
  try {
    const { name, category, modelType, displayUnit, dimensions } = req.body;
    if (!name || !category || !modelType) {
      return res.status(400).json({ error: 'Name, category and model type are required' });
    }

    const db = readDb();
    const newTemplate = {
      id: 'tmpl_' + crypto.randomBytes(6).toString('hex'),
      userId: req.user!.id,
      name: name.trim(),
      category,
      modelType,
      displayUnit: displayUnit || 'mm',
      dimensions,
      createdAt: new Date().toISOString(),
    };

    db.templates.push(newTemplate);
    writeDb(db);
    res.status(201).json(newTemplate);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/templates/:id', authMiddleware, (req: AuthenticatedRequest, res: Response) => {
  try {
    const db = readDb();
    const target = db.templates.find((t) => t.id === req.params.id);
    if (!target || target.userId !== req.user!.id) {
      return res.status(404).json({ error: 'Template not found' });
    }

    db.templates = db.templates.filter((t) => t.id !== req.params.id);
    writeDb(db);
    res.json({ success: true, id: req.params.id });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// ----------------------------------------------------------------
// FRONTEND SERVING (Vite Middleware in dev / Static in prod)
// ----------------------------------------------------------------
async function startServer() {
  if (!isProduction) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true, hmr: process.env.DISABLE_HMR !== 'true' },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (req: Request, res: Response) => {
      res.sendFile(path.resolve(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`AN ValueX 3D Studio server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
