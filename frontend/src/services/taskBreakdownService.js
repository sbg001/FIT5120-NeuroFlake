const TASK_BREAKDOWN_API_URL =
  import.meta.env.VITE_TASK_BREAKDOWN_API_URL ||
  "http://localhost:8000/api/breakdown-task";

function getShortStepTitle(description, index) {
  const cleanDescription = String(description || "").trim();
  if (!cleanDescription) {
    return `Step ${index + 1}`;
  }

  const firstSentence = cleanDescription.split(/[.!?]/)[0].trim();
  return firstSentence.length > 40
    ? `${firstSentence.slice(0, 37).trim()}...`
    : firstSentence;
}

function normalizeGeneratedSteps(steps) {
  return steps
    .slice(0, 5)
    .map((step, index) => {
      const description =
        step.step_description || step.description || step.step_title || "";

      return {
        step_order: Number(step.step_number || step.step_order || index + 1),
        step_title:
          step.step_title ||
          step.title ||
          getShortStepTitle(description, index),
        step_description: description,
        visual_hint: step.visual_hint || "",
        example_text: step.example_text || "",
        is_completed: false,
        completed_at: null,
      };
    })
    .filter((step) => step.step_title && step.step_description);
}

function buildFallbackSteps(taskTitle, taskDescription) {
  const taskName = String(taskTitle || "the task").trim();
  const details = String(taskDescription || "").trim();

  return [
    {
      step_order: 1,
      step_title: "Get ready",
      step_description: `Look at ${taskName} and get what you need.`,
    },
    {
      step_order: 2,
      step_title: "Start small",
      step_description: details
        ? `Do the first small part: ${details}`
        : `Do one small part of ${taskName}.`,
    },
    {
      step_order: 3,
      step_title: "Check your work",
      step_description: `Look at what you have done for ${taskName}.`,
    },
    {
      step_order: 4,
      step_title: "Finish",
      step_description: `Put things away and say ${taskName} is done.`,
    },
  ];
}

export async function generateTaskSteps(taskTitle, taskDescription) {
  const taskName = [taskTitle, taskDescription].filter(Boolean).join(": ");

  try {
    const response = await fetch(TASK_BREAKDOWN_API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ task_name: taskName }),
    });

    if (!response.ok) {
      throw new Error("Task helper request failed.");
    }

    const data = await response.json();
    const generatedSteps = normalizeGeneratedSteps(data.steps || []);

    if (generatedSteps.length >= 2 && generatedSteps.length <= 5) {
      return {
        data: generatedSteps,
        usedFallback: false,
        error: null,
      };
    }
  } catch (error) {
    console.warn("Task helper unavailable. Using local fallback steps.", error);
  }

  return {
    data: buildFallbackSteps(taskTitle, taskDescription),
    usedFallback: true,
    error: null,
  };
}
