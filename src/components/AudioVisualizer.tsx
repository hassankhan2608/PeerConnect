import { useEffect, useRef } from 'react';
import { cn } from '@/lib/utils';

interface AudioVisualizerProps {
  stream: MediaStream | null;
  className?: string;
}

export function AudioVisualizer({ stream, className }: AudioVisualizerProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>();
  const analyserRef = useRef<AnalyserNode>();

  useEffect(() => {
    if (!stream || !canvasRef.current) return;

    const audioContext = new AudioContext();
    const source = audioContext.createMediaStreamSource(stream);
    const analyser = audioContext.createAnalyser();
    analyserRef.current = analyser;

    analyser.fftSize = 32; // Reduced for minimal bars
    source.connect(analyser);

    const bufferLength = analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d')!;

    const draw = () => {
      if (!canvas || !analyser) return;

      const WIDTH = canvas.width;
      const HEIGHT = canvas.height;
      
      analyser.getByteFrequencyData(dataArray);
      
      ctx.clearRect(0, 0, WIDTH, HEIGHT);
      
      // Calculate average volume for smooth animation
      const average = dataArray.reduce((a, b) => a + b) / bufferLength;
      const normalizedHeight = (average / 255) * HEIGHT;
      
      // Draw a single, smooth bar
      const gradient = ctx.createLinearGradient(0, HEIGHT, 0, HEIGHT - normalizedHeight);
      gradient.addColorStop(0, '#00a884');
      gradient.addColorStop(1, '#00d1a1');
      
      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.moveTo(0, HEIGHT);
      ctx.lineTo(0, HEIGHT - normalizedHeight);
      ctx.quadraticCurveTo(WIDTH/2, HEIGHT - normalizedHeight - 5, WIDTH, HEIGHT - normalizedHeight);
      ctx.lineTo(WIDTH, HEIGHT);
      ctx.fill();
      
      animationRef.current = requestAnimationFrame(draw);
    };

    draw();

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
      audioContext.close();
    };
  }, [stream]);

  return (
    <canvas 
      ref={canvasRef} 
      width={100} 
      height={24} 
      className={cn("rounded-full", className)}
    />
  );
}