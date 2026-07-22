import { createClient } from '@supabase/supabase-js';

// Reemplaza esto con tu Project URL
const supabaseUrl = 'https://gsdupsltjtvsmcsomgke.supabase.co';
// Reemplaza esto con tu API Key (anon public)
const supabaseAnonKey =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdzZHVwc2x0anR2c21jc29tZ2tlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODQ2NzYzMjMsImV4cCI6MjEwMDI1MjMyM30.JOoa9JQQE1UNMzDZ3ft1iGQvoFrKOFMg80MxxBvq6DU';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
