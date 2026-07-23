import { supabaseMole, supabaseCatch, supabaseMemory, supabaseScream } from './supabase';

export type LicenseStatus = 'PENDING' | 'ACTIVE' | 'DISABLED' | 'BLOCKED' | 'EXPIRED' | 'CLOCK_TAMPERED';

export interface License {
  id: string;
  gameId: string;
  clientId: string;
  deviceFingerprint: string | null;
  status: LicenseStatus;
  operatingStart: string; // e.g. "09:00"
  operatingEnd: string;   // e.g. "22:00"
  activatedAt: string | null;
  expiresAt: string | null;
  lastSeenAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ActivationCode {
  id: string;
  licenseId: string;
  code: string;
  used: boolean;
  createdAt: string;
  usedAt: string | null;
  clientName?: string;
  gameId?: string;
}

export interface DeviceResetLog {
  id: string;
  licenseId: string;
  oldFingerprint: string;
  reason: string;
  resetBy: string;
  createdAt: string;
  clientId?: string;
  gameId?: string;
}

export type HeartbeatStatus = 'online' | 'idle' | 'stale';

export interface HeartbeatInfo {
  status: HeartbeatStatus;
  label: string;
  colorClass: string;
  isWithinOperatingHours: boolean;
}

// Session memory store for responsive state management
let sessionLicenses: License[] = [];
let sessionActivationCodes: ActivationCode[] = [];
let sessionResetLogs: DeviceResetLog[] = [];

function generateUUID(): string {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

function getSupabaseClients() {
  return [supabaseMole, supabaseCatch, supabaseMemory, supabaseScream];
}

export function formatWIB(dateString: string | null | undefined): string {
  if (!dateString) return '-';
  try {
    const d = new Date(dateString);
    if (isNaN(d.getTime())) return dateString;
    return d.toLocaleString("id-ID", {
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit"
    }) + " WIB";
  } catch {
    return dateString;
  }
}

export function isWithinOperatingHours(operatingStart: string, operatingEnd: string): boolean {
  try {
    const now = new Date();
    const wibStr = now.toLocaleTimeString("en-US", { timeZone: "Asia/Jakarta", hour12: false, hour: "2-digit", minute: "2-digit" });
    const [curH, curM] = wibStr.split(':').map(Number);
    const currentMins = curH * 60 + curM;

    const [startH, startM] = operatingStart.split(':').map(Number);
    const startMins = startH * 60 + startM;

    const [endH, endM] = operatingEnd.split(':').map(Number);
    const endMins = endH * 60 + endM;

    if (startMins <= endMins) {
      return currentMins >= startMins && currentMins <= endMins;
    } else {
      return currentMins >= startMins || currentMins <= endMins;
    }
  } catch {
    return true;
  }
}

export function calculateHeartbeat(lastSeenAt: string | null, operatingStart: string = '09:00', operatingEnd: string = '22:00'): HeartbeatInfo {
  const inHours = isWithinOperatingHours(operatingStart, operatingEnd);

  if (!lastSeenAt) {
    return {
      status: 'stale',
      label: inHours ? 'Offline / No Signal' : 'Idle (Outside Hours)',
      colorClass: inHours ? 'bg-rose-500/20 text-rose-400 border-rose-500/30' : 'bg-amber-500/20 text-amber-300 border-amber-500/30',
      isWithinOperatingHours: inHours
    };
  }

  const lastSeenMs = new Date(lastSeenAt).getTime();
  if (isNaN(lastSeenMs)) {
    return {
      status: 'stale',
      label: 'Invalid Signal',
      colorClass: 'bg-rose-500/20 text-rose-400 border-rose-500/30',
      isWithinOperatingHours: inHours
    };
  }

  const diffMs = Date.now() - lastSeenMs;
  const diffMinutes = Math.max(0, diffMs / 60000);

  if (diffMinutes < 2) {
    return {
      status: 'online',
      label: 'Online',
      colorClass: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
      isWithinOperatingHours: inHours
    };
  }

  if (!inHours || diffMinutes <= 120) {
    const minsText = Math.floor(diffMinutes);
    return {
      status: 'idle',
      label: !inHours ? `Idle (Outside Hours - ${minsText}m ago)` : `Idle (${minsText}m ago)`,
      colorClass: 'bg-amber-500/20 text-amber-300 border-amber-500/30',
      isWithinOperatingHours: inHours
    };
  }

  const hoursText = (diffMinutes / 60).toFixed(1);
  return {
    status: 'stale',
    label: `Stale (${hoursText}h ago)`,
    colorClass: 'bg-rose-500/20 text-rose-400 border-rose-500/30',
    isWithinOperatingHours: inHours
  };
}

export async function fetchLicenses(): Promise<License[]> {
  const clients = getSupabaseClients();
  let fetchedData: License[] = [];

  for (const client of clients) {
    try {
      const { data, error } = await client
        .from('License')
        .select('*');

      if (!error && data && data.length > 0) {
        const mapped: License[] = data.map((item: any) => ({
          id: item.id || item.license_id || item.licenseId || generateUUID(),
          gameId: item.gameId || item.game_id || 'Whac-A-Mole',
          clientId: item.clientId || item.client_id || 'Klien',
          deviceFingerprint: item.deviceFingerprint ?? item.device_fingerprint ?? null,
          status: item.status || 'PENDING',
          operatingStart: item.operatingStart || item.operating_start || '09:00',
          operatingEnd: item.operatingEnd || item.operating_end || '22:00',
          activatedAt: item.activatedAt || item.activated_at || null,
          expiresAt: item.expiresAt || item.expires_at || null,
          lastSeenAt: item.lastSeenAt || item.last_seen_at || null,
          createdAt: item.createdAt || item.created_at || new Date().toISOString(),
          updatedAt: item.updatedAt || item.updated_at || new Date().toISOString()
        }));
        fetchedData.push(...mapped);
      }
    } catch (e) {}
  }

  const map = new Map<string, License>();
  sessionLicenses.forEach(item => map.set(item.id, item));
  fetchedData.forEach(item => map.set(item.id, item));
  
  return Array.from(map.values()).sort((a, b) => 
    new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );
}

export async function createLicense(payload: Partial<License>): Promise<License> {
  const newLic: License = {
    id: generateUUID(),
    gameId: payload.gameId || 'Whac-A-Mole',
    clientId: payload.clientId || `MJS-CLIENT-${Math.floor(1000 + Math.random() * 9000)}`,
    deviceFingerprint: payload.deviceFingerprint || null,
    status: payload.status || 'PENDING',
    operatingStart: payload.operatingStart || '09:00',
    operatingEnd: payload.operatingEnd || '22:00',
    activatedAt: payload.activatedAt || null,
    expiresAt: payload.expiresAt || new Date(Date.now() + 365 * 86400000).toISOString(),
    lastSeenAt: payload.lastSeenAt || null,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  sessionLicenses.unshift(newLic);

  const clients = getSupabaseClients();
  for (const client of clients) {
    try {
      await client.from('License').insert([newLic]);
    } catch (e) {}
  }

  return newLic;
}

export async function updateLicenseStatus(licenseId: string, status: LicenseStatus): Promise<boolean> {
  const clients = getSupabaseClients();
  const now = new Date().toISOString();

  const found = sessionLicenses.find(l => l.id === licenseId);
  if (found) {
    found.status = status;
    found.updatedAt = now;
  }

  for (const client of clients) {
    try {
      await client
        .from('License')
        .update({ status, updatedAt: now })
        .eq('id', licenseId);
    } catch (e) {}
  }

  return true;
}

export async function updateOperatingHours(licenseId: string, operatingStart: string, operatingEnd: string): Promise<boolean> {
  const clients = getSupabaseClients();
  const now = new Date().toISOString();

  const found = sessionLicenses.find(l => l.id === licenseId);
  if (found) {
    found.operatingStart = operatingStart;
    found.operatingEnd = operatingEnd;
    found.updatedAt = now;
  }

  for (const client of clients) {
    try {
      await client
        .from('License')
        .update({ operatingStart, operatingEnd, updatedAt: now })
        .eq('id', licenseId);
    } catch (e) {}
  }

  return true;
}

export async function extendLicenseExpiration(licenseId: string, expiresAt: string): Promise<boolean> {
  const clients = getSupabaseClients();
  const now = new Date().toISOString();

  const found = sessionLicenses.find(l => l.id === licenseId);
  if (found) {
    found.expiresAt = expiresAt;
    found.updatedAt = now;
  }

  for (const client of clients) {
    try {
      await client
        .from('License')
        .update({ expiresAt, updatedAt: now })
        .eq('id', licenseId);
    } catch (e) {}
  }

  return true;
}

export async function fetchActivationCodes(): Promise<ActivationCode[]> {
  const clients = getSupabaseClients();
  let fetchedData: ActivationCode[] = [];

  const licenses = await fetchLicenses();
  const licenseMap = new Map<string, License>();
  licenses.forEach(l => licenseMap.set(l.id, l));

  for (const client of clients) {
    try {
      const { data, error } = await client
        .from('ActivationCode')
        .select('*');

      if (!error && data && data.length > 0) {
        const mapped: ActivationCode[] = data.map((item: any) => {
          const licId = item.licenseId || item.license_id || '';
          const assocLic = licenseMap.get(licId);

          return {
            id: item.id || generateUUID(),
            licenseId: licId,
            code: item.code || '',
            used: typeof item.used !== 'undefined' ? item.used : false,
            createdAt: item.createdAt || item.created_at || new Date().toISOString(),
            usedAt: item.usedAt || item.used_at || null,
            clientName: item.clientName || item.client_id || item.clientId || assocLic?.clientId,
            gameId: item.gameId || item.game_id || assocLic?.gameId
          };
        });
        fetchedData.push(...mapped);
      }
    } catch (e) {}
  }

  const map = new Map<string, ActivationCode>();
  sessionActivationCodes.forEach(item => map.set(item.id, item));
  fetchedData.forEach(item => map.set(item.id, item));
  
  return Array.from(map.values()).sort((a, b) => 
    new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );
}

export function generateShortCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = 'MJS';
  for (let i = 0; i < 5; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

export async function createActivationCode(licenseId: string): Promise<ActivationCode> {
  const allLic = await fetchLicenses();
  const lic = allLic.find(l => l.id === licenseId);

  const codeStr = generateShortCode();
  const newCode: ActivationCode = {
    id: generateUUID(),
    licenseId,
    code: codeStr,
    used: false,
    createdAt: new Date().toISOString(),
    usedAt: null,
    clientName: lic?.clientId || 'Klien',
    gameId: lic?.gameId || 'Whac-A-Mole'
  };

  sessionActivationCodes.unshift(newCode);

  const clients = getSupabaseClients();
  for (const client of clients) {
    try {
      await client.from('ActivationCode').insert([
        {
          id: newCode.id,
          licenseId: newCode.licenseId,
          code: newCode.code,
          used: newCode.used,
          createdAt: newCode.createdAt,
          usedAt: null
        }
      ]);
    } catch (e) {}
  }

  return newCode;
}

export function buildWhatsAppSalesLink(code: string, clientId?: string, gameId?: string): string {
  const message = `Halo Sales MJS, berikut adalah Kode Aktivasi Lisensi Perangkat:\n\n` +
    `• Client ID: *${clientId || 'Klien MJS'}*\n` +
    `• Game: *${gameId || 'Whac-A-Mole'}*\n` +
    `• Kode Aktivasi: *${code}*\n\n` +
    `Silakan masukkan kode ini pada aplikasi game Anda untuk aktivasi lisensi.`;

  return `https://wa.me/628111122492?text=${encodeURIComponent(message)}`;
}

export async function fetchDeviceResetLogs(): Promise<DeviceResetLog[]> {
  const clients = getSupabaseClients();
  let fetchedData: DeviceResetLog[] = [];

  const licenses = await fetchLicenses();
  const licenseMap = new Map<string, License>();
  licenses.forEach(l => licenseMap.set(l.id, l));

  for (const client of clients) {
    try {
      const { data, error } = await client
        .from('DeviceResetLog')
        .select('*');

      if (!error && data && data.length > 0) {
        const mapped: DeviceResetLog[] = data.map((item: any) => {
          const licId = item.licenseId || item.license_id || '';
          const assocLic = licenseMap.get(licId);

          return {
            id: item.id || generateUUID(),
            licenseId: licId,
            oldFingerprint: item.oldFingerprint || item.old_fingerprint || '',
            reason: item.reason || '',
            resetBy: item.resetBy || item.reset_by || 'Admin',
            createdAt: item.createdAt || item.created_at || new Date().toISOString(),
            clientId: item.clientId || item.client_id || assocLic?.clientId,
            gameId: item.gameId || item.game_id || assocLic?.gameId
          };
        });
        fetchedData.push(...mapped);
      }
    } catch (e) {}
  }

  const map = new Map<string, DeviceResetLog>();
  sessionResetLogs.forEach(item => map.set(item.id, item));
  fetchedData.forEach(item => map.set(item.id, item));
  
  return Array.from(map.values()).sort((a, b) => 
    new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );
}

export async function resetDeviceHardware(licenseId: string, reason: string, resetBy: string = 'Admin'): Promise<boolean> {
  const allLic = await fetchLicenses();
  const lic = allLic.find(l => l.id === licenseId);

  const oldFingerprint = lic?.deviceFingerprint || 'FP_UNKNOWN';
  const clientId = lic?.clientId;
  const gameId = lic?.gameId;
  const now = new Date().toISOString();

  const foundLic = sessionLicenses.find(l => l.id === licenseId);
  if (foundLic) {
    foundLic.deviceFingerprint = null;
    foundLic.status = 'PENDING';
    foundLic.updatedAt = now;
  }

  const clients = getSupabaseClients();

  for (const client of clients) {
    try {
      await client
        .from('License')
        .update({
          deviceFingerprint: null,
          status: 'PENDING',
          updatedAt: now
        })
        .eq('id', licenseId);
    } catch (e) {}
  }

  const newLog: DeviceResetLog = {
    id: generateUUID(),
    licenseId,
    oldFingerprint,
    reason,
    resetBy,
    createdAt: now,
    clientId,
    gameId
  };

  sessionResetLogs.unshift(newLog);

  for (const client of clients) {
    try {
      await client.from('DeviceResetLog').insert([
        {
          id: newLog.id,
          licenseId: newLog.licenseId,
          oldFingerprint: newLog.oldFingerprint,
          reason: newLog.reason,
          resetBy: newLog.resetBy,
          createdAt: newLog.createdAt
        }
      ]);
    } catch (e) {}
  }

  return true;
}
