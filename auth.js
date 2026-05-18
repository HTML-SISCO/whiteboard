const USERS_KEY = "sketchflow-users";
const SESSION_KEY = "sketchflow-session";

function getUsers() {
  return JSON.parse(localStorage.getItem(USERS_KEY) || "[]");
}

function saveUsers(users) {
  localStorage.setItem(USERS_KEY, JSON.stringify(users));
}

function setMessage(element, text, isError = false) {
  if (!element) return;
  element.textContent = text;
  element.classList.toggle("error", isError);
}

const registerForm = document.querySelector("#registerForm");
const loginNotice = new URLSearchParams(window.location.search).get("message");

if (loginNotice === "login-required") {
  setMessage(document.querySelector("#loginMessage"), "Please login before opening the whiteboard.", true);
}

if (registerForm) {
  registerForm.addEventListener("submit", (event) => {
    event.preventDefault();

    const name = document.querySelector("#registerName").value.trim();
    const email = document.querySelector("#registerEmail").value.trim().toLowerCase();
    const password = document.querySelector("#registerPassword").value;
    const message = document.querySelector("#registerMessage");
    const users = getUsers();

    if (users.some((user) => user.email === email)) {
      setMessage(message, "That email is already registered.", true);
      return;
    }

    const user = { name, email, password };
    users.push(user);
    saveUsers(users);
    localStorage.setItem(SESSION_KEY, JSON.stringify({ name, email }));
    setMessage(message, "Account created. Opening your whiteboard...");

    setTimeout(() => {
      window.location.href = "whiteboard.html";
    }, 700);
  });
}

const loginForm = document.querySelector("#loginForm");
if (loginForm) {
  loginForm.addEventListener("submit", (event) => {
    event.preventDefault();

    const email = document.querySelector("#loginEmail").value.trim().toLowerCase();
    const password = document.querySelector("#loginPassword").value;
    const message = document.querySelector("#loginMessage");
    const user = getUsers().find((item) => item.email === email && item.password === password);

    if (!user) {
      setMessage(message, "Email or password is incorrect.", true);
      return;
    }

    localStorage.setItem(SESSION_KEY, JSON.stringify({ name: user.name, email: user.email }));
    setMessage(message, "Logged in. Opening your whiteboard...");

    setTimeout(() => {
      window.location.href = "whiteboard.html";
    }, 700);
  });
}
