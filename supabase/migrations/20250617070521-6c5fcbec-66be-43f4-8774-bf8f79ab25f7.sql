
-- Create a table for emotion-based playlists
CREATE TABLE public.emotion_playlists (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users NOT NULL,
  emotion VARCHAR(50) NOT NULL,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, emotion)
);

-- Add Row Level Security (RLS)
ALTER TABLE public.emotion_playlists ENABLE ROW LEVEL SECURITY;

-- Create policies for emotion playlists
CREATE POLICY "Users can view their own emotion playlists" 
  ON public.emotion_playlists 
  FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own emotion playlists" 
  ON public.emotion_playlists 
  FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own emotion playlists" 
  ON public.emotion_playlists 
  FOR UPDATE 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own emotion playlists" 
  ON public.emotion_playlists 
  FOR DELETE 
  USING (auth.uid() = user_id);

-- Create a table for emotion playlist songs
CREATE TABLE public.emotion_playlist_songs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  emotion_playlist_id UUID REFERENCES public.emotion_playlists(id) ON DELETE CASCADE NOT NULL,
  song_id VARCHAR(255) NOT NULL,
  title VARCHAR(500) NOT NULL,
  artist VARCHAR(500) NOT NULL,
  thumbnail TEXT,
  url TEXT NOT NULL,
  position INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Add Row Level Security (RLS) for emotion playlist songs
ALTER TABLE public.emotion_playlist_songs ENABLE ROW LEVEL SECURITY;

-- Create policies for emotion playlist songs
CREATE POLICY "Users can view songs in their emotion playlists" 
  ON public.emotion_playlist_songs 
  FOR SELECT 
  USING (
    EXISTS (
      SELECT 1 FROM public.emotion_playlists ep 
      WHERE ep.id = emotion_playlist_id AND ep.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can add songs to their emotion playlists" 
  ON public.emotion_playlist_songs 
  FOR INSERT 
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.emotion_playlists ep 
      WHERE ep.id = emotion_playlist_id AND ep.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update songs in their emotion playlists" 
  ON public.emotion_playlist_songs 
  FOR UPDATE 
  USING (
    EXISTS (
      SELECT 1 FROM public.emotion_playlists ep 
      WHERE ep.id = emotion_playlist_id AND ep.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete songs from their emotion playlists" 
  ON public.emotion_playlist_songs 
  FOR DELETE 
  USING (
    EXISTS (
      SELECT 1 FROM public.emotion_playlists ep 
      WHERE ep.id = emotion_playlist_id AND ep.user_id = auth.uid()
    )
  );

-- Function to automatically create emotion playlists for new users
CREATE OR REPLACE FUNCTION create_default_emotion_playlists()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.emotion_playlists (user_id, emotion, name, description) VALUES
    (NEW.id, 'happy', 'Happy Songs', 'Uplifting and joyful music'),
    (NEW.id, 'sad', 'Sad Songs', 'Melancholic and emotional music'),
    (NEW.id, 'angry', 'Angry Songs', 'Intense and powerful music'),
    (NEW.id, 'fear', 'Fearful Songs', 'Dark and suspenseful music'),
    (NEW.id, 'surprise', 'Surprise Songs', 'Unexpected and exciting music'),
    (NEW.id, 'disgust', 'Disgusted Songs', 'Alternative and rebellious music'),
    (NEW.id, 'neutral', 'Neutral Songs', 'Calm and balanced music');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger to automatically create emotion playlists for new users
CREATE TRIGGER create_emotion_playlists_trigger
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION create_default_emotion_playlists();
