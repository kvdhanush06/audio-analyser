
import React, { useEffect, useRef, useState } from 'react';
import { useAudio } from '@/context/AudioContext';

const AudioVisualizer: React.FC = () => {
  const { isRecording, audioURL, isPlaying } = useAudio();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [audioContext, setAudioContext] = useState<AudioContext | null>(null);
  const [analyser, setAnalyser] = useState<AnalyserNode | null>(null);
  const [dataArray, setDataArray] = useState<Uint8Array | null>(null);
  const [source, setSource] = useState<MediaStreamAudioSourceNode | null>(null);
  const animationRef = useRef<number>();

  // Initialize audio context and analyser
  useEffect(() => {
    const context = new (window.AudioContext || (window as any).webkitAudioContext)();
    const analyserNode = context.createAnalyser();
    analyserNode.fftSize = 256;

    const bufferLength = analyserNode.frequencyBinCount;
    const dataArr = new Uint8Array(bufferLength);

    setAudioContext(context);
    setAnalyser(analyserNode);
    setDataArray(dataArr);

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
      if (context.state !== 'closed') {
        context.close();
      }
    };
  }, []);

  // Set up audio source when recording starts
  useEffect(() => {
    if (!isRecording || !audioContext || !analyser) return;

    const setupMicrophone = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        const micSource = audioContext.createMediaStreamSource(stream);
        micSource.connect(analyser);
        setSource(micSource);
      } catch (error) {
        console.error('Error accessing microphone:', error);
      }
    };

    setupMicrophone();

    return () => {
      if (source) {
        source.disconnect();
        setSource(null);
      }
    };
  }, [isRecording, audioContext, analyser]);

  // Set up audio playback visualization
  useEffect(() => {
    if (!audioURL || !audioContext || !analyser || !isPlaying) return;

    const audio = new Audio(audioURL);
    audio.crossOrigin = 'anonymous';

    const audioSource = audioContext.createMediaElementSource(audio);
    audioSource.connect(analyser);
    analyser.connect(audioContext.destination);

    audio.play();

    return () => {
      audio.pause();
      audioSource.disconnect();
    };
  }, [audioURL, audioContext, analyser, isPlaying]);

  // Draw visualization
  useEffect(() => {
    if (!analyser || !dataArray || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const canvasContext = canvas.getContext('2d');
    if (!canvasContext) return;

    const width = canvas.width;
    const height = canvas.height;
    const barWidth = width / dataArray.length;

    const renderFrame = () => {
      animationRef.current = requestAnimationFrame(renderFrame);

      analyser.getByteFrequencyData(dataArray);

      canvasContext.clearRect(0, 0, width, height);
      canvasContext.fillStyle = 'rgba(0, 0, 0, 0)';
      canvasContext.fillRect(0, 0, width, height);

      for (let i = 0; i < dataArray.length; i++) {
        const barHeight = (dataArray[i] / 255) * height;

        // Fixed the gradient color format to use standard CSS colors instead of Tailwind's HSL variables
        const gradient = canvasContext.createLinearGradient(0, height, 0, height - barHeight);
        gradient.addColorStop(0, 'rgba(59, 130, 246, 0.8)');
        gradient.addColorStop(1, 'rgba(59, 130, 246, 0.4)');

        canvasContext.fillStyle = gradient;
        canvasContext.fillRect(i * barWidth, height - barHeight, barWidth - 1, barHeight);
      }
    };

    renderFrame();

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [analyser, dataArray, isRecording, isPlaying]);

  return (
    <div className="w-full h-32 rounded-lg overflow-hidden bg-secondary/50 backdrop-blur">
      <canvas
        ref={canvasRef}
        width={500}
        height={128}
        className="w-full h-full"
      />
    </div>
  );
};

export default AudioVisualizer;
