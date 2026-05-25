var TEST_COUNT = 10;
var STORAGE_KEY = "daily-myanmar-words-state-v11";
var TTS_PROXY_URL = "https://myanmar-tts.tun173189.workers.dev/tts";

var els = {
  todayTitle: document.querySelector("#todayTitle"),
  progressText: document.querySelector("#progressText"),
  streakText: document.querySelector("#streakText"),
  cardButton: document.querySelector("#cardButton"),
  cardHint: document.querySelector("#cardHint"),
  wordText: document.querySelector("#wordText"),
  phoneticText: document.querySelector("#phoneticText"),
  meaningText: document.querySelector("#meaningText"),
  exampleText: document.querySelector("#exampleText"),
  exampleCnText: document.querySelector("#exampleCnText"),
  exampleTools: document.querySelector("#exampleTools"),
  speakExampleButton: document.querySelector("#speakExampleButton"),
  knownButton: document.querySelector("#knownButton"),
  unknownButton: document.querySelector("#unknownButton"),
  speakButton: document.querySelector("#speakButton"),
  audioStatus: document.querySelector("#audioStatus"),
  donePanel: document.querySelector("#donePanel"),
  summaryText: document.querySelector("#summaryText"),
  reviewAgainButton: document.querySelector("#reviewAgainButton"),
  reviewTodayButton: document.querySelector("#reviewTodayButton"),
  resetDayButton: document.querySelector("#resetDayButton"),
  settingsButton: document.querySelector("#settingsButton"),
  settingsPanel: document.querySelector("#settingsPanel"),
  dailyCountSelect: document.querySelector("#dailyCountSelect"),
  testIntervalSelect: document.querySelector("#testIntervalSelect"),
  autoSpeakToggle: document.querySelector("#autoSpeakToggle"),
  startTestButton: document.querySelector("#startTestButton"),
  testPanel: document.querySelector("#testPanel"),
  testProgressText: document.querySelector("#testProgressText"),
  testWordText: document.querySelector("#testWordText"),
  speakTestButton: document.querySelector("#speakTestButton"),
  choiceList: document.querySelector("#choiceList"),
  testFeedback: document.querySelector("#testFeedback"),
  closeTestButton: document.querySelector("#closeTestButton")
};

if (window.EXTRA_WORDS && window.EXTRA_WORDS.length) {
  window.WORDS = window.WORDS.concat(window.EXTRA_WORDS);
}

var today = toDateKey(new Date());
var state = loadState();
var session = buildSession();
var index = firstUnansweredIndex();
var flipped = false;
var reviewMode = false;
var lastAutoSpokenKey = "";
var settingsOpen = false;
var test = { active: false, questions: [], index: 0, score: 0, answered: false };
var currentAudio = null;

bindEvents();
render();
registerServiceWorker();

function bindEvents() {
  els.cardButton.addEventListener("click", function () {
    flipped = !flipped;
    renderCard();
  });
  els.knownButton.addEventListener("click", function () { answer(true); });
  els.unknownButton.addEventListener("click", function () { answer(false); });
  els.speakButton.addEventListener("click", speakCurrentWord);
  els.speakExampleButton.addEventListener("click", speakCurrentExample);
  els.speakExampleButton.addEventListener("keydown", function (event) {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      speakCurrentExample(event);
    }
  });
  els.reviewAgainButton.addEventListener("click", reviewMistakes);
  els.reviewTodayButton.addEventListener("click", reviewTodayWords);
  els.resetDayButton.addEventListener("click", resetToday);
  els.settingsButton.addEventListener("click", toggleSettings);
  els.dailyCountSelect.addEventListener("change", updateSettings);
  els.testIntervalSelect.addEventListener("change", updateSettings);
  els.autoSpeakToggle.addEventListener("change", updateSettings);
  els.startTestButton.addEventListener("click", startTest);
  els.closeTestButton.addEventListener("click", closeTest);
  els.speakTestButton.addEventListener("click", speakCurrentTestWord);
}

function loadState() {
  var fallback = {
    records: {},
    days: {},
    tests: [],
    settings: { dailyCount: 10, testInterval: 7, autoSpeak: true },
    lastStudyDate: "",
    streak: 0
  };
  var saved = null;
  try {
    saved = JSON.parse(localStorage.getItem(STORAGE_KEY));
  } catch (error) {
    saved = null;
  }
  if (!saved) return fallback;

  saved.records = saved.records || {};
  saved.days = saved.days || {};
  saved.tests = saved.tests || [];
  saved.settings = saved.settings || {};
  saved.settings.dailyCount = Number(saved.settings.dailyCount || fallback.settings.dailyCount);
  saved.settings.testInterval = Number(saved.settings.testInterval || fallback.settings.testInterval);
  saved.settings.autoSpeak = saved.settings.autoSpeak !== false;
  saved.lastStudyDate = saved.lastStudyDate || "";
  saved.streak = saved.streak || 0;
  return saved;
}

function saveState() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function buildSession() {
  var existing = state.days[today];
  if (existing && existing.ids && existing.ids.length) {
    return mapIdsToWords(existing.ids);
  }

  var due = [];
  var fresh = [];
  var learned = [];
  for (var i = 0; i < WORDS.length; i += 1) {
    var word = WORDS[i];
    var record = state.records[word.id];
    if (record && record.reviewAfter && record.reviewAfter <= today) due.push(word);
    else if (!record) fresh.push(word);
    else learned.push(word);
  }

  var all = due.concat(fresh).concat(learned);
  var picked = all.slice(0, state.settings.dailyCount);
  state.days[today] = { ids: getIds(picked), answers: {}, completed: false };
  saveState();
  return picked;
}

function getIds(words) {
  var ids = [];
  for (var i = 0; i < words.length; i += 1) ids.push(words[i].id);
  return ids;
}

function mapIdsToWords(ids) {
  var words = [];
  for (var i = 0; i < ids.length; i += 1) {
    var word = findWord(ids[i]);
    if (word) words.push(word);
  }
  return words;
}

function findWord(id) {
  for (var i = 0; i < WORDS.length; i += 1) {
    if (WORDS[i].id === Number(id)) return WORDS[i];
  }
  return null;
}

function render() {
  els.todayTitle.textContent = formatToday();
  els.streakText.textContent = String(state.streak || 0) + " 天";
  els.startTestButton.textContent = isTestDue() ? "该小测了" : "本周小测";
  renderSettings();
  renderMode();
  renderCard();
  renderTest();
}

function renderMode() {
  var learningHidden = test.active;
  toggleHidden(document.querySelector(".stats"), learningHidden);
  toggleHidden(els.startTestButton, learningHidden);
  toggleHidden(document.querySelector(".card-area"), learningHidden);
  toggleHidden(document.querySelector(".actions"), learningHidden);
  toggleHidden(els.donePanel, learningHidden || !(state.days[today] && state.days[today].completed));
  toggleHidden(els.testPanel, !learningHidden);
}

function renderSettings() {
  toggleHidden(els.settingsPanel, !settingsOpen || test.active);
  els.dailyCountSelect.value = String(state.settings.dailyCount);
  els.testIntervalSelect.value = String(state.settings.testInterval);
  els.autoSpeakToggle.checked = state.settings.autoSpeak;
}

function renderCard() {
  if (test.active) return;

  var day = state.days[today];
  var current = session[index];
  var answers = day && day.answers ? day.answers : {};
  var answeredCount = Object.keys(answers).length;
  var progressCount = reviewMode ? index : Math.min(answeredCount, session.length);
  els.progressText.textContent = String(progressCount) + " / " + String(session.length);

  if (!current || (day && day.completed)) {
    toggleHidden(els.cardButton, true);
    toggleHidden(document.querySelector(".actions"), true);
    var answerValues = objectValues(answers);
    var known = countKnown(answerValues);
    els.summaryText.textContent = "认识 " + known + " 个，不认识 " + (answerValues.length - known) + " 个。";
    return;
  }

  toggleHidden(els.cardButton, false);
  toggleHidden(document.querySelector(".actions"), false);
  els.wordText.textContent = current.word;
  els.phoneticText.textContent = current.phonetic || "";
  els.meaningText.textContent = current.meaning;
  els.exampleText.textContent = current.example;
  els.exampleCnText.textContent = current.exampleCn;
  els.cardHint.textContent = flipped ? "点击收起" : "点击翻面";

  toggleHidden(els.meaningText, !flipped);
  toggleHidden(els.exampleText, !flipped);
  toggleHidden(els.exampleCnText, !flipped);
  toggleHidden(els.exampleTools, !flipped);
  autoSpeak("learn-" + current.id + "-" + index, current.word);
}

function answer(isKnown) {
  var current = session[index];
  if (!current) return;
  updateRecord(current, isKnown);
  state.days[today].answers[current.id] = isKnown;
  updateStreak();
  index += 1;
  flipped = false;
  if (index >= session.length) {
    state.days[today].completed = true;
    reviewMode = false;
  }
  saveState();
  render();
}

function updateRecord(word, isKnown) {
  var oldRecord = state.records[word.id] || { level: 0 };
  var level = isKnown ? Math.min((oldRecord.level || 0) + 1, 4) : 0;
  var daysLater = isKnown ? [0, 3, 7, 15, 30][level] : 1;
  state.records[word.id] = { level: level, lastSeen: today, reviewAfter: addDays(today, daysLater) };
}

function startTest() {
  var pool = getTestPool();
  test = { active: true, questions: [], index: 0, score: 0, answered: false };
  for (var i = 0; i < pool.length; i += 1) test.questions.push(makeQuestion(pool[i]));
  render();
}

function closeTest() {
  test.active = false;
  render();
}

function getTestPool() {
  var studied = [];
  for (var i = 0; i < WORDS.length; i += 1) {
    if (state.records[WORDS[i].id]) studied.push(WORDS[i]);
  }
  var candidates = studied.length >= TEST_COUNT ? studied : session.slice();
  candidates.sort(function (a, b) {
    var recordA = state.records[a.id] || { level: 0, lastSeen: "" };
    var recordB = state.records[b.id] || { level: 0, lastSeen: "" };
    if ((recordA.level || 0) !== (recordB.level || 0)) return (recordA.level || 0) - (recordB.level || 0);
    return String(recordA.lastSeen || "").localeCompare(String(recordB.lastSeen || ""));
  });
  return candidates.slice(0, TEST_COUNT);
}

function isTestDue() {
  var lastTest = state.tests[state.tests.length - 1];
  var lastTestDate = lastTest ? lastTest.date : "";
  var completed = 0;
  for (var date in state.days) {
    if (Object.prototype.hasOwnProperty.call(state.days, date)) {
      if (state.days[date].completed && (!lastTestDate || date > lastTestDate)) completed += 1;
    }
  }
  return completed >= state.settings.testInterval;
}

function toggleSettings() {
  settingsOpen = !settingsOpen;
  render();
}

function updateSettings() {
  var oldDailyCount = state.settings.dailyCount;
  state.settings.dailyCount = Number(els.dailyCountSelect.value);
  state.settings.testInterval = Number(els.testIntervalSelect.value);
  state.settings.autoSpeak = els.autoSpeakToggle.checked;

  var answers = state.days[today] && state.days[today].answers ? state.days[today].answers : {};
  if (oldDailyCount !== state.settings.dailyCount && Object.keys(answers).length === 0) {
    delete state.days[today];
    session = buildSession();
    index = 0;
    flipped = false;
  }
  saveState();
  render();
}

function makeQuestion(word) {
  var wrongChoices = [];
  var pool = WORDS.slice();
  pool.sort(function () { return Math.random() - 0.5; });
  for (var i = 0; i < pool.length && wrongChoices.length < 3; i += 1) {
    if (pool[i].id !== word.id) wrongChoices.push(pool[i]);
  }
  var choices = [word].concat(wrongChoices);
  choices.sort(function () { return Math.random() - 0.5; });
  return { word: word, choices: choices, answerId: word.id };
}

function renderTest() {
  if (!test.active) return;
  var question = test.questions[test.index];
  if (!question) {
    finishTest();
    return;
  }
  els.testProgressText.textContent = String(test.index + 1) + " / " + String(test.questions.length);
  els.testWordText.textContent = question.word.word;
  if (!test.answered) els.testFeedback.textContent = "";
  els.choiceList.innerHTML = "";

  for (var i = 0; i < question.choices.length; i += 1) {
    appendChoiceButton(question.choices[i]);
  }
  autoSpeak("test-" + question.word.id + "-" + test.index, question.word.word);
}

function appendChoiceButton(choice) {
  var button = document.createElement("button");
  button.className = "choice";
  button.type = "button";
  button.textContent = choice.meaning;
  button.addEventListener("click", function () { answerTest(choice.id); });
  els.choiceList.appendChild(button);
}

function answerTest(choiceId) {
  if (test.answered) return;
  var question = test.questions[test.index];
  var correct = choiceId === question.answerId;
  test.answered = true;
  if (correct) test.score += 1;
  updateRecord(question.word, correct);

  var pickedMeaning = "";
  for (var i = 0; i < question.choices.length; i += 1) {
    if (question.choices[i].id === choiceId) pickedMeaning = question.choices[i].meaning;
  }
  var buttons = els.choiceList.querySelectorAll(".choice");
  for (var b = 0; b < buttons.length; b += 1) {
    buttons[b].classList.toggle("correct", buttons[b].textContent === question.word.meaning);
    buttons[b].classList.toggle("wrong", buttons[b].textContent === pickedMeaning && !correct);
    buttons[b].disabled = true;
  }

  els.testFeedback.textContent = correct ? "答对了" : "答错了：" + question.word.meaning;
  saveState();
  window.setTimeout(function () {
    test.index += 1;
    test.answered = false;
    renderTest();
  }, 850);
}

function finishTest() {
  state.tests.push({ date: today, score: test.score, total: test.questions.length });
  saveState();
  els.testProgressText.textContent = "完成";
  els.testWordText.textContent = String(test.score) + " / " + String(test.questions.length);
  els.choiceList.innerHTML = "";
  els.testFeedback.textContent = test.score >= Math.ceil(test.questions.length * 0.8) ? "掌握得不错" : "错题会提前复习";
  var button = document.createElement("button");
  button.className = "primary full";
  button.type = "button";
  button.textContent = "回到今日单词";
  button.addEventListener("click", closeTest);
  els.choiceList.appendChild(button);
}

function updateStreak() {
  if (state.lastStudyDate === today) return;
  var yesterday = addDays(today, -1);
  state.streak = state.lastStudyDate === yesterday ? (state.streak || 0) + 1 : 1;
  state.lastStudyDate = today;
}

function addDays(dateString, amount) {
  var date = new Date(dateString + "T00:00:00");
  date.setDate(date.getDate() + amount);
  return toDateKey(date);
}

function toDateKey(date) {
  var year = date.getFullYear();
  var month = String(date.getMonth() + 1);
  var day = String(date.getDate());
  if (month.length < 2) month = "0" + month;
  if (day.length < 2) day = "0" + day;
  return year + "-" + month + "-" + day;
}

function formatToday() {
  return new Intl.DateTimeFormat("zh-CN", { month: "long", day: "numeric", weekday: "long" }).format(new Date());
}

function speakCurrentWord() {
  var current = session[index];
  if (!current) return;
  speakText(current.word);
}

function speakCurrentTestWord() {
  var question = test.questions[test.index];
  if (!question) return;
  speakText(question.word.word);
}

function speakCurrentExample(event) {
  if (event && event.stopPropagation) event.stopPropagation();
  var current = session[index];
  if (!current) return;
  speakText(current.example);
}

function speakText(text) {
  playOnlineMyanmarAudio(text, function () {
    setAudioStatus("在线缅语发音失败，请检查网络或浏览器声音权限");
  });
}

function playOnlineMyanmarAudio(text, onFail) {
  if (!("Audio" in window)) {
    onFail();
    return;
  }
  if (currentAudio) {
    currentAudio.pause();
    currentAudio = null;
  }
  var url = makeTtsUrl(text);
  var audio = new Audio(url);
  var settled = false;
  currentAudio = audio;
  audio.preload = "auto";
  audio.onplaying = function () {
    settled = true;
    setAudioStatus("在线缅语发音");
  };
  audio.onerror = function () {
    if (settled) return;
    settled = true;
    if (currentAudio === audio) currentAudio = null;
    onFail();
  };
  audio.onended = function () {
    if (currentAudio === audio) currentAudio = null;
  };
  audio.play().catch(function () {
    if (settled) return;
    settled = true;
    if (currentAudio === audio) currentAudio = null;
    onFail();
  });
  window.setTimeout(function () {
    if (settled) return;
    settled = true;
    if (currentAudio === audio) currentAudio = null;
    onFail();
  }, 2600);
}

function makeTtsUrl(text) {
  if (TTS_PROXY_URL) {
    return TTS_PROXY_URL.replace(/\/$/, "") + "?text=" + encodeURIComponent(text);
  }
  return "https://translate.google.com/translate_tts?ie=UTF-8&client=tw-ob&tl=my&q=" + encodeURIComponent(text);
}

function setAudioStatus(text) {
  if (!els.audioStatus) return;
  els.audioStatus.textContent = text || "";
}

function autoSpeak(key, text) {
  if (!state.settings.autoSpeak || lastAutoSpokenKey === key) return;
  lastAutoSpokenKey = key;
  window.setTimeout(function () { speakText(text); }, 180);
}

function reviewMistakes() {
  var answers = state.days[today] && state.days[today].answers ? state.days[today].answers : {};
  var wrongIds = [];
  for (var id in answers) {
    if (Object.prototype.hasOwnProperty.call(answers, id) && !answers[id]) wrongIds.push(Number(id));
  }
  startReview(wrongIds);
}

function reviewTodayWords() {
  var ids = state.days[today] && state.days[today].ids ? state.days[today].ids : [];
  startReview(ids);
}

function startReview(ids) {
  session = mapIdsToWords(ids);
  if (!session.length) return;
  reviewMode = true;
  state.days[today].completed = false;
  index = 0;
  flipped = false;
  render();
}

function resetToday() {
  var oldDay = state.days[today];
  var ids = oldDay && oldDay.ids ? oldDay.ids : [];
  state.days[today] = { ids: ids, answers: {}, completed: false };
  saveState();
  state = loadState();
  session = buildSession();
  index = 0;
  flipped = false;
  reviewMode = false;
  render();
}

function firstUnansweredIndex() {
  var answers = state.days[today] && state.days[today].answers ? state.days[today].answers : {};
  for (var i = 0; i < session.length; i += 1) {
    if (!(session[i].id in answers)) return i;
  }
  return session.length;
}

function objectValues(object) {
  var values = [];
  for (var key in object) {
    if (Object.prototype.hasOwnProperty.call(object, key)) values.push(object[key]);
  }
  return values;
}

function countKnown(values) {
  var count = 0;
  for (var i = 0; i < values.length; i += 1) {
    if (values[i]) count += 1;
  }
  return count;
}

function toggleHidden(element, hidden) {
  if (!element) return;
  element.classList.toggle("hidden", hidden);
}

function registerServiceWorker() {
  if ("serviceWorker" in navigator) {
    navigator.serviceWorker.register("sw.js").catch(function () {});
  }
}
