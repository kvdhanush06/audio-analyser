
// Minimal MIDI file export functionality
export interface Note {
  midiNumber: number;
  startTime: number;
  duration: number;
  velocity: number;
}

// Helper function to convert a number to variable length bytes
const numberToVariableLength = (value: number): number[] => {
  const bytes = [];
  let v = value;

  if (v === 0) return [0];

  while (v > 0) {
    let b = v & 0x7F;
    v >>= 7;
    if (v > 0) b |= 0x80;
    bytes.push(b);
  }

  return bytes.reverse();
};

// Convert a number to a two-byte array
const numberToBytes = (value: number, byteCount: number): number[] => {
  const bytes = [];
  for (let i = 0; i < byteCount; i++) {
    bytes.unshift(value & 0xFF);
    value >>= 8;
  }
  return bytes;
};

// Create a MIDI file from notes
export const createMidiFile = (notes: Note[]): Blob => {
  // Sort notes by start time
  const sortedNotes = [...notes].sort((a, b) => a.startTime - b.startTime);

  // MIDI file structure
  const headerChunk = [
    0x4D, 0x54, 0x68, 0x64, // "MThd"
    0x00, 0x00, 0x00, 0x06, // Chunk length (6 bytes)
    0x00, 0x01, // Format type (1 - multiple tracks)
    0x00, 0x02, // Number of tracks (2 - header + one data track)
    0x01, 0x80, // Division (ticks per quarter note = 384)
  ];

  // Track chunk header
  const trackChunkHeader = [
    0x4D, 0x54, 0x72, 0x6B, // "MTrk"
    0x00, 0x00, 0x00, 0x00, // Placeholder for track length
  ];

  // Track events
  const events = [];

  // Add tempo event (120 BPM)
  events.push(
    0x00, // Delta time
    0xFF, 0x51, 0x03, // Meta event - tempo
    0x07, 0xA1, 0x20 // Tempo value (500,000 microseconds per quarter note)
  );

  // Track name event
  const trackName = "Extracted Notes";
  events.push(
    0x00, // Delta time
    0xFF, 0x03, trackName.length, // Meta event - track name
    ...trackName.split('').map(c => c.charCodeAt(0)) // Track name as bytes
  );

  // Instrument name event (Piano)
  const instrumentName = "Acoustic Grand Piano";
  events.push(
    0x00, // Delta time
    0xFF, 0x04, instrumentName.length, // Meta event - instrument name
    ...instrumentName.split('').map(c => c.charCodeAt(0)) // Instrument name as bytes
  );

  // Program change to Piano (instrument 0)
  events.push(
    0x00, // Delta time
    0xC0, 0x00 // Program change to Grand Piano
  );

  // Convert seconds to ticks (assuming 384 ticks per quarter note at 120 BPM)
  const secondsToTicks = (seconds: number): number => {
    // At 120 BPM, one quarter note = 0.5 seconds
    // We have 384 ticks per quarter note
    // So 1 second = 384 * 2 = 768 ticks
    return Math.round(seconds * 768);
  };

  // Note events (note on and note off)
  let lastEventTime = 0;

  // Note On events
  sortedNotes.forEach(note => {
    const tickTime = secondsToTicks(note.startTime);
    const deltaTime = tickTime - lastEventTime;
    lastEventTime = tickTime;

    // Note On event
    events.push(
      ...numberToVariableLength(deltaTime), // Delta time
      0x90, // Note on, channel 1
      note.midiNumber, // Note number
      note.velocity // Velocity
    );
  });

  // Note Off events
  sortedNotes.forEach(note => {
    const tickTime = secondsToTicks(note.startTime + note.duration);
    const deltaTime = tickTime - lastEventTime;
    lastEventTime = tickTime;

    // Note Off event
    events.push(
      ...numberToVariableLength(deltaTime), // Delta time
      0x80, // Note off, channel 1
      note.midiNumber, // Note number
      0x00 // Release velocity
    );
  });

  // End of track event
  events.push(
    0x00, // Delta time
    0xFF, 0x2F, 0x00 // End of track
  );

  // Set the track length
  const trackLength = events.length;
  trackChunkHeader[4] = (trackLength >> 24) & 0xFF;
  trackChunkHeader[5] = (trackLength >> 16) & 0xFF;
  trackChunkHeader[6] = (trackLength >> 8) & 0xFF;
  trackChunkHeader[7] = trackLength & 0xFF;

  // Combine all parts
  const midiData = new Uint8Array([...headerChunk, ...trackChunkHeader, ...events]);

  // Create a blob from the data
  return new Blob([midiData], { type: 'audio/midi' });
};

// Download MIDI file
export const downloadMidiFile = (notes: Note[], filename = 'extracted_notes.midi'): void => {
  const midiBlob = createMidiFile(notes);
  const url = URL.createObjectURL(midiBlob);

  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();

  URL.revokeObjectURL(url);
};
