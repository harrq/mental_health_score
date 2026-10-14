const API_URL = "https://mental-health-score-1y50.onrender.com";

const form = document.getElementById("predictionForm");
const submitButton = document.getElementById("submitButton");
const errorMessage = document.getElementById("errorMessage");
const emptyResult = document.getElementById("emptyResult");
const loadingResult = document.getElementById("loadingResult");
const successResult = document.getElementById("successResult");
const resultStatus = document.getElementById("resultStatus");
const scoreValue = document.getElementById("scoreValue");
const progressBar = document.getElementById("progressBar");
const progressText = document.getElementById("progressText");

const requiredFields = [...form.querySelectorAll("input[required], select[required]")];

function updateProgress() {
  const completed = requiredFields.filter((field) => String(field.value).trim() !== "").length;
  const percentage = Math.round((completed / requiredFields.length) * 100);
  progressBar.style.width = `${percentage}%`;
  progressText.textContent = `${percentage}% complete`;
}

function showError(message) {
  errorMessage.textContent = message;
  errorMessage.hidden = false;
}

function clearError() {
  errorMessage.textContent = "";
  errorMessage.hidden = true;
}

function showView(view) {
  emptyResult.hidden = view !== "empty";
  loadingResult.hidden = view !== "loading";
  successResult.hidden = view !== "success";
}

function setLoading(isLoading) {
  submitButton.disabled = isLoading;
  submitButton.classList.toggle("is-loading", isLoading);
  submitButton.querySelector(".button-label").textContent =
    isLoading ? "Generating prediction…" : "Generate my score";
  submitButton.setAttribute("aria-busy", String(isLoading));
}

function validateClientSide() {
  let firstInvalid = null;

  requiredFields.forEach((field) => {
    field.classList.remove("invalid");
    if (!field.checkValidity() || String(field.value).trim() === "") {
      field.classList.add("invalid");
      firstInvalid ||= field;
    }
  });

  if (firstInvalid) {
    firstInvalid.focus();
    showError("Please complete all fields with valid values before continuing.");
    return false;
  }

  const numberRules = [
    ["Age", 10, 90, "Age must be between 10 and 90."],
    ["Avg_Daily_Usage_Hours", 0, 24, "Social media usage must be between 0 and 24 whole hours."],
    ["Daily_Unlocks", 0, Number.MAX_SAFE_INTEGER, "Daily app unlocks cannot be negative."],
    ["Study_Hours", 0, 24, "Study hours must be between 0 and 24."],
    ["Physical_Activity_Hours", 0, 24, "Physical activity hours must be between 0 and 24."],
    ["Sleep_Hours_Per_Night", 0, 24, "Sleep hours must be between 0 and 24."]
  ];

  for (const [name, min, max, message] of numberRules) {
    const field = form.elements[name];
    const value = Number(field.value);
    if (!Number.isFinite(value) || value < min || value > max) {
      field.classList.add("invalid");
      field.focus();
      showError(message);
      return false;
    }
  }

  return true;
}

function buildPayload() {
  const formData = new FormData(form);
  return {
    Age: Number(formData.get("Age")),
    Gender: formData.get("Gender"),
    Academic_Level: formData.get("Academic_Level"),
    Most_Used_Platform: formData.get("Most_Used_Platform"),
    Purpose_Of_Use: formData.get("Purpose_Of_Use"),
    Avg_Daily_Usage_Hours: Number(formData.get("Avg_Daily_Usage_Hours")),
    Daily_Unlocks: Number(formData.get("Daily_Unlocks")),
    Study_Hours: Number(formData.get("Study_Hours")),
    Physical_Activity_Hours: Number(formData.get("Physical_Activity_Hours")),
    Sleep_Hours_Per_Night: Number(formData.get("Sleep_Hours_Per_Night")),
    Stress_Level: formData.get("Stress_Level"),
    top_country: formData.get("top_country")
  };
}

function friendlyApiError(status, detail) {
  if (status === 422) {
    if (Array.isArray(detail)) {
      const messages = detail.map((item) => {
        const field = Array.isArray(item.loc) ? item.loc[item.loc.length - 1] : "input";
        return `${field}: ${item.msg || "Invalid value"}`;
      });
      return `Some values were rejected by the API. ${messages.join(" · ")}`;
    }
    return "The API could not validate these inputs. Please review your entries and try again.";
  }
  if (status >= 500) return "The prediction service encountered a server error. Check that the model loaded correctly, then try again.";
  return `The prediction request failed (HTTP ${status}). Please check the inputs and try again.`;
}

requiredFields.forEach((field) => {
  field.addEventListener("input", () => {
    field.classList.remove("invalid");
    clearError();
    updateProgress();
  });
  field.addEventListener("change", () => {
    field.classList.remove("invalid");
    clearError();
    updateProgress();
  });
});

form.addEventListener("submit", async (event) => {
  event.preventDefault();
  clearError();

  if (!validateClientSide()) return;

  setLoading(true);
  showView("loading");
  resultStatus.textContent = "PREDICTING";

  try {
    const response = await fetch("https://mental-health-score-1y50.onrender.com/predict", {
      method: "POST",
      headers: { "Content-Type": "application/json", "Accept": "application/json" },
      body: JSON.stringify(buildPayload())
    });

    let result;
    try {
      result = await response.json();
    } catch {
      throw new Error("The API returned an unreadable response. Please try again.");
    }

    if (!response.ok) {
      throw new Error(friendlyApiError(response.status, result.detail));
    }

    if (typeof result.prediction !== "number" || !Number.isFinite(result.prediction)) {
      throw new Error("The API response did not contain a valid numeric prediction.");
    }

    scoreValue.textContent = result.prediction.toFixed(2);
    showView("success");
    resultStatus.textContent = "COMPLETE";
  } catch (error) {
    showView("empty");
    resultStatus.textContent = "NEEDS ATTENTION";

    if (error instanceof TypeError) {
      showError("Could not connect to the prediction API. Make sure FastAPI is running at http://127.0.0.1:8000. If this page is served from another port, your browser may also block the request because CORS is not enabled in the unchanged backend.");
    } else {
      showError(error.message || "Something went wrong. Please try again.");
    }
  } finally {
    setLoading(false);
  }
});

document.getElementById("editAnswers").addEventListener("click", () => {
  document.getElementById("assessment").scrollIntoView({ behavior: "smooth", block: "start" });
  form.elements.Age.focus({ preventScroll: true });
});

updateProgress();
