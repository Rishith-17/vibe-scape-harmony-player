-- Create emotion_logs table for analytics
CREATE TABLE public.emotion_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  emotion TEXT NOT NULL,
  confidence NUMERIC(4, 3) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  source TEXT DEFAULT 'voice' -- 'voice', 'manual', etc.
);

-- Enable Row Level Security
ALTER TABLE public.emotion_logs ENABLE ROW LEVEL SECURITY;

-- Create policies for user access
CREATE POLICY "Users can view their own emotion logs" 
ON public.emotion_logs 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own emotion logs" 
ON public.emotion_logs 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- Create index for efficient queries
CREATE INDEX idx_emotion_logs_user_id ON public.emotion_logs(user_id);
CREATE INDEX idx_emotion_logs_created_at ON public.emotion_logs(created_at DESC);