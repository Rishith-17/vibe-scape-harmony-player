import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://your-project-id.supabase.co';
const supabaseAnonKey = 'your-anon-public-key';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

export async function getHuggingFaceToken(): Promise<string> {
  const { data, error } = await supabase
    .from('secrets')
    .select('value')
    .eq('key', 'hf_token')
    .single();

  if (error || !data) {
    console.error('Supabase error:', error);
    throw new Error('Failed to retrieve Hugging Face token');
  }

  return data.value;
}