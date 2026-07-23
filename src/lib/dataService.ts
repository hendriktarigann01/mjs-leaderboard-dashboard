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
  created_at: string;
  game_type?: string;
}

export type GameId = 'catch-standard' | 'memory' | 'scream' | 'mole';

export const GAMES = [
  {
    id: "mole" as GameId,
    name: "Whac a Mole",
    dbName: "Whac-A-Mole Database",
    licenseGameId: "Whac-A-Mole"
  },
  {
    id: "catch-standard" as GameId,
    name: "Catch Game (Sensor & Touch)",
    dbName: "Catch Database",
    licenseGameId: "Catch"
  },
  {
    id: "memory" as GameId,
    name: "Memory Card",
    dbName: "Memory Card Database",
    licenseGameId: "Memory"
  },
  {
    id: "scream" as GameId,
    name: "Scream Challenge",
    dbName: "Scream Database",
    licenseGameId: "Scream"
  }
] as const;

export function mapGameIdToLicenseGame(gameId: GameId): string {
  switch (gameId) {
    case 'mole':
      return 'Whac-A-Mole';
    case 'catch-standard':
      return 'Catch';
    case 'memory':
      return 'Memory';
    case 'scream':
      return 'Scream';
    default:
      return 'Whac-A-Mole';
  }
}

export function formatToWIB(dateString: string): string {
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return dateString;
    
    const formatter = new Intl.DateTimeFormat('en-US', {
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

async function querySupabaseTable(supabaseClient: any, possibleTables: string[], start: string | null, end: string | null) {
  let lastError = null;

  for (const tableName of possibleTables) {
    try {
      let query = supabaseClient.from(tableName).select('*');
      
      if (start) {
        query = query.gte('created_at', start);
      }
      if (end) {
        query = query.lte('created_at', end);
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
  
  throw lastError || new Error("None of the database tables were found or could be accessed");
}

export async function fetchLeaderboardData(
  game: GameId,
  startDate?: string | null,
  endDate?: string | null
): Promise<{ data: LeaderboardEntry[]; activeTable: string; error?: string }> {
  
  let client: any;
  const tables = ['leaderboard', 'scores', 'player_scores', 'game_scores', 'users', 'players'];
  
  if (game === 'catch-standard') {
    client = supabaseCatch;
  } else if (game === 'memory') {
    client = supabaseMemory;
  } else if (game === 'scream') {
    client = supabaseScream;
  } else if (game === 'mole') {
    client = supabaseMole;
  }

  const startISO = startDate ? new Date(`${startDate}T00:00:00.000Z`).toISOString() : null;
  const endISO = endDate ? new Date(`${endDate}T23:59:59.999Z`).toISOString() : null;
  
  try {
    const { data: rawData, tableName } = await querySupabaseTable(client, tables, startISO, endISO);
    
    let normalizedData: LeaderboardEntry[] = rawData.map((item: any) => {
      const name = item.player_name || item.name || item.username || item.player_id || 'Unknown Player';
      const handphone = item.player_handphone || item.handphone || item.whatsapp || item.phone || item.telepon || '-';
      const created_at = item.created_at || item.play_time || item.timestamp || item.updated_at || new Date().toISOString();
      const game_type = item.game_type || item.game_mode || item.type || item.mode || item.device || item.device_type || '';

      const entry: LeaderboardEntry = {
        id: item.id || Math.random().toString(36).substr(2, 9),
        name,
        handphone,
        created_at,
        game_type
      };

      if (game === 'memory') {
        entry.time_ms = typeof item.time_ms !== 'undefined' ? item.time_ms : (item.duration || item.time_taken || 999999);
        entry.moves = typeof item.moves !== 'undefined' ? item.moves : (item.total_moves || 0);
        entry.stage = typeof item.stage !== 'undefined' ? item.stage : (item.level || 1);
      } else {
        entry.score = typeof item.score !== 'undefined' ? item.score : (item.points || item.value || 0);
      }

      return entry;
    });

    if (game === 'catch-standard') {
      const hasGameTypeMarkers = normalizedData.some(d => d.game_type && d.game_type.trim().length > 0);
      
      if (hasGameTypeMarkers) {
        normalizedData = normalizedData.filter(d => {
          const typeLower = (d.game_type || '').toLowerCase();
          return typeLower.includes('standard') || typeLower.includes('desktop') || typeLower.includes('pc') || !typeLower.includes('touch');
        });
      }
    }

    if (game === 'memory') {
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
      normalizedData.sort((a, b) => {
        const scoreA = a.score ?? 0;
        const scoreB = b.score ?? 0;
        if (scoreB !== scoreA) return scoreB - scoreA;
        
        return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
      });
    }

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
      error: error?.message || 'Failed to connect to the database. Please check if the tables exist and RLS policies are enabled.' 
    };
  }
}
