import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { detectPitch, midiToNoteName } from '@/utils/audioAnalysis';

// Define the shape of our audio state
interface AudioContextType {
  isRecording: boolean;
  startRecording: () => void;
  stopRecording: () => void;
  audioBlob: Blob | null;
  audioURL: string | null;
  isPlaying: boolean;
  togglePlayback: () => void;
  detectedNotes: Note[];
  clearRecording: () => void;
  isProcessing: boolean;
}

export interface Note {
  midiNumber: number;
  name: string;
  frequency: number;
  startTime: number;
  duration: number;
  velocity: number;
}

// Create the audio context with initial values
const AudioContext = createContext<AudioContextType | undefined>(undefined);

// Provider component
export const AudioProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null);
  const [audioChunks, setAudioChunks] = useState<Blob[]>([]);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [audioURL, setAudioURL] = useState<string | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [detectedNotes, setDetectedNotes] = useState<Note[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [audioContext, setAudioContext] = useState<AudioContext | null>(null);
  const [analyser, setAnalyser] = useState<AnalyserNode | null>(null);

  // Initialize audio context when component mounts
  useEffect(() => {
    const context = new (window.AudioContext || (window as any).webkitAudioContext)();
    setAudioContext(context);

    const analyserNode = context.createAnalyser();
    analyserNode.fftSize = 2048;
    setAnalyser(analyserNode);

    return () => {
      if (audioContext) {
        audioContext.close();
      }
      if (audioURL) {
        URL.revokeObjectURL(audioURL);
      }
    };
  }, []);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream, {
        mimeType: 'audio/webm;codecs=opus',
        audioBitsPerSecond: 128000
      });

      setAudioChunks([]);
      setMediaRecorder(recorder);

      recorder.ondataavailable = (e) => {
        setAudioChunks((chunks) => [...chunks, e.data]);
      };

      recorder.onstop = async () => {
        // Use the current state from the setter function to ensure you have the latest chunks
        setAudioChunks(currentChunks => {
          // Add before creating the blob
          if (currentChunks.length === 0) {
            console.error('No audio data captured');
            setIsProcessing(false);
            return currentChunks;
          }

          const blob = new Blob(currentChunks, { type: 'audio/webm; codecs=opus' });
          const url = URL.createObjectURL(blob);

          // Clean up any previous URL to prevent memory leaks
          if (audioURL) {
            URL.revokeObjectURL(audioURL);
          }

          setAudioBlob(blob);
          setAudioURL(url);

          // Process the audio to detect notes
          setIsProcessing(true);

          try {
            // Rest of your processing code...
            setTimeout(() => {
              // Your demo notes code...
              const demoNotes: Note[] = [
                { midiNumber: 60, name: 'C4', frequency: 261.63, startTime: 0, duration: 0.5, velocity: 80 },
                { midiNumber: 62, name: 'D4', frequency: 293.66, startTime: 0.5, duration: 0.5, velocity: 80 },
                { midiNumber: 64, name: 'E4', frequency: 329.63, startTime: 1.0, duration: 0.5, velocity: 80 },
                { midiNumber: 65, name: 'F4', frequency: 349.23, startTime: 1.5, duration: 0.5, velocity: 80 },
                { midiNumber: 67, name: 'G4', frequency: 392.00, startTime: 2.0, duration: 0.5, velocity: 80 },
                { midiNumber: 69, name: 'A4', frequency: 440.00, startTime: 2.5, duration: 0.5, velocity: 80 },
                { midiNumber: 71, name: 'B4', frequency: 493.88, startTime: 3.0, duration: 0.5, velocity: 80 },
                { midiNumber: 72, name: 'C5', frequency: 523.25, startTime: 3.5, duration: 1.0, velocity: 80 },
              ];
              setDetectedNotes(demoNotes);
              setIsProcessing(false);
            }, 1500);
          } catch (error) {
            console.error('Error analyzing audio:', error);
            setIsProcessing(false);
          }

          return currentChunks;
        });
      };

      recorder.start();
      setIsRecording(true);
    } catch (error) {
      console.error('Error starting recording:', error);
    }
  };

  const stopRecording = () => {
    if (mediaRecorder && isRecording) {
      mediaRecorder.stop();
      setIsRecording(false);

      // Stop all audio tracks
      mediaRecorder.stream.getTracks().forEach(track => track.stop());
    }
  };

  const togglePlayback = () => {
    setIsPlaying(!isPlaying);
  };

  const clearRecording = () => {
    setAudioBlob(null);
    setAudioURL(null);
    setDetectedNotes([]);
    setAudioChunks([]);
  };

  const value = {
    isRecording,
    startRecording,
    stopRecording,
    audioBlob,
    audioURL,
    isPlaying,
    togglePlayback,
    detectedNotes,
    clearRecording,
    isProcessing,
  };

  return <AudioContext.Provider value={value}>{children}</AudioContext.Provider>;
};

// Custom hook for using the audio context
export const useAudio = () => {
  const context = useContext(AudioContext);
  if (context === undefined) {
    throw new Error('useAudio must be used within an AudioProvider');
  }
  return context;
};
