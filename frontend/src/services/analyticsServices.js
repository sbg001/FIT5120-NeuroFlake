// services/mlService.js

export const getSensoryRiskPrediction = async (telemetryData) => {
  try {
    const response = await fetch("http://localhost:8000/api/predict-risk", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        hours_slept: telemetryData.hoursSlept,
        overwhelmed_count: telemetryData.overwhelmedCount,
        tasks_abandoned: telemetryData.tasksAbandoned,
        tasks_completed: telemetryData.tasksCompleted
      }),
    });
    
    if (!response.ok) throw new Error("ML Engine offline");
    return await response.json();
  } catch (error) {
    console.error("Failed to fetch risk prediction:", error);
    return null;
  }
};