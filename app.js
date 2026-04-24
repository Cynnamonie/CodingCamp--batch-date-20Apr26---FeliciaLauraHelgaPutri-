/* ════════════════════════════════════════
   Dashboard App — Vanilla JS
   ════════════════════════════════════════ */

// ── Storage helpers ──────────────────────
alert("JS nyala!");
const store = {
  get: (key, fallback) => {
    try { return JSON.parse(localStorage.getItem(key)) ?? fallback; }
    catch { return fallback; }
  },
  set: (key, val) => localStorage.setItem(key, JSON.stringify(val)),
};

// ════════════════════════════════════════
// 1. GREETING & DATETIME
// ════════════════════════════════════════
const datetimeEl   = document.getElementById('datetime');
const greetingEl   = document.getElementById('greeting-text');
const nameDisplay  = document.getElementById('user-name-display');
const editNameBtn  = document.getElementById('edit-name-btn');
const nameEditRow  = document.getElementById('name-edit-row');
const nameInput    = document.getElementById('name-input');
const saveNameBtn  = document.getElementById('save-name-btn');

function getGreeting(hour) {
  if (hour < 12) return 'Good morning';
  if (hour < 17) return 'Good afternoon';
  if (hour < 21) return 'Good evening';
  return 'Good night';
}

function updateDatetime() {
  const now  = new Date();
  const hour = now.getHours();
  const name = store.get('userName', '');

  const dateStr = now.toLocaleDateString(undefined, {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
  });
  const timeStr = now.toLocaleTimeString(undefined, {
    hour: '2-digit', minute: '2-digit', second: '2-digit',
  });

  datetimeEl.textContent  = `${dateStr} · ${timeStr}`;
  greetingEl.textContent  = `${getGreeting(hour)}${name ? ', ' + name : ''}!`;
  nameDisplay.textContent = name ? name : 'Set your name';
}

editNameBtn.addEventListener('click', () => {
  nameInput.value = store.get('userName', '');
  nameEditRow.classList.remove('hidden');
  nameInput.focus();
});

saveNameBtn.addEventListener('click', saveName);
nameInput.addEventListener('keydown', e => { if (e.key === 'Enter') saveName(); });

function saveName() {
  const val = nameInput.value.trim();
  store.set('userName', val);
  nameEditRow.classList.add('hidden');
  updateDatetime();
}

updateDatetime();
setInterval(updateDatetime, 1000);

// ════════════════════════════════════════
// 2. FOCUS TIMER
// ════════════════════════════════════════
const timerDisplay    = document.getElementById('timer-display');
const startBtn        = document.getElementById('start-btn');
const stopBtn         = document.getElementById('stop-btn');
const resetBtn        = document.getElementById('reset-btn');
const pomodoroInput   = document.getElementById('pomodoro-minutes');
const applyDurationBtn = document.getElementById('apply-duration-btn');

let timerDuration = store.get('pomodoroDuration', 25); // minutes
let timeLeft      = timerDuration * 60;
let timerInterval = null;
let timerRunning  = false;

pomodoroInput.value = timerDuration;

function formatTime(seconds) {
  const m = String(Math.floor(seconds / 60)).padStart(2, '0');
  const s = String(seconds % 60).padStart(2, '0');
  return `${m}:${s}`;
}

function renderTimer() {
  timerDisplay.textContent = formatTime(timeLeft);
}

startBtn.addEventListener('click', () => {
  if (timerRunning) return;
  timerRunning = true;
  timerInterval = setInterval(() => {
    if (timeLeft <= 0) {
      clearInterval(timerInterval);
      timerRunning = false;
      timerDisplay.textContent = '00:00';
      return;
    }
    timeLeft--;
    renderTimer();
  }, 1000);
});

stopBtn.addEventListener('click', () => {
  clearInterval(timerInterval);
  timerRunning = false;
});

resetBtn.addEventListener('click', () => {
  clearInterval(timerInterval);
  timerRunning = false;
  timeLeft = timerDuration * 60;
  renderTimer();
});

applyDurationBtn.addEventListener('click', () => {
  const val = parseInt(pomodoroInput.value, 10);
  if (!val || val < 1 || val > 120) return;
  timerDuration = val;
  store.set('pomodoroDuration', val);
  clearInterval(timerInterval);
  timerRunning = false;
  timeLeft = timerDuration * 60;
  renderTimer();
});

renderTimer();

// ════════════════════════════════════════
// 3. TO-DO LIST
// ════════════════════════════════════════
const todoInput   = document.getElementById('todo-input');
const addTaskBtn  = document.getElementById('add-task-btn');
const todoList    = document.getElementById('todo-list');
const sortSelect  = document.getElementById('sort-select');

let tasks = store.get('tasks', []);

function saveTasks() { store.set('tasks', tasks); }

function getSortedTasks() {
  const copy = [...tasks];
  const mode = sortSelect.value;
  if (mode === 'active') return copy.sort((a, b) => a.done - b.done);
  if (mode === 'done')   return copy.sort((a, b) => b.done - a.done);
  return copy;
}

function renderTasks() {
  todoList.innerHTML = '';
  getSortedTasks().forEach(task => {
    const li = document.createElement('li');
    li.className = `todo-item${task.done ? ' done' : ''}`;
    li.dataset.id = task.id;

    li.innerHTML = `
      <input type="checkbox" class="task-check" ${task.done ? 'checked' : ''} />
      <span class="task-text">${escapeHtml(task.text)}</span>
      <button class="edit-btn">Edit</button>
      <button class="delete-btn">✕</button>
    `;

    li.querySelector('.task-check').addEventListener('change', () => toggleTask(task.id));
    li.querySelector('.edit-btn').addEventListener('click', () => startEdit(task.id, li));
    li.querySelector('.delete-btn').addEventListener('click', () => deleteTask(task.id));

    todoList.appendChild(li);
  });
}

function addTask() {
  const text = todoInput.value.trim();
  if (!text) return;
  tasks.push({ id: Date.now(), text, done: false });
  saveTasks();
  renderTasks();
  todoInput.value = '';
}

function toggleTask(id) {
  tasks = tasks.map(t => t.id === id ? { ...t, done: !t.done } : t);
  saveTasks();
  renderTasks();
}

function deleteTask(id) {
  tasks = tasks.filter(t => t.id !== id);
  saveTasks();
  renderTasks();
}

function startEdit(id, li) {
  const task = tasks.find(t => t.id === id);
  if (!task) return;

  const textSpan = li.querySelector('.task-text');
  const editBtn  = li.querySelector('.edit-btn');

  const input = document.createElement('input');
  input.type = 'text';
  input.className = 'task-edit-input';
  input.value = task.text;
  input.maxLength = 120;

  const saveBtn = document.createElement('button');
  saveBtn.className = 'save-btn';
  saveBtn.textContent = 'Save';

  textSpan.replaceWith(input);
  editBtn.replaceWith(saveBtn);
  input.focus();

  const commit = () => {
    const newText = input.value.trim();
    if (!newText) return;
    tasks = tasks.map(t => t.id === id ? { ...t, text: newText } : t);
    saveTasks();
    renderTasks();
  };

  saveBtn.addEventListener('click', commit);
  input.addEventListener('keydown', e => { if (e.key === 'Enter') commit(); });
}

addTaskBtn.addEventListener('click', addTask);
todoInput.addEventListener('keydown', e => { if (e.key === 'Enter') addTask(); });
sortSelect.addEventListener('change', renderTasks);

renderTasks();

// ════════════════════════════════════════
// 4. QUICK LINKS
// ════════════════════════════════════════
const linkNameInput  = document.getElementById('link-name-input');
const linkUrlInput   = document.getElementById('link-url-input');
const addLinkBtn     = document.getElementById('add-link-btn');
const linksGrid      = document.getElementById('links-grid');

let links = store.get('quickLinks', []);

function saveLinks() { store.set('quickLinks', links); }

function renderLinks() {
  linksGrid.innerHTML = '';
  links.forEach(link => {
    const wrap = document.createElement('div');
    wrap.className = 'link-item';

    const a = document.createElement('a');
    a.className = 'link-btn';
    a.href = link.url;
    a.target = '_blank';
    a.rel = 'noopener noreferrer';
    a.textContent = link.name;

    const del = document.createElement('button');
    del.className = 'link-delete-btn';
    del.title = 'Remove';
    del.textContent = '✕';
    del.addEventListener('click', () => deleteLink(link.id));

    wrap.appendChild(a);
    wrap.appendChild(del);
    linksGrid.appendChild(wrap);
  });
}

function addLink() {
  const name = linkNameInput.value.trim();
  let   url  = linkUrlInput.value.trim();
  if (!name || !url) return;
  if (!/^https?:\/\//i.test(url)) url = 'https://' + url;
  links.push({ id: Date.now(), name, url });
  saveLinks();
  renderLinks();
  linkNameInput.value = '';
  linkUrlInput.value  = '';
}

function deleteLink(id) {
  links = links.filter(l => l.id !== id);
  saveLinks();
  renderLinks();
}

addLinkBtn.addEventListener('click', addLink);
linkUrlInput.addEventListener('keydown', e => { if (e.key === 'Enter') addLink(); });

renderLinks();

// ── Utility ──────────────────────────────
function escapeHtml(str) {
  return str.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

// ════════════════════════════════════════
// 5. THEME TOGGLE
// ════════════════════════════════════════
const themeToggle = document.getElementById('theme-toggle');

function applyTheme(theme) {
  if (theme === 'light') {
    document.documentElement.setAttribute('data-theme', 'light');
    themeToggle.textContent = '☀️';
    themeToggle.title = 'Switch to dark mode';
  } else {
    document.documentElement.removeAttribute('data-theme');
    themeToggle.textContent = '🌙';
    themeToggle.title = 'Switch to light mode';
  }
}

themeToggle.addEventListener('click', () => {
  const current = document.documentElement.getAttribute('data-theme');
  const next = current === 'light' ? 'dark' : 'light';
  store.set('theme', next);
  applyTheme(next);
});

// Init from storage
applyTheme(store.get('theme', 'dark'));
