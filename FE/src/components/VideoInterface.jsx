import React, { useState, useEffect, useRef, useCallback } from "react";
import { IconButton, MicIcon, MicOffIcon, PhoneOffIcon } from "./InterviewUICommon";
import api from "../lib/api";

const WAVE_HEIGHTS = [10, 16, 22, 14, 18];

const VoiceInterface = ({ selectedJob, onCallEnd }) => {
  const [callActive, setCallActive] = useState(false);
  const [listening, setListening] = useState(false);
  const [aiSpeaking, setAiSpeaking] = useState(false);
  const [statusText, setStatusText] = useState("Select a job and start the interview");
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
      setStatusText("AI is thinking...");
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

        setStatusText("AI is speaking...");
        speak(aiReply, () => {
          if (callActiveRef.current) {
            setStatusText("Your turn — click mic to speak");
          }
        });
      } catch (err) {
        console.error("AI error:", err);
        const is429 = err.response?.status === 429;
        setStatusText(is429 ? "AI quota exceeded. Please try again later." : "Error reaching AI. Try again.");
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
      alert("Speech recognition not supported. Use Chrome.");
      return null;
    }
    const rec = new SpeechRecognition();
    rec.continuous = false;
    rec.interimResults = false;
    rec.lang = "en-US";

    rec.onresult = (e) => {
      const said = e.results[0][0].transcript;
      setListening(false);
      setStatusText(`You said: "${said}"`);
      sendToAI(said);
    };
    rec.onerror = () => {
      setListening(false);
      setStatusText("Mic error. Try again.");
    };
    rec.onend = () => setListening(false);
    return rec;
  }, [sendToAI]);

  // Start call — AI greets first
  const startCall = useCallback(async () => {
    if (!selectedJob) {
      setStatusText("Please select a job first from the Applied Jobs tab.");
      return;
    }
    callActiveRef.current = true;
    setCallActive(true);
    historyRef.current = [];
    setTranscript([]);
    setQuestions([]);
    setStatusText("Starting interview...");
    await sendToAI("Hello, I am ready for the interview.");
  }, [selectedJob, sendToAI]);

  // Toggle mic
  const toggleMic = useCallback(() => {
    if (!callActive) return;
    if (aiSpeaking) return;

    if (listening) {
      recognitionRef.current?.stop();
      setListening(false);
      setStatusText("Your turn — click mic to speak");
    } else {
      const rec = setupRecognition();
      if (!rec) return;
      recognitionRef.current = rec;
      rec.start();
      setListening(true);
      setStatusText("Listening...");
    }
  }, [callActive, aiSpeaking, listening, setupRecognition]);

  // End call — generate summary
  const endCall = useCallback(async () => {
    callActiveRef.current = false;
    setCallActive(false);
    setListening(false);
    synthRef.current.cancel();
    recognitionRef.current?.stop();
    setStatusText("Generating summary...");

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
        summary: "Summary could not be generated.",
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
    <section className="overflow-hidden rounded-3xl bg-white shadow-lg shadow-slate-200/70">
      {/* AI Avatar area */}
      <div className="relative flex flex-col items-center justify-center h-64 md:h-80 bg-gradient-to-br from-[#eef2ff] to-[#f5f3ff]">
        {/* AI avatar */}
        <div
          className={`flex h-24 w-24 items-center justify-center rounded-full bg-[#4f46e5] text-white text-3xl font-bold shadow-xl transition-all duration-300 ${
            aiSpeaking ? "ring-4 ring-[#4f46e5]/40 scale-110" : ""
          }`}
        >
          AI
        </div>
        <p className="mt-4 text-sm font-medium text-slate-700">
          {selectedJob ? `${selectedJob.job_title} @ ${selectedJob.company_name}` : "No job selected"}
        </p>

        {/* Status badge */}
        <div className="mt-3 flex items-center gap-2 rounded-full bg-white/80 border border-slate-200 px-4 py-1.5 text-xs text-slate-600 shadow-sm">
          <span
            className={`h-2 w-2 rounded-full ${
              listening
                ? "bg-red-500 animate-pulse"
                : aiSpeaking
                ? "bg-emerald-500 animate-pulse"
                : callActive
                ? "bg-blue-400"
                : "bg-slate-300"
            }`}
          />
          {statusText}
        </div>

        {/* Listening wave indicator */}
        {listening && (
          <div className="mt-3 flex items-end gap-1 h-6">
            {[1, 2, 3, 4, 5].map((i) => (
              <span
                key={i}
                className="w-1 rounded-full bg-[#4f46e5]"
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
      <div className="flex items-center justify-between border-t border-slate-100 bg-slate-50 px-6 py-4">
        <div className="flex items-center gap-2 text-xs text-slate-500">
          {callActive ? (
            <>
              <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
              Interview in progress
            </>
          ) : (
            <>
              <span className="h-2 w-2 rounded-full bg-slate-300" />
              Not started
            </>
          )}
        </div>

        <div className="flex items-center gap-3">
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
              className="flex items-center gap-2 rounded-full bg-[#4f46e5] px-5 py-2 text-sm font-medium text-white shadow hover:bg-[#4338ca] transition-colors"
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
