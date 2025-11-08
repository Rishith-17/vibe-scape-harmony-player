// lib/getHuggingFaceToken.ts
import { supabase } from '@/integrations/supabase/client';

export async function getHuggingFaceToken() {
  const { data, error } = await supabase
    .from('secrets')
    .select('value')
    .eq('key', 'hf_token')
    .single();

  if (error || !data) {
    console.error('Error fetching token:', error);
    throw new Error('Failed to fetch Hugging Face token');
  }

  return data.value;
}