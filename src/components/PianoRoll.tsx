
import React, { useState, useEffect, useRef } from 'react';
import { useAudio } from '@/context/AudioContext';
import { midiToNoteName } from '@/utils/audioAnalysis';

const NUM_OCTAVES = 4;
const STARTING_OCTAVE = 3;
const NOTES_PER_OCTAVE = 12;
const NOTE_HEIGHT = 24;

const PIANO_WIDTH = 80;
const NOTE_NAMES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
const WHITE_KEYS = [0, 2, 4, 5, 7, 9, 11];
const BLACK_KEYS = [1, 3, 6, 8, 10];

const PianoRoll: React.FC = () => {
  const { detectedNotes, isPlaying, isProcessing } = useAudio();
  const [activeNotes, setActiveNotes] = useState<{ [key: number]: boolean }>({});
  const [playheadPosition, setPlayheadPosition] = useState(0);
  const [containerWidth, setContainerWidth] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const totalNotes = NUM_OCTAVES * NOTES_PER_OCTAVE;
  const animationRef = useRef<number>();

  // Get container width on mount
  useEffect(() => {
    if (containerRef.current) {
      setContainerWidth(containerRef.current.clientWidth - PIANO_WIDTH);
    }

    const handleResize = () => {
      if (containerRef.current) {
        setContainerWidth(containerRef.current.clientWidth - PIANO_WIDTH);
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Handle playback and playhead movement
  useEffect(() => {
    if (!isPlaying) {
      setPlayheadPosition(0);
      setActiveNotes({});
      return;
    }

    let startTime = performance.now();
    const duration = detectedNotes.length > 0
      ? Math.max(...detectedNotes.map(note => note.startTime + note.duration))
      : 0;

    const animate = (time: number) => {
      const elapsed = (time - startTime) / 1000;

      // Update playhead position
      if (containerWidth > 0 && duration > 0) {
        const position = (elapsed / duration) * containerWidth;
        setPlayheadPosition(position);
      }

      // Update active notes
      const currentActiveNotes: { [key: number]: boolean } = {};
      detectedNotes.forEach(note => {
        if (elapsed >= note.startTime && elapsed <= note.startTime + note.duration) {
          currentActiveNotes[note.midiNumber] = true;
        }
      });
      setActiveNotes(currentActiveNotes);

      // Continue animation if still playing and not at the end
      if (elapsed < duration) {
        animationRef.current = requestAnimationFrame(animate);
      } else {
        setPlayheadPosition(0);
        setActiveNotes({});
      }
    };

    animationRef.current = requestAnimationFrame(animate);

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [isPlaying, detectedNotes, containerWidth]);

  // Render the piano roll
  const renderPianoKeys = () => {
    const keys = [];

    for (let octave = STARTING_OCTAVE + NUM_OCTAVES - 1; octave >= STARTING_OCTAVE; octave--) {
      for (let i = NOTES_PER_OCTAVE - 1; i >= 0; i--) {
        const isWhiteKey = WHITE_KEYS.includes(i);
        const noteName = NOTE_NAMES[i];
        const midiNumber = (octave + 1) * 12 + i;

        keys.push(
          <div
            key={`${octave}-${i}`}
            className={`piano-key ${isWhiteKey ? 'white' : 'black'} ${
              activeNotes[midiNumber] ? 'active' : ''
            }`}
            style={{
              height: `${NOTE_HEIGHT}px`,
              width: isWhiteKey ? '100%' : '60%',
            }}
          >
            {isWhiteKey && i === 0 && (
              <span className="text-xs text-slate-400 absolute left-2 bottom-1">
                C{octave}
              </span>
            )}
          </div>
        );
      }
    }

    return keys;
  };

  // Render the grid and notes
  const renderNoteGrid = () => {
    return (
      <div className="relative h-full w-full">
        {/* Grid background */}
        <div
          className="absolute top-0 left-0 w-full h-full piano-roll-grid border-slate-200"
          style={{
            backgroundSize: `24px ${NOTE_HEIGHT}px`,
          }}
        />

        {/* Notes */}
        {detectedNotes.map((note, index) => {
          const totalHeight = totalNotes * NOTE_HEIGHT;
          const notePosition = totalHeight - ((note.midiNumber - (STARTING_OCTAVE + 1) * 12) * NOTE_HEIGHT);

          // Calculate note width and position
          const startPosition = (note.startTime / (detectedNotes.length > 0
            ? Math.max(...detectedNotes.map(n => n.startTime + n.duration))
            : 1)) * containerWidth;

          const noteWidth = (note.duration / (detectedNotes.length > 0
            ? Math.max(...detectedNotes.map(n => n.startTime + n.duration))
            : 1)) * containerWidth;

          return (
            <div
              key={index}
              className="absolute bg-blue-500/80 rounded-sm border border-blue-600"
              style={{
                top: `${notePosition}px`,
                left: `${startPosition}px`,
                width: `${noteWidth}px`,
                height: `${NOTE_HEIGHT - 1}px`,
                transition: 'all 0.2s ease',
              }}
            >
              <span className="text-xs text-white px-1 truncate">
                {midiToNoteName(note.midiNumber)}
              </span>
            </div>
          );
        })}

        {/* Playhead */}
        {isPlaying && (
          <div
            className="playhead"
            style={{
              transform: `translateX(${playheadPosition}px)`,
            }}
          />
        )}
      </div>
    );
  };

  return (
    <div
      ref={containerRef}
      className="w-full bg-white rounded-xl shadow-sm overflow-hidden relative animate-fade-in"
      style={{ height: `${totalNotes * NOTE_HEIGHT}px`, maxHeight: '400px' }}
    >
      {isProcessing ? (
        <div className="absolute inset-0 flex items-center justify-center bg-white/80 backdrop-blur z-10">
          <div className="flex flex-col items-center">
            <div className="h-8 w-8 border-4 border-primary border-t-transparent rounded-full animate-spin-slow mb-2"></div>
            <p className="text-sm font-medium">Analyzing audio...</p>
          </div>
        </div>
      ) : null}

      <div className="flex h-full">
        {/* Piano keyboard */}
        <div
          className="w-20 h-full flex flex-col border-r border-slate-200 bg-white overflow-hidden"
          style={{ flexShrink: 0 }}
        >
          {renderPianoKeys()}
        </div>

        {/* Note grid area */}
        <div className="flex-1 h-full overflow-auto">
          {renderNoteGrid()}
        </div>
      </div>
    </div>
  );
};

export default PianoRoll;
