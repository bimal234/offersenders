
import { createClient } from '@supabase/supabase-js';

// Best Practice: Use Environment Variables
// In a real project, create a file named .env.local in your root folder and add:
// VITE_SUPABASE_URL=your_url_here
// VITE_SUPABASE_ANON_KEY=your_key_here

// Safely check if env exists to avoid runtime crashes
const env = (import.meta as any).env || {};

const supabaseUrl = env.VITE_SUPABASE_URL || 'https://iwtwovwbmogopqmxmrja.supabase.co';
const supabaseAnonKey = env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml3dHdvdndibW9nb3BxbXhtcmphIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjMzNjQ4OTcsImV4cCI6MjA3ODk0MDg5N30.N5Ac-UHKfFsMHnlIaw1mOuUSDg6z5QEj2tL9Z91T-Ws';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
