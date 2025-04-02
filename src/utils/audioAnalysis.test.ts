import { 
  midiToNoteName, 
  midiToFrequency, 
  findClosestNote,
  frequencyDataToNotes,
  analyzeAudioBuffer
} from './audioAnalysis';

describe('audioAnalysis Utility Functions', () => {
  describe('midiToNoteName', () => {
    test('converts MIDI numbers to correct note names', () => {
      expect(midiToNoteName(60)).toBe('C4');
      expect(midiToNoteName(61)).toBe('C#4');
      expect(midiToNoteName(69)).toBe('A4'); // A440, concert pitch
      expect(midiToNoteName(72)).toBe('C5');
      expect(midiToNoteName(48)).toBe('C3');
      expect(midiToNoteName(59)).toBe('B3');
      expect(midiToNoteName(71)).toBe('B4');
    });
  });

  describe('midiToFrequency', () => {
    test('converts MIDI numbers to correct frequencies', () => {
      // A4 (MIDI 69) should be 440Hz
      expect(midiToFrequency(69)).toBeCloseTo(440.0, 1);
      
      // C4 (MIDI 60) should be around 261.63Hz
      expect(midiToFrequency(60)).toBeCloseTo(261.63, 1);
      
      // Test a few other notes
      expect(midiToFrequency(64)).toBeCloseTo(329.63, 1); // E4
      expect(midiToFrequency(67)).toBeCloseTo(392.0, 1);  // G4
      expect(midiToFrequency(72)).toBeCloseTo(523.25, 1); // C5
    });
  });

  describe('findClosestNote', () => {
    test('finds the correct note for exact frequencies', () => {
      const result = findClosestNote(440.0); // Exact A4
      expect(result.name).toBe('A4');
      expect(result.midiNumber).toBe(69);
      expect(result.frequency).toBeCloseTo(440.0, 1);
    });

    test('finds the closest note for slightly off frequencies', () => {
      // Slightly sharp A4
      const sharpA4 = findClosestNote(445.0);
      expect(sharpA4.name).toBe('A4'); // Should still be A4
      expect(sharpA4.midiNumber).toBe(69);
      
      // Slightly flat A4
      const flatA4 = findClosestNote(435.0);
      expect(flatA4.name).toBe('A4'); // Should still be A4
      expect(flatA4.midiNumber).toBe(69);
      
      // Significantly sharp A4, should become A#4
      const verySharpA4 = findClosestNote(455.0);
      expect(verySharpA4.name).toBe('A#4');
      expect(verySharpA4.midiNumber).toBe(70);
    });
  });

  describe('frequencyDataToNotes', () => {
    test('converts frequency data to note objects correctly', () => {
      // Mock frequency data (time in seconds, frequency in Hz)
      const frequencyData = [
        { time: 0.0, frequency: 261.63 },  // C4
        { time: 0.1, frequency: 261.63 },  // C4 continues
        { time: 0.2, frequency: 293.66 },  // D4
        { time: 0.3, frequency: 293.66 },  // D4 continues
        { time: 0.4, frequency: 329.63 },  // E4
        { time: 0.5, frequency: 329.63 },  // E4 continues
      ];
      
      const notes = frequencyDataToNotes(frequencyData);
      
      // Should produce 3 notes
      expect(notes.length).toBe(3);
      
      // Check the first note (C4)
      expect(notes[0].name).toBe('C4');
      expect(notes[0].midiNumber).toBe(60);
      expect(notes[0].startTime).toBe(0.0);
      expect(notes[0].duration).toBe(0.1); // from 0.0 to 0.1
      
      // Check the second note (D4)
      expect(notes[1].name).toBe('D4');
      expect(notes[1].midiNumber).toBe(62);
      expect(notes[1].startTime).toBe(0.2);
      expect(notes[1].duration).toBe(0.1); // from 0.2 to 0.3
      
      // Check the third note (E4)
      expect(notes[2].name).toBe('E4');
      expect(notes[2].midiNumber).toBe(64);
      expect(notes[2].startTime).toBe(0.4);
      expect(notes[2].duration).toBe(0.1); // from 0.4 to 0.5
    });
    
    test('filters out notes below minimum duration', () => {
      const frequencyData = [
        { time: 0.0, frequency: 261.63 },  // C4 - too short
        { time: 0.05, frequency: 293.66 }, // D4 - too short
        { time: 0.2, frequency: 329.63 },  // E4
        { time: 0.3, frequency: 329.63 },  // E4 continues
      ];
      
      // Set minimum duration to 0.15 seconds
      const notes = frequencyDataToNotes(frequencyData, 0.15);
      
      // Should only have the E4 note
      expect(notes.length).toBe(1);
      expect(notes[0].name).toBe('E4');
      expect(notes[0].midiNumber).toBe(64);
      expect(notes[0].startTime).toBe(0.2);
      expect(notes[0].duration).toBe(0.1); // from 0.2 to 0.3
    });
    
    test('handles empty input', () => {
      const notes = frequencyDataToNotes([]);
      expect(notes).toEqual([]);
    });
  });

  describe('analyzeAudioBuffer', () => {
    test('produces frequency data from audio buffer', async () => {
      // Create a mock audio buffer
      const sampleRate = 44100;
      const channelData = new Float32Array(sampleRate); // 1 second of audio
      
      // Add a simple sine wave at 440Hz (A4)
      for (let i = 0; i < channelData.length; i++) {
        channelData[i] = Math.sin(2 * Math.PI * 440 * i / sampleRate);
      }
      
      const mockAudioBuffer = {
        length: channelData.length,
        duration: channelData.length / sampleRate,
        numberOfChannels: 1,
        sampleRate,
        getChannelData: jest.fn().mockReturnValue(channelData)
      };
      
      // Analyze the buffer
      const frequencyData = await analyzeAudioBuffer(mockAudioBuffer as unknown as AudioBuffer);
      
      // Expect to get at least some frequency data points
      expect(frequencyData.length).toBeGreaterThan(0);
      
      // This test is limited because our mock doesn't really process the sine wave properly,
      // but we can at least verify the function runs without errors
    });
  });
});