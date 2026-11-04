document.addEventListener('DOMContentLoaded', () => {
  document.body.style.overflow = '';
  document.documentElement.style.overflow = '';

  // --- Info Modal ---
  const modal = document.getElementById('readingInfoModal');
  const partText = document.getElementById('readingModalPart');
  const titleText = document.getElementById('readingModalTitle');
  const descriptionText = document.getElementById('readingModalDescription');
  const metaText = document.getElementById('readingModalMeta');
  let lastTrigger = null;

  function openInfo(trigger, part, title, description, meta) {
    if (!modal) return;
    lastTrigger = trigger;
    if (partText) partText.textContent = part;
    if (titleText) titleText.textContent = title;
    if (descriptionText) descriptionText.textContent = description;
    if (metaText) metaText.textContent = meta;
    modal.classList.remove('hidden');
    modal.classList.add('flex');
    document.body.style.overflow = 'hidden';
    const closeBtn = document.getElementById('closeReadingModal');
    if (closeBtn) closeBtn.focus();
  }

  function closeInfo() {
    if (!modal || modal.classList.contains('hidden')) return;
    modal.classList.add('hidden');
    modal.classList.remove('flex');
    document.body.style.overflow = '';
    if (lastTrigger) lastTrigger.focus();
  }

  // --- Screens Management ---
  const readingPracticeScreen = document.getElementById('readingPracticeScreen');
  const readingPart6PracticeScreen = document.getElementById('readingPart6PracticeScreen');
  const readingPart7PracticeScreen = document.getElementById('readingPart7PracticeScreen');
  let readingPracticeTrigger = null;
  let activeReadingPracticeScreen = null;

  const dashboardMain = document.getElementById('dashboardMain');
  const readingDashboardSections = dashboardMain
    ? [...dashboardMain.children].filter(
        (element) =>
          ![
            'basicReadingExperience',
            'readingPracticeScreen',
            'readingPart6PracticeScreen',
            'readingPart7PracticeScreen',
            'readingInfoModal'
          ].includes(element.id) && element.tagName !== 'SCRIPT'
      )
    : [];

  function openReadingPractice(screen, button, closeButtonId) {
    if (!screen) return;
    if (screen === readingPracticeScreen && typeof resetPart5Question === 'function') {
      resetPart5Question();
    }
    readingPracticeTrigger = button;
    activeReadingPracticeScreen = screen;
    document.querySelectorAll('.reading-notes-drawer').forEach((drawer) => {
      drawer.hidden = true;
    });
    document
      .querySelectorAll('#readingPracticeNotesButton, #readingPart6NotesButton, #readingPart7NotesButton')
      .forEach((noteButton) => noteButton.setAttribute('aria-pressed', 'false'));
    readingDashboardSections.forEach((element) => element.classList.add('hidden'));
    screen.hidden = false;
    document.body.style.overflow = 'hidden';
    const closeBtn = document.getElementById(closeButtonId);
    if (closeBtn) closeBtn.focus({ preventScroll: true });
  }

  function closeReadingPractice() {
    if (!activeReadingPracticeScreen || activeReadingPracticeScreen.hidden) return;
    document.querySelectorAll('.reading-notes-drawer').forEach((drawer) => {
      drawer.hidden = true;
    });
    document
      .querySelectorAll('#readingPracticeNotesButton, #readingPart6NotesButton, #readingPart7NotesButton')
      .forEach((noteButton) => noteButton.setAttribute('aria-pressed', 'false'));
    activeReadingPracticeScreen.hidden = true;
    activeReadingPracticeScreen = null;
    document.body.style.overflow = '';
    readingDashboardSections.forEach((element) => element.classList.remove('hidden'));
    if (readingPracticeTrigger) readingPracticeTrigger.focus({ preventScroll: true });
  }

  document.querySelectorAll('.reading-start').forEach((button) =>
    button.addEventListener('click', (event) => {
      if (button.dataset.part === 'Part 5') {
        event.preventDefault();
        openReadingPractice(readingPracticeScreen, button, 'closeReadingPractice');
        return;
      }
      if (button.dataset.part === 'Part 6') {
        event.preventDefault();
        openReadingPractice(readingPart6PracticeScreen, button, 'closeReadingPart6Practice');
        return;
      }
      if (button.dataset.part === 'Part 7') {
        event.preventDefault();
        openReadingPractice(readingPart7PracticeScreen, button, 'closeReadingPart7Practice');
        return;
      }
      openInfo(
        button,
        button.dataset.part + ' · ' + button.dataset.questions + ' CÂU',
        button.dataset.title,
        button.dataset.subtitle,
        button.dataset.lessons +
          ' bài · khoảng ' +
          button.dataset.minutes +
          ' phút. Bài đọc sẽ được kết nối khi có dữ liệu câu hỏi.'
      );
    })
  );

  const closePracticeBtn = document.getElementById('closeReadingPractice');
  if (closePracticeBtn) closePracticeBtn.addEventListener('click', closeReadingPractice);

  const closePart6Btn = document.getElementById('closeReadingPart6Practice');
  if (closePart6Btn) closePart6Btn.addEventListener('click', closeReadingPractice);

  const closePart7Btn = document.getElementById('closeReadingPart7Practice');
  if (closePart7Btn) closePart7Btn.addEventListener('click', closeReadingPractice);

  // --- Reading Coverage & Progress Calculation ---
  const READING_PART_KEYS = {
    'Part 5': 'toeic-reading-part5-answered-questions',
    'Part 6': 'toeic-reading-part6-answered-questions',
    'Part 7': 'toeic-reading-part7-answered-questions'
  };

  const READING_PART_TOTALS = {
    'Part 5': 630,
    'Part 6': 336,
    'Part 7': 1134
  };

  const READING_BUTTON_CLASSES = {
    'Part 5': {
      notStarted:
        'reading-start ml-auto inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-[10px] font-extrabold transition border border-emerald-200 bg-white text-emerald-700 hover:bg-emerald-50 dark:border-emerald-500/30 dark:bg-slate-900/60 dark:text-emerald-300',
      inProgress:
        'reading-start ml-auto inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-[10px] font-extrabold transition bg-emerald-600 text-white hover:bg-emerald-700'
    },
    'Part 6': {
      notStarted:
        'reading-start ml-auto inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-[10px] font-extrabold transition border border-cyan-200 bg-white text-cyan-700 hover:bg-cyan-50 dark:border-cyan-500/30 dark:bg-slate-900/60 dark:text-cyan-300',
      inProgress:
        'reading-start ml-auto inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-[10px] font-extrabold transition bg-cyan-600 text-white hover:bg-cyan-700'
    },
    'Part 7': {
      notStarted:
        'reading-start ml-auto inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-[10px] font-extrabold transition border border-blue-200 bg-white text-blue-700 hover:bg-blue-50 dark:border-blue-500/30 dark:bg-slate-900/60 dark:text-blue-300',
      inProgress:
        'reading-start ml-auto inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-[10px] font-extrabold transition bg-blue-600 text-white hover:bg-blue-700'
    }
  };

  function getStoredAnsweredQuestions(part) {
    const key = READING_PART_KEYS[part];
    if (!key) return [];
    try {
      return JSON.parse(localStorage.getItem(key) || '[]');
    } catch {
      return [];
    }
  }

  function setStoredAnsweredQuestions(part, list) {
    const key = READING_PART_KEYS[part];
    if (!key) return;
    localStorage.setItem(key, JSON.stringify(list));
  }

  function updateReadingCoverage() {
    let totalAnsweredCount = 0;
    let totalQuestionsCount = 0;
    let partsWithProgress = 0;

    document.querySelectorAll('[data-reading-card-part]').forEach((card) => {
      const part = card.dataset.readingCardPart;
      const total = Number(card.dataset.readingCardTotal) || READING_PART_TOTALS[part] || 100;
      const answeredList = getStoredAnsweredQuestions(part);
      const count = answeredList.length;

      totalAnsweredCount += count;
      totalQuestionsCount += total;
      if (count > 0) partsWithProgress++;

      // 0 câu -> 0%; từ 1 câu trở lên -> ít nhất 1%
      const coveragePercent = count === 0 ? 0 : Math.max(1, Math.round((count / total) * 100));

      const percentEl = card.querySelector('[data-reading-card-percent]');
      if (percentEl) percentEl.textContent = `${coveragePercent}%`;

      const barEl = card.querySelector('[data-reading-card-bar]');
      if (barEl) barEl.style.width = `${coveragePercent}%`;

      const countEl = card.querySelector('[data-reading-card-count]');
      if (countEl) countEl.textContent = `${count}/${total} câu`;

      const actionBtn = card.querySelector('.reading-start');
      if (actionBtn && READING_BUTTON_CLASSES[part]) {
        if (coveragePercent === 0) {
          actionBtn.className = READING_BUTTON_CLASSES[part].notStarted;
          actionBtn.innerHTML = 'Vào luyện <i class="fa-solid fa-arrow-right" aria-hidden="true"></i>';
        } else {
          actionBtn.className = READING_BUTTON_CLASSES[part].inProgress;
          actionBtn.innerHTML = 'Luyện tiếp <i class="fa-solid fa-arrow-right" aria-hidden="true"></i>';
        }
      }
    });

    const practicedPartsEl = document.getElementById('readingPracticedPartsCount');
    if (practicedPartsEl) practicedPartsEl.textContent = `${partsWithProgress}/3`;

    const totalPercentEl = document.getElementById('readingTotalCoveragePercent');
    const totalBarEl = document.getElementById('readingTotalCoverageBar');
    const totalCoverage =
      totalAnsweredCount === 0 || totalQuestionsCount === 0
        ? 0
        : Math.max(1, Math.round((totalAnsweredCount / totalQuestionsCount) * 100));

    if (totalPercentEl) totalPercentEl.textContent = `${totalCoverage}%`;
    if (totalBarEl) totalBarEl.style.width = `${totalCoverage}%`;
  }

  // Khởi tạo tính toán độ phủ ngay khi tải trang
  updateReadingCoverage();

  // --- Vocabulary Panel (Part 5) ---
  const readingVocabularyPanel = document.getElementById('readingVocabularyPanel');
  const readingVocabularyList = document.getElementById('readingVocabularyList');
  const readingVocabularyButton = document.getElementById('readingPracticeVocabularyButton');
  if (readingVocabularyButton && readingVocabularyPanel) {
    readingVocabularyButton.addEventListener('click', () => {
      readingVocabularyPanel.hidden = !readingVocabularyPanel.hidden;
      readingVocabularyButton.setAttribute('aria-pressed', String(!readingVocabularyPanel.hidden));
      if (!readingVocabularyPanel.hidden)
        readingVocabularyPanel.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
    });
  }

  const readingVocabExpandBtn = document.getElementById('readingVocabularyExpand');
  if (readingVocabExpandBtn && readingVocabularyList) {
    readingVocabExpandBtn.addEventListener('click', (event) => {
      const button = event.currentTarget;
      const expanded = button.getAttribute('aria-expanded') === 'true';
      readingVocabularyList.classList.toggle('is-expanded', !expanded);
      button.setAttribute('aria-expanded', String(!expanded));
      button.innerHTML = `<i class="fa-solid fa-chevron-${
        expanded ? 'down' : 'up'
      }" aria-hidden="true"></i> ${expanded ? 'Xem đầy đủ' : 'Thu gọn'}`;
    });
  }

  // --- Part 5 Answer selection ---
  const PART5_CORRECT_ANSWER = 'B';
  const circleSvg = '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-circle"><circle cx="12" cy="12" r="10"></circle></svg>';
  const checkSvg = '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-circle-check"><circle cx="12" cy="12" r="10"></circle><path d="m9 12 2 2 4-4"></path></svg>';
  const xSvg = '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-circle-x"><circle cx="12" cy="12" r="10"></circle><path d="m15 9-6 6"></path><path d="m9 9 6 6"></path></svg>';

  function updatePart5Traps(selectedAnswer) {
    document.querySelectorAll('[data-part5-trap]').forEach((trap) => {
      const choice = trap.dataset.part5Trap;
      const label = trap.dataset.trapLabel || `(${choice})`;
      const titleEl = trap.querySelector('[data-part5-trap-title]');
      const isSelectedWrong = selectedAnswer && choice === selectedAnswer;
      if (isSelectedWrong) {
        trap.className =
          'rounded-lg border border-red-200 bg-red-50/90 p-3 text-red-900 dark:border-red-800/60 dark:bg-red-950/35 dark:text-red-200';
        if (titleEl) {
          titleEl.className = 'font-bold text-red-600 dark:text-red-400';
          titleEl.textContent = `❖ Bạn chọn ${label}`;
        }
      } else {
        trap.className =
          'rounded-lg border border-slate-200/90 bg-slate-100/80 p-3 dark:border-slate-700 dark:bg-slate-800/60';
        if (titleEl) {
          titleEl.className = 'font-bold text-amber-600 dark:text-amber-400';
          titleEl.textContent = `❖ ${label}`;
        }
      }
    });
  }

  function hasPart5Answer() {
    return Boolean(document.querySelector('[data-reading-answer][aria-pressed="true"]'));
  }

  function updatePart5Panels() {
    const answered = hasPart5Answer();
    const translationTool = document.querySelector('[data-reading-tool="translation"]');
    const explanationTool = document.querySelector('[data-reading-tool="explanation"]');
    const showTranslation =
      answered && translationTool && translationTool.getAttribute('aria-pressed') === 'true';
    const showExplanation =
      answered && explanationTool && explanationTool.getAttribute('aria-pressed') === 'true';

    const transEl = document.getElementById('readingPracticeTranslation');
    if (transEl) transEl.hidden = !showTranslation;
    document.querySelectorAll('.part5-option-translation').forEach((item) => {
      item.hidden = !showTranslation;
    });

    const explanation = document.getElementById('readingPracticeExplanation');
    if (explanation) explanation.hidden = !showExplanation;
  }

  function resetPart5Question() {
    document.querySelectorAll('[data-reading-answer]').forEach((option) => {
      option.setAttribute('aria-checked', 'false');
      option.setAttribute('aria-pressed', 'false');
      option.classList.remove('is-correct', 'is-incorrect');
      const mark = option.querySelector('.reading-practice-option-mark');
      if (mark) mark.innerHTML = circleSvg;
    });
    document.querySelectorAll('[data-reading-tool]').forEach((button) => {
      button.setAttribute('aria-pressed', 'false');
    });
    updatePart5Traps(null);
    updatePart5Panels();
  }

  document.querySelectorAll('[data-reading-answer]').forEach((button) =>
    button.addEventListener('click', () => {
      // Đưa tất cả options về trạng thái chưa chọn
      document.querySelectorAll('[data-reading-answer]').forEach((option) => {
        option.setAttribute('aria-checked', 'false');
        option.setAttribute('aria-pressed', 'false');
        option.classList.remove('is-correct', 'is-incorrect');
        const mark = option.querySelector('.reading-practice-option-mark');
        if (mark) mark.innerHTML = circleSvg;
      });

      const selected = button.dataset.readingAnswer;
      const isCorrect = selected === PART5_CORRECT_ANSWER;

      // Luôn làm nổi bật đáp án đúng (Màu xanh lá)
      const correctOption = document.querySelector(`[data-reading-answer="${PART5_CORRECT_ANSWER}"]`);
      if (correctOption) {
        correctOption.classList.add('is-correct');
        const mark = correctOption.querySelector('.reading-practice-option-mark');
        if (mark) mark.innerHTML = checkSvg;
      }

      // Nếu người dùng chọn sai, làm nổi bật lựa chọn sai đó (Màu đỏ)
      if (!isCorrect) {
        button.classList.add('is-incorrect');
        button.setAttribute('aria-checked', 'true');
        button.setAttribute('aria-pressed', 'true');
        const mark = button.querySelector('.reading-practice-option-mark');
        if (mark) mark.innerHTML = xSvg;
      } else {
        button.setAttribute('aria-checked', 'true');
        button.setAttribute('aria-pressed', 'true');
      }

      updatePart5Traps(selected);
      updatePart5Panels();

      const p5List = new Set(getStoredAnsweredQuestions('Part 5'));
      p5List.add('101');
      setStoredAnsweredQuestions('Part 5', [...p5List]);
      updateReadingCoverage();
    })
  );

  const resetBtn = document.getElementById('readingPracticeReset');
  if (resetBtn) {
    resetBtn.addEventListener('click', () => {
      resetPart5Question();
      const p5List = new Set(getStoredAnsweredQuestions('Part 5'));
      p5List.delete('101');
      setStoredAnsweredQuestions('Part 5', [...p5List]);
      updateReadingCoverage();
    });
  }

  // --- Part 6 Answer selection & Analysis ---
  function getPart6AnsweredQuestions() {
    return new Set(
      [...document.querySelectorAll('#readingPart6PracticeScreen [data-part6-answer][aria-pressed="true"]')].map(
        (option) => option.dataset.part6Answer.split('-')[0]
      )
    );
  }

  function updatePart6Panels() {
    const answeredQuestions = getPart6AnsweredQuestions();
    const hasAnswered = answeredQuestions.size > 0;
    const transBtn = document.getElementById('readingPart6TranslationButton');
    const expBtn = document.getElementById('readingPart6ExplanationButton');

    if (!hasAnswered) {
      if (transBtn) transBtn.setAttribute('aria-pressed', 'false');
      if (expBtn) expBtn.setAttribute('aria-pressed', 'false');
    }

    const showTranslation =
      hasAnswered && transBtn && transBtn.getAttribute('aria-pressed') === 'true';
    const showExplanation =
      hasAnswered && expBtn && expBtn.getAttribute('aria-pressed') === 'true';

    const transEl = document.getElementById('readingPart6Translation');
    if (transEl) transEl.hidden = !showTranslation;

    document.querySelectorAll('[data-part6-card]').forEach((card) => {
      const qNum = card.dataset.part6Card;
      const isCardAnswered = answeredQuestions.has(qNum);
      card.querySelectorAll('.part6-option-translation').forEach((item) => {
        item.hidden = !(showTranslation && isCardAnswered);
      });
    });

    document.querySelectorAll('[data-part6-analysis]').forEach((panel) => {
      panel.hidden = !(showExplanation && answeredQuestions.has(panel.dataset.part6Analysis));
    });
  }

  document.querySelectorAll('[data-part6-answer]').forEach((button) =>
    button.addEventListener('click', () => {
      const group = button.closest('.reading-part6-options');
      if (!group) return;
      group.querySelectorAll('[data-part6-answer]').forEach((option) => {
        const selected = option === button;
        option.setAttribute('aria-checked', String(selected));
        option.setAttribute('aria-pressed', String(selected));
        option.classList.remove('is-correct', 'is-incorrect');
        const mark = option.querySelector('.reading-part6-option-mark');
        if (mark) mark.innerHTML = '';
      });
      const correctAnswers = { '131': '131-A', '132': '132-C', '133': '133-D', '134': '134-C' };
      const questionNumber = button.dataset.part6Answer.split('-')[0];
      const correct = button.dataset.part6Answer === correctAnswers[questionNumber];
      const correctOption = group.querySelector(`[data-part6-answer="${correctAnswers[questionNumber]}"]`);
      if (correctOption) {
        correctOption.classList.add('is-correct');
        const mark = correctOption.querySelector('.reading-part6-option-mark');
        if (mark) mark.innerHTML = '<i class="fa-regular fa-circle-check" aria-hidden="true"></i>';
      }
      if (!correct) {
        button.classList.add('is-incorrect');
        const mark = button.querySelector('.reading-part6-option-mark');
        if (mark) mark.innerHTML = '<i class="fa-regular fa-circle-xmark" aria-hidden="true"></i>';
      }
      updatePart6Panels();

      const p6List = new Set(getStoredAnsweredQuestions('Part 6'));
      p6List.add(questionNumber);
      setStoredAnsweredQuestions('Part 6', [...p6List]);
      updateReadingCoverage();
    })
  );

  const part6TransBtn = document.getElementById('readingPart6TranslationButton');
  if (part6TransBtn) {
    part6TransBtn.addEventListener('click', (event) => {
      const button = event.currentTarget;
      if (getPart6AnsweredQuestions().size === 0) {
        button.setAttribute('aria-pressed', 'false');
        updatePart6Panels();
        return;
      }
      const visible = button.getAttribute('aria-pressed') !== 'true';
      button.setAttribute('aria-pressed', String(visible));
      updatePart6Panels();
      if (visible) {
        const transEl = document.getElementById('readingPart6Translation');
        if (transEl) transEl.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
      }
    });
  }

  const part6ExpBtn = document.getElementById('readingPart6ExplanationButton');
  if (part6ExpBtn) {
    part6ExpBtn.addEventListener('click', (event) => {
      const button = event.currentTarget;
      if (getPart6AnsweredQuestions().size === 0) {
        button.setAttribute('aria-pressed', 'false');
        updatePart6Panels();
        return;
      }
      const visible = button.getAttribute('aria-pressed') !== 'true';
      button.setAttribute('aria-pressed', String(visible));
      updatePart6Panels();
      if (visible) {
        const firstPanel = document.querySelector('[data-part6-analysis]:not([hidden])');
        if (firstPanel) firstPanel.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
      }
    });
  }

  const part6VocabBtn = document.getElementById('readingPart6VocabularyButton');
  if (part6VocabBtn) {
    part6VocabBtn.addEventListener('click', (event) => {
      const button = event.currentTarget;
      const visible = button.getAttribute('aria-pressed') !== 'true';
      button.setAttribute('aria-pressed', String(visible));
      const panel = document.getElementById('readingPart6VocabularyPanel');
      if (panel) {
        panel.hidden = !visible;
        if (visible) panel.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
      }
    });
  }

  const part6VocabExpandBtn = document.getElementById('readingPart6VocabularyExpand');
  if (part6VocabExpandBtn) {
    part6VocabExpandBtn.addEventListener('click', (event) => {
      const button = event.currentTarget;
      const expanded = button.getAttribute('aria-expanded') === 'true';
      const list = document.getElementById('readingPart6VocabularyList');
      if (list) list.classList.toggle('is-expanded', !expanded);
      button.setAttribute('aria-expanded', String(!expanded));
      button.innerHTML = `<i class="fa-solid fa-chevron-${
        expanded ? 'down' : 'up'
      }" aria-hidden="true"></i> ${expanded ? 'Xem đầy đủ' : 'Thu gọn'}`;
    });
  }

  document.querySelectorAll('[data-part6-reset]').forEach((button) =>
    button.addEventListener('click', () => {
      const card = button.closest('[data-part6-card]');
      if (!card) return;
      card.querySelectorAll('[data-part6-answer]').forEach((option) => {
        option.setAttribute('aria-checked', 'false');
        option.setAttribute('aria-pressed', 'false');
        option.classList.remove('is-correct', 'is-incorrect');
        const mark = option.querySelector('.reading-part6-option-mark');
        if (mark) mark.innerHTML = '';
      });
      updatePart6Panels();

      const questionNumber = card.dataset.part6Card;
      if (questionNumber) {
        const p6List = new Set(getStoredAnsweredQuestions('Part 6'));
        p6List.delete(questionNumber);
        setStoredAnsweredQuestions('Part 6', [...p6List]);
        updateReadingCoverage();
      }
    })
  );

  // --- Part 7 Answer selection & Analysis ---
  let activePart7Question = null;
  const part7CorrectAnswers = { '147': '147-B', '148': '148-A' };

  function getPart7AnsweredQuestions() {
    return new Set(
      [...document.querySelectorAll('#readingPart7PracticeScreen [data-part7-answer][aria-pressed="true"]')].map(
        (option) => option.dataset.part7Answer.split('-')[0]
      )
    );
  }

  function updatePart7Panels() {
    const answeredQuestions = getPart7AnsweredQuestions();
    const hasAnswered = answeredQuestions.size > 0;
    const transBtn = document.getElementById('readingPart7TranslationButton');
    const expBtn = document.getElementById('readingPart7ExplanationButton');
    const eviBtn = document.getElementById('readingPart7EvidenceButton');

    if (!hasAnswered) {
      if (transBtn) transBtn.setAttribute('aria-pressed', 'false');
      if (expBtn) expBtn.setAttribute('aria-pressed', 'false');
      if (eviBtn) eviBtn.setAttribute('aria-pressed', 'false');
    }

    const showTranslation =
      hasAnswered && transBtn && transBtn.getAttribute('aria-pressed') === 'true';
    const showExplanation =
      hasAnswered && expBtn && expBtn.getAttribute('aria-pressed') === 'true';
    const showEvidence =
      hasAnswered && eviBtn && eviBtn.getAttribute('aria-pressed') === 'true';

    const translation = document.getElementById('readingPart7Translation');
    if (translation) translation.hidden = !showTranslation;

    document.querySelectorAll('[data-part7-card]').forEach((card) => {
      const qNum = card.dataset.part7Card;
      const isCardAnswered = answeredQuestions.has(qNum);
      card
        .querySelectorAll('.part7-question-translation, .part7-option-translation')
        .forEach((item) => {
          item.hidden = !(showTranslation && isCardAnswered);
        });
    });

    document.querySelectorAll('[data-part7-analysis]').forEach((panel) => {
      panel.hidden = !(showExplanation && answeredQuestions.has(panel.dataset.part7Analysis));
    });
    document.querySelectorAll('[data-part7-evidence]').forEach((panel) => {
      panel.hidden = !(showEvidence && answeredQuestions.has(panel.dataset.part7Evidence));
    });
  }

  document.querySelectorAll('[data-part7-answer]').forEach((button) =>
    button.addEventListener('click', () => {
      const group = button.closest('.reading-part6-options');
      if (!group) return;
      group.querySelectorAll('[data-part7-answer]').forEach((option) => {
        const selected = option === button;
        option.setAttribute('aria-checked', String(selected));
        option.setAttribute('aria-pressed', String(selected));
        option.classList.remove('is-correct', 'is-incorrect');
        const mark = option.querySelector('.reading-part6-option-mark');
        if (mark) mark.innerHTML = '';
      });
      const questionNumber = button.dataset.part7Answer.split('-')[0];
      activePart7Question = questionNumber;
      const correct = button.dataset.part7Answer === part7CorrectAnswers[questionNumber];
      const correctOption = group.querySelector(`[data-part7-answer="${part7CorrectAnswers[questionNumber]}"]`);
      if (correctOption) {
        correctOption.classList.add('is-correct');
        const mark = correctOption.querySelector('.reading-part6-option-mark');
        if (mark) mark.innerHTML = '<i class="fa-regular fa-circle-check" aria-hidden="true"></i>';
      }
      if (!correct) {
        button.classList.add('is-incorrect');
        const mark = button.querySelector('.reading-part6-option-mark');
        if (mark) mark.innerHTML = '<i class="fa-regular fa-circle-xmark" aria-hidden="true"></i>';
      }
      updatePart7Panels();

      const p7List = new Set(getStoredAnsweredQuestions('Part 7'));
      p7List.add(questionNumber);
      setStoredAnsweredQuestions('Part 7', [...p7List]);
      updateReadingCoverage();
    })
  );

  const part7TransBtn = document.getElementById('readingPart7TranslationButton');
  if (part7TransBtn) {
    part7TransBtn.addEventListener('click', (event) => {
      const button = event.currentTarget;
      if (getPart7AnsweredQuestions().size === 0) {
        button.setAttribute('aria-pressed', 'false');
        updatePart7Panels();
        return;
      }
      const visible = button.getAttribute('aria-pressed') !== 'true';
      button.setAttribute('aria-pressed', String(visible));
      updatePart7Panels();
      if (visible) {
        const translation = document.getElementById('readingPart7Translation');
        if (translation) translation.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
      }
    });
  }

  ['Evidence', 'Explanation'].forEach((tool) => {
    const button = document.getElementById(`readingPart7${tool}Button`);
    if (button) {
      button.addEventListener('click', () => {
        if (getPart7AnsweredQuestions().size === 0) {
          button.setAttribute('aria-pressed', 'false');
          updatePart7Panels();
          return;
        }
        const visible = button.getAttribute('aria-pressed') !== 'true';
        button.setAttribute('aria-pressed', String(visible));
        updatePart7Panels();
      });
    }
  });

  const part7VocabBtn = document.getElementById('readingPart7VocabularyButton');
  if (part7VocabBtn) {
    part7VocabBtn.addEventListener('click', (event) => {
      const button = event.currentTarget;
      const visible = button.getAttribute('aria-pressed') !== 'true';
      button.setAttribute('aria-pressed', String(visible));
      const panel = document.getElementById('readingPart7VocabularyPanel');
      if (panel) {
        panel.hidden = !visible;
        if (visible) panel.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
      }
    });
  }

  const part7VocabExpandBtn = document.getElementById('readingPart7VocabularyExpand');
  if (part7VocabExpandBtn) {
    part7VocabExpandBtn.addEventListener('click', (event) => {
      const button = event.currentTarget;
      const expanded = button.getAttribute('aria-expanded') === 'true';
      const list = document.getElementById('readingPart7VocabularyList');
      if (list) list.classList.toggle('is-expanded', !expanded);
      button.setAttribute('aria-expanded', String(!expanded));
      button.innerHTML = `<i class="fa-solid fa-chevron-${
        expanded ? 'down' : 'up'
      }" aria-hidden="true"></i> ${expanded ? 'Xem đầy đủ' : 'Thu gọn'}`;
    });
  }

  document.querySelectorAll('[data-part7-reset]').forEach((button) =>
    button.addEventListener('click', () => {
      const card = button.closest('[data-part7-card]');
      if (!card) return;
      card.querySelectorAll('[data-part7-answer]').forEach((option) => {
        option.setAttribute('aria-checked', 'false');
        option.setAttribute('aria-pressed', 'false');
        option.classList.remove('is-correct', 'is-incorrect');
        const mark = option.querySelector('.reading-part6-option-mark');
        if (mark) mark.innerHTML = '';
      });
      if (activePart7Question === card.dataset.part7Card) {
        activePart7Question = null;
      }
      updatePart7Panels();

      const questionNumber = card.dataset.part7Card;
      if (questionNumber) {
        const p7List = new Set(getStoredAnsweredQuestions('Part 7'));
        p7List.delete(questionNumber);
        setStoredAnsweredQuestions('Part 7', [...p7List]);
        updateReadingCoverage();
      }
    })
  );

  // --- Reading Tool buttons (Part 5) ---
  document.querySelectorAll('[data-reading-tool]').forEach((button) =>
    button.addEventListener('click', () => {
      if (!hasPart5Answer()) {
        button.setAttribute('aria-pressed', 'false');
        updatePart5Panels();
        return;
      }
      const active = button.getAttribute('aria-pressed') !== 'true';
      button.setAttribute('aria-pressed', String(active));
      updatePart5Panels();
      if (button.dataset.readingTool === 'explanation' && active) {
        const explanation = document.getElementById('readingPracticeExplanation');
        if (explanation) {
          explanation.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
        }
      }
    })
  );

  // --- Vocabulary Save to localStorage ---
  const readingVocabularyStorage = 'toeic-reading-saved-vocabulary';
  const savedReadingVocabulary = new Set(
    JSON.parse(localStorage.getItem(readingVocabularyStorage) || '[]')
  );
  document.querySelectorAll('[data-reading-save]').forEach((button) => {
    const term = button.dataset.readingSave;
    button.setAttribute('aria-pressed', String(savedReadingVocabulary.has(term)));
    if (savedReadingVocabulary.has(term))
      button.innerHTML = '<i class="fa-solid fa-bookmark" aria-hidden="true"></i> Đã lưu';
    button.addEventListener('click', () => {
      if (savedReadingVocabulary.has(term)) savedReadingVocabulary.delete(term);
      else savedReadingVocabulary.add(term);
      localStorage.setItem(
        readingVocabularyStorage,
        JSON.stringify([...savedReadingVocabulary])
      );
      button.setAttribute('aria-pressed', String(savedReadingVocabulary.has(term)));
      button.innerHTML = `<i class="fa-${
        savedReadingVocabulary.has(term) ? 'solid' : 'regular'
      } fa-bookmark" aria-hidden="true"></i> ${
        savedReadingVocabulary.has(term) ? 'Đã lưu' : 'Lưu'
      }`;
    });
  });

  // --- Vocabulary Pronunciation (Web Speech API) ---
  document.querySelectorAll('[data-reading-pronounce]').forEach((button) =>
    button.addEventListener('click', () => {
      if (!('speechSynthesis' in window)) return;
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(button.dataset.readingPronounce);
      utterance.lang = button.dataset.accent || 'en-US';
      utterance.rate = 0.88;
      window.speechSynthesis.speak(utterance);
    })
  );

  // --- Notes Drawer (Part 5) ---
  const readingNotesDrawer = document.getElementById('readingNotesDrawer');
  const readingNotesEditor = document.getElementById('readingNotesEditor');
  const readingNotesStatus = document.getElementById('readingNotesStatus');
  if (readingNotesEditor) {
    readingNotesEditor.innerHTML =
      localStorage.getItem('toeic-reading-part5-test2-notes') || '';
    let readingNotesSaveTimer = null;
    readingNotesEditor.addEventListener('input', () => {
      if (readingNotesStatus) readingNotesStatus.textContent = 'Đang lưu...';
      clearTimeout(readingNotesSaveTimer);
      readingNotesSaveTimer = setTimeout(() => {
        localStorage.setItem(
          'toeic-reading-part5-test2-notes',
          readingNotesEditor.innerHTML
        );
        if (readingNotesStatus) readingNotesStatus.textContent = 'Đã lưu';
      }, 250);
    });
  }

  const notesToolbar = document.querySelector(
    '.reading-notes-toolbar:not(.reading-part6-notes-toolbar):not(.reading-part7-notes-toolbar)'
  );
  if (notesToolbar && readingNotesEditor) {
    notesToolbar.addEventListener('mousedown', (event) => {
      const button = event.target.closest('[data-reading-note-command]');
      if (!button) return;
      event.preventDefault();
      readingNotesEditor.focus();
      document.execCommand(
        button.dataset.readingNoteCommand,
        false,
        button.dataset.readingNoteValue || null
      );
      readingNotesEditor.dispatchEvent(new Event('input', { bubbles: true }));
    });
  }

  const notesBtn = document.getElementById('readingPracticeNotesButton');
  if (notesBtn && readingNotesDrawer) {
    notesBtn.addEventListener('click', (event) => {
      readingNotesDrawer.hidden = !readingNotesDrawer.hidden;
      event.currentTarget.setAttribute('aria-pressed', String(!readingNotesDrawer.hidden));
      if (!readingNotesDrawer.hidden && readingNotesEditor) readingNotesEditor.focus();
    });
  }

  const closeNotesBtn = document.getElementById('closeReadingNotes');
  if (closeNotesBtn && readingNotesDrawer && notesBtn) {
    closeNotesBtn.addEventListener('click', () => {
      readingNotesDrawer.hidden = true;
      notesBtn.setAttribute('aria-pressed', 'false');
      notesBtn.focus();
    });
  }

  // --- Notes Drawer (Part 6) ---
  const readingPart6NotesDrawer = document.getElementById('readingPart6NotesDrawer');
  const readingPart6NotesEditor = document.getElementById('readingPart6NotesEditor');
  const readingPart6NotesStatus = document.getElementById('readingPart6NotesStatus');
  const readingPart6NotesStorageKey = 'toeic-reading-part6-test2-notes';
  if (readingPart6NotesEditor) {
    readingPart6NotesEditor.innerHTML =
      localStorage.getItem(readingPart6NotesStorageKey) || '';
    let readingPart6NotesSaveTimer = null;
    readingPart6NotesEditor.addEventListener('input', () => {
      if (readingPart6NotesStatus) readingPart6NotesStatus.textContent = 'Đang lưu...';
      clearTimeout(readingPart6NotesSaveTimer);
      readingPart6NotesSaveTimer = setTimeout(() => {
        localStorage.setItem(
          readingPart6NotesStorageKey,
          readingPart6NotesEditor.innerHTML
        );
        if (readingPart6NotesStatus) readingPart6NotesStatus.textContent = 'Đã lưu';
      }, 250);
    });
  }

  const part6NotesToolbar = document.querySelector('.reading-part6-notes-toolbar');
  if (part6NotesToolbar && readingPart6NotesEditor) {
    part6NotesToolbar.addEventListener('mousedown', (event) => {
      const button = event.target.closest('[data-reading-note-command]');
      if (!button) return;
      event.preventDefault();
      readingPart6NotesEditor.focus();
      document.execCommand(
        button.dataset.readingNoteCommand,
        false,
        button.dataset.readingNoteValue || null
      );
      readingPart6NotesEditor.dispatchEvent(new Event('input', { bubbles: true }));
    });
  }

  const part6NotesBtn = document.getElementById('readingPart6NotesButton');
  if (part6NotesBtn && readingPart6NotesDrawer) {
    part6NotesBtn.addEventListener('click', (event) => {
      readingPart6NotesDrawer.hidden = !readingPart6NotesDrawer.hidden;
      event.currentTarget.setAttribute('aria-pressed', String(!readingPart6NotesDrawer.hidden));
      if (!readingPart6NotesDrawer.hidden && readingPart6NotesEditor)
        readingPart6NotesEditor.focus();
    });
  }

  const closePart6NotesBtn = document.getElementById('closeReadingPart6Notes');
  if (closePart6NotesBtn && readingPart6NotesDrawer && part6NotesBtn) {
    closePart6NotesBtn.addEventListener('click', () => {
      readingPart6NotesDrawer.hidden = true;
      part6NotesBtn.setAttribute('aria-pressed', 'false');
      part6NotesBtn.focus();
    });
  }

  // --- Notes Drawer (Part 7) ---
  const readingPart7NotesDrawer = document.getElementById('readingPart7NotesDrawer');
  const readingPart7NotesEditor = document.getElementById('readingPart7NotesEditor');
  const readingPart7NotesStatus = document.getElementById('readingPart7NotesStatus');
  const readingPart7NotesStorageKey = 'toeic-reading-part7-test2-notes';
  if (readingPart7NotesEditor) {
    readingPart7NotesEditor.innerHTML =
      localStorage.getItem(readingPart7NotesStorageKey) || '';
    let readingPart7NotesSaveTimer = null;
    readingPart7NotesEditor.addEventListener('input', () => {
      if (readingPart7NotesStatus) readingPart7NotesStatus.textContent = 'Đang lưu...';
      clearTimeout(readingPart7NotesSaveTimer);
      readingPart7NotesSaveTimer = setTimeout(() => {
        localStorage.setItem(
          readingPart7NotesStorageKey,
          readingPart7NotesEditor.innerHTML
        );
        if (readingPart7NotesStatus) readingPart7NotesStatus.textContent = 'Đã lưu';
      }, 250);
    });
  }

  const part7NotesToolbar = document.querySelector('.reading-part7-notes-toolbar');
  if (part7NotesToolbar && readingPart7NotesEditor) {
    part7NotesToolbar.addEventListener('mousedown', (event) => {
      const button = event.target.closest('[data-reading-note-command]');
      if (!button) return;
      event.preventDefault();
      readingPart7NotesEditor.focus();
      document.execCommand(
        button.dataset.readingNoteCommand,
        false,
        button.dataset.readingNoteValue || null
      );
      readingPart7NotesEditor.dispatchEvent(new Event('input', { bubbles: true }));
    });
  }

  const part7NotesBtn = document.getElementById('readingPart7NotesButton');
  if (part7NotesBtn && readingPart7NotesDrawer) {
    part7NotesBtn.addEventListener('click', (event) => {
      readingPart7NotesDrawer.hidden = !readingPart7NotesDrawer.hidden;
      event.currentTarget.setAttribute('aria-pressed', String(!readingPart7NotesDrawer.hidden));
      if (!readingPart7NotesDrawer.hidden && readingPart7NotesEditor)
        readingPart7NotesEditor.focus();
    });
  }

  const closePart7NotesBtn = document.getElementById('closeReadingPart7Notes');
  if (closePart7NotesBtn && readingPart7NotesDrawer && part7NotesBtn) {
    closePart7NotesBtn.addEventListener('click', () => {
      readingPart7NotesDrawer.hidden = true;
      part7NotesBtn.setAttribute('aria-pressed', 'false');
      part7NotesBtn.focus();
    });
  }

  // Feedback Trigger
  document.querySelectorAll('[data-reading-feedback]').forEach((button) =>
    button.addEventListener('click', () => {
      if (typeof window.triggerFeedbackModal === 'function') {
        window.triggerFeedbackModal();
      }
    })
  );

  // ESC key handler for practice screens
  document.addEventListener('keydown', (event) => {
    if (event.key !== 'Escape' || !activeReadingPracticeScreen) return;
    if (
      activeReadingPracticeScreen === readingPracticeScreen &&
      readingNotesDrawer &&
      !readingNotesDrawer.hidden
    ) {
      readingNotesDrawer.hidden = true;
      if (notesBtn) notesBtn.setAttribute('aria-pressed', 'false');
    } else if (
      activeReadingPracticeScreen === readingPart6PracticeScreen &&
      readingPart6NotesDrawer &&
      !readingPart6NotesDrawer.hidden
    ) {
      readingPart6NotesDrawer.hidden = true;
      if (part6NotesBtn) part6NotesBtn.setAttribute('aria-pressed', 'false');
    } else if (
      activeReadingPracticeScreen === readingPart7PracticeScreen &&
      readingPart7NotesDrawer &&
      !readingPart7NotesDrawer.hidden
    ) {
      readingPart7NotesDrawer.hidden = true;
      if (part7NotesBtn) part7NotesBtn.setAttribute('aria-pressed', 'false');
    } else {
      closeReadingPractice();
    }
  });

  // --- Basic Reading Experience (News in Levels) ---
  const readingExperience = document.getElementById('basicReadingExperience');
  let currentLevel = 1;
  let currentLesson = 0;
  let currentQuestion = 0;
  let showTranslations = false;
  let showStructures = false;
  let answered = false;

  const readingArticles = {
    1: [
      {
        title: 'News in Levels - Level 1',
        sentences: [
          'A famous psychologist gives us three rules to make children safe with technologies.',
          'People need other people to feel happy and safe.',
          'Many years ago, children start using smartphones.',
          'They do not play outside with their friends.',
          'This is a big problem because children need to talk, have fun, and walk together.',
          'Because they are always online, many young people feel very lonely and sad.',
          'They watch too many short videos.',
          'They cannot look at a book or watch a long film.',
          'These things can save our children.',
          'First, do not let children use social media before they are 16 years old.',
          'Second, schools should use real books and pens, not computers and tablets.',
          'Children learn from people, not from screens.',
          'Also, do not give children AI toys or robots which talk like friends.',
          'These machines do not care about children.',
          'They can hurt the love between a child and a parent.'
        ],
        translations: [
          'Một nhà tâm lý học nổi tiếng đưa ra ba quy tắc giúp trẻ an toàn khi dùng công nghệ.',
          'Con người cần những người khác để cảm thấy hạnh phúc và an toàn.',
          'Nhiều năm trước, trẻ em bắt đầu sử dụng điện thoại thông minh.',
          'Các em không chơi bên ngoài với bạn bè.',
          'Đây là vấn đề lớn vì trẻ cần trò chuyện, vui chơi và đi dạo cùng nhau.',
          'Vì luôn trực tuyến, nhiều bạn trẻ cảm thấy cô đơn và buồn bã.',
          'Các em xem quá nhiều video ngắn.',
          'Các em không thể đọc sách hoặc xem một bộ phim dài.',
          'Những điều này có thể bảo vệ con em chúng ta.',
          'Thứ nhất, đừng để trẻ dùng mạng xã hội trước 16 tuổi.',
          'Thứ hai, trường học nên dùng sách và bút thật thay vì máy tính và máy tính bảng.',
          'Trẻ học từ con người chứ không phải từ màn hình.',
          'Ngoài ra, đừng cho trẻ đồ chơi AI hoặc robot nói chuyện như bạn bè.',
          'Những cỗ máy này không quan tâm đến trẻ.',
          'Chúng có thể làm tổn thương tình cảm giữa trẻ và cha mẹ.'
        ],
        questions: [
          [
            'What is the main topic of this passage? / Ý chính của đoạn văn này là gì?',
            [
              'To describe the biography of a historical figure',
              'To write a fictional story for children',
              'To debate about a different political issue',
              'To report on the story: "Screens and AI toys hurt children"'
            ],
            3
          ],
          [
            'According to the passage, why do many young people feel lonely? / Vì sao nhiều bạn trẻ cảm thấy cô đơn?',
            [
              'They are always online and watch too many short videos',
              'They read too many books',
              'They walk with friends every day',
              'They use only real pens'
            ],
            0
          ],
          [
            'What does the writer suggest schools should use? / Tác giả đề xuất trường học nên dùng gì?',
            ['More tablets', 'Real books and pens', 'AI toys', 'Social media'],
            1
          ]
        ]
      },
      {
        title: 'News in Levels - Level 1',
        sentences: [
          'A small town opens a new community garden.',
          'People in the town plant vegetables and flowers together.',
          'Children learn how plants grow.',
          'Older people share seeds and helpful ideas.',
          'The garden gives everyone fresh food.',
          'Neighbours meet and talk while they work.',
          'Some families take vegetables home.',
          'Other families cook a meal for the whole street.',
          'The garden is open every weekend.',
          'Visitors can help water the plants.',
          'Rain helps the garden grow in spring.',
          'On sunny days, people sit under a tree.',
          'The town plans to add more garden beds.',
          'They also want to build a small pond.',
          'Everyone is welcome to join.'
        ],
        translations: [
          'Một thị trấn nhỏ mở khu vườn cộng đồng mới.',
          'Người dân cùng trồng rau và hoa.',
          'Trẻ em học cách cây cối phát triển.',
          'Người lớn tuổi chia sẻ hạt giống và ý tưởng hữu ích.',
          'Khu vườn mang đến thực phẩm tươi cho mọi người.',
          'Hàng xóm gặp gỡ và trò chuyện khi làm việc.',
          'Một số gia đình mang rau về nhà.',
          'Những gia đình khác nấu ăn cho cả khu phố.',
          'Khu vườn mở cửa mỗi cuối tuần.',
          'Khách có thể giúp tưới cây.',
          'Mưa giúp khu vườn phát triển vào mùa xuân.',
          'Ngày nắng, mọi người ngồi dưới một cái cây.',
          'Thị trấn dự định thêm nhiều luống cây.',
          'Họ cũng muốn xây một hồ nhỏ.',
          'Mọi người đều được chào đón tham gia.'
        ],
        questions: [
          [
            'What is the passage mainly about? / Đoạn văn chủ yếu nói về điều gì?',
            ['A new community garden', 'A school competition', 'A long trip', 'A flower shop'],
            0
          ],
          [
            'When is the garden open? / Khi nào khu vườn mở cửa?',
            ['Every morning', 'Every weekend', 'Only in spring', 'At night'],
            1
          ],
          [
            'What can visitors do? / Khách có thể làm gì?',
            ['Build a house', 'Water the plants', 'Sell seeds', 'Feed birds'],
            1
          ]
        ]
      },
      {
        title: 'News in Levels - Level 1',
        sentences: [
          'A city library starts a book club for children.',
          'The club meets every Saturday morning.',
          'A librarian reads a new story aloud.',
          'Children choose books to take home.',
          'They talk about their favourite characters.',
          'Some children draw pictures from the stories.',
          'Parents can join the reading time too.',
          'The library has books in many languages.',
          'New members are welcome each week.',
          'The club is free for every family.',
          'A local artist visits once a month.',
          'She teaches children how to make a storybook.',
          'The children enjoy sharing their work.',
          'The library hopes more children will visit.',
          'Reading together makes learning fun.'
        ],
        translations: [
          'Một thư viện thành phố mở câu lạc bộ sách cho trẻ em.',
          'Câu lạc bộ gặp nhau mỗi sáng thứ Bảy.',
          'Thủ thư đọc to một câu chuyện mới.',
          'Trẻ chọn sách để mang về nhà.',
          'Các em trò chuyện về nhân vật yêu thích.',
          'Một số em vẽ tranh từ những câu chuyện.',
          'Cha mẹ cũng có thể tham gia giờ đọc.',
          'Thư viện có sách bằng nhiều ngôn ngữ.',
          'Thành viên mới được chào đón mỗi tuần.',
          'Câu lạc bộ miễn phí cho mọi gia đình.',
          'Một họa sĩ địa phương ghé thăm mỗi tháng một lần.',
          'Cô hướng dẫn trẻ cách làm sách truyện.',
          'Các em thích chia sẻ tác phẩm của mình.',
          'Thư viện hy vọng sẽ có thêm nhiều trẻ ghé thăm.',
          'Cùng đọc sách khiến việc học trở nên vui vẻ.'
        ],
        questions: [
          [
            'How often does the club meet? / Câu lạc bộ gặp nhau bao lâu một lần?',
            ['Every day', 'Every Saturday', 'Once a year', 'Every evening'],
            1
          ],
          [
            'Who reads a story aloud? / Ai đọc truyện thành tiếng?',
            ['A librarian', 'A doctor', 'A bus driver', 'A painter'],
            0
          ],
          [
            'What does the artist teach children? / Họa sĩ dạy trẻ điều gì?',
            ['To cook a meal', 'To make a storybook', 'To plant a garden', 'To play music'],
            1
          ]
        ]
      }
    ],
    2: [
      {
        title: 'News in Levels - Level 2',
        sentences: [
          'A famous psychologist has shared three rules to help children stay safe around technology.',
          'Children need relationships with other people to feel happy and secure.',
          'However, many children now spend much of their time using smartphones.',
          'They may spend less time playing outside with friends.',
          'This matters because children need to talk, have fun, and move together.',
          'Being online for too long can make young people feel lonely.',
          'Short videos can take up hours of their day.',
          'After that, it can be difficult to focus on a book or a long film.',
          'The psychologist believes adults can protect children with clear rules.',
          'First, children should wait until they are 16 before using social media.',
          'Second, schools should make more use of printed books and pens.',
          'Children learn important social skills from people around them.',
          'The psychologist also warns against toys that pretend to be friends.',
          'An AI machine cannot truly care about a child.',
          'Children need the real love and attention of their parents.'
        ],
        translations: [
          'Một nhà tâm lý học nổi tiếng chia sẻ ba quy tắc giúp trẻ an toàn trước công nghệ.',
          'Trẻ cần có mối quan hệ với người khác để cảm thấy hạnh phúc và an tâm.',
          'Tuy nhiên, nhiều trẻ hiện dành phần lớn thời gian dùng điện thoại thông minh.',
          'Các em có thể dành ít thời gian hơn để chơi bên ngoài với bạn.',
          'Điều này đáng quan tâm vì trẻ cần trò chuyện, vui chơi và vận động cùng nhau.',
          'Trực tuyến quá lâu có thể khiến người trẻ cảm thấy cô đơn.',
          'Video ngắn có thể chiếm hàng giờ trong ngày.',
          'Sau đó, việc tập trung vào sách hoặc phim dài có thể trở nên khó khăn.',
          'Nhà tâm lý học tin rằng người lớn có thể bảo vệ trẻ bằng quy tắc rõ ràng.',
          'Thứ nhất, trẻ nên đợi đến 16 tuổi mới dùng mạng xã hội.',
          'Thứ hai, trường học nên sử dụng sách in và bút nhiều hơn.',
          'Trẻ học kỹ năng xã hội quan trọng từ những người xung quanh.',
          'Nhà tâm lý học cũng cảnh báo về đồ chơi giả vờ làm bạn.',
          'Máy AI không thể thật sự quan tâm đến một đứa trẻ.',
          'Trẻ cần tình yêu và sự chú ý thật sự từ cha mẹ.'
        ],
        questions: [
          [
            'What is the passage mainly about? / Đoạn văn chủ yếu nói về điều gì?',
            [
              'Ways technology can harm children and rules to protect them',
              'How to build a smartphone',
              'A biography of a scientist',
              'Why children should watch more videos'
            ],
            0
          ],
          [
            'What is one suggested rule for social media? / Quy tắc nào được đề xuất về mạng xã hội?',
            ['Use it before school', 'Wait until age 16', 'Use it all day', 'Only use it at night'],
            1
          ],
          [
            'Why are AI toys a concern? / Vì sao đồ chơi AI là điều đáng lo?',
            [
              'They are difficult to charge',
              'They cannot truly care about children',
              'They are too expensive',
              'They teach children to read'
            ],
            1
          ]
        ]
      },
      {
        title: 'News in Levels - Level 2',
        sentences: [
          'A community garden has brought neighbours together in a small town.',
          'Residents grow vegetables and flowers in a shared green space.',
          'Children can observe how plants change as they grow.',
          'Older gardeners pass on seeds as well as practical knowledge.',
          'The garden also gives local families access to fresh food.',
          'Working side by side creates opportunities to talk.',
          'Families take some of the vegetables home.',
          'The group sometimes prepares meals for the entire neighbourhood.',
          'The garden welcomes visitors on weekends.',
          'Anyone can help by watering the plants.',
          'Seasonal rain supports new growth in the spring.',
          'When the weather is warm, neighbours rest beneath a tree.',
          'Town leaders hope to add several raised beds.',
          'They are also considering a small pond.',
          'The project succeeds because the whole town can take part.'
        ],
        translations: [
          'Khu vườn cộng đồng gắn kết hàng xóm trong một thị trấn nhỏ.',
          'Người dân trồng rau và hoa trong không gian xanh chung.',
          'Trẻ em có thể quan sát cây thay đổi khi lớn lên.',
          'Người làm vườn lớn tuổi truyền lại hạt giống và kiến thức thực tế.',
          'Khu vườn còn giúp các gia đình địa phương tiếp cận thực phẩm tươi.',
          'Làm việc cạnh nhau tạo cơ hội trò chuyện.',
          'Các gia đình mang một phần rau về nhà.',
          'Nhóm đôi khi chuẩn bị bữa ăn cho cả khu phố.',
          'Khu vườn đón khách vào cuối tuần.',
          'Ai cũng có thể giúp tưới cây.',
          'Mưa theo mùa hỗ trợ cây phát triển vào mùa xuân.',
          'Trời ấm, hàng xóm nghỉ dưới bóng cây.',
          'Lãnh đạo thị trấn dự định bổ sung vài luống cây cao.',
          'Họ cũng đang cân nhắc làm một hồ nhỏ.',
          'Dự án thành công vì cả thị trấn có thể tham gia.'
        ],
        questions: [
          [
            'What is one benefit of the garden? / Một lợi ích của khu vườn là gì?',
            [
              'It brings neighbours together',
              'It closes the library',
              'It replaces the town market',
              'It keeps visitors away'
            ],
            0
          ],
          [
            'How do older gardeners help? / Người làm vườn lớn tuổi giúp như thế nào?',
            [
              'They share seeds and knowledge',
              'They build smartphones',
              'They teach swimming',
              'They sell furniture'
            ],
            0
          ],
          [
            'When can visitors come? / Khi nào khách có thể đến?',
            ['On weekends', 'Only in winter', 'Every night', 'Once a year'],
            0
          ]
        ]
      },
      {
        title: 'News in Levels - Level 2',
        sentences: [
          'A city library has created a weekly book club designed for children.',
          'Members gather each Saturday morning to share stories.',
          'A librarian introduces a book by reading it aloud.',
          'Children can then select a title to borrow and enjoy at home.',
          'The group discusses the characters and their choices.',
          'Some members express their ideas through drawings.',
          'Parents are invited to take part in the reading session.',
          'The collection includes books written in many languages.',
          'New children can join at any time.',
          'There is no fee for families to attend.',
          'Once a month, a local artist leads a creative workshop.',
          'Children learn to plan and make their own storybooks.',
          'They are proud to show the finished work to one another.',
          'The library hopes the club will encourage more visits.',
          'Sharing books can make learning enjoyable for everyone.'
        ],
        translations: [
          'Một thư viện thành phố lập câu lạc bộ sách hàng tuần dành cho trẻ em.',
          'Thành viên tụ họp mỗi sáng thứ Bảy để chia sẻ truyện.',
          'Thủ thư giới thiệu sách bằng cách đọc to.',
          'Sau đó, trẻ có thể chọn sách mượn về nhà.',
          'Nhóm thảo luận về nhân vật và lựa chọn của họ.',
          'Một số thành viên thể hiện ý tưởng qua tranh vẽ.',
          'Cha mẹ được mời tham gia buổi đọc.',
          'Bộ sưu tập có sách viết bằng nhiều ngôn ngữ.',
          'Trẻ mới có thể tham gia bất cứ lúc nào.',
          'Gia đình không mất phí tham dự.',
          'Mỗi tháng một lần, họa sĩ địa phương hướng dẫn buổi sáng tạo.',
          'Trẻ học cách lên kế hoạch và làm sách truyện của riêng mình.',
          'Các em tự hào cho nhau xem thành phẩm.',
          'Thư viện hy vọng câu lạc bộ khuyến khích nhiều người đến hơn.',
          'Chia sẻ sách có thể khiến việc học trở nên thú vị với mọi người.'
        ],
        questions: [
          [
            'When does the club meet? / Câu lạc bộ gặp khi nào?',
            ['Saturday morning', 'Monday afternoon', 'Every evening', 'Once a month'],
            0
          ],
          [
            'What happens once a month? / Điều gì diễn ra mỗi tháng một lần?',
            ['An artist leads a workshop', 'The library closes', 'Children visit a farm', 'Parents sell books'],
            0
          ],
          [
            'What is the club trying to encourage? / Câu lạc bộ muốn khuyến khích điều gì?',
            [
              'More library visits and enjoyable learning',
              'More screen time',
              'Fewer books',
              'Longer school days'
            ],
            0
          ]
        ]
      }
    ]
  };

  const articleTitle = document.getElementById('readingArticleTitle');
  const passage = document.getElementById('readingPassage');
  const lessonList = document.getElementById('readingLessonList');
  const questionPrompt = document.getElementById('readingQuestionPrompt');
  const answerOptions = document.getElementById('readingAnswerOptions');
  const answerFeedback = document.getElementById('readingAnswerFeedback');

  function activeArticle() {
    return readingArticles[currentLevel][currentLesson];
  }

  function renderReading() {
    if (!articleTitle || !passage || !lessonList) return;
    const article = activeArticle();
    articleTitle.textContent = article.title;
    const difficulty = currentLevel === 1 ? 'Dễ' : 'Trung bình';
    const diffEl = document.getElementById('readingDifficulty');
    if (diffEl) diffEl.textContent = difficulty;

    const countContainer = articleTitle.previousElementSibling;
    if (countContainer) {
      const span = countContainer.querySelector('span:last-child');
      if (span) {
        span.innerHTML = `<i class="fa-solid fa-book-open" aria-hidden="true"></i> ${article.sentences.length} câu`;
      }
    }

    lessonList.innerHTML = readingArticles[currentLevel]
      .map((item, index) => {
        const isSelected = index === currentLesson;
        const wordsCount = item.sentences.join(' ').split(/\s+/).length;
        return `<button type="button" data-lesson="${index}" class="flex w-[180px] min-w-[180px] sm:w-[185px] sm:min-w-[185px] shrink-0 flex-col gap-1.5 rounded-2xl border p-3 text-left transition ${
          isSelected
            ? 'border-[#6ee7b7] bg-[#e6fbf2] shadow-sm dark:bg-emerald-950/40 dark:border-emerald-500/50'
            : 'border-slate-200/80 bg-white shadow-sm hover:border-[#6ee7b7]/60 dark:bg-slate-900/90 dark:border-slate-800 dark:hover:border-emerald-500/40'
        }">
          <div class="flex items-start justify-between gap-2">
            <span class="flex size-7 items-center justify-center rounded-xl ${
              isSelected ? 'bg-[#059669] text-white dark:bg-emerald-600' : 'bg-[#e6fbf2] text-[#059669] dark:bg-slate-800 dark:text-emerald-400'
            }">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-newspaper size-3.5"><path d="M4 22h16a2 2 0 0 0 2-2V4a2 2 0 0 0-2-2H8a2 2 0 0 0-2 2v16a2 2 0 0 1-2 2Zm0 0a2 2 0 0 1-2-2v-9c0-1.1.9-2 2-2h2"></path><path d="M18 14h-8"></path><path d="M15 18h-5"></path><path d="M10 6h8v4h-8V6Z"></path></svg>
            </span>
            <span class="inline-flex items-center gap-1 rounded-full px-2 py-0.5 font-bold transition-colors text-[11px] ${
              isSelected ? 'border border-[#a7f3d0] bg-[#d1fae5] text-[#065f46] dark:border-emerald-700/50 dark:bg-emerald-900/50 dark:text-emerald-300' : 'bg-[#e6fbf2] text-[#059669] dark:bg-slate-800 dark:text-emerald-400'
            }">${difficulty}</span>
          </div>
          <p class="line-clamp-2 text-xs font-bold leading-snug text-slate-800 dark:text-slate-100">${item.title}</p>
          <div class="flex items-center gap-2 text-[11px] text-slate-500 dark:text-slate-400">
            <span class="inline-flex items-center gap-1">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-clock size-2.5"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg> ~1 phút
            </span>
            <span class="inline-flex items-center gap-1">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-file-text size-2.5"><path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z"></path><path d="M14 2v4a2 2 0 0 0 2 2h4"></path><path d="M10 9H8"></path><path d="M16 13H8"></path><path d="M16 17H8"></path></svg> ${wordsCount} từ
            </span>
          </div>
        </button>`;
      })
      .join('');

    lessonList.querySelectorAll('[data-lesson]').forEach((button) =>
      button.addEventListener('click', () => {
        currentLesson = Number(button.dataset.lesson);
        currentQuestion = 0;
        renderReading();
      })
    );

    passage.innerHTML = article.sentences
      .map(
        (sentence, index) =>
          `<span class="block rounded-md pl-2 sm:pl-3 pr-1.5 py-1 transition-colors">
            <span class="text-slate-800 dark:text-slate-200" lang="en">${sentence}</span>
            ${
              showTranslations
                ? `<span class="mt-1 block text-xs sm:text-[13px] font-medium text-[#059669] dark:text-emerald-400">${article.translations[index]}</span>`
                : ''
            }
            ${
              showStructures && index === 0
                ? `<span class="mt-2 block rounded-lg bg-slate-50 dark:bg-slate-800/60 p-2.5 text-xs text-slate-600 dark:text-slate-400"><strong class="text-slate-800 dark:text-slate-200">Cấu trúc:</strong> Subject + verb + object. <span class="font-semibold text-[#059669]">gives us</span> = đưa cho/chia sẻ với chúng ta.</span>`
                : ''
            }
          </span>`
      )
      .join('');

    const [prompt, choices, answer] = article.questions[currentQuestion];
    if (questionPrompt) questionPrompt.textContent = prompt;
    const qProg = document.getElementById('readingQuestionProgress');
    if (qProg) qProg.textContent = `${currentQuestion + 1}/3`;
    const qProgBar = document.getElementById('readingQuestionProgressBar');
    if (qProgBar) qProgBar.style.width = `${((currentQuestion + 1) / 3) * 100}%`;
    if (answerFeedback) answerFeedback.textContent = '';
    answered = false;

    const bookmarkKey = `basic-reading-${currentLevel}-${currentLesson}`;
    const isBookmarked = localStorage.getItem(bookmarkKey) === 'true';
    const bookmarkButton = document.getElementById('readingBookmarkButton');
    if (bookmarkButton) {
      bookmarkButton.setAttribute('aria-pressed', String(isBookmarked));
      bookmarkButton.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="${
        isBookmarked ? 'currentColor' : 'none'
      }" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-bookmark size-3.5"><path d="m19 21-7-4-7 4V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v16z"></path></svg>${
        isBookmarked ? 'Đã đánh dấu' : 'Đánh dấu'
      }`;
    }

    if (answerOptions) {
      answerOptions.innerHTML = choices
        .map(
          (choice, index) =>
            `<button type="button" data-answer="${index}" class="flex w-full items-center gap-2.5 rounded-xl border border-slate-200 bg-white p-2.5 sm:p-3 text-left text-xs sm:text-[13px] font-normal text-slate-800 transition-all hover:border-slate-300 hover:bg-slate-50/60 shadow-none dark:bg-slate-800/80 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800 dark:hover:border-slate-600">
              <span class="flex size-6 shrink-0 items-center justify-center rounded-full border border-slate-300 text-[11px] font-normal text-slate-500 dark:border-slate-600 dark:text-slate-400">${String.fromCharCode(
                65 + index
              )}</span>
              <span class="flex-1 text-slate-800 dark:text-slate-200"><span lang="en">${choice}</span></span>
            </button>`
        )
        .join('');

      answerOptions.querySelectorAll('[data-answer]').forEach((button) =>
        button.addEventListener('click', () => {
          if (answered) return;
          answered = true;
          const isCorrect = Number(button.dataset.answer) === answer;
          button.classList.add(isCorrect ? 'border-emerald-500' : 'border-rose-400');
          button.classList.add(isCorrect ? 'bg-emerald-50/50' : 'bg-rose-50/50');
          if (answerFeedback) {
            answerFeedback.textContent = isCorrect
              ? 'Chính xác! Bạn đã hiểu đúng nội dung.'
              : `Chưa chính xác. Đáp án đúng là ${String.fromCharCode(65 + answer)}.`;
            answerFeedback.className = `mt-3 min-h-5 text-xs font-bold ${
              isCorrect ? 'text-emerald-600' : 'text-rose-600'
            }`;
          }
        })
      );
    }
  }

  function openBasicReading() {
    if (!readingExperience) return;
    document.body.style.overflow = '';
    document.documentElement.style.overflow = '';
    readingDashboardSections.forEach((element) => element.classList.add('hidden'));
    readingExperience.classList.remove('hidden');
    renderReading();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function closeBasicReading() {
    if (!readingExperience) return;
    document.body.style.overflow = '';
    document.documentElement.style.overflow = '';
    readingExperience.classList.add('hidden');
    readingDashboardSections.forEach((element) => element.classList.remove('hidden'));
    const basicBtn = document.getElementById('basicReadingButton');
    if (basicBtn) basicBtn.focus();
  }

  const basicReadingBtn = document.getElementById('basicReadingButton');
  if (basicReadingBtn) basicReadingBtn.addEventListener('click', openBasicReading);

  const readingBackBtn = document.getElementById('readingBackButton');
  if (readingBackBtn) readingBackBtn.addEventListener('click', closeBasicReading);

  const readingBreadcrumbBack = document.getElementById('readingBreadcrumbBack');
  if (readingBreadcrumbBack) readingBreadcrumbBack.addEventListener('click', closeBasicReading);

  const readingBreadcrumbReading = document.getElementById('readingBreadcrumbReading');
  if (readingBreadcrumbReading) readingBreadcrumbReading.addEventListener('click', closeBasicReading);

  document.querySelectorAll('.reading-level-button').forEach((button) =>
    button.addEventListener('click', () => {
      currentLevel = Number(button.dataset.readingLevel);
      currentLesson = 0;
      currentQuestion = 0;
      document.querySelectorAll('.reading-level-button').forEach((item) => {
        item.className =
          'reading-level-button rounded-full px-4 py-1.5 text-xs font-semibold transition bg-white text-slate-700 hover:text-slate-900 border border-slate-200/80 shadow-sm dark:bg-slate-900 dark:border-slate-800 dark:text-slate-300 dark:hover:text-white';
      });
      button.className =
        'reading-level-button rounded-full px-4 py-1.5 text-xs font-bold transition bg-[#059669] text-white shadow-sm';
      renderReading();
    })
  );

  // Lướt chuột và kéo cuộn cho danh sách bài đọc (Mouse Wheel & Drag to Scroll)
  if (lessonList) {
    // 1. Lăn bánh xe chuột dọc chuyển thành cuộn ngang
    lessonList.addEventListener(
      'wheel',
      (e) => {
        if (e.deltaY !== 0) {
          e.preventDefault();
          lessonList.scrollLeft += e.deltaY * 1.3;
        }
      },
      { passive: false }
    );

    // 2. Kéo chuột để lướt (Drag to scroll)
    let isLessonDown = false;
    let lessonStartX = 0;
    let lessonScrollLeft = 0;
    let isLessonDragging = false;

    lessonList.addEventListener('mousedown', (e) => {
      isLessonDown = true;
      isLessonDragging = false;
      lessonStartX = e.pageX - lessonList.offsetLeft;
      lessonScrollLeft = lessonList.scrollLeft;
    });

    lessonList.addEventListener('mouseleave', () => {
      isLessonDown = false;
      lessonList.classList.remove('cursor-grabbing');
    });

    lessonList.addEventListener('mouseup', () => {
      isLessonDown = false;
      lessonList.classList.remove('cursor-grabbing');
      setTimeout(() => {
        isLessonDragging = false;
      }, 60);
    });

    lessonList.addEventListener('mousemove', (e) => {
      if (!isLessonDown) return;
      const x = e.pageX - lessonList.offsetLeft;
      const walk = (x - lessonStartX) * 1.5;
      if (Math.abs(walk) > 4) {
        isLessonDragging = true;
        lessonList.classList.add('cursor-grabbing');
        lessonList.scrollLeft = lessonScrollLeft - walk;
      }
    });

    lessonList.addEventListener(
      'click',
      (e) => {
        if (isLessonDragging) {
          e.preventDefault();
          e.stopPropagation();
        }
      },
      true
    );
  }

  // 3. Nút bấm cuộn trái / phải
  const scrollLeftBtn = document.getElementById('readingScrollLeft');
  const scrollRightBtn = document.getElementById('readingScrollRight');
  if (scrollLeftBtn && lessonList) {
    scrollLeftBtn.addEventListener('click', () => {
      lessonList.scrollBy({ left: -380, behavior: 'smooth' });
    });
  }
  if (scrollRightBtn && lessonList) {
    scrollRightBtn.addEventListener('click', () => {
      lessonList.scrollBy({ left: 380, behavior: 'smooth' });
    });
  }

  // Tab switch for mobile
  const mobileTabPassage = document.getElementById('mobileTabPassage');
  const mobileTabQuestion = document.getElementById('mobileTabQuestion');
  const passageContainer = document.getElementById('readingPassageContainer');
  const questionContainer = document.getElementById('readingQuestionContainer');
  if (mobileTabPassage && mobileTabQuestion && passageContainer && questionContainer) {
    mobileTabPassage.addEventListener('click', () => {
      mobileTabPassage.setAttribute('aria-pressed', 'true');
      mobileTabPassage.className =
        'min-h-touch flex-1 rounded-xl text-sm font-bold transition-colors bg-skill-reading-soft text-skill-reading shadow-sm';
      mobileTabQuestion.setAttribute('aria-pressed', 'false');
      mobileTabQuestion.className =
        'min-h-touch flex-1 rounded-xl text-sm font-bold transition-colors text-muted-foreground hover:text-foreground';
      passageContainer.classList.remove('hidden');
      questionContainer.classList.add('hidden');
      questionContainer.classList.remove('block');
    });

    mobileTabQuestion.addEventListener('click', () => {
      mobileTabQuestion.setAttribute('aria-pressed', 'true');
      mobileTabQuestion.className =
        'min-h-touch flex-1 rounded-xl text-sm font-bold transition-colors bg-skill-reading-soft text-skill-reading shadow-sm';
      mobileTabPassage.setAttribute('aria-pressed', 'false');
      mobileTabPassage.className =
        'min-h-touch flex-1 rounded-xl text-sm font-bold transition-colors text-muted-foreground hover:text-foreground';
      passageContainer.classList.add('hidden');
      questionContainer.classList.remove('hidden');
      questionContainer.classList.add('block');
    });
  }

  const transToggle = document.getElementById('readingTranslationToggle');
  if (transToggle) {
    transToggle.addEventListener('click', (event) => {
      showTranslations = !showTranslations;
      event.currentTarget.setAttribute('aria-pressed', String(showTranslations));
      event.currentTarget.classList.toggle('bg-emerald-50', showTranslations);
      event.currentTarget.classList.toggle('border-emerald-300', showTranslations);
      event.currentTarget.classList.toggle('text-emerald-700', showTranslations);
      renderReading();
    });
  }

  const structToggle = document.getElementById('readingStructureToggle');
  if (structToggle) {
    structToggle.addEventListener('click', (event) => {
      showStructures = !showStructures;
      event.currentTarget.setAttribute('aria-pressed', String(showStructures));
      event.currentTarget.classList.toggle('bg-emerald-50', showStructures);
      event.currentTarget.classList.toggle('border-emerald-300', showStructures);
      event.currentTarget.classList.toggle('text-emerald-700', showStructures);
      renderReading();
    });
  }

  const bookmarkBtn = document.getElementById('readingBookmarkButton');
  if (bookmarkBtn) {
    bookmarkBtn.addEventListener('click', (event) => {
      const button = event.currentTarget;
      const saved = button.getAttribute('aria-pressed') !== 'true';
      localStorage.setItem(`basic-reading-${currentLevel}-${currentLesson}`, String(saved));
      button.setAttribute('aria-pressed', String(saved));
      button.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="${
        saved ? 'currentColor' : 'none'
      }" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-bookmark size-3.5"><path d="m19 21-7-4-7 4V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v16z"></path></svg>${
        saved ? 'Đã đánh dấu' : 'Đánh dấu'
      }`;
    });
  }

  const nextBtn = document.getElementById('readingNextButton');
  if (nextBtn) {
    nextBtn.addEventListener('click', () => {
      if (currentQuestion < 2) currentQuestion += 1;
      else {
        currentLesson = (currentLesson + 1) % readingArticles[currentLevel].length;
        currentQuestion = 0;
      }
      renderReading();
    });
  }

  const closeInfoBtn = document.getElementById('closeReadingModal');
  if (closeInfoBtn) closeInfoBtn.addEventListener('click', closeInfo);

  const modalDoneBtn = document.getElementById('readingModalDone');
  if (modalDoneBtn) modalDoneBtn.addEventListener('click', closeInfo);

  if (modal) {
    modal.addEventListener('click', (event) => {
      if (event.target === modal) closeInfo();
    });
  }

  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') closeInfo();
  });

  // --- Goal Settings Modal Support (if present) ---
  const goalModal = document.getElementById('goalModal');
  const goalSettingsButton = document.getElementById('goalSettingsButton');
  const goalForm = document.getElementById('goalForm');
  const goalScoreInput = document.getElementById('goalScoreInput');
  const goalDateInput = document.getElementById('goalDateInput');
  const goalSaveButton = document.getElementById('goalSaveButton');
  const goalSummaryTitle = document.getElementById('goalSummaryTitle');
  const goalSummaryDetails = document.getElementById('goalSummaryDetails');
  let goalModalOpener = null;

  function localDateString(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  function updateGoalSaveState() {
    if (goalSaveButton && goalForm) {
      goalSaveButton.disabled = !goalForm.checkValidity();
    }
  }

  function renderSavedGoal(score, date) {
    const formattedDate = new Date(`${date}T00:00:00`).toLocaleDateString('vi-VN');
    if (goalSummaryTitle) goalSummaryTitle.textContent = `Mục tiêu TOEIC: ${score} điểm`;
    if (goalSummaryDetails) goalSummaryDetails.textContent = `Ngày thi dự kiến: ${formattedDate}`;
  }

  function closeGoalModal() {
    if (!goalModal || goalModal.hidden) return;
    goalModal.hidden = true;
    document.body.style.overflow = '';
    if (goalModalOpener) goalModalOpener.focus();
  }

  function openGoalModal() {
    if (!goalModal) return;
    goalModalOpener = document.activeElement;
    const storedScore = localStorage.getItem('goalScore');
    const storedDate = localStorage.getItem('goalDate');
    if (goalScoreInput) {
      goalScoreInput.value = storedScore || '650';
      goalScoreInput.focus();
    }
    if (goalDateInput) {
      goalDateInput.min = localDateString(new Date());
      goalDateInput.value = storedDate || '';
    }
    updateGoalSaveState();
    goalModal.hidden = false;
    document.body.style.overflow = 'hidden';
  }

  const storedGoalScore = localStorage.getItem('goalScore');
  const storedGoalDate = localStorage.getItem('goalDate');
  if (storedGoalScore && storedGoalDate) {
    renderSavedGoal(storedGoalScore, storedGoalDate);
  }

  if (goalSettingsButton) goalSettingsButton.addEventListener('click', openGoalModal);
  const goalCloseBtn = document.getElementById('goalModalClose');
  if (goalCloseBtn) goalCloseBtn.addEventListener('click', closeGoalModal);
  const goalCancelBtn = document.getElementById('goalCancelButton');
  if (goalCancelBtn) goalCancelBtn.addEventListener('click', closeGoalModal);

  if (goalModal) {
    goalModal.addEventListener('click', (event) => {
      if (event.target === goalModal) closeGoalModal();
    });
  }

  if (goalForm) {
    goalForm.addEventListener('input', updateGoalSaveState);
    goalForm.addEventListener('change', updateGoalSaveState);
    goalForm.addEventListener('submit', (event) => {
      event.preventDefault();
      if (!goalForm.reportValidity()) return;
      const score = goalScoreInput ? goalScoreInput.value : '650';
      const date = goalDateInput ? goalDateInput.value : '';
      localStorage.setItem('goalScore', score);
      localStorage.setItem('goalDate', date);
      renderSavedGoal(score, date);
      closeGoalModal();
    });
  }
});
