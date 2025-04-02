
import React, { useState, useEffect } from 'react';
import { Mic, Square, Play, Download, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAudio } from '@/context/AudioContext';
import { downloadMidiFile } from '@/utils/midiExport';

const AudioRecorder: React.FC = () => {
  const {
    isRecording,
    startRecording,
    stopRecording,
    audioURL,
    isPlaying,
    togglePlayback,
    detectedNotes,
    clearRecording,
    isProcessing
  } = useAudio();

  const [audio, setAudio] = useState<HTMLAudioElement | null>(null);
  const [buttonRipple, setButtonRipple] = useState<{ x: number, y: number } | null>(null);

  // Initialize audio element when audio URL changes
  useEffect(() => {
    if (audioURL) {
      const audioElement = new Audio(audioURL);
      setAudio(audioElement);

      return () => {
        audioElement.pause();
        audioElement.src = '';
      };
    }
  }, [audioURL]);

  // Handle audio playback
  useEffect(() => {
    if (audio) {
      if (isPlaying) {
        audio.play();
      } else {
        audio.pause();
        audio.currentTime = 0;
      }

      const handleEnded = () => {
        togglePlayback();
      };

      audio.addEventListener('ended', handleEnded);

      return () => {
        audio.removeEventListener('ended', handleEnded);
      };
    }
  }, [audio, isPlaying, togglePlayback]);

  // Handle button ripple effect
  const handleButtonRipple = (e: React.MouseEvent<HTMLButtonElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    setButtonRipple({ x, y });

    // Remove ripple after animation finishes
    setTimeout(() => {
      setButtonRipple(null);
    }, 600);
  };

  const handleExportMidi = () => {
    if (detectedNotes.length > 0) {
      downloadMidiFile(detectedNotes);
    }
  };

  return (
    <div className="w-full flex flex-col items-center animate-fade-in">
      <div className="w-full max-w-3xl bg-white rounded-xl shadow-sm p-6 mb-4">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex-1">
            <h2 className="text-lg font-medium mb-1">Audio Recorder</h2>
            <p className="text-sm text-muted-foreground">
              {isRecording
                ? 'Recording in progress...'
                : audioURL
                  ? 'Recording complete. You can now play or download.'
                  : 'Record audio to detect musical notes.'}
            </p>
          </div>

          <div className="flex items-center gap-2">
            {audioURL ? (
              <>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    togglePlayback();
                    handleButtonRipple;
                  }}
                  disabled={isProcessing}
                  className="relative overflow-hidden"
                >
                  {isPlaying ? 'Pause' : 'Play'}
                  {isPlaying ? <Square className="ml-2 h-4 w-4" /> : <Play className="ml-2 h-4 w-4" />}
                  {buttonRipple && (
                    <span
                      className="ripple absolute"
                      style={{
                        left: buttonRipple.x + 'px',
                        top: buttonRipple.y + 'px',
                        width: '100px',
                        height: '100px',
                        marginLeft: '-50px',
                        marginTop: '-50px'
                      }}
                    />
                  )}
                </Button>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleExportMidi}
                  disabled={isProcessing || detectedNotes.length === 0}
                  className="relative overflow-hidden"
                >
                  Export MIDI
                  <Download className="ml-2 h-4 w-4" />
                </Button>

                <Button
                  variant="ghost"
                  size="sm"
                  onClick={clearRecording}
                  disabled={isProcessing}
                  className="relative overflow-hidden"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </>
            ) : (
              <Button
                variant={isRecording ? "destructive" : "default"}
                size="sm"
                onClick={isRecording ? stopRecording : startRecording}
                className="relative overflow-hidden group"
              >
                {isRecording ? (
                  <>
                    <div className="recording-indicator"></div>
                    Stop Recording
                    <Square className="ml-2 h-4 w-4" />
                  </>
                ) : (
                  <>
                    Start Recording
                    <Mic className="ml-2 h-4 w-4" />
                  </>
                )}
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AudioRecorder;
