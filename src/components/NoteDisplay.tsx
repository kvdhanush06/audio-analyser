
import React from 'react';
import { useAudio } from '@/context/AudioContext';

const NoteDisplay: React.FC = () => {
  const { detectedNotes } = useAudio();
  
  const uniqueNotes = [...new Set(detectedNotes.map(note => note.name))].sort();
  
  return (
    <div className="w-full">
      <h3 className="text-sm font-medium mb-2 text-muted-foreground">Detected Notes</h3>
      
      <div className="flex flex-wrap gap-2">
        {uniqueNotes.length > 0 ? (
          uniqueNotes.map((noteName) => (
            <div
              key={noteName}
              className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium animate-scale-in"
            >
              {noteName}
            </div>
          ))
        ) : (
          <p className="text-sm text-muted-foreground">No notes detected yet. Record some audio to see the notes.</p>
        )}
      </div>
    </div>
  );
};

export default NoteDisplay;
