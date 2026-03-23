import { useEffect, useRef, useState } from 'react';

export function useAudioVisualizer(isActive: boolean) {
  const [levels, setLevels] = useState<number[]>([]);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const dataArrayRef = useRef<Uint8Array | any>(null);
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    if (!isActive) return;

    let audioContext: AudioContext;
    let source: MediaStreamAudioSourceNode;

    async function setup() {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });

      audioContext = new AudioContext();
      analyserRef.current = audioContext.createAnalyser();
      analyserRef.current.fftSize = 64;

      dataArrayRef.current = new Uint8Array(
        analyserRef.current.frequencyBinCount
      );

      source = audioContext.createMediaStreamSource(stream);
      source.connect(analyserRef.current);

      tick();
    }

    function tick() {
      if (!analyserRef.current || !dataArrayRef.current) return;

      analyserRef.current.getByteFrequencyData(dataArrayRef.current);

      const sliced = Array.from(dataArrayRef.current).slice(0, 12);
      setLevels(sliced as number[]);

      rafRef.current = requestAnimationFrame(tick);
    }

    setup();

    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      analyserRef.current?.disconnect();
      audioContext?.close();
    };
  }, [isActive]);

  return levels;
}
