var TEST_COUNT = 10;
var STORAGE_KEY = "daily-myanmar-words-state-v11";
var TTS_PROXY_URL = "https://myanmar-tts.tun173189.workers.dev/tts";

var els = {
  todayTitle: document.querySelector("#todayTitle"),
  progressText: document.querySelector("#progressText"),
  progressLabel: document.querySelector("#progressLabel"),
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
  listenTodayButton: document.querySelector("#listenTodayButton"),
  weeklyReviewPanel: document.querySelector("#weeklyReviewPanel"),
  weeklyReviewTitle: document.querySelector("#weeklyReviewTitle"),
  weeklyReviewSummary: document.querySelector("#weeklyReviewSummary"),
  weeklyReviewButton: document.querySelector("#weeklyReviewButton"),
  weakReviewButton: document.querySelector("#weakReviewButton"),
  resetDayButton: document.querySelector("#resetDayButton"),
  settingsButton: document.querySelector("#settingsButton"),
  settingsPanel: document.querySelector("#settingsPanel"),
  dailyCountSelect: document.querySelector("#dailyCountSelect"),
  testIntervalSelect: document.querySelector("#testIntervalSelect"),
  autoSpeakToggle: document.querySelector("#autoSpeakToggle"),
  startTestButton: document.querySelector("#startTestButton"),
  startListeningTestButton: document.querySelector("#startListeningTestButton"),
  startStoryButton: document.querySelector("#startStoryButton"),
  testPanel: document.querySelector("#testPanel"),
  testTitleText: document.querySelector("#testTitleText"),
  testProgressText: document.querySelector("#testProgressText"),
  testWordText: document.querySelector("#testWordText"),
  speakTestButton: document.querySelector("#speakTestButton"),
  showTestWordButton: document.querySelector("#showTestWordButton"),
  choiceList: document.querySelector("#choiceList"),
  testFeedback: document.querySelector("#testFeedback"),
  closeTestButton: document.querySelector("#closeTestButton"),
  storyPanel: document.querySelector("#storyPanel"),
  storyList: document.querySelector("#storyList"),
  storyTitle: document.querySelector("#storyTitle"),
  storyProgressText: document.querySelector("#storyProgressText"),
  storySentenceText: document.querySelector("#storySentenceText"),
  storyCnText: document.querySelector("#storyCnText"),
  storyStatus: document.querySelector("#storyStatus"),
  storyPlayButton: document.querySelector("#storyPlayButton"),
  storyReplayButton: document.querySelector("#storyReplayButton"),
  storySlowButton: document.querySelector("#storySlowButton"),
  storyPrevButton: document.querySelector("#storyPrevButton"),
  storyNextButton: document.querySelector("#storyNextButton"),
  storyShowCnButton: document.querySelector("#storyShowCnButton"),
  closeStoryButton: document.querySelector("#closeStoryButton")
};

if (window.EXTRA_WORDS && window.EXTRA_WORDS.length) {
  window.WORDS = window.WORDS.concat(window.EXTRA_WORDS);
}

var today = toDateKey(new Date());
var state = loadState();
var flipped = false;
var reviewSession = state.activeReview && state.activeReview.ids && state.activeReview.ids.length ? state.activeReview : null;
var reviewMode = !!reviewSession;
var session = reviewMode ? mapIdsToWords(reviewSession.ids) : buildSession();
var index = reviewMode ? firstReviewUnansweredIndex() : firstUnansweredIndex();
var lastAutoSpokenKey = "";
var settingsOpen = false;
var test = { active: false, listening: false, showWord: true, title: "小测", questions: [], index: 0, score: 0, answered: false };
var storyState = { active: false, storyIndex: 0, lineIndex: 0, showCn: false, playing: false, audio: null };
var panelHistoryActive = false;
var activePanel = "";
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
  els.listenTodayButton.addEventListener("click", startTodayListeningReview);
  els.weeklyReviewButton.addEventListener("click", startWeeklyReview);
  els.weakReviewButton.addEventListener("click", reviewWeakWords);
  els.resetDayButton.addEventListener("click", resetToday);
  els.settingsButton.addEventListener("click", toggleSettings);
  els.dailyCountSelect.addEventListener("change", updateSettings);
  els.testIntervalSelect.addEventListener("change", updateSettings);
  els.autoSpeakToggle.addEventListener("change", updateSettings);
  els.startTestButton.addEventListener("click", startTest);
  els.startListeningTestButton.addEventListener("click", startListeningTest);
  els.startStoryButton.addEventListener("click", openStoryPractice);
  els.closeTestButton.addEventListener("click", closeTest);
  els.speakTestButton.addEventListener("click", speakCurrentTestWord);
  els.showTestWordButton.addEventListener("click", showListeningWord);
  els.closeStoryButton.addEventListener("click", closeStoryPractice);
  els.storyPlayButton.addEventListener("click", toggleStoryPlay);
  els.storyReplayButton.addEventListener("click", replayStoryLine);
  els.storySlowButton.addEventListener("click", playStoryLineSlow);
  els.storyPrevButton.addEventListener("click", previousStoryLine);
  els.storyNextButton.addEventListener("click", nextStoryLine);
  els.storyShowCnButton.addEventListener("click", toggleStoryChinese);
  window.addEventListener("popstate", handleBrowserBack);
}

function loadState() {
  var fallback = {
    records: {},
    days: {},
    tests: [],
    settings: { dailyCount: 10, testInterval: 7, autoSpeak: true },
    lastStudyDate: "",
    streak: 0,
    weeklyReviewThrough: "",
    lastWeeklyReviewIds: [],
    lastWeeklyReviewDate: "",
    activeReview: null
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
  saved.weeklyReviewThrough = saved.weeklyReviewThrough || "";
  saved.lastWeeklyReviewIds = saved.lastWeeklyReviewIds || [];
  saved.lastWeeklyReviewDate = saved.lastWeeklyReviewDate || "";
  saved.activeReview = saved.activeReview && saved.activeReview.ids && saved.activeReview.ids.length ? saved.activeReview : null;
  if (saved.activeReview) {
    saved.activeReview.answers = saved.activeReview.answers || {};
    saved.activeReview.type = saved.activeReview.type || "review";
    saved.activeReview.sourceThrough = saved.activeReview.sourceThrough || "";
  }
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
  els.startTestButton.textContent = "本周小测";
  renderSettings();
  renderWeeklyPanel();
  renderMode();
  renderCard();
  renderTest();
  renderStory();
}

function renderMode() {
  var testing = test.active || storyState.active;
  var day = state.days[today];
  var dailyDone = !!(day && day.completed);
  toggleHidden(document.querySelector(".stats"), testing);
  toggleHidden(els.weeklyReviewPanel, testing || reviewMode || !isWeeklyReviewDue());
  toggleHidden(els.donePanel, testing || reviewMode || !dailyDone);
  toggleHidden(document.querySelector(".test-actions"), testing);
  toggleHidden(document.querySelector(".card-area"), testing || (dailyDone && !reviewMode));
  toggleHidden(document.querySelector(".actions"), testing || (dailyDone && !reviewMode));
  toggleHidden(els.testPanel, !test.active);
  toggleHidden(els.storyPanel, !storyState.active);
}

function renderSettings() {
  toggleHidden(els.settingsPanel, !settingsOpen || test.active || storyState.active);
  els.dailyCountSelect.value = String(state.settings.dailyCount);
  els.testIntervalSelect.value = String(state.settings.testInterval);
  els.autoSpeakToggle.checked = state.settings.autoSpeak;
}

function renderCard() {
  if (test.active || storyState.active) return;

  var day = state.days[today];
  var current = session[index];
  var answers = reviewMode && reviewSession ? reviewSession.answers : (day && day.answers ? day.answers : {});
  var answeredCount = Object.keys(answers).length;
  var progressCount = reviewMode ? index : Math.min(answeredCount, session.length);
  els.progressText.textContent = String(progressCount) + " / " + String(session.length);
  if (els.progressLabel) els.progressLabel.textContent = reviewMode ? getReviewLabel() : "今日进度";

  if (!current || (day && day.completed && !reviewMode)) {
    toggleHidden(els.cardButton, true);
    toggleHidden(document.querySelector(".actions"), true);
    var dayAnswers = day && day.answers ? day.answers : {};
    var answerValues = objectValues(dayAnswers);
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
  els.cardHint.textContent = flipped ? "点击收起中文" : "点击显示中文";

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
  if (reviewMode && reviewSession) {
    reviewSession.answers[current.id] = isKnown;
    state.activeReview = reviewSession;
  } else {
    ensureTodayDay();
    state.days[today].answers[current.id] = isKnown;
  }
  updateStreak();
  index += 1;
  flipped = false;
  if (index >= session.length) {
    if (reviewMode && reviewSession) {
      finishReview();
      render();
      return;
    }
    state.days[today].completed = true;
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
  startChoiceTest(getTestPool(), false, "本周小测");
}

function startListeningTest() {
  startChoiceTest(getTestPool(), true, "听力小测");
}

function startTodayListeningReview() {
  startChoiceTest(mapIdsToWords(getTodayIds()), true, "今天再听");
}

function startChoiceTest(pool, listening, title) {
  if (!pool.length) return;
  pauseStoryAudio();
  closeStoryPanel();
  closeSettingsPanel();
  test = { active: true, listening: listening, showWord: !listening, title: title, questions: [], index: 0, score: 0, answered: false };
  pushPanelHistory("test");
  for (var i = 0; i < pool.length; i += 1) test.questions.push(makeQuestion(pool[i]));
  render();
}

function closeTest(fromHistory) {
  if (!fromHistory && activePanel === "test" && panelHistoryActive && window.history && window.history.back) {
    window.history.back();
    return;
  }
  closeTestPanel();
}

function closeTestPanel() {
  pauseCurrentAudio();
  test.active = false;
  clearPanelHistory("test");
  render();
}

function openStoryPractice() {
  if (!window.LISTENING_STORIES || !window.LISTENING_STORIES.length) return;
  pauseCurrentAudio();
  closeTestPanel();
  closeSettingsPanel();
  storyState = { active: true, storyIndex: 0, lineIndex: 0, showCn: false, playing: false, audio: null };
  pushPanelHistory("story");
  render();
  playStoryLine(true, 1);
}

function closeStoryPractice(fromHistory) {
  if (!fromHistory && activePanel === "story" && panelHistoryActive && window.history && window.history.back) {
    window.history.back();
    return;
  }
  closeStoryPanel();
}

function closeStoryPanel() {
  pauseStoryAudio();
  storyState.active = false;
  clearPanelHistory("story");
  render();
}

function pushPanelHistory(panel) {
  if (panelHistoryActive || !window.history || !window.history.pushState) {
    activePanel = panel;
    return;
  }
  try {
    window.history.pushState({ myanmarWordsPanel: panel }, "", window.location.href);
    panelHistoryActive = true;
    activePanel = panel;
  } catch (error) {
    panelHistoryActive = false;
    activePanel = panel;
  }
}

function clearPanelHistory(panel) {
  if (activePanel === panel) {
    activePanel = "";
    panelHistoryActive = false;
  }
}

function handleBrowserBack() {
  if (test.active) {
    closeTest(true);
    return;
  }
  if (storyState.active) {
    closeStoryPractice(true);
    return;
  }
  if (settingsOpen) {
    closeSettings(true);
  }
}

function getTestPool() {
  var source = getWeeklyReviewSource();
  var reviewedToday = state.lastWeeklyReviewDate === today ? state.lastWeeklyReviewIds : [];
  var preferredIds = source.ids.length ? source.ids : reviewedToday;
  var studied = preferredIds.length ? mapIdsToWords(preferredIds) : [];
  if (!studied.length) {
    for (var i = 0; i < WORDS.length; i += 1) {
      if (state.records[WORDS[i].id]) studied.push(WORDS[i]);
    }
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
  if (settingsOpen) {
    closeSettings(false);
    return;
  }
  settingsOpen = true;
  pushPanelHistory("settings");
  render();
}

function closeSettings(fromHistory) {
  if (!fromHistory && activePanel === "settings" && panelHistoryActive && window.history && window.history.back) {
    window.history.back();
    return;
  }
  closeSettingsPanel();
}

function closeSettingsPanel() {
  settingsOpen = false;
  clearPanelHistory("settings");
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
  if (els.testTitleText) els.testTitleText.textContent = test.title || "小测";
  els.testProgressText.textContent = String(test.index + 1) + " / " + String(test.questions.length);
  els.testWordText.textContent = test.listening && !test.showWord ? "听发音，选择意思" : question.word.word;
  toggleHidden(els.showTestWordButton, !test.listening || test.showWord);
  if (!test.answered) els.testFeedback.textContent = "";
  els.choiceList.innerHTML = "";

  for (var i = 0; i < question.choices.length; i += 1) {
    appendChoiceButton(question.choices[i]);
  }
  if (test.listening) forceAutoSpeak("listen-" + question.word.id + "-" + test.index, question.word.word);
  else autoSpeak("test-" + question.word.id + "-" + test.index, question.word.word);
}

function renderStory() {
  if (!storyState.active || !window.LISTENING_STORIES || !window.LISTENING_STORIES.length) return;
  var story = getCurrentStory();
  var line = getCurrentStoryLine();
  renderStoryList();
  if (!story || !line) return;
  els.storyTitle.textContent = story.title;
  els.storyProgressText.textContent = String(storyState.lineIndex + 1) + " / " + String(story.lines.length);
  els.storySentenceText.textContent = line.my;
  els.storyCnText.textContent = line.cn;
  toggleHidden(els.storyCnText, !storyState.showCn);
  els.storyShowCnButton.textContent = storyState.showCn ? "隐藏中文" : "显示中文";
  els.storyPlayButton.textContent = storyState.playing ? "暂停" : "继续";
  els.storyPrevButton.disabled = storyState.lineIndex <= 0;
  els.storyNextButton.disabled = storyState.lineIndex >= story.lines.length - 1;
  if (!storyState.playing && !els.storyStatus.textContent) els.storyStatus.textContent = "逐句听，听不懂就重听";
}

function renderStoryList() {
  els.storyList.innerHTML = "";
  var stories = window.LISTENING_STORIES || [];
  for (var i = 0; i < stories.length; i += 1) {
    appendStoryButton(stories[i], i);
  }
}

function appendStoryButton(story, storyIndex) {
  var button = document.createElement("button");
  button.className = "story-chip";
  button.type = "button";
  button.textContent = story.title;
  button.classList.toggle("active", storyIndex === storyState.storyIndex);
  button.addEventListener("click", function () {
    pauseStoryAudio();
    storyState.storyIndex = storyIndex;
    storyState.lineIndex = 0;
    storyState.showCn = false;
    renderStory();
    playStoryLine(true, 1);
  });
  els.storyList.appendChild(button);
}

function getCurrentStory() {
  var stories = window.LISTENING_STORIES || [];
  return stories[storyState.storyIndex] || stories[0];
}

function getCurrentStoryLine() {
  var story = getCurrentStory();
  if (!story || !story.lines || !story.lines.length) return null;
  return story.lines[storyState.lineIndex] || story.lines[0];
}

function toggleStoryPlay() {
  if (storyState.audio && storyState.playing) {
    storyState.audio.pause();
    storyState.playing = false;
    renderStory();
    return;
  }
  if (storyState.audio && !storyState.playing) {
    storyState.audio.play().catch(function () {
      setStoryStatus("播放失败，请检查网络或声音权限");
    });
    storyState.playing = true;
    renderStory();
    return;
  }
  playStoryLine(false);
}

function replayStoryLine() {
  playStoryLine(true, 1);
}

function playStoryLineSlow() {
  playStoryLine(true, 0.75);
}

function playStoryLine(restart, rate) {
  var line = getCurrentStoryLine();
  if (!line) return;
  if (restart) pauseStoryAudio();
  setStoryStatus("正在准备发音");
  storyState.audio = playOnlineMyanmarAudio(line.my, function () {
    storyState.playing = false;
    setStoryStatus("自动播放失败，请点继续");
    renderStory();
  }, {
    rate: rate || 1,
    timeoutMs: 9000,
    onPlaying: function () {
      storyState.playing = true;
      setStoryStatus((rate || 1) < 1 ? "慢速朗读" : "正在朗读");
      renderStory();
    },
    onEnded: function () {
      storyState.playing = false;
      storyState.audio = null;
      setStoryStatus("逐句听，听不懂就重听");
      renderStory();
    }
  });
}

function previousStoryLine() {
  if (storyState.lineIndex <= 0) return;
  pauseStoryAudio();
  storyState.lineIndex -= 1;
  storyState.showCn = false;
  renderStory();
  playStoryLine(true, 1);
}

function nextStoryLine() {
  var story = getCurrentStory();
  if (!story || storyState.lineIndex >= story.lines.length - 1) return;
  pauseStoryAudio();
  storyState.lineIndex += 1;
  storyState.showCn = false;
  renderStory();
  playStoryLine(true, 1);
}

function toggleStoryChinese() {
  storyState.showCn = !storyState.showCn;
  renderStory();
}

function pauseStoryAudio() {
  if (storyState.audio) {
    storyState.audio.pause();
    if (currentAudio === storyState.audio) currentAudio = null;
    storyState.audio = null;
  }
  storyState.playing = false;
  setStoryStatus("逐句听，听不懂就重听");
}

function setStoryStatus(text) {
  if (els.storyStatus) els.storyStatus.textContent = text || "";
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
    test.showWord = !test.listening;
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

function showListeningWord() {
  if (!test.active || !test.listening) return;
  test.showWord = true;
  renderTest();
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

function playOnlineMyanmarAudio(text, onFail, options) {
  if (!("Audio" in window)) {
    onFail();
    return null;
  }
  pauseCurrentAudio();
  var url = makeTtsUrl(text);
  var audio = new Audio(url);
  var settled = false;
  currentAudio = audio;
  audio.preload = "auto";
  if (options && options.rate) audio.playbackRate = options.rate;
  audio.onplaying = function () {
    if (settled) return;
    settled = true;
    setAudioStatus("在线缅语发音");
    if (options && options.onPlaying) options.onPlaying(audio);
  };
  audio.onerror = function () {
    if (settled) return;
    settled = true;
    if (currentAudio === audio) currentAudio = null;
    onFail();
  };
  audio.onended = function () {
    if (currentAudio === audio) currentAudio = null;
    if (options && options.onEnded) options.onEnded(audio);
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
  }, options && options.timeoutMs ? options.timeoutMs : 2600);
  return audio;
}

function pauseCurrentAudio() {
  if (currentAudio) {
    currentAudio.pause();
    currentAudio = null;
  }
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

function forceAutoSpeak(key, text) {
  if (lastAutoSpokenKey === key) return;
  lastAutoSpokenKey = key;
  window.setTimeout(function () { speakText(text); }, 180);
}

function reviewMistakes() {
  var answers = state.days[today] && state.days[today].answers ? state.days[today].answers : {};
  var wrongIds = [];
  for (var id in answers) {
    if (Object.prototype.hasOwnProperty.call(answers, id) && !answers[id]) wrongIds.push(Number(id));
  }
  startReview(wrongIds, "mistakes");
}

function reviewTodayWords() {
  startReview(getTodayIds(), "today");
}

function startWeeklyReview() {
  var source = getWeeklyReviewSource();
  startReview(prioritizeReviewIds(source.ids), "weekly", { sourceThrough: source.through });
}

function reviewWeakWords() {
  startReview(getWeakWordIds(), "weak");
}

function startReview(ids, type, options) {
  var unique = uniqueIds(ids);
  session = mapIdsToWords(unique);
  if (!session.length) return;
  reviewMode = true;
  reviewSession = {
    type: type || "review",
    ids: getIds(session),
    answers: {},
    started: today,
    sourceThrough: options && options.sourceThrough ? options.sourceThrough : ""
  };
  state.activeReview = reviewSession;
  index = 0;
  flipped = false;
  saveState();
  render();
}

function finishReview() {
  var finished = reviewSession;
  if (finished && finished.type === "weekly" && finished.sourceThrough) {
    state.weeklyReviewThrough = finished.sourceThrough;
    state.lastWeeklyReviewIds = finished.ids.slice();
    state.lastWeeklyReviewDate = today;
  }
  state.activeReview = null;
  reviewSession = null;
  reviewMode = false;
  session = buildSession();
  index = firstUnansweredIndex();
  flipped = false;
  saveState();
}

function resetToday() {
  var oldDay = state.days[today];
  var ids = oldDay && oldDay.ids ? oldDay.ids : [];
  state.days[today] = { ids: ids, answers: {}, completed: false };
  state.activeReview = null;
  saveState();
  state = loadState();
  reviewSession = null;
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

function firstReviewUnansweredIndex() {
  var answers = reviewSession && reviewSession.answers ? reviewSession.answers : {};
  for (var i = 0; i < session.length; i += 1) {
    if (!(session[i].id in answers)) return i;
  }
  return session.length;
}

function ensureTodayDay() {
  if (!state.days[today]) {
    state.days[today] = { ids: getIds(session), answers: {}, completed: false };
  }
  state.days[today].answers = state.days[today].answers || {};
}

function getTodayIds() {
  return state.days[today] && state.days[today].ids ? state.days[today].ids : [];
}

function renderWeeklyPanel() {
  var source = getWeeklyReviewSource();
  var weakCount = getWeakWordIds().length;
  if (els.weeklyReviewTitle) els.weeklyReviewTitle.textContent = "本周该复习了";
  if (els.weeklyReviewSummary) {
    els.weeklyReviewSummary.textContent = "这段时间学了 " + source.ids.length + " 个词，先完整复习一遍，再做小测。";
  }
  if (els.weakReviewButton) {
    els.weakReviewButton.textContent = weakCount ? "复习没掌握的词 " + weakCount : "暂无没掌握的词";
    els.weakReviewButton.disabled = !weakCount;
  }
}

function getWeeklyReviewSource() {
  var days = getCompletedDayKeysAfter(state.weeklyReviewThrough || "");
  var ids = [];
  for (var i = 0; i < days.length; i += 1) {
    var day = state.days[days[i]];
    if (day && day.ids) ids = ids.concat(day.ids);
  }
  return { days: days, ids: uniqueIds(ids), through: days.length ? days[days.length - 1] : "" };
}

function isWeeklyReviewDue() {
  return getWeeklyReviewSource().days.length >= state.settings.testInterval;
}

function getCompletedDayKeysAfter(dateKey) {
  var keys = [];
  for (var key in state.days) {
    if (Object.prototype.hasOwnProperty.call(state.days, key)) {
      if (state.days[key].completed && (!dateKey || key > dateKey)) keys.push(key);
    }
  }
  keys.sort();
  return keys;
}

function getWeakWordIds() {
  var ids = [];
  for (var i = 0; i < WORDS.length; i += 1) {
    var record = state.records[WORDS[i].id];
    if (record && ((record.level || 0) === 0 || (record.reviewAfter && record.reviewAfter <= today))) ids.push(WORDS[i].id);
  }
  return prioritizeReviewIds(ids);
}

function prioritizeReviewIds(ids) {
  var unique = uniqueIds(ids);
  unique.sort(function (a, b) {
    var recordA = state.records[a] || { level: 0, reviewAfter: "", lastSeen: "" };
    var recordB = state.records[b] || { level: 0, reviewAfter: "", lastSeen: "" };
    var dueA = recordA.reviewAfter && recordA.reviewAfter <= today ? 0 : 1;
    var dueB = recordB.reviewAfter && recordB.reviewAfter <= today ? 0 : 1;
    if (dueA !== dueB) return dueA - dueB;
    if ((recordA.level || 0) !== (recordB.level || 0)) return (recordA.level || 0) - (recordB.level || 0);
    return String(recordA.lastSeen || "").localeCompare(String(recordB.lastSeen || ""));
  });
  return unique;
}

function uniqueIds(ids) {
  var seen = {};
  var unique = [];
  for (var i = 0; i < ids.length; i += 1) {
    var id = Number(ids[i]);
    if (!id || seen[id]) continue;
    seen[id] = true;
    unique.push(id);
  }
  return unique;
}

function getReviewLabel() {
  if (!reviewSession) return "复习进度";
  if (reviewSession.type === "weekly") return "本周复习";
  if (reviewSession.type === "weak") return "弱项复习";
  if (reviewSession.type === "mistakes") return "错词复习";
  return "今日复习";
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
