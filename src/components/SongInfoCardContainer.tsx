import React, { useState, useEffect } from 'react';
import { AnimatePresence } from 'framer-motion';
import { SongInfoCard } from './SongInfoCard';

/**
 * SongInfoCardContainer - Listens for song info events and displays the card
 */
export const SongInfoCardContainer: React.FC = () => {
  const [songInfo, setSongInfo] = useState<string | null>(null);

  useEffect(() => {
    const handleSongInfo = (event: Event) => {
      const customEvent = event as CustomEvent<{ info: string }>;
      console.log('[SongInfoCardContainer] Received song info:', customEvent.detail);
      setSongInfo(customEvent.detail.info);

      // Auto-dismiss after 10 seconds
      setTimeout(() => {
        setSongInfo(null);
      }, 10000);
    };

    window.addEventListener('vibescape:song-info', handleSongInfo);

    return () => {
      window.removeEventListener('vibescape:song-info', handleSongInfo);
    };
  }, []);

  const handleClose = () => {
    setSongInfo(null);
  };

  return (
    <AnimatePresence>
      {songInfo && (
        <SongInfoCard info={songInfo} onClose={handleClose} />
      )}
    </AnimatePresence>
  );
};
