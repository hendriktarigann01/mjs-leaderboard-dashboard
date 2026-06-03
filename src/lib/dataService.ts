import { supabaseCatch, supabaseMemory, supabaseScream, supabaseMole } from './supabase';

export interface LeaderboardEntry {
  rank?: number;
  id: string;
  name: string;
  handphone: string;
  score?: number;
  time_ms?: number;
  moves?: number;
  stage?: number;
  created_at: string; // ISO string atau format tanggal asli
  game_type?: string; // Standard atau Touch (untuk Catch)
}

// Konfigurasi rentang minggu berdasarkan WIB (UTC+7)
// Contoh: 11 Juni 2026 00:00:00 WIB -> 10 Juni 2026 17:00:00 UTC
export const WEEK_RANGES = {
  'week1': {
    start: '2026-06-10T17:00:00.000Z', // 11 Juni 00:00:00 WIB
    end: '2026-06-21T16:59:59.999Z',   // 21 Juni 23:59:59 WIB
    label: 'Week 1 (11 - 21 Juni 2026)'
  },
  'week2': {
    start: '2026-06-21T17:00:00.000Z', // 22 Juni 00:00:00 WIB
    end: '2026-06-28T16:59:59.999Z',   // 28 Juni 23:59:59 WIB
    label: 'Week 2 (22 - 28 Juni 2026)'
  },
  'week3': {
    start: '2026-06-28T17:00:00.000Z', // 29 Juni 00:00:00 WIB
    end: '2026-07-05T16:59:59.999Z',   // 5 Juli 23:59:59 WIB
    label: 'Week 3 (29 Juni - 5 Juli 2026)'
  },
  'week4': {
    start: '2026-07-05T17:00:00.000Z', // 6 Juli 00:00:00 WIB
    end: '2026-07-12T16:59:59.999Z',   // 12 Juli 23:59:59 WIB
    label: 'Week 4 (6 - 12 Juli 2026)'
  },
  'all': {
    start: null,
    end: null,
    label: 'All Time'
  }
};

export type WeekKey = keyof typeof WEEK_RANGES;

// Helper untuk memformat tanggal ke format WIB lokal
export function formatToWIB(dateString: string): string {
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return dateString;
    
    // Gunakan Intl.DateTimeFormat untuk format lokal Indonesia WIB
    const formatter = new Intl.DateTimeFormat('id-ID', {
      timeZone: 'Asia/Jakarta',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false
    });
    
    return `${formatter.format(date)} WIB`;
  } catch (error) {
    return dateString;
  }
}

// Coba lakukan query dengan beberapa nama tabel alternatif untuk menangani perbedaan skema database
async function querySupabaseTable(supabaseClient: any, possibleTables: string[], start: string | null, end: string | null) {
  let lastError = null;

  for (const tableName of possibleTables) {
    try {
      let query = supabaseClient.from(tableName).select('*');
      
      // Filter waktu jika ada
      if (start && end) {
        query = query.gte('created_at', start).lte('created_at', end);
      }
      
      const { data, error } = await query;
      
      if (!error && data) {
        return { data, tableName };
      }
      lastError = error;
    } catch (e) {
      lastError = e;
    }
  }
  
  throw lastError || new Error("Semua tabel tidak ditemukan atau gagal diakses");
}

export async function fetchLeaderboardData(
  game: 'catch-standard' | 'catch-touch' | 'memory' | 'scream' | 'mole',
  week: WeekKey
): Promise<{ data: LeaderboardEntry[]; activeTable: string; error?: string }> {
  
  let client: any;
  const tables = ['leaderboard', 'scores', 'player_scores', 'game_scores', 'users', 'players'];
  
  // Pilih client supabase berdasarkan game
  if (game === 'catch-standard' || game === 'catch-touch') {
    client = supabaseCatch;
  } else if (game === 'memory') {
    client = supabaseMemory;
  } else if (game === 'scream') {
    client = supabaseScream;
  } else if (game === 'mole') {
    client = supabaseMole;
  }

  const range = WEEK_RANGES[week];
  
  try {
    const { data: rawData, tableName } = await querySupabaseTable(client, tables, range.start, range.end);
    
    // Normalisasi skema kolom secara dinamis
    let normalizedData: LeaderboardEntry[] = rawData.map((item: any) => {
      // Deteksi kolom nama
      const name = item.player_name || item.name || item.username || item.player_id || 'Unknown Player';
      
      // Deteksi nomor handphone/WhatsApp
      const handphone = item.player_handphone || item.handphone || item.whatsapp || item.phone || item.telepon || '-';
      
      // Deteksi waktu bermain
      const created_at = item.created_at || item.play_time || item.timestamp || item.updated_at || new Date().toISOString();
      
      // Deteksi game type jika ada penanda game_type/game_mode
      const game_type = item.game_type || item.game_mode || item.type || item.mode || item.device || item.device_type || '';

      const entry: LeaderboardEntry = {
        id: item.id || Math.random().toString(36).substr(2, 9),
        name,
        handphone,
        created_at,
        game_type
      };

      // Untuk memory card
      if (game === 'memory') {
        entry.time_ms = typeof item.time_ms !== 'undefined' ? item.time_ms : (item.duration || item.time_taken || 999999);
        entry.moves = typeof item.moves !== 'undefined' ? item.moves : (item.total_moves || 0);
        entry.stage = typeof item.stage !== 'undefined' ? item.stage : (item.level || 1);
      } else {
        // Untuk game dengan skor (catch, scream, mole)
        entry.score = typeof item.score !== 'undefined' ? item.score : (item.points || item.value || 0);
      }

      return entry;
    });

    // Filter khusus Catch Game Standard vs Touch jika ada kolom penanda game_type
    if (game === 'catch-standard' || game === 'catch-touch') {
      const isTouchRequested = game === 'catch-touch';
      
      // Periksa apakah ada data yang memiliki penanda game_type yang jelas
      const hasGameTypeMarkers = normalizedData.some(d => d.game_type && d.game_type.trim().length > 0);
      
      if (hasGameTypeMarkers) {
        normalizedData = normalizedData.filter(d => {
          const typeLower = (d.game_type || '').toLowerCase();
          if (isTouchRequested) {
            return typeLower.includes('touch') || typeLower.includes('mobile') || typeLower.includes('tablet');
          } else {
            return typeLower.includes('standard') || typeLower.includes('desktop') || typeLower.includes('pc') || !typeLower.includes('touch');
          }
        });
      }
    }

    // Lakukan pengurutan data secara khusus
    if (game === 'memory') {
      // Urutkan durasi tercepat ke terlambat (time_ms ASC).
      // Jika time_ms sama, urutkan berdasarkan langkah tersedikit (moves ASC), kemudian tanggal terdahulu (created_at ASC)
      normalizedData.sort((a, b) => {
        const timeA = a.time_ms ?? 999999;
        const timeB = b.time_ms ?? 999999;
        if (timeA !== timeB) return timeA - timeB;
        
        const movesA = a.moves ?? 999;
        const movesB = b.moves ?? 999;
        if (movesA !== movesB) return movesA - movesB;

        return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
      });
    } else {
      // Catch Game, Scream, Whac-A-Mole: Urutkan skor tertinggi ke terendah (score DESC).
      // Jika skor sama, urutkan berdasarkan waktu bermain terdahulu (created_at ASC)
      normalizedData.sort((a, b) => {
        const scoreA = a.score ?? 0;
        const scoreB = b.score ?? 0;
        if (scoreB !== scoreA) return scoreB - scoreA;
        
        return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
      });
    }

    // Tambahkan Peringkat (Rank) 1-based
    const rankedData = normalizedData.map((item, index) => ({
      ...item,
      rank: index + 1
    }));

    return { data: rankedData, activeTable: tableName };
  } catch (error: any) {
    console.error(`Error fetching leaderboard for game ${game}:`, error);
    return { 
      data: [], 
      activeTable: 'None', 
      error: error?.message || 'Gagal terhubung ke database. Harap periksa apakah tabel ada dan izin RLS diaktifkan.' 
    };
  }
}
