import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import AudioRecorder from './AudioRecorder';
import { AudioProvider } from '@/context/AudioContext';
import { downloadMidiFile } from '@/utils/midiExport';

// Mock the midiExport module
jest.mock('@/utils/midiExport', () => ({
  downloadMidiFile: jest.fn(),
}));

describe('AudioRecorder Component', () => {
  const renderAudioRecorder = () => {
    return render(
      <AudioProvider>
        <AudioRecorder />
      </AudioProvider>
    );
  };

  beforeEach(() => {
    // Clear all mocks before each test
    jest.clearAllMocks();
    
    // Reset the mediaDevices mock for each test
    Object.defineProperty(navigator, 'mediaDevices', {
      writable: true,
      value: {
        getUserMedia: jest.fn().mockResolvedValue({
          getTracks: () => [{ stop: jest.fn() }]
        })
      }
    });
  });

  test('renders initial state correctly', () => {
    renderAudioRecorder();
    
    // Check if the component title is rendered
    expect(screen.getByText('Audio Recorder')).toBeInTheDocument();
    
    // Check if the initial instruction text is displayed
    expect(screen.getByText('Record audio to detect musical notes.')).toBeInTheDocument();
    
    // Check if the start recording button is present
    const startButton = screen.getByText('Start Recording');
    expect(startButton).toBeInTheDocument();
    expect(startButton).toBeEnabled();
  });

  test('changes to recording state when start recording button is clicked', async () => {
    renderAudioRecorder();
    
    // Find and click the start recording button
    const startButton = screen.getByText('Start Recording');
    fireEvent.click(startButton);
    
    // Check if recording message is displayed
    const recordingMessage = await screen.findByText('Recording in progress...');
    expect(recordingMessage).toBeInTheDocument();
    
    // Check if stop button is now visible
    const stopButton = await screen.findByText('Stop Recording');
    expect(stopButton).toBeInTheDocument();
  });
});