import { createClient } from '@supabase/supabase-js';

const catchUrl = process.env.NEXT_PUBLIC_SUPABASE_URL_CATCH || '';
const catchAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY_CATCH || '';

const memoryUrl = process.env.NEXT_PUBLIC_SUPABASE_URL_MEMORY || '';
const memoryAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY_MEMORY || '';

const screamUrl = process.env.NEXT_PUBLIC_SUPABASE_URL_SCREAM || '';
const screamAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY_SCREAM || '';

const moleUrl = process.env.NEXT_PUBLIC_SUPABASE_URL_MOLE || '';
const moleAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY_MOLE || '';

export const supabaseCatch = createClient(catchUrl, catchAnonKey);
export const supabaseMemory = createClient(memoryUrl, memoryAnonKey);
export const supabaseScream = createClient(screamUrl, screamAnonKey);
export const supabaseMole = createClient(moleUrl, moleAnonKey);
