const dashboardLayout = document.getElementById('dashboardLayout');
const sidebarCollapseToggle = document.getElementById('sidebarCollapseToggle');
const themeToggle = document.getElementById('themeToggle');
const mobileThemeToggle = document.getElementById('mobileThemeToggle');
const mobileMenuToggle = document.getElementById('mobileMenuToggle');
const mobilePagePicker = document.getElementById('mobilePagePicker');
const mobileSidebarBackdrop = document.getElementById('mobileSidebarBackdrop');
const sidebar = document.getElementById('dashboardSidebar');

sidebarCollapseToggle.addEventListener('click', () => {
  const collapsed = dashboardLayout.classList.toggle('sidebar-collapsed');
  sidebarCollapseToggle.setAttribute('aria-expanded', String(!collapsed));
  sidebarCollapseToggle.setAttribute('aria-label', collapsed ? 'Mở rộng thanh điều hướng' : 'Thu gọn thanh điều hướng');
  sidebarCollapseToggle.innerHTML = `<i class="fa-solid fa-chevron-${collapsed ? 'right' : 'left'}" aria-hidden="true"></i>`;
});

const themeButtons = [themeToggle, mobileThemeToggle];

function syncTheme() {
  const dark = document.documentElement.classList.contains('dark');
  document.body.classList.toggle('bg-canvas-dark', dark);
  document.body.classList.toggle('bg-canvas-light', !dark);
  const label = dark ? 'Giao diện: Tối' : 'Giao diện: Sáng';
  themeButtons.forEach(btn => {
    btn.setAttribute('aria-label', label + '. Bấm để đổi.');
    btn.setAttribute('title', label);
  });
  window.dispatchEvent(new CustomEvent('themechange', { detail: { dark } }));
}

function toggleTheme() {
  document.documentElement.classList.toggle('dark');
  localStorage.setItem('theme', document.documentElement.classList.contains('dark') ? 'dark' : 'light');
  syncTheme();
}

themeButtons.forEach(btn => btn.addEventListener('click', toggleTheme));

function setMobileNavOpen(open) {
  document.body.classList.toggle('mobile-nav-open', open);
  mobileMenuToggle.setAttribute('aria-expanded', String(open));
  mobilePagePicker.setAttribute('aria-expanded', String(open));
  sidebar.setAttribute('aria-modal', String(open));
  if (open) sidebar.setAttribute('role', 'dialog');
  else sidebar.removeAttribute('role');
}

mobileMenuToggle.addEventListener('click', () => setMobileNavOpen(!document.body.classList.contains('mobile-nav-open')));
mobilePagePicker.addEventListener('click', () => setMobileNavOpen(!document.body.classList.contains('mobile-nav-open')));
mobileSidebarBackdrop.addEventListener('click', () => setMobileNavOpen(false));
document.querySelectorAll('#navContainer .nav-item').forEach(link => link.addEventListener('click', () => setMobileNavOpen(false)));
document.addEventListener('keydown', event => {
  const feedbackDialog = document.getElementById('websiteFeedbackDialog');
  if (event.key === 'Escape' && feedbackDialog && !feedbackDialog.hidden) {
    closeFeedbackDialog();
    return;
  }
  if (event.key === 'Escape' && document.body.classList.contains('mobile-nav-open')) setMobileNavOpen(false);
});

const savedTheme = localStorage.getItem('theme');
if (savedTheme === 'dark' || (!savedTheme && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
  document.documentElement.classList.add('dark');
} else {
  document.documentElement.classList.remove('dark');
}
syncTheme();

let feedbackTriggerElement = null;
function triggerFeedbackModal() {
  const dialog = document.getElementById('websiteFeedbackDialog');
  const textarea = document.getElementById('websiteFeedbackText');
  feedbackTriggerElement = document.activeElement;
  const status = document.getElementById('websiteFeedbackStatus');
  if (status) {
    status.textContent = '';
    status.style.color = '';
  }
  const submitBtn = document.getElementById('websiteFeedbackSubmit');
  if (submitBtn) {
    submitBtn.disabled = false;
    submitBtn.textContent = 'Gửi góp ý';
  }
  if (textarea) {
    textarea.value = '';
    textarea.focus();
  }
  const countEl = document.getElementById('websiteFeedbackCount');
  if (countEl) countEl.textContent = '0/1000';
  if (dialog) dialog.hidden = false;
}
window.triggerFeedbackModal = triggerFeedbackModal;

const feedbackDialog = document.getElementById('websiteFeedbackDialog');
const closeFeedbackDialog = () => {
  if (feedbackDialog) feedbackDialog.hidden = true;
  if (feedbackTriggerElement?.isConnected && !feedbackTriggerElement.disabled)
    feedbackTriggerElement.focus({ preventScroll: true });
};
const closeBtn = document.getElementById('websiteFeedbackClose');
if (closeBtn) closeBtn.addEventListener('click', closeFeedbackDialog);
const cancelBtn = document.getElementById('websiteFeedbackCancel');
if (cancelBtn) cancelBtn.addEventListener('click', closeFeedbackDialog);
if (feedbackDialog) {
  feedbackDialog.addEventListener('click', event => {
    if (event.target === feedbackDialog) closeFeedbackDialog();
  });
}

const submitBtn = document.getElementById('websiteFeedbackSubmit');
if (submitBtn) {
  submitBtn.addEventListener('click', () => {
    const textarea = document.getElementById('websiteFeedbackText');
    const message = textarea ? textarea.value.trim() : '';
    const status = document.getElementById('websiteFeedbackStatus');
    if (!message) {
      if (status) {
        status.style.color = '#ef4444';
        status.textContent = 'Vui lòng nhập nội dung góp ý.';
      }
      if (textarea) textarea.focus();
      return;
    }

    const activeTypeBtn = document.querySelector('.website-feedback-type[aria-pressed="true"]');
    const feedbackType = activeTypeBtn ? activeTypeBtn.textContent.trim() : 'Đề xuất tính năng mới';

    submitBtn.disabled = true;
    const originalText = submitBtn.textContent;
    submitBtn.textContent = 'Đang gửi...';
    if (status) {
      status.style.color = '#64748b';
      status.textContent = 'Đang gửi góp ý đến quản trị viên...';
    }

    fetch('/Feedback/Submit', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify({
        feedbackType: feedbackType,
        content: message
      })
    })
    .then(async res => {
      const isJson = res.headers.get('content-type')?.includes('application/json');
      const data = isJson ? await res.json() : null;
      if (!res.ok) {
        throw new Error((data && data.message) || `Lỗi máy chủ (${res.status}). Hãy đảm bảo ứng dụng đã được khởi động lại.`);
      }
      return data || { success: true };
    })
    .then(data => {
      if (data.success) {
        if (status) {
          status.style.color = '#16a34a';
          status.textContent = data.message || 'Cảm ơn bạn đã đóng góp ý kiến!';
        }
        if (textarea) textarea.value = '';
        const countEl = document.getElementById('websiteFeedbackCount');
        if (countEl) countEl.textContent = '0/1000';
        submitBtn.textContent = 'Đã gửi ✓';
        setTimeout(() => {
          closeFeedbackDialog();
          submitBtn.disabled = false;
          submitBtn.textContent = originalText;
          if (status) status.textContent = '';
        }, 1600);
      } else {
        if (status) {
          status.style.color = '#ef4444';
          status.textContent = data.message || 'Không thể gửi góp ý. Vui lòng thử lại.';
        }
        submitBtn.disabled = false;
        submitBtn.textContent = originalText;
      }
    })
    .catch(err => {
      console.error('Lỗi gửi góp ý:', err);
      if (status) {
        status.style.color = '#ef4444';
        status.textContent = err.message || 'Có lỗi xảy ra khi kết nối máy chủ. Vui lòng thử lại!';
      }
      submitBtn.disabled = false;
      submitBtn.textContent = originalText;
    });
  });
}

document.addEventListener('click', event => {
  const trigger = event.target.closest('#profileFeedbackButton, [data-reading-feedback="feedback"], #phrasePracticeFeedbackButton, #lessonFeedbackButton, #practiceFeedbackToggle');
  if (trigger) {
    event.preventDefault();
    triggerFeedbackModal();
  }
});

document.querySelectorAll('.website-feedback-type').forEach(btn => btn.addEventListener('click', () => {
  document.querySelectorAll('.website-feedback-type').forEach(b => b.setAttribute('aria-pressed', String(b === btn)));
}));
document.getElementById('websiteFeedbackText').addEventListener('input', e => {
  document.getElementById('websiteFeedbackCount').textContent = e.target.value.length + '/1000';
});

// Hiệu ứng chọn mục: bấm ô nào, ô đó đổi sang màu riêng của nó ngay lập tức
(function () {
  const items = document.querySelectorAll('#navContainer .nav-item');
  function select(link) {
    items.forEach(i => {
      i.classList.remove('active');
      i.removeAttribute('aria-current');
    });
    link.classList.add('active');
    link.setAttribute('aria-current', 'page');
    const title = document.getElementById('mobilePageTitle');
    if (title) title.textContent = link.querySelector('span').textContent.trim();
  }
  const initialActive = document.querySelector('#navContainer .nav-item.active') || items[0];
  if (initialActive) {
    const title = document.getElementById('mobilePageTitle');
    if (title) title.textContent = initialActive.querySelector('span').textContent.trim();
  }
  items.forEach(link => {
    link.addEventListener('pointerdown', () => select(link)); // đổi màu ngay khi nhấn
    link.addEventListener('click', e => {
      const href = link.getAttribute('href');
      if (!href || href === '#') {
        e.preventDefault();
      }
      select(link);
    });
  });
})();

// Giao diện mobile: thanh tab dưới, vuốt đóng drawer, đồng bộ mục đang chọn
(function () {
  const links = [...document.querySelectorAll('#navContainer .nav-item')];
  const bar = document.getElementById('mobileBottomNav');
  const lightColors = ['#1d6fe8', '#8055ff', '#c044ed', '#08aeca', '#12a978', '#bb8500', '#1677ff'];
  const darkColors = ['#60a5fa', '#b499ff', '#e879f9', '#22d3ee', '#34d399', '#fbbf24', '#60a5fa'];
  const getColors = () => document.documentElement.classList.contains('dark') ? darkColors : lightColors;
  const pick = [0, 1, 2, 5]; // Hôm nay, Ngữ pháp, Từ vựng, Thi thử
  const tabs = pick.map(i => {
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'mbn-item';
    b.style.setProperty('--c', getColors()[i]);
    b.dataset.index = i;
    b.append(links[i].querySelector('svg').cloneNode(true));
    const t = document.createElement('span');
    t.textContent = links[i].querySelector('span').textContent.trim();
    b.append(t);
    b.addEventListener('click', () => links[i].click());
    bar.append(b);
    return b;
  });
  const more = document.createElement('button');
  more.type = 'button';
  more.className = 'mbn-item';
  more.setAttribute('aria-haspopup', 'dialog');
  more.innerHTML = '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="5" cy="12" r="1"></circle><circle cx="12" cy="12" r="1"></circle><circle cx="19" cy="12" r="1"></circle></svg><span>Thêm</span>';
  more.addEventListener('click', () => setMobileNavOpen(true));
  bar.append(more);

  function sync() {
    const activeIdx = links.findIndex(l => l.classList.contains('active'));
    const curColors = getColors();
    tabs.forEach(b => {
      const idx = Number(b.dataset.index);
      b.style.setProperty('--c', curColors[idx]);
      const on = idx === activeIdx;
      b.classList.toggle('active', on);
      if (on) b.setAttribute('aria-current', 'page'); else b.removeAttribute('aria-current');
    });
    // Mục không nằm trên thanh tab (Nghe, Đọc, Xếp hạng) -> làm nổi bật "Thêm"
    more.classList.toggle('active', activeIdx !== -1 && !pick.includes(activeIdx));
    more.style.setProperty('--c', curColors[Math.max(activeIdx, 0)]);
  }
  links.forEach(l => new MutationObserver(sync).observe(l, { attributes: true, attributeFilter: ['class'] }));
  window.addEventListener('themechange', sync);
  sync();

  document.getElementById('drawerClose').addEventListener('click', () => setMobileNavOpen(false));

  // Vuốt sang trái trên drawer để đóng
  let sx = 0, sy = 0;
  sidebar.addEventListener('touchstart', e => { sx = e.touches[0].clientX; sy = e.touches[0].clientY; }, { passive: true });
  sidebar.addEventListener('touchend', e => {
    const dx = e.changedTouches[0].clientX - sx, dy = e.changedTouches[0].clientY - sy;
    if (dx < -70 && Math.abs(dx) > Math.abs(dy) * 1.5) setMobileNavOpen(false);
  }, { passive: true });

  // Quay ngang/lên desktop thì tự đóng drawer
  window.matchMedia('(min-width: 1024px)').addEventListener('change', e => { if (e.matches) setMobileNavOpen(false); });
})();
