const SAVED_BOARDS_KEY = "sketchflow-saved-boards";
const savedGrid = document.querySelector("#savedGrid");

function getSavedBoards() {
  return JSON.parse(localStorage.getItem(SAVED_BOARDS_KEY) || "[]");
}

function saveBoards(boards) {
  localStorage.setItem(SAVED_BOARDS_KEY, JSON.stringify(boards));
}

function formatDate(value) {
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium",
    timeStyle: "short"
  }).format(new Date(value));
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function fileName(value) {
  return String(value || "sketchflow-board").replace(/[\\/:*?"<>|]+/g, "-");
}

function renderBoards() {
  const boards = getSavedBoards();
  savedGrid.innerHTML = "";

  if (!boards.length) {
    savedGrid.innerHTML = `
      <div class="empty-state">
        <h2>No saved boards yet</h2>
        <p>Create something on the whiteboard, press Save Board, and it will appear here.</p>
        <a class="button" href="whiteboard.html">Open Whiteboard</a>
      </div>
    `;
    return;
  }

  boards.forEach((board) => {
    const title = escapeHtml(board.title || "Untitled board");
    const card = document.createElement("article");
    card.className = "saved-card";
    card.innerHTML = `
      <img src="${board.image}" alt="${title} preview">
      <div class="saved-card-body">
        <h2>${title}</h2>
        <p>Saved ${formatDate(board.savedAt)}</p>
        <div class="saved-actions">
          <a href="whiteboard.html?board=${encodeURIComponent(board.id)}">Open</a>
          <a href="${board.image}" download="${fileName(board.title)}.png">PNG</a>
          <button class="delete-board" type="button">Delete</button>
        </div>
      </div>
    `;

    card.querySelector(".delete-board").addEventListener("click", () => {
      const remaining = getSavedBoards().filter((item) => item.id !== board.id);
      saveBoards(remaining);
      renderBoards();
    });

    savedGrid.appendChild(card);
  });
}

renderBoards();
