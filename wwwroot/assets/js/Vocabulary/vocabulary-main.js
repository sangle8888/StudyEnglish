/* Hàm dùng chung (vốn nằm trong script layout) — trang Từ vựng gọi khi bấm Góp ý / Báo lỗi */
function triggerFeedbackModal() {
  const modal = document.createElement('div');
  modal.className = 'fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[70] flex items-center justify-center p-4';
  modal.innerHTML = `
    <div class="glass-card bg-white dark:bg-slate-900 rounded-3xl p-6 max-w-md w-full shadow-2xl relative">
      <h3 class="text-lg font-extrabold text-slate-800 dark:text-white mb-2">Góp ý cho trang web 💬</h3>
      <p class="text-xs text-slate-500 mb-4">Cảm ơn bạn đã hỗ trợ Tiếng Anh Ra Trường ngày càng hoàn thiện hơn!</p>
      <textarea rows="4" placeholder="Nhập ý kiến đóng góp của bạn tại đây..." class="w-full p-3 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 mb-4"></textarea>
      <div class="flex justify-end gap-2">
        <button type="button" data-fb-cancel class="px-4 py-2 text-xs font-bold text-slate-500 hover:text-slate-700 dark:hover:text-slate-300">Hủy</button>
        <button type="button" data-fb-send class="px-4 py-2 bg-blue-600 text-white text-xs font-bold rounded-xl shadow-md hover:bg-blue-700">Gửi góp ý</button>
      </div>
    </div>`;
  const close = () => modal.remove();
  modal.querySelector('[data-fb-cancel]').addEventListener('click', close);
  modal.querySelector('[data-fb-send]').addEventListener('click', () => { window.alert('Cảm ơn bạn đã đóng góp ý kiến!'); close(); });
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
            let activeTab = 'flashcards';

            function filterCards() {
              const isPhrases = activeTab === 'phrases';
              main.classList.toggle('phrases-active', isPhrases);
              topicSection.hidden = isPhrases;
              phraseCatalog.hidden = !isPhrases;
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
                group.hidden = activeTab === 'notebook' || !group.querySelector('.vocab-card:not([hidden])');
              });
              if (activeTab === 'notebook') emptyState.textContent = 'Sổ tay của bạn đang trống. Hãy lưu từ mới khi học để xem lại tại đây.';
              else emptyState.textContent = 'Chưa có từ vựng phù hợp với lựa chọn này.';
              emptyState.classList.toggle('hidden', activeTab !== 'notebook' && visibleCount > 0);
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
              business: ['#d946ef', '#fae8ff', '#f0abfc', '#c026d3'], toeic: ['#f59e0b', '#fef3c7', '#fcd34d', '#d97706'],
              finance: ['#10b981', '#d1fae5', '#6ee7b7', '#059669'], health: ['#f43f5e', '#ffe4e6', '#fda4af', '#e11d48'],
              travel: ['#06b6d4', '#cffafe', '#67e8f9', '#0891b2'], dining: ['#f97316', '#ffedd5', '#fdba74', '#ea580c']
            };
            const phraseSets = [];
            groups.forEach((group) => {
              const topic = group.dataset.group;
              const sourceSets = topic === 'business' ? businessPhraseSets : [...group.querySelectorAll('.vocab-card')].map((card) => ({ title: card.dataset.title, pairs: [] }));
              const catalogGroup = document.createElement('section');
              catalogGroup.className = 'phrase-group';
              const [accent, soft, dark, text] = phrasePalettes[topic];
              catalogGroup.style.setProperty('--phrase-accent', accent);
              catalogGroup.style.setProperty('--phrase-soft', soft);
              catalogGroup.style.setProperty('--phrase-dark', dark);
              catalogGroup.style.setProperty('--phrase-text', text);
              catalogGroup.innerHTML = '<div class="phrase-group-heading"><h3></h3><span></span></div><div class="phrase-card-grid"></div>';
              catalogGroup.querySelector('h3').textContent = group.querySelector('h3').textContent.replace(/\s+/g, ' ').trim();
              catalogGroup.querySelector('.phrase-group-heading > span').textContent = `${sourceSets.length} bộ từ`;
              const grid = catalogGroup.querySelector('.phrase-card-grid');
              sourceSets.forEach((source) => {
                const seen = new Set();
                const pairs = [...source.pairs, ...phraseBanks[topic]].filter(([left]) => {
                  if (seen.has(left)) return false;
                  seen.add(left);
                  return true;
                }).slice(0, 12);
                const set = { title: source.title, topic, pairs, key: `vocab-phrase-progress:${topic}:${source.title}` };
                if (topic === 'business' && source.title === 'Contracts') {
                  pairs[11] = ['resolve', 'an issue', 'giải quyết một vấn đề'];
                  const previousKey = set.key;
                  set.key += ':sentence-v1';
                  try {
                    if (localStorage.getItem(set.key) === null) {
                      const previous = JSON.parse(localStorage.getItem(previousKey) || '[]');
                      if (Array.isArray(previous)) localStorage.setItem(set.key, JSON.stringify(previous.filter((id) => Number.isInteger(id) && id >= 0 && id < 11)));
                    }
                  } catch { /* Keep existing progress when storage is available. */ }
                }
                const card = document.createElement('article');
                card.className = 'phrase-card glass-card';
                card.innerHTML = '<div class="phrase-card-header"><div class="phrase-card-title"><span class="phrase-card-icon"><i class="fa-solid fa-link" aria-hidden="true"></i></span><h4></h4></div><span class="phrase-card-status"></span></div><div class="phrase-card-progress-label"><span>Đã ghép</span><span class="phrase-card-percent"></span></div><div class="phrase-card-track" role="progressbar" aria-label="Tiến độ ghép" aria-valuemin="0"><div class="phrase-card-fill"></div></div><div class="phrase-card-footer"><span class="phrase-card-count"></span><button class="phrase-start" type="button"><span></span><i class="fa-solid fa-arrow-right" aria-hidden="true"></i></button></div>';
                card.querySelector('h4').textContent = set.title;
                set.card = card;
                card.querySelector('.phrase-start').addEventListener('click', (event) => openPhrasePractice(set, event.currentTarget));
                grid.appendChild(card);
                phraseSets.push(set);
              });
              phraseCatalog.appendChild(catalogGroup);
            });

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
                set.card.querySelector('.phrase-card-count').innerHTML = '<i class="fa-solid fa-link" aria-hidden="true"></i>';
                set.card.querySelector('.phrase-card-count').append(`${count}/${set.pairs.length} cụm`);
                set.card.querySelector('.phrase-card-fill').style.width = `${percent}%`;
                const track = set.card.querySelector('.phrase-card-track');
                track.setAttribute('aria-valuemax', String(set.pairs.length));
                track.setAttribute('aria-valuenow', String(count));
                set.card.querySelector('.phrase-start > span').textContent = count === 0 ? 'Bắt đầu ghép' : count === set.pairs.length ? 'Ghép lại' : 'Ghép tiếp';
              });
            }
            refreshPhraseCatalog();

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
            let phraseSession = null;
            let phraseAdvanceTimer = null;

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
              const pool = [...set.pairs, ...phraseBanks[set.topic]];
              const optionsFor = (side) => {
                const alternatives = [...new Set(pool.map((item) => item[side]))].filter((value) => value !== pair[side]);
                return shuffled([pair[side], ...shuffled(alternatives).slice(0, 3)]);
              };
              return { pair, sentence, leftOptions: optionsFor(0), rightOptions: optionsFor(1) };
            }

            function currentPhraseQuestion() {
              return phraseSession.question;
            }

            function clearPhraseAdvance() {
              if (phraseAdvanceTimer !== null) window.clearTimeout(phraseAdvanceTimer);
              phraseAdvanceTimer = null;
            }

            function updatePhrasePracticeProgress() {
              const { index, order, answered, complete, maxVisited } = phraseSession;
              main.querySelector('#phrasePracticeCounter').textContent = complete ? `Đã ghép ${answered.size}/${order.length}` : `Câu ${index + 1}/${order.length}`;
              [...main.querySelector('#phrasePracticeProgress').children].forEach((step, position) => {
                const isCurrent = position === index;
                if (isCurrent) step.setAttribute('aria-current', 'step');
                else step.removeAttribute('aria-current');
                step.classList.toggle('is-answered', answered.has(order[position]));
                step.disabled = complete || (position > maxVisited && !answered.has(order[position]));
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

            function updatePhraseExplanation() {
              const { pair, sentence } = currentPhraseQuestion();
              const solved = phraseSession.answered.has(phraseSession.order[phraseSession.index]);
              main.querySelector('#phrasePracticeExplanation').hidden = !phraseExplain.checked || !solved || phraseSession.complete;
              main.querySelector('#phrasePracticeExplanationText').textContent = `${pair[0]} ${pair[1]}: ${pair[2]}. Câu hoàn chỉnh: ${sentence[0]} ${pair[0]} ${pair[1]} ${sentence[1]}`;
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
              phraseBookmark.innerHTML = `<i class="fa-${saved ? 'solid' : 'regular'} fa-bookmark" aria-hidden="true"></i>`;
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
              const { pair, sentence, leftOptions, rightOptions } = session.question;
              const solved = session.answered.has(id);
              phraseLeft.replaceChildren();
              phraseRight.replaceChildren();
              main.querySelector('#phraseExerciseBody').hidden = false;
              main.querySelector('#phrasePracticeResult').hidden = true;
              phraseBookmark.hidden = false;
              main.querySelector('#phraseSentenceBefore').textContent = sentence[0];
              main.querySelector('#phraseSentenceAfter').textContent = sentence[1];
              main.querySelector('#phrasePracticeHint').textContent = `Gợi ý: ${pair[2]}`;
              main.querySelector('#phrasePracticeStatus > span').textContent = solved ? 'Đã ghép' : 'Cụm chưa ghép';
              ['Left', 'Right'].forEach((side, index) => {
                const slot = main.querySelector(`#phraseAnswer${side}`);
                slot.textContent = solved ? pair[index] : '';
                slot.classList.toggle('is-correct', solved);
                slot.classList.remove('is-wrong');
              });
              phraseFeedback.textContent = solved ? `Chính xác! ${pair[0]} ${pair[1]} — ${pair[2]}.` : '';
              ['left', 'right'].forEach((side) => {
                const options = side === 'left' ? leftOptions : rightOptions;
                options.forEach((value, position) => {
                  const choice = document.createElement('button');
                  choice.type = 'button';
                  choice.className = 'phrase-match-choice';
                  const correct = value === pair[side === 'left' ? 0 : 1];
                  choice.setAttribute('aria-pressed', String(solved && correct));
                  choice.disabled = solved;
                  choice.classList.toggle('is-matched', solved && correct);
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
              updatePhraseBookmark();
              updatePhraseExplanation();
              updatePhrasePracticeProgress();
            }

            function speakPhrase(text, onComplete) {
              if (!phraseAutoSpeak.checked) {
                if (onComplete) onComplete();
                return;
              }
              if (!('speechSynthesis' in window)) {
                phraseFeedback.textContent = 'Trình duyệt này chưa hỗ trợ phát âm.';
                if (onComplete) onComplete();
                return;
              }
              window.speechSynthesis.cancel();
              const utterance = new SpeechSynthesisUtterance(text);
              utterance.lang = 'en-US';
              utterance.rate = .9;
              if (onComplete) {
                utterance.onend = onComplete;
                utterance.onerror = onComplete;
              }
              window.speechSynthesis.speak(utterance);
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
              }, 1400);
            }

            function choosePhrasePart(side, value, choice) {
              const session = phraseSession;
              const id = session.order[session.index];
              if (session.complete || session.answered.has(id)) return;
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
              phraseFeedback.textContent = '';
              const { left, right } = session.selection;
              if (!left || !right) {
                speakPhrase(value);
                return;
              }
              if (left.value !== pair[0] || right.value !== pair[1]) {
                [left.button, right.button, main.querySelector('#phraseAnswerLeft'), main.querySelector('#phraseAnswerRight')].forEach((node) => node.classList.add('is-wrong'));
                phraseFeedback.textContent = 'Chưa đúng. Cụm từ cần phù hợp với ngữ cảnh và gợi ý.';
                speakPhrase(value);
                return;
              }
              session.answered.add(id);
              [phraseLeft, phraseRight].forEach((part) => [...part.children].forEach((button) => { button.disabled = true; }));
              [left.button, right.button].forEach((button) => button.classList.add('is-matched'));
              [main.querySelector('#phraseAnswerLeft'), main.querySelector('#phraseAnswerRight')].forEach((slot) => slot.classList.add('is-correct'));
              main.querySelector('#phrasePracticeStatus > span').textContent = 'Đã ghép';
              phraseFeedback.textContent = `Chính xác! ${pair[0]} ${pair[1]} — ${pair[2]}.`;
              const saved = readPhraseProgress(session.set);
              session.answered.forEach((answeredId) => saved.add(answeredId));
              try { localStorage.setItem(session.set.key, JSON.stringify([...saved])); } catch { /* Keep the answer available in this session. */ }
              refreshPhraseCatalog();
              updatePhraseExplanation();
              updatePhrasePracticeProgress();
              const renderToken = session.renderToken;
              speakPhrase(`${sentence[0]} ${pair[0]} ${pair[1]} ${sentence[1]}`, () => {
                if (phraseSession === session && phraseSession.renderToken === renderToken && phraseSession.order[phraseSession.index] === id) schedulePhraseAdvance();
              });
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
                set, trigger, order, answered, index, maxVisited: index, complete: false, bookmarks: new Map(), renderToken: 0,
                scrollY: window.scrollY,
                library: [...main.children].filter((node) => node !== phrasePractice && node.tagName !== 'SCRIPT').map((node) => [node, node.hidden])
              };
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
            const lessonWordSets = {
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
            let lessonTypingUnlocked = false;
            let lessonTypingValue = '';
            let lessonTypingResult = null;
            let lessonReviewUnlocked = false;
            let lessonFastExpanded = true;
            let reviewSession = false;
            let continueSession = false;
            let completedSetSession = false;
            let reviewQuizResults = new Map();
            let reviewRatings = new Map();
            let reviewCompletedWords = new Set();

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
                const countBadge = card.querySelector('div:last-child > span');
                if (countBadge) {
                  const icon = countBadge.querySelector('i');
                  countBadge.innerHTML = '';
                  if (icon) countBadge.appendChild(icon);
                  countBadge.append(`${learnedCount}/${totalCount} từ`);
                }

                // Cập nhật % text (8%)
                const percentSpan = card.querySelector('div:nth-child(2) > span:last-child');
                if (percentSpan) {
                  percentSpan.textContent = `${percent}%`;
                }

                // Cập nhật thanh tiến độ
                const progressBar = card.querySelector('div:nth-child(3) > div');
                if (progressBar) {
                  progressBar.style.width = `${percent}%`;
                }

                // Cập nhật badge góc trên bên phải: 100% -> "Xong", 0% -> "Mới", chưa xong (>0% & <100%) -> "Đang học dở"
                const topBadge = card.querySelector('div:first-child > span:last-child');
                if (topBadge) {
                  topBadge.style.display = '';
                  if (percent === 100) {
                    topBadge.className = 'rounded-full bg-emerald-100 px-2 py-1 text-[10px] font-bold text-emerald-600 dark:bg-emerald-500/15 dark:text-emerald-300';
                    topBadge.innerHTML = '<i class="fa-solid fa-check mr-1" aria-hidden="true"></i>Xong';
                  } else if (percent === 0) {
                    topBadge.className = 'rounded-full bg-slate-100 px-2 py-1 text-[10px] font-bold text-slate-500 dark:bg-slate-700 dark:text-slate-300';
                    topBadge.innerHTML = 'Mới';
                  } else {
                    topBadge.className = 'rounded-full bg-amber-100 px-2 py-1 text-[10px] font-bold text-amber-700 dark:bg-amber-500/15 dark:text-amber-300';
                    topBadge.innerHTML = 'Đang học dở';
                  }
                }

                // Cập nhật nút Học tiếp / Học bài
                const studyBtn = card.querySelector('.study-set');
                if (studyBtn) {
                  const icon = studyBtn.querySelector('i');
                  studyBtn.innerHTML = '';
                  if (learnedCount > 0 && percent < 100) {
                    studyBtn.append('Học tiếp ');
                  } else {
                    studyBtn.append('Học bài ');
                  }
                  if (icon) studyBtn.appendChild(icon);
                }
              });

              // Cập nhật thanh tiến độ tổng và thông số toàn trang: Đã học, Đang học, Đã thuộc
              updateGlobalVocabStats();
            }

            function updateGlobalVocabStats() {
              const allWords = new Map(); // Lưu từ duy nhất theo lowercase
              Object.values(lessonWordSets).forEach((items) => {
                items.forEach((item) => {
                  const key = item.word.trim().toLocaleLowerCase();
                  if (!allWords.has(key)) {
                    allWords.set(key, item);
                  }
                });
              });

              let totalLearned = 0;
              let totalLearning = 0;
              let totalMastered = 0;

              allWords.forEach((item) => {
                const skipped = isWordSkipped(item);
                const rating = getWordRating(item);
                const isLearned = skipped || rating === 'hard' || rating === 'good' || rating === 'easy' || Boolean(item.learned);

                if (isLearned) {
                  totalLearned++;
                  // Đã thuộc: đánh giá 'easy' (Thuộc lòng) hoặc 'good'
                  if (rating === 'easy' || rating === 'good') {
                    totalMastered++;
                  } else {
                    // Đang học dở / cần củng cố
                    totalLearning++;
                  }
                }
              });

              const totalSystemWords = 4514;
              const globalPercent = Math.min(100, Math.round((totalLearned / totalSystemWords) * 100 * 10) / 10); // Làm tròn 1 chữ số thập phân

              const learnedEl = main.querySelector('#vocabStatLearned');
              const learningEl = main.querySelector('#vocabStatLearning');
              const masteredEl = main.querySelector('#vocabStatMastered');
              const progressBar = main.querySelector('#vocabGlobalProgressBar');

              if (learnedEl) learnedEl.textContent = `${totalLearned}/${totalSystemWords} từ`;
              if (learningEl) learningEl.textContent = String(totalLearning);
              if (masteredEl) masteredEl.textContent = String(totalMastered);
              if (progressBar) {
                // Hiển thị độ rộng tối thiểu 1% nếu đã học > 0 từ để thanh có màu trực quan
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
              reviewStartButton.disabled = words.length === 0;
              reviewDueSummary.textContent = words.length
                ? `${words.length} từ đã học sẵn sàng ôn`
                : 'Chưa có từ đã học cần ôn';
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

            function updateReviewWordList() {
              reviewWordCount.textContent = String(lessonWords.length);
              reviewWordItems.replaceChildren(...lessonWords.map((item, index) => {
                const row = document.createElement('li');
                const button = document.createElement('button');
                button.type = 'button';
                button.setAttribute('aria-current', String(index === lessonIndex));
                const number = document.createElement('span');
                number.textContent = String(index + 1);
                const word = document.createElement('span');
                word.textContent = item.word;
                button.append(number, word);
                const rating = getWordRating(item);
                const showSkip = !reviewSession && isWordSkipped(item);
                const showAgain = rating === 'again' && (reviewSession ? reviewCompletedWords.has(item.word) : true);
                const showCheck = reviewSession
                  ? (!showAgain && reviewCompletedWords.has(item.word))
                  : (!showSkip && !showAgain && (completedSetSession || isWordLearned(item)));
                if (showSkip) {
                  const skipIcon = document.createElement('i');
                  skipIcon.className = 'fa-solid fa-minus review-word-list-skip';
                  skipIcon.setAttribute('aria-hidden', 'true');
                  button.append(skipIcon);
                } else if (showAgain) {
                  const againIcon = document.createElement('i');
                  againIcon.className = 'fa-solid fa-rotate-left review-word-list-again';
                  againIcon.setAttribute('aria-hidden', 'true');
                  button.append(againIcon);
                } else if (showCheck) {
                  const check = document.createElement('i');
                  check.className = 'fa-solid fa-check review-word-list-check';
                  check.setAttribute('aria-hidden', 'true');
                  button.append(check);
                }
                button.addEventListener('click', () => {
                  lessonIndex = index;
                  renderLessonWord();
                  updateReviewWordList();
                });
                row.append(button);
                return row;
              }));
            }

            function syncReviewLayout() {
              const wordDone = isCurrentWordDone();
              lessonView.dataset.review = String(reviewSession);
              lessonView.dataset.completed = String(wordDone);
              reviewWordList.hidden = false;
              lessonFlipButton.innerHTML = reviewSession
                ? '<i class="fa-regular fa-circle-check mr-2" aria-hidden="true"></i>Kiểm tra'
                : '<i class="fa-solid fa-rotate mr-2" aria-hidden="true"></i>Lật thẻ';
              if (!reviewSession) {
                lessonModeLabel.textContent = 'Học từ mới';
              }
              const quickCheckBtn = main.querySelector('#lessonQuickCheck');
              if (quickCheckBtn) {
                quickCheckBtn.innerHTML = wordDone
                  ? 'Tiếp'
                  : '<i class="fa-regular fa-circle-check mr-2" aria-hidden="true"></i>Kiểm tra nhanh';
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
                ? '<i class="fa-solid fa-chevron-up mr-2" aria-hidden="true"></i>Thu gọn'
                : '<i class="fa-solid fa-chevron-down mr-2" aria-hidden="true"></i>Xem thêm';
            }

            function setLessonMode(mode) {
              const isLesson = mode === 'lesson';
              const isQuiz = mode === 'quiz';
              const isTyping = mode === 'typing';
              const isReview = mode === 'review';
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
              }
              if (isReview) renderLessonReview();
              updateFastModeUI();
              syncReviewLayout();
              updateLessonProgressBar();
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
                    letter.innerHTML = '<i class="fa-solid fa-check" aria-hidden="true"></i>';
                  } else if (index === lessonQuizAnswer) {
                    button.classList.add('is-wrong');
                    letter.innerHTML = '<i class="fa-solid fa-xmark" aria-hidden="true"></i>';
                  } else {
                    button.classList.add('is-muted');
                  }
                }
                button.addEventListener('click', () => {
                  if (lessonQuizAnswer !== null) return;
                  lessonQuizAnswer = index;
                  renderLessonQuiz();
                });
                return button;
              }));
              const hasAnswered = lessonQuizAnswer !== null;
              const isCorrect = lessonQuizAnswer === quiz.correctIndex;
              const feedback = main.querySelector('#lessonQuizFeedback');
              feedback.hidden = !hasAnswered;
              feedback.className = `lesson-quiz-feedback ${hasAnswered ? (isCorrect ? 'is-right' : 'is-wrong') : ''}`.trim();
              feedback.textContent = hasAnswered
                ? (isCorrect ? 'Chính xác! Đáp án đúng đã được tô xanh.' : 'Chưa đúng. Đáp án đúng đã được tô xanh.')
                : '';
              main.querySelector('#lessonQuizForgot').hidden = hasAnswered;
              const nextButton = main.querySelector('#lessonQuizNext');
              nextButton.hidden = !hasAnswered;
              if (reviewSession) nextButton.textContent = 'Xem đánh giá';
              else nextButton.textContent = 'Tiếp';
            }

            function renderLessonTyping() {
              const item = lessonWords[lessonIndex];
              const typing = item.typing || {
                before: 'Please',
                after: 'the office equipment before the meeting.',
                translation: `Vui lòng ${item.meaning} thiết bị văn phòng trước cuộc họp.`
              };
              const input = main.querySelector('#lessonTypingInput');
              main.querySelector('#lessonTypingBefore').textContent = `${typing.before} `;
              main.querySelector('#lessonTypingAfter').textContent = ` ${typing.after}`;
              main.querySelector('#lessonTypingTranslation').textContent = typing.translation;
              input.value = lessonTypingValue;
              input.disabled = lessonTypingResult !== null;
              input.classList.toggle('is-correct', lessonTypingResult === true);
              input.classList.toggle('is-wrong', lessonTypingResult === false);
              const feedback = main.querySelector('#lessonTypingFeedback');
              feedback.hidden = lessonTypingResult === null;
              feedback.className = `lesson-typing-feedback ${lessonTypingResult === null ? '' : lessonTypingResult ? 'is-correct' : 'is-wrong'}`.trim();
              feedback.textContent = lessonTypingResult === null
                ? ''
                : lessonTypingResult ? 'Chính xác! Bạn đã điền đúng từ.' : `Chưa đúng. Đáp án là “${item.word}”.`;
              const submit = main.querySelector('#lessonTypingSubmit');
              submit.textContent = lessonTypingResult === null ? 'Kiểm tra' : 'Xem đánh giá';
              submit.classList.toggle('is-ready', lessonTypingResult !== null);
            }

            function renderLessonReview() {
              const item = lessonWords[lessonIndex];
              const example = item.examples?.[0] || [`Please ${item.word} the office equipment before the meeting.`, `Vui lòng ${item.meaning} thiết bị văn phòng trước cuộc họp.`];
              const firstCollocation = item.collocations?.[0] || `${item.word} — ${item.meaning}`;
              const [collocation, collocationMeaning = ''] = firstCollocation.split(' — ');
              const quiz = item.quiz || { correctIndex: 3 };
              const quizCorrect = lessonQuizAnswer === quiz.correctIndex;
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
                main.querySelector('#lessonReviewQuizText').textContent = currentQuizCorrect ? 'Chính xác' : 'Chưa đúng nghĩa';
                main.querySelector('#lessonReviewTypingResult').hidden = true;
              } else {
                main.querySelector('#lessonReviewTypingResult').hidden = false;
                main.querySelector('#lessonReviewQuizText').textContent = quizCorrect ? 'Chính xác' : 'Chưa đúng nghĩa';
                main.querySelector('#lessonReviewTypingText').textContent = lessonTypingResult ? 'Chính xác' : 'Chưa đúng từ';
              }
              main.querySelector('#lessonReviewQuizResult').classList.toggle('result-right', reviewSession ? reviewQuizResults.get(item.word) === true : quizCorrect);
              main.querySelector('#lessonReviewQuizResult').classList.toggle('result-wrong', reviewSession ? reviewQuizResults.get(item.word) === false : !quizCorrect);
              main.querySelector('#lessonReviewTypingResult').classList.toggle('result-right', lessonTypingResult === true);
              main.querySelector('#lessonReviewTypingResult').classList.toggle('result-wrong', lessonTypingResult !== true);
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
              if (lessonIndex + 1 < lessonWords.length) {
                lessonIndex += 1;
                lessonQuizAnswer = null;
                lessonTypingUnlocked = false;
                lessonTypingValue = '';
                lessonTypingResult = null;
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
              container.replaceChildren(...(values || []).map((value) => {
                const chip = document.createElement('span');
                chip.className = `lesson-chip ${type}`.trim();
                chip.textContent = value;
                return chip;
              }));
            }

            function renderLessonDetail(item) {
              const detail = item.definition ? item : {
                ...item,
                definition: `${item.meaning}.`,
                examples: [[`Please ${item.word} the office equipment before the meeting.`, `Vui lòng ${item.meaning} thiết bị văn phòng trước cuộc họp.`]],
                collocations: [], synonyms: [], antonyms: [], family: [],
                mistake: ['', '', ''], tip: '', tags: ['#office-technology', '#toeic']
              };
              const fastExample = detail.examples[0] || ['', ''];
              const firstCollocation = detail.collocations[0] || `${item.word} — ${item.meaning}`;
              const [fastCollocation, fastCollocationMeaning = ''] = firstCollocation.split(' — ');
              const fastTypeEl = main.querySelector('#lessonFastType');
              if (fastTypeEl) fastTypeEl.textContent = detail.type;
              main.querySelector('#lessonFastMeaning').textContent = detail.meaning;
              main.querySelector('#lessonFastDefinition').textContent = detail.definition;
              main.querySelector('#lessonFastExample').textContent = `“${fastExample[0]}”`;
              main.querySelector('#lessonFastTranslation').textContent = fastExample[1];
              main.querySelector('#lessonFastCollocation').textContent = firstCollocation;
              main.querySelector('#lessonFastCollocationMeaning').textContent = fastCollocationMeaning;
              main.querySelector('#lessonFastTip').textContent = detail.tip || `Hãy đặt câu với “${item.word}” để ghi nhớ.`;
              main.querySelector('#lessonDetailType').textContent = detail.type;
              main.querySelector('#lessonDetailMeaning').textContent = detail.meaning;
              main.querySelector('#lessonDetailDefinition').textContent = detail.definition;
              const examples = main.querySelector('#lessonExamples');
              examples.replaceChildren(...detail.examples.map(([english, vietnamese]) => {
                const card = document.createElement('div');
                card.className = 'lesson-example';
                const label = document.createElement('div');
                label.className = 'lesson-example-label';
                label.textContent = '❞ VÍ DỤ';
                const sentence = document.createElement('p');
                sentence.textContent = `“${english}”`;
                const translation = document.createElement('span');
                translation.textContent = vietnamese;
                card.append(label, sentence, translation);
                return card;
              }));
              fillChips(main.querySelector('#lessonCollocations'), detail.collocations);
              fillChips(main.querySelector('#lessonSynonyms'), detail.synonyms, 'synonym');
              fillChips(main.querySelector('#lessonAntonyms'), detail.antonyms, 'antonym');
              main.querySelector('#lessonWordFamily').replaceChildren(...detail.family.map((line) => {
                const row = document.createElement('div');
                const [word, ...description] = line.split(' · ');
                const strong = document.createElement('strong');
                strong.textContent = word;
                row.append(strong, ` · ${description.join(' · ')}`);
                return row;
              }));
              const [wrong, right, note] = detail.mistake;
              main.querySelector('#lessonMistakeWrong').textContent = wrong ? `× ${wrong}` : '';
              main.querySelector('#lessonMistakeRight').textContent = right ? `✓ ${right}` : '';
              main.querySelector('#lessonMistakeNote').textContent = note || '';
              main.querySelector('#lessonMemoryTip').textContent = detail.tip;
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
              lessonWord.textContent = item.word;
              lessonMeaning.textContent = item.meaning;
              lessonMeaning.hidden = true;
              lessonWord.hidden = false;
              lessonWordType.textContent = item.type;
              lessonPronunciationUs.textContent = item.us;
              lessonPronunciationUk.textContent = item.uk;
              lessonCounter.textContent = `Thẻ ${lessonIndex + 1}/${lessonWords.length}`;
              renderLessonDetail(item);
              lessonQuizAnswer = null;
              lessonIsFlipped = wordDone;
              lessonLessonUnlocked = wordDone;
              lessonQuizUnlocked = false;
              lessonTypingUnlocked = false;
              lessonTypingValue = '';
              lessonTypingResult = null;
              lessonReviewUnlocked = false;
              lessonFastExpanded = !lessonFastMode.checked;
              setLessonMode(lessonIsFlipped ? 'lesson' : 'term');
              updateLessonProgressBar();
              lessonBookmark.setAttribute('aria-pressed', String(localStorage.getItem(`saved-vocab:${item.word}`) === 'true'));
              lessonBookmark.innerHTML = lessonBookmark.getAttribute('aria-pressed') === 'true'
                ? '<i class="fa-solid fa-bookmark" aria-hidden="true"></i>'
                : '<i class="fa-regular fa-bookmark" aria-hidden="true"></i>';
              syncReviewLayout();
            }

            function speakLessonWord(locale) {
              if (!('speechSynthesis' in window)) {
                lessonLiveMessage.textContent = 'Trình duyệt này chưa hỗ trợ phát âm.';
                return;
              }
              window.speechSynthesis.cancel();
              const utterance = new SpeechSynthesisUtterance(lessonWords[lessonIndex].word);
              utterance.lang = locale;
              utterance.rate = lessonFastMode.checked ? 1.15 : 0.9;
              window.speechSynthesis.speak(utterance);
            }

            function openLesson(card) {
              hideLessonComplete();
              reviewSession = false;
              const studyBtn = card.querySelector('.study-set');
              continueSession = Boolean(studyBtn && studyBtn.textContent.includes('Học tiếp'));
              lessonModeLabel.textContent = 'Học từ mới';
              lessonOpener = document.activeElement;
              lessonSetTitle.textContent = card.dataset.title;
              lessonWords = lessonWordSets[card.dataset.title] || [
                { word: 'practice', meaning: 'thực hành', type: 'VERB', us: '/ˈpræktɪs/', uk: '/ˈpræktɪs/' },
                { word: 'improve', meaning: 'cải thiện', type: 'VERB', us: '/ɪmˈpruːv/', uk: '/ɪmˈpruːv/' }
              ];
              completedSetSession = lessonWords.length > 0
                ? lessonWords.every(isWordLearned)
                : card.textContent.includes('100%');
              lessonIndex = 0;
              lessonLiveMessage.textContent = '';
              renderLessonWord();
              if (lessonView.hidden) {
                lessonSavedVisibility = lessonLibraryNodes.map((node) => [node, node.hidden]);
                lessonLibraryNodes.forEach((node) => { node.hidden = true; });
                lessonView.hidden = false;
              }
              const activeTab = main.querySelector('.vocab-lesson-tab[aria-selected="true"]');
              if (activeTab && !isCurrentWordDone()) activeTab.focus();
              if (lessonAutoPronounce.checked) speakLessonWord('en-US');
            }

            function closeLesson() {
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

            function startReview() {
              hideLessonComplete();
              const words = getLearnedReviewWords();
              if (!words.length) return;
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

            main.querySelectorAll('.study-set').forEach((button) => button.addEventListener('click', () => {
              openLesson(button.closest('.vocab-card'));
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
              lessonFastExpanded = !lessonFastMode.checked;
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
                const expanded = reviewWordListToggle.getAttribute('aria-expanded') !== 'false';
                reviewWordListToggle.setAttribute('aria-expanded', String(!expanded));
                reviewWordItems.hidden = expanded;
                reviewWordList.classList.toggle('is-collapsed', expanded);
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
              if (lessonQuizAnswer !== null) return;
              lessonQuizAnswer = -1;
              renderLessonQuiz();
            });
            main.querySelector('#lessonQuizNext').addEventListener('click', advanceQuiz);
            const lessonTypingInput = main.querySelector('#lessonTypingInput');
            const lessonTypingSubmit = main.querySelector('#lessonTypingSubmit');
            lessonTypingInput.addEventListener('input', () => { lessonTypingValue = lessonTypingInput.value; });
            lessonTypingInput.addEventListener('keydown', (event) => {
              if (event.key === 'Enter' && lessonTypingResult === null) lessonTypingSubmit.click();
            });
            lessonTypingSubmit.addEventListener('click', () => {
              if (lessonTypingResult !== null) {
                lessonReviewUnlocked = true;
                setLessonMode('review');
                lessonLiveMessage.textContent = 'Đã mở phần đánh giá từ vựng.';
                return;
              }
              lessonTypingValue = lessonTypingInput.value;
              lessonTypingResult = lessonTypingValue.trim().toLocaleLowerCase() === lessonWords[lessonIndex].word.toLocaleLowerCase();
              renderLessonTyping();
              lessonLiveMessage.textContent = lessonTypingResult ? 'Bạn đã gõ đúng từ.' : `Đáp án đúng là ${lessonWords[lessonIndex].word}.`;
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

            main.querySelectorAll('.lesson-review .lesson-rating-button').forEach((button) => button.addEventListener('click', () => {
              const item = lessonWords[lessonIndex];
              item.rating = button.dataset.rating;
              item.learned = button.dataset.rating !== 'again';
              item.skipped = false;
              if (reviewSession) reviewCompletedWords.add(item.word);
              try {
                localStorage.setItem(`vocab-rating:${item.word}`, button.dataset.rating);
                localStorage.removeItem(`vocab-skipped:${item.word}`);
                updateSharedStudyMetrics(button.dataset.rating !== 'again');
              } catch { /* Retain rating in active session. */ }
              refreshReviewAvailability();
              main.querySelectorAll('.lesson-rating-button').forEach((rating) => {
                rating.setAttribute('aria-pressed', String(rating === button));
              });
              lessonIsFlipped = false;
              advanceLessonWord('term');
            }));
            main.querySelectorAll('[data-fast-rating]').forEach((button) => button.addEventListener('click', () => {
              const item = lessonWords[lessonIndex];
              item.rating = button.dataset.fastRating;
              item.learned = button.dataset.fastRating !== 'again';
              item.skipped = false;
              if (reviewSession) reviewCompletedWords.add(item.word);
              try {
                localStorage.setItem(`vocab-rating:${item.word}`, button.dataset.fastRating);
                localStorage.removeItem(`vocab-skipped:${item.word}`);
                updateSharedStudyMetrics(button.dataset.fastRating !== 'again');
              } catch { /* Retain rating in active session. */ }
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
            lessonBookmark.addEventListener('click', () => {
              const item = lessonWords[lessonIndex];
              const isSaved = lessonBookmark.getAttribute('aria-pressed') === 'true';
              localStorage.setItem(`saved-vocab:${item.word}`, String(!isSaved));
              renderLessonWord();
              lessonLiveMessage.textContent = isSaved ? 'Đã bỏ lưu từ.' : 'Đã lưu từ vào sổ tay.';
            });
            lessonSkipButton.addEventListener('click', () => {
              const currentItem = lessonWords[lessonIndex];
              if (currentItem) {
                currentItem.skipped = true;
                currentItem.learned = false;
                try { localStorage.setItem(`vocab-skipped:${currentItem.word}`, 'true'); } catch { /* Keep skipped state in active session. */ }
              }
              refreshReviewAvailability();
              advanceLessonWord('term');
              if (lessonAutoPronounce.checked && !lessonView.hidden) speakLessonWord('en-US');
            });
            function openLessonFeedback(isReport) {
              triggerFeedbackModal();
              const textarea = document.querySelector('textarea[placeholder^="Nhập ý kiến"]');
              if (isReport && textarea) textarea.value = `Báo lỗi ở từ: ${lessonWords[lessonIndex].word}`;
            }
            main.querySelector('#lessonReportButton').addEventListener('click', () => openLessonFeedback(true));
            main.querySelector('#lessonFeedbackButton').addEventListener('click', () => openLessonFeedback(false));
            document.addEventListener('keydown', (event) => {
              if (event.key === 'Escape' && !lessonView.hidden) closeLesson();
            });

            // Khởi tạo cập nhật tiến độ các thẻ bộ từ ban đầu
            updateCardProgress();
          })();
