const SESSION_KEY = "sketchflow-session";
const SAVED_BOARDS_KEY = "sketchflow-saved-boards";

const session = JSON.parse(localStorage.getItem(SESSION_KEY) || "null");
const boards = JSON.parse(localStorage.getItem(SAVED_BOARDS_KEY) || "[]");

const profileName = document.querySelector("#profileName");
const profileEmail = document.querySelector("#profileEmail");
const profileAvatar = document.querySelector("#profileAvatar");
const profileBoards = document.querySelector("#profileBoards");
const profileStatus = document.querySelector("#profileStatus");
const logoutBtn = document.querySelector("#logoutBtn");

if (session && session.email) {
  const initials = session.name
    .split(" ")
    .map((part) => part.charAt(0))
    .join("")
    .slice(0, 2)
    .toUpperCase();

  profileName.textContent = session.name;
  profileEmail.textContent = session.email;
  profileAvatar.textContent = initials || "SF";
  profileStatus.textContent = "Logged in";
} else {
  profileName.textContent = "Guest";
  profileEmail.textContent = "Please login or register to use the whiteboard.";
  profileAvatar.textContent = "SF";
  profileStatus.textContent = "Guest";
}

profileBoards.textContent = String(boards.length);

logoutBtn.addEventListener("click", () => {
  localStorage.removeItem(SESSION_KEY);
  window.location.href = "login.html";
});
