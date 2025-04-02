import '@testing-library/jest-dom';
import 'jest-canvas-mock';

// Mark this as a test environment
(window as any).__TESTING__ = true;

// Mock Web Audio API
class AudioContextMock {
  createAnalyser() {
    return {
      connect: jest.fn(),
      disconnect: jest.fn(),
      fftSize: 0,
      frequencyBinCount: 1024,
      getByteFrequencyData: jest.fn(),
      getFloatFrequencyData: jest.fn()
    };
  }
  
  createMediaStreamSource() {
    return {
      connect: jest.fn(),
      disconnect: jest.fn()
    };
  }
  
  createBufferSource() {
    return {
      connect: jest.fn(),
      disconnect: jest.fn(),
      start: jest.fn(),
      stop: jest.fn(),
      buffer: null
    };
  }
  
  createMediaElementSource() {
    return {
      connect: jest.fn(),
      disconnect: jest.fn()
    };
  }
  
  createBuffer(numChannels, length, sampleRate) {
    return {
      numberOfChannels: numChannels,
      length: length,
      sampleRate: sampleRate,
      duration: length / sampleRate,
      getChannelData: jest.fn().mockReturnValue(new Float32Array(length))
    };
  }
  
  close() {
    return Promise.resolve();
  }
}

window.AudioContext = AudioContextMock as any;

// Create a complete MediaRecorder mock
const mockedMediaRecorder = {
  prototype: {},
  isTypeSupported: jest.fn().mockReturnValue(true)
};

// Create the constructor function
const MediaRecorderMock = jest.fn().mockImplementation(() => {
  return {
    start: jest.fn(),
    stop: jest.fn(),
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    state: 'inactive',
    stream: {
      getTracks: () => [{ stop: jest.fn() }]
    }
  };
});

// Set the constructor with its static methods
window.MediaRecorder = Object.assign(MediaRecorderMock, mockedMediaRecorder) as any;

// Mock navigator.mediaDevices to prevent TypeError about read-only property
Object.defineProperty(navigator, 'mediaDevices', {
  writable: true,
  value: {
    getUserMedia: jest.fn().mockResolvedValue({
      getTracks: () => [{ stop: jest.fn() }]
    })
  }
});

Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: jest.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  })),
});

// Mock URL methods
global.URL.createObjectURL = jest.fn();
global.URL.revokeObjectURL = jest.fn();