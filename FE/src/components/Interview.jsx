import React, { useState } from "react";
import VoiceInterface from "./VideoInterface";
import InterviewSummary from "./InterviewSummary";
import QuestionList from "./QuestionList";

const Interview = () => {
  const [selectedJob, setSelectedJob] = useState(null);
  const [summaryData, setSummaryData] = useState(null);
  const [questions, setQuestions] = useState([]);

  const handleCallEnd = (data) => {
    setSummaryData(data);
    // Build question list from transcript (model turns = questions asked)
    const aiTurns = data.transcript
      .filter((t) => t.role === "model")
      .map((t, i) => ({
        id: String(i + 1).padStart(2, "0"),
        title: t.text,
        answered: true,
      }));
    setQuestions(aiTurns);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#f3f4ff] via-[#f6f7ff] to-[#e9f0ff] px-4 py-6 md:px-8 lg:px-6 lg:py-5 text-slate-900">
      <div className="mx-auto flex max-w-6xl flex-col gap-6 lg:grid lg:grid-cols-[2fr,1.05fr]">
        {/* Left column: voice interface + summary */}
        <div className="flex flex-col gap-4">
          <VoiceInterface
            selectedJob={selectedJob}
            onCallEnd={handleCallEnd}
          />
          <InterviewSummary summaryData={summaryData} />
        </div>

        {/* Right column: job selector + question list */}
        <QuestionList
          questions={questions}
          selectedJob={selectedJob}
          onJobSelect={setSelectedJob}
        />
      </div>
    </div>
  );
};

export default Interview;
