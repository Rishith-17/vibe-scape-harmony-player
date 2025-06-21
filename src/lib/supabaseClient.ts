// lib/supabaseClient.ts
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://zchhecueiqpqhvrnnmsm.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpjaGhlY3VlaXFwcWh2cm5ubXNtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDgwMTk1MDMsImV4cCI6MjA2MzU5NTUwM30.SWsbuGq7YflkbyUoIAah9Ap37OumXt9xlZeFe0GvxuM';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);