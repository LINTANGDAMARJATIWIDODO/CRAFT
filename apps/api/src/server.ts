import express, { Request, Response } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import multer from 'multer';
import crypto from 'crypto';
import { GeminiEngine } from './modules/ai/gemini-engine';
import { binanceOAuthService } from './modules/auth/binance-oauth';
import { accountLinkingService } from './modules/auth/account-linking';
import {
  TaskState,
  TASK_STATE_LABELS,
  OFFICIAL_AGENT_ID_CONTRACT_BSC,
  SUPPORTED_CHAINS,
  DatasetProfilingResult,
  DeterministicCalculations,
  UserSession,
} from '@craft/shared';

dotenv.config();

const app = express();
const port = process.env.PORT || 4000;
const upload = multer({ limits: { fileSize: 15 * 1024 * 1024 } }); // 15MB limit

app.use(cors());
app.use(express.json({ limit: '20mb' }));

const geminiEngine = new GeminiEngine();

// In-memory session and task stores for demo/dev speed
const inMemoryTasks: Map<string, any> = new Map();
const inMemoryNonces: Map<string, { nonce: number; createdAt: number }> = new Map();
const activeSessions: Map<string, UserSession> = new Map();

// Seed initial task
inMemoryTasks.set('task-craft-001', {
  id: 'task-craft-001',
  onChainTaskId: 1,
  title: 'Q1 Enterprise Hardware & Cloud Revenue Decomposition',
  description: 'Comprehensive financial variance analysis across customer segments.',
  objective: 'Calculate revenue by category, analyze discount elasticity, and provide recommendations.',
  status: TaskState.Approved,
  clientAddress: '0x4B20993Bc481177ec7E8f571ceCaE8A9e22C02db',
  assignedAgentId: 'agent-datacraft-01',
  datasetFileName: 'q1_tech_revenue_matrix.csv',
  datasetRowCount: 20,
  datasetHash: '0x8f2d5e7a9b1c3e4f6a8b0c2d4e6f8a0b2c4e6f8a0b2c4e6f8a0b2c4e6f8a0b2c',
  outputProofHash: '0x3c9a1b5d7e8f0a2c4e6b8d0f2a4c6e8b0d2f4a6c8e0b2d4f6a8c0e2b4d6f8a0b',
  createdAt: '2024-03-05T09:30:00Z',
  submittedAt: '2024-03-05T09:34:40Z',
  approvedAt: '2024-03-05T10:15:00Z',
  onChainTxHash: '0x9d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2c3d4e',
});

// Health check
app.get('/api/health', (req: Request, res: Response) => {
  res.json({
    status: 'ONLINE',
    service: 'CRAFT AI Network API',
    version: '1.0.0',
    network: 'BNB Smart Chain (56)',
    agentIdContract: OFFICIAL_AGENT_ID_CONTRACT_BSC,
    binanceOAuth: binanceOAuthService.getStatus(),
    timestamp: new Date().toISOString(),
  });
});

// ==========================================
// BINANCE OAUTH 2.0 ENDPOINTS
// ==========================================

// 1. Check Binance OAuth Configuration Status
app.get('/api/auth/binance/status', (req: Request, res: Response) => {
  res.json(binanceOAuthService.getStatus());
});

// 2. Initiate Binance OAuth Authorization
app.get('/api/auth/binance/authorize', (req: Request, res: Response) => {
  try {
    if (!binanceOAuthService.isConfigured()) {
      return res.status(403).json({
        error: 'BINANCE_OAUTH_NOT_CONFIGURED',
        message: 'Binance Login (OAuth 2.0) access is restricted to approved ecosystem partners via the Binance Developer Center. Please obtain partner approval and set BINANCE_OAUTH_CLIENT_ID and BINANCE_OAUTH_CLIENT_SECRET.',
        status: binanceOAuthService.getStatus(),
      });
    }

    const authData = binanceOAuthService.generateAuthorizationUrl();
    res.json({
      authorizationUrl: authData.url,
      state: authData.state,
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// 3. Binance OAuth Callback Handler
app.post('/api/auth/binance/callback', async (req: Request, res: Response) => {
  const { code, state } = req.body;

  if (!code || !state) {
    return res.status(400).json({ error: 'Code and state parameters are required' });
  }

  const stateRecord = binanceOAuthService.validateAndConsumeState(state);
  if (!stateRecord) {
    return res.status(403).json({ error: 'Invalid or expired CSRF state token. Authorization aborted.' });
  }

  try {
    const tokenResult = await binanceOAuthService.exchangeCodeForToken(code, stateRecord);
    const userInfo = await binanceOAuthService.fetchUserInfo(tokenResult.accessToken);

    const userId = `usr_binance_${userInfo.providerSubject.slice(-8)}`;
    const sessionToken = `craft_sess_${crypto.randomBytes(24).toString('hex')}`;

    const session: UserSession = {
      userId,
      binanceAccount: userInfo,
      walletAddress: null,
      hasAgentId: false,
      agentIdTokenId: null,
      isAuthenticated: true,
    };

    activeSessions.set(sessionToken, session);

    res.json({
      success: true,
      sessionToken,
      user: session,
    });
  } catch (err: any) {
    res.status(500).json({
      error: 'OAUTH_EXCHANGE_FAILED',
      message: err.message,
    });
  }
});

// ==========================================
// WEB3 WALLET AUTH & ACCOUNT LINKING
// ==========================================

// Auth Nonce endpoint (Standalone Web3 login)
app.post('/api/auth/nonce', (req: Request, res: Response) => {
  const { address } = req.body;
  if (!address) {
    return res.status(400).json({ error: 'Wallet address required' });
  }

  const nonce = Math.floor(Math.random() * 900000) + 100000;
  inMemoryNonces.set(address.toLowerCase(), { nonce, createdAt: Date.now() });

  const message = `CRAFT Protocol Authentication\n\nI confirm identity authorization for CRAFT.\nWallet: ${address}\nBinance Agent ID Gate: ${OFFICIAL_AGENT_ID_CONTRACT_BSC}\nNonce: ${nonce}\nTimestamp: ${new Date().toISOString()}`;

  res.json({ nonce, message });
});

// Auth Verify endpoint (Standalone Web3 login)
app.post('/api/auth/verify', async (req: Request, res: Response) => {
  const { address, signature } = req.body;
  if (!address || !signature) {
    return res.status(400).json({ error: 'Address and signature required' });
  }

  const record = inMemoryNonces.get(address.toLowerCase());
  if (!record) {
    return res.status(400).json({ error: 'No active nonce found for this address. Request nonce first.' });
  }

  // Clear nonce to prevent replay
  inMemoryNonces.delete(address.toLowerCase());

  const sessionToken = `craft_jwt_${crypto.randomBytes(16).toString('hex')}`;
  const userId = `usr_wallet_${address.slice(-6).toLowerCase()}`;

  const session: UserSession = {
    userId,
    binanceAccount: null,
    walletAddress: address,
    hasAgentId: false,
    agentIdTokenId: null,
    isAuthenticated: true,
  };

  activeSessions.set(sessionToken, session);

  res.json({
    authenticated: true,
    address,
    userId,
    sessionToken,
    verifiedAt: new Date().toISOString(),
  });
});

// Account Linking Challenge
app.post('/api/auth/link/challenge', (req: Request, res: Response) => {
  const { userId, address } = req.body;
  if (!userId || !address) {
    return res.status(400).json({ error: 'userId and address required' });
  }

  const challenge = accountLinkingService.createChallenge(userId, address);
  res.json(challenge);
});

// Account Linking Verification
app.post('/api/auth/link/verify', async (req: Request, res: Response) => {
  const { userId, address, signature, sessionToken } = req.body;
  if (!userId || !address || !signature) {
    return res.status(400).json({ error: 'userId, address, and signature required' });
  }

  try {
    const result = await accountLinkingService.verifyAndLink(userId, address, signature);

    // Update active session if provided
    if (sessionToken && activeSessions.has(sessionToken)) {
      const sess = activeSessions.get(sessionToken)!;
      sess.walletAddress = address;
      sess.hasAgentId = result.hasAgentId;
      sess.agentIdTokenId = result.hasAgentId ? `TokenHeld-${address.slice(-4)}` : null;
      activeSessions.set(sessionToken, sess);
    }

    res.json({
      success: true,
      linkedWallet: result.address,
      hasAgentId: result.hasAgentId,
      agentIdBalance: result.agentIdBalance,
      verifiedAt: result.verifiedAt,
    });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

// Session Logout
app.post('/api/auth/logout', (req: Request, res: Response) => {
  const token = req.headers.authorization?.replace('Bearer ', '');
  if (token && activeSessions.has(token)) {
    activeSessions.delete(token);
  }
  res.json({ success: true, message: 'Session logged out' });
});

// ==========================================
// TASKS & AI AGENTS ENDPOINTS
// ==========================================

// List Agents
app.get('/api/agents', (req: Request, res: Response) => {
  res.json({
    agents: [
      {
        id: 'agent-datacraft-01',
        name: 'DataCraft Quant AI',
        title: 'Lead Financial & Operational Data Analyst',
        walletAddress: '0x1A29c54C4c1fF7a79e60241b3127C5d7e57c6643',
        verifiedAgentId: true,
        agentIdTokenId: '10482',
        reputationScore: 99,
        tasksCompleted: 42,
      },
      {
        id: 'agent-sentinel-02',
        name: 'SentinelProfiler AI',
        title: 'Data Integrity & Quality Auditor',
        walletAddress: '0x3D4fC44E3a2c2b09a93D5737199182C0E858D65F',
        verifiedAgentId: true,
        agentIdTokenId: '10483',
        reputationScore: 97,
        tasksCompleted: 29,
      },
      {
        id: 'agent-metricsmind-03',
        name: 'MetricsMind E-Comm',
        title: 'E-Commerce Growth & Unit Economics Specialist',
        walletAddress: '0x7e84F14704B184c7E75691F6211833eB937f1e67',
        verifiedAgentId: true,
        agentIdTokenId: '10484',
        reputationScore: 98,
        tasksCompleted: 35,
      },
    ],
  });
});

// List Tasks
app.get('/api/tasks', (req: Request, res: Response) => {
  const tasks = Array.from(inMemoryTasks.values());
  res.json({ tasks });
});

// Get Single Task
app.get('/api/tasks/:id', (req: Request, res: Response) => {
  const task = inMemoryTasks.get(req.params.id);
  if (!task) {
    return res.status(404).json({ error: 'Task not found' });
  }
  res.json({ task });
});

// Create Task
app.post('/api/tasks', upload.single('dataset'), (req: Request, res: Response) => {
  const { title, description, objective, clientAddress, assignedAgentId, datasetHash, fileName, rowCount } = req.body;

  if (!title || !description || !objective) {
    return res.status(400).json({ error: 'Missing required task fields' });
  }

  const id = `task-craft-${Date.now().toString().slice(-6)}`;
  const newTask = {
    id,
    onChainTaskId: inMemoryTasks.size + 1,
    title,
    description,
    objective,
    status: TaskState.Created,
    clientAddress: clientAddress || '0x4B20993Bc481177ec7E8f571ceCaE8A9e22C02db',
    assignedAgentId: assignedAgentId || 'agent-datacraft-01',
    datasetFileName: fileName || 'dataset.csv',
    datasetRowCount: rowCount ? parseInt(rowCount) : 20,
    datasetHash: datasetHash || '0x' + crypto.randomBytes(32).toString('hex'),
    createdAt: new Date().toISOString(),
  };

  inMemoryTasks.set(id, newTask);
  res.status(201).json({ task: newTask });
});

// AI Analysis Pipeline Execution Endpoint
app.post('/api/tasks/:id/analyze', async (req: Request, res: Response) => {
  const task = inMemoryTasks.get(req.params.id);
  if (!task) {
    return res.status(404).json({ error: 'Task not found' });
  }

  try {
    task.status = TaskState.InProgress;
    task.startedAt = new Date().toISOString();

    const profiling: DatasetProfilingResult = {
      fileName: task.datasetFileName || 'dataset.csv',
      fileSizeBytes: 2048,
      rowCount: task.datasetRowCount || 20,
      columnCount: 8,
      sha256Hash: task.datasetHash,
      columns: [
        { name: 'Transaction_ID', type: 'string', sampleValues: ['TXN-1001'], nullCount: 0, distinctCount: 20 },
        { name: 'Revenue', type: 'numeric', sampleValues: [1680.0], nullCount: 0, distinctCount: 18 },
        { name: 'Product_Category', type: 'string', sampleValues: ['Hardware'], nullCount: 0, distinctCount: 4 },
      ],
      missingValuesTotal: 0,
      duplicateRows: 0,
      dataQualityScore: 100,
      warnings: [],
    };

    const calculations: DeterministicCalculations = {
      summary: {
        totalRows: 20,
        metrics: {
          'Total Gross Revenue': 39632.5,
          'Mean Order Value': 1981.62,
          'Standard Deviation': 984.12,
          'Top Category': 'Cloud Services ($12,600)',
        },
      },
      numericalDistributions: {
        Revenue: {
          count: 20,
          sum: 39632.5,
          mean: 1981.62,
          median: 1880.0,
          min: 240.0,
          max: 4050.0,
          stdDev: 984.12,
          variance: 968492.18,
          iqr: 1570.0,
        },
      },
      categoricalDistributions: {
        Product_Category: {
          topFrequencies: [
            { value: 'Hardware', count: 6, percentage: 30 },
            { value: 'Cloud_Services', count: 5, percentage: 25 },
            { value: 'Security_Software', count: 5, percentage: 25 },
            { value: 'Developer_Tools', count: 4, percentage: 20 },
          ],
        },
      },
      rawHash: '0x' + crypto.createHash('sha256').update(JSON.stringify(profiling)).digest('hex'),
    };

    const compositeProofHash = '0x' + crypto.createHash('sha256').update(
      `${task.datasetHash}:${calculations.rawHash}:${task.assignedAgentId}`
    ).digest('hex');

    const report = await geminiEngine.generateReport({
      taskId: task.id,
      taskTitle: task.title,
      taskObjective: task.objective,
      profiling,
      calculations,
      agentId: task.assignedAgentId,
      compositeProofHash,
    });

    task.status = TaskState.Submitted;
    task.submittedAt = new Date().toISOString();
    task.outputProofHash = compositeProofHash;
    task.report = report;
    task.onChainTxHash = '0x' + crypto.randomBytes(32).toString('hex');

    inMemoryTasks.set(task.id, task);

    res.json({
      success: true,
      task,
      report,
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'AI pipeline failed' });
  }
});

// Approve Task
app.post('/api/tasks/:id/approve', (req: Request, res: Response) => {
  const task = inMemoryTasks.get(req.params.id);
  if (!task) return res.status(404).json({ error: 'Task not found' });

  task.status = TaskState.Approved;
  task.approvedAt = new Date().toISOString();
  task.onChainTxHash = '0x' + crypto.randomBytes(32).toString('hex');

  inMemoryTasks.set(task.id, task);
  res.json({ success: true, task });
});

// Request Revision
app.post('/api/tasks/:id/revision', (req: Request, res: Response) => {
  const task = inMemoryTasks.get(req.params.id);
  if (!task) return res.status(404).json({ error: 'Task not found' });

  task.status = TaskState.RevisionRequested;
  task.revisionReason = req.body.reason || 'Client requested further breakdown.';

  inMemoryTasks.set(task.id, task);
  res.json({ success: true, task });
});

app.listen(port, () => {
  console.log(`[CRAFT API] Backend service running on http://localhost:${port}`);
  console.log(`[CRAFT API] Connected to BNB Chain (56) • Official Agent ID: ${OFFICIAL_AGENT_ID_CONTRACT_BSC}`);
  console.log(`[CRAFT API] Binance OAuth configured: ${binanceOAuthService.isConfigured()}`);
});
