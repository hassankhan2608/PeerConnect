import { useEffect, useRef } from 'react';

interface RingtoneProps {
  play: boolean;
  onEnd?: () => void;
}

export function Ringtone({ play, onEnd }: RingtoneProps) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  
  useEffect(() => {
    if (!audioRef.current) {
      audioRef.current = new Audio('/ringtone.mp3');
      audioRef.current.loop = true;
    }

    if (play) {
      const playPromise = audioRef.current.play();
      if (playPromise !== undefined) {
        playPromise.catch(error => {
          console.error('Playback failed:', error);
        });
      }

      // Stop after 30 seconds
      const timeout = setTimeout(() => {
        if (audioRef.current) {
          audioRef.current.pause();
          audioRef.current.currentTime = 0;
        }
        onEnd?.();
      }, 30000);

      return () => {
        clearTimeout(timeout);
        if (audioRef.current) {
          audioRef.current.pause();
          audioRef.current.currentTime = 0;
        }
      };
    } else {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.currentTime = 0;
      }
    }
  }, [play, onEnd]);

  return null;
}