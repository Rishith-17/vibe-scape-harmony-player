-- Add picovoice_access_key column to profiles table for user-specific wake word configuration
ALTER TABLE public.profiles 
ADD COLUMN picovoice_access_key TEXT;

-- Add RLS policy to allow users to update their own access key
CREATE POLICY "Users can update their own picovoice key"
ON public.profiles
FOR UPDATE
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);