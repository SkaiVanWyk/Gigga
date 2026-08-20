// Supabase client initialization
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const SUPABASE_URL = 'https://fpapniykwkaumhkykxye.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZwYXBuaXlrd2thdW1oa3lreHllIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODcxNzUxMjcsImV4cCI6MjEwMjc1MTEyN30.bxABbCspSzaA1Is5xRPaBy-ZbIZHsdB-KK74Hid8oos';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
