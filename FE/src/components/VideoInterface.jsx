import React, { useState, useEffect, useRef, useCallback } from "react";
import { IconButton, MicIcon, MicOffIcon, PhoneOffIcon } from "./InterviewUICommon";
import api from "../lib/api";

const WAVE_HEIGHTS = [10, 16, 22, 14, 18];

const VoiceInterface = ({ selectedJob, onCallEnd }) => {
  const [callActive, setCallActive] = useState(false);
  const [listening, setListening] = useState(false);
  const [aiSpeaking, setAiSpeaking] = useState(false);
  const [statusText, setStatusText] = useState("Select a job and initiate interview stream");
  const [, setTranscript] = useState([]);
  const [, setQuestions] = useState([]);

  const recognitionRef = useRef(null);
  const synthRef = useRef(window.speechSynthesis);
  const historyRef = useRef([]);
  const callActiveRef = useRef(false);

  // Speak AI response
  const speak = useCallback((text, onDone) => {
    synthRef.current.cancel();
    const utter = new SpeechSynthesisUtterance(text);
    utter.rate = 1;
    utter.pitch = 1;
    setAiSpeaking(true);
    utter.onend = () => {
      setAiSpeaking(false);
      if (onDone) onDone();
    };
    synthRef.current.speak(utter);
  }, []);

  // Send message to Gemini via backend
  const sendToAI = useCallback(
    async (userMessage) => {
      setStatusText("Synthesizing response...");
      try {
        const { data } = await api.post("/interview/chat", {
          message: userMessage,
          jobInfo: selectedJob,
          history: historyRef.current,
        });

        const aiReply = data.reply;

        // Update history
        historyRef.current = [
          ...historyRef.current,
          { role: "user", text: userMessage },
          { role: "model", text: aiReply },
        ];

        // Update transcript state
        setTranscript((prev) => [
          ...prev,
          { role: "user", text: userMessage },
          { role: "model", text: aiReply },
        ]);

        // Track questions asked by AI
        setQuestions((prev) => [
          ...prev,
          { id: String(prev.length + 1).padStart(2, "0"), title: aiReply, answered: false },
        ]);

        setStatusText("Audio output active...");
        speak(aiReply, () => {
          if (callActiveRef.current) {
            setStatusText("Input stream ready — engage microphone");
          }
        });
      } catch (err) {
        console.error("AI error:", err);
        const is429 = err.response?.status === 429;
        setStatusText(is429 ? "Telemetry quota exceeded. Please retry shortly." : "Stream communication error.");
        if (is429) {
          callActiveRef.current = false;
          setCallActive(false);
        }
      }
    },
    [selectedJob, speak]
  );

  // Setup Web Speech Recognition
  const setupRecognition = useCallback(() => {
    const SpeechRecognition =
      window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert("Speech recognition not supported. Use Chrome or a WebSpeech-compatible browser.");
      return null;
    }
    const rec = new SpeechRecognition();
    rec.continuous = false;
    rec.interimResults = false;
    rec.lang = "en-US";

    rec.onresult = (e) => {
      const said = e.results[0][0].transcript;
      setListening(false);
      setStatusText(`User: "${said}"`);
      sendToAI(said);
    };
    rec.onerror = () => {
      setListening(false);
      setStatusText("Microphone signal failed. Re-try.");
    };
    rec.onend = () => setListening(false);
    return rec;
  }, [sendToAI]);

  // Start call — AI greets first
  const startCall = useCallback(async () => {
    if (!selectedJob) {
      setStatusText("Please select target posting from the Applied Jobs panel.");
      return;
    }
    callActiveRef.current = true;
    setCallActive(true);
    historyRef.current = [];
    setTranscript([]);
    setQuestions([]);
    setStatusText("Initializing audio session...");
    await sendToAI("Hello, I am ready for the interview.");
  }, [selectedJob, sendToAI]);

  // Toggle mic
  const toggleMic = useCallback(() => {
    if (!callActive) return;
    if (aiSpeaking) return;

    if (listening) {
      recognitionRef.current?.stop();
      setListening(false);
      setStatusText("Input stream ready — engage microphone");
    } else {
      const rec = setupRecognition();
      if (!rec) return;
      recognitionRef.current = rec;
      rec.start();
      setListening(true);
      setStatusText("Listening for audio input...");
    }
  }, [callActive, aiSpeaking, listening, setupRecognition]);

  // End call — generate summary
  const endCall = useCallback(async () => {
    callActiveRef.current = false;
    setCallActive(false);
    setListening(false);
    synthRef.current.cancel();
    recognitionRef.current?.stop();
    setStatusText("Compiling evaluation telemetry...");

    try {
      const { data } = await api.post("/interview/summary", {
        jobInfo: selectedJob,
        transcript: historyRef.current,
      });
      onCallEnd({
        summary: data.summary,
        sessionId: data.sessionId,
        jobInfo: selectedJob,
        endedAt: new Date(),
        transcript: historyRef.current,
      });
    } catch (err) {
      console.error("Summary error:", err);
      onCallEnd({
        summary: "Summary telemetry could not be compiled.",
        jobInfo: selectedJob,
        endedAt: new Date(),
        transcript: historyRef.current,
      });
    }
  }, [selectedJob, onCallEnd]);

  // Cleanup on unmount
  useEffect(() => {
    const synth = synthRef.current;
    const recognition = recognitionRef.current;

    return () => {
      synth.cancel();
      recognition?.stop();
    };
  }, []);

  return (
    <section className="overflow-hidden rounded-lg bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-none">
      {/* AI Avatar area */}
      <div className="relative flex flex-col items-center justify-center h-60 md:h-72 bg-zinc-50 dark:bg-zinc-950/90 border-b border-zinc-200 dark:border-zinc-800">
        {/* AI avatar */}
        <div
          className={`flex h-20 w-20 items-center justify-center rounded-lg bg-zinc-900 dark:bg-zinc-800 border border-zinc-700/80 text-emerald-400 font-mono text-xl font-bold transition-all duration-200 ${
            aiSpeaking ? "ring-2 ring-emerald-500 scale-105" : ""
          }`}
        >
          AI_SYS
        </div>
        <p className="mt-3 text-xs font-semibold text-zinc-900 dark:text-zinc-100 font-mono">
          {selectedJob ? `${selectedJob.job_title} @ ${selectedJob.company_name}` : "NO JOB SELECTED"}
        </p>

        {/* Status badge */}
        <div className="mt-2.5 flex items-center gap-2 rounded bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 px-3 py-1 text-[11px] font-mono text-zinc-600 dark:text-zinc-300">
          <span
            className={`h-1.5 w-1.5 rounded-full ${
              listening
                ? "bg-rose-500 animate-ping"
                : aiSpeaking
                ? "bg-emerald-500 animate-pulse"
                : callActive
                ? "bg-emerald-500"
                : "bg-zinc-400 dark:bg-zinc-600"
            }`}
          />
          {statusText}
        </div>

        {/* Listening wave indicator */}
        {listening && (
          <div className="mt-2.5 flex items-end gap-1 h-5">
            {[1, 2, 3, 4, 5].map((i) => (
              <span
                key={i}
                className="w-1 rounded-sm bg-emerald-500"
                style={{
                  height: `${WAVE_HEIGHTS[i - 1]}px`,
                  animation: `bounce 0.${i + 3}s infinite alternate`,
                }}
              />
            ))}
          </div>
        )}
      </div>

      {/* Controls */}
      <div className="flex items-center justify-between bg-zinc-50/50 dark:bg-zinc-900 px-5 py-3">
        <div className="flex items-center gap-2 text-xs font-mono text-zinc-500 dark:text-zinc-400">
          {callActive ? (
            <>
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
              SESSION_ACTIVE
            </>
          ) : (
            <>
              <span className="h-1.5 w-1.5 rounded-full bg-zinc-400 dark:bg-zinc-600" />
              SESSION_IDLE
            </>
          )}
        </div>

        <div className="flex items-center gap-2.5">
          {/* Mic toggle */}
          <IconButton
            kind={listening ? "danger" : "ghost"}
            pressed={listening}
            ariaLabel={listening ? "Stop listening" : "Start speaking"}
            onClick={toggleMic}
            className={!callActive || aiSpeaking ? "opacity-40 cursor-not-allowed" : ""}
          >
            {listening ? <MicOffIcon /> : <MicIcon />}
          </IconButton>

          {/* Start / End call */}
          {!callActive ? (
            <button
              onClick={startCall}
              className="flex items-center gap-1.5 rounded-md bg-emerald-600 hover:bg-emerald-700 dark:bg-emerald-500 dark:hover:bg-emerald-600 px-3.5 py-2 text-xs font-semibold text-white transition-colors"
            >
              Start Interview
            </button>
          ) : (
            <IconButton kind="danger" ariaLabel="End interview" onClick={endCall}>
              <PhoneOffIcon />
            </IconButton>
          )}
        </div>
      </div>
    </section>
  );
};

export default VoiceInterface;


