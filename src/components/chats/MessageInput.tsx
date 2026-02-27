import { useState, useRef, useEffect } from 'react';
import { Send, Mic, MicOff } from 'lucide-react';

interface MessageInputProps {
  onSend: (message: string) => void;
  disabled?: boolean;
  placeholder?: string;
}

export default function MessageInput({ onSend, disabled, placeholder = 'Type a message...' }: MessageInputProps) {
  const [message, setMessage] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const recordingIntervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  }, [message]);

  const handleSubmit = () => {
    if (message.trim() && !disabled) {
      onSend(message.trim());
      setMessage('');
      if (textareaRef.current) {
        textareaRef.current.style.height = 'auto';
      }
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const handleMicrophoneClick = () => {
    if (isRecording) {
      stopRecording();
    } else {
      startRecording();
    }
  };

  const startRecording = () => {
    setIsRecording(true);
    setRecordingTime(0);
    recordingIntervalRef.current = setInterval(() => {
      setRecordingTime(prev => prev + 1);
    }, 1000);
  };

  const stopRecording = () => {
    setIsRecording(false);
    if (recordingIntervalRef.current) {
      clearInterval(recordingIntervalRef.current);
      recordingIntervalRef.current = null;
    }
    setRecordingTime(0);
  };

  const formatRecordingTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  useEffect(() => {
    return () => {
      if (recordingIntervalRef.current) {
        clearInterval(recordingIntervalRef.current);
      }
    };
  }, []);

  return (
    <div className="sticky bottom-0 border-t backdrop-blur-sm bg-white/95 border-gray-200 dark:bg-slate-900/95 dark:border-slate-700" style={{ paddingBottom: 'calc(1rem + var(--safe-area-inset-bottom))' }}>
      <div className="max-w-4xl mx-auto p-4">
        {isRecording && (
          <div className="mb-3 px-4 py-2 rounded-lg flex items-center gap-3 bg-red-50 border border-red-200 dark:bg-red-900/30 dark:border-red-700/50">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-red-500 animate-pulse" />
              <span className="text-sm font-medium text-red-700 dark:text-red-300">
                Recording: {formatRecordingTime(recordingTime)}
              </span>
            </div>
            <button
              onClick={stopRecording}
              className="ml-auto text-sm font-medium text-red-700 hover:text-red-800 dark:text-red-300 dark:hover:text-red-200"
            >
              Cancel
            </button>
          </div>
        )}

        <div className="flex items-end gap-2 rounded-2xl border bg-white border-gray-300 dark:bg-slate-800/50 dark:border-slate-700">
          <button
            onClick={handleMicrophoneClick}
            disabled={disabled}
            className={`m-2 p-2 rounded-xl transition-all ${
              disabled
                ? 'bg-gray-200 text-gray-400 cursor-not-allowed dark:bg-slate-700 dark:text-slate-500'
                : isRecording
                  ? 'bg-red-500 text-white hover:bg-red-600 active:scale-95 animate-pulse'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200 active:scale-95 dark:bg-slate-700 dark:text-gray-300 dark:hover:bg-slate-600'
            }`}
            title={isRecording ? 'Stop recording' : 'Start voice recording (placeholder)'}
          >
            {isRecording ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
          </button>

          <textarea
            ref={textareaRef}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={isRecording ? 'Recording...' : placeholder}
            disabled={disabled || isRecording}
            rows={1}
            className="flex-1 py-3 bg-transparent border-none outline-none resize-none max-h-32 text-slate-900 placeholder-gray-400 dark:text-white dark:placeholder-gray-500"
          />
          <button
            onClick={handleSubmit}
            disabled={disabled || !message.trim() || isRecording}
            className={`m-2 p-2 rounded-xl transition-all ${
              disabled || !message.trim() || isRecording
                ? 'bg-gray-200 text-gray-400 cursor-not-allowed dark:bg-slate-700 dark:text-slate-500'
                : 'bg-gradient-to-r from-emerald-500 to-teal-500 text-white hover:shadow-lg hover:shadow-emerald-500/50 active:scale-95'
            }`}
          >
            <Send className="w-5 h-5" />
          </button>
        </div>

        {isRecording && (
          <p className="mt-2 text-xs text-center text-gray-500 dark:text-gray-400">
            Voice transcription is a placeholder feature. Integration with speech-to-text API needed.
          </p>
        )}
      </div>
    </div>
  );
}
