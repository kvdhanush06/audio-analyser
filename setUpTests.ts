import '@testing-library/jest-dom';
import 'jest-canvas-mock';

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
  
  close() {
    return Promise.resolve();
  }
}

window.AudioContext = AudioContextMock as any;
window.MediaRecorder = jest.fn().mockImplementation(() => {
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