import express from 'express';
import type { Request, Response } from 'express';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';

dotenv.config();

const app = express();
const PORT = parseInt(process.env.PORT || '3000', 10);

// Middleware for parsing JSON with support for multiple photo uploads (large payloads)
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

export interface WasteReport {
  id: string;
  ticketNumber: string;
  residentName: string;
  residentPhone?: string;
  isElderly: boolean;
  severityLevel: 'MILD' | 'MODERATE' | 'OVERFLOWING' | 'EMERGENCY';
  purok: string;
  streetAddress?: string;
  houseNumber?: string;
  landmark?: string;
  coordinates: {
    lat: number;
    lng: number;
  };
  autoGpsAccurate?: boolean;
  realtimeGpsAddress?: string;
  isWithinBrgy41?: boolean;
  needsAssistanceOutside?: boolean;
  wasteTypes: string[];
  urgency: 'NORMAL' | 'HIGH' | 'URGENT_ELDERLY' | 'OVERFLOWING';
  estimatedBags?: string;
  photos: string[];
  notes?: string;
  status: 'PENDING' | 'DISPATCHED' | 'RESOLVED' | 'CANCELLED';
  createdAt: string;
  dispatchedAt?: string;
  resolvedAt?: string;
  resolvedBy?: string;
  resolutionNotes?: string;

  // REQUIRED Kagawad Proof of Collection
  proofPhotos: string[];
  proofSubmittedAt?: string;
  proofKagawadName?: string;

  cancelledAt?: string;
  cancellationReason?: string;
  sourceStorage: 'Raspberry Pi 4B (Local Cloud)' | 'Cloud Server';
  storageUsedMb: number;
  residentPhotosSizeMb: number;
  proofPhotosSizeMb: number;
  retentionDays: number;
  expiresAt: string;
  remindersSent: number;
  lastReminderAt?: string;
}

// In-memory reports store
let reports: WasteReport[] = [];

// In-memory Telegram Bot notification queue and simulation state
let telegramConfig = {
  botToken: process.env.TELEGRAM_BOT_TOKEN || '',
  chatId: process.env.TELEGRAM_CHAT_ID || '',
  botEnabled: true,
  dailyReminderCronActive: true,
  lastBroadcastMessage: '',
  lastBroadcastTime: new Date().toISOString(),
};

// Helper to get formatted Philippine Time (Asia/Manila, UTC+8)
function getPhilippineTime(): string {
  return new Intl.DateTimeFormat('en-PH', {
    timeZone: 'Asia/Manila',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: true,
  }).format(new Date()) + ' PST';
}

function getPhilippineDateTime(): string {
  return new Intl.DateTimeFormat('en-PH', {
    timeZone: 'Asia/Manila',
    month: 'short',
    day: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: true,
  }).format(new Date()) + ' (Philippine Time)';
}

// Helper to dispatch actual messages via Telegram Bot API when configured
async function sendRealTelegramMessage(text: string) {
  const token = telegramConfig.botToken || process.env.TELEGRAM_BOT_TOKEN;
  const chatId = telegramConfig.chatId || process.env.TELEGRAM_CHAT_ID;
  if (!token || !chatId || token === 'YOUR_BOT_TOKEN_HERE') {
    return { ok: false, reason: 'Token or Chat ID not configured yet' };
  }
  try {
    const res = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: chatId,
        text,
      }),
    });
    const data = await res.json();
    return { ok: !!data.ok, description: data.description };
  } catch (err: any) {
    return { ok: false, error: err?.message || String(err) };
  }
}

// Auto-purge TTL routine: Checks every minute for items past retention date
function purgeExpiredReports() {
  const now = new Date();
  const initialCount = reports.length;
  reports = reports.filter((r) => new Date(r.expiresAt) > now);
  if (reports.length < initialCount) {
    console.log(`[D.R.A.W TTL Purge] Purged ${initialCount - reports.length} expired items from storage.`);
  }
}
setInterval(purgeExpiredReports, 60000);

// API Endpoints

// 1. Get all reports
app.get('/api/reports', (_req: Request, res: Response) => {
  purgeExpiredReports();
  const safeReports = reports.map((r) => ({
    ...r,
    purok: r.purok || 'Barangay 41, Cavite City',
    coordinates: r.coordinates || { lat: 14.4865, lng: 120.8980 },
    photos: Array.isArray(r.photos) ? r.photos : [],
    proofPhotos: Array.isArray(r.proofPhotos) ? r.proofPhotos : [],
    wasteTypes: Array.isArray(r.wasteTypes) ? r.wasteTypes : ['Household Trash'],
    severityLevel: r.severityLevel || 'MODERATE',
    isElderly: !!r.isElderly,
    storageUsedMb: r.storageUsedMb || +(
      ((r.photos?.length || 0) * 0.8) +
      ((r.proofPhotos?.length || 0) * 0.75)
    ).toFixed(2),
  }));
  return res.json(safeReports);
});

// 2. Create a new waste collection report
app.post('/api/reports', (req: Request, res: Response) => {
  try {
    const {
      residentName,
      residentPhone,
      isElderly,
      severityLevel,
      purok,
      streetAddress,
      houseNumber,
      landmark,
      coordinates,
      autoGpsAccurate,
      wasteTypes,
      urgency,
      estimatedBags,
      photos,
      notes,
      sourceStorage,
      retentionDays,
      realtimeGpsAddress,
      isWithinBrgy41,
      needsAssistanceOutside,
    } = req.body;

    if (!Array.isArray(photos) || photos.length === 0) {
      return res.status(400).json({ error: 'Kinakailangan ang litrato ng basura. Bawal mag-submit nang walang litrato.' });
    }

    const reportCount = reports.length + 1;
    const ticketNumber = `DRAW-CAV-${String(reportCount).padStart(3, '0')}`;
    const days = retentionDays || 3;
    const createdAt = new Date().toISOString();
    const expiresAt = new Date(Date.now() + days * 86400000).toISOString();

    const finalSeverity = severityLevel || (isElderly ? 'OVERFLOWING' : 'MODERATE');
    let finalUrgency = urgency || 'NORMAL';
    if (isElderly) finalUrgency = 'URGENT_ELDERLY';
    else if (finalSeverity === 'EMERGENCY' || finalSeverity === 'OVERFLOWING') finalUrgency = 'HIGH';

    const coords = coordinates || { lat: 14.4824, lng: 120.9015 };
    const inBrgy41 =
      isWithinBrgy41 !== undefined
        ? !!isWithinBrgy41
        : coords.lat >= 14.478 &&
          coords.lat <= 14.488 &&
          coords.lng >= 120.897 &&
          coords.lng <= 120.907;

    const isOutsideAssistance = !!needsAssistanceOutside || (!inBrgy41);
    const resolvedRealtimeAddress =
      realtimeGpsAddress ||
      `${streetAddress || 'P. Burgos Ave'}, Cavite City (GPS: ${coords.lat}, ${coords.lng})`;

    const sanitizedTypes = Array.isArray(wasteTypes) && wasteTypes.length > 0 ? [...wasteTypes] : ['Household Trash'];
    if (isOutsideAssistance && !sanitizedTypes.includes('Nangangailangan ng assistance')) {
      sanitizedTypes.push('Nangangailangan ng assistance');
    }

    const photoCount = Array.isArray(photos) ? photos.length : 0;
    const residentPhotosMb = +(photoCount * 0.8).toFixed(2);

    const newReport: WasteReport = {
      id: `rep-${Date.now()}`,
      ticketNumber,
      residentName: residentName ? String(residentName).trim() : '',
      residentPhone: residentPhone || 'N/A',
      isElderly: !!isElderly,
      severityLevel: finalSeverity,
      purok: purok || 'Barangay 41, Cavite City',
      streetAddress: streetAddress || '',
      houseNumber: houseNumber || '',
      landmark: landmark || '',
      coordinates: coords,
      autoGpsAccurate: autoGpsAccurate ?? true,
      realtimeGpsAddress: resolvedRealtimeAddress,
      isWithinBrgy41: inBrgy41,
      needsAssistanceOutside: isOutsideAssistance,
      wasteTypes: sanitizedTypes,
      urgency: finalUrgency,
      estimatedBags: estimatedBags || '1-3 bags',
      photos: Array.isArray(photos) ? photos : [],
      notes: notes || '',
      status: 'PENDING',
      createdAt,
      proofPhotos: [],
      sourceStorage: sourceStorage || 'Raspberry Pi 4B (Local Cloud)',
      storageUsedMb: residentPhotosMb,
      residentPhotosSizeMb: residentPhotosMb,
      proofPhotosSizeMb: 0,
      retentionDays: days,
      expiresAt,
      remindersSent: 1,
      lastReminderAt: createdAt,
    };

    if (newReport.isElderly || newReport.severityLevel === 'EMERGENCY') {
      reports.unshift(newReport);
    } else {
      reports.push(newReport);
    }

    const phTime = getPhilippineDateTime();
    const gmapsLink = `https://www.google.com/maps?q=${newReport.coordinates.lat},${newReport.coordinates.lng}`;
    const jurisdictionTag = inBrgy41 ? '✓ Sakop ng Brgy 41' : '⚠️ NASA LABAS NG BRGY 41 (Kailangan ng Assistance)';
    telegramConfig.lastBroadcastMessage = `📢 [DRAW - BAGONG CONCERN REPORT]\n🎫 Ticket: ${newReport.ticketNumber}\n🕒 Oras (Philippine Time): ${phTime}\n📍 Purok/Lugar: ${newReport.purok} - ${newReport.streetAddress || 'Auto-GPS'}\n🧭 Tunay na GPS: ${resolvedRealtimeAddress}\n🏛️ Hurisdiksyon: ${jurisdictionTag}\n🚨 Kalubhaan: ${newReport.severityLevel}${newReport.isElderly ? ' ⭐ (Senior Citizen Priority)' : ''}\n🗑️ Uri: ${sanitizedTypes.join(', ')}\n🗺️ Mapa: ${gmapsLink}`;
    telegramConfig.lastBroadcastTime = phTime;

    sendRealTelegramMessage(telegramConfig.lastBroadcastMessage).catch((e) => {
      console.warn('[Telegram Dispatch Warning]:', e);
    });

    res.status(201).json({
      success: true,
      report: newReport,
      message: 'Waste collection ticket submitted successfully. Kagawad notified via Telegram.',
    });
  } catch (error) {
    console.error('Error creating report:', error);
    res.status(500).json({ error: 'Failed to create waste collection report' });
  }
});

// 3. Update report status with Kagawad Proof of Collection
app.patch('/api/reports/:id/status', (req: Request, res: Response) => {
  const { id } = req.params;
  const { status, resolvedBy, resolutionNotes, cancellationReason, proofPhotos, proofKagawadName } = req.body;

  const report = reports.find((r) => r.id === id);
  if (!report) {
    return res.status(404).json({ error: 'Report not found' });
  }

  if (status) {
    report.status = status;
    if (status === 'DISPATCHED') {
      report.dispatchedAt = new Date().toISOString();
    } else if (status === 'RESOLVED') {
      const now = new Date().toISOString();
      report.resolvedAt = now;
      report.resolvedBy = resolvedBy || proofKagawadName || 'Barangay Kagawad & Cavite Sanitation Crew';
      report.resolutionNotes = resolutionNotes || 'Natapos na ang pagkolekta ng basura. Malinis na ang lugar.';

      // Store attached proof photos from Kagawad
      if (Array.isArray(proofPhotos) && proofPhotos.length > 0) {
        report.proofPhotos = proofPhotos;
        report.proofSubmittedAt = now;
        report.proofKagawadName = proofKagawadName || report.resolvedBy;
        const proofMb = +(proofPhotos.length * 0.75).toFixed(2);
        report.proofPhotosSizeMb = proofMb;
        report.storageUsedMb = +(report.residentPhotosSizeMb + proofMb).toFixed(2);
      }

      // Reset TTL for 3 days from resolution before auto-purging on Pi 4
      report.expiresAt = new Date(Date.now() + report.retentionDays * 86400000).toISOString();
    } else if (status === 'CANCELLED') {
      report.cancelledAt = new Date().toISOString();
      report.cancellationReason = cancellationReason || 'Kinansela ng Kagawad o residente.';
    }
  }

  res.json({ success: true, report });
});

// 4. Delete report immediately
app.delete('/api/reports/:id', (req: Request, res: Response) => {
  const { id } = req.params;
  const index = reports.findIndex((r) => r.id === id);
  if (index === -1) {
    return res.status(404).json({ error: 'Report not found' });
  }
  const deleted = reports.splice(index, 1)[0];
  res.json({ success: true, deletedId: deleted.id });
});

// 5. Clear all reports and logs (Clean Slate)
app.post('/api/reports/clear', (_req: Request, res: Response) => {
  const previousCount = reports.length;
  reports = [];
  res.json({ success: true, clearedCount: previousCount, message: 'Nalinis na ang buong data logbook.' });
});

// 6. Raspberry Pi 4B Storage Status & Granular Metrics
app.get('/api/pi-status', (_req: Request, res: Response) => {
  const totalResidentPhotos = reports.reduce((acc, r) => acc + (r.photos?.length || 0), 0);
  const totalProofPhotos = reports.reduce((acc, r) => acc + (r.proofPhotos?.length || 0), 0);
  const totalResidentMb = +(totalResidentPhotos * 0.8).toFixed(2);
  const totalProofMb = +(totalProofPhotos * 0.75).toFixed(2);
  const totalStorageUsedMb = +(totalResidentMb + totalProofMb + (reports.length * 0.02)).toFixed(2);
  const totalStorageCapacityGb = 32;

  res.json({
    hardware: 'Raspberry Pi 4 Model B (Rev 1.4)',
    ram: '4GB LPDDR4',
    storageCapacityGb: totalStorageCapacityGb,
    storageUsedMb: totalStorageUsedMb,
    storageFreeGb: +(totalStorageCapacityGb - totalStorageUsedMb / 1024).toFixed(2),
    residentPhotosCount: totalResidentPhotos,
    residentPhotosMb: totalResidentMb,
    proofPhotosCount: totalProofPhotos,
    proofPhotosMb: totalProofMb,
    cachedImagesCount: totalResidentPhotos + totalProofPhotos,
    activeTicketsCount: reports.length,
    pendingTicketsCount: reports.filter((r) => r.status === 'PENDING').length,
    autoPurgeTtlDays: 3,
    cpuTempCelsius: +(42.5 + Math.random() * 3.0).toFixed(1),
    ramUsagePercent: 32,
    ipAddress: '192.168.1.145',
    localHostname: 'raspberrypi.local:8000',
    online: true,
    lastPurgeRun: new Date(Date.now() - 3600000).toISOString(),
  });
});

// 7. Telegram Alert Dispatcher (Synchronized with Philippine Time UTC+8)
app.post('/api/telegram/test-notify', async (req: Request, res: Response) => {
  const { botToken, chatId, message } = req.body;
  if (botToken) telegramConfig.botToken = botToken;
  if (chatId) telegramConfig.chatId = chatId;

  const phTime = getPhilippineDateTime();
  const simulatedMessage =
    message ||
    `🔔 [DRAW TEST ALERT - BARANGAY 41]\nStatus: Aktibo at Konektado sa Portal\n🕒 Oras (Philippine Time): ${phTime}\n📋 Kasalukuyang Pending: ${
      reports.filter((r) => r.status === 'PENDING').length
    } concern(s)\n🏛️ Sistema: DRAW Barangay 41 Waste Collection`;

  telegramConfig.lastBroadcastMessage = simulatedMessage;
  telegramConfig.lastBroadcastTime = phTime;

  const telegramResult = await sendRealTelegramMessage(simulatedMessage);

  res.json({
    success: true,
    message: telegramResult.ok
      ? `Matagumpay na naipadala ang alert sa Telegram ng Kagawad! (${phTime})`
      : 'Nai-save ang Telegram configurations sa server.',
    telegramResult,
    broadcast: simulatedMessage,
    timestamp: phTime,
  });
});

// 7b. Telegram Status & Philippine Time Sync Endpoint
app.get('/api/telegram/status', (_req: Request, res: Response) => {
  const phTime = getPhilippineDateTime();
  res.json({
    botConfigured: !!(telegramConfig.botToken && telegramConfig.chatId),
    chatId: telegramConfig.chatId,
    lastBroadcastMessage: telegramConfig.lastBroadcastMessage,
    lastBroadcastTime: telegramConfig.lastBroadcastTime,
    philippineTime: phTime,
    pendingCount: reports.filter((r) => r.status === 'PENDING').length,
  });
});

// 8. Download source code zip with auto-generation safeguard
app.get('/api/download/draw-source-code.zip', (_req: Request, res: Response) => {
  const publicDir = path.resolve(process.cwd(), 'public');
  if (!fs.existsSync(publicDir)) {
    fs.mkdirSync(publicDir, { recursive: true });
  }
  const zipPath = path.resolve(publicDir, 'draw-source-code.zip');

  // Always generate fresh zip on download to ensure it matches current code exactly
  try {
    const { execSync } = require('child_process');
    execSync(`python3 -c "import zipfile, os; os.makedirs('public', exist_ok=True); z = zipfile.ZipFile('public/draw-source-code.zip', 'w', zipfile.ZIP_DEFLATED); [z.write(os.path.join(r, f), os.path.relpath(os.path.join(r, f), '.')) for r, d, fs in os.walk('.') if not any(x in r for x in ['node_modules', 'dist', '.git', '.aistudio']) for f in fs if not f.endswith('.zip')]"`);
  } catch (e) {
    console.error('Failed to create zip on demand:', e);
  }

  if (fs.existsSync(zipPath) && fs.statSync(zipPath).size > 1000) {
    const fileStats = fs.statSync(zipPath);
    res.setHeader('Content-Type', 'application/zip');
    res.setHeader('Content-Length', fileStats.size.toString());
    res.setHeader('Content-Disposition', 'attachment; filename="draw-barangay41-website-source.zip"');
    return res.sendFile(zipPath);
  } else {
    return res.status(500).json({ error: 'Failed to generate valid zip file.' });
  }
});

// 9. API to retrieve full source file tree for client-side JSZip packaging and code viewing
app.get('/api/source-tree', (_req: Request, res: Response) => {
  try {
    const files: { path: string; content: string }[] = [];
    const rootDir = process.cwd();

    function readFilesRecursively(dir: string) {
      const list = fs.readdirSync(dir);
      for (const item of list) {
        if (['node_modules', 'dist', '.git', '.aistudio'].includes(item)) continue;
        const fullPath = path.join(dir, item);
        const relPath = path.relative(rootDir, fullPath);
        const stat = fs.statSync(fullPath);
        if (stat.isDirectory()) {
          readFilesRecursively(fullPath);
        } else {
          if (item.endsWith('.zip') || item.endsWith('.png') || item.endsWith('.apk')) continue;
          try {
            const content = fs.readFileSync(fullPath, 'utf8');
            files.push({ path: relPath, content });
          } catch {}
        }
      }
    }

    readFilesRecursively(rootDir);
    res.json({ success: true, count: files.length, files });
  } catch (err: any) {
    res.status(500).json({ error: err?.message || 'Failed to read source tree' });
  }
});

// Setup Vite middleware in dev or static files in production
async function startServer() {
  const publicPath = path.resolve(process.cwd(), 'public');
  if (fs.existsSync(publicPath)) {
    app.use(express.static(publicPath));
  }

  if (process.env.NODE_ENV === 'production') {
    const distPath = path.resolve(process.cwd(), 'dist');
    if (fs.existsSync(distPath)) {
      app.use(express.static(distPath));
      app.get('*', (_req, res) => {
        res.sendFile(path.resolve(distPath, 'index.html'));
      });
    } else {
      app.get('*', (_req, res) => {
        res.sendFile(path.resolve(process.cwd(), 'index.html'));
      });
    }
  } else {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`D.R.A.W Barangay Waste System running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
