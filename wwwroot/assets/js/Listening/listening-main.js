(() => {
            const modal = document.getElementById('listeningInfoModal');
            const partText = document.getElementById('listeningModalPart');
            const titleText = document.getElementById('listeningModalTitle');
            const descriptionText = document.getElementById('listeningModalDescription');
            const metaText = document.getElementById('listeningModalMeta');
            let lastTrigger = null;
            function openInfo(trigger, part, title, description, meta) {
              lastTrigger = trigger;
              partText.textContent = part;
              titleText.textContent = title;
              descriptionText.textContent = description;
              metaText.textContent = meta;
              modal.classList.remove('hidden');
              modal.classList.add('flex');
              document.body.style.overflow = 'hidden';
              document.getElementById('closeListeningModal').focus();
            }
            function closeInfo() {
              if (modal.classList.contains('hidden')) return;
              modal.classList.add('hidden');
              modal.classList.remove('flex');
              document.body.style.overflow = '';
              if (lastTrigger) lastTrigger.focus();
            }
            const listeningTheoryScreen = document.getElementById('listeningTheoryScreen');
            const listeningTheoryContent = document.getElementById('listeningTheoryContent');
            const listeningTheoryTitle = document.getElementById('listeningTheoryTitle');
            let listeningTheoryTrigger = null;
            const theoryByPart = {
              'Part 1': {
                title: 'Mô tả tranh',
                sections: [
                  ['Đặc điểm & phân loại', 'cyan', '6 bức tranh, mỗi tranh nghe 4 câu (A–D) và chọn câu mô tả đúng nhất. Có 4 dạng tranh chính:', ['Tả người (40–50%): 1 người tập trung hành động/tư thế/trang phục; nhiều người tập trung tương tác hoặc phân bố.', 'Tả vật: trọng tâm là trạng thái của vật (phương tiện, hàng hóa, đồ đạc, cảnh vật không người).', 'Tả cảnh: ảnh góc rộng (wide shot) về không gian, thời tiết, địa điểm đặc trưng.', 'Tương tác người & vật: mối quan hệ không gian hoặc hành động tác động giữa người và vật.']],
                  ['Phương pháp quan sát', 'blue', 'Quy trình quan sát nhanh trước khi nghe:', ['Nhìn mặt/hướng nhìn: nhìn nhau → talking; nhìn xuống → reading/writing; nhìn xa → waiting/watching.', 'Nhìn tay/chân: tay đang cầm gì, chân ở tư thế nào — manh mối quan trọng cho động từ V-ing.', 'Nhìn trang phục: áo blouse → bác sĩ/y tá; mũ bảo hộ → công nhân; tạp dề → đầu bếp.', 'Nhìn biểu cảm: smiling, looking confused, focusing.', 'Quy tắc “3 giây đầu”: dùng lúc đọc Directions để “mồi” sẵn từ vựng.']],
                  ['4 dạng bẫy cần khắc cốt', 'red', '', ['Đồng âm / gần âm: ship – sheep, sign – signing, box – boxer. Nghe hết câu, đừng bắt 1 từ giống.', 'Suy diễn hành động: mô tả việc hợp lý với bối cảnh nhưng chưa thực sự diễn ra tại thời điểm chụp.', 'Sai giới từ / vị trí: đúng người đúng vật nhưng sai vị trí (on vs under, next to vs between).', 'Sai chủ thể / đối tượng: đúng hành động và bối cảnh nhưng gán cho nhầm người.']],
                  ['Ví dụ minh họa', 'purple', '', ['Tranh: người phụ nữ cầm bút, chỉ vào biểu đồ trên bảng. | The woman is presenting the data to her colleagues. | The woman is drawing a chart. (đang chỉ vào biểu đồ có sẵn, không vẽ)', 'Tranh: bãi đậu xe với vài xe máy và một ô tô. | A few vehicles are parked in the lot. | The cars are being washed. (không có hình ảnh rửa xe)']],
                  ['Lời khuyên khi luyện tập', 'orange', '', ['Kỹ thuật loại trừ: tìm 2 đáp án sai lộ liễu trước, rồi phân tích 2 đáp án còn lại.', 'Chép chính tả cả 4 đáp án A, B, C, D của câu làm sai để nhận diện rõ cái bẫy.', 'Nguyên tắc vàng: chỉ chọn những gì mắt thấy tai nghe rõ ràng, không suy diễn.']],
                  ['Ghi nhớ nhanh', 'green', '', ['Người → hiện tại tiếp diễn; Vật → bị động + tính từ trạng thái; Cảnh → góc nhìn tổng quan.', 'Luôn kiểm tra chủ ngữ – động từ – giới từ vị trí có khớp tranh không.']]
                ],
                patterns: [['Tranh tả người','Thì hiện tại tiếp diễn: S + is/are + V-ing. Từ vựng hành động, tư thế và trang phục.'],['Tranh tả vật','Câu bị động; tính từ trạng thái; There is/are để giới thiệu sự tồn tại.'],['Cảnh & bối cảnh','Mô tả tổng quan, thời tiết, địa điểm và cấu trúc không gian.'],['Người & vật','Động từ tương tác, giới từ vị trí và quan hệ không gian.']]
              },
              'Part 2': { title: 'Hỏi – đáp', sections: [
                ['Đặc điểm & phân loại','cyan','Mỗi câu gồm một câu hỏi hoặc lời nói ngắn và ba lựa chọn phản hồi. Đáp án đúng có thể trả lời trực tiếp hoặc phản hồi tự nhiên theo ngữ cảnh.',['Câu hỏi Wh-: nghe từ để hỏi who, where, when, why, what, how.','Câu hỏi Yes/No: chú ý trợ động từ và phản hồi khẳng định/phủ định.','Câu hỏi lựa chọn: nhận ra or và chọn một trong các phương án.','Câu trần thuật/yêu cầu: chọn phản hồi phù hợp tình huống, không chờ cấu trúc câu hỏi.']],
                ['Phương pháp nghe','blue','Bắt từ khóa đầu câu và xác định mục đích giao tiếp:',['Nghe từ đầu tiên: who → người; where → nơi; when → thời gian; why → lý do; how → cách thức.','Không dịch từng từ; dự đoán loại câu trả lời cần nghe.','Nghe hết cả lựa chọn trước khi quyết định.','Với câu hỏi gián tiếp, xác định ý định thay vì tìm từ lặp lại.']],
                ['Bẫy thường gặp','red','', ['Lặp lại từ trong câu hỏi nhưng trả lời sai ý.','Từ đồng âm hoặc phát âm gần giống khiến nhầm lựa chọn.','Câu trả lời đúng ngữ pháp nhưng không phù hợp tình huống.','Bỏ lỡ câu trả lời gián tiếp như “I will check the schedule.”']],
                ['Ví dụ minh họa','purple','', ['Question: Where is the meeting? | It is in Conference Room B. | At three o’clock. (trả lời thời gian, không phải nơi chốn)', 'Question: Have you sent the invoice? | I will do it this afternoon. | Yes, the office is nearby. (phản hồi tự nhiên theo ý hỏi)',]],
                ['Lời khuyên khi luyện tập','orange','', ['Ghi lại từ để hỏi và loại thông tin cần tìm.','Luyện nghe lựa chọn đến cuối, không chốt đáp án quá sớm.','Ôn các cách trả lời gián tiếp thường dùng trong hội thoại.']],
                ['Ghi nhớ nhanh','green','', ['Wh-word quyết định loại thông tin cần nghe.','Đáp án đúng ưu tiên đúng nghĩa và đúng ngữ cảnh, không chỉ lặp từ.']]
              ], patterns: [['Who / What','Tìm người, vật hoặc hành động được nhắc đến.'],['Where / When','Tập trung địa điểm, thời gian và giới từ.'],['Why / How','Nghe nguyên nhân, cách thức hoặc mức độ.'],['Phản hồi gián tiếp','Chọn câu đáp tự nhiên phù hợp tình huống.']] },
              'Part 3': { title: 'Hội thoại', sections: [
                ['Đặc điểm & phân loại','cyan','Nghe các đoạn hội thoại giữa hai hoặc nhiều người, sau đó trả lời câu hỏi về nội dung và mục đích.',['Câu hỏi ý chính: xác định bối cảnh và mục đích cuộc nói chuyện.','Câu hỏi chi tiết: nghe tên, số, thời gian, địa điểm và điều kiện.','Câu hỏi suy luận: kết hợp nhiều thông tin được nói trong đoạn.','Câu hỏi hành động tiếp theo: chú ý kế hoạch hoặc lời đề nghị cuối đoạn.']],
                ['Phương pháp nghe','blue','Đọc trước câu hỏi để xác định thông tin cần săn tìm:',['Đọc nhanh câu hỏi và gạch từ khóa trước khi audio bắt đầu.','Nhận diện người nói, quan hệ và bối cảnh trong câu mở đầu.','Theo dõi tín hiệu chuyển ý: but, actually, however, so.','Ghép từng câu hỏi với đoạn thông tin tương ứng, tránh chỉ nhớ câu cuối.']],
                ['Bẫy thường gặp','red','',['Đáp án nhắc lại đúng từ nhưng bỏ qua ý chuyển hướng.','Nhầm người nói hoặc người được nhắc đến.','Không nhận ra phương án ban đầu đã bị thay đổi.','Chọn suy luận không được hỗ trợ bởi nội dung hội thoại.']],
                ['Ví dụ minh họa','purple','',['Hội thoại: lịch giao hàng ban đầu là thứ Ba nhưng khách đề nghị đổi sang thứ Năm. | The delivery has been rescheduled for Thursday. | The delivery will arrive on Tuesday. (thông tin cũ đã được đổi)', 'Câu hỏi: What will the woman do next? | She will email the revised schedule. | She will call the supplier yesterday. (sai thời điểm và không có căn cứ)']],
                ['Lời khuyên khi luyện tập','orange','',['Chia đoạn nghe thành mở đầu, vấn đề, giải pháp và kết thúc.','Ghi từ khóa ngắn, không cố viết nguyên câu.','Sau khi làm, tìm lại đúng câu chứa bằng chứng cho mỗi đáp án.']],
                ['Ghi nhớ nhanh','green','',['Nghe ai nói, nói với ai và vì mục đích gì.','Chú ý thông tin được sửa đổi sau but, actually hoặc instead.']]
              ], patterns: [['Ý chính','Bối cảnh, chủ đề và mục đích cuộc trò chuyện.'],['Chi tiết','Tên riêng, con số, lịch hẹn và địa điểm.'],['Suy luận','Kết hợp bằng chứng từ nhiều lượt lời.'],['Hành động tiếp','Nghe kế hoạch, lời hứa hoặc đề xuất cuối đoạn.']] },
              'Part 4': { title: 'Bài nói ngắn', sections: [
                ['Đặc điểm & phân loại','cyan','Nghe một người nói trong bối cảnh công việc hoặc đời sống rồi trả lời câu hỏi.',['Thông báo: thay đổi lịch, dịch vụ hoặc quy định.','Tin nhắn/điện thoại: mục đích gọi và yêu cầu cần xử lý.','Quảng cáo/giới thiệu: sản phẩm, lợi ích, điều kiện hoặc ưu đãi.','Hướng dẫn/sự kiện: địa điểm, thời gian và việc người nghe cần làm.']],
                ['Phương pháp nghe','blue','Dựa vào ngữ cảnh và cấu trúc của bài nói:',['Nhận diện loại bài nói từ câu mở đầu và giọng điệu.','Đọc câu hỏi trước, dự đoán loại thông tin sẽ xuất hiện.','Theo dõi tín hiệu trình tự: first, next, finally, by the way.','Chú ý tên, số điện thoại, ngày giờ và địa chỉ.']],
                ['Bẫy thường gặp','red','',['Nhầm thông tin trước và sau khi có thay đổi.','Bỏ qua điều kiện hoặc ngoại lệ trong thông báo.','Nhầm người nhận thông tin với người thực hiện hành động.','Đáp án đúng một phần nhưng sai thời gian hoặc địa điểm.']],
                ['Ví dụ minh họa','purple','',['Thông báo: chuyến tàu chuyển sang sân ga số 4 do bảo trì. | Passengers should board at platform four. | The train leaves from platform two. (thông tin cũ đã thay đổi)', 'Quảng cáo: giảm giá áp dụng khi đăng ký trước cuối tháng. | Register by the end of the month to receive a discount. | The discount is available all year. (bỏ qua thời hạn)']],
                ['Lời khuyên khi luyện tập','orange','',['Nghe tín hiệu mở đầu để đoán loại bài nói.','Ghi nhanh số và tên riêng, rồi đối chiếu câu hỏi.','Đặc biệt chú ý điều kiện, ngoại lệ và thông tin được cập nhật.']],
                ['Ghi nhớ nhanh','green','',['Xác định ai đang nói, nói với ai và mục đích gì.','Thông tin cập nhật sau cùng thường là đáp án cần chọn.']]
              ], patterns: [['Thông báo','Thay đổi, lý do và hướng dẫn cho người nghe.'],['Tin nhắn','Người gọi, mục đích và việc cần làm tiếp theo.'],['Quảng cáo','Sản phẩm, lợi ích, giá và thời hạn ưu đãi.'],['Hướng dẫn','Trình tự, thời gian, địa điểm và yêu cầu.']] }
            };
            const escapeTheoryText = value => String(value).replace(/[&<>"']/g, char => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
            function renderListeningTheory(button) {
              const part = button.dataset.part || 'Part 1';
              const theory = theoryByPart[part] || theoryByPart['Part 1'];
              const title = button.dataset.title || theory.title;
              const description = button.dataset.description || '';
              listeningTheoryTitle.textContent = `${title} — ${theory.title}`;
              const sections = theory.sections.map((section, index) => {
                const [heading, tone, intro, rows] = section;
                const contents = heading === 'Ví dụ minh họa'
                  ? `<div class="listening-theory-examples">${rows.map(row => { const [scene, good, bad] = row.split(' | '); return `<article class="listening-theory-example">${escapeTheoryText(scene)}<p><span class="good">✓ Nên chọn:</span> ${escapeTheoryText(good)}</p><p><span class="bad">✕ Cần tránh:</span> ${escapeTheoryText(bad)}</p></article>`; }).join('')}</div>`
                  : `<ul class="${index === 0 ? 'listening-theory-list' : ''}">${rows.map(row => `<li>${escapeTheoryText(row)}</li>`).join('')}</ul>`;
                return `<section class="listening-theory-card ${tone}"><header class="listening-theory-card-heading"><span class="listening-theory-card-icon"><i class="fa-solid ${['fa-book-open','fa-compass','fa-triangle-exclamation','fa-comment-dots','fa-lightbulb','fa-circle-check'][index]}" aria-hidden="true"></i></span><h2>${escapeTheoryText(heading)}</h2><span class="listening-theory-card-number">${String(index + 1).padStart(2,'0')}</span></header>${intro ? `<p class="listening-theory-card-intro">${escapeTheoryText(intro)}</p>` : ''}${contents}</section>`;
              }).join('');
              const patterns = theory.patterns.map((item, index) => `<article class="listening-theory-pattern" style="--theory-accent:${['#39bfd2','#8068e8','#edaa30','#39a77a'][index]};--theory-edge:${['#79d9e5','#ae9cf8','#f8c86d','#79c9a8'][index]};--theory-bg:${['#dff5f7','#e7e3fb','#fbf0dc','#e1f1e9'][index]}"><strong>${escapeTheoryText(item[0])}</strong>${escapeTheoryText(item[1])}</article>`).join('');
              listeningTheoryContent.innerHTML = `<section class="listening-theory-hero"><div class="listening-theory-hero-copy"><span class="listening-theory-part"><i class="fa-solid fa-headphones" aria-hidden="true"></i> ${escapeTheoryText(part)}</span><h1>${escapeTheoryText(title)} — ${escapeTheoryText(theory.title)}</h1><p>${escapeTheoryText(description)}</p><div class="listening-theory-accent" aria-hidden="true"><span></span><span></span><span></span></div></div><img class="listening-theory-owl" src="/assets/images/Listening/listening-practice-buddy-owl.webp" alt="Cú TART hướng dẫn luyện nghe"></section>${sections}<section class="listening-theory-card"><header class="listening-theory-card-heading"><span class="listening-theory-card-icon"><i class="fa-solid fa-sparkles" aria-hidden="true"></i></span><h2>Điểm nổi bật theo dạng câu</h2></header><div class="listening-theory-patterns">${patterns}</div></section>`;
              listeningTheoryScreen.hidden = false;
              listeningTheoryTrigger = button;
              document.body.style.overflow = 'hidden';
              document.getElementById('closeListeningTheory').focus({preventScroll:true});
              document.getElementById('listeningTheoryScroll').scrollTop = 0;
            }
            function closeListeningTheory() {
              if (listeningTheoryScreen.hidden) return;
              listeningTheoryScreen.hidden = true;
              document.body.style.overflow = '';
              if (listeningTheoryTrigger) listeningTheoryTrigger.focus({preventScroll:true});
            }
            document.querySelectorAll('.listen-theory').forEach(button => button.addEventListener('click', () => renderListeningTheory(button)));
            document.getElementById('closeListeningTheory').addEventListener('click', closeListeningTheory);
            document.getElementById('listeningTheoryPractice').addEventListener('click', () => {
              const trigger = listeningTheoryTrigger;
              closeListeningTheory();
              if (trigger) trigger.closest('.listen-part')?.scrollIntoView({behavior:'smooth', block:'start'});
            });
            document.addEventListener('keydown', event => { if (event.key === 'Escape') closeListeningTheory(); });
            const practiceQuestionsData = {
              'Part 1': {
                part: 'Part 1',
                title: 'Tranh t\u1EA3 ng\u01B0\u1EDDi',
                heading: 'Part 1 - Photographs (Tranh t\u1EA3 ng\u01B0\u1EDDi)',
                subheading: 'ETS 2019 - Test 2 \u00B7 C\u00E2u 6',
                test: 'ETS 2019 - Test 2',
                prompt: 'Select the one statement that best describes what you see in the picture.',
                hasPicture: true,
                pictureSrc: '/assets/images/Listening/listening-part1-people.jpg',
                pictureAlt: 'H\u00E0nh kh\u00E1ch \u0111ang ng\u1ED3i ch\u1EDD t\u1EA1i nh\u00E0 ga',
                questionNum: '6.',
                totalCount: '18',
                counterText: '1/18',
                duration: 27,
                durationFormatted: '00:27',
                audioText: 'Number 6. Look at the picture marked number 6 in your test book. (A) Some passengers are waiting in the terminal. (B) Some passengers are boarding the train. (C) One of the women is handing out tickets. (D) One of the men is standing at a counter.',
                questionText: '',
                questionVi: '',
                correctAnswer: 'A',
                options: [
                  { key: 'A', text: '(A)', transcript: 'Some passengers are waiting in the terminal.', vi: 'M\u1ED9t s\u1ED1 h\u00E0nh kh\u00E1ch \u0111ang \u0111\u1EE3i trong nh\u00E0 ga.' },
                  { key: 'B', text: '(B)', transcript: 'Some passengers are boarding the train.', vi: 'M\u1ED9t s\u1ED1 h\u00E0nh kh\u00E1ch \u0111ang l\u00EAn t\u00E0u.' },
                  { key: 'C', text: '(C)', transcript: 'One of the women is handing out tickets.', vi: 'M\u1ED9t ng\u01B0\u1EDDi ph\u1EE5 n\u1EEF \u0111ang ph\u00E1t v\u00E9.' },
                  { key: 'D', text: '(D)', transcript: 'One of the men is standing at a counter.', vi: 'M\u1ED9t ng\u01B0\u1EDDi \u0111\u00E0n \u00F4ng \u0111ang \u0111\u1EE9ng \u1EDF qu\u1EA7y.' }
                ],
                explanation: (correct) => `${correct ? '\u0110\u00FAng.' : 'Ch\u01B0a ch\u00EDnh x\u00E1c.'} \u0110\u00E1p \u00E1n \u0111\u00FAng: (A) Some passengers are waiting in the terminal.\nH\u00E3y mi\u00EAu t\u1EA3 h\u00E0nh \u0111\u1ED9ng nh\u00ECn th\u1EA5y r\u00F5 trong tranh, tr\u00E1nh suy di\u1EC5n vi\u1EC7c l\u00EAn t\u00E0u hay di chuy\u1EC3n gh\u1EBF.`,
                dictationLines: [
                  { num: '01', html: 'Some <input class="listening-dictation-blank" data-dictation-answer="travelers" aria-label="T\u1EEB c\u00F2n thi\u1EBFu s\u1ED1 1" autocomplete="off" spellcheck="false"> are seated in a <input class="listening-dictation-blank" data-dictation-answer="waiting" aria-label="T\u1EEB c\u00F2n thi\u1EBFu s\u1ED1 2" autocomplete="off" spellcheck="false"> area.' },
                  { num: '02', html: 'Some <input class="listening-dictation-blank" data-dictation-answer="passengers" aria-label="T\u1EEB c\u00F2n thi\u1EBFu s\u1ED1 3" autocomplete="off" spellcheck="false"> are <input class="listening-dictation-blank" data-dictation-answer="standing" aria-label="T\u1EEB c\u00F2n thi\u1EBFu s\u1ED1 4" autocomplete="off" spellcheck="false"> up <input class="listening-dictation-blank" data-dictation-answer="nearby" aria-label="T\u1EEB c\u00F2n thi\u1EBFu s\u1ED1 5" autocomplete="off" spellcheck="false">.' },
                  { num: '03', html: 'One of the women is handing out tickets.' },
                  { num: '04', html: 'One of the men is <input class="listening-dictation-blank" data-dictation-answer="standing at" aria-label="T\u1EEB c\u00F2n thi\u1EBFu s\u1ED1 6" autocomplete="off" spellcheck="false"> a counter.' }
                ],
                vocabulary: [
                  { key: 'be-seated', num: 1, term: 'Be seated', ipa: '/bi\u02D0 \u02C8si\u02D0t\u026Ad/', pos: 'phrase', level: 'B1', meaning: '\u0111ang ng\u1ED3i', example: 'Trong b\u00E0i: \u201CSome travelers are seated in a waiting area.\u201D' },
                  { key: 'waiting-area', num: 2, term: 'Waiting area', ipa: '/\u02C8we\u026At\u026A\u014B \u02CCeri\u0259/', pos: 'noun phrase', level: 'A2', meaning: 'khu v\u1EF1c ch\u1EDD', example: 'Trong b\u00E0i: \u201C...in a waiting area.\u201D' },
                  { key: 'partition', num: 3, term: 'Partition', ipa: '/p\u0251\u02D0\u02C8t\u026A\u0283(\u0259)n/', pos: 'noun', level: 'B2', meaning: 'v\u00E1ch ng\u0103n', example: 'Trong b\u00E0i: \u201CA partition separates part of the waiting area.\u201D' },
                  { key: 'passenger', num: 4, term: 'Passenger', ipa: '/\u02C8p\u00E6s\u026And\u0292\u0259r/', pos: 'noun', level: 'A2', meaning: 'h\u00E0nh kh\u00E1ch', example: 'Trong b\u00E0i: \u201CSome passengers are standing nearby.\u201D' },
                  { key: 'luggage', num: 5, term: 'Luggage', ipa: '/\u02C8l\u028C\u0261\u026Ad\u0292/', pos: 'noun', level: 'A2', meaning: 'h\u00E0nh l\u00FD', example: 'Trong b\u00E0i: \u201CTravelers have placed their luggage beside the seats.\u201D' },
                  { key: 'terminal', num: 6, term: 'Terminal', ipa: '/\u02C8t\u025C\u02D0rm\u026An\u0259l/', pos: 'noun', level: 'B1', meaning: 'nh\u00E0 ga, nh\u00E0 ga h\u00E0ng kh\u00F4ng', example: 'Trong b\u00E0i: \u201CPassengers are waiting in the terminal.\u201D' },
                  { key: 'row-of-seats', num: 7, term: 'Row of seats', ipa: '/ro\u028A \u0259v si\u02D0ts/', pos: 'noun phrase', level: 'A2', meaning: 'h\u00E0ng gh\u1EBF', example: 'Trong b\u00E0i: \u201CSeveral people are seated in a row of seats.\u201D' }
                ]
              },
              'Part 2': {
                part: 'Part 2',
                title: 'C\u00E2u h\u1ECFi Wh-',
                heading: 'Part 2 - Question-Response (C\u00E2u h\u1ECFi Wh-)',
                subheading: 'ETS 2019 - Test 2 - C\u00E2u 7',
                test: 'ETS 2019 - Test 2',
                prompt: 'Select the best response to the question.',
                hasPicture: false,
                pictureSrc: '',
                pictureAlt: '',
                questionNum: '7.',
                totalCount: '143',
                counterText: '1/143',
                duration: 18,
                durationFormatted: '00:18',
                audioText: 'Number 7. Where did you leave the account files? (A) In your mailbox. (B) To South America. (C) No, I live near.',
                questionText: 'Where did you leave the account files?',
                questionVi: 'B\u1EA1n \u0111\u00E3 \u0111\u1EC3 c\u00E1c t\u1EC7p t\u00E0i kho\u1EA3n \u1EDF \u0111\u00E2u?',
                correctAnswer: 'A',
                options: [
                  { key: 'A', text: '(A)', transcript: 'In your mailbox.', vi: 'Trong h\u1ED9p th\u01B0 c\u1EE7a b\u1EA1n.' },
                  { key: 'B', text: '(B)', transcript: 'To South America.', vi: '\u0110\u1EBFn Nam M\u1EF9.' },
                  { key: 'C', text: '(C)', transcript: 'No, I live near.', vi: 'Kh\u00F4ng, t\u00F4i s\u1ED1ng g\u1EA7n \u0111\u00E2y.' }
                ],
                explanation: (correct) => `${correct ? '\u0110\u00FAng.' : 'Ch\u01B0a ch\u00EDnh x\u00E1c.'} \u0110\u00E1p \u00E1n \u0111\u00FAng: (A) In your mailbox.\n\n\u2022 C\u00E2u h\u1ECFi: "Where did you leave the account files?" (B\u1EA1n \u0111\u00E3 \u0111\u1EC3 t\u00E0i li\u1EC7u t\u00E0i kho\u1EA3n \u1EDF \u0111\u00E2u?)\n\u2022 (A) In your mailbox. \u2192 \u0110\u00FAng v\u00EC tr\u1EA3 l\u1EDDi ch\u1EC9 n\u01A1i ch\u1ED1n tr\u1EF1c ti\u1EBFp cho c\u00E2u h\u1ECFi "Where".\n\u2022 (B) To South America. \u2192 Sai v\u00EC "To..." ch\u1EC9 h\u01B0\u1EDBng \u0111i / \u0111\u00EDch \u0111\u1EBFn, kh\u00F4ng tr\u1EA3 l\u1EDDi cho v\u1ECB tr\u00ED \u0111\u1EC3 t\u00E0i li\u1EC7u.\n\u2022 (C) No, I live near. \u2192 Sai v\u00EC c\u00E2u h\u1ECFi Wh- kh\u00F4ng tr\u1EA3 l\u1EDDi b\u1EB1ng Yes/No.`,
                dictationLines: [
                  { num: '01', html: 'Where did you <input class="listening-dictation-blank" data-dictation-answer="leave" aria-label="T\u1EEB c\u00F2n thi\u1EBFu s\u1ED1 1" autocomplete="off" spellcheck="false"> the account <input class="listening-dictation-blank" data-dictation-answer="files" aria-label="T\u1EEB c\u00F2n thi\u1EBFu s\u1ED1 2" autocomplete="off" spellcheck="false">?' },
                  { num: '02', html: '(A) In your <input class="listening-dictation-blank" data-dictation-answer="mailbox" aria-label="T\u1EEB c\u00F2n thi\u1EBFu s\u1ED1 3" autocomplete="off" spellcheck="false">.' },
                  { num: '03', html: '(B) To South <input class="listening-dictation-blank" data-dictation-answer="America" aria-label="T\u1EEB c\u00F2n thi\u1EBFu s\u1ED1 4" autocomplete="off" spellcheck="false">.' },
                  { num: '04', html: '(C) No, I <input class="listening-dictation-blank" data-dictation-answer="live" aria-label="T\u1EEB c\u00F2n thi\u1EBFu s\u1ED1 5" autocomplete="off" spellcheck="false"> near.' }
                ],
                vocabulary: [
                  { key: 'leave', num: 1, term: 'Leave', ipa: '/li\u02D0v/', pos: 'verb', level: 'B1', meaning: '\u0111\u1EC3 l\u1EA1i, r\u1EDDi \u0111i', example: 'Trong b\u00E0i: \u201CWhere did you leave the account files?\u201D' },
                  { key: 'account-file', num: 2, term: 'Account file', ipa: '/\u0259\u02C8ka\u028Ant fa\u026Al/', pos: 'noun phrase', level: 'B1', meaning: 't\u1EC7p t\u00E0i kho\u1EA3n, h\u1ED3 s\u01A1 kh\u00E1ch h\u00E0ng', example: 'Trong b\u00E0i: \u201C...the account files?\u201D' },
                  { key: 'mailbox', num: 3, term: 'Mailbox', ipa: '/\u02C8me\u026Alb\u0251\u02D0ks/', pos: 'noun', level: 'A2', meaning: 'h\u1ED9p th\u01B0', example: 'Trong b\u00E0i: \u201C(A) In your mailbox.\u201D' },
                  { key: 'south-america', num: 4, term: 'South America', ipa: '/\u02CCsa\u028A\u03B8 \u0259\u02C8mer\u026Ak\u0259/', pos: 'proper noun', level: 'A2', meaning: 'Nam M\u1EF9', example: 'Trong b\u00E0i: \u201C(B) To South America.\u201D' },
                  { key: 'live-near', num: 5, term: 'Live near', ipa: '/l\u026Av n\u026A\u0259r/', pos: 'phrase', level: 'A1', meaning: 's\u1ED1ng \u1EDF g\u1EA7n', example: 'Trong b\u00E0i: \u201C(C) No, I live near.\u201D' }
                ]
              }
            };

            const listeningPracticeScreen = document.getElementById('listeningPracticeScreen');
            const listeningPracticeHeading = document.getElementById('listeningPracticeHeading');
            const listeningPracticeSubheading = document.getElementById('listeningPracticeSubheading');
            const listeningPracticeTestBadge = document.getElementById('listeningPracticeTestBadge');
            const listeningPracticePrompt = document.getElementById('listeningPracticePrompt');
            const listeningPracticePicture = document.getElementById('listeningPracticePicture');
            const listeningPracticeExplanation = document.getElementById('listeningPracticeExplanation');
            const listeningQuestionNumber = document.getElementById('listeningQuestionNumber');
            const listeningQuestionTranscript = document.getElementById('listeningQuestionTranscript');
            const listeningPracticeOptions = document.getElementById('listeningPracticeOptions');
            const listeningQuestionPlay = document.getElementById('listeningQuestionPlay');
            const listeningQuestionCurrent = document.getElementById('listeningQuestionCurrent');
            const listeningQuestionDuration = document.getElementById('listeningQuestionDuration');
            const listeningQuestionWave = document.getElementById('listeningQuestionWave');
            const listeningQuestionVolume = document.getElementById('listeningQuestionVolume');
            const listeningQuestionMute = document.getElementById('listeningQuestionMute');
            const listeningPracticeCounterText = document.getElementById('listeningPracticeCounterText');
            const listeningPracticePrevBtn = document.getElementById('listeningPracticePrevBtn');
            const listeningPracticeNextBtn = document.getElementById('listeningPracticeNextBtn');

            const listeningQuestionView = document.getElementById('listeningQuestionView');
            const listeningDictationPanel = document.getElementById('listeningDictationPanel');
            const listeningVocabularyPanel = document.getElementById('listeningVocabularyPanel');
            const listeningNotesDrawer = document.getElementById('listeningNotesDrawer');
            const listeningNotesEditor = document.getElementById('listeningNotesEditor');
            const dictationCount = document.getElementById('dictationCount');
            const dictationProgress = document.querySelector('.listening-dictation-progress');
            const dictationProgressBar = document.getElementById('dictationProgressBar');
            const dictationFeedback = document.getElementById('dictationFeedback');
            const vocabularyList = document.querySelector('.listening-vocabulary-list');

            let currentQuestionKey = 'Part 2';
            let listeningPracticeTrigger = null;
            let questionElapsed = 0;
            let questionTimer = null;
            let questionSpeed = 1;
            let questionVolume = 0.75;
            let isBilingualActive = false;
            let currentDictationMode = '30';
            let currentPracticeView = 'question';
            let vocabularyVisible = false;
            let dictationWasChecked = false;
            let notesSaveTimer = null;
            const vocabularyStorageKey = 'toeic-listening-saved-vocabulary';

            // Build Waveform bars
            if (listeningQuestionWave) {
              listeningQuestionWave.replaceChildren();
              for (let i = 0; i < 48; i++) {
                const bar = document.createElement('i');
                bar.style.height = `${8 + ((i * 17 + i * i * 3) % 26)}px`;
                listeningQuestionWave.appendChild(bar);
              }
            }

            function updateWaveDisplay() {
              const qData = practiceQuestionsData[currentQuestionKey] || practiceQuestionsData['Part 2'];
              const ratio = Math.min(1, Math.max(0, questionElapsed / qData.duration));
              const playedCount = Math.floor(ratio * 48);
              if (listeningQuestionWave) {
                [...listeningQuestionWave.children].forEach((bar, index) => {
                  bar.classList.toggle('is-played', index < playedCount);
                });
              }
              const mins = String(Math.floor(questionElapsed / 60)).padStart(2, '0');
              const secs = String(Math.floor(questionElapsed % 60)).padStart(2, '0');
              if (listeningQuestionCurrent) listeningQuestionCurrent.textContent = `${mins}:${secs}`;
            }

            function stopAudio() {
              if (questionTimer) {
                clearInterval(questionTimer);
                questionTimer = null;
              }
              if ('speechSynthesis' in window) {
                window.speechSynthesis.cancel();
              }
              if (listeningQuestionPlay) {
                listeningQuestionPlay.innerHTML = '<i class="fa-solid fa-play" aria-hidden="true"></i>';
              }
            }

            function playAudio() {
              const qData = practiceQuestionsData[currentQuestionKey] || practiceQuestionsData['Part 2'];
              stopAudio();
              if (listeningQuestionPlay) {
                listeningQuestionPlay.innerHTML = '<i class="fa-solid fa-pause" aria-hidden="true"></i>';
              }

              if ('speechSynthesis' in window && 'SpeechSynthesisUtterance' in window) {
                const utterance = new SpeechSynthesisUtterance(qData.audioText);
                utterance.lang = 'en-US';
                utterance.rate = questionSpeed;
                utterance.volume = questionVolume;
                utterance.onend = () => {
                  stopAudio();
                  questionElapsed = qData.duration;
                  updateWaveDisplay();
                };
                utterance.onerror = () => {
                  stopAudio();
                };
                window.speechSynthesis.speak(utterance);
              }

              questionTimer = setInterval(() => {
                questionElapsed += 0.5 * questionSpeed;
                if (questionElapsed >= qData.duration) {
                  questionElapsed = qData.duration;
                  updateWaveDisplay();
                  stopAudio();
                } else {
                  updateWaveDisplay();
                }
              }, 500);
            }

            if (listeningQuestionPlay) {
              listeningQuestionPlay.addEventListener('click', () => {
                if (questionTimer) {
                  stopAudio();
                } else {
                  const qData = practiceQuestionsData[currentQuestionKey] || practiceQuestionsData['Part 2'];
                  if (questionElapsed >= qData.duration) questionElapsed = 0;
                  playAudio();
                }
              });
            }

            document.querySelectorAll('[data-question-seek]').forEach(btn => btn.addEventListener('click', () => {
              const qData = practiceQuestionsData[currentQuestionKey] || practiceQuestionsData['Part 2'];
              const seekAmount = Number(btn.dataset.questionSeek);
              questionElapsed = Math.max(0, Math.min(qData.duration, questionElapsed + seekAmount));
              updateWaveDisplay();
              if (questionTimer) {
                playAudio();
              }
            }));

            document.querySelectorAll('[data-question-speed]').forEach(btn => btn.addEventListener('click', () => {
              questionSpeed = Number(btn.dataset.questionSpeed);
              document.querySelectorAll('[data-question-speed]').forEach(item => {
                const active = item === btn;
                item.style.color = active ? '#076af1' : '';
                item.style.borderColor = active ? '#076af1' : '';
              });
              if (questionTimer) {
                playAudio();
              }
            }));

            const replayBtn = document.getElementById('questionReplay');
            if (replayBtn) {
              replayBtn.addEventListener('click', () => {
                questionElapsed = 0;
                updateWaveDisplay();
                playAudio();
              });
            }

            if (listeningQuestionVolume) {
              listeningQuestionVolume.addEventListener('input', () => {
                questionVolume = Number(listeningQuestionVolume.value) / 100;
                if (listeningQuestionMute) {
                  const icon = listeningQuestionMute.querySelector('i');
                  if (icon) {
                    icon.className = questionVolume === 0
                      ? 'fa-solid fa-volume-xmark text-slate-400'
                      : questionVolume < 0.5
                        ? 'fa-solid fa-volume-low text-slate-600'
                        : 'fa-solid fa-volume-high text-slate-600';
                  }
                }
              });
            }

            if (listeningQuestionMute) {
              listeningQuestionMute.addEventListener('click', () => {
                if (questionVolume > 0) {
                  listeningQuestionMute.dataset.prevVolume = String(listeningQuestionVolume.value);
                  listeningQuestionVolume.value = '0';
                } else {
                  listeningQuestionVolume.value = listeningQuestionMute.dataset.prevVolume || '75';
                }
                listeningQuestionVolume.dispatchEvent(new Event('input'));
              });
            }

            function renderOptions() {
              const qData = practiceQuestionsData[currentQuestionKey] || practiceQuestionsData['Part 2'];
              if (!listeningPracticeOptions) return;
              listeningPracticeOptions.replaceChildren();
              qData.options.forEach(opt => {
                const btn = document.createElement('button');
                btn.className = 'listening-practice-option';
                btn.type = 'button';
                btn.role = 'radio';
                btn.setAttribute('aria-checked', 'false');
                btn.setAttribute('aria-pressed', 'false');
                btn.dataset.answer = opt.key;

                if (isBilingualActive) {
                  btn.innerHTML = `
                    <span class="listening-practice-option-mark"></span>
                    <div class="flex-1 text-left min-w-0">
                      <div class="font-bold text-slate-800 dark:text-slate-100">(${opt.key}) ${opt.transcript}</div>
                      <div class="text-xs text-slate-500 dark:text-slate-400 font-normal mt-0.5">${opt.vi}</div>
                    </div>`;
                } else {
                  btn.innerHTML = `<span class="listening-practice-option-mark"></span><span>(${opt.key})</span>`;
                }

                btn.addEventListener('click', () => {
                  listeningPracticeOptions.querySelectorAll('.listening-practice-option').forEach(other => {
                    const selected = other === btn;
                    other.setAttribute('aria-checked', String(selected));
                    other.setAttribute('aria-pressed', String(selected));
                  });
                  const isCorrect = opt.key === qData.correctAnswer;
                  listeningPracticeExplanation.hidden = false;
                  listeningPracticeExplanation.style.whiteSpace = 'pre-line';
                  listeningPracticeExplanation.textContent = qData.explanation(isCorrect);
                });

                listeningPracticeOptions.appendChild(btn);
              });

              if (listeningQuestionTranscript) {
                if (qData.questionText && isBilingualActive) {
                  listeningQuestionTranscript.hidden = false;
                  listeningQuestionTranscript.innerHTML = `
                    <div class="font-bold text-blue-600 dark:text-blue-400 mb-0.5">Transcript c\u00E2u h\u1ECFi:</div>
                    <div class="text-slate-800 dark:text-slate-100 font-semibold">${qData.questionText}</div>
                    <div class="text-slate-500 dark:text-slate-400 mt-0.5">${qData.questionVi}</div>`;
                } else {
                  listeningQuestionTranscript.hidden = true;
                  listeningQuestionTranscript.replaceChildren();
                }
              }
            }

            function renderDictation() {
              const qData = practiceQuestionsData[currentQuestionKey] || practiceQuestionsData['Part 2'];
              const linesWrap = document.querySelector('.listening-dictation-lines');
              if (!linesWrap) return;
              linesWrap.replaceChildren();

              qData.dictationLines.forEach(line => {
                const row = document.createElement('div');
                row.className = 'listening-dictation-line';
                row.innerHTML = `<span class="listening-dictation-number">${line.num}</span><span class="listening-dictation-text">${line.html}</span>`;
                linesWrap.appendChild(row);
              });

              const inputs = [...linesWrap.querySelectorAll('.listening-dictation-blank')];
              if (dictationCount) dictationCount.textContent = `\u0110\u00E3 xong 0/${inputs.length} t\u1EEB`;
              if (dictationProgress) {
                dictationProgress.setAttribute('aria-valuemax', String(inputs.length));
                dictationProgress.setAttribute('aria-valuenow', '0');
              }
              if (dictationProgressBar) dictationProgressBar.style.width = '0%';
              if (dictationFeedback) dictationFeedback.textContent = '';
              dictationWasChecked = false;

              inputs.forEach(input => {
                input.addEventListener('input', () => {
                  input.classList.remove('is-correct', 'is-wrong');
                  if (dictationWasChecked) checkDictation();
                  else updateDictationProgress();
                });
              });

              updateDictationHints();
            }

            function getDictationInputs() {
              return [...document.querySelectorAll('.listening-dictation-blank')];
            }

            function updateDictationHints() {
              const inputs = getDictationInputs();
              inputs.forEach(input => {
                const answer = input.dataset.dictationAnswer || '';
                if (currentDictationMode === 'full') {
                  input.placeholder = answer;
                } else if (currentDictationMode === 'keywords') {
                  input.placeholder = answer.split(/\s+/).map(word => word[0]).join(' \u00B7 ');
                } else {
                  const visible = Math.max(1, Math.ceil(answer.length * Number(currentDictationMode) / 100));
                  input.placeholder = answer.slice(0, visible) + '\u2022'.repeat(Math.max(0, answer.length - visible));
                }
              });
            }

            function updateDictationProgress() {
              const inputs = getDictationInputs();
              const done = inputs.filter(inp => !inp.dataset.revealed && inp.value.trim().toLowerCase() === (inp.dataset.dictationAnswer || '').toLowerCase()).length;
              if (dictationCount) dictationCount.textContent = `\u0110\u00E3 xong ${done}/${inputs.length} t\u1EEB`;
              if (dictationProgress) dictationProgress.setAttribute('aria-valuenow', String(done));
              if (dictationProgressBar) dictationProgressBar.style.width = inputs.length ? `${(done / inputs.length) * 100}%` : '0%';
            }

            function revealDictationWords(count) {
              const inputs = getDictationInputs();
              const unrevealed = inputs.filter(input => !input.dataset.revealed);
              const selected = count === 'all' ? unrevealed : unrevealed.slice(0, Number(count));
              selected.forEach(input => {
                input.value = input.dataset.dictationAnswer;
                input.dataset.revealed = 'true';
                input.classList.remove('is-correct', 'is-wrong');
              });
              updateDictationProgress();
            }

            function checkDictation() {
              const inputs = getDictationInputs();
              let correct = 0;
              inputs.forEach(input => {
                const answer = (input.dataset.dictationAnswer || '').toLowerCase();
                const val = input.value.trim().replace(/\s+/g, ' ').toLowerCase();
                const matches = val === answer;
                input.classList.toggle('is-correct', matches);
                input.classList.toggle('is-wrong', !matches && val.length > 0);
                if (matches && !input.dataset.revealed) correct++;
              });
              dictationWasChecked = true;
              if (dictationFeedback) dictationFeedback.textContent = `B\u1EA1n \u0111i\u1EC1n \u0111\u00FAng ${correct}/${inputs.length} ch\u1ED7 tr\u1ED1ng. T\u1EEB \u0111\u01B0\u1EE3c m\u1EDF s\u1EB5n kh\u00F4ng t\u00EDnh \u0111i\u1EC3m.`;
              updateDictationProgress();
            }

            document.querySelectorAll('[data-dictation-mode]').forEach(btn => btn.addEventListener('click', () => {
              currentDictationMode = btn.dataset.dictationMode;
              document.querySelectorAll('[data-dictation-mode]').forEach(b => b.setAttribute('aria-pressed', String(b === btn)));
              updateDictationHints();
            }));

            document.querySelectorAll('[data-reveal-count]').forEach(btn => btn.addEventListener('click', () => {
              revealDictationWords(btn.dataset.revealCount);
            }));

            const dictationCheckBtn = document.getElementById('dictationCheck');
            if (dictationCheckBtn) dictationCheckBtn.addEventListener('click', checkDictation);

            const dictationResetBtn = document.getElementById('dictationReset');
            if (dictationResetBtn) {
              dictationResetBtn.addEventListener('click', () => {
                const inputs = getDictationInputs();
                inputs.forEach(inp => {
                  inp.value = '';
                  delete inp.dataset.revealed;
                  inp.classList.remove('is-correct', 'is-wrong');
                });
                if (dictationFeedback) dictationFeedback.textContent = '';
                dictationWasChecked = false;
                currentDictationMode = '30';
                document.querySelectorAll('[data-dictation-mode]').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.dictationMode === '30')));
                updateDictationHints();
                updateDictationProgress();
              });
            }

            let savedVocabulary = [];
            try { savedVocabulary = JSON.parse(localStorage.getItem(vocabularyStorageKey) || '[]'); } catch (e) { savedVocabulary = []; }

            function renderVocabulary() {
              const qData = practiceQuestionsData[currentQuestionKey] || practiceQuestionsData['Part 2'];
              if (!vocabularyList) return;
              vocabularyList.replaceChildren();

              const subtitle = document.querySelector('.listening-vocabulary-head-copy small');
              if (subtitle) {
                subtitle.textContent = `${qData.vocabulary.length} t\u1EEB/c\u1EE5m TOEIC li\u00EAn quan tr\u1EF1c ti\u1EBFp \u0111\u1EBFn b\u00E0i n\u00E0y.`;
              }

              qData.vocabulary.forEach(item => {
                const art = document.createElement('article');
                art.className = 'listening-vocabulary-item';
                art.dataset.vocabularyItem = item.key;
                const isSaved = savedVocabulary.includes(item.key);
                art.innerHTML = `
                  <div class="listening-vocabulary-term">
                    <span class="listening-vocabulary-number">${item.num}</span>
                    <strong>${item.term}</strong>
                    <span class="listening-vocabulary-meta">
                      <span>${item.ipa}</span>
                      <span>${item.pos}</span>
                      <span>${item.level}</span>
                    </span>
                    <span class="listening-vocabulary-pronounce">
                      <button type="button" data-pronounce="${item.term}" data-accent="en-US"><i class="fa-solid fa-volume-high" aria-label="Ph\u00E1t \u00E2m M\u1EF9"></i> US</button>
                      <button type="button" data-pronounce="${item.term}" data-accent="en-GB"><i class="fa-solid fa-volume-high" aria-label="Ph\u00E1t \u00E2m Anh"></i> UK</button>
                    </span>
                  </div>
                  <button class="listening-vocabulary-save" type="button" data-vocabulary-save="${item.key}" aria-pressed="${isSaved}">
                    <i class="fa-${isSaved ? 'solid' : 'regular'} fa-bookmark" aria-hidden="true"></i> ${isSaved ? '\u0110\u00E3 l\u01B0u' : 'L\u01B0u'}
                  </button>
                  <span class="listening-vocabulary-meaning">${item.meaning}</span>
                  <span class="listening-vocabulary-example">${item.example}</span>`;
                vocabularyList.appendChild(art);
              });

              // Pronounce buttons
              vocabularyList.querySelectorAll('[data-pronounce]').forEach(btn => btn.addEventListener('click', () => {
                if (!('speechSynthesis' in window) || !('SpeechSynthesisUtterance' in window)) return;
                window.speechSynthesis.cancel();
                const utt = new SpeechSynthesisUtterance(btn.dataset.pronounce);
                utt.lang = btn.dataset.accent || 'en-US';
                utt.rate = 0.88;
                window.speechSynthesis.speak(utt);
              }));

              // Bookmark buttons
              vocabularyList.querySelectorAll('[data-vocabulary-save]').forEach(btn => btn.addEventListener('click', () => {
                const key = btn.dataset.vocabularySave;
                savedVocabulary = savedVocabulary.includes(key)
                  ? savedVocabulary.filter(x => x !== key)
                  : [...savedVocabulary, key];
                try { localStorage.setItem(vocabularyStorageKey, JSON.stringify(savedVocabulary)); } catch (e) {}
                const nowSaved = savedVocabulary.includes(key);
                btn.setAttribute('aria-pressed', String(nowSaved));
                btn.innerHTML = `<i class="fa-${nowSaved ? 'solid' : 'regular'} fa-bookmark" aria-hidden="true"></i> ${nowSaved ? '\u0110\u00E3 l\u01B0u' : 'L\u01B0u'}`;
              }));
            }

            function loadNotesForQuestion() {
              if (!listeningNotesEditor) return;
              const storageKey = `toeic-listening-notes-${currentQuestionKey}`;
              try {
                listeningNotesEditor.innerHTML = sanitizeNoteHtml(localStorage.getItem(storageKey) || '');
              } catch (e) {
                listeningNotesEditor.replaceChildren();
              }
              const noteSub = document.querySelector('.listening-notes-head small');
              if (noteSub) {
                const qData = practiceQuestionsData[currentQuestionKey] || practiceQuestionsData['Part 2'];
                noteSub.textContent = `${qData.test} \u00B7 ${qData.questionNum}`;
              }
            }

            function loadQuestion(key) {
              const qData = practiceQuestionsData[key] || practiceQuestionsData['Part 2'];
              currentQuestionKey = key;
              stopAudio();
              questionElapsed = 0;

              // Topbar
              if (listeningPracticeHeading) listeningPracticeHeading.textContent = qData.heading;
              if (listeningPracticeSubheading) listeningPracticeSubheading.textContent = qData.subheading;
              if (listeningPracticeTestBadge) listeningPracticeTestBadge.textContent = qData.test;
              if (listeningPracticePrompt) listeningPracticePrompt.textContent = qData.prompt;
              if (listeningPracticeCounterText) listeningPracticeCounterText.textContent = qData.counterText;
              if (listeningQuestionNumber) listeningQuestionNumber.textContent = qData.questionNum;

              // Picture
              if (listeningPracticePicture) {
                if (qData.hasPicture) {
                  listeningPracticePicture.src = qData.pictureSrc;
                  listeningPracticePicture.alt = qData.pictureAlt;
                  listeningPracticePicture.style.display = 'block';
                } else {
                  listeningPracticePicture.style.display = 'none';
                }
              }

              // Audio times & wave
              if (listeningQuestionDuration) listeningQuestionDuration.textContent = qData.durationFormatted;
              updateWaveDisplay();

              // Explanation
              if (listeningPracticeExplanation) {
                listeningPracticeExplanation.hidden = true;
                listeningPracticeExplanation.textContent = '';
              }

              // Render panels
              renderOptions();
              renderDictation();
              renderVocabulary();
              loadNotesForQuestion();

              // Navigation buttons
              if (listeningPracticePrevBtn) {
                listeningPracticePrevBtn.disabled = (key === 'Part 1');
              }
            }

            function openListeningPractice(button) {
              listeningPracticeTrigger = button;
              const part = button ? (button.dataset.part || '') : '';
              const title = button ? (button.dataset.title || '') : '';

              if (part === 'Part 2' || title.includes('Wh-') || title.includes('Part 2')) {
                loadQuestion('Part 2');
              } else {
                loadQuestion('Part 1');
              }

              listeningPracticeScreen.hidden = false;
              document.body.style.overflow = 'hidden';
              const closeBtn = document.getElementById('closeListeningPractice');
              if (closeBtn) closeBtn.focus({preventScroll:true});
            }

            function closeListeningPractice() {
              listeningPracticeScreen.hidden = true;
              document.body.style.overflow = '';
              stopAudio();
              if (listeningPracticeTrigger) listeningPracticeTrigger.focus({preventScroll:true});
            }

            const closePracticeBtn = document.getElementById('closeListeningPractice');
            if (closePracticeBtn) closePracticeBtn.addEventListener('click', closeListeningPractice);

            // Bottom bar Prev / Next navigation
            if (listeningPracticePrevBtn) {
              listeningPracticePrevBtn.addEventListener('click', () => {
                if (currentQuestionKey === 'Part 2') {
                  loadQuestion('Part 1');
                }
              });
            }

            if (listeningPracticeNextBtn) {
              listeningPracticeNextBtn.addEventListener('click', () => {
                if (currentQuestionKey === 'Part 1') {
                  loadQuestion('Part 2');
                } else {
                  if (listeningPracticeCounterText) {
                    const origText = listeningPracticeCounterText.textContent;
                    listeningPracticeCounterText.textContent = '2/143';
                    setTimeout(() => {
                      listeningPracticeCounterText.textContent = origText;
                    }, 1500);
                  }
                }
              });
            }

            // Category card click handlers
            document.querySelectorAll('.listen-category').forEach(button => button.addEventListener('click', () => {
              const title = button.dataset.title || '';
              const part = button.dataset.part || '';
              if (title === 'Tranh t\u1EA3 ng\u01B0\u1EDDi' || title === 'C\u00E2u h\u1ECFi Wh-' || part === 'Part 1' || part === 'Part 2') {
                openListeningPractice(button);
              } else {
                openInfo(button, button.dataset.part + ' \u00B7 ' + button.dataset.count + ' C\u00C2U', button.dataset.title, button.dataset.description, 'B\u1ED9 c\u00E2u h\u1ECFi thu\u1ED9c ng\u00E2n h\u00E0ng luy\u1EC7n nghe TOEIC. Ti\u1EBFn \u0111\u1ED9 s\u1EBD \u0111\u01B0\u1EE3c c\u1EADp nh\u1EADt khi c\u00F3 d\u1EEF li\u1EC7u b\u00E0i luy\u1EC7n.');
              }
            }));

            // Notes drawer
            function closeListeningNotes() {
              if (!listeningNotesDrawer) return;
              listeningNotesDrawer.hidden = true;
              const trigger = document.querySelector('[data-practice-tool="notes"]');
              if (trigger) {
                trigger.setAttribute('aria-pressed', 'false');
                trigger.focus({preventScroll:true});
              }
            }

            function openListeningNotes() {
              if (!listeningNotesDrawer) return;
              listeningNotesDrawer.hidden = false;
              const trigger = document.querySelector('[data-practice-tool="notes"]');
              if (trigger) trigger.setAttribute('aria-pressed', 'true');
              if (listeningNotesEditor) listeningNotesEditor.focus({preventScroll:true});
            }

            const closeNotesBtn = document.getElementById('closeListeningNotes');
            if (closeNotesBtn) closeNotesBtn.addEventListener('click', closeListeningNotes);

            function sanitizeNoteHtml(html) {
              const template = document.createElement('template');
              template.innerHTML = html;
              const allowedTags = new Set(['B','STRONG','I','EM','U','BR','P','DIV','UL','OL','LI','BLOCKQUOTE']);
              function clean(parent) {
                [...parent.childNodes].forEach(node => {
                  if (node.nodeType !== Node.ELEMENT_NODE) return;
                  if (!allowedTags.has(node.tagName)) {
                    node.replaceWith(...node.childNodes);
                    return;
                  }
                  [...node.attributes].forEach(attribute => node.removeAttribute(attribute.name));
                  clean(node);
                });
              }
              clean(template.content);
              return template.innerHTML;
            }

            if (listeningNotesEditor) {
              listeningNotesEditor.addEventListener('input', () => {
                const status = document.getElementById('listeningNotesStatus');
                if (status) status.textContent = '\u0110ang l\u01B0u...';
                clearTimeout(notesSaveTimer);
                notesSaveTimer = setTimeout(() => {
                  const storageKey = `toeic-listening-notes-${currentQuestionKey}`;
                  try {
                    localStorage.setItem(storageKey, sanitizeNoteHtml(listeningNotesEditor.innerHTML));
                    if (status) status.textContent = '\u0110\u00E3 l\u01B0u';
                  } catch (e) {
                    if (status) status.textContent = 'Kh\u00F4ng th\u1EC3 l\u01B0u';
                  }
                }, 250);
              });
            }

            const notesToolbar = document.querySelector('.listening-notes-toolbar');
            if (notesToolbar) {
              notesToolbar.addEventListener('mousedown', event => {
                if (event.target.closest('button')) event.preventDefault();
              });
            }

            document.querySelectorAll('[data-note-command]').forEach(btn => btn.addEventListener('click', () => {
              if (!listeningNotesEditor) return;
              listeningNotesEditor.focus();
              const command = btn.dataset.noteCommand;
              document.execCommand(command, false, btn.dataset.noteValue || null);
              listeningNotesEditor.dispatchEvent(new Event('input', {bubbles:true}));
            }));

            // Vocabulary expand/collapse
            const vocabExpandBtn = document.getElementById('vocabularyExpand');
            if (vocabExpandBtn) {
              vocabExpandBtn.addEventListener('click', event => {
                const btn = event.currentTarget;
                const expanded = btn.getAttribute('aria-expanded') === 'true';
                if (vocabularyList) vocabularyList.classList.toggle('is-expanded', !expanded);
                btn.setAttribute('aria-expanded', String(!expanded));
                btn.innerHTML = `<i class="fa-solid fa-chevron-${expanded ? 'down' : 'up'}" aria-hidden="true"></i> ${expanded ? 'Xem \u0111\u1EA7y \u0111\u1EE7' : 'Thu g\u1ECDn'}`;
              });
            }

            // Feedback & Report modal
            const listeningFeedbackModal = document.getElementById('listeningFeedbackModal');
            const listeningFeedbackForm = document.getElementById('listeningFeedbackForm');
            const listeningFeedbackDescription = document.getElementById('listeningFeedbackDescription');
            const listeningFeedbackError = document.getElementById('listeningFeedbackError');
            const listeningFeedbackToast = document.getElementById('listeningFeedbackToast');
            let listeningFeedbackType = 'report';
            let listeningFeedbackTrigger = null;
            let listeningFeedbackToastTimer = null;

            function openListeningFeedback(type, trigger) {
              if (!listeningFeedbackModal) return;
              listeningFeedbackType = type;
              listeningFeedbackTrigger = trigger;
              const isReport = type === 'report';
              listeningFeedbackModal.hidden = false;
              if (listeningFeedbackForm) {
                listeningFeedbackForm.className = `listening-feedback-modal ${type}`;
              }
              const icon = document.getElementById('listeningFeedbackIcon');
              if (icon) icon.innerHTML = `<i class="fa-${isReport ? 'regular fa-flag' : 'regular fa-message'}" aria-hidden="true"></i>`;
              const title = document.getElementById('listeningFeedbackTitle');
              if (title) title.textContent = isReport ? 'B\u00E1o l\u1ED7i n\u1ED9i dung' : '\u0110\u00F3ng g\u00F3p \u00FD ki\u1EBFn';
              const subtitle = document.getElementById('listeningFeedbackSubtitle');
              if (subtitle) subtitle.textContent = isReport ? 'Ph\u1EA3n h\u1ED3i gi\u00FAp \u0111\u1ED9i ng\u0169 r\u00E0 so\u00E1t l\u1EA1i c\u00E2u h\u1ECFi.' : '\u00DD ki\u1EBFn c\u1EE7a b\u1EA1n gi\u00FAp ch\u00FAng t\u00F4i c\u1EA3i thi\u1EC7n tr\u1EA3i nghi\u1EC7m luy\u1EC7n nghe.';
              const catLabel = document.getElementById('listeningFeedbackCategoryLabel');
              if (catLabel) catLabel.textContent = isReport ? 'L\u1ED6I' : '\u00DD KI\u1EBEN';
              document.querySelectorAll('[data-feedback-options]').forEach(group => {
                group.hidden = group.dataset.feedbackOptions !== type;
              });
              if (listeningFeedbackDescription) listeningFeedbackDescription.value = '';
              const countEl = document.getElementById('listeningFeedbackCount');
              if (countEl) countEl.textContent = '0/1000';
              if (listeningFeedbackError) listeningFeedbackError.textContent = '';
              const firstOpt = document.querySelector(`[data-feedback-options="${type}"] [data-feedback-category]`);
              if (firstOpt) {
                document.querySelectorAll(`[data-feedback-options="${type}"] [data-feedback-category]`).forEach(btn => {
                  btn.setAttribute('aria-pressed', String(btn === firstOpt));
                });
              }
            }

            function closeListeningFeedback() {
              if (listeningFeedbackModal) listeningFeedbackModal.hidden = true;
              if (listeningFeedbackTrigger) listeningFeedbackTrigger.focus({preventScroll:true});
            }

            const closeFeedbackBtn = document.getElementById('closeListeningFeedback');
            if (closeFeedbackBtn) closeFeedbackBtn.addEventListener('click', closeListeningFeedback);
            const cancelFeedbackBtn = document.getElementById('cancelListeningFeedback');
            if (cancelFeedbackBtn) cancelFeedbackBtn.addEventListener('click', closeListeningFeedback);
            if (listeningFeedbackModal) {
              listeningFeedbackModal.addEventListener('click', event => {
                if (event.target === listeningFeedbackModal) closeListeningFeedback();
              });
            }

            if (listeningFeedbackDescription) {
              listeningFeedbackDescription.addEventListener('input', () => {
                const countEl = document.getElementById('listeningFeedbackCount');
                if (countEl) countEl.textContent = `${listeningFeedbackDescription.value.length}/1000`;
                if (listeningFeedbackError) listeningFeedbackError.textContent = '';
              });
            }

            document.querySelectorAll('[data-feedback-category]').forEach(btn => btn.addEventListener('click', () => {
              const group = btn.closest('[data-feedback-options]');
              if (group) {
                group.querySelectorAll('[data-feedback-category]').forEach(other => {
                  other.setAttribute('aria-pressed', String(other === btn));
                });
              }
            }));

            if (listeningFeedbackForm) {
              listeningFeedbackForm.addEventListener('submit', event => {
                event.preventDefault();
                const description = listeningFeedbackDescription ? listeningFeedbackDescription.value.trim() : '';
                if (listeningFeedbackType === 'feedback' && !description) {
                  if (listeningFeedbackError) listeningFeedbackError.textContent = 'Vui l\u00F2ng nh\u1EADp n\u1ED9i dung g\u00F3p \u00FD.';
                  if (listeningFeedbackDescription) listeningFeedbackDescription.focus();
                  return;
                }
                const activeGroup = document.querySelector(`[data-feedback-options="${listeningFeedbackType}"]`);
                const category = activeGroup?.querySelector('[data-feedback-category][aria-pressed="true"]')?.dataset.feedbackCategory || '';
                const qData = practiceQuestionsData[currentQuestionKey] || practiceQuestionsData['Part 2'];
                const record = {
                  type: listeningFeedbackType,
                  category,
                  description,
                  test: qData.test,
                  question: qData.questionNum,
                  createdAt: new Date().toISOString()
                };
                const storageKey = listeningFeedbackType === 'report' ? 'toeic-listening-reports' : 'toeic-listening-feedback';
                try {
                  const records = JSON.parse(localStorage.getItem(storageKey) || '[]');
                  records.push(record);
                  localStorage.setItem(storageKey, JSON.stringify(records));
                } catch (error) {
                  if (listeningFeedbackError) listeningFeedbackError.textContent = 'Kh\u00F4ng th\u1EC3 l\u01B0u ph\u1EA3n h\u1ED3i trong tr\u00ECnh duy\u1EC7t n\u00E0y.';
                  return;
                }
                closeListeningFeedback();
                if (listeningFeedbackToast) {
                  listeningFeedbackToast.textContent = listeningFeedbackType === 'report'
                    ? '\u0110\u00E3 ghi nh\u1EADn b\u00E1o l\u1ED7i tr\u00EAn thi\u1EBFt b\u1ECB n\u00E0y.'
                    : '\u0110\u00E3 ghi nh\u1EADn g\u00F3p \u00FD tr\u00EAn thi\u1EBFt b\u1ECB n\u00E0y.';
                  listeningFeedbackToast.hidden = false;
                  clearTimeout(listeningFeedbackToastTimer);
                  listeningFeedbackToastTimer = setTimeout(() => { listeningFeedbackToast.hidden = true; }, 3200);
                }
              });
            }

            // Topbar tools handlers
            document.querySelectorAll('.listening-practice-tools [data-practice-tool]').forEach(btn => {
              btn.addEventListener('click', () => {
                const tool = btn.dataset.practiceTool;
                if (tool === 'translation') {
                  isBilingualActive = !isBilingualActive;
                  btn.setAttribute('aria-pressed', String(isBilingualActive));
                  renderOptions();
                } else if (tool === 'dictation') {
                  closeListeningNotes();
                  currentPracticeView = currentPracticeView === 'dictation' ? 'question' : 'dictation';
                  if (listeningQuestionView) listeningQuestionView.hidden = currentPracticeView !== 'question';
                  if (listeningDictationPanel) listeningDictationPanel.hidden = currentPracticeView !== 'dictation';
                  btn.setAttribute('aria-pressed', String(currentPracticeView === 'dictation'));
                } else if (tool === 'vocabulary') {
                  closeListeningNotes();
                  vocabularyVisible = !vocabularyVisible;
                  if (listeningVocabularyPanel) listeningVocabularyPanel.hidden = !vocabularyVisible;
                  btn.setAttribute('aria-pressed', String(vocabularyVisible));
                } else if (tool === 'notes') {
                  if (listeningNotesDrawer && !listeningNotesDrawer.hidden) closeListeningNotes(); else openListeningNotes();
                }
              });
            });

            // Feedback / Report buttons in bottom bar
            document.querySelectorAll('.listening-practice-feedback [data-practice-tool]').forEach(btn => {
              btn.addEventListener('click', () => {
                const tool = btn.dataset.practiceTool;
                if (tool === 'report' || tool === 'feedback') {
                  openListeningFeedback(tool, btn);
                }
              });
            });

            // Keyboard shortcuts
            document.addEventListener('keydown', event => {
              if (listeningPracticeScreen && listeningPracticeScreen.hidden) return;
              if (event.key === 'Escape') {
                if (listeningFeedbackModal && !listeningFeedbackModal.hidden) closeListeningFeedback();
                else if (listeningNotesDrawer && !listeningNotesDrawer.hidden) closeListeningNotes();
                else closeListeningPractice();
                return;
              }
              if (listeningFeedbackModal && !listeningFeedbackModal.hidden) return;
              if (document.activeElement && (document.activeElement.isContentEditable || ['INPUT', 'TEXTAREA'].includes(document.activeElement.tagName))) return;

              if (event.code === 'Space') {
                event.preventDefault();
                if (event.shiftKey) {
                  const replay = document.getElementById('questionReplay');
                  if (replay) replay.click();
                } else {
                  if (listeningQuestionPlay) listeningQuestionPlay.click();
                }
              } else if (event.key === 'ArrowLeft') {
                event.preventDefault();
                if (event.shiftKey) {
                  // Speed down
                  const speeds = [0.75, 0.9, 1, 1.1, 1.25];
                  const idx = speeds.indexOf(questionSpeed);
                  if (idx > 0) {
                    const btn = document.querySelector(`[data-question-speed="${speeds[idx - 1]}"]`);
                    if (btn) btn.click();
                  }
                } else {
                  const seekBack = document.querySelector('[data-question-seek="-5"]');
                  if (seekBack) seekBack.click();
                }
              } else if (event.key === 'ArrowRight') {
                event.preventDefault();
                if (event.shiftKey) {
                  // Speed up
                  const speeds = [0.75, 0.9, 1, 1.1, 1.25];
                  const idx = speeds.indexOf(questionSpeed);
                  if (idx !== -1 && idx < speeds.length - 1) {
                    const btn = document.querySelector(`[data-question-speed="${speeds[idx + 1]}"]`);
                    if (btn) btn.click();
                  }
                } else {
                  const seekForward = document.querySelector('[data-question-seek="5"]');
                  if (seekForward) seekForward.click();
                }
              } else if (event.key === 'ArrowUp') {
                event.preventDefault();
                if (listeningQuestionVolume) {
                  listeningQuestionVolume.value = Math.min(100, Number(listeningQuestionVolume.value) + 5);
                  listeningQuestionVolume.dispatchEvent(new Event('input'));
                }
              } else if (event.key === 'ArrowDown') {
                event.preventDefault();
                if (listeningQuestionVolume) {
                  listeningQuestionVolume.value = Math.max(0, Number(listeningQuestionVolume.value) - 5);
                  listeningQuestionVolume.dispatchEvent(new Event('input'));
                }
              }
            });

            const basicListeningPage = document.getElementById('basicListeningPage');
            const dashboardMain = document.getElementById('dashboardMain');
            const basicListeningButton = document.getElementById('basicListeningButton');
            if (basicListeningButton) {
              basicListeningButton.addEventListener('click', (e) => {
                if (e) e.preventDefault();
                document.body.classList.add('basic-listening-active');
                dashboardMain.hidden = true;
                basicListeningPage.hidden = false;
                basicListeningPage.scrollTop = 0;
                document.getElementById('basicListeningTitle').focus({ preventScroll: true });
              });
            }
            document.getElementById('basicListeningBack').addEventListener('click', () => {
              document.body.classList.remove('basic-listening-active');
              basicListeningPage.hidden = true;
              dashboardMain.hidden = false;
              basicListeningButton.focus({ preventScroll: true });
            });
            const basicBreadcrumbListening = document.getElementById('basicBreadcrumbListening');
            if (basicBreadcrumbListening) {
              basicBreadcrumbListening.addEventListener('click', (e) => {
                e.preventDefault();
                document.body.classList.remove('basic-listening-active');
                basicListeningPage.hidden = true;
                dashboardMain.hidden = false;
                window.scrollTo({ top: 0, behavior: 'smooth' });
              });
            }

            document.querySelectorAll('.basic-level').forEach(button => {
              button.addEventListener('click', () => {
                document.querySelectorAll('.basic-level').forEach(item => item.setAttribute('aria-pressed', String(item === button)));
              });
            });
            document.querySelectorAll('.basic-topic').forEach(button => {
              button.addEventListener('click', () => {
                document.querySelectorAll('.basic-topic').forEach(item => item.setAttribute('aria-pressed', String(item === button)));
              });
            });
            // Quản lý dữ liệu và logic Luyện nghe cơ bản (Hội thoại ngắn & Hội thoại ngữ pháp)
                        const basicTopicsData = {
              short: {
                name: 'Hội thoại ngắn',
                lessons: {
                  1: {
                    id: 1,
                    title: 'Beginner English - 1 - Ten Things about Me!',
                    goal: 'Luyện nghe độc thoại giới thiệu bản thân sử dụng thì hiện tại đơn với động từ Be.',
                    duration: 72,
                    durationFormatted: '01:12',
                    sections: [
                      [
                        { speaker: 'WOMAN', time: '00:00', en: 'Hi, my name is Sarah and I will say 10 things about myself using present simple with Be.', vi: 'Xin chào, tên tôi là Sarah và tôi sẽ nói 10 điều về bản thân bằng cách sử dụng thì hiện tại đơn với Be.' },
                        { speaker: 'WOMAN', time: '00:06', en: 'My name is Sarah. I am a mother. I am also a teacher. I am not a farmer. I am not shy. My daughter is seven years old. She is brave. My son is five years old. He is kind. My children are friendly. They are happy, too. My family is from the USA. We are American.', vi: 'Tên tôi là Sarah. Tôi là một người mẹ. Tôi cũng là một giáo viên. Tôi không phải là nông dân. Tôi không nhút nhát. Con gái tôi bảy tuổi. Con bé dũng cảm. Con trai tôi năm tuổi. Con bé tốt bụng. Các con tôi thân thiện và vui vẻ. Gia đình tôi đến từ Mỹ. Chúng tôi là người Mỹ.' },
                        { speaker: 'WOMAN', time: '00:12', en: 'How about you?', vi: 'Còn bạn thì sao?' },
                        { speaker: 'WOMAN', time: '00:18', en: 'Can you say 10 things using simple present with Be? You should try.', vi: 'Bạn có thể nói 10 điều bằng thì hiện tại đơn với Be không? Bạn nên thử.' }
                      ]
                    ]
                  },
                  2: {
                    id: 2,
                    title: 'Beginner English - 2 - Where Are You From?',
                    goal: 'Luyện nghe câu hỏi và câu trả lời về quê quán, thành phố sinh ra và xuất thân gia đình.',
                    duration: 65,
                    durationFormatted: '01:05',
                    sections: [
                      [
                        { speaker: 'WOMAN', time: '00:00', en: 'Hello! Today we are practicing asking and answering where people are from.', vi: 'Xin chào! Hôm nay chúng ta sẽ luyện hỏi và trả lời về quê quán, xuất xứ của mọi người.' },
                        { speaker: 'MAN', time: '00:06', en: 'Where are you from, Daniel? - I am from Canada. I live in Toronto, but I was born in Vancouver. It is a very beautiful city near the Pacific ocean.', vi: 'Bạn đến từ đâu thế Daniel? - Tôi đến từ Canada. Tôi sống ở Toronto, nhưng tôi sinh ra ở Vancouver. Đó là một thành phố rất đẹp gần Thái Bình Dương.' },
                        { speaker: 'WOMAN', time: '00:15', en: 'What about your parents? Are they from Canada too? - My father is from England, and my mother is from Australia. They moved to Canada twenty years ago.', vi: 'Còn bố mẹ của bạn thì sao? Họ cũng đến từ Canada à? - Bố tôi đến từ nước Anh, còn mẹ tôi đến từ nước Úc. Họ chuyển đến Canada hai mươi năm trước.' },
                        { speaker: 'MAN', time: '00:24', en: 'That is so interesting! English is spoken all around the world in different accents.', vi: 'Điều đó thật thú vị! Tiếng Anh được sử dụng trên toàn thế giới với nhiều ngữ điệu khác nhau.' }
                      ]
                    ]
                  }
                }
              },
              grammar: {
                name: 'Hội thoại ngữ pháp',
                lessons: {
                  1: {
                    id: 1,
                    title: 'Be Verbs - Present Simple - Beginner English Listening Lesson 1',
                    goal: 'Nghe bốn đoạn hội thoại sử dụng động từ Be ở thì hiện tại đơn.',
                    duration: 32,
                    durationFormatted: '00:32',
                    sections: [
                      [
                        { speaker: 'MAN', time: '00:00', en: 'Hello! Are you a new student?', vi: 'Xin chào! Bạn là sinh viên mới?' },
                        { speaker: 'WOMAN', time: '00:06', en: 'Yes, I am. Today is my first day.', vi: 'Vâng, đúng vậy. Hôm nay là ngày đầu tiên của tôi.' },
                        { speaker: 'MAN', time: '00:12', en: 'Well, welcome. My name is Tony.', vi: 'Vâng, chào mừng. Tên tôi là Tony.' },
                        { speaker: 'WOMAN', time: '00:18', en: "Hi, Tony. I'm Beth.", vi: 'Chào Tony. Tôi là Beth.' },
                        { speaker: 'MAN', time: '00:24', en: 'Are you new in town?', vi: 'Bạn mới đến thị trấn phải không?' },
                        { speaker: 'WOMAN', time: '00:30', en: "Yes, I'm from New York.", vi: 'Vâng, tôi đến từ New York.' }
                      ],
                      [
                        { speaker: 'MAN', time: '00:00', en: 'Are you hungry? There is a nice cafe over there.', vi: 'Bạn có đói không? Có một quán cà phê rất tuyệt đằng kia.' },
                        { speaker: 'WOMAN', time: '00:05', en: 'Yes, I am a little hungry! What are their sandwiches like?', vi: 'Vâng, tôi hơi đói! Bánh mì kẹp của họ như thế nào?' },
                        { speaker: 'MAN', time: '00:11', en: 'They are very fresh and delicious.', vi: 'Chúng rất tươi và ngon miệng.' },
                        { speaker: 'WOMAN', time: '00:16', en: "Great! Let's go there right now.", vi: 'Tuyệt quá! Chúng mình cùng đi tới đó ngay nhé.' }
                      ],
                      [
                        { speaker: 'WOMAN', time: '00:00', en: 'Is this your textbook on the table?', vi: 'Đây có phải sách giáo trình của bạn trên bàn không?' },
                        { speaker: 'MAN', time: '00:05', en: "No, it isn't. Mine is in my backpack.", vi: 'Không, không phải. Của tôi ở trong ba lô cơ.' },
                        { speaker: 'WOMAN', time: '00:10', en: 'Whose book is it then? It is open to page twenty.', vi: 'Vậy thì sách của ai nhỉ? Nó đang mở ở trang hai mươi.' },
                        { speaker: 'MAN', time: '00:15', en: "It is probably Mark's. He is in our English class.", vi: 'Chắc là của Mark đấy. Cậu ấy học cùng lớp tiếng Anh với chúng mình.' }
                      ],
                      [
                        { speaker: 'MAN', time: '00:00', en: 'Where are our teachers today?', vi: 'Các thầy cô giáo của chúng ta hôm nay ở đâu vậy?' },
                        { speaker: 'WOMAN', time: '00:05', en: 'They are in the faculty meeting room.', vi: 'Họ đang ở trong phòng họp khoa.' },
                        { speaker: 'MAN', time: '00:10', en: 'Is the meeting long?', vi: 'Cuộc họp có kéo dài không?' },
                        { speaker: 'WOMAN', time: '00:14', en: 'No, it is almost finished. Class starts soon.', vi: 'Không, sắp xong rồi. Lớp học sắp bắt đầu ngay thôi.' }
                      ]
                    ]
                  },
                  2: {
                    id: 2,
                    title: 'Yes-No Questions with Be Verbs - Beginner English Listening Lesson 2',
                    goal: 'Thực hành nghe câu hỏi Yes/No với động từ to be và cách trả lời ngắn gọn.',
                    duration: 35,
                    durationFormatted: '00:35',
                    sections: [
                      [
                        { speaker: 'MAN', time: '00:00', en: 'Are you ready for the exam today?', vi: 'Bạn đã sẵn sàng cho kỳ thi hôm nay chưa?' },
                        { speaker: 'WOMAN', time: '00:05', en: 'Yes, I am! I studied all weekend.', vi: 'Vâng, tôi sẵn sàng rồi! Tôi đã học suốt cả cuối tuần.' },
                        { speaker: 'MAN', time: '00:10', en: 'Is it going to be difficult?', vi: 'Liệu nó có khó không nhỉ?' },
                        { speaker: 'WOMAN', time: '00:15', en: "No, it isn't. The teacher said it is basic grammar.", vi: 'Không khó đâu. Cô giáo bảo là ngữ pháp cơ bản mà.' }
                      ]
                    ]
                  },
                  3: { id: 3, title: 'Likes and Food - Beginner English Listening Lesson 3', goal: 'Luyện nghe câu khẳng định và phủ định về sở thích món ăn.', duration: 38, durationFormatted: '00:38', sections: [[{ speaker: 'MAN', time: '00:00', en: 'What is your favorite food? Is it pizza?', vi: 'Món ăn yêu thích của bạn là gì? Có phải pizza không?' }, { speaker: 'WOMAN', time: '00:06', en: 'Yes, it is! Pizza is delicious.', vi: 'Đúng vậy! Pizza ngon tuyệt.' }]] },
                  4: { id: 4, title: 'Verbs - Present Simple - Beginner English Listening Lesson 4', goal: 'Nghe các động từ hành động phổ biến ở thì hiện tại đơn.', duration: 40, durationFormatted: '00:40', sections: [[{ speaker: 'MAN', time: '00:00', en: 'Do you study English every day?', vi: 'Bạn có học tiếng Anh mỗi ngày không?' }, { speaker: 'WOMAN', time: '00:05', en: 'Yes, I listen to audio lessons every morning.', vi: 'Có chứ, tôi nghe bài học âm thanh mỗi sáng.' }]] },
                  5: { id: 5, title: 'Yes / No Questions with Verbs - Beginner English Listening Lesson 5', goal: 'Hỏi đáp Yes/No với trợ động từ Do / Does.', duration: 42, durationFormatted: '00:42', sections: [[{ speaker: 'MAN', time: '00:00', en: 'Do you play tennis after class?', vi: 'Bạn có chơi quần vợt sau giờ học không?' }, { speaker: 'WOMAN', time: '00:06', en: "No, I don't. I usually read books.", vi: 'Không, tôi thường đọc sách hơn.' }]] },
                  6: { id: 6, title: 'Third Person Singular - Beginner English Listening Lesson 6', goal: 'Phân biệt ngôi thứ ba số ít (he/she/it + V-s/es).', duration: 36, durationFormatted: '00:36', sections: [[{ speaker: 'MAN', time: '00:00', en: 'Does Sarah work at the hospital?', vi: 'Sarah có làm việc ở bệnh viện không?' }, { speaker: 'WOMAN', time: '00:06', en: 'Yes, she does. She teaches nurses.', vi: 'Có chứ. Cô ấy giảng dạy cho các y tá.' }]] },
                  7: { id: 7, title: 'ELLLO - Beginner English - A1 - Adjectives (1)', goal: 'Luyện nghe tính từ miêu tả tính cách và ngoại hình.', duration: 34, durationFormatted: '00:34', sections: [[{ speaker: 'MAN', time: '00:00', en: 'Is your new apartment big or small?', vi: 'Căn hộ mới của bạn to hay nhỏ?' }, { speaker: 'WOMAN', time: '00:05', en: 'It is small, but it is very cozy.', vi: 'Nó nhỏ thôi, nhưng rất ấm cúng.' }]] },
                  8: { id: 8, title: 'ELLLO - Beginner English - A1 - Days of the Week', goal: 'Nghe lịch trình các ngày trong tuần.', duration: 30, durationFormatted: '00:30', sections: [[{ speaker: 'MAN', time: '00:00', en: 'What day is it today? Is it Tuesday?', vi: 'Hôm nay là thứ mấy? Có phải thứ Ba không?' }, { speaker: 'WOMAN', time: '00:05', en: 'No, today is Wednesday.', vi: 'Không, hôm nay là thứ Tư.' }]] },
                  9: { id: 9, title: 'ELLLO - Beginner English - A1 - Subject Pronouns', goal: 'Luyện nghe đại từ nhân xưng chủ ngữ (I, you, he, she, we, they).', duration: 35, durationFormatted: '00:35', sections: [[{ speaker: 'MAN', time: '00:00', en: 'Who are they? Are they your classmates?', vi: 'Họ là ai thế? Có phải bạn cùng lớp không?' }, { speaker: 'WOMAN', time: '00:05', en: 'Yes, we study English together.', vi: 'Đúng vậy, chúng tôi cùng học tiếng Anh.' }]] },
                  10: { id: 10, title: 'ELLLO - Beginner English - A1 - Object Pronouns', goal: 'Luyện nghe đại từ tân ngữ (me, you, him, her, us, them).', duration: 38, durationFormatted: '00:38', sections: [[{ speaker: 'MAN', time: '00:00', en: 'Can you help me with this exercise?', vi: 'Bạn có thể giúp tôi bài tập này không?' }, { speaker: 'WOMAN', time: '00:05', en: 'Sure! Let me look at it.', vi: 'Chắc chắn rồi! Để tôi xem nào.' }]] },
                  11: { id: 11, title: 'ELLLO - Beginner English - A1 - Demonstratives - This, That, These, Those', goal: 'Phân biệt đại từ chỉ định gần/xa, số ít/số nhiều.', duration: 40, durationFormatted: '00:40', sections: [[{ speaker: 'MAN', time: '00:00', en: 'Is this your pen or that pen over there?', vi: 'Đây là bút của bạn hay là cái bút đằng kia?' }, { speaker: 'WOMAN', time: '00:05', en: 'This one is mine, thanks!', vi: 'Cái này là của tôi, cảm ơn nhé!' }]] },
                  12: { id: 12, title: 'ELLLO - Beginner English - A1 - Be Verbs - Present Simple', goal: 'Ôn tập tổng hợp động từ to be.', duration: 33, durationFormatted: '00:33', sections: [[{ speaker: 'MAN', time: '00:00', en: 'We are ready for the presentation.', vi: 'Chúng tôi đã sẵn sàng cho bài thuyết trình.' }, { speaker: 'WOMAN', time: '00:05', en: 'Excellent. You are doing great!', vi: 'Xuất sắc lắm. Bạn đang làm rất tốt!' }]] },
                  13: { id: 13, title: 'ELLLO - Beginner English - A1 - Months', goal: 'Luyện nghe 12 tháng trong năm và sinh nhật.', duration: 35, durationFormatted: '00:35', sections: [[{ speaker: 'MAN', time: '00:00', en: 'When is your birthday? Is it in July?', vi: 'Sinh nhật của bạn khi nào? Vào tháng Bảy à?' }, { speaker: 'WOMAN', time: '00:05', en: 'No, it is in August.', vi: 'Không, vào tháng Tám cơ.' }]] },
                  14: { id: 14, title: 'ELLLO - Beginner English - A1 - Seasons and Weather', goal: 'Nghe miêu tả bốn mùa và thời tiết.', duration: 35, durationFormatted: '00:35', sections: [[{ speaker: 'MAN', time: '00:00', en: 'It is very cold this winter.', vi: 'Mùa đông năm nay thật lạnh.' }, { speaker: 'WOMAN', time: '00:05', en: 'Yes, but snow is very pretty.', vi: 'Vâng, nhưng tuyết rơi thì rất đẹp.' }]] },
                  15: { id: 15, title: 'ELLLO - Beginner English - A1 - Prepositions of Place', goal: 'Nghe giới từ chỉ vị trí (in, on, under, next to).', duration: 36, durationFormatted: '00:36', sections: [[{ speaker: 'MAN', time: '00:00', en: 'Where are my keys? Are they on the table?', vi: 'Chìa khóa của tôi đâu? Có trên bàn không?' }, { speaker: 'WOMAN', time: '00:05', en: 'No, they are next to your phone.', vi: 'Không, chúng ở cạnh điện thoại của bạn.' }]] },
                  16: { id: 16, title: 'ELLLO - Beginner English - A1 - Telling Time', goal: 'Nghe cách hỏi và nói giờ trong tiếng Anh.', duration: 32, durationFormatted: '00:32', sections: [[{ speaker: 'MAN', time: '00:00', en: 'What time is it right now?', vi: 'Bây giờ là mấy giờ rồi?' }, { speaker: 'WOMAN', time: '00:05', en: 'It is half past ten.', vi: 'Bây giờ là mười giờ rưỡi.' }]] },
                  17: { id: 17, title: 'ELLLO - Beginner English - A1 - Routine Verbs', goal: 'Nghe thói quen sinh hoạt hàng ngày.', duration: 36, durationFormatted: '00:36', sections: [[{ speaker: 'MAN', time: '00:00', en: 'I wake up at six thirty every morning.', vi: 'Tôi thức dậy lúc sáu giờ rưỡi mỗi sáng.' }, { speaker: 'WOMAN', time: '00:05', en: 'That is early! I wake up at eight.', vi: 'Sớm thế! Tôi tám giờ mới dậy.' }]] },
                  18: { id: 18, title: 'ELLLO - Beginner English - A1 - Can / Cannot', goal: "Nghe diễn đạt khả năng với Can/Can't.", duration: 34, durationFormatted: '00:34', sections: [[{ speaker: 'MAN', time: '00:00', en: 'Can you swim or play guitar?', vi: 'Bạn biết bơi hay chơi đàn ghi-ta không?' }, { speaker: 'WOMAN', time: '00:05', en: 'I can swim, but I cannot play guitar.', vi: 'Tôi biết bơi, nhưng không biết chơi đàn.' }]] },
                  19: { id: 19, title: 'ELLLO - Beginner English - A1 - Have / Has', goal: 'Luyện nghe động từ sở hữu Have / Has.', duration: 35, durationFormatted: '00:35', sections: [[{ speaker: 'MAN', time: '00:00', en: 'Do you have any pets at home?', vi: 'Bạn có nuôi thú cưng nào ở nhà không?' }, { speaker: 'WOMAN', time: '00:05', en: 'Yes, I have two friendly cats.', vi: 'Có chứ, tôi có hai chú mèo rất thân thiện.' }]] },
                  20: { id: 20, title: 'ELLLO - Beginner English - A1 - Questions with Where and When', goal: 'Nghe câu hỏi với Where (ở đâu) và When (khi nào).', duration: 35, durationFormatted: '00:35', sections: [[{ speaker: 'MAN', time: '00:00', en: 'Where is the library and when does it open?', vi: 'Thư viện ở đâu và khi nào mở cửa?' }, { speaker: 'WOMAN', time: '00:06', en: 'It is near building A, and it opens at nine.', vi: 'Nó ở gần tòa nhà A và mở lúc 9 giờ.' }]] },
                  21: { id: 21, title: 'ELLLO - Beginner English - A1 - Simple Present Questions', goal: 'Luyện nghe câu hỏi tổng hợp thì hiện tại đơn.', duration: 38, durationFormatted: '00:38', sections: [[{ speaker: 'MAN', time: '00:00', en: 'What do you do on weekends?', vi: 'Bạn thường làm gì vào cuối tuần?' }, { speaker: 'WOMAN', time: '00:05', en: 'I visit my grandparents in the countryside.', vi: 'Tôi về quê thăm ông bà.' }]] },
                  22: { id: 22, title: 'ELLLO - Beginner English - A1 - Countable and Uncountable Nouns', goal: 'Phân biệt danh từ đếm được và không đếm được.', duration: 37, durationFormatted: '00:37', sections: [[{ speaker: 'MAN', time: '00:00', en: 'We need some apples and milk from the market.', vi: 'Chúng mình cần mua vài quả táo và sữa ở chợ.' }, { speaker: 'WOMAN', time: '00:06', en: 'Okay, I will write them on our shopping list.', vi: 'Được rồi, tôi sẽ ghi vào danh sách mua sắm.' }]] },
                  23: { id: 23, title: 'ELLLO - Beginner English - A1 - There is / There are', goal: 'Luyện nghe cấu trúc There is / There are chỉ sự tồn tại.', duration: 36, durationFormatted: '00:36', sections: [[{ speaker: 'MAN', time: '00:00', en: 'There is a park near my house, and there are many trees.', vi: 'Có một công viên gần nhà tôi và có rất nhiều cây xanh.' }, { speaker: 'WOMAN', time: '00:06', en: 'Sounds like a great place to jog!', vi: 'Nghe có vẻ là nơi lý tưởng để chạy bộ đấy!' }]] },
                  24: { id: 24, title: 'ELLLO - Beginner English - A1 - Present Continuous', goal: 'Luyện nghe thì hiện tại tiếp diễn (hành động đang diễn ra).', duration: 36, durationFormatted: '00:36', sections: [[{ speaker: 'MAN', time: '00:00', en: 'What are you doing right now?', vi: 'Cậu đang làm gì đấy?' }, { speaker: 'WOMAN', time: '00:05', en: 'I am practicing my English listening skills!', vi: 'Tôi đang luyện kỹ năng nghe tiếng Anh!' }]] },
                  25: { id: 25, title: 'ELLLO - Beginner English - A1 - Past Simple with Be (Was / Were)', goal: 'Luyện nghe động từ to be ở quá khứ đơn (Was / Were).', duration: 38, durationFormatted: '00:38', sections: [[{ speaker: 'MAN', time: '00:00', en: 'Where were you yesterday afternoon?', vi: 'Chiều hôm qua bạn ở đâu thế?' }, { speaker: 'WOMAN', time: '00:05', en: 'I was at the library studying with my friends.', vi: 'Tôi ở thư viện học bài cùng bạn bè.' }]] }
                }
              }
            };

            let currentTopicKey = 'short';
            let currentBasicLessonId = 1;
            let currentSectionIdx = 0;

            const basicGoalCard = document.getElementById('basicGoalCard');
            const basicGoalTitle = document.getElementById('basicGoalTitle');
            const basicGoalDesc = document.getElementById('basicGoalDesc');
            const basicSectionsBar = document.getElementById('basicSectionsBar');
            const basicNotesInput = document.getElementById('basicNotesInput');
            const basicNotesStatus = document.getElementById('basicNotesStatus');
            const basicNotesWordCount = document.getElementById('basicNotesWordCount');
            const speech = window.speechSynthesis;
            const basicPlayButton = document.getElementById('basicPlayButton');
            const basicProgress = document.getElementById('basicProgress');
            const basicCurrentTime = document.getElementById('basicCurrentTime');
            const basicDuration = document.getElementById('basicDuration');
            const basicLessonListHeader = document.getElementById('basicLessonListHeader');
            const basicLessonItemsContainer = document.getElementById('basicLessonItemsContainer');
            const basicCurrentLessonHeading = document.getElementById('basicCurrentLessonHeading');
            const basicTranscriptList = document.getElementById('basicTranscriptList');
            const basicPrevLesson = document.getElementById('basicPrevLesson');
            const basicNextLesson = document.getElementById('basicNextLesson');
            let basicNotesTimer = null;
            let basicPlaybackTimer = null;
            let basicElapsed = 0;

            function formatBasicTime(seconds) {
              return `${String(Math.floor(seconds / 60)).padStart(2, '0')}:${String(seconds % 60).padStart(2, '0')}`;
            }

            function updateBasicProgress() {
              basicProgress.value = String(basicElapsed);
              basicCurrentTime.textContent = formatBasicTime(basicElapsed);
            }

            function speakBasicText(text) {
              if (!speech || !('SpeechSynthesisUtterance' in window)) return;
              speech.cancel();
              const utterance = new SpeechSynthesisUtterance(text);
              utterance.lang = 'en-US';
              utterance.volume = Number(document.querySelector('.basic-player-tools input').value) / 100;
              utterance.onend = () => {
                clearInterval(basicPlaybackTimer);
                basicPlaybackTimer = null;
                basicPlayButton.innerHTML = '<i class="fa-solid fa-play" aria-hidden="true"></i>';
                basicPlayButton.setAttribute('aria-label', 'Ph\u00E1t b\u00E0i nghe');
              };
              speech.speak(utterance);
            }

            function loadBasicNotes() {
              if (!basicNotesInput) return;
              try {
                const key = `tart-basic-notes-${currentTopicKey}-lesson-${currentBasicLessonId}`;
                const saved = localStorage.getItem(key) || '';
                basicNotesInput.value = saved;
                basicNotesWordCount.textContent = `${saved.length} k\u00FD t\u1EF1`;
                basicNotesStatus.textContent = '';
              } catch (e) {}
            }

            if (basicNotesInput) {
              loadBasicNotes();
              basicNotesInput.addEventListener('input', () => {
                const val = basicNotesInput.value;
                basicNotesWordCount.textContent = `${val.length} k\u00FD t\u1EF1`;
                basicNotesStatus.textContent = '\u0110ang l\u01B0u...';
                clearTimeout(basicNotesTimer);
                basicNotesTimer = setTimeout(() => {
                  try {
                    const key = `tart-basic-notes-${currentTopicKey}-lesson-${currentBasicLessonId}`;
                    localStorage.setItem(key, val);
                    basicNotesStatus.textContent = '\u0110\u00E3 t\u1EF1 \u0111\u1ED9ng l\u01B0u';
                    setTimeout(() => { basicNotesStatus.textContent = ''; }, 2000);
                  } catch (e) {
                    basicNotesStatus.textContent = 'Kh\u00F4ng th\u1EC3 l\u01B0u';
                  }
                }, 300);
              });
            }

            function renderTranscriptContent(lesson) {
              const showTranslations = document.getElementById('basicTranslateButton').getAttribute('aria-pressed') === 'true';
              const dialogues = (lesson.sections && lesson.sections[currentSectionIdx]) ? lesson.sections[currentSectionIdx] : (lesson.sections ? lesson.sections[0] : []);
              
              basicTranscriptList.innerHTML = dialogues.map(item => {
                const speakerClass = (item.speaker || '').toLowerCase() === 'man' ? 'man' : 'woman';
                return `
                  <article class="basic-dialogue-card">
                    <div class="basic-dialogue-meta">
                      <div class="basic-dialogue-speaker-wrap">
                        ${item.speaker ? `<span class="basic-speaker-tag ${speakerClass}">${item.speaker}</span>` : ''}
                        <span class="basic-dialogue-time">${item.time || '00:00'}</span>
                      </div>
                      <button class="basic-dialogue-play-btn" type="button" data-speak="${item.en.replace(/"/g, '&quot;')}">
                        <i class="fa-solid fa-play" aria-hidden="true"></i> Play
                      </button>
                    </div>
                    <p class="basic-dialogue-en">${item.en}</p>
                    <p class="basic-dialogue-vi"${showTranslations ? '' : ' hidden'}>${item.vi}</p>
                  </article>
                `;
              }).join('');

              basicTranscriptList.querySelectorAll('[data-speak]').forEach(btn => {
                btn.addEventListener('click', () => speakBasicText(btn.dataset.speak));
              });
            }

            function renderSectionsBar(lesson) {
              if (lesson.sections && lesson.sections.length > 1) {
                basicSectionsBar.hidden = false;
                basicSectionsBar.innerHTML = lesson.sections.map((_, idx) => `
                  <button class="basic-section-tab" type="button" role="tab" aria-selected="${idx === currentSectionIdx}" data-section-idx="${idx}">\u0110o\u1EA1n ${idx + 1}</button>
                `).join('');

                basicSectionsBar.querySelectorAll('.basic-section-tab').forEach(tab => {
                  tab.addEventListener('click', () => {
                    currentSectionIdx = Number(tab.dataset.sectionIdx);
                    basicSectionsBar.querySelectorAll('.basic-section-tab').forEach(t => {
                      t.setAttribute('aria-selected', String(t === tab));
                    });
                    renderTranscriptContent(lesson);
                  });
                });
              } else {
                basicSectionsBar.hidden = true;
                currentSectionIdx = 0;
              }
            }

            function loadLessonListForCurrentTopic() {
              const topic = basicTopicsData[currentTopicKey];
              const lessonIds = Object.keys(topic.lessons).map(Number).sort((a,b)=>a-b);
              const totalLessons = lessonIds.length;

              basicLessonListHeader.textContent = `DANH S\u00C1CH B\u00C0I H\u1ECCC (${currentBasicLessonId} / ${totalLessons})`;

              basicLessonItemsContainer.innerHTML = lessonIds.map(id => {
                const l = topic.lessons[id];
                const isCurrent = id === currentBasicLessonId;
                return `
                  <button class="basic-lesson-item" type="button" aria-current="${isCurrent}" data-lesson-id="${id}">
                    <span class="basic-lesson-item-number">${isCurrent ? '<i class="fa-solid fa-play" aria-hidden="true"></i>' : id}</span>
                    <span>${l.title}</span>
                  </button>
                `;
              }).join('');

              basicLessonItemsContainer.querySelectorAll('.basic-lesson-item').forEach(btn => {
                btn.addEventListener('click', () => {
                  switchBasicLesson(Number(btn.dataset.lessonId));
                });
              });
            }

            function switchBasicLesson(lessonId) {
              const topic = basicTopicsData[currentTopicKey];
              const lesson = topic.lessons[lessonId];
              if (!lesson) return;

              currentBasicLessonId = lessonId;
              currentSectionIdx = 0;

              // Reset audio player
              if (speech) speech.cancel();
              clearInterval(basicPlaybackTimer);
              basicPlaybackTimer = null;
              basicElapsed = 0;
              basicProgress.max = String(lesson.duration || 60);
              basicProgress.value = '0';
              basicCurrentTime.textContent = '00:00';
              basicDuration.textContent = lesson.durationFormatted || '00:30';
              basicPlayButton.innerHTML = '<i class="fa-solid fa-play" aria-hidden="true"></i>';

              // Cập nhật Mục tiêu bài học (hiện khi có goal)
              if (lesson.goal) {
                basicGoalCard.hidden = false;
                basicGoalDesc.textContent = lesson.goal;
              } else {
                basicGoalCard.hidden = true;
              }

              // Cập nhật tiêu đề & header danh sách
              basicCurrentLessonHeading.textContent = lesson.title;
              const totalLessons = Object.keys(topic.lessons).length;
              basicLessonListHeader.textContent = `DANH S\u00C1CH B\u00C0I H\u1ECCC (${lessonId} / ${totalLessons})`;

              // Cập nhật active trong danh sách bài
              basicLessonItemsContainer.querySelectorAll('.basic-lesson-item').forEach(item => {
                const isCurrent = Number(item.dataset.lessonId) === lessonId;
                item.setAttribute('aria-current', String(isCurrent));
                const numSpan = item.querySelector('.basic-lesson-item-number');
                if (numSpan) {
                  numSpan.innerHTML = isCurrent ? '<i class="fa-solid fa-play" aria-hidden="true"></i>' : String(item.dataset.lessonId);
                }
              });

              // Nút trước / tiếp theo
              basicPrevLesson.disabled = (lessonId <= 1);
              basicNextLesson.disabled = (lessonId >= totalLessons);

              // Render thanh chọn đoạn hội thoại & transcript
              renderSectionsBar(lesson);
              renderTranscriptContent(lesson);

              // Tải ghi chú riêng
              loadBasicNotes();
            }

            // Chuyển chủ đề: Hội thoại ngắn <-> Hội thoại ngữ pháp
            document.querySelectorAll('.basic-topic').forEach(button => {
              button.addEventListener('click', () => {
                document.querySelectorAll('.basic-topic').forEach(b => b.setAttribute('aria-pressed', String(b === button)));
                const topicKey = button.dataset.topic;
                if (topicKey && basicTopicsData[topicKey]) {
                  currentTopicKey = topicKey;
                  currentBasicLessonId = 1;
                  loadLessonListForCurrentTopic();
                  switchBasicLesson(1);
                }
              });
            });

            // Nút Bài trước / Bài tiếp theo
            basicPrevLesson.addEventListener('click', () => {
              if (currentBasicLessonId > 1) switchBasicLesson(currentBasicLessonId - 1);
            });
            basicNextLesson.addEventListener('click', () => {
              const totalLessons = Object.keys(basicTopicsData[currentTopicKey].lessons).length;
              if (currentBasicLessonId < totalLessons) switchBasicLesson(currentBasicLessonId + 1);
            });

            // Tab Nội dung / Ghi chú
            document.querySelectorAll('[data-transcript-tab]').forEach(button => {
              button.addEventListener('click', () => {
                const showNotes = button.dataset.transcriptTab === 'notes';
                document.querySelectorAll('[data-transcript-tab]').forEach(item => item.setAttribute('aria-selected', String(item === button)));
                document.getElementById('basicTranscriptList').hidden = showNotes;
                document.getElementById('basicNotes').hidden = !showNotes;
                if (basicSectionsBar) basicSectionsBar.style.display = showNotes ? 'none' : 'flex';
              });
            });

            // Dịch song ngữ
            document.getElementById('basicTranslateButton').addEventListener('click', event => {
              const showTranslations = event.currentTarget.getAttribute('aria-pressed') !== 'true';
              event.currentTarget.setAttribute('aria-pressed', String(showTranslations));
              document.querySelectorAll('.basic-dialogue-vi, .basic-transcript-vi').forEach(item => { item.hidden = !showTranslations; });
            });

            // Đánh giá bài học
            document.querySelectorAll('.basic-rating button').forEach(button => {
              button.addEventListener('click', () => {
                document.querySelectorAll('.basic-rating button').forEach(item => item.setAttribute('aria-pressed', String(item === button)));
              });
            });

            // Điều khiển Trình phát âm thanh
            basicPlayButton.addEventListener('click', () => {
              if (!speech || !('SpeechSynthesisUtterance' in window)) return;
              if (speech.speaking && !speech.paused) {
                speech.pause();
                clearInterval(basicPlaybackTimer);
                basicPlaybackTimer = null;
                basicPlayButton.innerHTML = '<i class="fa-solid fa-play" aria-hidden="true"></i>';
                basicPlayButton.setAttribute('aria-label', 'Ti\u1EBFp t\u1EE5c b\u00E0i nghe');
                return;
              }
              if (speech.paused) {
                speech.resume();
              } else {
                basicElapsed = 0;
                const fullText = [...document.querySelectorAll('.basic-dialogue-en, .basic-transcript-en')].map(item => item.textContent).join('. ');
                speakBasicText(fullText);
              }
              basicPlayButton.innerHTML = '<i class="fa-solid fa-pause" aria-hidden="true"></i>';
              basicPlayButton.setAttribute('aria-label', 'T\u1EA1m d\u1EEBng b\u00E0i nghe');
              if (!basicPlaybackTimer) basicPlaybackTimer = setInterval(() => {
                const curLesson = basicTopicsData[currentTopicKey].lessons[currentBasicLessonId];
                const maxDuration = curLesson.duration || 60;
                basicElapsed = Math.min(maxDuration, basicElapsed + 1);
                updateBasicProgress();
                if (basicElapsed >= maxDuration) {
                  clearInterval(basicPlaybackTimer);
                  basicPlaybackTimer = null;
                  basicPlayButton.innerHTML = '<i class="fa-solid fa-play" aria-hidden="true"></i>';
                }
              }, 1000);
            });

            document.querySelectorAll('[data-seek]').forEach(button => button.addEventListener('click', () => {
              const curLesson = basicTopicsData[currentTopicKey].lessons[currentBasicLessonId];
              const maxDuration = curLesson.duration || 60;
              basicElapsed = Math.max(0, Math.min(maxDuration, basicElapsed + Number(button.dataset.seek)));
              updateBasicProgress();
            }));

            basicProgress.addEventListener('input', () => {
              basicElapsed = Number(basicProgress.value);
              updateBasicProgress();
            });

            // Khởi tạo danh sách bài ban đầu
            loadLessonListForCurrentTopic();
            switchBasicLesson(1);
            document.getElementById('closeListeningModal').addEventListener('click', closeInfo);
            document.getElementById('listeningModalDone').addEventListener('click', closeInfo);
            modal.addEventListener('click', (event) => { if (event.target === modal) closeInfo(); });
            document.addEventListener('keydown', (event) => { if (event.key === 'Escape') closeInfo(); });
            const toggle = document.getElementById('topicModeToggle');
            const topicModeLabel = document.getElementById('topicModeLabel');
            const partOverviewGrid = document.getElementById('partOverviewGrid');
            const topicDetailContainer = document.getElementById('topicDetailContainer');

            // Khởi tạo trạng thái ban đầu: Chưa bật (hiện Chủ đề, ẩn Part)
            partOverviewGrid.hidden = true;
            partOverviewGrid.style.display = 'none';
            topicDetailContainer.hidden = false;
            topicDetailContainer.style.display = 'flex';
            topicModeLabel.textContent = 'Luy\u1EC7n nghe theo Ch\u1EE7 \u0111\u1EC1';
            toggle.setAttribute('aria-checked', 'false');
            toggle.classList.remove('bg-cyan-500');
            toggle.classList.add('bg-slate-300');
            toggle.querySelector('span').classList.remove('translate-x-6');
            toggle.querySelector('span').classList.add('translate-x-0');

            toggle.addEventListener('click', () => {
              const isChecked = toggle.getAttribute('aria-checked') !== 'true';
              toggle.setAttribute('aria-checked', String(isChecked));
              toggle.classList.toggle('bg-cyan-500', isChecked);
              toggle.classList.toggle('bg-slate-300', !isChecked);
              toggle.classList.toggle('dark:bg-slate-700', !isChecked);
              
              const knob = toggle.querySelector('span');
              knob.classList.toggle('translate-x-6', isChecked);
              knob.classList.toggle('translate-x-0', !isChecked);

              if (isChecked) {
                // KHI BẬT: hiện Luyện nghe theo Part (lưới 4 card rút gọn)
                topicModeLabel.textContent = 'Luy\u1EC7n nghe theo Part';
                partOverviewGrid.hidden = false;
                partOverviewGrid.style.display = 'grid';
                topicDetailContainer.hidden = true;
                topicDetailContainer.style.display = 'none';
              } else {
                // KHI CHƯA BẬT: hiện Luyện nghe theo Chủ đề (danh sách từng Part kèm chủ đề con)
                topicModeLabel.textContent = 'Luy\u1EC7n nghe theo Ch\u1EE7 \u0111\u1EC1';
                partOverviewGrid.hidden = true;
                partOverviewGrid.style.display = 'none';
                topicDetailContainer.hidden = false;
                topicDetailContainer.style.display = 'flex';
              }
            });

            document.querySelectorAll('.listen-part-start').forEach(button => {
              button.addEventListener('click', () => {
                openListeningPractice(button);
              });
            });

            // Goal settings & Profile Menu
            const profileMenuTrigger = document.getElementById('profileMenuTrigger');
            const profileMenu = document.getElementById('profileMenu');

            function closeProfileMenu(restoreFocus = false) {
              if (!profileMenu || profileMenu.hidden) return;
              profileMenu.hidden = true;
              profileMenuTrigger?.setAttribute('aria-expanded', 'false');
              if (restoreFocus) profileMenuTrigger?.focus();
            }

            profileMenuTrigger?.addEventListener('click', () => {
              if (!profileMenu) return;
              const isOpening = profileMenu.hidden;
              profileMenu.hidden = !isOpening;
              profileMenuTrigger.setAttribute('aria-expanded', String(isOpening));
              if (isOpening) profileMenu.querySelector('[role="menuitem"]')?.focus();
            });

            document.addEventListener('click', (event) => {
              if (!event.target.closest('.profile-menu-wrap')) closeProfileMenu();
            });
            document.addEventListener('keydown', (event) => {
              if (!profileMenu || profileMenu.hidden) return;
              if (event.key === 'Escape') {
                closeProfileMenu(true);
              } else if (event.key === 'Tab' && !profileMenu.contains(event.target) &&
                  event.target !== profileMenuTrigger) {
                closeProfileMenu();
              }
            });

            document.getElementById('profileFeedbackButton')?.addEventListener('click', () => {
              closeProfileMenu();
              if (typeof triggerFeedbackModal === 'function') triggerFeedbackModal();
            });

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
              if (goalSaveButton && goalForm) goalSaveButton.disabled = !goalForm.checkValidity();
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
              goalScoreInput?.focus();
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
                lastElement?.focus();
              } else if (!event.shiftKey && document.activeElement === lastElement) {
                event.preventDefault();
                firstElement?.focus();
              }
            });

          })();
