import React, { useEffect, useState } from 'react';
import { createClient } from '@supabase/supabase-js';

// Replace with your Supabase info
const supabase = createClient('https://<your-project>.supabase.co', '<anon-key>');

function EmotionPlaylists() {
  const [playlists, setPlaylists] = useState([]);

  useEffect(() => {
    const fetchPlaylists = async () => {
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        alert("Please login first");
        return;
      }

      const { data, error } = await supabase
        .from('emotion_playlists')
        .select('*')
        .eq('user_id', user.id);

      if (error) {
        console.error("Error fetching playlists:", error);
      } else {
        setPlaylists(data);
      }
    };

    fetchPlaylists();
  }, []);

  return (
    <div>
      <h2>🎧 Your Emotion Playlists</h2>
      {playlists.length === 0 ? (
        <p>No playlists found.</p>
      ) : (
        playlists.map((playlist) => (
          <div key={playlist.id}>
            <h4>🎵 {playlist.emotion}</h4>
          </div>
        ))
      )}
    </div>
  );
}

export default EmotionPlaylists;