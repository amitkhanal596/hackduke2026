'use client';

import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Volume2, VolumeX, Square, Play, Pause } from 'lucide-react';

const VoiceNewsButton = () => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [hasPlayed, setHasPlayed] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [transcript, setTranscript] = useState<string>("");
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const audioUrlRef = useRef<string | null>(null);

  // Cleanup on component unmount
  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
      if (audioUrlRef.current) {
        URL.revokeObjectURL(audioUrlRef.current);
        audioUrlRef.current = null;
      }
    };
  }, []);

  // Update current time during playback
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const updateTime = () => setCurrentTime(audio.currentTime);
    const updateDuration = () => setDuration(audio.duration);

    audio.addEventListener('timeupdate', updateTime);
    audio.addEventListener('loadedmetadata', updateDuration);

    return () => {
      audio.removeEventListener('timeupdate', updateTime);
      audio.removeEventListener('loadedmetadata', updateDuration);
    };
  }, [isPlaying]);

  const stopAudio = () => {
    if (audioRef.current) {
      // Immediately stop and reset audio
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      
      // Remove all event listeners to prevent any callbacks
      audioRef.current.onended = null;
      audioRef.current.onerror = null;
      audioRef.current.oncanplaythrough = null;
      audioRef.current.ontimeupdate = null;
      audioRef.current.onloadedmetadata = null;
      
      // Force stop by setting src to empty
      audioRef.current.src = '';
      audioRef.current.load();
      audioRef.current = null;
    }
    
    // Clear the audio file URL so it cannot be played again
    if (audioUrlRef.current) {
      URL.revokeObjectURL(audioUrlRef.current);
      audioUrlRef.current = null;
    }
    
    // Immediately update all states
    setIsPlaying(false);
    setIsLoading(false);
    setIsPaused(false);
    setCurrentTime(0);
    setDuration(0);
    setHasPlayed(false); // Reset hasPlayed so user needs to generate new audio
  };

  const pauseAudio = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      setIsPaused(true);
    }
  };

  const resumeAudio = () => {
    if (audioRef.current) {
      audioRef.current.play();
      setIsPaused(false);
    }
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (audioRef.current) {
      const newTime = parseFloat(e.target.value);
      audioRef.current.currentTime = newTime;
      setCurrentTime(newTime);
    }
  };

  const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const handleVoiceNews = async () => {
    if (isLoading) return;
    
    // If already playing and audio file exists, pause/resume
    if (isPlaying && audioRef.current && audioUrlRef.current) {
      if (isPaused) {
        resumeAudio();
      } else {
        pauseAudio();
      }
      return;
    }
    
    // If no audio file available, generate new one
    if (!audioUrlRef.current) {
      await generateNewAudio();
      return;
    }
  };

  const generateNewAudio = async () => {
    // Clean up any existing audio
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }
    if (audioUrlRef.current) {
      URL.revokeObjectURL(audioUrlRef.current);
      audioUrlRef.current = null;
    }
    
    setIsLoading(true);
    setIsPlaying(true);
    setIsPaused(false);
    setCurrentTime(0);
    setDuration(0);
    setTranscript(""); // Clear previous transcript

    try {
      // First, get the script text for the transcript
      const scriptResponse = await fetch('/api/backend/voice-news/script', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({}), // Empty body to trigger dynamic generation
        mode: 'cors',
      });

      if (scriptResponse.ok) {
        const scriptData = await scriptResponse.json();
        setTranscript(scriptData.script);
      }

      // Then generate the audio
      const response = await fetch('/api/backend/voice-news', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({}), // Empty body to trigger dynamic generation
        mode: 'cors', // Explicitly set CORS mode
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Voice generation failed:', response.status, errorText);
        throw new Error(`Failed to generate voice: ${response.status} ${errorText}`);
      }

      const audioBlob = await response.blob();
      console.log('Audio blob received:', audioBlob.size, 'bytes');
      
      if (audioBlob.size === 0) {
        throw new Error('Received empty audio blob');
      }
      
      // Create temporary file URL
      const audioUrl = URL.createObjectURL(audioBlob);
      audioUrlRef.current = audioUrl;
      
      const audio = new Audio(audioUrl);
      audioRef.current = audio;
      
      // Set up event handlers
      audio.onended = () => {
        setIsPlaying(false);
        setIsPaused(false);
        setHasPlayed(true);
        setCurrentTime(0);
      };
      
      audio.onerror = (e) => {
        console.error('Audio playback error:', e);
        setIsPlaying(false);
        setIsLoading(false);
        setIsPaused(false);
      };

      // Wait for audio to be ready
      audio.oncanplaythrough = async () => {
        try {
          await audio.play();
          setIsLoading(false);
        } catch (playError) {
          console.error('Error playing audio:', playError);
          setIsPlaying(false);
          setIsLoading(false);
          setIsPaused(false);
        }
      };

      // Load the audio
      audio.load();
      
    } catch (error) {
      console.error('Error generating voice news:', error);
      setIsPlaying(false);
      setIsLoading(false);
      setIsPaused(false);
    }
  };

  return (
    <div className="w-full max-w-6xl mx-auto space-y-6">
      {/* Main Play/Pause/Stop Button - Aligned with description text */}
      <div className="flex items-center justify-center gap-6">
        <Button
          onClick={isPlaying ? (isPaused ? resumeAudio : pauseAudio) : handleVoiceNews}
          disabled={isLoading}
          variant="outline"
          className="flex items-center gap-4 bg-black/40 backdrop-blur-sm border-white/10 hover:border-green-500/50 text-white hover:text-green-300 transition-all duration-200 px-12 py-6 text-2xl font-bold"
          style={{
            boxShadow: '0 0 25px rgba(16, 185, 129, 0.15), inset 0 0 15px rgba(16, 185, 129, 0.08)'
          }}
        >
          {isLoading ? (
            <div className="w-8 h-8 border-3 border-green-500 border-t-transparent rounded-full animate-spin" />
          ) : isPlaying && !isPaused ? (
            <Pause className="w-8 h-8 text-yellow-500" />
          ) : isPlaying && isPaused ? (
            <Play className="w-8 h-8 text-green-500" />
          ) : (
            <Play className="w-8 h-8" />
          )}
          {isLoading ? 'Generating...' : isPlaying && !isPaused ? 'Pause' : isPlaying && isPaused ? 'Resume' : audioUrlRef.current ? 'Play' : 'The Scoop'}
        </Button>

        {/* Stop Button */}
        {isPlaying && (
          <Button
            onClick={stopAudio}
            variant="outline"
            className="flex items-center gap-3 bg-black/40 backdrop-blur-sm border-white/10 hover:border-red-500/50 text-white hover:text-red-300 transition-all duration-200 px-10 py-5 text-xl font-bold"
            style={{
              boxShadow: '0 0 20px rgba(239, 68, 68, 0.15), inset 0 0 12px rgba(239, 68, 68, 0.08)'
            }}
          >
            <Square className="w-7 h-7" />
            Stop
          </Button>
        )}

        {/* Generate New Button (only shown when no audio file available) */}
        {!audioUrlRef.current && !isLoading && (
          <Button
            onClick={generateNewAudio}
            disabled={isLoading}
            variant="outline"
            className="flex items-center gap-3 bg-black/40 backdrop-blur-sm border-white/10 hover:border-purple-500/50 text-white hover:text-purple-300 transition-all duration-200 px-10 py-5 text-xl font-bold"
            style={{
              boxShadow: '0 0 20px rgba(139, 92, 246, 0.15), inset 0 0 12px rgba(139, 92, 246, 0.08)'
            }}
          >
            <Volume2 className="w-7 h-7" />
            Generate New
          </Button>
        )}
      </div>

      {/* Audio Control Slider */}
      {isPlaying && duration > 0 && (
        <div className="space-y-3">
          {/* Time Display */}
          <div className="flex justify-between text-lg text-gray-400 font-medium">
            <span>{formatTime(currentTime)}</span>
            <span>{formatTime(duration)}</span>
          </div>
          
          {/* Progress Slider */}
          <div className="relative">
            <input
              type="range"
              min="0"
              max={duration || 0}
              value={currentTime}
              onChange={handleSeek}
              className="w-full h-3 bg-gray-700 rounded-lg appearance-none cursor-pointer slider"
              style={{
                background: `linear-gradient(to right, #10B981 0%, #10B981 ${(currentTime / duration) * 100}%, #374151 ${(currentTime / duration) * 100}%, #374151 100%)`
              }}
            />
            <style jsx>{`
              .slider::-webkit-slider-thumb {
                appearance: none;
                height: 20px;
                width: 20px;
                border-radius: 50%;
                background: #10B981;
                cursor: pointer;
                border: 3px solid #000;
                box-shadow: 0 0 12px rgba(16, 185, 129, 0.6);
              }
              .slider::-moz-range-thumb {
                height: 20px;
                width: 20px;
                border-radius: 50%;
                background: #10B981;
                cursor: pointer;
                border: 3px solid #000;
                box-shadow: 0 0 12px rgba(16, 185, 129, 0.6);
              }
            `}</style>
          </div>
        </div>
      )}

      {/* Transcript Display */}
      {transcript && (
        <div className="mt-8">
          <h3 className="text-2xl font-bold text-white mb-4 text-center">Transcript</h3>
          <div 
            className="bg-black/40 backdrop-blur-sm border-white/10 rounded-lg p-6 max-h-96 overflow-y-auto"
            style={{
              boxShadow: '0 0 25px rgba(16, 185, 129, 0.08), inset 0 0 15px rgba(16, 185, 129, 0.03)'
            }}
          >
            <p className="text-gray-300 text-lg leading-relaxed whitespace-pre-wrap">
              {transcript}
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default VoiceNewsButton;
