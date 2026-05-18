const settings = getSketchflowSettings();
const message = document.querySelector("#settingsMessage");
const defaultColor = document.querySelector("#defaultColor");
const defaultBrushSize = document.querySelector("#defaultBrushSize");
const defaultBrushValue = document.querySelector("#defaultBrushValue");
const autoSave = document.querySelector("#autoSave");
const largeText = document.querySelector("#largeText");

function showMessage(text, isError = false) {
  message.textContent = text;
  message.classList.toggle("error", isError);
}

function refreshActiveButtons() {
  document.querySelectorAll(".theme-options").forEach((group) => {
    const setting = group.dataset.setting;
    group.querySelectorAll(".theme-choice").forEach((button) => {
      button.classList.toggle("active", button.dataset.value === getSketchflowSettings()[setting]);
    });
  });
}

defaultColor.value = settings.defaultColor;
defaultBrushSize.value = settings.defaultBrushSize;
defaultBrushValue.textContent = `${settings.defaultBrushSize} px`;
autoSave.checked = settings.autoSave;
largeText.checked = settings.largeText;
refreshActiveButtons();

document.querySelectorAll(".theme-choice").forEach((button) => {
  button.addEventListener("click", () => {
    const setting = button.closest(".theme-options").dataset.setting;
    saveSketchflowSettings({ [setting]: button.dataset.value });
    refreshActiveButtons();
    showMessage("Settings updated.");
  });
});

defaultColor.addEventListener("input", () => {
  saveSketchflowSettings({ defaultColor: defaultColor.value });
  showMessage("Default color saved.");
});

defaultBrushSize.addEventListener("input", () => {
  const size = Number(defaultBrushSize.value);
  defaultBrushValue.textContent = `${size} px`;
  saveSketchflowSettings({ defaultBrushSize: size });
  showMessage("Default brush size saved.");
});

autoSave.addEventListener("change", () => {
  saveSketchflowSettings({ autoSave: autoSave.checked });
  showMessage(autoSave.checked ? "Autosave enabled." : "Autosave disabled.");
});

largeText.addEventListener("change", () => {
  saveSketchflowSettings({ largeText: largeText.checked });
  showMessage("Toolbar text preference saved.");
});

document.querySelector("#resetSettings").addEventListener("click", () => {
  localStorage.setItem(SKETCHFLOW_SETTINGS_KEY, JSON.stringify(defaultSketchflowSettings));
  window.location.reload();
});

document.querySelector("#clearSavedBoards").addEventListener("click", () => {
  localStorage.removeItem("sketchflow-saved-boards");
  showMessage("Saved boards cleared.");
});
