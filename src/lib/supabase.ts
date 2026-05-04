import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || 'https://mabdcyvesxarcmtvxsvy.supabase.co';
const SUPABASE_ANON = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1hYmRjeXZlc3hhcmNtdHZ4c3Z5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzYxMTc2NzEsImV4cCI6MjA5MTY5MzY3MX0.jQcO6VwBvKhIp1VQK0m4yvCzHhWwzjDLAtTdX8CO3BE';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON);
