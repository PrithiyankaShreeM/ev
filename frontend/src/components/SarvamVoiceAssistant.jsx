import React, { useState, useRef, useEffect } from 'react';
import { voiceApi } from '../services/api';
import { useAuth } from '../context/AuthContext';

export default function SarvamVoiceAssistant({ onActionTrigger = () => {} }) {
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [status, setStatus] = useState('idle'); // 'idle' | 'listening' | 'processing' | 'speaking'
  const [transcript, setTranscript] = useState('');
  const [responseText, setResponseText] = useState('');
  const [detectedLanguage, setDetectedLanguage] = useState('en-IN');
  const [detectedIntent, setDetectedIntent] = useState('');
  const [textInput, setTextInput] = useState('');
  const [lastAudioBase64, setLastAudioBase64] = useState(null);

  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const audioPlayerRef = useRef(null);

  // Suggested commands in English & Tamil/Thanglish
  const sampleCommands = [
    { text: 'Enakku nearby charging station thedu', label: 'Nearby (Tamil)' },
    { text: 'Next charger enga irukku?', label: 'Next Charger' },
    { text: 'Free charger book pannu', label: 'Free Charger' },
    { text: 'Route-la charging point irukka?', label: 'Along Route' },
    { text: 'Find Type 2 chargers', label: 'Type 2' },
    { text: 'Show upcoming bookings', label: 'My Bookings' }
  ];

  // Start microphone recording
  const startRecording = async () => {
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        alert('Microphone access is not supported by your browser.');
        return;
      }

      setStatus('listening');
      setTranscript('Listening for your voice...');
      setResponseText('');
      audioChunksRef.current = [];

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/wav' });
        stream.getTracks().forEach((track) => track.stop());
        await processAudio(audioBlob);
      };

      mediaRecorder.start();
    } catch (err) {
      console.error('Error starting audio recording:', err);
      setStatus('idle');
      alert('Microphone permission was denied. Please allow microphone access or use text input.');
    }
  };

  // Stop microphone recording
  const stopRecording = () => {
    if (mediaRecorderRef.current && status === 'listening') {
      mediaRecorderRef.current.stop();
      setStatus('processing');
    }
  };

  // Process captured audio blob
  const processAudio = async (audioBlob) => {
    setStatus('processing');
    try {
      const formData = new FormData();
      formData.append('audio', audioBlob, 'command.wav');
      // Pass coordinates for nearby search
      formData.append('lat', '13.0827');
      formData.append('lng', '80.2707');

      const result = await voiceApi.processCommand(formData);
      handleAssistantResult(result);
    } catch (err) {
      console.error('Failed to process voice command:', err);
      setStatus('idle');
      setResponseText('Could not process voice command. Please try again or use text.');
    }
  };

  // Process typed command
  const handleTextSubmit = async (e) => {
    e?.preventDefault();
    if (!textInput.trim()) return;

    const query = textInput.trim();
    setTextInput('');
    setStatus('processing');
    setTranscript(query);
    setResponseText('');

    try {
      const result = await voiceApi.processCommand({
        text: query,
        lat: 13.0827,
        lng: 80.2707
      });
      handleAssistantResult(result);
    } catch (err) {
      console.error('Text command error:', err);
      setStatus('idle');
      setResponseText('Error processing request.');
    }
  };

  // Handle Assistant response and play Sarvam Bulbul audio
  const handleAssistantResult = (result) => {
    setTranscript(result.transcript || transcript);
    setResponseText(result.responseText || 'Request processed.');
    setDetectedLanguage(result.language || 'en-IN');
    setDetectedIntent(result.intent || '');

    // Notify parent to update dashboard (e.g. reload bookings or focus charger)
    if (result.actionResult) {
      onActionTrigger(result.actionResult);
    }

    // Play Sarvam Bulbul TTS Audio if returned
    if (result.audioBase64) {
      setLastAudioBase64(result.audioBase64);
      playBase64Audio(result.audioBase64);
    } else {
      // Browser SpeechSynthesis fallback if Sarvam API key is pending
      speakWithBrowser(result.responseText, result.language);
    }
  };

  const playBase64Audio = (base64) => {
    try {
      setStatus('speaking');
      const audio = new Audio(`data:audio/wav;base64,${base64}`);
      audioPlayerRef.current = audio;
      audio.onended = () => setStatus('idle');
      audio.onerror = () => setStatus('idle');
      audio.play().catch(() => setStatus('idle'));
    } catch (e) {
      setStatus('idle');
    }
  };

  const speakWithBrowser = (text, lang) => {
    if (!window.speechSynthesis) {
      setStatus('idle');
      return;
    }
    setStatus('speaking');
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = lang === 'ta-IN' ? 'ta-IN' : 'en-IN';
    utterance.rate = 1.0;
    utterance.onend = () => setStatus('idle');
    utterance.onerror = () => setStatus('idle');
    window.speechSynthesis.speak(utterance);
  };

  const replayAudio = () => {
    if (lastAudioBase64) {
      playBase64Audio(lastAudioBase64);
    } else if (responseText) {
      speakWithBrowser(responseText, detectedLanguage);
    }
  };

  return (
    <>
      {/* Floating Microphone Action Button */}
      <div className="fixed bottom-6 right-6 z-50">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className={`voice-pulse-btn w-14 h-14 rounded-full flex items-center justify-center font-bold text-xl shadow-2xl transition duration-300 ${
            status === 'listening' ? 'listening' : ''
          }`}
          title="Sarvam AI Voice Assistant"
          aria-label="Open Sarvam AI Voice Assistant"
        >
          {status === 'listening' ? '⏹' : '🎙'}
        </button>
      </div>

      {/* Expandable Assistant Drawer / Window */}
      {isOpen && (
        <div className="fixed bottom-24 right-6 w-[380px] max-w-[calc(100vw-32px)] bg-white border border-[#dce3d5] rounded-xl shadow-2xl z-50 overflow-hidden flex flex-col animate-slideUp font-sans">
          {/* Header */}
          <div className="bg-[#252b24] text-white p-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-lime-400 text-lg">ϟ</span>
              <div>
                <h3 className="text-sm font-bold font-display">Sarvam AI Assistant</h3>
                <small className="text-[10px] text-lime-300 block">Saaras STT · Bulbul TTS · Tamil / English</small>
              </div>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="text-gray-400 hover:text-white font-bold text-sm"
            >
              ✕
            </button>
          </div>

          {/* Assistant Body */}
          <div className="p-4 space-y-4 max-h-[380px] overflow-y-auto bg-[#fafbf8]">
            {/* Live State Indicator */}
            <div className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                <span
                  className={`w-2.5 h-2.5 rounded-full ${
                    status === 'listening'
                      ? 'bg-red-500 animate-ping'
                      : status === 'processing'
                      ? 'bg-yellow-400 animate-pulse'
                      : status === 'speaking'
                      ? 'bg-lime-500 animate-bounce'
                      : 'bg-gray-300'
                  }`}
                />
                <span className="font-semibold text-gray-700 capitalize">
                  {status === 'listening'
                    ? 'Listening... (Speak now)'
                    : status === 'processing'
                    ? 'Processing with Sarvam AI...'
                    : status === 'speaking'
                    ? 'Speaking response...'
                    : 'Ready for command'}
                </span>
              </div>
              <span className="text-[10px] font-bold bg-[#edf2e7] text-lime-900 px-2 py-0.5 rounded">
                {detectedLanguage === 'ta-IN' ? 'தமிழ் / Thanglish' : 'English'}
              </span>
            </div>

            {/* Transcript Card */}
            {transcript && (
              <div className="bg-white p-3 rounded-lg border border-gray-100 shadow-sm text-xs">
                <span className="text-[10px] text-gray-400 uppercase font-bold block mb-1">You said:</span>
                <p className="font-medium text-gray-800">"{transcript}"</p>
                {detectedIntent && (
                  <span className="inline-block mt-2 text-[9px] font-bold bg-gray-100 text-gray-600 px-2 py-0.5 rounded">
                    Intent: {detectedIntent}
                  </span>
                )}
              </div>
            )}

            {/* Assistant Response Card */}
            {responseText && (
              <div className="bg-[#f0f5e9] p-3.5 rounded-lg border border-[#ddebce] text-xs space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] text-lime-800 uppercase font-bold">WattStop Response:</span>
                  <button
                    onClick={replayAudio}
                    className="text-[11px] text-lime-800 font-bold hover:underline flex items-center gap-1"
                  >
                    <span>🔊</span> Replay
                  </button>
                </div>
                <p className="text-gray-900 leading-relaxed font-medium">{responseText}</p>
              </div>
            )}

            {/* Mic Capture Controls */}
            <div className="text-center py-2">
              {status === 'listening' ? (
                <button
                  onClick={stopRecording}
                  className="bg-red-500 hover:bg-red-600 text-white font-bold text-xs px-5 py-2.5 rounded-full shadow-md transition"
                >
                  ■ Stop Recording & Send
                </button>
              ) : (
                <button
                  onClick={startRecording}
                  disabled={status === 'processing'}
                  className="primary-button text-xs font-bold py-2.5 px-6 mx-auto shadow-md"
                >
                  <span>🎙</span> Tap to Speak (Tamil or English)
                </button>
              )}
            </div>

            {/* Sample Command Suggestions */}
            <div>
              <span className="text-[10px] font-bold text-gray-400 uppercase block mb-1.5">
                Quick voice prompts (Click to try):
              </span>
              <div className="flex flex-wrap gap-1.5">
                {sampleCommands.map((cmd, i) => (
                  <button
                    key={i}
                    onClick={() => {
                      setTextInput(cmd.text);
                      setTranscript(cmd.text);
                      voiceApi
                        .processCommand({ text: cmd.text, lat: 13.0827, lng: 80.2707 })
                        .then(handleAssistantResult)
                        .catch(() => setResponseText('Error executing command'));
                    }}
                    className="text-[10.5px] bg-white hover:bg-[#eff5e6] text-gray-700 font-medium px-2.5 py-1 rounded-md border border-gray-200 transition text-left"
                  >
                    "{cmd.text}"
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Footer with Manual Text Input */}
          <form onSubmit={handleTextSubmit} className="p-2.5 border-t border-gray-200 bg-white flex items-center gap-2">
            <input
              type="text"
              placeholder="Or type voice command in Tamil/English..."
              value={textInput}
              onChange={(e) => setTextInput(e.target.value)}
              className="flex-1 text-xs px-3 py-2 border border-gray-200 rounded-md focus:outline-none focus:ring-1 focus:ring-lime-400"
            />
            <button
              type="submit"
              disabled={!textInput.trim() || status === 'processing'}
              className="bg-[#252b24] hover:bg-black text-white text-xs font-bold px-3 py-2 rounded-md transition"
            >
              Send
            </button>
          </form>
        </div>
      )}
    </>
  );
}
