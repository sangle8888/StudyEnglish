(() => {
  const cards = [...document.querySelectorAll('.mock-card')];
  const empty = document.getElementById('mockEmptyState');
  const modal = document.getElementById('mockInfoModal');
  const historyButton = document.getElementById('mockHistoryButton');
  const practiceModal = document.getElementById('mockPracticeModal');
  const practiceParts = document.getElementById('mockPracticeParts');
  const practiceSummary = document.getElementById('mockPracticeSummary');
  const practiceBegin = document.getElementById('mockPracticeBegin');
  const practicePresets = practiceModal ? [...practiceModal.querySelectorAll('.mock-practice-preset')] : [];
  const partDefinitions = [
    { number: 1, title: 'Photographs', questions: 6 },
    { number: 2, title: 'Question–Response', questions: 25 },
    { number: 3, title: 'Conversations', questions: 39 },
    { number: 4, title: 'Talks', questions: 30 },
    { number: 5, title: 'Incomplete Sentences', questions: 30 },
    { number: 6, title: 'Text Completion', questions: 16 },
    { number: 7, title: 'Reading Comprehension', questions: 54 }
  ];
  let selectedParts = new Set();
  let practiceTrigger = null;
  let practiceCard = null;
  let currentMode = 'exam';
  let previousOverflow = '';
  const inertStates = new Map();

  if (practiceParts) {
    partDefinitions.forEach((part) => {
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'mock-practice-part';
      button.dataset.part = String(part.number);
      button.setAttribute('aria-pressed', 'false');
      button.setAttribute('aria-label', `Part ${part.number}, ${part.title}, ${part.questions} câu, tiến độ 0%`);
      button.innerHTML = `<span class="mock-practice-part-top"><strong>Part ${part.number}</strong><small>${part.questions} câu</small></span>
        <span class="mock-practice-part-description">${part.title}</span>
        <span class="mock-practice-part-progress"><span class="mock-practice-part-track" aria-hidden="true"><span class="mock-practice-part-bar"></span></span><span>0%</span></span>`;
      button.addEventListener('click', () => {
        if (selectedParts.has(part.number)) selectedParts.delete(part.number);
        else selectedParts.add(part.number);
        updatePracticeSelection();
      });
      practiceParts.appendChild(button);
    });
  }

  function updatePracticeSelection() {
    if (!practiceParts || !practiceSummary || !practiceBegin) return;
    practiceParts.querySelectorAll('button').forEach((button) => {
      button.setAttribute('aria-pressed', String(selectedParts.has(Number(button.dataset.part))));
    });
    practicePresets.forEach((button) => {
      const parts = button.dataset.parts.split(',').map(Number);
      button.setAttribute('aria-pressed', String(parts.length === selectedParts.size && parts.every((part) => selectedParts.has(part))));
    });
    const parts = [...selectedParts].sort((a, b) => a - b);
    practiceSummary.replaceChildren();
    if (!parts.length) {
      practiceSummary.textContent = currentMode === 'exam' ? 'Chọn ít nhất 1 part để vào phòng thi' : 'Chọn ít nhất 1 part để luyện tập';
      practiceBegin.disabled = true;
    } else {
      practiceBegin.disabled = false;
      const count = document.createElement('strong');
      count.textContent = String(parts.length);
      practiceSummary.append('Đang chọn ', count, ' part · ');

      if (currentMode === 'exam') {
        if (parts.length === 7) {
          practiceSummary.append('Tính điểm TOEIC đầy đủ (990)');
        } else if (parts.length === 4 && parts.every((p, idx) => p === idx + 1)) {
          practiceSummary.append('Tính điểm Listening (495)');
        } else if (parts.length === 3 && parts.every((p, idx) => p === idx + 5)) {
          practiceSummary.append('Tính điểm Reading (495)');
        } else {
          practiceSummary.append('Tính điểm theo part');
        }
      } else {
        if (parts.length === 7) {
          practiceSummary.append('Luyện toàn bộ đề');
        } else if (parts.length === 4 && parts.every((p, idx) => p === idx + 1)) {
          practiceSummary.append('Luyện Listening 1–4');
        } else if (parts.length === 3 && parts.every((p, idx) => p === idx + 5)) {
          practiceSummary.append('Luyện Reading 5–7');
        } else {
          practiceSummary.append('Part ' + parts.join(', '));
        }
      }
    }
  }

  practicePresets.forEach((button) => button.addEventListener('click', () => {
    selectedParts = new Set(button.dataset.parts.split(',').map(Number));
    updatePracticeSelection();
  }));

  function openPractice(trigger, mode = 'exam', customCard = null) {
    if (!practiceModal) return;
    currentMode = mode;
    practiceTrigger = trigger;
    practiceCard = customCard || trigger.closest('.mock-card') || cards[0];
    const rawTitle = (practiceCard && practiceCard.dataset.title) || 'RaidTUTOR 2026 - Test 1';
    document.getElementById('mockPracticeTest').textContent = rawTitle.replace(' - ', ' · ');

    const titleEl = document.getElementById('mockPracticeTitle');
    const iconEl = document.getElementById('mockPracticeIcon');
    if (mode === 'exam') {
      titleEl.textContent = 'Thi thử TOEIC';
      iconEl.innerHTML = '<i class="fa-solid fa-stopwatch" aria-hidden="true"></i>';
      practiceBegin.innerHTML = 'Vào phòng thi <i class="fa-solid fa-arrow-right" aria-hidden="true"></i>';
    } else {
      titleEl.textContent = 'Luyện tập theo đề';
      iconEl.innerHTML = '<i class="fa-solid fa-book-open" aria-hidden="true"></i>';
      practiceBegin.innerHTML = 'Bắt đầu luyện <i class="fa-solid fa-arrow-right" aria-hidden="true"></i>';
    }

    selectedParts = new Set(partDefinitions.map((part) => part.number));
    updatePracticeSelection();
    previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    practiceModal.hidden = false;
    // Disable the background branches while keeping the dialog interactive.
    let branch = practiceModal;
    while (branch.parentElement && branch.parentElement !== document.documentElement) {
      [...branch.parentElement.children].forEach((sibling) => {
        if (sibling === branch || ['SCRIPT', 'STYLE'].includes(sibling.tagName)) return;
        inertStates.set(sibling, sibling.inert);
        sibling.inert = true;
      });
      branch = branch.parentElement;
    }
    document.getElementById('closeMockPractice').focus();
  }

  function closePractice() {
    if (!practiceModal || practiceModal.hidden) return;
    practiceModal.hidden = true;
    document.body.style.overflow = previousOverflow;
    inertStates.forEach((value, element) => { element.inert = value; });
    inertStates.clear();
    if (practiceTrigger) practiceTrigger.focus();
  }

  const closeMockPracticeBtn = document.getElementById('closeMockPractice');
  if (closeMockPracticeBtn) closeMockPracticeBtn.addEventListener('click', closePractice);

  if (practiceModal) {
    practiceModal.addEventListener('click', (event) => { if (event.target === practiceModal) closePractice(); });
    practiceModal.addEventListener('keydown', (event) => {
      if (event.key === 'Escape') { event.preventDefault(); closePractice(); }
      if (event.key !== 'Tab') return;
      const buttons = [...practiceModal.querySelectorAll('button:not(:disabled)')];
      const first = buttons[0];
      const last = buttons[buttons.length - 1];
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
    });
  }

  if (practiceBegin) {
    practiceBegin.addEventListener('click', () => {
      if (!selectedParts.size) return;
      const parts = [...selectedParts].sort((a, b) => a - b);
      const trigger = practiceTrigger;
      const title = practiceCard ? practiceCard.dataset.title : 'RaidTUTOR 2026 - Test 1';
      const mode = currentMode;
      closePractice();
      if (window.ToeicMockPractice) {
        window.ToeicMockPractice.open({ title, parts, trigger, mode });
      }
    });
  }

  let source = 'hot';
  let year = '2026';
  let lastTrigger = null;

  function filterTests() {
    let visible = 0;
    cards.forEach((card) => {
      const show = (source === 'hot' || card.dataset.source === source) && card.dataset.year === year;
      card.hidden = !show;
      if (show) visible++;
    });
    if (empty) empty.classList.toggle('hidden', visible !== 0);
  }

  function setActive(buttons, selected, activeClass) {
    buttons.forEach((button) => {
      const active = button === selected;
      button.setAttribute('aria-pressed', String(active));
      button.classList.toggle(activeClass, active);
    });
  }

  document.querySelectorAll('.mock-source-filter').forEach((button) => button.addEventListener('click', () => {
    source = button.dataset.source;
    setActive(document.querySelectorAll('.mock-source-filter'), button, 'bg-white');
    filterTests();
  }));

  document.querySelectorAll('.mock-year-filter').forEach((button) => button.addEventListener('click', () => {
    year = button.dataset.year;
    setActive(document.querySelectorAll('.mock-year-filter'), button, 'bg-white');
    filterTests();
  }));

  function openModal(trigger, eyebrow, title, description, meta) {
    if (!modal) return;
    lastTrigger = trigger;
    document.getElementById('mockModalEyebrow').textContent = eyebrow;
    document.getElementById('mockModalTitle').textContent = title;
    document.getElementById('mockModalDescription').textContent = description;
    document.getElementById('mockModalMeta').textContent = meta;
    modal.classList.remove('hidden');
    modal.classList.add('flex');
    document.body.style.overflow = 'hidden';
    document.getElementById('closeMockModal').focus();
  }

  function closeModal() {
    if (!modal || modal.classList.contains('hidden')) return;
    modal.classList.add('hidden');
    modal.classList.remove('flex');
    document.body.style.overflow = '';
    if (lastTrigger) lastTrigger.focus();
  }

  document.querySelectorAll('.mock-practice').forEach((button) => button.addEventListener('click', () => {
    openPractice(button, 'practice');
  }));

  document.querySelectorAll('.mock-start').forEach((button) => button.addEventListener('click', () => {
    openPractice(button, 'exam');
  }));

  const resumeButton = document.getElementById('mockResumeButton');
  if (resumeButton) {
    resumeButton.addEventListener('click', () => {
      const targetCard = document.querySelector('.mock-card[data-title*="Test 2"]') || cards[0];
      openPractice(resumeButton, 'exam', targetCard);
    });
  }

  if (historyButton) {
    historyButton.addEventListener('click', () => openModal(
      historyButton,
      'LỊCH SỬ LÀM BÀI',
      'Các bài Mock Test đã hoàn thành',
      'Bạn có thể xem lại kết quả các bài thi đã hoàn thành tại đây.',
      'Chưa có dữ liệu lịch sử chi tiết để hiển thị.'
    ));
  }

  const closeMockModalBtn = document.getElementById('closeMockModal');
  if (closeMockModalBtn) closeMockModalBtn.addEventListener('click', closeModal);

  const mockModalDoneBtn = document.getElementById('mockModalDone');
  if (mockModalDoneBtn) mockModalDoneBtn.addEventListener('click', closeModal);

  if (modal) {
    modal.addEventListener('click', (event) => { if (event.target === modal) closeModal(); });
  }
  document.addEventListener('keydown', (event) => { if (event.key === 'Escape') closeModal(); });
  filterTests();

  // Goal settings
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
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
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
    if (goalScoreInput) goalScoreInput.value = storedScore || '650';
    if (goalDateInput) {
      goalDateInput.min = localDateString(new Date());
      goalDateInput.value = storedDate || '';
    }
    updateGoalSaveState();
    goalModal.hidden = false;
    document.body.style.overflow = 'hidden';
    if (goalScoreInput) goalScoreInput.focus();
  }

  const storedGoalScore = localStorage.getItem('goalScore');
  const storedGoalDate = localStorage.getItem('goalDate');
  if (storedGoalScore && storedGoalDate) {
    renderSavedGoal(storedGoalScore, storedGoalDate);
  }

  if (goalSettingsButton) goalSettingsButton.addEventListener('click', openGoalModal);
  const goalModalCloseBtn = document.getElementById('goalModalClose');
  if (goalModalCloseBtn) goalModalCloseBtn.addEventListener('click', closeGoalModal);
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

      const score = goalScoreInput.value;
      const date = goalDateInput.value;
      localStorage.setItem('goalScore', score);
      localStorage.setItem('goalDate', date);
      renderSavedGoal(score, date);
      closeGoalModal();
    });
  }

  document.addEventListener('keydown', (event) => {
    if (!goalModal || goalModal.hidden) return;
    if (event.key === 'Escape') {
      closeGoalModal();
      return;
    }
    if (event.key !== 'Tab') return;

    const focusableElements = [...goalModal.querySelectorAll('button:not(:disabled), input:not(:disabled)')];
    const firstElement = focusableElements[0];
    const lastElement = focusableElements[focusableElements.length - 1];
    if (event.shiftKey && document.activeElement === firstElement) {
      event.preventDefault();
      lastElement.focus();
    } else if (!event.shiftKey && document.activeElement === lastElement) {
      event.preventDefault();
      firstElement.focus();
    }
  });
})();
