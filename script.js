const clockTime = document.querySelector("#clock-time");
const btn = document.querySelector("#btn");
const incrementBtn = document.querySelector(".fa-angle-up");
const decrementBtn = document.querySelector(".fa-angle-down");
const pomodoroStatus = document.querySelector("#pomodoro-status");
const pomodoroTracker = document.querySelector("#pomodoro-tracker");
const ding = document.querySelector("#ding");
const click = document.querySelector("#click");

const workTimeInMS = 1500000;  // In Ms
const restTimeInMS = 300000;
const longerRestTimeInMS = restTimeInMS * 3;
const pomodoroMilestone = 4;
let pomodoroMultiplier = 1;
let remainingMs = null;
let isTimerRunning = false;
let isAlarmActive = false;

function savePomodoroState() {
  localStorage.setItem("todayPomodoro", JSON.stringify(todayPomodoro));
}

function loadPomodoroState() {
  try {
    return JSON.parse(localStorage.getItem("todayPomodoro"));
  } catch {
    return null; // fallback if corrupted
  }
}

let todayPomodoro;
let savedState = loadPomodoroState();
let nowDate = new Date().toISOString().split("T")[0];

if (!savedState || savedState.date !== nowDate) {
  todayPomodoro = {
    date : nowDate,
    count : 0,
    isWorkSession : false
  };
  savePomodoroState();
} else {
  todayPomodoro = savedState;
}

function updateDisplay(ms) {
  const totalSeconds = Math.ceil(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;

  if (minutes > 60) {
    clockTime.classList.add("hour");
    const hour = Math.floor(minutes / 60);
    clockTime.textContent = `${hour.toString().padStart(2, "0")}:${(minutes % 60).toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;
  } else {
    clockTime.classList.remove("hour");
    clockTime.textContent = `${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;
  }
}

function resetDisplay() {
  if (todayPomodoro.isWorkSession) {
    remainingMs = workTimeInMS * pomodoroMultiplier;
  } else {
    remainingMs = restTimeInMS * pomodoroMultiplier;
    if (todayPomodoro.count >= pomodoroMilestone) {
      remainingMs -= restTimeInMS;  // Replace the normal reset time with a longer one for completing 4 pomodoros
      remainingMs += longerRestTimeInMS;
    } 
  }

  updateDisplay(remainingMs);
}

function resetTimer() {
  todayPomodoro.isWorkSession = !todayPomodoro.isWorkSession;
  resetDisplay();
  pomodoroStatus.textContent = todayPomodoro.isWorkSession ? "Work" : "Rest";
  pomodoroTracker.textContent = `${todayPomodoro.count}/4 pomodoro(s)`;
}

function startTimer(totalMs) {
  if (isTimerRunning) return;

  isTimerRunning = true;
  const endTime = Date.now() + totalMs;

  function tick() {
    remainingMs = Math.max(0, endTime - Date.now());
    updateDisplay(remainingMs);

    if (remainingMs <= 0) {
      ding.play();

      isTimerRunning = false;
      isAlarmActive = true;
      btn.classList.replace("fa-pause", "fa-x");

      if (todayPomodoro.isWorkSession && todayPomodoro.count < pomodoroMilestone) todayPomodoro.count += pomodoroMultiplier;
      else if (!todayPomodoro.isWorkSession && todayPomodoro.count >= pomodoroMilestone) todayPomodoro.count -= pomodoroMilestone;
      savePomodoroState();
      pomodoroTracker.textContent = `${todayPomodoro.count}/4 pomodoro(s)`;
    } else {
      if (!isTimerRunning) return;
      setTimeout(tick, 250);  // 1/4 of a second
    }
  }

  tick();
}

function pauseTimer() {
  isTimerRunning = false;
  updateDisplay(remainingMs)
}

function onClickIncrement(goingToIncrement) {
  // Condition: Is Not Running, is Work, and time on clock should match itself
  if (isTimerRunning || !todayPomodoro.isWorkSession || remainingMs !== workTimeInMS * pomodoroMultiplier) return;

  if (goingToIncrement) {
    if (pomodoroMultiplier < 4) {
      pomodoroMultiplier++;
    }
  } else {
    if (pomodoroMultiplier > 1) {
      pomodoroMultiplier--;
    }
  }

  resetDisplay();
}

btn.addEventListener("click", () => {
  click.play();
  if (isAlarmActive) {
    isAlarmActive = false;
    ding.pause();
    ding.currentTime = 0;
    btn.classList.replace("fa-x", "fa-play");
    resetTimer();
  } else {
    if (isTimerRunning) {
      btn.classList.replace("fa-pause", "fa-play");
      pauseTimer();
    } else {
      btn.classList.replace("fa-play", "fa-pause");
      startTimer(remainingMs);
    }
  }
});

incrementBtn.addEventListener("click", () => {
  click.play();
  onClickIncrement(true);
});

decrementBtn.addEventListener("click", () => {
  click.play();
  onClickIncrement(false);
});

// Initialize display
resetTimer();
