import { useEffect, useState } from "react";
import { getCurrentFocusSession, getCurrentFocusStep } from "../services";

function FocusMode() {
  const [focusSession, setFocusSession] = useState(null);
  const [currentStep, setCurrentStep] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadFocusData() {
      setLoading(true);

      const sessionResult = await getCurrentFocusSession(1);
      const sessionData = sessionResult.data;

      setFocusSession(sessionData);

      if (sessionData) {
        const stepResult = await getCurrentFocusStep(
          sessionData.task_id,
          sessionData.current_step_id
        );
        setCurrentStep(stepResult.data);
      } else {
        setCurrentStep(null);
      }

      setLoading(false);
    }

    loadFocusData();
  }, []);

  if (loading) {
    return (
      <section className="page-section">
        <p className="page-text">Loading focus mode...</p>
      </section>
    );
  }

  return (
    <section className="page-section">
      <div className="section-header">
        <p className="eyebrow">Focus Mode</p>
        <h2 className="page-title">A calm task space will live here</h2>
        <p className="page-text">
          This page will later support distraction-free viewing, pace control,
          timer support, calming tools, and white noise.
        </p>
      </div>

      <div className="content-card">
        <h3>Focus shell ready</h3>
        {focusSession && currentStep ? (
          <>
            <p>Current task ID: {focusSession.task_id}</p>
            <p>Current step: {currentStep.step_title}</p>
            <p>{currentStep.step_description}</p>
          </>
        ) : (
          <p>Feature logic will be added later</p>
        )}
      </div>
    </section>
  );
}

export default FocusMode;