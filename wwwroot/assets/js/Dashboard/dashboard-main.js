// State Variables
let totalXP = 0;
let completedTasksCount = 0;
const totalTasks = 5;

// DOM Elements
const xpCountHeader = document.getElementById('xpCountHeader');
const taskCounterText = document.getElementById('taskCounterText');

// Toggle Task Completion Interactive
function toggleTask(element, xpGain) {
  const isCompleted = element.classList.contains('completed');
  const progressBar = element.querySelector('.task-progress-bar');
  const progressText = element.querySelector('.task-progress-text');
  const badge = element.querySelector('.task-badge');

  if (!isCompleted) {
    // Complete the task
    element.classList.add('completed', 'bg-emerald-50/50', 'dark:bg-emerald-950/20', 'border-emerald-200/60');
    element.classList.remove('bg-slate-50/70', 'dark:bg-slate-800/40');
    
    if (progressBar) progressBar.style.width = '100%';
    if (progressText) progressText.textContent = 'Done';
    
    if (badge) {
      badge.className = 'task-badge text-xs font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-3 py-1 rounded-lg border border-emerald-500/20 flex items-center gap-1';
      badge.innerHTML = `+${xpGain} XP <i class="fa-solid fa-check"></i>`;
    }

    // Add XP
    totalXP += xpGain;
    completedTasksCount++;
    showFloatingXP(element, `+${xpGain} XP!`);

  } else {
    // Uncomplete task
    element.classList.remove('completed', 'bg-emerald-50/50', 'dark:bg-emerald-950/20', 'border-emerald-200/60');
    element.classList.add('bg-slate-50/70', 'dark:bg-slate-800/40');

    if (progressBar) progressBar.style.width = '0%';
    if (progressText) progressText.textContent = `0/${element.dataset.total || 10}`;

    if (badge) {
      badge.className = 'task-badge text-xs font-bold text-purple-600 dark:text-purple-400 bg-purple-500/10 px-2.5 py-1 rounded-lg border border-purple-500/20';
      badge.innerHTML = `+${element.dataset.xp || 10} XP`;
    }

    if (completedTasksCount > 0) completedTasksCount--;
  }

  // Update counters
  if (xpCountHeader) xpCountHeader.textContent = `+${totalXP} XP`;
  if (taskCounterText) taskCounterText.textContent = `${completedTasksCount}/${totalTasks} nhiệm vụ đã xong`;
}

// Floating XP Animation
function showFloatingXP(targetEl, text) {
  const rect = targetEl.getBoundingClientRect();
  const xpPop = document.createElement('div');
  xpPop.className = 'fixed font-extrabold text-sm text-pink-500 bg-white dark:bg-slate-800 px-3 py-1 rounded-full shadow-lg border border-pink-300 z-50 xp-float';
  xpPop.style.left = `${rect.right - 80}px`;
  xpPop.style.top = `${rect.top}px`;
  xpPop.textContent = text;

  document.body.appendChild(xpPop);

  setTimeout(() => {
    xpPop.remove();
  }, 1200);
}

// Arena Start Action
function startArena() {
  showFloatingXP(document.body, '🚀 Đang tải Đấu Trường...');
}

// Profile Menu Dropdown
const profileMenuTrigger = document.getElementById('profileMenuTrigger');
const profileMenu = document.getElementById('profileMenu');

function closeProfileMenu(restoreFocus = false) {
  if (!profileMenu || profileMenu.hidden) return;
  profileMenu.hidden = true;
  profileMenuTrigger.setAttribute('aria-expanded', 'false');
  if (restoreFocus) profileMenuTrigger.focus();
}

// Notification Dropdown
const notificationButton = document.getElementById('notificationButton');
const mobileNotificationToggle = document.getElementById('mobileNotificationToggle');
const notificationDropdown = document.getElementById('notificationDropdown');
const notificationCloseBtn = document.getElementById('notificationCloseBtn');
const markAllNotificationsReadBtn = document.getElementById('markAllReadBtn');
const notificationBadge = document.getElementById('notificationBadge');

function closeNotificationDropdown(restoreFocus = false) {
  if (!notificationDropdown || notificationDropdown.hidden) return;
  notificationDropdown.hidden = true;
  if (notificationButton) {
    notificationButton.setAttribute('aria-expanded', 'false');
    notificationButton.classList.remove('active');
  }
  if (mobileNotificationToggle) {
    mobileNotificationToggle.setAttribute('aria-expanded', 'false');
    mobileNotificationToggle.classList.remove('active');
  }
  if (restoreFocus && notificationButton) {
    notificationButton.focus();
  }
}

function openNotificationDropdown() {
  if (!notificationDropdown) return;
  closeProfileMenu();
  notificationDropdown.hidden = false;
  if (notificationButton) {
    notificationButton.setAttribute('aria-expanded', 'true');
    notificationButton.classList.add('active');
  }
  if (mobileNotificationToggle) {
    mobileNotificationToggle.setAttribute('aria-expanded', 'true');
    mobileNotificationToggle.classList.add('active');
  }
}

function toggleNotificationDropdown() {
  if (!notificationDropdown) return;
  if (notificationDropdown.hidden) {
    openNotificationDropdown();
  } else {
    closeNotificationDropdown();
  }
}

if (notificationButton) {
  notificationButton.addEventListener('click', (e) => {
    e.stopPropagation();
    toggleNotificationDropdown();
  });
}

if (mobileNotificationToggle) {
  mobileNotificationToggle.addEventListener('click', (e) => {
    e.stopPropagation();
    toggleNotificationDropdown();
  });
}

if (notificationCloseBtn) {
  notificationCloseBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    closeNotificationDropdown(true);
  });
}

if (markAllNotificationsReadBtn) {
  markAllNotificationsReadBtn.addEventListener('click', () => {
    if (notificationBadge) {
      notificationBadge.style.display = 'none';
    }
    localStorage.setItem('all_notifications_read', 'true');
  });

  if (localStorage.getItem('all_notifications_read') === 'true' && notificationBadge) {
    notificationBadge.style.display = 'none';
  }
}

if (profileMenuTrigger && profileMenu) {
  profileMenuTrigger.addEventListener('click', () => {
    closeNotificationDropdown();
    const isOpening = profileMenu.hidden;
    profileMenu.hidden = !isOpening;
    profileMenuTrigger.setAttribute('aria-expanded', String(isOpening));
    if (isOpening) profileMenu.querySelector('[role="menuitem"]')?.focus();
  });

  document.addEventListener('click', (event) => {
    if (!event.target.closest('.profile-menu-wrap')) closeProfileMenu();
    if (!event.target.closest('.notification-wrap') && !event.target.closest('#mobileNotificationToggle')) {
      closeNotificationDropdown();
    }
  });

  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') {
      if (notificationDropdown && !notificationDropdown.hidden) {
        closeNotificationDropdown(true);
      }
      if (!profileMenu.hidden) {
        closeProfileMenu(true);
      }
    } else if (event.key === 'Tab') {
      if (!profileMenu.hidden && !profileMenu.contains(event.target) && event.target !== profileMenuTrigger) {
        closeProfileMenu();
      }
      if (notificationDropdown && !notificationDropdown.hidden && !notificationDropdown.contains(event.target) && event.target !== notificationButton) {
        closeNotificationDropdown();
      }
    }
  });
}

document.getElementById('profileFeedbackButton')?.addEventListener('click', () => {
  closeProfileMenu();
  if (typeof window.triggerFeedbackModal === 'function') window.triggerFeedbackModal();
});

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
  if (!goalSummaryTitle || !goalSummaryDetails) return;
  const formattedDate = new Date(`${date}T00:00:00`).toLocaleDateString('vi-VN');
  goalSummaryTitle.textContent = `Mục tiêu TOEIC: ${score} điểm`;
  goalSummaryDetails.textContent = `Ngày thi dự kiến: ${formattedDate}`;
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
  goalScoreInput.value = storedScore || '650';
  goalDateInput.min = localDateString(new Date());
  goalDateInput.value = storedDate || '';
  updateGoalSaveState();
  goalModal.hidden = false;
  document.body.style.overflow = 'hidden';
  goalScoreInput.focus();
}

const storedGoalScore = localStorage.getItem('goalScore');
const storedGoalDate = localStorage.getItem('goalDate');
if (storedGoalScore && storedGoalDate) {
  renderSavedGoal(storedGoalScore, storedGoalDate);
}

goalSettingsButton?.addEventListener('click', openGoalModal);
document.getElementById('goalModalClose')?.addEventListener('click', closeGoalModal);
document.getElementById('goalCancelButton')?.addEventListener('click', closeGoalModal);
goalModal?.addEventListener('click', (event) => {
  if (event.target === goalModal) closeGoalModal();
});
goalForm?.addEventListener('input', updateGoalSaveState);
goalForm?.addEventListener('change', updateGoalSaveState);
goalForm?.addEventListener('submit', (event) => {
  event.preventDefault();
  if (!goalForm.reportValidity()) return;

  const score = goalScoreInput.value;
  const date = goalDateInput.value;
  localStorage.setItem('goalScore', score);
  localStorage.setItem('goalDate', date);
  renderSavedGoal(score, date);
  closeGoalModal();
});

// Skill Detail Modal
const skillDetailModal = document.getElementById('skillDetailModal');
const skillDetailButton = document.getElementById('skillDetailButton');
const skillDetailModalClose = document.getElementById('skillDetailModalClose');
let skillModalOpener = null;

function closeSkillDetailModal() {
  if (!skillDetailModal || skillDetailModal.hidden) return;
  skillDetailModal.hidden = true;
  document.body.style.overflow = '';
  if (skillModalOpener) skillModalOpener.focus();
}

function openSkillDetailModal() {
  if (!skillDetailModal) return;
  skillModalOpener = document.activeElement;
  skillDetailModal.hidden = false;
  document.body.style.overflow = 'hidden';
  skillDetailModalClose?.focus();
}

skillDetailButton?.addEventListener('click', (event) => {
  event.preventDefault();
  openSkillDetailModal();
});
skillDetailModalClose?.addEventListener('click', closeSkillDetailModal);
skillDetailModal?.addEventListener('click', (event) => {
  if (event.target === skillDetailModal) closeSkillDetailModal();
});

// Daily Goal Modal & Settings
const dailyGoalModal = document.getElementById('dailyGoalModal');
const dailyGoalSettingsButton = document.getElementById('dailyGoalSettingsButton');
const dailyGoalCloseBtn = document.getElementById('dailyGoalModalClose');
const dailyGoalCancelBtn = document.getElementById('dailyGoalCancelBtn');
const dailyGoalForm = document.getElementById('dailyGoalForm');
const dailyGoalGrammar = document.getElementById('dailyGoalGrammar');
const dailyGoalVocab = document.getElementById('dailyGoalVocab');
const dailyGoalListening = document.getElementById('dailyGoalListening');
const dailyGoalReading = document.getElementById('dailyGoalReading');
let dailyGoalOpener = null;

function applyDailyGoalsToUI(goals) {
  const taskGrammar = document.getElementById('taskGrammar');
  const taskNewVocab = document.getElementById('taskNewVocab');
  const taskListening = document.getElementById('taskListening');
  const taskReading = document.getElementById('taskReading');

  function updateTaskRow(taskEl, total) {
    if (!taskEl) return;
    taskEl.dataset.total = total;
    if (!taskEl.classList.contains('completed')) {
      const progressText = taskEl.querySelector('.task-progress-text');
      if (progressText) progressText.textContent = `0/${total}`;
    }
  }

  updateTaskRow(taskGrammar, goals.grammar);
  updateTaskRow(taskNewVocab, goals.vocab);
  updateTaskRow(taskListening, goals.listening);
  updateTaskRow(taskReading, goals.reading);
}

function loadSavedDailyGoals() {
  const saved = localStorage.getItem('daily_goals');
  if (saved) {
    try {
      const parsed = JSON.parse(saved);
      if (dailyGoalGrammar) dailyGoalGrammar.value = parsed.grammar || 20;
      if (dailyGoalVocab) dailyGoalVocab.value = parsed.vocab || 10;
      if (dailyGoalListening) dailyGoalListening.value = parsed.listening || 10;
      if (dailyGoalReading) dailyGoalReading.value = parsed.reading || 10;
      applyDailyGoalsToUI(parsed);
      return;
    } catch (e) {
      console.error(e);
    }
  }
}

function openDailyGoalModal() {
  if (!dailyGoalModal) return;
  dailyGoalOpener = document.activeElement;
  dailyGoalModal.hidden = false;
  document.body.style.overflow = 'hidden';
  dailyGoalGrammar?.focus();
}

function closeDailyGoalModal() {
  if (!dailyGoalModal || dailyGoalModal.hidden) return;
  dailyGoalModal.hidden = true;
  document.body.style.overflow = '';
  if (dailyGoalOpener) dailyGoalOpener.focus();
}

dailyGoalSettingsButton?.addEventListener('click', (e) => {
  e.preventDefault();
  openDailyGoalModal();
});

dailyGoalCloseBtn?.addEventListener('click', closeDailyGoalModal);
dailyGoalCancelBtn?.addEventListener('click', closeDailyGoalModal);
dailyGoalModal?.addEventListener('click', (e) => {
  if (e.target === dailyGoalModal) closeDailyGoalModal();
});

dailyGoalForm?.addEventListener('submit', (e) => {
  e.preventDefault();
  const goals = {
    grammar: parseInt(dailyGoalGrammar?.value, 10) || 20,
    vocab: parseInt(dailyGoalVocab?.value, 10) || 10,
    listening: parseInt(dailyGoalListening?.value, 10) || 10,
    reading: parseInt(dailyGoalReading?.value, 10) || 10
  };
  localStorage.setItem('daily_goals', JSON.stringify(goals));
  applyDailyGoalsToUI(goals);
  closeDailyGoalModal();
  showFloatingXP(dailyGoalSettingsButton || document.body, '✓ Đã cập nhật mục tiêu!');
});

loadSavedDailyGoals();

document.addEventListener('keydown', (event) => {
  if (event.key === 'Escape') {
    if (dailyGoalModal && !dailyGoalModal.hidden) {
      closeDailyGoalModal();
      return;
    }
    if (skillDetailModal && !skillDetailModal.hidden) {
      closeSkillDetailModal();
      return;
    }
    if (goalModal && !goalModal.hidden) {
      closeGoalModal();
      return;
    }
  }

  if (event.key !== 'Tab') return;

  const activeModal = (dailyGoalModal && !dailyGoalModal.hidden)
    ? dailyGoalModal
    : ((skillDetailModal && !skillDetailModal.hidden) ? skillDetailModal : ((goalModal && !goalModal.hidden) ? goalModal : null));
  if (!activeModal) return;

  const focusableElements = [...activeModal.querySelectorAll('button:not(:disabled), input:not(:disabled)')];
  if (!focusableElements.length) return;
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

if (window.location.hash === '#feedback' && typeof window.triggerFeedbackModal === 'function') {
  window.triggerFeedbackModal();
}
