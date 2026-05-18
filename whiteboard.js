const canvas = document.querySelector("#whiteboardCanvas");
const ctx = canvas.getContext("2d");
const notesLayer = document.querySelector("#notesLayer");
const textInput = document.querySelector("#textInput");
const colorPicker = document.querySelector("#colorPicker");
const brushSize = document.querySelector("#brushSize");
const brushValue = document.querySelector("#brushValue");
const toolStatus = document.querySelector("#toolStatus");
const sizeStatus = document.querySelector("#sizeStatus");
const objectStatus = document.querySelector("#objectStatus");
const userBadge = document.querySelector("#userBadge");
const boardTitle = document.querySelector("#boardTitle");
const SAVED_BOARDS_KEY = "sketchflow-saved-boards";
const session = JSON.parse(localStorage.getItem("sketchflow-session") || "null");
const boardColors = {
  white: "#ffffff",
  cream: "#fff7df",
  midnight: "#111827",
  mint: "#ecfdf5"
};
const boardSettings = typeof getSketchflowSettings === "function" ? getSketchflowSettings() : {
  boardTheme: "white",
  defaultColor: "#2563eb",
  defaultBrushSize: 8,
  autoSave: false
};

if (!session || !session.email) {
  window.location.href = "login.html?message=login-required";
}

const state = {
  tool: "pen",
  color: boardSettings.defaultColor,
  size: Number(boardSettings.defaultBrushSize),
  drawing: false,
  startX: 0,
  startY: 0,
  lastX: 0,
  lastY: 0,
  objects: 0,
  history: [],
  redo: [],
  snapshot: null,
  currentBoardId: null,
  pendingBoard: null
};

colorPicker.value = state.color;
brushSize.value = state.size;

function getSavedBoards() {
  return JSON.parse(localStorage.getItem(SAVED_BOARDS_KEY) || "[]");
}

function saveBoards(boards) {
  localStorage.setItem(SAVED_BOARDS_KEY, JSON.stringify(boards));
}

function loadSession() {
  if (session && session.name) {
    userBadge.textContent = session.name;
  }
}

function resizeCanvas() {
  const hadHistory = state.history.length > 0;
  const image = ctx.getImageData(0, 0, canvas.width || 1, canvas.height || 1);
  const rect = canvas.parentElement.getBoundingClientRect();
  canvas.width = Math.max(320, Math.floor(rect.width));
  canvas.height = Math.max(320, Math.floor(rect.height));
  redrawBase();
  if (hadHistory && image.width > 1 && image.height > 1) {
    ctx.putImageData(image, 0, 0);
  }
  if (state.history.length === 0) {
    saveHistory();
  }
  if (state.pendingBoard) {
    loadBoardData(state.pendingBoard);
    state.pendingBoard = null;
  }
}

function redrawBase() {
  ctx.fillStyle = boardColors[boardSettings.boardTheme] || "#ffffff";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
}

function autoSaveBoard() {
  if (!boardSettings.autoSave) return;
  saveCurrentBoard(true);
}

function saveHistory() {
  state.history.push(canvas.toDataURL("image/png"));
  if (state.history.length > 40) {
    state.history.shift();
  }
  state.redo = [];
}

function restoreFrom(dataUrl) {
  const image = new Image();
  image.onload = () => {
    redrawBase();
    ctx.drawImage(image, 0, 0, canvas.width, canvas.height);
  };
  image.src = dataUrl;
}

function updateStatus() {
  const label = state.tool.charAt(0).toUpperCase() + state.tool.slice(1);
  toolStatus.textContent = label;
  sizeStatus.textContent = `${state.size} px`;
  brushValue.textContent = state.size;
  objectStatus.textContent = String(state.objects + notesLayer.children.length);
}

function getPoint(event) {
  const rect = canvas.getBoundingClientRect();
  const pointer = event.touches ? event.touches[0] : event;
  return {
    x: pointer.clientX - rect.left,
    y: pointer.clientY - rect.top
  };
}

function setTool(tool) {
  state.tool = tool;
  document.querySelectorAll("[data-tool]").forEach((button) => {
    button.classList.toggle("active", button.dataset.tool === tool);
  });
  updateStatus();
}

function beginDraw(event) {
  if (state.tool === "text") {
    event.preventDefault();
    placeTextInput(event);
    return;
  }

  const point = getPoint(event);
  state.drawing = true;
  state.startX = point.x;
  state.startY = point.y;
  state.lastX = point.x;
  state.lastY = point.y;
  state.snapshot = ctx.getImageData(0, 0, canvas.width, canvas.height);

  if (state.tool === "pen" || state.tool === "eraser") {
    ctx.beginPath();
    ctx.moveTo(point.x, point.y);
  }
}

function draw(event) {
  if (!state.drawing) return;
  event.preventDefault();
  const point = getPoint(event);

  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  ctx.lineWidth = state.size;

  if (state.tool === "pen" || state.tool === "eraser") {
    ctx.strokeStyle = state.tool === "eraser" ? boardColors[boardSettings.boardTheme] || "#ffffff" : state.color;
    ctx.lineTo(point.x, point.y);
    ctx.stroke();
    state.lastX = point.x;
    state.lastY = point.y;
    return;
  }

  ctx.putImageData(state.snapshot, 0, 0);
  drawPreviewShape(point.x, point.y);
}

function endDraw() {
  if (!state.drawing) return;
  state.drawing = false;
  state.objects += 1;
  saveHistory();
  autoSaveBoard();
  updateStatus();
}

function drawPreviewShape(x, y) {
  ctx.save();
  ctx.strokeStyle = state.color;
  ctx.lineWidth = state.size;
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  ctx.beginPath();

  if (state.tool === "line") {
    ctx.moveTo(state.startX, state.startY);
    ctx.lineTo(x, y);
  }

  if (state.tool === "rect") {
    ctx.rect(state.startX, state.startY, x - state.startX, y - state.startY);
  }

  if (state.tool === "circle") {
    const radius = Math.hypot(x - state.startX, y - state.startY);
    ctx.arc(state.startX, state.startY, radius, 0, Math.PI * 2);
  }

  ctx.stroke();
  ctx.restore();
}

function placeTextInput(event) {
  commitText();
  const point = getPoint(event);
  textInput.style.display = "block";
  textInput.style.left = `${point.x}px`;
  textInput.style.top = `${point.y}px`;
  textInput.value = "";
  requestAnimationFrame(() => textInput.focus());
}

function commitText() {
  const text = textInput.value.trim();
  if (!text) {
    textInput.style.display = "none";
    return;
  }

  const x = parseFloat(textInput.style.left);
  const y = parseFloat(textInput.style.top);
  ctx.save();
  ctx.fillStyle = state.color;
  ctx.font = `${Math.max(16, state.size * 3)}px Inter, sans-serif`;
  ctx.textBaseline = "top";
  ctx.fillText(text, x, y);
  ctx.restore();

  textInput.style.display = "none";
  state.objects += 1;
  saveHistory();
  autoSaveBoard();
  updateStatus();
}

function addNote() {
  createNote("New idea...", 80 + notesLayer.children.length * 24, 60 + notesLayer.children.length * 24);
  updateStatus();
}

function createNote(text, left, top) {
  const note = document.createElement("div");
  note.className = "note";
  note.style.left = `${left}px`;
  note.style.top = `${top}px`;
  note.innerHTML = '<button type="button" aria-label="Delete note">x</button><textarea></textarea>';
  note.querySelector("textarea").value = text;
  notesLayer.appendChild(note);

  const remove = note.querySelector("button");
  remove.addEventListener("pointerdown", (event) => {
    event.stopPropagation();
  });
  remove.addEventListener("click", (event) => {
    event.stopPropagation();
    note.remove();
    autoSaveBoard();
    updateStatus();
  });

  makeNoteDraggable(note);
  return note;
}

function makeNoteDraggable(note) {
  let moving = false;
  let offsetX = 0;
  let offsetY = 0;

  note.addEventListener("pointerdown", (event) => {
    const topEdge = event.offsetY <= 32;
    if (!topEdge) return;
    moving = true;
    note.setPointerCapture(event.pointerId);
    offsetX = event.offsetX;
    offsetY = event.offsetY;
  });

  note.addEventListener("pointermove", (event) => {
    if (!moving) return;
    const rect = notesLayer.getBoundingClientRect();
    note.style.left = `${event.clientX - rect.left - offsetX}px`;
    note.style.top = `${event.clientY - rect.top - offsetY}px`;
  });

  note.addEventListener("pointerup", () => {
    moving = false;
    autoSaveBoard();
  });
}

document.querySelectorAll("[data-tool]").forEach((button) => {
  button.addEventListener("click", () => setTool(button.dataset.tool));
});

colorPicker.addEventListener("input", () => {
  state.color = colorPicker.value;
});

brushSize.addEventListener("input", () => {
  state.size = Number(brushSize.value);
  updateStatus();
});

document.querySelector("#undoBtn").addEventListener("click", () => {
  if (state.history.length <= 1) return;
  state.redo.push(state.history.pop());
  restoreFrom(state.history[state.history.length - 1]);
});

document.querySelector("#redoBtn").addEventListener("click", () => {
  if (!state.redo.length) return;
  const item = state.redo.pop();
  state.history.push(item);
  restoreFrom(item);
});

document.querySelector("#clearBtn").addEventListener("click", () => {
  redrawBase();
  notesLayer.replaceChildren();
  state.objects = 0;
  saveHistory();
  autoSaveBoard();
  updateStatus();
});

document.querySelector("#noteBtn").addEventListener("click", addNote);

function saveCurrentBoard(isAuto = false) {
  const notes = Array.from(notesLayer.querySelectorAll(".note")).map((note) => ({
    left: parseFloat(note.style.left) || 0,
    top: parseFloat(note.style.top) || 0,
    text: note.querySelector("textarea").value
  }));
  const boards = getSavedBoards();
  const id = state.currentBoardId || `board-${Date.now()}`;
  const savedAt = new Date().toISOString();
  const board = {
    id,
    title: boardTitle.value.trim() || "Untitled board",
    image: canvas.toDataURL("image/png"),
    notes,
    savedAt,
    objects: state.objects
  };
  const index = boards.findIndex((item) => item.id === id);

  if (index >= 0) {
    boards[index] = board;
  } else {
    boards.unshift(board);
  }

  state.currentBoardId = id;
  saveBoards(boards);
  if (!isAuto) {
    document.querySelector("#saveBtn").textContent = "Saved";
    setTimeout(() => {
      document.querySelector("#saveBtn").textContent = "Save Board";
    }, 1000);
  }
}

document.querySelector("#saveBtn").addEventListener("click", () => {
  saveCurrentBoard();
});

document.querySelector("#exportBtn").addEventListener("click", () => {
  const link = document.createElement("a");
  link.download = "sketchflow-board.png";
  link.href = canvas.toDataURL("image/png");
  link.click();
});

document.querySelector("#imageLoader").addEventListener("change", (event) => {
  const file = event.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = () => {
    const image = new Image();
    image.onload = () => {
      const scale = Math.min(canvas.width / image.width, canvas.height / image.height);
      const width = image.width * scale;
      const height = image.height * scale;
      const x = (canvas.width - width) / 2;
      const y = (canvas.height - height) / 2;
      ctx.drawImage(image, x, y, width, height);
      state.objects += 1;
      saveHistory();
      autoSaveBoard();
      updateStatus();
    };
    image.src = reader.result;
  };
  reader.readAsDataURL(file);
});

canvas.addEventListener("pointerdown", beginDraw);
canvas.addEventListener("pointermove", draw);
canvas.addEventListener("pointerup", endDraw);
canvas.addEventListener("pointerleave", endDraw);

textInput.addEventListener("keydown", (event) => {
  if (event.key === "Enter") {
    event.preventDefault();
    commitText();
  }
  if (event.key === "Escape") {
    textInput.style.display = "none";
  }
});
textInput.addEventListener("pointerdown", (event) => {
  event.stopPropagation();
});

document.addEventListener("pointerdown", (event) => {
  const isTextInputOpen = textInput.style.display === "block";
  const clickedTextInput = event.target === textInput;
  const clickedCanvas = event.target === canvas;

  if (isTextInputOpen && !clickedTextInput && !clickedCanvas) {
    commitText();
  }
});

window.addEventListener("resize", resizeCanvas);

function loadBoardFromUrl() {
  const params = new URLSearchParams(window.location.search);
  const id = params.get("board");
  if (!id) return;
  const board = getSavedBoards().find((item) => item.id === id);
  if (!board) return;
  state.currentBoardId = board.id;
  state.pendingBoard = board;
}

function loadBoardData(board) {
  boardTitle.value = board.title || "Untitled board";
  notesLayer.replaceChildren();

  const image = new Image();
  image.onload = () => {
    redrawBase();
    ctx.drawImage(image, 0, 0, canvas.width, canvas.height);
    state.history = [];
    state.redo = [];
    saveHistory();
  };
  image.src = board.image;

  (board.notes || []).forEach((note) => {
    createNote(note.text || "", note.left || 80, note.top || 60);
  });
  state.objects = board.objects || 0;
  updateStatus();
}

loadSession();
loadBoardFromUrl();
resizeCanvas();
updateStatus();
