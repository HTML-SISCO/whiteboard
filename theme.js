const SKETCHFLOW_SETTINGS_KEY = "sketchflow-settings";

const defaultSketchflowSettings = {
  siteTheme: "light",
  boardTheme: "white",
  defaultColor: "#2563eb",
  defaultBrushSize: 8,
  autoSave: false,
  largeText: false
};

function getSketchflowSettings() {
  return {
    ...defaultSketchflowSettings,
    ...JSON.parse(localStorage.getItem(SKETCHFLOW_SETTINGS_KEY) || "{}")
  };
}

function saveSketchflowSettings(settings) {
  localStorage.setItem(SKETCHFLOW_SETTINGS_KEY, JSON.stringify({
    ...getSketchflowSettings(),
    ...settings
  }));
  applySketchflowSettings();
}

function applySketchflowSettings() {
  const settings = getSketchflowSettings();
  document.documentElement.dataset.theme = settings.siteTheme;
  document.documentElement.dataset.boardTheme = settings.boardTheme;
  document.documentElement.classList.toggle("large-ui", settings.largeText);
}

applySketchflowSettings();
