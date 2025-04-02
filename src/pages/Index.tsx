import React from 'react';
import { AudioProvider } from '@/context/AudioContext';
import AudioRecorder from '@/components/AudioRecorder';
import AudioVisualizer from '@/components/AudioVisualizer';
import PianoRoll from '@/components/PianoRoll';
import NoteDisplay from '@/components/NoteDisplay';
import { Music } from 'lucide-react';

const Index = () => {
  return (
    <AudioProvider>
      <div className="min-h-screen bg-gradient-to-b from-white to-slate-50">
        <header className="w-full border-b border-slate-200">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center">
                  <Music className="h-5 w-5 text-white" />
                </div>
                <div>
                  <h1 className="text-xl font-medium">AudioAnalyser</h1>
                  <p className="text-sm text-muted-foreground">Audio to MIDI Analysis</p>
                </div>
              </div>
            </div>
          </div>
        </header>

        <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="space-y-8">
            <section className="animate-fade-in">
              <div className="flex flex-col space-y-6">
                <div className="flex flex-col-reverse md:flex-row gap-4 md:gap-6">
                  <div className="md:w-2/3">
                    <div className="p-6 bg-white rounded-xl shadow-sm mb-4">
                      <h2 className="text-lg font-medium mb-4">Audio Analyser</h2>
                      <p className="text-sm text-muted-foreground mb-4">
                        Record audio to analyze musical notes. The app will detect the notes using
                        frequency analysis and display them on the piano roll below.
                      </p>
                      <AudioVisualizer />
                    </div>
                  </div>

                  <div className="md:w-1/3">
                    <div className="p-6 bg-white rounded-xl shadow-sm h-full">
                      <h2 className="text-lg font-medium mb-4">How it Works</h2>
                      <ol className="list-decimal list-inside text-sm space-y-2 text-muted-foreground">
                        <li>Record audio using your microphone</li>
                        <li>The app analyzes the frequencies</li>
                        <li>Notes are detected and displayed</li>
                        <li>Export the results as a MIDI file</li>
                      </ol>
                    </div>
                  </div>
                </div>

                <AudioRecorder />

                <div className="p-6 bg-white rounded-xl shadow-sm animate-fade-in">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-lg font-medium">Piano Roll</h2>
                    <NoteDisplay />
                  </div>
                  <PianoRoll />
                </div>
              </div>
            </section>
          </div>
        </main>

        <footer className="w-full border-t border-slate-200 py-6">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex flex-col md:flex-row justify-between items-center">
              <p className="text-sm text-muted-foreground">
                © {new Date().getFullYear()} AudioAnalyser
              </p>
              <div className="flex space-x-4 mt-4 md:mt-0">
                <span className="text-sm text-muted-foreground">
                  Built with Web Audio API and FFT analysis
                </span>
              </div>
            </div>
          </div>
        </footer>
      </div>
    </AudioProvider>
  );
};

export default Index;
