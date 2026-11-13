/* Hàm dùng chung — trang Từ vựng gọi khi bấm Góp ý / Báo lỗi (gửi thật về FeedbackController để đưa vào Hàng đợi Kiểm duyệt Admin) */
function triggerFeedbackModal(options = {}) {
  const isReport = Boolean(options.isReport);
  const wordId = Number(options.wordId || 0);
  const wordText = String(options.word || '').trim();
  const defaultType = options.defaultType || (isReport ? '[Vocab] Nội dung thẻ từ' : 'Góp ý từ vựng');

  const categories = isReport
    ? ['[Vocab] Lỗi gõ', '[Vocab] Sai đáp án Quiz', '[Vocab] Audio không phát', '[Vocab] Nội dung thẻ từ']
    : ['Góp ý từ vựng', '[Vocab] Lỗi gõ', '[Vocab] Sai đáp án Quiz', '[Vocab] Audio không phát', '[Vocab] Nội dung thẻ từ'];

  const modal = document.createElement('div');
  modal.className = 'fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[70] flex items-center justify-center p-4';
  modal.innerHTML = `
    <div class="glass-card bg-white dark:bg-slate-900 rounded-3xl p-6 max-w-md w-full shadow-2xl relative border border-slate-200/80 dark:border-slate-700">
      <h3 class="text-lg font-extrabold text-slate-800 dark:text-white mb-1">${isReport ? 'Báo lỗi thẻ từ vựng 🚩' : 'Góp ý cho trang web 💬'}</h3>
      <p class="text-xs text-slate-500 mb-3">${wordText ? `Đang phản hồi cho từ: <strong class="text-slate-700 dark:text-slate-200">${wordText}</strong>` : 'Cảm ơn bạn đã hỗ trợ Tiếng Anh Ra Trường ngày càng hoàn thiện hơn!'}</p>
      <div class="mb-3">
        <label class="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Phân loại phản hồi</label>
        <div class="flex flex-wrap gap-1.5" data-fb-tags>
          ${categories.map((cat) => {
            const label = cat.replace('[Vocab] ', '');
            const active = cat === defaultType;
            return `<button type="button" data-fb-cat="${cat}" class="px-2.5 py-1 rounded-full text-[11px] font-bold border transition-all ${active ? 'bg-rose-600 text-white border-rose-600 shadow-sm' : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-rose-400'}">${label}</button>`;
          }).join('')}
        </div>
      </div>
      <textarea rows="4" placeholder="Nhập ý kiến hoặc mô tả lỗi tại đây..." class="w-full p-3 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 mb-2"></textarea>
      <p class="text-[11px] text-rose-500 font-semibold min-h-[16px] mb-2" data-fb-status></p>
      <div class="flex justify-end gap-2">
        <button type="button" data-fb-cancel class="px-4 py-2 text-xs font-bold text-slate-500 hover:text-slate-700 dark:hover:text-slate-300">Hủy</button>
        <button type="button" data-fb-send class="px-4 py-2 bg-blue-600 text-white text-xs font-bold rounded-xl shadow-md hover:bg-blue-700">Gửi phản hồi</button>
      </div>
    </div>`;

  let selectedCategory = defaultType;
  const textarea = modal.querySelector('textarea');
  const statusEl = modal.querySelector('[data-fb-status]');
  const sendBtn = modal.querySelector('[data-fb-send]');

  modal.querySelectorAll('[data-fb-cat]').forEach((btn) => {
    btn.addEventListener('click', () => {
      selectedCategory = btn.dataset.fbCat;
      modal.querySelectorAll('[data-fb-cat]').forEach((other) => {
        const isCurrent = other === btn;
        other.className = `px-2.5 py-1 rounded-full text-[11px] font-bold border transition-all ${isCurrent ? 'bg-rose-600 text-white border-rose-600 shadow-sm' : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-rose-400'}`;
      });
    });
  });

  if (isReport && wordText && textarea) {
    textarea.value = '';
    textarea.placeholder = `Mô tả lỗi gặp phải với từ "${wordText}" (ví dụ: đáp án chưa sát, không nghe được audio, sai ô trống...)`;
  }

  const close = () => modal.remove();
  modal.querySelector('[data-fb-cancel]').addEventListener('click', close);
  sendBtn.addEventListener('click', async () => {
    const note = (textarea?.value || '').trim();
    if (!note && !wordText) {
      if (statusEl) statusEl.textContent = 'Vui lòng nhập nội dung phản hồi.';
      return;
    }
    const wordMeta = wordText ? `[Word:#${wordId || 0}:${wordText}] ` : '';
    const finalContent = `${wordMeta}${note || `Người học báo lỗi ở từ "${wordText}" (${selectedCategory.replace('[Vocab] ', '')})`}`;
    sendBtn.disabled = true;
    sendBtn.textContent = 'Đang gửi...';
    try {
      const res = await fetch('/Feedback/Submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ FeedbackType: selectedCategory, Content: finalContent })
      });
      if (res.ok) {
        const data = await res.json();
        if (data?.success) {
          close();
          window.alert('Đã gửi phản hồi tới Admin để kiểm duyệt!');
          return;
        }
      }
      if (statusEl) statusEl.textContent = 'Không thể gửi trực tuyến lúc này. Vui lòng thử lại sau.';
    } catch {
      if (statusEl) statusEl.textContent = 'Lỗi kết nối máy chủ.';
    } finally {
      sendBtn.disabled = false;
      sendBtn.textContent = 'Gửi phản hồi';
    }
  });
  modal.addEventListener('click', (e) => { if (e.target === modal) close(); });
  document.body.appendChild(modal);
}

(() => {
            // ===== [MVC][JS 1/5] KHỞI TẠO + LỌC DANH SÁCH BỘ TỪ (View logic) =====
            // Lấy tham chiếu DOM; filterCards() ẩn/hiện .vocab-card theo tab + ô tìm kiếm + select chủ đề.
            // Sau này nếu lọc phía server: thay bằng fetch('/Vocabulary/Search?...') rồi render lại _VocabGroupList.
            const main = document.getElementById('dashboardMain');
            const search = main.querySelector('#vocabSearch');
            const topicFilter = main.querySelector('#vocabTopicFilter');
            const cards = [...main.querySelectorAll('.vocab-card')];
            const emptyState = main.querySelector('#vocabEmptyState');
            const tabs = [...main.querySelectorAll('.vocab-tab')];
            const groups = [...main.querySelectorAll('.vocab-group')];
            const topicSection = main.querySelector('#vocabTopics');
            const phraseCatalog = main.querySelector('#vocabPhraseCatalog');
            const phrasePractice = main.querySelector('#vocabPhrasePractice');
            const notebookSection = main.querySelector('#vocabNotebookSection');
            let activeTab = 'flashcards';
            let lucideRefreshQueued = false;

            function refreshLucideIcons() {
              if (!window.lucide) return;
              if (lucideRefreshQueued) return;
              lucideRefreshQueued = true;
              window.requestAnimationFrame(() => {
                lucideRefreshQueued = false;
                if (window.lucide) window.lucide.createIcons();
              });
            }

            if (main && typeof MutationObserver !== 'undefined') {
              const lucideObserver = new MutationObserver((mutations) => {
                for (const m of mutations) {
                  for (const node of m.addedNodes) {
                    if (node.nodeType === 1 && (node.hasAttribute?.('data-lucide') || node.querySelector?.('[data-lucide]'))) {
                      refreshLucideIcons();
                      return;
                    }
                  }
                }
              });
              lucideObserver.observe(main, { childList: true, subtree: true });
            }
            refreshLucideIcons();

            async function loadNotebookFromDb() {
              const grid = main.querySelector('#notebookWordsGrid');
              const countEl = main.querySelector('#notebookItemCount');
              const emptyEl = main.querySelector('#notebookEmptyState');
              if (!grid) return;
              grid.innerHTML = '<div class="col-span-full py-8 text-center text-sm text-slate-400"><i data-lucide="loader-2" class="animate-spin mr-2"></i>Đang tải sổ tay từ CSDL...</div>';
              try {
                const res = await fetch('/Vocabulary/GetNotebookWords');
                if (res.ok) {
                  const json = await res.json();
                  const words = json.data || [];
                  if (countEl) countEl.textContent = `${words.length} từ`;
                  if (words.length === 0) {
                    grid.innerHTML = '';
                    if (emptyEl) emptyEl.classList.remove('hidden');
                    return;
                  }
                  if (emptyEl) emptyEl.classList.add('hidden');
                  grid.replaceChildren(...words.map((w) => {
                    const exList = Array.isArray(w.examples) && w.examples.length > 0
                      ? w.examples
                      : (w.example ? [[String(w.example).replace(/\[([^\[\]]+)\]/g, '$1'), w.exampleMeaning || '']] : []);
                    const firstEx = exList[0] || null;
                    const extraExList = exList.slice(1);
                    const collocList = Array.isArray(w.collocations) ? w.collocations : [];
                    const hasMore = extraExList.length > 0 || collocList.length > 0;

                    const card = document.createElement('article');
                    card.className = 'glass-card rounded-3xl p-4 border border-amber-200/60 dark:border-amber-500/20 bg-card/95 flex flex-col justify-between';
                    card.innerHTML = `
                      <div>
                        <div class="flex items-center justify-between mb-2">
                          <span class="rounded-full bg-amber-100 dark:bg-amber-500/20 px-2.5 py-0.5 text-[10px] font-bold text-amber-700 dark:text-amber-300 uppercase">${w.type || 'WORD'}</span>
                          <span class="text-xs text-muted-foreground font-semibold">${w.topicTitle || ''}</span>
                        </div>
                        <h4 class="text-lg font-extrabold text-foreground mb-1">${w.word}</h4>
                        <p class="text-xs font-mono text-muted-foreground mb-2">${w.us || w.uk || ''}</p>
                        <p class="text-sm font-bold text-amber-600 dark:text-amber-400 mb-2">${w.meaning}</p>
                        ${firstEx ? `<div class="border-t pt-2 mt-2 text-xs"><p class="italic text-foreground/90 font-semibold">“${firstEx[0]}”</p>${firstEx[1] ? `<p class="text-muted-foreground mt-0.5">${firstEx[1]}</p>` : ''}</div>` : ''}
                        ${hasMore ? `
                          <button type="button" class="btn-notebook-more mt-2 w-full rounded-xl bg-purple-50 hover:bg-purple-100 text-purple-700 dark:bg-purple-500/10 dark:text-purple-300 py-1.5 text-xs font-bold transition" aria-expanded="false">
                            <i data-lucide="chevron-down" class="mr-1"></i>Xem thêm ví dụ (${extraExList.length})
                          </button>
                          <div class="notebook-extra-box mt-2 space-y-2" hidden>
                            ${extraExList.map(([en, vi]) => `
                              <div class="rounded-2xl border border-purple-200/70 bg-purple-50/40 dark:border-purple-500/20 dark:bg-purple-500/5 p-2.5 text-xs">
                                <div class="text-[10px] font-extrabold text-purple-600 uppercase mb-0.5">❞ VÍ DỤ</div>
                                <p class="font-bold italic text-foreground">“${en}”</p>
                                ${vi ? `<p class="text-muted-foreground mt-0.5">${vi}</p>` : ''}
                              </div>
                            `).join('')}
                            ${collocList.length ? `<div class="flex flex-wrap gap-1 pt-1">${collocList.map(c => `<span class="rounded-full bg-purple-100/80 text-purple-700 dark:bg-purple-500/20 dark:text-purple-300 px-2.5 py-0.5 text-[11px] font-semibold">${c}</span>`).join('')}</div>` : ''}
                          </div>
                        ` : ''}
                      </div>
                      <div class="mt-3 flex items-center justify-between pt-2 border-t">
                        <button type="button" class="btn-listen text-xs font-semibold text-slate-600 hover:text-foreground inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl hover:bg-muted/60 transition">
                          <i data-lucide="volume-2" class="text-amber-500"></i> Nghe
                        </button>
                        <button type="button" class="btn-remove text-xs font-semibold text-rose-500 hover:text-rose-600 inline-flex items-center gap-1 px-2.5 py-1 rounded-xl hover:bg-rose-50 transition">
                          <i data-lucide="trash-2"></i> Bỏ lưu
                        </button>
                      </div>
                    `;
                    const moreBtn = card.querySelector('.btn-notebook-more');
                    const extraBox = card.querySelector('.notebook-extra-box');
                    if (moreBtn && extraBox) {
                      moreBtn.addEventListener('click', () => {
                        const expanded = extraBox.hidden;
                        extraBox.hidden = !expanded;
                        moreBtn.setAttribute('aria-expanded', String(expanded));
                        moreBtn.innerHTML = expanded
                          ? '<i data-lucide="chevron-up" class="mr-1"></i>Thu gọn'
                          : `<i data-lucide="chevron-down" class="mr-1"></i>Xem thêm ví dụ (${extraExList.length})`;
                      });
                    }
                    card.querySelector('.btn-listen').addEventListener('click', () => {
                      if ('speechSynthesis' in window) {
                        const utt = new SpeechSynthesisUtterance(w.word);
                        utt.lang = 'en-US';
                        window.speechSynthesis.speak(utt);
                      }
                    });
                    card.querySelector('.btn-remove').addEventListener('click', async () => {
                      try {
                        await fetch('/Vocabulary/ToggleBookmark', {
                          method: 'POST',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({ wordId: w.wordId, word: w.word })
                        });
                        card.remove();
                        loadNotebookFromDb();
                      } catch (err) {
                        console.warn(err);
                      }
                    });
                    return card;
                  }));
                }
              } catch (err) {
                console.warn('loadNotebookFromDb error', err);
                grid.innerHTML = '<div class="col-span-full py-8 text-center text-sm text-rose-500">Không thể tải dữ liệu sổ tay từ server.</div>';
              }
            }

            function filterCards() {
              const isPhrases = activeTab === 'phrases';
              const isNotebook = activeTab === 'notebook';
              main.classList.toggle('phrases-active', isPhrases);
              topicSection.hidden = isPhrases || isNotebook;
              phraseCatalog.hidden = !isPhrases;
              if (notebookSection) notebookSection.hidden = !isNotebook;
              if (isNotebook) {
                loadNotebookFromDb();
                return;
              }
              if (isPhrases) return;
              const query = search.value.trim().toLocaleLowerCase();
              const topic = topicFilter.value;
              let visibleCount = 0;
              cards.forEach((card) => {
                const matchesQuery = card.dataset.title.toLocaleLowerCase().includes(query);
                const matchesTopic = topic === 'all' || card.dataset.topic === topic || (topic === 'business' && card.dataset.topic === 'office');
                const matchesTab = activeTab !== 'learned' || card.dataset.learned === 'true';
                const isVisible = matchesQuery && matchesTopic && matchesTab;
                card.hidden = !isVisible;
                if (isVisible) visibleCount += 1;
              });
              groups.forEach((group) => {
                group.hidden = !group.querySelector('.vocab-card:not([hidden])');
              });
              emptyState.textContent = 'Chưa có từ vựng phù hợp với lựa chọn này.';
              emptyState.classList.toggle('hidden', visibleCount > 0);
            }

            tabs.forEach((tab) => tab.addEventListener('click', () => {
              activeTab = tab.dataset.tab;
              tabs.forEach((item) => {
                const selected = item === tab;
                item.setAttribute('aria-selected', String(selected));
                item.classList.toggle('ring-2', selected);
                item.classList.toggle('ring-fuchsia-400', selected && activeTab !== 'phrases');
                item.classList.toggle('ring-cyan-400', selected && activeTab === 'phrases');
              });
              filterCards();
            }));
            search.addEventListener('input', filterCards);
            topicFilter.addEventListener('change', filterCards);
            const filterToggle = main.querySelector('#vocabFilterToggle');
            const filterOptions = main.querySelector('#vocabFilterOptions');
            filterToggle.addEventListener('click', () => {
              const expanded = filterToggle.getAttribute('aria-expanded') !== 'true';
              filterToggle.setAttribute('aria-expanded', String(expanded));
              filterOptions.classList.toggle('hidden', !expanded);
            });
            main.querySelectorAll('[data-open-tab]').forEach((button) => button.addEventListener('click', () => {
              tabs.find((tab) => tab.dataset.tab === button.dataset.openTab).click();
            }));

            // ===== [MVC][JS 2/5] DỮ LIỆU GHÉP CỤM TỪ (Model đang hardcode trong JS) =====
            // phraseBanks / businessPhraseSets / phraseSets / phraseSentenceContexts = DỮ LIỆU, không phải logic.
            // → Chuyển thành bảng DB (PhraseSet, PhraseItem) + endpoint API; JS chỉ nhận JSON.
            const phraseBanks = {
              business: [
                ['meet', 'deadlines', 'đáp ứng thời hạn'], ['achieve', 'goals', 'đạt mục tiêu'],
                ['provide', 'feedback', 'đưa ra phản hồi'], ['review', 'documents', 'xem xét tài liệu'],
                ['improve', 'efficiency', 'nâng cao hiệu quả'], ['ensure', 'compliance', 'đảm bảo tuân thủ'],
                ['manage', 'resources', 'quản lý nguồn lực'], ['reduce', 'costs', 'giảm chi phí'],
                ['develop', 'skills', 'phát triển kỹ năng'], ['make', 'decisions', 'đưa ra quyết định'],
                ['set', 'priorities', 'xác định ưu tiên'], ['build', 'relationships', 'xây dựng các mối quan hệ']
              ],
              office: [
                ['install', 'software', 'cài đặt phần mềm'], ['update', 'a system', 'cập nhật hệ thống'],
                ['back up', 'data', 'sao lưu dữ liệu'], ['connect', 'to a network', 'kết nối mạng'],
                ['replace', 'equipment', 'thay thiết bị'], ['troubleshoot', 'a problem', 'khắc phục sự cố'],
                ['follow', 'procedures', 'tuân theo quy trình'], ['submit', 'a report', 'nộp báo cáo'],
                ['file', 'documents', 'lưu hồ sơ'], ['schedule', 'a meeting', 'lên lịch họp'],
                ['request', 'approval', 'xin phê duyệt'], ['complete', 'a form', 'điền biểu mẫu']
              ],
              toeic: [
                ['place', 'an order', 'đặt hàng'], ['confirm', 'a reservation', 'xác nhận đặt chỗ'],
                ['submit', 'an application', 'nộp đơn'], ['attend', 'a meeting', 'tham dự cuộc họp'],
                ['request', 'a refund', 'yêu cầu hoàn tiền'], ['renew', 'a warranty', 'gia hạn bảo hành'],
                ['purchase', 'equipment', 'mua thiết bị'], ['follow', 'instructions', 'làm theo hướng dẫn'],
                ['schedule', 'an interview', 'lên lịch phỏng vấn'], ['receive', 'a promotion', 'được thăng chức'],
                ['check', 'availability', 'kiểm tra tình trạng còn chỗ'], ['offer', 'a discount', 'cung cấp giảm giá']
              ],
              finance: [
                ['open', 'an account', 'mở tài khoản'], ['pay', 'an invoice', 'thanh toán hóa đơn'],
                ['prepare', 'a budget', 'lập ngân sách'], ['transfer', 'funds', 'chuyển tiền'],
                ['calculate', 'interest', 'tính lãi suất'], ['file', 'a tax return', 'nộp tờ khai thuế'],
                ['track', 'expenses', 'theo dõi chi phí'], ['audit', 'financial records', 'kiểm toán hồ sơ tài chính'],
                ['invest', 'in stocks', 'đầu tư vào cổ phiếu'], ['issue', 'a receipt', 'xuất biên lai'],
                ['manage', 'inventory', 'quản lý hàng tồn kho'], ['process', 'a payment', 'xử lý khoản thanh toán']
              ],
              health: [
                ['make', 'an appointment', 'đặt lịch hẹn'], ['take', 'medicine', 'uống thuốc'],
                ['follow', 'a treatment plan', 'tuân theo phác đồ điều trị'], ['check', 'blood pressure', 'kiểm tra huyết áp'],
                ['get', 'a prescription', 'nhận đơn thuốc'], ['maintain', 'a healthy diet', 'duy trì chế độ ăn lành mạnh'],
                ['cover', 'medical expenses', 'chi trả chi phí y tế'], ['consult', 'a doctor', 'tham khảo ý kiến bác sĩ'],
                ['undergo', 'a checkup', 'khám sức khỏe'], ['recover', 'from an illness', 'hồi phục sau bệnh'],
                ['provide', 'medical care', 'cung cấp chăm sóc y tế'], ['exercise', 'regularly', 'tập thể dục thường xuyên']
              ],
              travel: [
                ['book', 'a flight', 'đặt chuyến bay'], ['check', 'in online', 'làm thủ tục trực tuyến'],
                ['claim', 'baggage', 'nhận hành lý'], ['reserve', 'a room', 'đặt phòng'],
                ['rent', 'a car', 'thuê xe'], ['board', 'a train', 'lên tàu'],
                ['visit', 'local attractions', 'tham quan các điểm du lịch địa phương'], ['confirm', 'a booking', 'xác nhận đặt chỗ'],
                ['pack', 'a suitcase', 'đóng gói hành lý'], ['arrange', 'transportation', 'sắp xếp phương tiện đi lại'],
                ['extend', 'a stay', 'kéo dài thời gian lưu trú'], ['cancel', 'a reservation', 'hủy đặt chỗ']
              ],
              dining: [
                ['reserve', 'a table', 'đặt bàn'], ['order', 'a meal', 'gọi món'],
                ['read', 'the menu', 'xem thực đơn'], ['pay', 'the bill', 'thanh toán hóa đơn'],
                ['leave', 'a tip', 'để lại tiền boa'], ['prepare', 'ingredients', 'chuẩn bị nguyên liệu'],
                ['follow', 'a recipe', 'làm theo công thức'], ['serve', 'dinner', 'phục vụ bữa tối'],
                ['try', 'a local dish', 'thử món ăn địa phương'], ['ask', 'for the check', 'yêu cầu hóa đơn'],
                ['make', 'a reservation', 'đặt chỗ'], ['enjoy', 'a performance', 'thưởng thức buổi biểu diễn']
              ]
            };
            const businessPhraseSets = [
              { title: 'Contracts', pairs: [['sign', 'a contract', 'ký hợp đồng'], ['negotiate', 'terms', 'đàm phán điều khoản'], ['reach', 'an agreement', 'đạt thỏa thuận'], ['terminate', 'a contract', 'chấm dứt hợp đồng'], ['fulfill', 'an obligation', 'thực hiện nghĩa vụ'], ['resolve', 'a dispute', 'giải quyết tranh chấp']] },
              { title: 'Business Planning', pairs: [['create', 'a business plan', 'lập kế hoạch kinh doanh'], ['conduct', 'market research', 'tiến hành nghiên cứu thị trường'], ['assess', 'risks', 'đánh giá rủi ro'], ['allocate', 'a budget', 'phân bổ ngân sách'], ['forecast', 'sales', 'dự báo doanh số'], ['evaluate', 'performance', 'đánh giá hiệu suất']] },
              { title: 'Conferences', pairs: [['hold', 'a conference', 'tổ chức hội nghị'], ['give', 'a presentation', 'thuyết trình'], ['deliver', 'a speech', 'phát biểu'], ['attend', 'a seminar', 'tham dự hội thảo'], ['register', 'for an event', 'đăng ký sự kiện'], ['exchange', 'business cards', 'trao đổi danh thiếp']] },
              { title: 'Office Technology', pairs: [['install', 'software', 'cài đặt phần mềm'], ['update', 'a system', 'cập nhật hệ thống'], ['back up', 'data', 'sao lưu dữ liệu'], ['connect', 'to a network', 'kết nối mạng'], ['replace', 'equipment', 'thay thiết bị'], ['troubleshoot', 'a problem', 'khắc phục sự cố']] },
              { title: 'Office Procedures', pairs: [['follow', 'procedures', 'tuân theo quy trình'], ['submit', 'a report', 'nộp báo cáo'], ['file', 'documents', 'lưu hồ sơ'], ['schedule', 'a meeting', 'lên lịch họp'], ['request', 'approval', 'xin phê duyệt'], ['complete', 'a form', 'điền biểu mẫu']] },
              { title: 'Correspondence', pairs: [['send', 'an email', 'gửi thư điện tử'], ['reply', 'to a message', 'trả lời tin nhắn'], ['attach', 'a file', 'đính kèm tệp'], ['forward', 'a letter', 'chuyển tiếp thư'], ['confirm', 'receipt', 'xác nhận đã nhận'], ['address', 'an envelope', 'ghi địa chỉ lên phong bì']] },
              { title: 'Advertising & Job Descriptions', pairs: [['launch', 'a campaign', 'triển khai chiến dịch'], ['write', 'a job description', 'viết mô tả công việc'], ['advertise', 'a position', 'đăng tuyển vị trí'], ['target', 'an audience', 'nhắm tới đối tượng'], ['promote', 'a product', 'quảng bá sản phẩm'], ['attract', 'applicants', 'thu hút ứng viên']] },
              { title: 'Hiring & Training', pairs: [['hire', 'an employee', 'tuyển nhân viên'], ['conduct', 'an interview', 'tiến hành phỏng vấn'], ['train', 'new staff', 'đào tạo nhân viên mới'], ['offer', 'a position', 'mời nhận vị trí'], ['check', 'references', 'kiểm tra thông tin người tham chiếu'], ['organize', 'a workshop', 'tổ chức buổi đào tạo']] },
              { title: 'Salaries & Benefits', pairs: [['earn', 'a salary', 'nhận lương'], ['receive', 'a bonus', 'nhận thưởng'], ['negotiate', 'a pay raise', 'thương lượng tăng lương'], ['claim', 'benefits', 'yêu cầu quyền lợi'], ['take', 'paid leave', 'nghỉ có hưởng lương'], ['calculate', 'overtime pay', 'tính tiền làm thêm giờ']] },
              { title: 'Marketing', pairs: [['identify', 'customer needs', 'xác định nhu cầu khách hàng'], ['launch', 'a product', 'ra mắt sản phẩm'], ['analyze', 'market trends', 'phân tích xu hướng thị trường'], ['increase', 'brand awareness', 'tăng nhận diện thương hiệu'], ['attract', 'customers', 'thu hút khách hàng'], ['conduct', 'a survey', 'thực hiện khảo sát']] }
            ];
            const phrasePalettes = {
              business: ['#d946ef', '#fae8ff', '#f0abfc', '#c026d3'], office: ['#06b6d4', '#cffafe', '#67e8f9', '#0891b2'],
              toeic: ['#f59e0b', '#fef3c7', '#fcd34d', '#d97706'],
              finance: ['#10b981', '#d1fae5', '#6ee7b7', '#059669'], health: ['#f43f5e', '#ffe4e6', '#fda4af', '#e11d48'],
              travel: ['#06b6d4', '#cffafe', '#67e8f9', '#0891b2'], dining: ['#f97316', '#ffedd5', '#fdba74', '#ea580c']
            };
            const phraseSets = [];
            const phraseGroupMap = new Map();

            function ensurePhraseGroup(topic, groupName) {
              const key = (topic || 'business').toLowerCase();
              if (phraseGroupMap.has(key)) return phraseGroupMap.get(key);
              const catalogGroup = document.createElement('section');
              catalogGroup.className = 'phrase-group';
              const [accent, soft, dark, text] = phrasePalettes[key] || phrasePalettes.business;
              catalogGroup.style.setProperty('--phrase-accent', accent);
              catalogGroup.style.setProperty('--phrase-soft', soft);
              catalogGroup.style.setProperty('--phrase-dark', dark);
              catalogGroup.style.setProperty('--phrase-text', text);
              catalogGroup.innerHTML = '<div class="phrase-group-heading"><h3></h3><span></span></div><div class="phrase-card-grid"></div>';
              catalogGroup.querySelector('h3').textContent = groupName || key;
              const countEl = catalogGroup.querySelector('.phrase-group-heading > span');
              const grid = catalogGroup.querySelector('.phrase-card-grid');
              phraseCatalog.appendChild(catalogGroup);
              const entry = { catalogGroup, grid, countEl };
              phraseGroupMap.set(key, entry);
              return entry;
            }

            function appendPhraseSetCard(set, grid) {
              const card = document.createElement('article');
              card.className = 'phrase-card glass-card';
              card.innerHTML = '<div class="phrase-card-header"><div class="phrase-card-title"><span class="phrase-card-icon"><i data-lucide="link" aria-hidden="true"></i></span><h4></h4></div><span class="phrase-card-status"></span></div><div class="phrase-card-progress-label"><span>Đã ghép</span><span class="phrase-card-percent"></span></div><div class="phrase-card-track" role="progressbar" aria-label="Tiến độ ghép" aria-valuemin="0"><div class="phrase-card-fill"></div></div><div class="phrase-card-footer"><span class="phrase-card-count"></span><button class="phrase-start" type="button"><span></span><i data-lucide="arrow-right" aria-hidden="true"></i></button></div>';
              card.querySelector('h4').textContent = set.title;
              set.card = card;
              card.querySelector('.phrase-start').addEventListener('click', (event) => openPhrasePractice(set, event.currentTarget));
              grid.appendChild(card);
              phraseSets.push(set);
            }

            // Khởi tạo danh mục cụm từ hoàn toàn đồng bộ 1:1 theo các thẻ bộ từ (.vocab-card) thực tế trên giao diện Học thẻ
            phraseCatalog.innerHTML = '';
            groups.forEach((group) => {
              const topic = group.dataset.group;
              const cardsInGroup = [...group.querySelectorAll('.vocab-card')];
              if (cardsInGroup.length === 0) return;
              const sourceSets = cardsInGroup.map((card) => ({ title: card.dataset.title, pairs: [] }));
              const groupTitle = group.querySelector('h3').textContent.replace(/\s+/g, ' ').trim();
              const { grid, countEl } = ensurePhraseGroup(topic, groupTitle);
              countEl.textContent = `${sourceSets.length} bộ từ`;
              const bankPairs = phraseBanks[topic] || phraseBanks.business;
              sourceSets.forEach((source) => {
                const seen = new Set();
                const pairs = [...source.pairs, ...bankPairs].filter(([left]) => {
                  if (seen.has(left)) return false;
                  seen.add(left);
                  return true;
                }).slice(0, 12);
                const set = { title: source.title, topic, pairs, key: `vocab-phrase-progress:${topic}:${source.title}` };
                appendPhraseSetCard(set, grid);
              });
            });

            const phraseWordLessons = new Map();

            async function syncPhraseCatalogFromDb() {
              try {
                const res = await fetch('/Vocabulary/GetPhraseCatalog');
                if (!res.ok) return;
                const json = await res.json();
                if (!json.success || !Array.isArray(json.data)) return;

                if (json.words && typeof json.words === 'object') {
                  Object.entries(json.words).forEach(([key, wordDto]) => {
                    if (key && wordDto) phraseWordLessons.set(key.toLowerCase(), wordDto);
                  });
                }

                json.data.forEach((dbGroup) => {
                  const topic = (dbGroup.category || 'business').toLowerCase();
                  if (!phraseGroupMap.has(topic)) return;
                  const { grid, countEl } = phraseGroupMap.get(topic);
                  (dbGroup.sets || []).forEach((dbSet) => {
                    const dbPairs = (dbSet.pairs || []).map(([left, right, meaning, before, after, focusWord]) => {
                      if (before || after) {
                        phraseSentenceContexts[`${left} ${right}`] = [before || '', after || ''];
                      }
                      return focusWord ? [left, right, meaning, focusWord] : [left, right, meaning];
                    });
                    if (!dbPairs.length) return;

                    const existing = phraseSets.find((s) =>
                      s.topic === topic && s.title.toLowerCase() === (dbSet.title || '').toLowerCase()
                    );
                    if (existing) {
                      existing.pairs = dbPairs;
                    }
                  });
                  countEl.textContent = `${grid.children.length} bộ từ`;
                });
                refreshPhraseCatalog();
              } catch (err) {
                console.warn('GetPhraseCatalog sync error:', err);
              }
            }

            function readPhraseProgress(set) {
              try {
                const stored = JSON.parse(localStorage.getItem(set.key) || '[]');
                return new Set(Array.isArray(stored) ? stored.filter((id) => Number.isInteger(id) && id >= 0 && id < set.pairs.length) : []);
              } catch { return new Set(); }
            }

            function refreshPhraseCatalog() {
              phraseSets.forEach((set) => {
                const count = readPhraseProgress(set).size;
                const percent = Math.round(count / set.pairs.length * 100);
                set.card.classList.toggle('is-started', count > 0);
                set.card.querySelector('.phrase-card-status').textContent = count === 0 ? 'Mới' : count === set.pairs.length ? 'Đã ghép' : 'Đang ghép';
                set.card.querySelector('.phrase-card-percent').textContent = `${percent}%`;
                set.card.querySelector('.phrase-card-count').innerHTML = '<i data-lucide="link" aria-hidden="true"></i>';
                set.card.querySelector('.phrase-card-count').append(` ${count}/${set.pairs.length} cụm`);
                if (window.lucide && typeof window.lucide.createIcons === 'function') {
                  window.lucide.createIcons({ root: set.card.querySelector('.phrase-card-count') });
                }
                set.card.querySelector('.phrase-card-fill').style.width = `${percent}%`;
                const track = set.card.querySelector('.phrase-card-track');
                track.setAttribute('aria-valuemax', String(set.pairs.length));
                track.setAttribute('aria-valuenow', String(count));
                set.card.querySelector('.phrase-start > span').textContent = count === 0 ? 'Bắt đầu ghép' : count === set.pairs.length ? 'Ghép lại' : 'Ghép tiếp';
              });
            }
            refreshPhraseCatalog();
            syncPhraseCatalogFromDb();

            const phraseSentenceContexts = {
              'resolve an issue': ['Please contact support to', 'with your order.'],
              'sign a contract': ['Both parties must', 'before work begins.'],
              'negotiate terms': ['The suppliers will', 'before signing the agreement.'],
              'reach an agreement': ['After several discussions, both sides hope to', 'by Friday.'],
              'terminate a contract': ['A serious breach may allow the company to', 'with the supplier.'],
              'fulfill an obligation': ['The contractor must', 'stated in the agreement.'],
              'resolve a dispute': ['The two parties hired a mediator to', 'over the payment.'],
              'meet deadlines': ['Careful planning helps employees', 'on important projects.'],
              'achieve goals': ['The team will work together to', 'set for this quarter.'],
              'provide feedback': ['Please', 'on the draft before we publish it.'],
              'review documents': ['The legal department will', 'before approving the agreement.'],
              'improve efficiency': ['The new software is expected to', 'in daily operations.'],
              'ensure compliance': ['Regular inspections help', 'with safety regulations.'],
              'manage resources': ['Project leaders must', 'carefully to avoid waste.'],
              'reduce costs': ['The factory is looking for ways to', 'without lowering quality.'],
              'develop skills': ['Training programs help employees', 'needed for their jobs.'],
              'make decisions': ['Managers use reliable data to', 'about the future of the company.'],
              'set priorities': ['At the start of each week, the team should', 'for its most urgent tasks.'],
              'build relationships': ['Regular communication helps businesses', 'with their customers.'],
              'create a business plan': ['Before opening a new store, we need to', 'for the first year.'],
              'conduct market research': ['The company will', 'to understand customer preferences.'],
              'assess risks': ['Investors should', 'before funding a new project.'],
              'allocate a budget': ['The manager must', 'for each stage of the project.'],
              'forecast sales': ['Analysts use recent trends to', 'for the next quarter.'],
              'evaluate performance': ['Supervisors regularly', 'to identify areas for improvement.'],
              'hold a conference': ['The association plans to', 'for its members in September.'],
              'give a presentation': ['Our sales director will', 'about the new product line.'],
              'deliver a speech': ['The guest speaker will', 'at the opening ceremony.'],
              'attend a seminar': ['All new employees are invited to', 'on workplace safety.'],
              'register for an event': ['Participants must', 'before the closing date.'],
              'exchange business cards': ['Conference attendees often', 'after introducing themselves.'],
              'install software': ['The technician will', 'on the new office computers.'],
              'update a system': ['The IT department may need to', 'to fix security problems.'],
              'back up data': ['Remember to', 'before replacing your computer.'],
              'connect to a network': ['Enter the password to', 'in the office.'],
              'replace equipment': ['The company plans to', 'that is no longer reliable.'],
              'troubleshoot a problem': ['A support specialist can help you', 'with your printer.'],
              'follow procedures': ['Employees must', 'when handling confidential information.'],
              'submit a report': ['Each department must', 'by the end of the month.'],
              'file documents': ['The assistant will', 'in the appropriate folders.'],
              'schedule a meeting': ['Please', 'with the project team for next Tuesday.'],
              'request approval': ['Staff must', 'before making large purchases.'],
              'complete a form': ['Visitors need to', 'at the reception desk.'],
              'send an email': ['Please', 'to confirm that you received the package.'],
              'reply to a message': ['The representative should', 'from a customer within one business day.'],
              'attach a file': ['You can', 'containing the requested information to your email.'],
              'forward a letter': ['The receptionist will', 'to the correct department.'],
              'confirm receipt': ['Please', 'of the documents we sent yesterday.'],
              'address an envelope': ['Use the full name of the recipient when you', 'for a business letter.'],
              'launch a campaign': ['The marketing team will', 'to promote the new service.'],
              'write a job description': ['The hiring manager needs to', 'for the vacant position.'],
              'advertise a position': ['The company will', 'on several recruitment websites.'],
              'target an audience': ['Effective advertisements should', 'likely to buy the product.'],
              'promote a product': ['The company uses social media to', 'to potential customers.'],
              'attract applicants': ['Competitive benefits can help employers', 'with strong qualifications.'],
              'hire an employee': ['The company plans to', 'to support the accounting team.'],
              'conduct an interview': ['The supervisor will', 'with each shortlisted candidate.'],
              'train new staff': ['Experienced employees will', 'during their first week.'],
              'offer a position': ['After checking references, we may', 'to the candidate in our sales department.'],
              'check references': ['Recruiters usually', 'before making a hiring decision.'],
              'organize a workshop': ['Human resources will', 'on communication skills.'],
              'earn a salary': ['Employees', 'based on their roles and experience.'],
              'receive a bonus': ['Staff who exceed their targets may', 'at the end of the year.'],
              'negotiate a pay raise': ['After taking on more responsibilities, she plans to', 'with her manager.'],
              'claim benefits': ['Eligible employees can', 'through the company insurance program.'],
              'take paid leave': ['Employees may', 'after completing their probation period.'],
              'calculate overtime pay': ['The payroll department must', 'for staff who worked extra hours.'],
              'identify customer needs': ['A successful sales team can', 'by asking the right questions.'],
              'launch a product': ['The company will', 'at the trade fair next month.'],
              'analyze market trends': ['Researchers', 'to understand changes in consumer demand.'],
              'increase brand awareness': ['Advertising can help', 'among potential customers.'],
              'attract customers': ['Special promotions are designed to', 'to the new store.'],
              'conduct a survey': ['We will', 'to measure customer satisfaction.'],
              'place an order': ['Customers can', 'through our website.'],
              'confirm a reservation': ['Please call the hotel to', 'before your trip.'],
              'submit an application': ['Candidates must', 'before the deadline.'],
              'attend a meeting': ['Department heads will', 'to discuss the annual budget.'],
              'request a refund': ['Customers may', 'if an item arrives damaged.'],
              'renew a warranty': ['You can', 'before the original coverage expires.'],
              'purchase equipment': ['The office needs to', 'for its new employees.'],
              'follow instructions': ['Please', 'carefully when setting up the device.'],
              'schedule an interview': ['The recruiter will', 'with the successful applicants.'],
              'receive a promotion': ['An employee with excellent results may', 'to a senior role.'],
              'check availability': ['Call the venue to', 'for your preferred date.'],
              'offer a discount': ['The store may', 'on large orders.'],
              'open an account': ['Bring identification if you want to', 'at the bank.'],
              'pay an invoice': ['The customer must', 'within thirty days.'],
              'prepare a budget': ['Each department should', 'for the coming year.'],
              'transfer funds': ['Customers can', 'between accounts using online banking.'],
              'calculate interest': ['The bank will', 'based on the balance in your account.'],
              'file a tax return': ['Businesses must', 'by the required deadline.'],
              'track expenses': ['Accounting software helps companies', 'throughout the year.'],
              'audit financial records': ['An independent firm will', 'to verify their accuracy.'],
              'invest in stocks': ['Some customers choose to', 'as part of their savings strategy.'],
              'issue a receipt': ['The cashier will', 'after the payment is processed.'],
              'manage inventory': ['The warehouse uses a digital system to', 'and prevent shortages.'],
              'process a payment': ['The bank needs one business day to', 'made by check.'],
              'make an appointment': ['Please', 'before visiting the clinic.'],
              'take medicine': ['Patients should', 'as directed by their doctor.'],
              'follow a treatment plan': ['It is important to', 'during recovery.'],
              'check blood pressure': ['The nurse will', 'before the examination.'],
              'get a prescription': ['You need to', 'before buying this medicine.'],
              'maintain a healthy diet': ['Regular exercise and balanced meals help you', 'over time.'],
              'cover medical expenses': ['The insurance policy may', 'related to hospital treatment.'],
              'consult a doctor': ['Patients should', 'if their symptoms persist.'],
              'undergo a checkup': ['Employees are encouraged to', 'once a year.'],
              'recover from an illness': ['Adequate rest helps patients', 'more quickly.'],
              'provide medical care': ['The hospital will', 'to all admitted patients.'],
              'exercise regularly': ['Doctors advise patients to', 'to stay healthy.'],
              'book a flight': ['Travelers should', 'early to get a better fare.'],
              'check in online': ['Passengers can', 'before arriving at the airport.'],
              'claim baggage': ['Follow the signs to', 'after your flight arrives.'],
              'reserve a room': ['Please', 'before the hotel becomes fully booked.'],
              'rent a car': ['Tourists may', 'to explore the area independently.'],
              'board a train': ['Passengers must have a valid ticket to', 'at this station.'],
              'visit local attractions': ['During your stay, you can', 'near the hotel.'],
              'confirm a booking': ['Contact the travel agent to', 'before departure.'],
              'pack a suitcase': ['Remember to', 'with everything you need for the trip.'],
              'arrange transportation': ['The hotel can', 'from the airport.'],
              'extend a stay': ['Guests may', 'if rooms are still available.'],
              'cancel a reservation': ['Call the hotel if you need to', 'before your arrival.'],
              'reserve a table': ['It is best to', 'for dinner on weekends.'],
              'order a meal': ['Customers can', 'from the restaurant website.'],
              'read the menu': ['Take a moment to', 'before choosing your food.'],
              'pay the bill': ['Please', 'at the front counter after your meal.'],
              'leave a tip': ['Customers often', 'to thank the waiter for good service.'],
              'prepare ingredients': ['The chef will', 'before starting to cook.'],
              'follow a recipe': ['You should', 'carefully when making this dish.'],
              'serve dinner': ['The restaurant will', 'from six tonight.'],
              'try a local dish': ['Visitors are encouraged to', 'during their trip.'],
              'ask for the check': ['When you finish your meal, you can', 'from your waiter.'],
              'make a reservation': ['Please', 'in advance for a large group.'],
              'enjoy a performance': ['Guests can', 'in the theater after dinner.']
            };

            // ===== [MVC][JS 3/5] LUYỆN GHÉP CỤM TỪ (Controller logic phía client) =====
            // buildPhraseQuestion → renderPhraseQuestion → choosePhrasePart (chấm đúng/sai) → advancePhraseQuestion.
            // openPhrasePractice / closePhrasePractice: chuyển giữa danh mục ↔ màn luyện.
            // Việc CHẤM ĐIỂM nên chuyển lên server (POST answers) để chống gian lận + lưu tiến độ.
            const phraseLeft = main.querySelector('#phraseMatchLeft');
            const phraseRight = main.querySelector('#phraseMatchRight');
            const phraseFeedback = main.querySelector('#phrasePracticeFeedback');
            const phraseNext = main.querySelector('#phrasePracticeNext');
            const phraseAutoSpeak = main.querySelector('#phraseAutoSpeak');
            const phraseAutoNext = main.querySelector('#phraseAutoNext');
            const phraseExplain = main.querySelector('#phraseExplain');
            const phraseBookmark = main.querySelector('#phrasePracticeBookmark');
            const phraseQuestionInstruction = main.querySelector('#phraseQuestionInstruction');
            const phraseHintRow = main.querySelector('#phraseHintRow');
            const phraseRevealAnswer = main.querySelector('#phraseRevealAnswer');
            const phraseAnswerSummary = main.querySelector('#phraseAnswerSummary');
            const phraseSummaryPhrase = main.querySelector('#phraseSummaryPhrase');
            const phraseSummaryMeaning = main.querySelector('#phraseSummaryMeaning');
            const phraseFocusWord = main.querySelector('#phraseFocusWord');
            const phraseSummarySpeak = main.querySelector('#phraseSummarySpeak');
            const phraseWordLesson = main.querySelector('#phraseWordLesson');
            const phraseLessonToggle = main.querySelector('#phraseLessonToggle');
            const phraseLessonFullDetails = main.querySelector('#phraseLessonFullDetails');
            const phraseOtherPairsCard = main.querySelector('#phraseOtherPairsCard');
            let phraseSession = null;
            let phraseAdvanceTimer = null;
            let phraseWrongResetTimer = null;

            const lightCollocationHeads = new Set([
              'key', 'make', 'take', 'give', 'get', 'pay', 'set', 'hold',
              'have', 'do', 'go', 'come', 'put', 'run', 'keep', 'leave',
              'read', 'open', 'book', 'ask', 'try', 'meet', 'find', 'show', 'use'
            ]);

            function matchPhraseLessonInPool(pool, pair) {
              if (!pool || !pool.length) return null;
              const explicit = (pair[3] || '').trim().toLowerCase();
              const left = (pair[0] || '').trim().toLowerCase();
              const right = (pair[1] || '').trim().toLowerCase();
              const rightClean = right.replace(/^(?:a|an|the|to|in|for|on|of|from)\s+/i, '');
              const orderedKeys = lightCollocationHeads.has(left)
                ? [explicit, rightClean, left]
                : [explicit, left, rightClean];
              const candidates = [...new Set(orderedKeys.filter(Boolean))];
              for (const key of candidates) {
                const exact = pool.find((w) => (w.word || '').trim().toLowerCase() === key);
                if (exact) return exact;
              }
              const fullPhrase = `${left} ${right}`.trim();
              if (fullPhrase) {
                const byCollocation = pool.find((w) =>
                  Array.isArray(w.collocations) && w.collocations.some((c) => c.toLowerCase().includes(fullPhrase))
                );
                if (byCollocation) return byCollocation;
              }
              for (const key of candidates) {
                const partial = pool.find((w) => {
                  const wordVal = (w.word || '').trim().toLowerCase();
                  return wordVal && (wordVal.startsWith(key) || key.startsWith(wordVal));
                });
                if (partial) return partial;
              }
              return null;
            }

            function getPhraseFocusWord(pair) {
              if (pair[3]) return pair[3];
              const matched = matchPhraseLessonInPool(phraseSession?.topicWords, pair)
                || matchPhraseLessonInPool([...phraseWordLessons.values()], pair);
              if (matched?.word) return matched.word;
              const left = (pair[0] || '').trim();
              const right = (pair[1] || '').trim();
              if (lightCollocationHeads.has(left.toLowerCase())) {
                return right.replace(/^(?:a|an|the|to|in|for|on|of|from)\s+/i, '');
              }
              return left;
            }

            function updatePhraseAnswerSummary(pair, status) {
              const isDone = status === 'correct' || status === 'revealed';
              phraseHintRow.hidden = isDone;
              phraseAnswerSummary.hidden = !isDone;
              phraseAnswerSummary.classList.toggle('is-correct', status === 'correct');
              phraseAnswerSummary.classList.toggle('is-revealed', status === 'revealed');
              phraseQuestionInstruction.classList.remove('is-wrong');
              phraseQuestionInstruction.classList.toggle('is-correct', status === 'correct');
              phraseQuestionInstruction.classList.toggle('is-revealed', status === 'revealed');
              if (status === 'correct') {
                phraseQuestionInstruction.innerHTML = '<i data-lucide="circle-check" aria-hidden="true"></i> Chính xác!';
                phraseSummaryPhrase.textContent = `${pair[0]} ${pair[1]}`;
                phraseSummaryMeaning.textContent = pair[2];
                phraseFocusWord.textContent = getPhraseFocusWord(pair);
                phraseRevealAnswer.hidden = true;
              } else if (status === 'revealed') {
                phraseQuestionInstruction.textContent = `Đáp án: ${pair[0]} ${pair[1]}`;
                phraseSummaryPhrase.textContent = `${pair[0]} ${pair[1]}`;
                phraseSummaryMeaning.textContent = pair[2];
                phraseFocusWord.textContent = getPhraseFocusWord(pair);
                phraseRevealAnswer.hidden = true;
              } else {
                phraseQuestionInstruction.textContent = 'CHỌN HAI VẾ ĐỂ HOÀN THÀNH CÂU';
                const id = phraseSession.order[phraseSession.index];
                const wrongCount = phraseSession.wrongAttempts.get(id) || 0;
                phraseRevealAnswer.hidden = wrongCount <= 2;
              }
            }

            function shuffled(items) {
              const result = [...items];
              for (let i = result.length - 1; i > 0; i -= 1) {
                const j = Math.floor(Math.random() * (i + 1));
                [result[i], result[j]] = [result[j], result[i]];
              }
              return result;
            }

            function buildPhraseQuestion(set, id) {
              const pair = set.pairs[id];
              const sentence = phraseSentenceContexts[`${pair[0]} ${pair[1]}`] || ['The team needs to', 'as part of its work.'];
              if (set.title === 'Contracts' && pair[0] === 'resolve' && pair[1] === 'an issue') {
                return { pair, sentence, leftOptions: ['engage', 'resolve', 'abide by', 'third'], rightOptions: ['the rules', 'party', 'the audience', 'an issue'] };
              }
              const pool = [...set.pairs, ...(phraseBanks[set.topic] || phraseBanks.business)];
              const optionsFor = (side) => {
                const alternatives = [...new Set(pool.map((item) => item[side]))].filter((value) => value !== pair[side]);
                return shuffled([pair[side], ...shuffled(alternatives).slice(0, 3)]);
              };
              return { pair, sentence, leftOptions: optionsFor(0), rightOptions: optionsFor(1) };
            }

            function currentPhraseQuestion() {
              return phraseSession.question;
            }

            function launchPhraseConfetti(anchorEl, cardEl) {
              const rect = anchorEl?.getBoundingClientRect?.();
              const cardRect = cardEl?.getBoundingClientRect?.();
              const originX = rect ? rect.left + rect.width / 2 : window.innerWidth / 2;
              const originY = rect ? rect.top + rect.height / 2 : window.innerHeight / 2;
              const colors = ['#10b981', '#06b6d4', '#a855f7', '#f59e0b', '#ec4899', '#6366f1'];
              const layer = document.createElement('div');
              layer.className = 'phrase-confetti-layer';
              layer.setAttribute('aria-hidden', 'true');
              const appendBurst = (cx, cy, count, minDist, extraDist) => {
                for (let i = 0; i < count; i += 1) {
                  const piece = document.createElement('span');
                  piece.className = 'phrase-confetti-piece';
                  const angle = (Math.PI * 2 * i) / count + (Math.random() - 0.5) * 0.4;
                  const distance = minDist + Math.random() * extraDist;
                  const tx = Math.cos(angle) * distance;
                  const ty = Math.sin(angle) * distance - 55;
                  piece.style.left = `${cx}px`;
                  piece.style.top = `${cy}px`;
                  piece.style.backgroundColor = colors[i % colors.length];
                  if (i % 3 === 0) piece.style.borderRadius = '50%';
                  piece.style.setProperty('--scale', (0.75 + Math.random() * 0.45).toFixed(2));
                  piece.style.setProperty('--tx', `${tx.toFixed(1)}px`);
                  piece.style.setProperty('--ty', `${ty.toFixed(1)}px`);
                  piece.style.setProperty('--rot', `${Math.round((Math.random() - 0.5) * 900)}deg`);
                  piece.style.animationDelay = `${(Math.random() * 0.1).toFixed(2)}s`;
                  layer.appendChild(piece);
                }
              };
              appendBurst(originX, originY, 84, 130, 230);
              if (cardRect) {
                appendBurst(cardRect.left + 24, cardRect.top + 24, 52, 90, 190);
                appendBurst(cardRect.right - 24, cardRect.top + 24, 52, 90, 190);
              }
              document.body.appendChild(layer);
              window.setTimeout(() => layer.remove(), 1650);
            }

            function clearPhraseWrongReset() {
              if (phraseWrongResetTimer !== null) window.clearTimeout(phraseWrongResetTimer);
              phraseWrongResetTimer = null;
            }

            function resetPhraseWrongSelection() {
              clearPhraseWrongReset();
              if (!phraseSession) return;
              phraseSession.selection = { left: null, right: null };
              phraseQuestionInstruction.classList.remove('is-wrong');
              phraseQuestionInstruction.textContent = 'CHỌN HAI VẾ ĐỂ HOÀN THÀNH CÂU';
              [phraseLeft, phraseRight].forEach((column) => {
                column.querySelectorAll('.is-wrong, .is-selecting').forEach((button) => button.classList.remove('is-wrong', 'is-selecting'));
                column.querySelectorAll('[aria-pressed="true"]').forEach((button) => button.setAttribute('aria-pressed', 'false'));
              });
              ['Left', 'Right'].forEach((name) => {
                const slot = main.querySelector(`#phraseAnswer${name}`);
                slot.textContent = '';
                slot.classList.remove('is-wrong', 'is-selecting');
              });
            }

            function clearPhraseAdvance() {
              clearPhraseWrongReset();
              if (phraseAdvanceTimer !== null) window.clearTimeout(phraseAdvanceTimer);
              phraseAdvanceTimer = null;
            }

            function updatePhrasePracticeProgress() {
              const { index, order, answered, revealed, complete, maxVisited } = phraseSession;
              main.querySelector('#phrasePracticeCounter').textContent = complete ? `Đã ghép ${answered.size}/${order.length}` : `Câu ${index + 1}/${order.length}`;
              [...main.querySelector('#phrasePracticeProgress').children].forEach((step, position) => {
                const isCurrent = position === index;
                const qId = order[position];
                const isRevealed = revealed.has(qId);
                if (isCurrent) step.setAttribute('aria-current', 'step');
                else step.removeAttribute('aria-current');
                step.classList.toggle('is-answered', answered.has(qId) && !isRevealed);
                step.classList.toggle('is-revealed', isRevealed);
                step.disabled = complete || (position > maxVisited && !answered.has(qId));
              });
              const solved = answered.has(order[index]);
              main.querySelector('#phrasePracticePrevious').disabled = index === 0 || complete;
              main.querySelector('#phrasePracticeForward').disabled = !solved || complete;
              const isLast = answered.size === order.length || index === order.length - 1;
              main.querySelector('#phrasePracticeForward').title = isLast ? 'Hoàn thành' : 'Câu tiếp theo';
              main.querySelector('#phrasePracticeForward').setAttribute('aria-label', isLast ? 'Hoàn thành' : 'Câu tiếp theo');
              phraseNext.hidden = !solved && !complete;
              phraseNext.disabled = !solved && !complete;
              phraseNext.querySelector('span').textContent = complete ? 'Quay lại các bộ cụm từ' : isLast ? 'Hoàn thành' : 'Câu tiếp theo';
            }

            let activeTtsAudio = null;

            function playEdgeTtsAudio(text, accent = 'us', onEnd = null) {
              const clean = (text || '').trim();
              if (!clean) {
                if (onEnd) onEnd();
                return;
              }
              if (activeTtsAudio) {
                try {
                  activeTtsAudio.pause();
                  activeTtsAudio.currentTime = 0;
                } catch {}
                activeTtsAudio = null;
              }
              if ('speechSynthesis' in window) window.speechSynthesis.cancel();

              const audioUrl = `/Vocabulary/AudioStream?text=${encodeURIComponent(clean)}&accent=${encodeURIComponent(accent)}`;
              const audio = new Audio(audioUrl);
              activeTtsAudio = audio;
              let finished = false;
              const handleDone = () => {
                if (finished) return;
                finished = true;
                if (activeTtsAudio === audio) activeTtsAudio = null;
                if (onEnd) onEnd();
              };
              audio.onended = handleDone;
              audio.onerror = () => {
                // Fallback nếu kết nối mạng tạm thời gián đoạn
                if ('speechSynthesis' in window) {
                  const u = new SpeechSynthesisUtterance(clean);
                  u.lang = accent === 'uk' ? 'en-GB' : 'en-US';
                  u.rate = .9;
                  u.onend = handleDone;
                  u.onerror = handleDone;
                  window.speechSynthesis.speak(u);
                } else {
                  handleDone();
                }
              };
              audio.play().catch(() => {
                audio.onerror();
              });
            }

            function speakTextAccent(text, lang = 'en-US') {
              const accent = lang.toLowerCase().includes('gb') ? 'uk' : 'us';
              playEdgeTtsAudio(text, accent);
            }

            async function ensurePhraseTopicWords(session) {
              if (!session) return [];
              if (Array.isArray(session.topicWords)) return session.topicWords;
              if (!session.topicWordsPromise) {
                session.topicWordsPromise = fetch(`/Vocabulary/GetTopicLesson?topicTitle=${encodeURIComponent(session.set.title)}`)
                  .then((res) => (res.ok ? res.json() : null))
                  .then((json) => {
                    session.topicWords = (json && json.success && Array.isArray(json.data)) ? json.data : [];
                    session.topicWords.forEach((w) => {
                      const key = (w?.word || '').trim().toLowerCase();
                      if (key && !phraseWordLessons.has(key)) phraseWordLessons.set(key, w);
                    });
                    return session.topicWords;
                  })
                  .catch(() => {
                    session.topicWords = [];
                    return [];
                  });
              }
              return session.topicWordsPromise;
            }

            function findPhraseLessonWord(session, pair, sentence) {
              const matched = matchPhraseLessonInPool(session.topicWords, pair)
                || matchPhraseLessonInPool([...phraseWordLessons.values()], pair);
              if (matched) return matched;
              const fullSentence = `${sentence[0]} ${pair[0]} ${pair[1]} ${sentence[1]}`.replace(/\s+/g, ' ').trim();
              return {
                word: getPhraseFocusWord(pair),
                type: 'COLLOCATION',
                meaning: pair[2],
                us: '',
                uk: '',
                definition: `${pair[0]} ${pair[1]} — ${pair[2]}.`,
                examples: [[fullSentence, pair[2]]],
                collocations: [`${pair[0]} ${pair[1]} — ${pair[2]}`],
                synonyms: [],
                antonyms: [],
                family: [],
                mistake: ['', '', ''],
                tip: `Ghi nhớ cụm "${pair[0]} ${pair[1]}" (${pair[2]}) theo ngữ cảnh câu.`,
                tags: [`#${(session.set.topic || 'vocabulary').toLowerCase()}`]
              };
            }

            function createFormattedChip(value, type = '') {
              const chip = document.createElement('span');
              const strVal = String(value || '').trim();
              if (type === 'synonym') {
                chip.className = 'inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold bg-correct/10 text-correct';
                chip.textContent = strVal;
              } else if (type === 'antonym') {
                chip.className = 'inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold bg-rose-500/10 text-rose-600 dark:text-rose-400';
                chip.textContent = strVal;
              } else if (strVal.includes(' — ') || strVal.includes(' - ')) {
                const sep = strVal.includes(' — ') ? ' — ' : ' - ';
                const [enPart, viPart] = strVal.split(sep);
                chip.className = 'inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold bg-skill-vocabulary-soft text-skill-vocabulary';
                chip.innerHTML = `<span class="font-semibold"><span lang="en">${enPart.trim()}</span></span><span class="text-skill-vocabulary/75">&nbsp;— ${viPart ? viPart.trim() : ''}</span>`;
              } else {
                chip.className = 'inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold bg-skill-vocabulary-soft text-skill-vocabulary';
                chip.textContent = strVal;
              }
              return chip;
            }

            function createFormattedExampleCard(english, vietnamese) {
              const card = document.createElement('div');
              card.className = 'rounded-2xl border border-skill-vocabulary/15 bg-skill-vocabulary-soft/30 p-3.5 lesson-example';
              const cleanEn = String(english || '').replace(/^[“"']+|[”"']+$/g, '').trim();
              const cleanVi = String(vietnamese || '').trim();
              const viAttr = cleanVi.replace(/"/g, '&quot;');
              card.innerHTML = `
                <p class="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-skill-vocabulary lesson-example-label">
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-quote size-3.5"><path d="M16 3a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2 1 1 0 0 1 1 1v1a2 2 0 0 1-2 2 1 1 0 0 0-1 1v2a1 1 0 0 0 1 1 6 6 0 0 0 6-6V5a2 2 0 0 0-2-2z"></path><path d="M5 3a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2 1 1 0 0 1 1 1v1a2 2 0 0 1-2 2 1 1 0 0 0-1 1v2a1 1 0 0 0 1 1 6 6 0 0 0 6-6V5a2 2 0 0 0-2-2z"></path></svg>Ví dụ
                </p>
                <p class="mt-1.5 text-sm font-semibold italic text-foreground/90 lesson-example-sentence">“<span lang="en" data-selection-text="" data-selection-translation="${viAttr}">${cleanEn}</span>”</p>
                <p class="mt-1 text-xs text-muted-foreground lesson-example-translation">${cleanVi}</p>
              `;
              return card;
            }

            function renderPhraseLessonChips(container, items, variant) {
              const list = Array.isArray(items) ? items.filter(Boolean) : [];
              const row = container.closest('.lesson-detail-row');
              if (row) row.hidden = list.length === 0;
              container.replaceChildren(...list.map((text) => createFormattedChip(text, variant)));
            }

            function renderPhraseLessonExamples(container, list) {
              container.replaceChildren(...(list || []).map(([english, vietnamese]) => createFormattedExampleCard(english, vietnamese)));
            }

            function updatePhraseLessonToggleUI() {
              const expanded = Boolean(phraseSession?.lessonExpanded);
              phraseLessonFullDetails.hidden = !expanded;
              phraseLessonToggle.setAttribute('aria-expanded', String(expanded));
              phraseLessonToggle.innerHTML = expanded
                ? '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-chevron-up mr-2 inline-block" aria-hidden="true"><path d="m18 15-6-6-6 6"/></svg>Thu gọn'
                : '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-chevron-down mr-2 inline-block" aria-hidden="true"><path d="m6 9 6 6 6-6"/></svg>Xem thêm';
            }

            function renderPhraseOtherPairs(session, currentPair) {
              const listEl = main.querySelector('#phraseOtherPairsList');
              const others = (session.set.pairs || [])
                .filter((p) => p[0] !== currentPair[0] || p[1] !== currentPair[1])
                .slice(0, 3);
              phraseOtherPairsCard.hidden = others.length === 0;
              listEl.replaceChildren(...others.map((p) => {
                const item = document.createElement('div');
                item.className = 'phrase-other-pair-item';
                const textWrap = document.createElement('div');
                textWrap.className = 'phrase-other-pair-text';
                const strong = document.createElement('strong');
                strong.textContent = `${p[0]} ${p[1]}`;
                const sub = document.createElement('span');
                sub.textContent = p[2] || '';
                textWrap.append(strong, sub);
                const speakBtn = document.createElement('button');
                speakBtn.type = 'button';
                speakBtn.className = 'phrase-summary-speak';
                speakBtn.setAttribute('aria-label', `Phát âm ${p[0]} ${p[1]}`);
                speakBtn.innerHTML = '<i data-lucide="volume-2" aria-hidden="true"></i>';
                speakBtn.addEventListener('click', () => speakTextAccent(`${p[0]} ${p[1]}`));
                item.append(textWrap, speakBtn);
                return item;
              }));
            }

            async function renderPhraseWordLesson() {
              if (!phraseSession) return;
              const session = phraseSession;
              const id = session.order[session.index];
              const solved = session.answered.has(id);
              const show = phraseExplain.checked && solved && !session.complete;
              main.querySelector('#phrasePracticeExplanation').hidden = true;
              phraseWordLesson.hidden = !show;
              phraseOtherPairsCard.hidden = !show;
              if (!show) return;

              const renderToken = session.renderToken;
              await ensurePhraseTopicWords(session);
              if (phraseSession !== session || session.renderToken !== renderToken || session.complete) return;

              const { pair, sentence } = currentPhraseQuestion();
              const item = findPhraseLessonWord(session, pair, sentence);
              const examples = Array.isArray(item.examples) ? item.examples : [];
              const collocations = Array.isArray(item.collocations) ? item.collocations : [];

              main.querySelector('#phraseLessonType').textContent = (item.type || 'WORD').toUpperCase();
              main.querySelector('#phraseLessonWord').textContent = item.word || getPhraseFocusWord(pair);
              const phoneticParts = [];
              if (item.us) phoneticParts.push(`US ${item.us}`);
              if (item.uk) phoneticParts.push(`UK ${item.uk}`);
              const phoneticEl = main.querySelector('#phraseLessonPhonetic');
              phoneticEl.textContent = phoneticParts.join('  ·  ');
              phoneticEl.hidden = phoneticParts.length === 0;

              main.querySelector('#phraseLessonFastType').textContent = (item.type || 'WORD').toUpperCase();
              main.querySelector('#phraseLessonMeaning').textContent = item.meaning || pair[2];
              renderPhraseLessonExamples(main.querySelector('#phraseLessonFastExamples'), examples.slice(0, 1));
              renderPhraseLessonChips(main.querySelector('#phraseLessonFastCollocations'), collocations.slice(0, 1));

              const defEl = main.querySelector('#phraseLessonDefinition');
              defEl.textContent = item.definition || '';
              defEl.hidden = !item.definition;
              renderPhraseLessonExamples(main.querySelector('#phraseLessonExamples'), examples.slice(1));
              renderPhraseLessonChips(main.querySelector('#phraseLessonCollocations'), collocations.slice(1));
              renderPhraseLessonChips(main.querySelector('#phraseLessonSynonyms'), item.synonyms, 'synonym');
              renderPhraseLessonChips(main.querySelector('#phraseLessonAntonyms'), item.antonyms, 'antonym');

              const wordFamilyEl = main.querySelector('#phraseLessonWordFamily');
              let familyItems = item.family || [];
              if (typeof familyItems === 'string') {
                familyItems = familyItems.split(/[\n;]+/).map((s) => s.trim()).filter(Boolean);
              }
              if (familyItems.length > 0) {
                wordFamilyEl.replaceChildren(...familyItems.map((line) => {
                  const row = document.createElement('div');
                  row.className = 'text-sm text-slate-800 dark:text-slate-200 leading-relaxed';
                  const parts = line.split(/\s*·\s*/);
                  if (parts.length >= 2) {
                    const strong = document.createElement('strong');
                    strong.className = 'font-bold text-slate-900 dark:text-white';
                    strong.textContent = parts[0];
                    row.append(strong);
                    parts.slice(1).forEach((part) => {
                      const sep = document.createElement('span');
                      sep.className = 'text-slate-400 mx-1.5 font-normal';
                      sep.textContent = '·';
                      const span = document.createElement('span');
                      span.className = 'text-slate-700 dark:text-slate-300';
                      span.textContent = part;
                      row.append(sep, span);
                    });
                  } else {
                    row.textContent = line;
                  }
                  return row;
                }));
              } else {
                wordFamilyEl.innerHTML = '<div class="text-xs text-muted-foreground italic">Chưa có dữ liệu họ từ</div>';
              }

              const [wrong, right, note] = item.mistake || [];
              const mistakeBox = main.querySelector('#phraseLessonMistakeBox');
              const mistakeEmpty = main.querySelector('#phraseLessonMistakeEmpty');
              if (wrong) {
                mistakeBox.hidden = false;
                mistakeEmpty.hidden = true;
                main.querySelector('#phraseLessonMistakeWrong').textContent = wrong;
                main.querySelector('#phraseLessonMistakeRight').textContent = right || '';
                main.querySelector('#phraseLessonMistakeNote').textContent = note || '';
              } else {
                mistakeBox.hidden = true;
                mistakeEmpty.hidden = false;
              }

              main.querySelector('#phraseLessonMemoryTip').textContent = item.tip || `Ghi nhớ "${item.word || pair[0]}" qua cụm "${pair[0]} ${pair[1]}".`;
              const tags = Array.isArray(item.tags) && item.tags.length ? item.tags : ['#toeic', '#vocabulary'];
              main.querySelector('#phraseLessonTags').replaceChildren(...tags.map((tag) => {
                const span = document.createElement('span');
                span.textContent = tag;
                return span;
              }));

              updatePhraseLessonToggleUI();
              renderPhraseOtherPairs(session, pair);
            }

            function updatePhraseExplanation() {
              renderPhraseWordLesson();
            }

            function updatePhraseBookmark() {
              const { pair } = currentPhraseQuestion();
              const key = `saved-phrase:${pair[0]} ${pair[1]}`;
              let saved = phraseSession.bookmarks.get(key) || false;
              if (!phraseSession.bookmarks.has(key)) {
                try { saved = localStorage.getItem(key) === 'true'; } catch { /* Use the session bookmark when storage is unavailable. */ }
              }
              phraseBookmark.setAttribute('aria-pressed', String(saved));
              phraseBookmark.setAttribute('aria-label', saved ? 'Bỏ lưu cụm từ' : 'Lưu cụm từ');
              phraseBookmark.title = saved ? 'Bỏ lưu cụm từ' : 'Lưu cụm từ';
              phraseBookmark.innerHTML = `<i data-lucide="bookmark"${saved ? ' class="is-filled"' : ''} aria-hidden="true"></i>`;
              refreshLucideIcons();
            }

            function renderPhraseQuestion() {
              clearPhraseAdvance();
              const session = phraseSession;
              session.renderToken += 1;
              if ('speechSynthesis' in window) window.speechSynthesis.cancel();
              const id = session.order[session.index];
              session.maxVisited = Math.max(session.maxVisited, session.index);
              session.question = buildPhraseQuestion(session.set, id);
              session.selection = { left: null, right: null };
              session.lessonExpanded = false;
              const { pair, sentence, leftOptions, rightOptions } = session.question;
              const solved = session.answered.has(id);
              const isRevealed = session.revealed.has(id);
              phraseLeft.replaceChildren();
              phraseRight.replaceChildren();
              main.querySelector('#phraseExerciseBody').hidden = false;
              main.querySelector('#phrasePracticeResult').hidden = true;
              phraseBookmark.hidden = false;
              main.querySelector('#phraseSentenceBefore').textContent = sentence[0];
              main.querySelector('#phraseSentenceAfter').textContent = sentence[1];
              main.querySelector('#phrasePracticeHint').textContent = `Gợi ý: ${pair[2]}`;
              main.querySelector('#phrasePracticeStatus > span').textContent = isRevealed ? 'Đã xem đáp án' : solved ? 'Đã ghép' : 'Cụm chưa ghép';
              ['Left', 'Right'].forEach((side, index) => {
                const slot = main.querySelector(`#phraseAnswer${side}`);
                slot.textContent = solved ? pair[index] : '';
                slot.classList.toggle('is-correct', solved && !isRevealed);
                slot.classList.toggle('is-revealed', isRevealed);
                slot.classList.remove('is-wrong');
              });
              phraseFeedback.textContent = '';
              ['left', 'right'].forEach((side) => {
                const options = side === 'left' ? leftOptions : rightOptions;
                options.forEach((value, position) => {
                  const choice = document.createElement('button');
                  choice.type = 'button';
                  choice.className = 'phrase-match-choice';
                  const correct = value === pair[side === 'left' ? 0 : 1];
                  choice.setAttribute('aria-pressed', String(solved && correct));
                  choice.disabled = solved;
                  choice.classList.toggle('is-matched', solved && !isRevealed && correct);
                  choice.classList.toggle('is-revealed-left', isRevealed && side === 'left' && correct);
                  choice.classList.toggle('is-revealed-right', isRevealed && side === 'right' && correct);
                  const marker = document.createElement('span');
                  marker.className = 'phrase-match-marker';
                  marker.setAttribute('aria-hidden', 'true');
                  marker.textContent = side === 'left' ? String.fromCharCode(65 + position) : String(position + 1);
                  const text = document.createElement('span');
                  text.textContent = value;
                  choice.append(marker, text);
                  choice.addEventListener('click', () => choosePhrasePart(side, value, choice));
                  (side === 'left' ? phraseLeft : phraseRight).appendChild(choice);
                });
              });
              updatePhraseAnswerSummary(pair, isRevealed ? 'revealed' : solved ? 'correct' : 'unsolved');
              updatePhraseBookmark();
              updatePhraseExplanation();
              updatePhrasePracticeProgress();
            }

            function speakPhrase(text, onComplete) {
              if (!phraseAutoSpeak.checked) {
                if (onComplete) onComplete();
                return;
              }
              playEdgeTtsAudio(text, 'us', onComplete);
            }

            function schedulePhraseAdvance() {
              clearPhraseAdvance();
              if (!phraseAutoNext.checked || !phraseSession || phraseSession.complete) return;
              const session = phraseSession;
              const index = session.index;
              if (!session.answered.has(session.order[index])) return;
              if (phraseAutoSpeak.checked && window.speechSynthesis?.speaking) return;
              phraseAdvanceTimer = window.setTimeout(() => {
                phraseAdvanceTimer = null;
                if (phraseSession === session && phraseSession.index === index && phraseAutoNext.checked) advancePhraseQuestion();
              }, 1900);
            }

            function choosePhrasePart(side, value, choice) {
              const session = phraseSession;
              const id = session.order[session.index];
              if (session.complete || session.answered.has(id)) return;
              if (phraseWrongResetTimer !== null || (session.selection.left && session.selection.right)) {
                resetPhraseWrongSelection();
              }
              const { pair, sentence } = currentPhraseQuestion();
              [phraseLeft, phraseRight].forEach((column) => column.querySelectorAll('.is-wrong').forEach((button) => button.classList.remove('is-wrong')));
              const column = side === 'left' ? phraseLeft : phraseRight;
              column.querySelectorAll('[aria-pressed="true"]').forEach((button) => button.setAttribute('aria-pressed', 'false'));
              choice.setAttribute('aria-pressed', 'true');
              session.selection[side] = { value, button: choice };
              ['Left', 'Right'].forEach((name) => {
                const slot = main.querySelector(`#phraseAnswer${name}`);
                slot.textContent = session.selection[name.toLowerCase()]?.value || '';
                slot.classList.remove('is-wrong');
              });
              phraseQuestionInstruction.classList.remove('is-wrong', 'is-correct', 'is-revealed');
              phraseQuestionInstruction.textContent = 'CHỌN HAI VẾ ĐỂ HOÀN THÀNH CÂU';
              phraseFeedback.textContent = '';
              const { left, right } = session.selection;
              if (!left || !right) {
                const targetSlot = main.querySelector(side === 'left' ? '#phraseAnswerLeft' : '#phraseAnswerRight');
                [choice, targetSlot].forEach((node) => {
                  node.classList.remove('is-selecting');
                  void node.offsetWidth;
                  node.classList.add('is-selecting');
                });
                speakPhrase(value);
                return;
              }
              if (left.value !== pair[0] || right.value !== pair[1]) {
                const wrongNodes = [left.button, right.button, main.querySelector('#phraseAnswerLeft'), main.querySelector('#phraseAnswerRight')];
                wrongNodes.forEach((node) => {
                  node.classList.remove('is-wrong');
                  void node.offsetWidth;
                  node.classList.add('is-wrong');
                });
                const wrongCount = (session.wrongAttempts.get(id) || 0) + 1;
                session.wrongAttempts.set(id, wrongCount);
                if (wrongCount > 2) phraseRevealAnswer.hidden = false;
                phraseQuestionInstruction.classList.add('is-wrong');
                phraseQuestionInstruction.textContent = 'Chưa đúng, thử lại nhé.';
                phraseFeedback.textContent = '';
                speakPhrase(value);
                const renderToken = session.renderToken;
                phraseWrongResetTimer = window.setTimeout(() => {
                  phraseWrongResetTimer = null;
                  if (phraseSession === session && session.renderToken === renderToken && !session.answered.has(id)) {
                    resetPhraseWrongSelection();
                  }
                }, 750);
                return;
              }
              session.answered.add(id);
              [phraseLeft, phraseRight].forEach((part) => [...part.children].forEach((button) => { button.disabled = true; }));
              [left.button, right.button].forEach((button) => button.classList.add('is-matched'));
              [main.querySelector('#phraseAnswerLeft'), main.querySelector('#phraseAnswerRight')].forEach((slot) => slot.classList.add('is-correct'));
              launchPhraseConfetti(main.querySelector('.phrase-question-sentence'), main.querySelector('.phrase-question-card'));
              main.querySelector('#phrasePracticeStatus > span').textContent = 'Đã ghép';
              phraseFeedback.textContent = '';
              updatePhraseAnswerSummary(pair, 'correct');
              const saved = readPhraseProgress(session.set);
              session.answered.forEach((answeredId) => saved.add(answeredId));
              try { localStorage.setItem(session.set.key, JSON.stringify([...saved])); } catch { /* Keep the answer available in this session. */ }
              fetch('/Vocabulary/SavePhraseProgress', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  topicCategory: session.set.topic,
                  setTitle: session.set.title,
                  completedCount: saved.size,
                  totalCount: session.set.pairs.length
                })
              }).catch(() => {});
              refreshPhraseCatalog();
              updatePhraseExplanation();
              updatePhrasePracticeProgress();
              const renderToken = session.renderToken;
              speakPhrase(`${sentence[0]} ${pair[0]} ${pair[1]} ${sentence[1]}`, () => {
                if (phraseSession === session && phraseSession.renderToken === renderToken && phraseSession.order[phraseSession.index] === id) schedulePhraseAdvance();
              });
              phraseNext.focus({ preventScroll: true });
            }

            function revealPhraseAnswer() {
              if (!phraseSession || phraseSession.complete) return;
              clearPhraseAdvance();
              const session = phraseSession;
              const id = session.order[session.index];
              if (session.answered.has(id)) return;
              const { pair, leftOptions, rightOptions } = currentPhraseQuestion();
              session.revealed.add(id);
              session.answered.add(id);
              [phraseLeft, phraseRight].forEach((column, sideIndex) => {
                const options = sideIndex === 0 ? leftOptions : rightOptions;
                const target = pair[sideIndex];
                [...column.children].forEach((button, idx) => {
                  const isCorrectChoice = options[idx] === target;
                  button.disabled = true;
                  button.classList.remove('is-wrong');
                  button.setAttribute('aria-pressed', String(isCorrectChoice));
                  if (isCorrectChoice) {
                    button.classList.add(sideIndex === 0 ? 'is-revealed-left' : 'is-revealed-right');
                  }
                });
              });
              ['Left', 'Right'].forEach((name, idx) => {
                const slot = main.querySelector(`#phraseAnswer${name}`);
                slot.textContent = pair[idx];
                slot.classList.remove('is-wrong', 'is-correct');
                slot.classList.add('is-revealed');
              });
              main.querySelector('#phrasePracticeStatus > span').textContent = 'Đã xem đáp án';
              phraseFeedback.textContent = '';
              updatePhraseAnswerSummary(pair, 'revealed');
              const saved = readPhraseProgress(session.set);
              session.answered.forEach((answeredId) => saved.add(answeredId));
              try { localStorage.setItem(session.set.key, JSON.stringify([...saved])); } catch { /* Keep the answer available in this session. */ }
              fetch('/Vocabulary/SavePhraseProgress', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  topicCategory: session.set.topic,
                  setTitle: session.set.title,
                  completedCount: saved.size,
                  totalCount: session.set.pairs.length
                })
              }).catch(() => {});
              refreshPhraseCatalog();
              updatePhraseExplanation();
              updatePhrasePracticeProgress();
              phraseNext.focus({ preventScroll: true });
            }

            function advancePhraseQuestion() {
              if (!phraseSession) return;
              clearPhraseAdvance();
              const session = phraseSession;
              if (session.complete) {
                closePhrasePractice();
                return;
              }
              if (!session.answered.has(session.order[session.index])) return;
              if (session.answered.size === session.order.length) {
                session.complete = true;
                main.querySelector('#phraseExerciseBody').hidden = true;
                phraseWordLesson.hidden = true;
                phraseOtherPairsCard.hidden = true;
                main.querySelector('#phrasePracticeResult').hidden = false;
                main.querySelector('#phrasePracticeResultText').textContent = `Bạn đã ghép đúng ${session.order.length}/${session.order.length} cụm từ trong bộ ${session.set.title}.`;
                main.querySelector('#phrasePracticeStatus > span').textContent = 'Hoàn thành';
                phraseBookmark.hidden = true;
                updatePhrasePracticeProgress();
                phraseNext.focus({ preventScroll: true });
                return;
              }
              session.index = session.index < session.order.length - 1 ? session.index + 1 : session.order.findIndex((id) => !session.answered.has(id));
              renderPhraseQuestion();
              phraseLeft.querySelector('button:not(:disabled)')?.focus({ preventScroll: true });
            }

            function openPhrasePractice(set, trigger) {
              clearPhraseAdvance();
              const completed = readPhraseProgress(set);
              const order = set.pairs.map((_, index) => index);
              if (set.title === 'Contracts' && set.topic === 'business') order.unshift(order.pop());
              const answered = completed.size === order.length ? new Set() : completed;
              const index = Math.max(0, order.findIndex((id) => !answered.has(id)));
              phraseSession = {
                set, trigger, order, answered, index, maxVisited: index, complete: false, bookmarks: new Map(), wrongAttempts: new Map(), revealed: new Set(), topicWords: null, topicWordsPromise: null, lessonExpanded: false, renderToken: 0,
                scrollY: window.scrollY,
                library: [...main.children].filter((node) => node !== phrasePractice && node.tagName !== 'SCRIPT').map((node) => [node, node.hidden])
              };
              ensurePhraseTopicWords(phraseSession);
              phraseSession.library.forEach(([node]) => { node.hidden = true; });
              phrasePractice.hidden = false;
              main.querySelector('#phrasePracticeTitle').textContent = `Ghép cụm từ · ${set.title}`;
              const progress = main.querySelector('#phrasePracticeProgress');
              progress.replaceChildren();
              order.forEach((id, position) => {
                const step = document.createElement('button');
                step.type = 'button';
                step.className = 'phrase-practice-step';
                step.title = `Câu ${position + 1}`;
                step.setAttribute('aria-label', `Câu ${position + 1}`);
                step.addEventListener('click', () => {
                  if (phraseSession.complete || (position > phraseSession.maxVisited && !phraseSession.answered.has(id))) return;
                  phraseSession.index = position;
                  renderPhraseQuestion();
                });
                progress.appendChild(step);
              });
              renderPhraseQuestion();
              window.scrollTo(0, main.getBoundingClientRect().top + window.scrollY);
              main.querySelector('#phrasePracticeBack').focus({ preventScroll: true });
            }

            function closePhrasePractice() {
              if (!phraseSession) return;
              const { library, trigger, scrollY } = phraseSession;
              phraseSession = null;
              clearPhraseAdvance();
              if ('speechSynthesis' in window) window.speechSynthesis.cancel();
              phrasePractice.hidden = true;
              library.forEach(([node, hidden]) => { node.hidden = hidden; });
              filterCards();
              refreshPhraseCatalog();
              window.scrollTo(0, scrollY);
              trigger.focus({ preventScroll: true });
            }
            main.querySelector('#phrasePracticeBack').addEventListener('click', closePhrasePractice);
            main.querySelector('#phrasePracticeHome').addEventListener('click', closePhrasePractice);
            phraseNext.addEventListener('click', advancePhraseQuestion);
            phraseRevealAnswer.addEventListener('click', revealPhraseAnswer);
            phraseSummarySpeak.addEventListener('click', () => {
              if (!phraseSession || phraseSession.complete) return;
              const { pair, sentence } = currentPhraseQuestion();
              speakTextAccent(`${sentence[0]} ${pair[0]} ${pair[1]} ${sentence[1]}`, 'en-US');
            });
            phraseLessonToggle.addEventListener('click', () => {
              if (!phraseSession) return;
              phraseSession.lessonExpanded = !phraseSession.lessonExpanded;
              updatePhraseLessonToggleUI();
            });
            main.querySelector('#phraseLessonSpeakUs').addEventListener('click', () => {
              const word = main.querySelector('#phraseLessonWord').textContent;
              speakTextAccent(word, 'en-US');
            });
            main.querySelector('#phraseLessonSpeakUk').addEventListener('click', () => {
              const word = main.querySelector('#phraseLessonWord').textContent;
              speakTextAccent(word, 'en-GB');
            });
            main.querySelector('#phrasePracticeForward').addEventListener('click', advancePhraseQuestion);
            main.querySelector('#phrasePracticePrevious').addEventListener('click', () => {
              if (!phraseSession || phraseSession.index === 0 || phraseSession.complete) return;
              phraseSession.index -= 1;
              renderPhraseQuestion();
            });
            phraseExplain.addEventListener('change', () => { if (phraseSession) updatePhraseExplanation(); });
            phraseAutoNext.addEventListener('change', schedulePhraseAdvance);
            phraseAutoSpeak.addEventListener('change', () => {
              if (!phraseAutoSpeak.checked) {
                if ('speechSynthesis' in window) window.speechSynthesis.cancel();
                return;
              }
              if (phraseSession?.answered.has(phraseSession.order[phraseSession.index])) {
                clearPhraseAdvance();
                const session = phraseSession;
                const renderToken = session.renderToken;
                const { pair, sentence } = currentPhraseQuestion();
                speakPhrase(`${sentence[0]} ${pair[0]} ${pair[1]} ${sentence[1]}`, () => {
                  if (phraseSession === session && phraseSession.renderToken === renderToken) schedulePhraseAdvance();
                });
              }
            });
            phraseBookmark.addEventListener('click', () => {
              const { pair } = currentPhraseQuestion();
              const key = `saved-phrase:${pair[0]} ${pair[1]}`;
              const saved = phraseBookmark.getAttribute('aria-pressed') !== 'true';
              phraseSession.bookmarks.set(key, saved);
              try { localStorage.setItem(key, String(saved)); } catch { /* Retain the bookmark in the active session. */ }
              updatePhraseBookmark();
            });
            function openPhraseFeedback(isReport) {
              if (!phraseSession) return;
              clearPhraseAdvance();
              triggerFeedbackModal();
              const textarea = document.querySelector('textarea[placeholder^="Nhập ý kiến"]');
              const { pair } = currentPhraseQuestion();
              if (textarea) textarea.value = `${isReport ? 'Báo lỗi' : 'Góp ý'} ở cụm từ: ${pair[0]} ${pair[1]} (${phraseSession.set.title})\n`;
            }
            main.querySelector('#phrasePracticeReport').addEventListener('click', () => openPhraseFeedback(true));
            main.querySelector('#phrasePracticeFeedbackButton').addEventListener('click', () => openPhraseFeedback(false));
            window.addEventListener('pagehide', clearPhraseAdvance);
            document.addEventListener('visibilitychange', () => {
              if (document.hidden) clearPhraseAdvance();
            });
            document.addEventListener('keydown', (event) => {
              if (event.key === 'Escape' && !phrasePractice.hidden) closePhrasePractice();
            });

            // ===== [MVC][JS 4/5] KHỞI TẠO MÀN HỌC TỪ (tham chiếu DOM của #vocabLessonView) =====
            const lessonView = main.querySelector('#vocabLessonView');
            const reviewStartButton = main.querySelector('#startReviewButton');
            const reviewDueSummary = main.querySelector('#reviewDueSummary');
            const reviewWorkspace = main.querySelector('#lessonWorkspace');
            const reviewWordList = main.querySelector('#reviewWordList');
            const reviewWordListToggle = main.querySelector('#reviewWordListToggle');
            const reviewWordItems = main.querySelector('#reviewWordItems');
            const reviewWordCount = main.querySelector('#reviewWordCount');
            const lessonFlipButton = main.querySelector('#lessonFlipButton');
            const lessonModeLabel = main.querySelector('.vocab-lesson-new');
            const lessonLibraryNodes = [...main.children].filter((node) =>
              node.id !== 'vocabLessonView' && node.id !== 'vocabStudyModal' &&
              node.tagName !== 'SCRIPT');
            let lessonSavedVisibility = [];
            const lessonSetTitle = main.querySelector('#lessonSetTitle');
            const lessonWord = main.querySelector('#lessonWord');
            const lessonMeaning = main.querySelector('#lessonMeaning');
            const lessonWordType = main.querySelector('#lessonWordType');
            const lessonCounter = main.querySelector('#lessonCounter');
            const lessonProgress = main.querySelector('#lessonProgress');
            const lessonProgressFill = main.querySelector('#lessonProgressFill');
            const lessonLiveMessage = main.querySelector('#lessonLiveMessage');
            const lessonAutoPronounce = main.querySelector('#lessonAutoPronounce');
            const lessonFastMode = main.querySelector('#lessonFastMode');
            const savedFastMode = localStorage.getItem('vocab_fast_mode');
            if (savedFastMode !== null) {
              lessonFastMode.checked = savedFastMode === 'true';
            } else {
              lessonFastMode.checked = true;
            }
            const lessonBookmark = main.querySelector('#lessonBookmark');
            const lessonSkipButton = main.querySelector('#lessonSkipButton');
            const lessonPronunciationUs = main.querySelector('#lessonUsPronunciation');
            const lessonPronunciationUk = main.querySelector('#lessonUkPronunciation');
            const lessonCard = main.querySelector('.vocab-lesson-card');
            const lessonDetail = main.querySelector('#lessonDetail');
            const lessonTabsBar = main.querySelector('.vocab-lesson-tabs');
            const lessonFastSummary = main.querySelector('#lessonFastSummary');
            const lessonFullDetails = main.querySelector('#lessonFullDetails');
            const lessonFastToggle = main.querySelector('#lessonFastToggle');
            const lessonQuiz = main.querySelector('#lessonQuiz');
            const lessonTyping = main.querySelector('#lessonTyping');
            const lessonReview = main.querySelector('#lessonReview');
            const lessonCardContent = main.querySelector('.vocab-lesson-card-content');
            const lessonTabs = [...main.querySelectorAll('.vocab-lesson-tab')];
            // ===== [MVC][JS 5/5] DỮ LIỆU TỪ VỰNG THEO BỘ (Model đang hardcode trong JS) =====
            // lessonWordSets[tên bộ] = mảng VocabWord (word, meaning, ipa, examples, collocations, ...).
            // → Chuyển thành bảng DB (VocabSet, VocabWord) + GET /api/vocab-sets/{title}/words.
            // Bên dưới là logic hiển thị: setLessonMode / renderLessonQuiz / renderLessonTyping / renderLessonReview /
            // renderLessonDetail / openLesson / closeLesson.
            const lessonWordSets = {};
            const fallbackLessonWordSets = {
              Contracts: [
                {
                  word: 'abide by', learned: true, meaning: 'tuân thủ, tuân theo', type: 'PHRASE', us: '/əˈbaɪd baɪ/', uk: '/əˈbaɪd baɪ/',
                  definition: 'To accept and follow a rule, decision, agreement, or law.',
                  examples: [
                    ['All employees must abide by the terms of the contract.', 'Tất cả nhân viên phải tuân thủ các điều khoản của hợp đồng.'],
                    ['Players who do not abide by the rules will be disqualified.', 'Người chơi không tuân thủ luật sẽ bị loại.']
                  ],
                  collocations: ['abide by the rules — tuân thủ luật lệ', 'abide by the terms — tuân thủ các điều khoản', 'abide by the agreement — tuân thủ thỏa thuận', 'abide by the decision — chấp hành quyết định'],
                  synonyms: ['comply with', 'obey', 'adhere to'], antonyms: ['violate', 'disregard'],
                  family: ['abide · verb · chịu đựng, tuân theo', 'abiding · adjective · lâu dài, bền lâu'],
                  mistake: ['All employees must abide the safety rules in the contract.', 'All employees must abide by the safety rules in the contract.', "'Abide by' là cụm động từ cố định. Khi mang nghĩa tuân thủ, phải có giới từ 'by'; không dùng 'abide' trực tiếp với tân ngữ."],
                  quiz: {
                    options: ['tuân thủ, tuân theo', 'vi phạm hợp đồng', 'chấm dứt thỏa thuận', 'đàm phán điều khoản'],
                    correctIndex: 0
                  },
                  typing: {
                    before: 'All employees must',
                    after: 'the terms of the contract.',
                    translation: 'Tất cả nhân viên phải tuân thủ các điều khoản của hợp đồng.'
                  },
                  tip: "'Abide by' = đi 'by' (cạnh) luật mà sống, tức luôn đi cùng và tuân theo luật.", tags: ['#contracts', '#legal', '#toeic']
                },
                { word: 'agreement', learned: true, meaning: 'hợp đồng, thỏa thuận', type: 'NOUN', us: '/əˈɡriːmənt/', uk: '/əˈɡriːmənt/', definition: 'A negotiated and typically legally binding arrangement between parties.', examples: [['Both parties signed the agreement yesterday.', 'Cả hai bên đã ký thỏa thuận ngày hôm qua.']], collocations: ['reach an agreement — đạt được thỏa thuận', 'sign an agreement — ký hợp đồng'], synonyms: ['contract', 'accord'], antonyms: ['disagreement'], family: ['agree · verb · đồng ý', 'agreeable · adjective · dễ chịu, tán thành'], mistake: ['make an agreement with to do', 'reach an agreement to do', "Dùng 'reach/sign an agreement' trong ngữ cảnh trang trọng."], tip: "Agree (đồng ý) + ment = sự đồng thuận / bản thỏa thuận.", tags: ['#contracts', '#legal', '#toeic'] },
                { word: 'assurance', learned: true, meaning: 'sự cam đoan, sự bảo đảm', type: 'NOUN', us: '/əˈʃʊrəns/', uk: '/əˈʃʊərəns/', definition: 'A positive declaration intended to give confidence; a promise.', examples: [['The manager gave his assurance that the project would be completed on time.', 'Người quản lý đã cam đoan rằng dự án sẽ hoàn thành đúng hạn.']], collocations: ['give an assurance — đưa ra lời cam đoan', 'quality assurance — đảm bảo chất lượng'], synonyms: ['guarantee', 'promise'], antonyms: ['uncertainty'], family: ['assure · verb · cam đoan', 'assured · adjective · chắc chắn'], mistake: ['assurance of to finish', 'assurance that it will finish', "Theo sau 'assurance' thường là mệnh đề 'that'."], tip: "Assure (đảm bảo) + ance = lời cam đoan chắc chắn.", tags: ['#contracts', '#legal', '#toeic'] },
                { word: 'cancellation', learned: true, meaning: 'sự hủy bỏ', type: 'NOUN', us: '/ˌkænsəˈleɪʃn/', uk: '/ˌkænsəˈleɪʃn/', definition: 'The action of canceling something that has been arranged or planned.', examples: [['Any cancellation must be made in writing at least 48 hours in advance.', 'Mọi sự hủy bỏ phải được thực hiện bằng văn bản trước ít nhất 48 giờ.']], collocations: ['cancellation fee — phí hủy', 'sudden cancellation — sự hủy đột ngột'], synonyms: ['termination', 'annulment'], antonyms: ['confirmation'], family: ['cancel · verb · hủy bỏ', 'canceled · adjective · đã bị hủy'], mistake: ['cancelation of the contract without notice', 'cancellation of the contract without notice', "Dùng danh từ 'cancellation' trước giới từ 'of'."], tip: "Cancel + lation = sự hủy bỏ đặt chỗ/hợp đồng.", tags: ['#contracts', '#legal', '#toeic'] },
                { word: 'determine', learned: true, meaning: 'xác định, quyết định', type: 'VERB', us: '/dɪˈtɜːrmɪn/', uk: '/dɪˈtɜːmɪn/', definition: 'To officially decide or ascertain the facts about something.', examples: [['An inquiry was set up to determine the cause of the accident.', 'Một cuộc điều tra được lập ra để xác định nguyên nhân vụ tai nạn.']], collocations: ['determine the cause — xác định nguyên nhân', 'determine the price — định giá'], synonyms: ['decide', 'establish', 'ascertain'], antonyms: ['guess', 'hesitate'], family: ['determination · noun · sự quyết tâm / xác định', 'determined · adjective · quyết tâm'], mistake: ['determine about the price', 'determine the price', "'Determine' là ngoại động từ, theo sau trực tiếp là tân ngữ."], tip: "De + termine (giới hạn) = vạch rõ giới hạn, xác định rõ.", tags: ['#contracts', '#legal', '#toeic'] },
                { word: 'engage', learned: true, meaning: 'tham gia, thuê, tuyển dụng', type: 'VERB', us: '/ɪnˈɡeɪdʒ/', uk: '/ɪnˈɡeɪdʒ/', definition: 'To participate or become involved in; to employ or hire.', examples: [['The firm engaged a legal consultant to review the contract.', 'Công ty đã thuê một cố vấn pháp lý để rà soát hợp đồng.']], collocations: ['engage in business — tham gia kinh doanh', 'engage a lawyer — thuê luật sư'], synonyms: ['hire', 'participate', 'involve'], antonyms: ['dismiss', 'withdraw'], family: ['engagement · noun · sự cam kết / hợp đồng', 'engaging · adjective · thu hút'], mistake: ['engage to business', 'engage in business', "Dùng 'engage in' khi mang nghĩa tham gia vào hoạt động nào đó."], tip: "Engage in = tham gia vào; engage someone = thuê ai.", tags: ['#contracts', '#legal', '#toeic'] },
                { word: 'establish', learned: true, meaning: 'thành lập, thiết lập', type: 'VERB', us: '/ɪˈstæblɪʃ/', uk: '/ɪˈstæblɪʃ/', definition: 'To set up an organization, system, or set of rules on a firm or permanent basis.', examples: [['The two companies established a long-term partnership.', 'Hai công ty đã thiết lập mối quan hệ đối tác lâu dài.']], collocations: ['establish a company — thành lập công ty', 'establish a relationship — thiết lập quan hệ'], synonyms: ['found', 'set up', 'create'], antonyms: ['abolish', 'dismantle'], family: ['establishment · noun · sự thành lập / cơ sở', 'established · adjective · có uy tín lâu năm'], mistake: ['establish up a business', 'establish a business', "Không dùng 'up' sau 'establish'."], tip: "Establish = làm cho vững chắc (stable), tức thành lập/thiết lập.", tags: ['#contracts', '#legal', '#toeic'] },
                { word: 'obligate', learned: true, meaning: 'bắt buộc, ràng buộc nghĩa vụ', type: 'VERB', us: '/ˈɑːblɪɡeɪt/', uk: '/ˈɒblɪɡeɪt/', definition: 'To bind or compel someone, especially legally or morally.', examples: [['The contract obligates the supplier to deliver goods on time.', 'Hợp đồng ràng buộc nhà cung cấp phải giao hàng đúng hạn.']], collocations: ['legally obligated — có nghĩa vụ pháp lý', 'obligate someone to do — bắt buộc ai làm gì'], synonyms: ['compel', 'bind', 'require'], antonyms: ['exempt', 'excuse'], family: ['obligation · noun · nghĩa vụ', 'obligatory · adjective · bắt buộc'], mistake: ['obligate delivering', 'obligate to deliver', "Dùng cấu trúc 'obligate someone to V'."], tip: "Obligate -> obligation: nghĩa vụ ràng buộc trong hợp đồng.", tags: ['#contracts', '#legal', '#toeic'] },
                { word: 'party', learned: true, meaning: 'bên (trong hợp đồng)', type: 'NOUN', us: '/ˈpɑːrti/', uk: '/ˈpɑːti/', definition: 'A person or group of people forming one side in an agreement or dispute.', examples: [['Either party may terminate the agreement with 30 days notice.', 'Mỗi bên có thể chấm dứt thỏa thuận với thông báo trước 30 ngày.']], collocations: ['contracting party — bên ký kết', 'third party — bên thứ ba'], synonyms: ['side', 'participant'], antonyms: [], family: ['parties · noun (plural) · các bên tham gia'], mistake: ['both party agreed', 'both parties agreed', "Khi đi với 'both', danh từ 'party' phải ở số nhiều 'parties'."], tip: "Trong hợp đồng TOEIC, 'party' không phải bữa tiệc mà là 'bên tham gia ký kết'.", tags: ['#contracts', '#legal', '#toeic'] },
                { word: 'provision', learned: true, meaning: 'điều khoản, sự cung cấp', type: 'NOUN', us: '/prəˈvɪʒn/', uk: '/prəˈvɪʒn/', definition: 'A condition or requirement in a legal document.', examples: [['Under the provisions of the lease, tenants cannot sublet the office.', 'Theo các điều khoản của hợp đồng thuê, người thuê không được cho thuê lại văn phòng.']], collocations: ['under the provisions of — theo điều khoản của', 'make provision for — dự phòng cho'], synonyms: ['clause', 'term', 'stipulation'], antonyms: [], family: ['provide · verb · cung cấp', 'provisional · adjective · tạm thời'], mistake: ['provision in the contract states', 'a provision in the contract states', "'Provision' khi mang nghĩa điều khoản là danh từ đếm được."], tip: "Provision = điều khoản dự liệu trước (vision) trong hợp đồng.", tags: ['#contracts', '#legal', '#toeic'] },
                { word: 'resolve', learned: true, meaning: 'giải quyết, quyết tâm', type: 'VERB', us: '/rɪˈzɑːlv/', uk: '/rɪˈzɒlv/', definition: 'To settle or find a solution to a problem, dispute, or contentious matter.', examples: [['The mediator helped resolve the dispute between the two firms.', 'Người hòa giải đã giúp giải quyết tranh chấp giữa hai công ty.']], collocations: ['resolve a dispute — giải quyết tranh chấp', 'resolve an issue — giải quyết vấn đề'], synonyms: ['settle', 'solve', 'work out'], antonyms: ['aggravate', 'complicate'], family: ['resolution · noun · sự giải quyết / nghị quyết', 'resolved · adjective · kiên quyết'], mistake: ['resolve about the dispute', 'resolve the dispute', "'Resolve' là ngoại động từ, đi thẳng với tân ngữ."], tip: "Re + solve (giải quyết) = tháo gỡ triệt để vấn đề.", tags: ['#contracts', '#legal', '#toeic'] },
                { word: 'specific', learned: true, meaning: 'cụ thể, rõ ràng', type: 'ADJECTIVE', us: '/spəˈsɪfɪk/', uk: '/spəˈsɪfɪk/', definition: 'Clearly defined or identified; precise and clear.', examples: [['Please refer to the specific guidelines in section 4 of the contract.', 'Vui lòng tham khảo các hướng dẫn cụ thể tại mục 4 của hợp đồng.']], collocations: ['specific requirements — yêu cầu cụ thể', 'specific details — chi tiết cụ thể'], synonyms: ['particular', 'precise', 'exact'], antonyms: ['vague', 'general'], family: ['specify · verb · chỉ rõ', 'specification · noun · thông số kỹ thuật', 'specifically · adverb · một cách cụ thể'], mistake: ['specific about to do', 'specific about what to do', "Dùng 'specific about + noun/wh-clause'."], tip: "Specific = chi tiết, cụ thể (khác với general = chung chung).", tags: ['#contracts', '#legal', '#toeic'] }
              ],
              'Business Planning': [
                {
                  word: 'strategy', learned: true, meaning: 'chiến lược', type: 'NOUN', us: '/ˈstrætədʒi/', uk: '/ˈstrætədʒi/',
                  definition: 'a plan that is intended to achieve a particular purpose',
                  examples: [
                    ['The board approved a new marketing strategy for the coming year.', 'Hội đồng quản trị đã phê duyệt chiến lược tiếp thị mới cho năm tới.'],
                    ['We need a long-term strategy to expand into international markets.', 'Chúng ta cần một chiến lược dài hạn để mở rộng sang các thị trường quốc tế.']
                  ],
                  collocations: ['business strategy — chiến lược kinh doanh', 'develop a strategy — xây dựng chiến lược', 'long-term strategy — chiến lược dài hạn'],
                  synonyms: ['plan', 'approach', 'policy'], antonyms: ['improvisation'],
                  family: ['strategic · adjective · mang tính chiến lược', 'strategist · noun · nhà chiến lược', 'strategically · adverb · một cách chiến lược'],
                  mistake: ['make a strategy for to grow', 'develop a strategy to grow', 'Use develop/formulate a strategy followed by to-infinitive.'],
                  tip: 'Strategy = bức tranh kế hoạch tổng thể dài hạn để đạt mục tiêu lớn.',
                  tags: ['#business', '#business-planning', '#luna-vocab-v1', '#toeic']
                },
                {
                  word: 'forecast', meaning: 'dự báo', type: 'NOUN', us: '/ˈfɔːrkæst/', uk: '/ˈfɔːkɑːst/',
                  definition: 'a statement about what will happen in the future, based on information that is available now',
                  examples: [
                    ['The sales forecast for the next quarter looks very promising.', 'Dự báo doanh số cho quý tới có vẻ rất khả quan.']
                  ],
                  collocations: ['sales forecast — dự báo doanh số', 'financial forecast — dự báo tài chính'],
                  synonyms: ['prediction', 'projection', 'estimate'], antonyms: ['hindsight'],
                  family: ['forecast · verb · dự báo', 'forecaster · noun · người dự báo'],
                  mistake: ['forecasted the sales', 'forecast the sales', 'The past tense and past participle of forecast is usually forecast.'],
                  tip: 'Fore (trước) + cast (tung ra/chiếu) = nhìn thấy và dự báo trước tương lai.',
                  tags: ['#business', '#business-planning', '#luna-vocab-v1', '#toeic']
                },
                {
                  word: 'demonstrate', meaning: 'thể hiện; chứng minh', type: 'VERB', us: '/ˈdemənstreɪt/', uk: '/ˈdemənstreɪt/',
                  definition: 'to show clearly that someone has a skill or that something is true',
                  examples: [
                    ['Applicants must demonstrate strong communication skills during the interview.', 'Ứng viên phải thể hiện kỹ năng giao tiếp tốt trong buổi phỏng vấn.'],
                    ['The report demonstrates that the new process has reduced delivery times.', 'Báo cáo chứng minh rằng quy trình mới đã rút ngắn thời gian giao hàng.'],
                    ['A technician demonstrated how to operate the conference-room equipment.', 'Một kỹ thuật viên đã hướng dẫn cách vận hành thiết bị phòng họp.']
                  ],
                  collocations: ['demonstrate an ability — thể hiện khả năng', 'demonstrate strong communication skills — thể hiện kỹ năng giao tiếp tốt', 'demonstrate that — chứng minh rằng', 'demonstrate commitment — thể hiện sự cam kết'],
                  synonyms: ['show', 'prove', 'display'], antonyms: ['hide', 'conceal'],
                  family: ['demonstration · noun · sự chứng minh; buổi trình diễn', 'demonstrator · noun · người trình diễn', 'demonstrable · adjective · có thể chứng minh', 'demonstrably · adverb · một cách rõ ràng'],
                  mistake: ['demonstrate about the product', 'demonstrate the product', 'Demonstrate takes the object directly; do not add about.'],
                  tip: 'demonstrate = đưa ra để người khác thấy rõ: vừa chứng minh, vừa trình diễn.',
                  tags: ['#business', '#business-planning', '#luna-vocab-v1', '#toeic']
                },
                { word: 'objective', meaning: 'mục tiêu', type: 'NOUN', us: '/əbˈdʒektɪv/', uk: '/əbˈdʒektɪv/', tags: ['#business', '#business-planning', '#toeic'] },
                { word: 'evaluate', meaning: 'đánh giá', type: 'VERB', us: '/ɪˈvæljueɪt/', uk: '/ɪˈvæljueɪt/', tags: ['#business', '#business-planning', '#toeic'] },
                { word: 'priority', meaning: 'sự ưu tiên', type: 'NOUN', us: '/praɪˈɔːrəti/', uk: '/praɪˈɒrəti/', tags: ['#business', '#business-planning', '#toeic'] },
                { word: 'allocate', meaning: 'phân bổ', type: 'VERB', us: '/ˈæləkeɪt/', uk: '/ˈæləkeɪt/', tags: ['#business', '#business-planning', '#toeic'] },
                { word: 'potential', meaning: 'tiềm năng', type: 'ADJECTIVE', us: '/pəˈtenʃl/', uk: '/pəˈtenʃl/', tags: ['#business', '#business-planning', '#toeic'] },
                { word: 'proposal', meaning: 'bản đề xuất', type: 'NOUN', us: '/prəˈpoʊzl/', uk: '/prəˈpəʊzl/', tags: ['#business', '#business-planning', '#toeic'] },
                { word: 'primary', meaning: 'chính; chủ yếu', type: 'ADJECTIVE', us: '/ˈpraɪmeri/', uk: '/ˈpraɪməri/', tags: ['#business', '#business-planning', '#toeic'] },
                { word: 'risk', meaning: 'rủi ro', type: 'NOUN', us: '/rɪsk/', uk: '/rɪsk/', tags: ['#business', '#business-planning', '#toeic'] },
                { word: 'substitute', meaning: 'thay thế', type: 'VERB', us: '/ˈsʌbstɪtuːt/', uk: '/ˈsʌbstɪtjuːt/', tags: ['#business', '#business-planning', '#toeic'] }
              ],
              Conferences: [
                { word: 'agenda', meaning: 'chương trình nghị sự', type: 'NOUN', us: '/əˈdʒendə/', uk: '/əˈdʒendə/' },
                { word: 'venue', meaning: 'địa điểm tổ chức', type: 'NOUN', us: '/ˈvenjuː/', uk: '/ˈvenjuː/' },
                { word: 'attendee', meaning: 'người tham dự', type: 'NOUN', us: '/əˌtenˈdiː/', uk: '/əˌtenˈdiː/' }
              ],
              'Office Procedures': [
                { word: 'procedure', meaning: 'quy trình; thủ tục', type: 'NOUN', us: '/prəˈsiːdʒər/', uk: '/prəˈsiːdʒə/', learned: true },
                { word: 'comply', meaning: 'tuân thủ', type: 'VERB', us: '/kəmˈplaɪ/', uk: '/kəmˈplaɪ/' },
                { word: 'authorization', meaning: 'sự cấp phép; ủy quyền', type: 'NOUN', us: '/ˌɔːθərəˈzeɪʃn/', uk: '/ˌɔːθəraɪˈzeɪʃn/' }
              ],
              'Office Technology': [
                {
                  word: 'affordable', learned: true, meaning: 'có giá phải chăng; vừa túi tiền', type: 'ADJECTIVE', us: '/əˈfɔːrdəbəl/', uk: '/əˈfɔːdəbl/',
                  definition: 'not too expensive for the people who want to buy it',
                  examples: [
                    ['The company offers affordable insurance plans for small businesses.', 'Công ty cung cấp các gói bảo hiểm có giá phải chăng cho doanh nghiệp nhỏ.'],
                    ['We chose this hotel because it provides affordable rooms near the airport.', 'Chúng tôi chọn khách sạn này vì nơi đây có các phòng vừa túi tiền gần sân bay.']
                  ],
                  collocations: ['affordable price — mức giá phải chăng', 'affordable housing — nhà ở giá phải chăng', 'affordable option — lựa chọn vừa túi tiền', 'reasonably affordable — khá phải chăng'],
                  synonyms: ['inexpensive', 'reasonably priced', 'economical'], antonyms: ['expensive', 'unaffordable'],
                  family: ['afford · verb · có khả năng chi trả', 'affordability · noun · khả năng chi trả', 'affordably · adverb · với mức giá phải chăng'],
                  mistake: ['affordable for everyone to buy it', 'affordable for everyone', 'Avoid the unnecessary object it after an affordable phrase.'],
                  quiz: {
                    options: ['nắm bắt, kiểm soát tốt, theo sát', 'bền; lâu hỏng', 'sáng kiến, chương trình', 'có giá phải chăng; vừa túi tiền'],
                    correctIndex: 3
                  },
                  typing: {
                    before: 'The company offers',
                    after: 'insurance plans for small businesses.',
                    translation: 'Công ty cung cấp các gói bảo hiểm có giá phải chăng cho doanh nghiệp nhỏ.'
                  },
                  tip: 'Affordable = can afford: thứ bạn can afford thì là affordable.', tags: ['#business', '#luna-vocab-v1', '#shopping', '#toeic']
                },
                {
                  word: 'as needed', learned: true, meaning: 'khi cần thiết', type: 'PHRASE', us: '/əz ˈniːdɪd/', uk: '/əz ˈniːdɪd/',
                  definition: 'Whenever it is necessary or useful.',
                  examples: [
                    ['The technician will replace parts as needed.', 'Kỹ thuật viên sẽ thay linh kiện khi cần thiết.'],
                    ['Additional chairs can be provided as needed for large meetings.', 'Có thể cung cấp thêm ghế khi cần cho các cuộc họp đông người.']
                  ],
                  collocations: ['adjust the schedule as needed — điều chỉnh lịch trình khi cần', 'provide assistance as needed — cung cấp hỗ trợ khi cần', 'move furniture as needed — di chuyển đồ đạc khi cần'],
                  synonyms: ['when necessary', 'if required', 'as required'], antonyms: ['regularly', 'regardless of need'],
                  family: ['need · verb · cần', 'need · noun · nhu cầu', 'needed · adjective · cần thiết'],
                  mistake: ['as need', 'as needed', 'Needed is the past participle used in this fixed expression.'],
                  quiz: { options: ['khi cần thiết', 'thường xuyên', 'không phụ thuộc nhu cầu', 'theo lịch cố định'], correctIndex: 0 },
                  typing: { before: 'The technician will replace parts', after: '.', translation: 'Kỹ thuật viên sẽ thay linh kiện khi cần thiết.' },
                  tip: 'As needed = as it is needed: làm khi có nhu cầu, không nhất thiết làm thường xuyên.',
                  tags: ['#business', '#luna-vocab-v1', '#office', '#toeic']
                },
                { word: 'install', learned: true, meaning: 'cài đặt; lắp đặt', type: 'VERB', us: '/ɪnˈstɔːl/', uk: '/ɪnˈstɔːl/', typing: { before: 'The technician will', after: 'the software tomorrow.', translation: 'Kỹ thuật viên sẽ cài đặt phần mềm vào ngày mai.' } },
                { word: 'compatible', learned: true, meaning: 'tương thích', type: 'ADJECTIVE', us: '/kəmˈpætəbəl/', uk: '/kəmˈpætəbəl/', typing: { before: 'This printer is', after: 'with your computer.', translation: 'Máy in này tương thích với máy tính của bạn.' } },
                { word: 'wireless', meaning: 'không dây', type: 'ADJECTIVE', us: '/ˈwaɪərləs/', uk: '/ˈwaɪələs/', typing: { before: 'The office uses a', after: 'network.', translation: 'Văn phòng sử dụng mạng không dây.' } },
                { word: 'equipment', meaning: 'thiết bị; dụng cụ', type: 'NOUN', us: '/ɪˈkwɪpmənt/', uk: '/ɪˈkwɪpmənt/', typing: { before: 'The new', after: 'arrived this morning.', translation: 'Thiết bị mới đã được giao vào sáng nay.' } },
                { word: 'update', meaning: 'cập nhật', type: 'VERB', us: '/ʌpˈdeɪt/', uk: '/ʌpˈdeɪt/', typing: { before: 'Please', after: 'the office software today.', translation: 'Vui lòng cập nhật phần mềm văn phòng hôm nay.' } },
                { word: 'efficient', meaning: 'hiệu quả', type: 'ADJECTIVE', us: '/ɪˈfɪʃənt/', uk: '/ɪˈfɪʃənt/', typing: { before: 'The new system is more', after: 'than the old one.', translation: 'Hệ thống mới hiệu quả hơn hệ thống cũ.' } }
              ]
            };
            let lessonWords = [];
            let lessonIndex = 0;
            let lessonOpener = null;
            let lessonIsFlipped = false;
            let lessonLessonUnlocked = false;
            let lessonQuizUnlocked = false;
            let lessonQuizAnswer = null;
            let lessonQuizAutoNextTimer = null;
            let lessonTypingUnlocked = false;
            let lessonTypingValue = '';
            let lessonTypingResult = null;
            let lessonTypingWrongCount = 0;
            let lessonTypingHintLevel = 0;
            let lessonTypingHintUnlocked = false;
            let lessonTypingUsedHint = false;
            let lessonTypingIdleTimer = null;
            let lessonTypingScrambleLetters = [];
            let lessonAudioCtx = null;
            let lessonReviewUnlocked = false;
            let lessonFastExpanded = true;
            let reviewSession = false;
            let continueSession = false;
            let completedSetSession = false;
            let reviewQuizResults = new Map();
            let reviewRatings = new Map();
            let reviewCompletedWords = new Set();
            let currentPrimaryDefinition = '';
            let currentPrimaryRemainingExamples = [];
            let currentPrimaryCollocations = [];
            let currentPrimarySynonyms = [];
            let currentPrimaryAntonyms = [];

            function isWordSkipped(item) {
              if (!item) return false;
              let skipped = false;
              try { skipped = localStorage.getItem(`vocab-skipped:${item.word}`) === 'true'; } catch { /* Continue with page data when storage is unavailable. */ }
              return Boolean(item.skipped || skipped);
            }

            function getWordRating(item) {
              if (!item) return null;
              let rating = item.rating || null;
              try { rating = localStorage.getItem(`vocab-rating:${item.word}`) || rating; } catch { /* Continue with page data when storage is unavailable. */ }
              return rating;
            }

            function isWordLearned(item) {
              if (!item) return false;
              if (isWordSkipped(item)) return true;
              const rating = getWordRating(item);
              if (rating === 'again') return false;
              return Boolean(item.learned || rating);
            }

            function isWordCompletedOrLearned(item) {
              if (!item) return false;
              if (isWordSkipped(item)) return true;
              const rating = getWordRating(item);
              if (rating === 'again') return false;
              return Boolean(item.learned || rating);
            }

            function updateCardProgress() {
              cards.forEach((card) => {
                const title = card.dataset.title;
                const words = lessonWordSets[title];
                if (!words || !words.length) return;
                const learnedCount = words.filter(isWordCompletedOrLearned).length;
                const totalCount = words.length;
                const percent = Math.round((learnedCount / totalCount) * 100);

                card.dataset.learned = learnedCount > 0 ? 'true' : 'false';

                // Cập nhật số từ (ví dụ: 1/12 từ)
                const countBadges = card.querySelectorAll('.vocab-card-count, .vocab-card-count-mobile, div:last-child > span');
                countBadges.forEach((countBadge) => {
                  const icon = countBadge.querySelector('i, svg');
                  countBadge.innerHTML = '';
                  if (icon) countBadge.appendChild(icon);
                  countBadge.append(`${learnedCount}/${totalCount} từ`);
                });

                // Cập nhật % text (8%)
                const percentSpan = card.querySelector('.vocab-card-percent') || card.querySelector('div:nth-child(2) > span:last-child');
                if (percentSpan) {
                  percentSpan.textContent = `${percent}%`;
                }

                // Cập nhật thanh tiến độ
                const progressBars = card.querySelectorAll('.vocab-card-progressbar, [role="progressbar"] > div, div:nth-child(3) > div');
                progressBars.forEach((progressBar) => {
                  progressBar.style.width = `${percent}%`;
                });

                // Cập nhật badge góc trên bên phải: 100% -> "Xong", 0% -> "Mới", chưa xong (>0% & <100%) -> "Đang học"
                const topBadge = card.querySelector('.vocab-card-status') || card.querySelector('div:first-child > span:last-child');
                if (topBadge) {
                  topBadge.style.display = '';
                  if (percent === 100) {
                    topBadge.className = 'shrink-0 vocab-card-status';
                    topBadge.innerHTML = '<span class="inline-flex items-center border px-2.5 py-0.5 transition-colors [&_svg]:size-3 gap-1 rounded-full border-transparent bg-success/10 text-xs font-bold text-success"><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-check size-3" aria-hidden="true"><path d="M20 6 9 17l-5-5"></path></svg>Xong</span>';
                  } else if (percent === 0) {
                    topBadge.className = 'shrink-0 vocab-card-status';
                    topBadge.innerHTML = '<span class="inline-flex items-center gap-1 border px-2.5 py-0.5 transition-colors [&_svg]:size-3 rounded-full border-transparent bg-muted text-xs font-bold text-muted-foreground">Mới</span>';
                  } else {
                    topBadge.className = 'shrink-0 vocab-card-status';
                    topBadge.innerHTML = '<span class="inline-flex items-center gap-1 border px-2.5 py-0.5 transition-colors [&_svg]:size-3 rounded-full border-transparent bg-amber-500/15 text-xs font-bold text-amber-600 dark:text-amber-400"><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-loader-2 size-3" aria-hidden="true"><path d="M21 12a9 9 0 1 1-6.219-8.56"></path></svg>Đang học</span>';
                  }
                }

                // Cập nhật nút Học tiếp / Học bài
                const studyBtn = card.querySelector('.study-set');
                if (studyBtn) {
                  const isContinue = learnedCount > 0 && percent < 100;
                  studyBtn.innerHTML = `${isContinue ? 'Học tiếp' : 'Học bài'} <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-arrow-right size-3.5"><path d="M5 12h14"></path><path d="m12 5 7 7-7 7"></path></svg>`;
                }
              });

              // Cập nhật thanh tiến độ tổng và thông số toàn trang: Đã học, Đang học, Đã thuộc
              updateGlobalVocabStats();
            }

            function updateGlobalVocabStats() {
              if (Object.keys(lessonWordSets).length === 0) return;

              const learnedEl = main.querySelector('#vocabStatLearned');
              const progressBar = main.querySelector('#vocabGlobalProgressBar');
              const totalMatch = learnedEl?.textContent.match(/\d+\s*\/\s*(\d+)/);
              const totalSystemWords = totalMatch ? Number(totalMatch[1]) || 4514 : 4514;

              let totalLearned = 0;
              cards.forEach((card) => {
                const badgeText = card.querySelector('.vocab-card-count')?.textContent || card.querySelector('div:last-child > span')?.textContent || '';
                const m = badgeText.match(/(\d+)\s*\/\s*\d+/);
                if (m) totalLearned += Number(m[1]) || 0;
              });

              const globalPercent = Math.min(100, Math.round((totalLearned / totalSystemWords) * 100 * 10) / 10);

              if (learnedEl) learnedEl.textContent = `${totalLearned}/${totalSystemWords} từ`;
              if (progressBar) {
                const displayWidth = totalLearned > 0 ? Math.max(1, globalPercent) : 0;
                progressBar.style.width = `${displayWidth}%`;
              }
            }

            function getLearnedReviewWords() {
              const words = [];
              const seen = new Set();
              Object.entries(lessonWordSets).forEach(([setTitle, items]) => {
                items.forEach((item) => {
                  if (!isWordLearned(item)) return;
                  if (seen.has(item.word.toLocaleLowerCase())) return;
                  seen.add(item.word.toLocaleLowerCase());
                  words.push({ ...item, setTitle });
                });
              });
              return words;
            }

            function getNextTopicCard() {
              const firstIncomplete = cards.find((card) => {
                const words = lessonWordSets[card.dataset.title];
                if (words && words.length > 0) {
                  return !words.every(isWordLearned);
                }
                return !card.textContent.includes('100%');
              });
              return firstIncomplete || cards[0] || null;
            }

            function refreshReviewAvailability() {
              const words = getLearnedReviewWords();
              if (words.length > 0) {
                reviewStartButton.disabled = false;
                reviewDueSummary.textContent = `${words.length} từ đã học sẵn sàng ôn`;
              }
              const nextCard = getNextTopicCard();
              const nextTopicText = main.querySelector('#learnNextTopicText');
              const startLearnNewBtn = main.querySelector('#startLearnNewButton');
              if (nextCard && nextTopicText) {
                nextTopicText.textContent = `Tiếp theo: ${nextCard.dataset.title}`;
              }
              if (nextCard && startLearnNewBtn) {
                const cardWords = lessonWordSets[nextCard.dataset.title] || [];
                const hasSomeLearned = cardWords.some(isWordLearned) || nextCard.querySelector('.study-set')?.textContent.includes('Học tiếp');
                startLearnNewBtn.textContent = hasSomeLearned ? 'Học tiếp' : 'Học bài';
              }
            }

            function isCurrentWordDone() {
              const item = lessonWords[lessonIndex];
              return !reviewSession && (completedSetSession || isWordLearned(item));
            }

            let reviewWordItemsDelegated = false;
            const reviewWordCheckSvg = '<svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" class="review-word-list-check shrink-0 ml-auto" aria-hidden="true"><polyline points="20 6 9 17 4 12"></polyline></svg>';
            const reviewWordAgainSvg = '<svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="review-word-list-again shrink-0 ml-auto" aria-hidden="true"><path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"></path><path d="M3 3v5h5"></path></svg>';
            const reviewWordSkipSvg = '<svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" class="review-word-list-skip shrink-0 ml-auto" aria-hidden="true"><line x1="5" y1="12" x2="19" y2="12"></line></svg>';

            function updateReviewWordList() {
              reviewWordCount.textContent = String(lessonWords.length);

              if (!reviewWordItemsDelegated && reviewWordItems) {
                reviewWordItems.addEventListener('click', (e) => {
                  const btn = e.target.closest('button[data-word-index]');
                  if (!btn) return;
                  const index = parseInt(btn.dataset.wordIndex, 10);
                  if (isNaN(index)) return;
                  lessonIndex = index;
                  renderLessonWord();
                  updateReviewWordList();
                });
                reviewWordItemsDelegated = true;
              }

              const frag = document.createDocumentFragment();
              lessonWords.forEach((item, index) => {
                const row = document.createElement('li');
                const button = document.createElement('button');
                button.type = 'button';
                button.dataset.wordIndex = index;
                button.title = item.word;
                const isCurrent = index === lessonIndex;

                if (isCurrent) {
                  button.setAttribute('aria-current', 'step');
                  button.className = 'flex min-h-touch w-full min-w-0 items-center gap-2.5 rounded-xl border px-2.5 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-skill-vocabulary/40 disabled:cursor-progress xl:min-h-10 border-skill-vocabulary/30 bg-[#fdf2f8]';
                } else {
                  button.removeAttribute('aria-current');
                  button.className = 'flex min-h-touch w-full min-w-0 items-center gap-2.5 rounded-xl border px-2.5 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-skill-vocabulary/40 disabled:cursor-progress xl:min-h-10 border-transparent enabled:hover:bg-muted/60';
                }

                const number = document.createElement('span');
                number.className = isCurrent
                  ? 'flex size-6 shrink-0 items-center justify-center rounded-full text-xs tabular-nums bg-skill-vocabulary font-bold text-white'
                  : 'flex size-6 shrink-0 items-center justify-center rounded-full text-xs tabular-nums font-semibold text-muted-foreground';
                number.textContent = String(index + 1);
                if (isCurrent) {
                  number.style.color = '#ffffff';
                  number.style.backgroundColor = '#c026d3';
                } else {
                  number.style.color = '#64748b';
                  number.style.backgroundColor = 'transparent';
                }

                const word = document.createElement('span');
                word.setAttribute('lang', 'en');
                word.className = isCurrent
                  ? 'min-w-0 flex-1 truncate font-display text-sm text-foreground font-extrabold'
                  : 'min-w-0 flex-1 truncate font-display text-sm text-foreground font-bold';
                word.textContent = item.word;

                const iconSpan = document.createElement('span');
                iconSpan.className = 'flex size-4 shrink-0 items-center justify-center';

                const srOnly = document.createElement('span');
                srOnly.className = 'sr-only';

                const rating = getWordRating(item);
                const showSkip = !reviewSession && isWordSkipped(item);
                const showAgain = rating === 'again' && (reviewSession ? reviewCompletedWords.has(item.word) : true);
                const showCheck = reviewSession
                  ? (!showAgain && reviewCompletedWords.has(item.word))
                  : (!showSkip && !showAgain && (completedSetSession || isWordLearned(item)));

                if (showCheck) {
                  iconSpan.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.75" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-check size-4 text-correct" aria-hidden="true"><path d="M20 6 9 17l-5-5"></path></svg>';
                  srOnly.textContent = 'đã học';
                } else if (showAgain) {
                  iconSpan.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.75" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-rotate-ccw size-4 text-destructive" aria-hidden="true"><path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"></path><path d="M3 3v5h5"></path></svg>';
                  srOnly.textContent = 'học lại';
                } else if (showSkip) {
                  iconSpan.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.75" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-minus size-4 text-muted-foreground" aria-hidden="true"><line x1="5" y1="12" x2="19" y2="12"></line></svg>';
                  srOnly.textContent = 'bỏ qua';
                } else {
                  srOnly.textContent = isCurrent ? 'đang xem' : 'chưa làm';
                }

                button.append(number, word, iconSpan, srOnly);
                row.append(button);
                frag.appendChild(row);
              });
              reviewWordItems.replaceChildren(frag);
            }

            function syncReviewLayout() {
              const wordDone = isCurrentWordDone();
              lessonView.dataset.review = String(reviewSession);
              lessonView.dataset.completed = String(wordDone);
              reviewWordList.hidden = false;
              lessonFlipButton.innerHTML = reviewSession
                ? '<i data-lucide="circle-check" class="mr-2" aria-hidden="true"></i>Kiểm tra'
                : '<i data-lucide="refresh-cw" class="mr-2" aria-hidden="true"></i>Lật thẻ';
              if (!reviewSession) {
                lessonModeLabel.textContent = 'Học từ mới';
              }
              const quickCheckBtn = main.querySelector('#lessonQuickCheck');
              if (quickCheckBtn) {
                quickCheckBtn.innerHTML = wordDone
                  ? 'Tiếp'
                  : '<i data-lucide="circle-check" class="mr-2" aria-hidden="true"></i>Kiểm tra nhanh';
              }
              lessonTabs.forEach((tab) => {
                const mode = tab.dataset.lessonMode;
                if (reviewSession) tab.hidden = !['term', 'quiz', 'review'].includes(mode);
                else tab.hidden = lessonFastMode.checked && !['term', 'lesson'].includes(mode);
                if (reviewSession) {
                  if (mode === 'term') tab.textContent = 'Từ';
                  if (mode === 'review') tab.textContent = 'Đánh giá';
                }
              });
              updateReviewWordList();
            }

            function updateFastModeUI() {
              const fastMode = lessonFastMode.checked;
              const lessonMode = lessonCard.dataset.mode === 'lesson';
              const wordDone = isCurrentWordDone();
              lessonView.dataset.fast = String(fastMode);
              lessonCard.dataset.fast = String(fastMode);
              lessonTabsBar.dataset.fast = String(fastMode);
              lessonTabsBar.dataset.learned = 'false';
              lessonTabs.forEach((tab) => {
                const mode = tab.dataset.lessonMode;
                tab.hidden = fastMode && !['term', 'lesson'].includes(mode);
                const unlocked = {
                  term: true,
                  lesson: wordDone || lessonLessonUnlocked,
                  quiz: !fastMode && lessonQuizUnlocked,
                  typing: !fastMode && lessonTypingUnlocked,
                  review: !fastMode && lessonReviewUnlocked
                };
                tab.disabled = !unlocked[mode];
              });
              lessonFastSummary.hidden = !fastMode || !lessonMode;
              const fastNextEl = main.querySelector('#lessonFastNext');
              const fastRatingEl = main.querySelector('#lessonFastRating');
              if (fastNextEl) fastNextEl.hidden = !wordDone;
              if (fastRatingEl) fastRatingEl.hidden = wordDone;
              lessonFastToggle.hidden = !fastMode || !lessonMode;
              lessonFullDetails.hidden = fastMode && lessonMode && !lessonFastExpanded;
              main.querySelector('#lessonQuickCheck').hidden = fastMode;
              lessonFastToggle.setAttribute('aria-expanded', String(lessonFastExpanded));
              lessonFastToggle.innerHTML = lessonFastExpanded
                ? '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-chevron-up mr-2 inline-block" aria-hidden="true"><path d="m18 15-6-6-6 6"/></svg>Thu gọn'
                : '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-chevron-down mr-2 inline-block" aria-hidden="true"><path d="m6 9 6 6 6-6"/></svg>Xem thêm';
            }

            function clearLessonStepTimers() {
              if (lessonQuizAutoNextTimer) {
                window.clearTimeout(lessonQuizAutoNextTimer);
                lessonQuizAutoNextTimer = null;
              }
              if (lessonTypingIdleTimer) {
                window.clearTimeout(lessonTypingIdleTimer);
                lessonTypingIdleTimer = null;
              }
            }

            function playQuizTone(isCorrect) {
              try {
                const AudioContextClass = window.AudioContext || window.webkitAudioContext;
                if (!AudioContextClass) return;
                if (!lessonAudioCtx) lessonAudioCtx = new AudioContextClass();
                if (lessonAudioCtx.state === 'suspended') lessonAudioCtx.resume();
                const now = lessonAudioCtx.currentTime;
                const osc = lessonAudioCtx.createOscillator();
                const gain = lessonAudioCtx.createGain();
                osc.type = 'sine';
                if (isCorrect) {
                  osc.frequency.setValueAtTime(587.33, now);
                  osc.frequency.exponentialRampToValueAtTime(880, now + 0.09);
                } else {
                  osc.frequency.setValueAtTime(240, now);
                  osc.frequency.exponentialRampToValueAtTime(180, now + 0.12);
                }
                gain.gain.setValueAtTime(0.06, now);
                gain.gain.exponentialRampToValueAtTime(0.001, now + 0.16);
                osc.connect(gain);
                gain.connect(lessonAudioCtx.destination);
                osc.start(now);
                osc.stop(now + 0.17);
              } catch { /* Ignore Web Audio errors when blocked. */ }
            }

            function getTypingTargetAnswer(item) {
              return String(item?.typing?.answer || item?.word || '').trim();
            }

            function normalizeTypingAnswer(value) {
              return String(value ?? '')
                .trim()
                .toLocaleLowerCase()
                .replace(/^[\s.,!?;:'"()[\]]+|[\s.,!?;:'"()[\]]+$/g, '')
                .replace(/\s+/g, ' ');
            }

            function buildTypingSlotPlaceholder(target) {
              const clean = String(target || '').trim();
              if (!clean) return '...';
              return clean.split(/\s+/).map((token) => {
                if (token.length <= 2) return '_'.repeat(token.length);
                const middle = Array(token.length - 2).fill('_').join(' ');
                return `${token[0]} ${middle} ${token[token.length - 1]}`;
              }).join('   ');
            }

            function shuffleLettersForTyping(target) {
              const chars = String(target || '').replace(/\s+/g, '').split('');
              for (let i = chars.length - 1; i > 0; i -= 1) {
                const j = Math.floor(Math.random() * (i + 1));
                [chars[i], chars[j]] = [chars[j], chars[i]];
              }
              return chars;
            }

            function updateScrambleTilesState() {
              const tilesContainer = main.querySelector('#lessonTypingScrambleTiles');
              if (!tilesContainer) return;
              const typedChars = String(lessonTypingValue || '').replace(/\s+/g, '').toLocaleLowerCase().split('');
              const remainingCounts = new Map();
              typedChars.forEach((ch) => remainingCounts.set(ch, (remainingCounts.get(ch) || 0) + 1));
              tilesContainer.querySelectorAll('.lesson-scramble-tile').forEach((btn) => {
                const ch = (btn.dataset.char || '').toLocaleLowerCase();
                const count = remainingCounts.get(ch) || 0;
                const used = count > 0;
                if (used) remainingCounts.set(ch, count - 1);
                btn.classList.toggle('is-used', used);
                btn.disabled = lessonTypingResult !== null || used;
              });
            }

            function renderTypingScramble(item) {
              const wrap = main.querySelector('#lessonTypingScramble');
              const tilesContainer = main.querySelector('#lessonTypingScrambleTiles');
              if (!wrap || !tilesContainer) return;
              const target = getTypingTargetAnswer(item);
              if (!target) {
                wrap.hidden = true;
                tilesContainer.replaceChildren();
                return;
              }
              if (!lessonTypingScrambleLetters.length) {
                lessonTypingScrambleLetters = shuffleLettersForTyping(target);
              }
              wrap.hidden = false;
              tilesContainer.replaceChildren(...lessonTypingScrambleLetters.map((ch) => {
                const btn = document.createElement('button');
                btn.type = 'button';
                btn.className = 'lesson-scramble-tile';
                btn.dataset.char = ch;
                btn.textContent = ch;
                btn.addEventListener('click', () => {
                  if (lessonTypingResult !== null) return;
                  const input = main.querySelector('#lessonTypingInput');
                  if (!input) return;
                  lessonTypingValue = `${input.value}${ch}`;
                  input.value = lessonTypingValue;
                  input.classList.remove('is-wrong');
                  updateScrambleTilesState();
                  resetTypingIdleTimer();
                  input.focus({ preventScroll: true });
                });
                return btn;
              }));
              updateScrambleTilesState();
            }

            function updateTypingHintUI() {
              const hintBtn = main.querySelector('#lessonTypingHint');
              const hintText = main.querySelector('#lessonTypingHintText');
              const revealBtn = main.querySelector('#lessonTypingReveal');
              const ghost = main.querySelector('#lessonTypingGhost');
              const item = lessonWords[lessonIndex];
              const target = getTypingTargetAnswer(item);

              if (hintBtn && hintText) {
                const exhausted = lessonTypingHintLevel >= 3;
                hintBtn.disabled = lessonTypingResult !== null || !lessonTypingHintUnlocked || exhausted;
                hintBtn.classList.toggle('is-pulse', lessonTypingHintUnlocked && !exhausted && lessonTypingResult === null);
                if (exhausted) {
                  hintText.textContent = 'Đã dùng hết 3 gợi ý';
                } else if (!lessonTypingHintUnlocked) {
                  hintText.textContent = 'Gợi ý (mở sau 5s hoặc 1 lần sai)';
                } else {
                  const nextStep = lessonTypingHintLevel + 1;
                  const labels = ['Hiện chữ đầu', 'Nghe phát âm', 'Hiện chữ mờ'];
                  hintText.textContent = `Gợi ý ${nextStep}/3: ${labels[lessonTypingHintLevel]} (Tab)`;
                }
              }

              if (ghost) {
                ghost.hidden = lessonTypingHintLevel < 3 || lessonTypingResult !== null;
                ghost.textContent = target;
              }

              if (revealBtn) {
                revealBtn.hidden = lessonTypingResult !== null || (lessonTypingWrongCount === 0 && lessonTypingHintLevel < 3);
              }
            }

            function resetTypingIdleTimer() {
              if (lessonTypingIdleTimer) {
                window.clearTimeout(lessonTypingIdleTimer);
                lessonTypingIdleTimer = null;
              }
              if (lessonTypingResult !== null || lessonTypingHintUnlocked || lessonCard.dataset.mode !== 'typing') return;
              lessonTypingIdleTimer = window.setTimeout(() => {
                lessonTypingIdleTimer = null;
                if (lessonCard.dataset.mode === 'typing' && lessonTypingResult === null) {
                  lessonTypingHintUnlocked = true;
                  updateTypingHintUI();
                }
              }, 5000);
            }

            function triggerTypingHint() {
              if (lessonTypingResult !== null || !lessonTypingHintUnlocked || lessonTypingHintLevel >= 3) return;
              const item = lessonWords[lessonIndex];
              if (!item) return;
              const target = getTypingTargetAnswer(item);
              lessonTypingHintLevel += 1;
              lessonTypingUsedHint = true;

              const input = main.querySelector('#lessonTypingInput');
              if (lessonTypingHintLevel === 1 && target && input) {
                if (!input.value.trim().toLocaleLowerCase().startsWith(target[0].toLocaleLowerCase())) {
                  input.value = target[0];
                  lessonTypingValue = input.value;
                }
                input.classList.remove('is-wrong');
                updateScrambleTilesState();
                input.focus({ preventScroll: true });
                lessonLiveMessage.textContent = `Gợi ý 1: Chữ cái đầu tiên là "${target[0]}".`;
              } else if (lessonTypingHintLevel === 2) {
                speakLessonWord('en-US');
                lessonLiveMessage.textContent = 'Gợi ý 2: Đã phát âm thanh của từ.';
              } else if (lessonTypingHintLevel === 3) {
                lessonLiveMessage.textContent = 'Gợi ý 3: Đã hiển thị chữ mờ của từ cần điền.';
              }
              updateTypingHintUI();
            }

            function setLessonMode(mode) {
              const isLesson = mode === 'lesson';
              const isQuiz = mode === 'quiz';
              const isTyping = mode === 'typing';
              const isReview = mode === 'review';
              clearLessonStepTimers();
              lessonCard.dataset.mode = mode;
              lessonCardContent.hidden = isQuiz || isTyping || isReview;
              lessonDetail.hidden = !isLesson;
              lessonQuiz.hidden = !isQuiz;
              lessonTyping.hidden = !isTyping;
              lessonReview.hidden = !isReview;
              lessonTabs.forEach((tab) => tab.setAttribute('aria-selected', String(tab.dataset.lessonMode === mode)));
              if (isQuiz) renderLessonQuiz();
              if (isTyping) {
                renderLessonTyping();
                main.querySelector('#lessonTypingInput').focus({ preventScroll: true });
                resetTypingIdleTimer();
              }
              if (isReview) renderLessonReview();
              updateFastModeUI();
              syncReviewLayout();
              updateLessonProgressBar();
            }

            function selectQuizOption(index) {
              if (lessonQuizAnswer !== null) return;
              const item = lessonWords[lessonIndex];
              if (!item) return;
              const quiz = item.quiz || {
                options: ['to install or use', 'long-lasting', 'a new idea or plan', item.meaning],
                correctIndex: 3
              };
              lessonQuizAnswer = index;
              const isCorrect = index === quiz.correctIndex;
              if (index >= 0) playQuizTone(isCorrect);
              renderLessonQuiz();
              if (isCorrect) {
                if (lessonQuizAutoNextTimer) window.clearTimeout(lessonQuizAutoNextTimer);
                lessonQuizAutoNextTimer = window.setTimeout(() => {
                  lessonQuizAutoNextTimer = null;
                  advanceQuiz();
                }, 700);
              }
            }

            function renderLessonQuiz() {
              const item = lessonWords[lessonIndex];
              const quiz = item.quiz || {
                options: ['to install or use', 'long-lasting', 'a new idea or plan', item.meaning],
                correctIndex: 3
              };
              main.querySelector('#lessonQuizQuestion').textContent = `Nghĩa đúng của "${item.word}" là gì?`;
              const optionList = main.querySelector('#lessonQuizOptions');
              optionList.replaceChildren(...quiz.options.map((option, index) => {
                const button = document.createElement('button');
                button.className = 'lesson-quiz-option';
                button.type = 'button';
                button.disabled = lessonQuizAnswer !== null;
                const letter = document.createElement('span');
                letter.className = 'lesson-quiz-letter';
                letter.textContent = String.fromCharCode(65 + index);
                const text = document.createElement('span');
                text.textContent = option;
                button.append(letter, text);
                if (lessonQuizAnswer !== null) {
                  if (index === quiz.correctIndex) {
                    button.classList.add('is-correct');
                    letter.innerHTML = '<i data-lucide="check" aria-hidden="true"></i>';
                  } else if (index === lessonQuizAnswer) {
                    button.classList.add('is-wrong');
                    letter.innerHTML = '<i data-lucide="x" aria-hidden="true"></i>';
                  } else {
                    button.classList.add('is-muted');
                  }
                }
                button.addEventListener('click', () => selectQuizOption(index));
                return button;
              }));
              const hasAnswered = lessonQuizAnswer !== null;
              const isCorrect = lessonQuizAnswer === quiz.correctIndex;
              const isForgot = lessonQuizAnswer === -1;
              const feedback = main.querySelector('#lessonQuizFeedback');
              feedback.hidden = !hasAnswered;
              feedback.className = `lesson-quiz-feedback ${hasAnswered ? (isCorrect ? 'is-right' : 'is-wrong') : ''}`.trim();
              feedback.textContent = !hasAnswered
                ? ''
                : isCorrect
                  ? 'Chính xác! Đang chuyển bước tiếp theo...'
                  : isForgot
                    ? 'Đã đánh dấu chưa nhớ. Hãy xem nghĩa đúng được tô xanh bên trên rồi bấm Tiếp tục.'
                    : 'Chưa đúng. Đáp án đúng đã được tô xanh — hãy đọc lại rồi bấm Tiếp tục (Enter).';
              main.querySelector('#lessonQuizForgot').hidden = hasAnswered;
              const nextButton = main.querySelector('#lessonQuizNext');
              nextButton.hidden = !hasAnswered;
              nextButton.innerHTML = reviewSession
                ? 'Xem đánh giá <span class="lesson-shortcut-pill">Enter</span>'
                : 'Tiếp tục <span class="lesson-shortcut-pill">Enter</span>';
            }

            function renderLessonTyping() {
              const item = lessonWords[lessonIndex];
              const typing = item.typing || {
                before: 'Please',
                after: 'the office equipment before the meeting.',
                answer: item.word,
                translation: `Vui lòng ${item.meaning} thiết bị văn phòng trước cuộc họp.`
              };
              const target = getTypingTargetAnswer(item);
              const input = main.querySelector('#lessonTypingInput');
              main.querySelector('#lessonTypingBefore').textContent = typing.before ? `${typing.before} ` : '';
              main.querySelector('#lessonTypingAfter').textContent = typing.after ? ` ${typing.after}` : '';
              main.querySelector('#lessonTypingTranslation').textContent = typing.translation;
              input.value = lessonTypingValue;
              input.placeholder = buildTypingSlotPlaceholder(target);
              const charWidth = Math.min(340, Math.max(170, target.length * 16 + 44));
              input.style.width = `min(${charWidth}px, 100%)`;
              input.disabled = lessonTypingResult !== null;
              input.classList.toggle('is-correct', lessonTypingResult === true);
              input.classList.toggle('is-wrong', lessonTypingResult === false || (lessonTypingResult === null && lessonTypingWrongCount > 0));
              const feedback = main.querySelector('#lessonTypingFeedback');
              const showWrongTryAgain = lessonTypingResult === null && lessonTypingWrongCount > 0;
              feedback.hidden = lessonTypingResult === null && !showWrongTryAgain;
              feedback.className = `lesson-typing-feedback ${
                lessonTypingResult === true ? 'is-correct' : (lessonTypingResult === false || showWrongTryAgain ? 'is-wrong' : '')
              }`.trim();
              if (lessonTypingResult === true) {
                feedback.textContent = lessonTypingUsedHint
                  ? 'Chính xác! (Bạn đã dùng gợi ý — từ này sẽ được ưu tiên Học lại ở bước Đánh giá.)'
                  : 'Chính xác! Bạn đã điền đúng từ.';
              } else if (lessonTypingResult === false) {
                feedback.textContent = `Đáp án đúng là “${target}”.`;
              } else if (showWrongTryAgain) {
                feedback.textContent = `Chưa đúng (lần ${lessonTypingWrongCount}). Hãy sửa lại hoặc nhấn Gợi ý (Tab).`;
              } else {
                feedback.textContent = '';
              }
              const submit = main.querySelector('#lessonTypingSubmit');
              submit.textContent = lessonTypingResult === null ? 'Kiểm tra' : 'Xem đánh giá';
              submit.classList.toggle('is-ready', lessonTypingResult !== null);
              renderTypingScramble(item);
              updateTypingHintUI();
            }

            function renderLessonReview() {
              const item = lessonWords[lessonIndex];
              const example = item.examples?.[0] || [`Please ${item.word} the office equipment before the meeting.`, `Vui lòng ${item.meaning} thiết bị văn phòng trước cuộc họp.`];
              const firstCollocation = item.collocations?.[0] || `${item.word} — ${item.meaning}`;
              const [collocation, collocationMeaning = ''] = firstCollocation.split(' — ');
              const quiz = item.quiz || { correctIndex: 3 };
              const quizCorrect = lessonQuizAnswer === quiz.correctIndex;
              const typingPassedCleanly = lessonTypingResult === true && !lessonTypingUsedHint;
              main.querySelector('#lessonReviewWord').textContent = item.word;
              main.querySelector('#lessonReviewUs').textContent = item.us;
              main.querySelector('#lessonReviewUk').textContent = item.uk;
              main.querySelector('#lessonReviewMeaning').textContent = item.meaning;
              main.querySelector('#lessonReviewDefinition').textContent = item.definition || item.meaning;
              main.querySelector('#lessonReviewExample').textContent = `“${example[0]}”`;
              main.querySelector('#lessonReviewTranslation').textContent = example[1];
              main.querySelector('#lessonReviewCollocation').textContent = collocation;
              main.querySelector('#lessonReviewCollocationMeaning').textContent = collocationMeaning;
              main.querySelector('#lessonReviewTip').textContent = item.tip || `Hãy đặt câu với “${item.word}” để ghi nhớ.`;
              if (reviewSession) {
                const currentQuizCorrect = reviewQuizResults.has(item.word) ? reviewQuizResults.get(item.word) : quizCorrect;
                main.querySelector('#lessonReviewQuizText').textContent = currentQuizCorrect ? 'Chính xác' : (lessonQuizAnswer === -1 ? 'Không nhớ' : 'Chưa đúng nghĩa');
                main.querySelector('#lessonReviewTypingResult').hidden = true;
              } else {
                main.querySelector('#lessonReviewTypingResult').hidden = false;
                main.querySelector('#lessonReviewQuizText').textContent = quizCorrect ? 'Chính xác' : (lessonQuizAnswer === -1 ? 'Không nhớ' : 'Chưa đúng nghĩa');
                main.querySelector('#lessonReviewTypingText').textContent = typingPassedCleanly
                  ? 'Chính xác'
                  : lessonTypingUsedHint
                    ? 'Đã dùng gợi ý (Cần học lại)'
                    : 'Chưa đúng từ';
              }
              main.querySelector('#lessonReviewQuizResult').classList.toggle('result-right', reviewSession ? reviewQuizResults.get(item.word) === true : quizCorrect);
              main.querySelector('#lessonReviewQuizResult').classList.toggle('result-wrong', reviewSession ? reviewQuizResults.get(item.word) === false : !quizCorrect);
              main.querySelector('#lessonReviewTypingResult').classList.toggle('result-right', typingPassedCleanly);
              main.querySelector('#lessonReviewTypingResult').classList.toggle('result-wrong', !typingPassedCleanly);

              const hintBanner = main.querySelector('#lessonReviewHintBanner');
              if (hintBanner) {
                hintBanner.hidden = !(!reviewSession && lessonTypingUsedHint);
              }
              if (!reviewSession && lessonTypingUsedHint) {
                item.rating = 'again';
                item.learned = false;
                try { localStorage.setItem(`vocab-rating:${item.word}`, 'again'); } catch { /* ignore */ }
                syncWordProgressToDb(item, false);
                refreshReviewAvailability();
                updateReviewWordList();
              }

              main.querySelectorAll('.lesson-review .lesson-rating-button').forEach((button) => {
                button.setAttribute('aria-pressed', String(localStorage.getItem(`vocab-rating:${item.word}`) === button.dataset.rating));
              });
            }

            function showLessonComplete() {
              if ('speechSynthesis' in window) window.speechSynthesis.cancel();
              const completePanel = main.querySelector('#lessonCompletePanel');
              if (!completePanel) {
                closeLesson();
                return;
              }
              let remembered = 0;
              let again = 0;
              let skipped = 0;
              lessonWords.forEach((item) => {
                if (isWordSkipped(item)) {
                  skipped += 1;
                } else {
                  const rating = getWordRating(item);
                  if (rating === 'again') {
                    again += 1;
                  } else if (rating || item.learned || completedSetSession) {
                    remembered += 1;
                  }
                }
              });
              const ratedTotal = remembered + again;
              const rateText = ratedTotal > 0 ? `${Math.round((remembered / ratedTotal) * 100)}%` : '—';
              main.querySelector('#lessonCompleteRemembered').textContent = String(remembered);
              main.querySelector('#lessonCompleteAgain').textContent = String(again);
              main.querySelector('#lessonCompleteSkipped').textContent = String(skipped);
              main.querySelector('#lessonCompleteRate').textContent = rateText;
              lessonView.dataset.finished = 'true';
              completePanel.hidden = false;
              const nextBtn = main.querySelector('#lessonCompleteNextTopicBtn');
              if (nextBtn) nextBtn.focus({ preventScroll: true });
            }

            function hideLessonComplete() {
              delete lessonView.dataset.finished;
              const completePanel = main.querySelector('#lessonCompletePanel');
              if (completePanel) completePanel.hidden = true;
            }

            function advanceLessonWord(mode) {
              clearLessonStepTimers();
              if (lessonIndex + 1 < lessonWords.length) {
                lessonIndex += 1;
                lessonQuizAnswer = null;
                lessonTypingUnlocked = false;
                lessonTypingValue = '';
                lessonTypingResult = null;
                lessonTypingWrongCount = 0;
                lessonTypingHintLevel = 0;
                lessonTypingHintUnlocked = false;
                lessonTypingUsedHint = false;
                lessonTypingScrambleLetters = [];
                lessonReviewUnlocked = false;
                renderLessonWord();
                if (!isCurrentWordDone() && mode) setLessonMode(mode);
              } else {
                const modeName = mode === 'quiz' ? 'Quiz' : mode === 'typing' ? 'Gõ' : 'học';
                lessonLiveMessage.textContent = `Đã hoàn thành phần ${modeName} của bộ từ ${lessonSetTitle.textContent}.`;
                showLessonComplete();
              }
            }

            function advanceQuiz() {
              clearLessonStepTimers();
              if (lessonQuizAnswer === null) return;
              if (reviewSession) {
                const item = lessonWords[lessonIndex];
                const quiz = item.quiz || { correctIndex: 3 };
                reviewQuizResults.set(item.word, lessonQuizAnswer === quiz.correctIndex);
                lessonReviewUnlocked = true;
                setLessonMode('review');
                lessonLiveMessage.textContent = 'Đã hoàn thành Quiz. Hãy xem tóm tắt và đánh giá mức nhớ của từ này.';
                updateReviewWordList();
                return;
              }
              lessonTypingUnlocked = true;
              setLessonMode('typing');
              lessonLiveMessage.textContent = 'Đã hoàn thành Quiz. Hãy gõ từ vào chỗ trống.';
            }

            function fillChips(container, values, type = '') {
              if (!container) return;
              const list = Array.isArray(values) ? values.filter(Boolean) : [];
              const row = container.closest('.lesson-detail-row');
              if (row) row.hidden = list.length === 0;
              container.replaceChildren(...list.map((value) => createFormattedChip(value, type)));
            }

            function renderLessonDetail(item) {
              const rawExamples = (Array.isArray(item.examples) && item.examples.length > 0)
                ? item.examples.map(([en, vi = '']) => [String(en || '').replace(/\[([^\[\]]+)\]/g, '$1'), vi])
                : [[`Please ${item.word} the office equipment before the meeting.`, `Vui lòng ${item.meaning} thiết bị văn phòng trước cuộc họp.`]];

              if (rawExamples.length < 2 && item.word) {
                const posLow = String(item.type || '').toLowerCase();
                const shortMean = String(item.meaning || item.word).split(/[,;]/)[0].trim() || item.word;
                const extraPair = posLow === 'verb'
                  ? [`All department heads were asked to ${item.word} the new procedure during the briefing.`, `Tất cả trưởng bộ phận được yêu cầu ${shortMean} quy trình mới trong buổi họp.`]
                  : posLow === 'adjective'
                    ? [`Our department issued a ${item.word} report for the quarterly review meeting.`, `Bộ phận của chúng tôi đã phát hành một báo cáo ${shortMean} cho cuộc họp đánh giá quý.`]
                    : posLow === 'adverb'
                      ? [`All staff members responded ${item.word} to the updated client guidelines.`, `Toàn bộ nhân viên đã phản hồi ${shortMean} trước hướng dẫn khách hàng mới.`]
                      : [`The company held a briefing on ${item.word} for all long-term clients.`, `Công ty đã tổ chức buổi phổ biến về ${shortMean} cho toàn bộ khách hàng lâu năm.`];
                if (!rawExamples.some(([en]) => en.toLowerCase() === extraPair[0].toLowerCase())) {
                  rawExamples.push(extraPair);
                }
              }

              const detail = {
                ...item,
                definition: item.definition || `${item.meaning}.`,
                examples: rawExamples,
                collocations: item.collocations || [],
                synonyms: item.synonyms || [],
                antonyms: item.antonyms || [],
                family: item.family || [],
                mistake: item.mistake || ['', '', ''],
                tip: item.tip || '',
                tags: item.tags || ['#toeic', '#vocabulary']
              };

              const sensesContainer = main.querySelector('#lessonSensesContainer');
              const senses = (Array.isArray(item.senses) && item.senses.length > 0)
                ? item.senses
                : [{
                    type: detail.type,
                    meaning: detail.meaning,
                    definition: detail.definition,
                    examples: detail.examples,
                    collocations: detail.collocations,
                    synonyms: detail.synonyms,
                    antonyms: detail.antonyms
                  }];

              // Nét nghĩa chính (Primary Sense) dùng cho Học nhanh
              const primarySense = senses[0] || {};
              const primaryType = (primarySense.type || detail.type || 'NOUN').toUpperCase();
              const primaryMeaning = primarySense.meaning || detail.meaning || '';
              const primaryDefinition = primarySense.definition || '';

              // Examples của nét nghĩa chính
              let primaryExamples = [];
              if (Array.isArray(primarySense.examples) && primarySense.examples.length > 0) {
                primaryExamples = primarySense.examples.map(ex => {
                  if (Array.isArray(ex)) return [String(ex[0] || '').replace(/\[([^\[\]]+)\]/g, '$1'), String(ex[1] || '')];
                  if (ex && typeof ex === 'object') return [String(ex.en || ex.En || '').replace(/\[([^\[\]]+)\]/g, '$1'), String(ex.vi || ex.Vi || '')];
                  return [String(ex || ''), ''];
                }).filter(([en]) => Boolean(en && en.trim()));
              }
              if (primaryExamples.length === 0) {
                primaryExamples = detail.examples;
              }

              // Lưu state cho Học Nhanh
              currentPrimaryDefinition = primaryDefinition;
              currentPrimaryRemainingExamples = primaryExamples.slice(1);
              currentPrimaryCollocations = (Array.isArray(primarySense.collocations) && primarySense.collocations.length > 0)
                ? primarySense.collocations
                : detail.collocations;
              currentPrimarySynonyms = (Array.isArray(primarySense.synonyms) && primarySense.synonyms.length > 0)
                ? primarySense.synonyms
                : detail.synonyms;
              currentPrimaryAntonyms = (Array.isArray(primarySense.antonyms) && primarySense.antonyms.length > 0)
                ? primarySense.antonyms
                : detail.antonyms;

              // 1. Loại từ & Nghĩa tiếng Việt của Nét nghĩa chính cho khung chính mặc định
              const fastTypeEl = main.querySelector('#lessonFastType');
              if (fastTypeEl) fastTypeEl.textContent = primaryType;
              const fastMeaningEl = main.querySelector('#lessonFastMeaning');
              if (fastMeaningEl) fastMeaningEl.textContent = primaryMeaning;

              // 2. Chỉ lấy 1 ví dụ đầu của nét nghĩa chính cho khung chính mặc định
              const fastExamplesContainer = main.querySelector('#lessonFastExamples');
              const firstExampleList = primaryExamples.slice(0, 1);
              if (fastExamplesContainer && firstExampleList.length > 0) {
                fastExamplesContainer.replaceChildren(
                  ...firstExampleList.map(([en, vi]) => createFormattedExampleCard(en, vi))
                );
              } else {
                const fastExample = firstExampleList[0] || ['', ''];
                const fastExEl = main.querySelector('#lessonFastExample');
                if (fastExEl) {
                  const cleanFastEn = String(fastExample[0] || '').replace(/^[“"']+|[”"']+$/g, '').trim();
                  fastExEl.textContent = cleanFastEn;
                  fastExEl.setAttribute('data-selection-translation', String(fastExample[1] || '').trim());
                }
                const fastTrEl = main.querySelector('#lessonFastTranslation');
                if (fastTrEl) fastTrEl.textContent = String(fastExample[1] || '').trim();
              }

              // 3. Chỉ lấy 1 cụm từ đi kèm đầu tiên cho khung chính mặc định
              const fastCollocsContainer = main.querySelector('#lessonFastCollocations');
              const fastCollRow = main.querySelector('#lessonFastCollocationRow');
              if (fastCollocsContainer) {
                const firstColloc = (Array.isArray(primarySense.collocations) && primarySense.collocations.length > 0)
                  ? primarySense.collocations.slice(0, 1)
                  : detail.collocations.slice(0, 1);
                if (firstColloc.length > 0) {
                  fillChips(fastCollocsContainer, firstColloc);
                  if (fastCollRow) fastCollRow.hidden = false;
                } else {
                  fastCollocsContainer.replaceChildren();
                  if (fastCollRow) fastCollRow.hidden = true;
                }
              }

              // Cập nhật trạng thái mở rộng/thu gọn của khung chi tiết
              updateFastModeUI();

              main.querySelector('#lessonFastTip').textContent = detail.tip || `Hãy đặt câu với “${item.word}” để ghi nhớ.`;

              // Render danh sách senses bên trong #lessonFullDetails:
              // Khung xem thêm bên dưới render Nét nghĩa chính (#1) với:
              // - Title (Loại từ + Nghĩa tiếng Việt)
              // - Định nghĩa tiếng Anh
              // - Các ví dụ CÒN LẠI (bỏ qua ví dụ 1 đã hiện ở khung trên)
              // - Cụm từ đi kèm
              // - Đồng nghĩa & Trái nghĩa
              // Sau đó render các Nét nghĩa còn lại (#2 trở đi) đầy đủ thông tin
              if (sensesContainer) {
                sensesContainer.replaceChildren(...senses.map((sense, idx) => {
                  const panel = document.createElement('article');
                  panel.className = 'space-y-3 rounded-2xl border border-skill-vocabulary/10 bg-card/90 p-4 shadow-sm lesson-detail-panel';
                  
                  // Title row (Loại từ badge + nghĩa tiếng Việt)
                  // Ở chế độ Học nhanh: Tuyệt đối KHÔNG hiển thị lại Loại từ và Nghĩa tiếng Việt ở nét nghĩa chính (đã có ở khung trên).
                  // Với nét nghĩa 2 trở đi: CHỈ hiển thị nếu có nghĩa tiếng Việt riêng biệt và KHÔNG trùng lặp với nghĩa chính ở khung trên.
                  const isFastModeActive = Boolean(lessonFastMode.checked);
                  const senseMeaningClean = String(sense.meaning || '').trim();
                  const primaryMeaningClean = String(primaryMeaning || detail.meaning || '').trim().toLowerCase();
                  const isMeaningDuplicate = !senseMeaningClean ||
                    senseMeaningClean.toLowerCase() === primaryMeaningClean ||
                    primaryMeaningClean.split(/[,;/]/).map(s => s.trim()).includes(senseMeaningClean.toLowerCase()) ||
                    primaryMeaningClean.startsWith(senseMeaningClean.toLowerCase()) ||
                    primaryMeaningClean.includes(senseMeaningClean.toLowerCase()) ||
                    senseMeaningClean.toLowerCase().includes(primaryMeaningClean);

                  const shouldShowTitleRow = !isFastModeActive || (idx > 0 && !isMeaningDuplicate);

                  if (shouldShowTitleRow && (senseMeaningClean || !isFastModeActive)) {
                    const titleRow = document.createElement('div');
                    titleRow.className = 'flex flex-wrap items-center gap-2 lesson-detail-title';
                    
                    const typeBadge = document.createElement('span');
                    typeBadge.className = 'inline-flex items-center gap-1 border px-2.5 py-0.5 text-xs font-bold transition-colors border-transparent bg-muted text-muted-foreground rounded-full uppercase tracking-wider lesson-detail-type';
                    typeBadge.textContent = (sense.type || detail.type || 'NOUN').toUpperCase();
                    
                    const meaningSpan = document.createElement('span');
                    meaningSpan.className = 'font-display text-lg font-bold leading-snug text-skill-vocabulary lesson-detail-meaning';
                    meaningSpan.textContent = senseMeaningClean || (isFastModeActive ? '' : (detail.meaning || ''));
                    
                    titleRow.append(typeBadge, meaningSpan);
                    panel.appendChild(titleRow);
                  }

                  // Định nghĩa tiếng Anh
                  const senseDef = sense.definition || (idx === 0 ? (detail.definition || item.definition || '') : '');
                  if (senseDef) {
                    const defP = document.createElement('p');
                    defP.className = 'text-sm leading-relaxed text-muted-foreground lesson-detail-definition';
                    defP.textContent = senseDef;
                    panel.appendChild(defP);
                  }

                  // Ví dụ:
                  // Nếu ở chế độ Học nhanh và là Nét nghĩa chính (idx === 0):
                  // Chỉ lấy "các ví dụ còn lại" (fullSenseExList.slice(1)) vì ví dụ 1 đã ở khung chính mặc định
                  // Nếu không phải học nhanh hoặc là nét nghĩa phụ (idx > 0): lấy toàn bộ ví dụ
                  const fullSenseExList = (idx === 0 && Array.isArray(detail.examples) && detail.examples.length > (sense.examples?.length || 0))
                    ? detail.examples
                    : ((Array.isArray(sense.examples) && sense.examples.length > 0) ? sense.examples : (idx === 0 ? detail.examples : []));

                  const senseExListToRender = (lessonFastMode.checked && idx === 0)
                    ? fullSenseExList.slice(1)
                    : fullSenseExList;

                  if (senseExListToRender && senseExListToRender.length > 0) {
                    const exWrap = document.createElement('div');
                    exWrap.className = 'lesson-examples space-y-3';
                    senseExListToRender.forEach(([en, vi]) => {
                      exWrap.appendChild(createFormattedExampleCard(en, vi));
                    });
                    panel.appendChild(exWrap);
                  }

                  // Cụm từ đi kèm (Collocations)
                  const rawSenseCollocs = sense.collocations || (idx === 0 ? detail.collocations : []);
                  const senseCollocs = (isFastModeActive && idx === 0 && Array.isArray(rawSenseCollocs) && rawSenseCollocs.length === 1)
                    ? []
                    : rawSenseCollocs;
                  if (senseCollocs && senseCollocs.length > 0) {
                    const collRow = document.createElement('div');
                    collRow.className = 'flex flex-wrap items-center gap-1.5 lesson-detail-row';
                    collRow.innerHTML = '<span class="text-xs font-semibold text-muted-foreground">Cụm từ đi kèm:</span>';
                    const chipList = document.createElement('div');
                    chipList.className = 'lesson-chip-list flex flex-wrap items-center gap-1.5';
                    fillChips(chipList, senseCollocs);
                    collRow.appendChild(chipList);
                    panel.appendChild(collRow);
                  }

                  // Đồng nghĩa (Synonyms)
                  const senseSyns = sense.synonyms || (idx === 0 ? detail.synonyms : []);
                  if (senseSyns && senseSyns.length > 0) {
                    const synRow = document.createElement('div');
                    synRow.className = 'flex flex-wrap items-center gap-1.5 lesson-detail-row';
                    synRow.innerHTML = '<span class="text-xs font-semibold text-muted-foreground">Đồng nghĩa:</span>';
                    const chipList = document.createElement('div');
                    chipList.className = 'lesson-chip-list flex flex-wrap items-center gap-1.5';
                    fillChips(chipList, senseSyns, 'synonym');
                    synRow.appendChild(chipList);
                    panel.appendChild(synRow);
                  }

                  // Trái nghĩa (Antonyms)
                  const senseAnts = sense.antonyms || (idx === 0 ? detail.antonyms : []);
                  if (senseAnts && senseAnts.length > 0) {
                    const antRow = document.createElement('div');
                    antRow.className = 'flex flex-wrap items-center gap-1.5 lesson-detail-row';
                    antRow.innerHTML = '<span class="text-xs font-semibold text-muted-foreground">Trái nghĩa:</span>';
                    const chipList = document.createElement('div');
                    chipList.className = 'lesson-chip-list flex flex-wrap items-center gap-1.5';
                    fillChips(chipList, senseAnts, 'antonym');
                    antRow.appendChild(chipList);
                    panel.appendChild(antRow);
                  }

                  if (panel.children.length === 0) {
                    return null;
                  }
                  return panel;
                }).filter(Boolean));
              } else {
                main.querySelector('#lessonDetailType').textContent = detail.type;
                main.querySelector('#lessonDetailMeaning').textContent = detail.meaning;
                main.querySelector('#lessonDetailDefinition').textContent = detail.definition;
                const examples = main.querySelector('#lessonExamples');
                examples.replaceChildren(...detail.examples.map(([english, vietnamese]) => createFormattedExampleCard(english, vietnamese)));
                fillChips(main.querySelector('#lessonCollocations'), detail.collocations);
                fillChips(main.querySelector('#lessonSynonyms'), detail.synonyms, 'synonym');
                fillChips(main.querySelector('#lessonAntonyms'), detail.antonyms, 'antonym');
              }
              const wordFamilyEl = main.querySelector('#lessonWordFamily');
              if (wordFamilyEl) {
                let familyItems = detail.family || [];
                if (typeof familyItems === 'string') {
                  familyItems = familyItems.split(/[\n;]+/).map((s) => s.trim()).filter(Boolean);
                }
                if (familyItems && familyItems.length > 0) {
                  wordFamilyEl.replaceChildren(...familyItems.map((line) => {
                    const row = document.createElement('div');
                    row.className = 'text-sm text-slate-800 dark:text-slate-200 leading-relaxed';
                    // Parse: "abide · verb · chịu đựng, tuân theo"
                    const parts = line.split(/\s*·\s*/);
                    if (parts.length >= 3) {
                      const strong = document.createElement('strong');
                      strong.className = 'font-bold text-slate-900 dark:text-white';
                      strong.textContent = parts[0];

                      const sep1 = document.createElement('span');
                      sep1.className = 'text-slate-400 mx-1.5 font-normal';
                      sep1.textContent = '·';

                      const pos = document.createElement('span');
                      pos.className = 'text-slate-500 dark:text-slate-400 font-normal';
                      pos.textContent = parts[1];

                      const sep2 = document.createElement('span');
                      sep2.className = 'text-slate-400 mx-1.5 font-normal';
                      sep2.textContent = '·';

                      const meaning = document.createElement('span');
                      meaning.className = 'text-slate-700 dark:text-slate-300';
                      meaning.textContent = parts.slice(2).join(' · ');

                      row.append(strong, sep1, pos, sep2, meaning);
                    } else if (parts.length === 2) {
                      const strong = document.createElement('strong');
                      strong.className = 'font-bold text-slate-900 dark:text-white';
                      strong.textContent = parts[0];

                      const sep1 = document.createElement('span');
                      sep1.className = 'text-slate-400 mx-1.5 font-normal';
                      sep1.textContent = '·';

                      const meaning = document.createElement('span');
                      meaning.className = 'text-slate-700 dark:text-slate-300';
                      meaning.textContent = parts[1];

                      row.append(strong, sep1, meaning);
                    } else {
                      row.textContent = line;
                    }
                    return row;
                  }));
                } else {
                  wordFamilyEl.innerHTML = '<div class="text-xs text-muted-foreground italic">Chưa có dữ liệu họ từ</div>';
                }
              }

              const [wrong, right, note] = detail.mistake || [];
              const mistakeWrongEl = main.querySelector('#lessonMistakeWrong');
              if (mistakeWrongEl) mistakeWrongEl.textContent = wrong || '';
              const mistakeRightEl = main.querySelector('#lessonMistakeRight');
              if (mistakeRightEl) mistakeRightEl.textContent = right || '';
              const mistakeNoteEl = main.querySelector('#lessonMistakeNote');
              if (mistakeNoteEl) mistakeNoteEl.textContent = note || '';

              const mistakeBox = main.querySelector('#lessonMistakeBox');
              const mistakeEmptyEl = main.querySelector('#lessonMistakeEmpty');
              if (mistakeBox) {
                const hasMistake = Boolean((wrong && wrong.trim().length > 0) || (right && right.trim().length > 0) || (note && note.trim().length > 0));
                mistakeBox.style.display = hasMistake ? '' : 'none';
                if (mistakeEmptyEl) {
                  mistakeEmptyEl.style.display = hasMistake ? 'none' : '';
                }
              }

              const memoryTipEl = main.querySelector('#lessonMemoryTip');
              if (memoryTipEl) {
                if (detail.tip && detail.tip.trim().length > 0) {
                  memoryTipEl.textContent = detail.tip;
                  memoryTipEl.className = 'text-sm font-medium leading-relaxed text-slate-800 dark:text-slate-200 mt-2';
                } else {
                  memoryTipEl.textContent = 'Chưa có mẹo nhớ cho từ này.';
                  memoryTipEl.className = 'text-xs text-muted-foreground italic mt-2';
                }
              }
              fillChips(main.querySelector('#lessonTags'), detail.tags.map((tag) => tag.replace(/^#/, '#')));
            }

            function updateLessonProgressBar() {
              const total = lessonWords.length;
              const currentCount = lessonIndex + 1;
              let progressPercent = 0;
              if (completedSetSession) {
                progressPercent = 100;
              } else if (reviewSession) {
                const mode = lessonCard.dataset.mode;
                const stepOffset = mode === 'review' ? 0.85 : mode === 'quiz' ? 0.5 : 0.15;
                progressPercent = total ? ((lessonIndex + stepOffset) / total) * 100 : 0;
              } else {
                progressPercent = total ? (currentCount / total) * 100 : 0;
              }
              lessonProgress.setAttribute('aria-valuemax', String(total));
              lessonProgress.setAttribute('aria-valuenow', String(currentCount));
              lessonProgress.setAttribute('aria-valuetext', `Thẻ ${currentCount} trên ${total}`);
              lessonProgressFill.style.width = `${progressPercent}%`;
            }

            function renderLessonWord() {
              const item = lessonWords[lessonIndex];
              const wordDone = isCurrentWordDone();
              const primaryMeaning = (item.senses && item.senses.length > 0 && item.senses[0].meaning)
                ? item.senses[0].meaning
                : item.meaning;
              const primaryType = (item.senses && item.senses.length > 0 && item.senses[0].type)
                ? item.senses[0].type
                : item.type;
              lessonWord.textContent = item.word;
              lessonMeaning.textContent = primaryMeaning;
              lessonMeaning.hidden = true;
              lessonWord.hidden = false;
              lessonWordType.textContent = primaryType;
              lessonPronunciationUs.textContent = item.us;
              lessonPronunciationUk.textContent = item.uk;
              lessonCounter.textContent = `Thẻ ${lessonIndex + 1}/${lessonWords.length}`;
              lessonFastExpanded = !lessonFastMode.checked;
              renderLessonDetail(item);
              lessonQuizAnswer = null;
              lessonIsFlipped = wordDone;
              lessonLessonUnlocked = wordDone;
              lessonQuizUnlocked = false;
              lessonTypingUnlocked = false;
              lessonTypingValue = '';
              lessonTypingResult = null;
              lessonTypingWrongCount = 0;
              lessonTypingHintLevel = 0;
              lessonTypingHintUnlocked = false;
              lessonTypingUsedHint = false;
              lessonTypingScrambleLetters = [];
              lessonReviewUnlocked = false;
              setLessonMode(lessonIsFlipped ? 'lesson' : 'term');
              updateLessonProgressBar();
              lessonBookmark.setAttribute('aria-pressed', String(localStorage.getItem(`saved-vocab:${item.word}`) === 'true'));
              lessonBookmark.innerHTML = lessonBookmark.getAttribute('aria-pressed') === 'true'
                ? '<i data-lucide="bookmark" aria-hidden="true"></i>'
                : '<i data-lucide="bookmark" aria-hidden="true"></i>';
              syncReviewLayout();
            }

            function speakLessonWord(locale) {
              const item = lessonWords[lessonIndex];
              if (!item) return;
              if (locale === 'en-US' && item.audio && /^(https?:\/\/|\/)/i.test(item.audio)) {
                try {
                  const audioEl = new Audio(item.audio);
                  audioEl.play().catch(() => {});
                  return;
                } catch { /* Fallback to Edge-TTS. */ }
              }
              const accent = locale.toLowerCase().includes('gb') ? 'uk' : 'us';
              playEdgeTtsAudio(item.word, accent);
            }

            async function openLesson(card) {
              if (!card) return;
              hideLessonComplete();
              reviewSession = false;
              const studyBtn = card.querySelector('.study-set');
              continueSession = Boolean(studyBtn && studyBtn.textContent.includes('Học tiếp'));
              lessonModeLabel.textContent = 'Học từ mới';
              const savedFastMode = localStorage.getItem('vocab_fast_mode');
              lessonFastMode.checked = savedFastMode !== null ? (savedFastMode === 'true') : true;
              lessonOpener = document.activeElement;
              const title = card.dataset.title || 'Contracts';
              const topicId = card.dataset.id || '';
              lessonSetTitle.textContent = title;

              // Tải từ vựng thực tế từ Database thông qua Controller
              try {
                const res = await fetch(`/Vocabulary/GetTopicLesson?topicId=${topicId}&topicTitle=${encodeURIComponent(title)}`);
                if (res.ok) {
                  const json = await res.json();
                  if (json.success && Array.isArray(json.data) && json.data.length > 0) {
                    lessonWordSets[title] = json.data;
                  }
                }
              } catch (err) {
                console.warn('GetTopicLesson fetch error, using local fallback:', err);
              }

              lessonWords = lessonWordSets[title] || fallbackLessonWordSets[title] || [
                { word: 'practice', meaning: 'thực hành', type: 'VERB', us: '/ˈpræktɪs/', uk: '/ˈpræktɪs/' },
                { word: 'improve', meaning: 'cải thiện', type: 'VERB', us: '/ɪmˈpruːv/', uk: '/ɪmˈpruːv/' }
              ];
              completedSetSession = lessonWords.length > 0
                ? lessonWords.every(isWordLearned)
                : Boolean(card.textContent && card.textContent.includes('100%'));
              const firstUnlearnedIndex = lessonWords.findIndex((item) => !isWordLearned(item));
              lessonIndex = firstUnlearnedIndex >= 0 ? firstUnlearnedIndex : 0;
              lessonLiveMessage.textContent = '';
              renderLessonWord();
              if (lessonView.hidden) {
                lessonSavedVisibility = lessonLibraryNodes.map((node) => [node, node.hidden]);
                lessonLibraryNodes.forEach((node) => { node.hidden = true; });
                lessonView.hidden = false;
              }
              const activeTab = main.querySelector('.vocab-lesson-tab[aria-selected="true"]');
              if (activeTab && !isCurrentWordDone()) activeTab.focus();
              if (lessonAutoPronounce && lessonAutoPronounce.checked) speakLessonWord('en-US');
            }

            function closeLesson() {
              clearLessonStepTimers();
              hideLessonComplete();
              lessonView.hidden = true;
              reviewSession = false;
              continueSession = false;
              completedSetSession = false;
              lessonModeLabel.textContent = 'Học từ mới';
              syncReviewLayout();
              lessonSavedVisibility.forEach(([node, hidden]) => { node.hidden = hidden; });
              updateCardProgress();
              filterCards();
              refreshReviewAvailability();
              if (lessonOpener) lessonOpener.focus();
            }

            async function startReview() {
              hideLessonComplete();
              let words = [];
              try {
                const res = await fetch('/Vocabulary/GetReviewWords');
                if (res.ok) {
                  const json = await res.json();
                  if (json.success && Array.isArray(json.data) && json.data.length > 0) {
                    words = json.data.map((w) => ({
                      wordId: w.wordId,
                      word: w.word,
                      type: (w.type || w.partOfSpeech || 'noun').toUpperCase(),
                      meaning: w.meaning,
                      us: w.us || w.phoneticUs || '',
                      uk: w.uk || w.phoneticUk || '',
                      audio: w.audio || w.audioUrl || '',
                      definition: w.definition || w.englishDefinition || `${w.meaning}.`,
                      examples: Array.isArray(w.examples) ? w.examples : (w.exampleSentence ? (() => {
                        const sents = String(w.exampleSentence).split(/\r\n|\r|\n|\|\|\|/).map(s => s.trim()).filter(Boolean);
                        const means = String(w.exampleMeaning || '').split(/\r\n|\r|\n|\|\|\|/).map(s => s.trim());
                        return sents.map((s, idx) => [s.replace(/\[([^\[\]]+)\]/g, '$1'), means[idx] || '']);
                      })() : []),
                      collocations: Array.isArray(w.collocations) ? w.collocations : (w.collocations ? (/[;\r\n|]/.test(w.collocations) ? w.collocations.split(/[;\r\n|]+/) : (w.collocations.includes(' — ') ? [w.collocations] : w.collocations.split(','))).map(s => s.trim()).filter(Boolean) : []),
                      synonyms: Array.isArray(w.synonyms) ? w.synonyms : (w.synonyms ? w.synonyms.split(';') : []),
                      antonyms: Array.isArray(w.antonyms) ? w.antonyms : (w.antonyms ? w.antonyms.split(';') : []),
                      family: Array.isArray(w.family) ? w.family : (w.wordFamily ? w.wordFamily.split(';') : []),
                      tip: w.tip || w.memoryTip || '',
                      mistake: Array.isArray(w.mistake) ? w.mistake : [w.commonMistakeWrong || '', w.commonMistakeRight || '', w.commonMistakeNote || ''],
                      tags: Array.isArray(w.tags) ? w.tags : ['#review', '#toeic'],
                      quiz: w.quiz || {
                        options: [w.meaning, 'Ý nghĩa khác 1', 'Ý nghĩa khác 2', 'Ý nghĩa khác 3'].sort(() => Math.random() - 0.5),
                        correctIndex: 0
                      },
                      typing: w.typing || null
                    }));
                  }
                }
              } catch (e) {
                console.warn('GetReviewWords error', e);
              }

              if (!words.length) {
                words = getLearnedReviewWords();
              }
              if (!words.length) {
                window.alert('Chưa có từ nào cần ôn tập!');
                return;
              }
              lessonOpener = document.activeElement;
              reviewSession = true;
              continueSession = false;
              completedSetSession = false;
              reviewQuizResults = new Map();
              reviewCompletedWords = new Set();
              lessonFastMode.checked = false;
              lessonModeLabel.textContent = 'Ôn tập';
              lessonSetTitle.textContent = 'Ôn tập';
              lessonWords = words;
              lessonIndex = 0;
              lessonIsFlipped = false;
              renderLessonWord();
              lessonSavedVisibility = lessonLibraryNodes.map((node) => [node, node.hidden]);
              lessonLibraryNodes.forEach((node) => { node.hidden = true; });
              lessonView.hidden = false;
              syncReviewLayout();
              main.querySelector('.vocab-lesson-tab[data-lesson-mode="term"]').focus();
              if (lessonAutoPronounce.checked) speakLessonWord('en-US');
            }

            refreshReviewAvailability();
            reviewStartButton.addEventListener('click', startReview);
            const startLearnNewButton = main.querySelector('#startLearnNewButton');
            if (startLearnNewButton) {
              startLearnNewButton.addEventListener('click', () => {
                const nextCard = getNextTopicCard();
                if (nextCard) openLesson(nextCard);
              });
            }

            main.querySelectorAll('.study-set').forEach((button) => button.addEventListener('click', (e) => {
              e.stopPropagation();
              openLesson(button.closest('.vocab-card'));
            }));
            main.querySelectorAll('.vocab-card').forEach((card) => card.addEventListener('click', (e) => {
              if (e.target.closest('.study-set') || e.target.closest('a') || e.target.closest('button')) return;
              openLesson(card);
            }));
            main.querySelector('#lessonHomeButton').addEventListener('click', closeLesson);
            main.querySelector('#lessonBackButton').addEventListener('click', closeLesson);
            const lessonCompleteBackBtn = main.querySelector('#lessonCompleteBackBtn');
            if (lessonCompleteBackBtn) lessonCompleteBackBtn.addEventListener('click', closeLesson);
            const lessonCompleteRestartBtn = main.querySelector('#lessonCompleteRestartBtn');
            if (lessonCompleteRestartBtn) {
              lessonCompleteRestartBtn.addEventListener('click', () => {
                hideLessonComplete();
                lessonIndex = 0;
                renderLessonWord();
                if (lessonAutoPronounce.checked) speakLessonWord('en-US');
              });
            }
            const lessonCompleteNextTopicBtn = main.querySelector('#lessonCompleteNextTopicBtn');
            if (lessonCompleteNextTopicBtn) {
              lessonCompleteNextTopicBtn.addEventListener('click', () => {
                const currentIdx = cards.findIndex((c) => c.dataset.title === lessonSetTitle.textContent);
                const nextCard = (currentIdx >= 0 && currentIdx + 1 < cards.length) ? cards[currentIdx + 1] : getNextTopicCard();
                if (nextCard) {
                  openLesson(nextCard);
                } else {
                  closeLesson();
                }
              });
            }
            const lessonCompletePhrasesBtn = main.querySelector('#lessonCompletePhrasesBtn');
            if (lessonCompletePhrasesBtn) {
              lessonCompletePhrasesBtn.addEventListener('click', () => {
                const currentTitle = lessonSetTitle.textContent;
                closeLesson();
                const matchedPhraseSet = phraseSets.find((s) => s.title === currentTitle) || phraseSets[0];
                if (matchedPhraseSet) {
                  openPhrasePractice(matchedPhraseSet, lessonOpener || document.body);
                }
              });
            }
            lessonFastMode.addEventListener('change', () => {
              localStorage.setItem('vocab_fast_mode', String(lessonFastMode.checked));
              lessonFastExpanded = !lessonFastMode.checked;
              const currentItem = lessonWords[lessonIndex];
              if (currentItem) {
                renderLessonDetail(currentItem);
              }
              if (lessonFastMode.checked && isCurrentWordDone()) {
                lessonIsFlipped = true;
                lessonLessonUnlocked = true;
                setLessonMode('lesson');
              } else {
                updateFastModeUI();
              }
            });
            lessonFastToggle.addEventListener('click', () => {
              lessonFastExpanded = !lessonFastExpanded;
              updateFastModeUI();
            });
            const lessonFastNextBtn = main.querySelector('#lessonFastNext');
            if (lessonFastNextBtn) {
              lessonFastNextBtn.addEventListener('click', () => {
                const item = lessonWords[lessonIndex];
                if (item) item.learned = true;
                refreshReviewAvailability();
                advanceLessonWord('term');
                if (lessonAutoPronounce.checked && !lessonView.hidden) speakLessonWord('en-US');
              });
            }
            let flipTimer = null;
            function animateCardFlip(targetMode, reverse = false) {
              if (flipTimer) window.clearTimeout(flipTimer);
              lessonCard.classList.remove('is-flipping-out', 'is-flipping-in', 'is-flipping-back-out', 'is-flipping-back-in');
              void lessonCard.offsetWidth;
              lessonCard.classList.add(reverse ? 'is-flipping-back-out' : 'is-flipping-out');
              flipTimer = window.setTimeout(() => {
                setLessonMode(targetMode);
                lessonCard.classList.remove('is-flipping-out', 'is-flipping-back-out');
                void lessonCard.offsetWidth;
                lessonCard.classList.add(reverse ? 'is-flipping-back-in' : 'is-flipping-in');
                flipTimer = window.setTimeout(() => {
                  lessonCard.classList.remove('is-flipping-in', 'is-flipping-back-in');
                  flipTimer = null;
                }, 280);
              }, 190);
            }

            lessonTabs.forEach((tab) => tab.addEventListener('click', () => {
              if (!tab.dataset.lessonMode) return;
              if (tab.dataset.lessonMode === 'lesson' && !lessonLessonUnlocked) {
                lessonLiveMessage.textContent = 'Nhấn Lật thẻ ở phần Từ để mở Bài học.';
                return;
              }
              if (!lessonFastMode.checked && tab.dataset.lessonMode === 'quiz' && !lessonQuizUnlocked) {
                lessonLiveMessage.textContent = reviewSession
                  ? 'Nhấn Kiểm tra ở phần Từ để mở Quiz.'
                  : 'Trong Bài học, nhấn Kiểm tra nhanh để mở Quiz.';
                return;
              }
              if (tab.dataset.lessonMode === 'typing' && !lessonTypingUnlocked) {
                lessonLiveMessage.textContent = 'Hãy hoàn thành Quiz rồi nhấn Tiếp để sang phần Gõ.';
                return;
              }
              if (tab.dataset.lessonMode === 'review' && !lessonReviewUnlocked) {
                lessonLiveMessage.textContent = reviewSession
                  ? 'Hãy hoàn thành Quiz rồi nhấn Xem đánh giá để mở phần đánh giá.'
                  : lessonTypingResult === null
                    ? 'Nhấn Kiểm tra ở phần Gõ để xem kết quả.'
                    : 'Nhấn Xem đánh giá để mở phần đánh giá.';
                return;
              }
              const prevMode = lessonCard.dataset.mode;
              const nextMode = tab.dataset.lessonMode;
              lessonIsFlipped = nextMode === 'lesson';
              if ((prevMode === 'term' && nextMode === 'lesson') || (prevMode === 'lesson' && nextMode === 'term')) {
                animateCardFlip(nextMode, prevMode === 'lesson');
              } else {
                setLessonMode(nextMode);
              }
              lessonLiveMessage.textContent = nextMode === 'quiz'
                ? 'Đã mở phần trắc nghiệm nhanh.'
                : nextMode === 'typing'
                  ? 'Đã mở phần luyện gõ từ.'
                  : nextMode === 'review'
                    ? 'Đã mở phần đánh giá từ vựng.'
                  : lessonIsFlipped ? 'Đã mở phần bài học của từ này.' : 'Đã trở về mặt trước của thẻ.';
            }));
            lessonFlipButton.addEventListener('click', () => {
              if (reviewSession) {
                lessonQuizUnlocked = true;
                animateCardFlip('quiz', false);
                lessonLiveMessage.textContent = 'Đã mở phần trắc nghiệm nhanh.';
                return;
              }
              lessonLessonUnlocked = true;
              lessonIsFlipped = true;
              animateCardFlip('lesson', false);
              lessonLiveMessage.textContent = 'Đã mở phần bài học của từ này.';
            });
            if (reviewWordListToggle) {
              reviewWordListToggle.addEventListener('click', () => {
                const isCurrentlyExpanded = reviewWordListToggle.getAttribute('aria-expanded') !== 'false';
                const nextExpanded = !isCurrentlyExpanded;
                reviewWordListToggle.setAttribute('aria-expanded', String(nextExpanded));
                reviewWordListToggle.setAttribute('title', nextExpanded ? 'Thu gọn danh sách từ' : 'Mở rộng danh sách từ');
                reviewWordListToggle.setAttribute('aria-label', nextExpanded ? 'Thu gọn danh sách từ' : 'Mở rộng danh sách từ');

                requestAnimationFrame(() => {
                  const scrollWrap = main.querySelector('#reviewWordScroll');
                  if (scrollWrap) scrollWrap.hidden = !nextExpanded;
                  if (reviewWordItems) reviewWordItems.hidden = !nextExpanded;
                  reviewWordList.classList.toggle('is-collapsed', !nextExpanded);
                  reviewWorkspace?.classList.toggle('is-word-list-collapsed', !nextExpanded);
                });
              });
            }
            main.querySelector('#lessonQuickCheck').addEventListener('click', () => {
              if (isCurrentWordDone()) {
                advanceLessonWord('term');
                if (lessonAutoPronounce.checked && !lessonView.hidden) speakLessonWord('en-US');
                return;
              }
              lessonQuizUnlocked = true;
              updateFastModeUI();
              const quizTab = lessonTabs.find((tab) => tab.dataset.lessonMode === 'quiz');
              if (quizTab) quizTab.click();
            });
            main.querySelector('#lessonQuizForgot').addEventListener('click', () => {
              selectQuizOption(-1);
            });
            main.querySelector('#lessonQuizNext').addEventListener('click', advanceQuiz);
            const lessonTypingInput = main.querySelector('#lessonTypingInput');
            const lessonTypingSubmit = main.querySelector('#lessonTypingSubmit');
            const lessonTypingHintBtn = main.querySelector('#lessonTypingHint');
            const lessonTypingRevealBtn = main.querySelector('#lessonTypingReveal');
            const lessonTypingScrambleClear = main.querySelector('#lessonTypingScrambleClear');

            lessonTypingInput.addEventListener('input', () => {
              lessonTypingValue = lessonTypingInput.value;
              lessonTypingInput.classList.remove('is-wrong');
              updateScrambleTilesState();
              resetTypingIdleTimer();
            });
            lessonTypingInput.addEventListener('keydown', (event) => {
              if (event.key === 'Enter' && lessonTypingResult === null) {
                event.preventDefault();
                lessonTypingSubmit.click();
              } else if (event.key === 'Tab' && lessonTypingResult === null && lessonTypingHintUnlocked) {
                event.preventDefault();
                triggerTypingHint();
              }
            });
            if (lessonTypingHintBtn) {
              lessonTypingHintBtn.addEventListener('click', triggerTypingHint);
            }
            if (lessonTypingRevealBtn) {
              lessonTypingRevealBtn.addEventListener('click', () => {
                if (lessonTypingResult !== null) return;
                const item = lessonWords[lessonIndex];
                if (!item) return;
                const target = getTypingTargetAnswer(item);
                clearLessonStepTimers();
                lessonTypingUsedHint = true;
                lessonTypingValue = target;
                lessonTypingResult = false;
                renderLessonTyping();
                lessonLiveMessage.textContent = `Đáp án đúng là ${target}.`;
              });
            }
            if (lessonTypingScrambleClear) {
              lessonTypingScrambleClear.addEventListener('click', () => {
                if (lessonTypingResult !== null) return;
                lessonTypingValue = '';
                lessonTypingInput.value = '';
                lessonTypingInput.classList.remove('is-wrong');
                updateScrambleTilesState();
                lessonTypingInput.focus({ preventScroll: true });
              });
            }
            lessonTypingSubmit.addEventListener('click', () => {
              if (lessonTypingResult !== null) {
                lessonReviewUnlocked = true;
                setLessonMode('review');
                lessonLiveMessage.textContent = 'Đã mở phần đánh giá từ vựng.';
                return;
              }
              const item = lessonWords[lessonIndex];
              if (!item) return;
              const target = getTypingTargetAnswer(item);
              lessonTypingValue = lessonTypingInput.value;
              const isMatch = normalizeTypingAnswer(lessonTypingValue) === normalizeTypingAnswer(target);
              if (isMatch) {
                clearLessonStepTimers();
                lessonTypingResult = true;
                renderLessonTyping();
                lessonLiveMessage.textContent = 'Bạn đã gõ đúng từ.';
              } else {
                lessonTypingWrongCount += 1;
                lessonTypingHintUnlocked = true;
                lessonTypingResult = null;
                renderLessonTyping();
                lessonTypingInput.focus({ preventScroll: true });
                lessonLiveMessage.textContent = 'Chưa đúng. Hãy sửa lại hoặc dùng nút Gợi ý.';
              }
            });

            function updateSharedStudyMetrics(isCorrect = true) {
              try {
                const raw = localStorage.getItem('tart_study_metrics_v2');
                if (raw) {
                  const data = JSON.parse(raw);
                  if (data.vocab) {
                    data.vocab.total = (data.vocab.total || 17) + 1;
                    data.vocab.weekLearned = (data.vocab.weekLearned || 0) + 1;
                  }
                  if (data.accuracy) {
                    data.accuracy.total = (data.accuracy.total || 21) + 1;
                    if (isCorrect) data.accuracy.correct = (data.accuracy.correct || 4) + 1;
                  }
                  if (data.time) {
                    data.time.todayMinutes = (data.time.todayMinutes || 0) + 1;
                    data.time.totalMinutes = (data.time.totalMinutes || 103) + 1;
                  }
                  if (data.streak && data.streak.activeDays) {
                    const todayDayIdx = String(new Date().getDay());
                    data.streak.activeDays[todayDayIdx] = true;
                    if (data.streak.current === 0) data.streak.current = 1;
                  }
                  localStorage.setItem('tart_study_metrics_v2', JSON.stringify(data));
                }
              } catch (e) {}
            }

            async function syncWordProgressToDb(item, isCorrect, extra = {}) {
              if (!item) return;
              try {
                await fetch('/Vocabulary/UpdateProgress', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({
                    wordId: item.wordId || 0,
                    word: item.word,
                    isCorrect: Boolean(isCorrect),
                    isAgain: Boolean(extra.isAgain),
                    typingFails: Number(extra.typingFails || 0)
                  })
                });
              } catch (e) {
                console.warn('UpdateProgress sync error:', e);
              }
            }

            main.querySelectorAll('.lesson-review .lesson-rating-button').forEach((button) => button.addEventListener('click', () => {
              const item = lessonWords[lessonIndex];
              const isAgain = button.dataset.rating === 'again';
              const isCorrect = !isAgain;
              const typingFails = (lessonTypingWrongCount || 0) + (lessonTypingUsedHint ? 1 : 0);
              item.rating = button.dataset.rating;
              item.learned = isCorrect;
              item.skipped = false;
              if (reviewSession) reviewCompletedWords.add(item.word);
              try {
                localStorage.setItem(`vocab-rating:${item.word}`, button.dataset.rating);
                localStorage.removeItem(`vocab-skipped:${item.word}`);
                updateSharedStudyMetrics(isCorrect);
              } catch { /* Retain rating in active session. */ }
              syncWordProgressToDb(item, isCorrect, { isAgain, typingFails });
              refreshReviewAvailability();
              main.querySelectorAll('.lesson-rating-button').forEach((rating) => {
                rating.setAttribute('aria-pressed', String(rating === button));
              });
              lessonIsFlipped = false;
              advanceLessonWord('term');
            }));
            main.querySelectorAll('[data-fast-rating]').forEach((button) => button.addEventListener('click', () => {
              const item = lessonWords[lessonIndex];
              const isAgain = button.dataset.fastRating === 'again';
              const isCorrect = !isAgain;
              item.rating = button.dataset.fastRating;
              item.learned = isCorrect;
              item.skipped = false;
              if (reviewSession) reviewCompletedWords.add(item.word);
              try {
                localStorage.setItem(`vocab-rating:${item.word}`, button.dataset.fastRating);
                localStorage.removeItem(`vocab-skipped:${item.word}`);
                updateSharedStudyMetrics(isCorrect);
              } catch { /* Retain rating in active session. */ }
              syncWordProgressToDb(item, isCorrect, { isAgain, typingFails: 0 });
              refreshReviewAvailability();
              lessonIsFlipped = false;
              advanceLessonWord('term');
              if (lessonAutoPronounce.checked && !lessonView.hidden) speakLessonWord('en-US');
            }));
            main.querySelectorAll('[data-speak]').forEach((button) => button.addEventListener('click', () => {
              speakLessonWord(button.dataset.speak);
            }));
            lessonAutoPronounce.addEventListener('change', () => {
              if (lessonAutoPronounce.checked && lessonWords.length) speakLessonWord('en-US');
              else if ('speechSynthesis' in window) window.speechSynthesis.cancel();
            });
            lessonBookmark.addEventListener('click', async () => {
              const item = lessonWords[lessonIndex];
              if (!item) return;
              const isSaved = lessonBookmark.getAttribute('aria-pressed') === 'true';
              const newSaved = !isSaved;
              localStorage.setItem(`saved-vocab:${item.word}`, String(newSaved));
              item.isBookmarked = newSaved;
              renderLessonWord();
              lessonLiveMessage.textContent = newSaved ? 'Đã lưu từ vào sổ tay.' : 'Đã bỏ lưu từ.';
              try {
                const res = await fetch('/Vocabulary/ToggleBookmark', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ wordId: item.wordId || 0, word: item.word })
                });
                if (res.ok) {
                  const data = await res.json();
                  const badge = document.querySelector('#savedNotebookCountBadge');
                  if (badge && typeof data.notebookCount === 'number') {
                    badge.textContent = data.notebookCount;
                  }
                }
              } catch (e) {
                console.warn('ToggleBookmark error', e);
              }
            });
            lessonSkipButton.addEventListener('click', () => {
              const currentItem = lessonWords[lessonIndex];
              if (currentItem) {
                currentItem.skipped = true;
                currentItem.learned = false;
                try { localStorage.setItem(`vocab-skipped:${currentItem.word}`, 'true'); } catch { /* Keep skipped state in active session. */ }
                syncWordProgressToDb(currentItem, true);
              }
              refreshReviewAvailability();
              advanceLessonWord('term');
              if (lessonAutoPronounce.checked && !lessonView.hidden) speakLessonWord('en-US');
            });
            function openLessonFeedback(isReport) {
              const currentItem = lessonWords[lessonIndex];
              const activeTab = main.querySelector('.lesson-step-tab[aria-selected="true"]')?.dataset?.step;
              const defaultType = isReport
                ? (activeTab === 'typing'
                  ? '[Vocab] Lỗi gõ'
                  : activeTab === 'quiz'
                    ? '[Vocab] Sai đáp án Quiz'
                    : '[Vocab] Nội dung thẻ từ')
                : 'Góp ý từ vựng';
              triggerFeedbackModal({
                isReport,
                wordId: currentItem?.wordId || 0,
                word: currentItem?.word || '',
                defaultType
              });
            }
            main.querySelector('#lessonReportButton').addEventListener('click', () => openLessonFeedback(true));
            main.querySelector('#lessonFeedbackButton').addEventListener('click', () => openLessonFeedback(false));
            document.addEventListener('keydown', (event) => {
              if (lessonView.hidden) return;
              if (event.key === 'Escape') {
                closeLesson();
                return;
              }
              const activeTag = document.activeElement?.tagName;
              const isInEditable = activeTag === 'INPUT' || activeTag === 'TEXTAREA' || activeTag === 'SELECT';
              const mode = lessonCard.dataset.mode;

              if (mode === 'quiz' && !isInEditable) {
                const key = event.key.toLowerCase();
                if (lessonQuizAnswer === null) {
                  const keyMap = { '1': 0, '2': 1, '3': 2, '4': 3, a: 0, b: 1, c: 2, d: 3 };
                  if (Object.prototype.hasOwnProperty.call(keyMap, key)) {
                    event.preventDefault();
                    selectQuizOption(keyMap[key]);
                    return;
                  }
                  if (event.code === 'Space' || event.key === ' ') {
                    event.preventDefault();
                    selectQuizOption(-1);
                    return;
                  }
                } else if (event.key === 'Enter') {
                  event.preventDefault();
                  advanceQuiz();
                }
              } else if (mode === 'typing') {
                if (event.key === 'Tab' && lessonTypingResult === null && lessonTypingHintUnlocked && !isInEditable) {
                  event.preventDefault();
                  triggerTypingHint();
                } else if (event.key === 'Enter' && lessonTypingResult !== null && !isInEditable) {
                  event.preventDefault();
                  lessonTypingSubmit.click();
                }
              } else if (!isInEditable && (mode === 'term' || mode === 'lesson')) {
                const key = event.key.toLowerCase();

                // Phím Space: Lật thẻ nếu ở mặt trước (term), hoặc Tiếp nếu ở Học nhanh
                if (event.code === 'Space' || event.key === ' ') {
                  event.preventDefault();
                  if (lessonFastMode.checked) {
                    const fastNextBtn = main.querySelector('#lessonFastNext');
                    if (fastNextBtn && !fastNextBtn.hidden) {
                      fastNextBtn.click();
                      return;
                    }
                  }
                  lessonFlipButton.click();
                  return;
                }

                // Phím Enter: Bấm Tiếp nếu đã sẵn sàng ở Học nhanh
                if (event.key === 'Enter') {
                  const fastNextBtn = main.querySelector('#lessonFastNext');
                  if (fastNextBtn && !fastNextBtn.hidden && lessonFastMode.checked) {
                    event.preventDefault();
                    fastNextBtn.click();
                    return;
                  }
                }

                // Phím 1, 2, 3, 4: Đánh giá nhanh (1: Học lại, 2: Khó, 3: Tốt, 4: Dễ)
                if (['1', '2', '3', '4'].includes(key)) {
                  const ratingMap = { '1': 'again', '2': 'hard', '3': 'good', '4': 'easy' };
                  const targetRating = ratingMap[key];
                  if (lessonFastMode.checked) {
                    const ratingBtn = main.querySelector(`[data-fast-rating="${targetRating}"]`);
                    if (ratingBtn && !ratingBtn.closest('#lessonFastRating')?.hidden) {
                      event.preventDefault();
                      ratingBtn.click();
                      return;
                    }
                  } else {
                    const ratingBtn = main.querySelector(`.lesson-review .lesson-rating-button[data-rating="${targetRating}"]`);
                    if (ratingBtn) {
                      event.preventDefault();
                      ratingBtn.click();
                      return;
                    }
                  }
                }

                // Phím E hoặc mũi tên xuống (ArrowDown): Mở rộng / Thu gọn "Xem thêm"
                if (key === 'e' || (event.key === 'ArrowDown' && !event.ctrlKey)) {
                  if (lessonFastMode.checked && !lessonFastToggle.hidden) {
                    event.preventDefault();
                    lessonFastToggle.click();
                    return;
                  }
                }

                // Phím A hoặc P: Phát âm từ vựng (US)
                if (key === 'a' || key === 'p') {
                  event.preventDefault();
                  speakLessonWord('en-US');
                  return;
                }

                // Phím S hoặc B: Lưu / bỏ lưu vào Sổ tay (Bookmark)
                if (key === 's' || key === 'b') {
                  event.preventDefault();
                  lessonBookmark.click();
                  return;
                }
              }
            });
          })();
