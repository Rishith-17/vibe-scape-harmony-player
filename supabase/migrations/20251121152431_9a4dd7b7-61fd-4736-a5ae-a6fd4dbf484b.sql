-- Remove user-specific picovoice_access_key from profiles (moving to system-wide secrets)
ALTER TABLE public.profiles DROP COLUMN IF EXISTS picovoice_access_key;

-- Remove the user-specific RLS policy
DROP POLICY IF EXISTS "Users can update their own picovoice key" ON public.profiles;

-- Insert system-wide Picovoice access key into secrets table
INSERT INTO public.secrets (key, value)
VALUES ('PICOVOICE_ACCESS_KEY', 'eZCwVbX9UXDTfSxG0e82Lefc1691H9yosKE37LwwsRhfUjjg3T3odg==')
ON CONFLICT (key) DO UPDATE SET 
  value = EXCLUDED.value,
  created_at = NOW();

-- Note: secrets table should have strict RLS preventing client access
-- Only edge functions with SERVICE_ROLE key can read from secrets table