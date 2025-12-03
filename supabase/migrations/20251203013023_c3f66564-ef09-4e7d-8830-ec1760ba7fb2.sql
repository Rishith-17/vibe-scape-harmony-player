-- Create enum for key status
CREATE TYPE public.youtube_key_status AS ENUM ('enabled', 'temporarily_disabled', 'disabled');

-- Create youtube_keys table for storing multiple API keys
CREATE TABLE public.youtube_keys (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key_name TEXT NOT NULL UNIQUE,
  api_key TEXT NOT NULL,
  priority INTEGER NOT NULL DEFAULT 0,
  status youtube_key_status NOT NULL DEFAULT 'enabled',
  last_error TEXT,
  last_error_at TIMESTAMP WITH TIME ZONE,
  failure_count INTEGER NOT NULL DEFAULT 0,
  cooldown_until TIMESTAMP WITH TIME ZONE,
  total_requests INTEGER NOT NULL DEFAULT 0,
  total_failures INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create youtube_logs table for request logging
CREATE TABLE public.youtube_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key_id UUID REFERENCES public.youtube_keys(id) ON DELETE SET NULL,
  key_name TEXT,
  endpoint TEXT NOT NULL,
  params JSONB,
  status_code INTEGER,
  response_time_ms INTEGER,
  error_code TEXT,
  error_message TEXT,
  success BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on both tables
ALTER TABLE public.youtube_keys ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.youtube_logs ENABLE ROW LEVEL SECURITY;

-- RLS policies - only service role can access (for edge functions)
CREATE POLICY "Service role can manage youtube_keys"
ON public.youtube_keys
FOR ALL
USING (auth.role() = 'service_role')
WITH CHECK (auth.role() = 'service_role');

CREATE POLICY "Service role can manage youtube_logs"
ON public.youtube_logs
FOR ALL
USING (auth.role() = 'service_role')
WITH CHECK (auth.role() = 'service_role');

-- Create indexes for performance
CREATE INDEX idx_youtube_keys_status_priority ON public.youtube_keys(status, priority DESC);
CREATE INDEX idx_youtube_logs_created_at ON public.youtube_logs(created_at DESC);
CREATE INDEX idx_youtube_logs_key_id ON public.youtube_logs(key_id);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_youtube_keys_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for updated_at
CREATE TRIGGER update_youtube_keys_timestamp
BEFORE UPDATE ON public.youtube_keys
FOR EACH ROW
EXECUTE FUNCTION public.update_youtube_keys_updated_at();