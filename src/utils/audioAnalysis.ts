
// Define notes with their frequencies and MIDI numbers
const NOTES = [
  { name: 'C', frequency: 261.63, midiNumber: 60 },
  { name: 'C#', frequency: 277.18, midiNumber: 61 },
  { name: 'D', frequency: 293.66, midiNumber: 62 },
  { name: 'D#', frequency: 311.13, midiNumber: 63 },
  { name: 'E', frequency: 329.63, midiNumber: 64 },
  { name: 'F', frequency: 349.23, midiNumber: 65 },
  { name: 'F#', frequency: 369.99, midiNumber: 66 },
  { name: 'G', frequency: 392.00, midiNumber: 67 },
  { name: 'G#', frequency: 415.30, midiNumber: 68 },
  { name: 'A', frequency: 440.00, midiNumber: 69 },
  { name: 'A#', frequency: 466.16, midiNumber: 70 },
  { name: 'B', frequency: 493.88, midiNumber: 71 },
];

// Calculate the midi number for any frequency
const frequencyToMidiNumber = (frequency: number): number => {
  return Math.round(12 * Math.log2(frequency / 440.0) + 69);
};

// Convert a MIDI number to a note name (e.g., 60 -> "C4")
export const midiToNoteName = (midiNumber: number): string => {
  const octave = Math.floor(midiNumber / 12) - 1;
  const noteIndex = midiNumber % 12;
  const noteName = NOTES[noteIndex]?.name || 'C';
  return `${noteName}${octave}`;
};

// Convert MIDI number to frequency
export const midiToFrequency = (midiNumber: number): number => {
  return 440 * Math.pow(2, (midiNumber - 69) / 12);
};

// Find the closest note for a given frequency
export const findClosestNote = (frequency: number): { name: string; midiNumber: number; frequency: number } => {
  const midiNumber = frequencyToMidiNumber(frequency);
  const octave = Math.floor(midiNumber / 12) - 1;
  const noteIndex = midiNumber % 12;
  const noteName = NOTES[noteIndex]?.name || 'C';

  return {
    name: `${noteName}${octave}`,
    midiNumber,
    frequency: midiToFrequency(midiNumber),
  };
};

// Added the missing detectPitch function
export const detectPitch = (audioBuffer: AudioBuffer): Promise<number[]> => {
  return new Promise((resolve) => {
    const fftSize = 2048;
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    const analyser = audioContext.createAnalyser();
    analyser.fftSize = fftSize;

    const bufferLength = analyser.frequencyBinCount;
    const dataArray = new Float32Array(bufferLength);

    // Create a source from the audio buffer
    const source = audioContext.createBufferSource();
    source.buffer = audioBuffer;
    source.connect(analyser);

    // Get frequency data
    analyser.getFloatFrequencyData(dataArray);

    // Find the dominant frequencies
    const frequencies: number[] = [];
    let maxIndex = 0;
    let maxValue = -Infinity;

    // Find peaks in the frequency data
    for (let i = 0; i < bufferLength; i++) {
      if (dataArray[i] > maxValue) {
        maxValue = dataArray[i];
        maxIndex = i;
      }
    }

    // Convert bin index to frequency if above threshold
    if (maxValue > -70) {
      const frequency = maxIndex * audioContext.sampleRate / fftSize;
      if (frequency > 50) {
        frequencies.push(frequency);
      }
    }

    // Clean up
    source.disconnect();
    audioContext.close().then(() => {
      resolve(frequencies);
    });
  });
};

// Analyze audio buffer using FFT to detect dominant frequencies
export const analyzeAudioBuffer = async (audioBuffer: AudioBuffer): Promise<{ time: number; frequency: number }[]> => {
  const fftSize = 2048;
  const frequencyData: { time: number; frequency: number }[] = [];

  const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
  const analyser = audioContext.createAnalyser();
  analyser.fftSize = fftSize;

  const bufferLength = analyser.frequencyBinCount;
  const dataArray = new Uint8Array(bufferLength);

  // Process the buffer in chunks to simulate real-time processing
  const sampleRate = audioBuffer.sampleRate;
  const chunkSize = 1024;
  const totalSamples = audioBuffer.length;

  for (let offset = 0; offset < totalSamples; offset += chunkSize) {
    // Create a temporary buffer for this chunk
    const tempBuffer = audioContext.createBuffer(
      audioBuffer.numberOfChannels,
      chunkSize,
      sampleRate
    );

    // Copy data from the original buffer
    for (let channel = 0; channel < audioBuffer.numberOfChannels; channel++) {
      const tempData = tempBuffer.getChannelData(channel);
      const originalData = audioBuffer.getChannelData(channel);

      for (let i = 0; i < chunkSize; i++) {
        if (offset + i < totalSamples) {
          tempData[i] = originalData[offset + i];
        }
      }
    }

    // Create a source from the temp buffer
    const source = audioContext.createBufferSource();
    source.buffer = tempBuffer;
    source.connect(analyser);

    // Get frequency data
    analyser.getByteFrequencyData(dataArray);

    // Find the dominant frequency
    let maxIndex = 0;
    let maxValue = 0;

    for (let i = 0; i < bufferLength; i++) {
      if (dataArray[i] > maxValue) {
        maxValue = dataArray[i];
        maxIndex = i;
      }
    }

    // Convert bin index to frequency
    const frequency = maxIndex * sampleRate / fftSize;

    // Store the frequency at this point in time
    if (frequency > 50 && maxValue > 30) {
      frequencyData.push({
        time: offset / sampleRate,
        frequency
      });
    }
  }

  await audioContext.close();

  return frequencyData;
};

// Convert frequency data to notes
export const frequencyDataToNotes = (
  frequencyData: { time: number; frequency: number }[],
  minDuration = 0.1
): {
  midiNumber: number;
  name: string;
  frequency: number;
  startTime: number;
  duration: number;
  velocity: number;
}[] => {
  const notes: {
    midiNumber: number;
    name: string;
    frequency: number;
    startTime: number;
    duration: number;
    velocity: number;
  }[] = [];

  let currentNote: {
    midiNumber: number;
    name: string;
    frequency: number;
    startTime: number;
    endTime: number;
    velocity: number;
  } | null = null;

  // Process each frequency data point
  frequencyData.forEach((data, index) => {
    const { frequency, time } = data;
    const note = findClosestNote(frequency);

    // If no current note or we've detected a different note
    if (!currentNote || currentNote.midiNumber !== note.midiNumber) {
      // If there was a current note, add it to our notes array
      if (currentNote) {
        // Only add if duration is above threshold
        if (currentNote.endTime - currentNote.startTime >= minDuration) {
          notes.push({
            midiNumber: currentNote.midiNumber,
            name: currentNote.name,
            frequency: currentNote.frequency,
            startTime: currentNote.startTime,
            duration: currentNote.endTime - currentNote.startTime,
            velocity: currentNote.velocity,
          });
        }
      }

      // Start a new note
      currentNote = {
        midiNumber: note.midiNumber,
        name: note.name,
        frequency: note.frequency,
        startTime: time,
        endTime: time,
        velocity: 80,
      };
    } else {
      // Same note continues, update the end time
      currentNote.endTime = time;
    }

    // For the last data point, add the current note if it exists
    if (index === frequencyData.length - 1 && currentNote) {
      if (currentNote.endTime - currentNote.startTime >= minDuration) {
        notes.push({
          midiNumber: currentNote.midiNumber,
          name: currentNote.name,
          frequency: currentNote.frequency,
          startTime: currentNote.startTime,
          duration: currentNote.endTime - currentNote.startTime,
          velocity: currentNote.velocity,
        });
      }
    }
  });

  return notes;
};
