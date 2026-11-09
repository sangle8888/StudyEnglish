/* =========================================================
 * MAIN JS MODULE: grammar catalog and practice interactions
 * ========================================================= */
(() => {
  // Main grammar interactions. The host page supplies #dashboardLayout and the shared feedback fallback.
  const grammarData = window.GRAMMAR_DATA || { groups: [], state: {} };
  const grammarState = grammarData.state || {};
  const grammarGroups = grammarData.groups || [];

  const totalTopics = grammarGroups.reduce(
    (sum, group) => sum + group.topics.length,
    0,
  );
  // Trạng thái học viên được nạp từ cơ sở dữ liệu (xem GrammarController.Index)
  const grammarApiUrls = window.GRAMMAR_API || {};
  const savedTopics = new Set();
  const savedQuestions = new Set(grammarState.bookmarks || []);
  const answeredQuestions = new Set(grammarState.answeredQuestions || []);
  const savedTheories = [...(grammarState.notes || [])];
  const topicStats = { ...(grammarState.topicStats || {}) };
  let answeredTotal = Number(grammarState.answeredTotal || 0);
  let correctTotal = Number(grammarState.correctTotal || 0);

  async function grammarApi(url, payload) {
    const token = document.querySelector(
      '#grammarAntiforgery input[name="__RequestVerificationToken"]',
    )?.value;
    const response = await fetch(url, {
      method: "POST",
      credentials: "same-origin",
      headers: {
        "Content-Type": "application/json",
        RequestVerificationToken: token || "",
      },
      body: JSON.stringify(payload),
    });
    if (!response.ok) {
      let message = `Lỗi ${response.status}`;
      try {
        const data = await response.json();
        if (data && data.message) message = data.message;
      } catch (_) {}
      throw new Error(message);
    }
    return response.json();
  }

  function addNoteOnServer(note) {
    note.pending = grammarApi(grammarApiUrls.saveNote, {
      topic: note.topic,
      type: note.type,
      typeLabel: note.typeLabel,
      content: note.content,
      subContent: note.subContent || null,
    })
      .then((saved) => {
        note.id = saved.id;
      })
      .catch(showSyncError);
  }

  function removeNoteOnServer(note) {
    return Promise.resolve(note.pending)
      .then(() =>
        note.id && !String(note.id).startsWith("tmp-")
          ? grammarApi(grammarApiUrls.removeNote, { noteId: numericId(note.id) })
          : null,
      )
      .catch(showSyncError);
  }

  function numericId(id) {
    return Number(String(id).replace(/^\D+/, ""));
  }

  function showSyncError(error) {
    console.error("Không thể đồng bộ dữ liệu với máy chủ:", error);
    const feedback = document.getElementById("practiceFeedback");
    if (feedback && !practicePage?.hidden) {
      feedback.dataset.syncError = "true";
    }
  }
  let activeExam = "all";
  let activeCategory = "all";
  let activeSort = "default";
  let activeTab = "learning";
  let selectedTestSize = 20;
  let sessionQuestions = [];
  let sessionAnswers = [];
  let questionIndex = 0;
  let questionAnswered = false;
  let sessionCorrect = 0;
  let sessionAttempted = 0;
  let practiceComplete = false;
  let isMiniTest = false;
  let miniTestTimeRemaining = 60;
  let miniTestTimerId = null;
  let translationVisible = false;
  let explanationVisible = false;
  let questionMapFilter = "all";
  let modalTrigger = null;
  let catalogWindowScrollY = 0;

  const dashboardLayout = document.getElementById("dashboardLayout");
  const topicSections = document.getElementById("topicSections");
  const filterPanel = document.getElementById("filterPanel");
  const categoryFilters = document.getElementById("categoryFilters");
  const filterBackdrop = document.getElementById("filterBackdrop");
  const filterToggle = document.getElementById("filterToggle");
  const grammarPage = document.getElementById("grammarPage");
  const grammarCatalog = document.getElementById("grammarCatalog");
  const practicePage = document.getElementById("practicePage");
  const practiceOptions = document.getElementById("practiceOptions");
  const practiceNext = document.getElementById("practiceNext");
  const practiceReportDialog = document.getElementById("practiceReportDialog");

  // Mỗi "chủ đề" gồm nhiều câu hỏi; câu hỏi mang theo thông tin nhóm/chủ đề để dùng chung với giao diện luyện tập.
  const topicRecords = grammarGroups.flatMap((group) =>
    group.topics.map((topic, index) => {
      const record = {
        id: topic.id,
        dbId: topic.dbId,
        group,
        index,
        title: topic.title,
        icon: topic.icon || "book-open",
        exam: topic.exam,
        theory: topic.theory,
        questions: [],
      };
      record.questions = topic.questions.map((item, questionIndex) => ({
        id: item.id,
        dbId: item.dbId,
        topicId: topic.id,
        topicDbId: topic.dbId,
        group,
        index: questionIndex,
        title: topic.title,
        icon: topic.icon || "book-open",
        exam: topic.exam,
        theory: item.theory || topic.theory,
        question: item.question,
        options: item.options,
        answer: item.answer,
        explanation: item.explanation,
        translation: item.translation,
        reasoning: item.reasoning,
      }));
      return record;
    }),
  );

  function allTopicRecords() {
    return topicRecords;
  }

  function allQuestionRecords() {
    return topicRecords.flatMap((record) => record.questions);
  }

  // Tiến độ được lưu trên máy chủ ngay khi trả lời; hàm này giữ lại cho các điểm gọi cũ.
  function saveProgress() {}

  function updateSummary() {
    const weakTopics = Object.values(topicStats).filter(
      (stat) => stat.wrong > 0,
    ).length;
    const accuracy = answeredTotal
      ? Math.round((correctTotal / answeredTotal) * 100)
      : 0;
    document.getElementById("answeredCount").textContent = answeredTotal;
    document.getElementById("topicCount").textContent = totalTopics;
    document.getElementById("weakCount").textContent = weakTopics;
    document.getElementById("bookmarkCount").textContent = savedQuestions.size + savedTheories.length;
    document.getElementById("accuracyValue").textContent = `${accuracy}%`;
    document.getElementById("accuracyFill").style.width = `${accuracy}%`;
    document
      .querySelector(".grammar-progress-track")
      .setAttribute("aria-valuenow", accuracy);
  }

  function updatePracticeActions(question) {
    const translationButton = document.getElementById(
      "practiceTranslationToggle",
    );
    const bookmarkButton = document.getElementById("practiceBookmarkToggle");
    const isSaved = savedQuestions.has(question.id);
    translationButton.setAttribute("aria-pressed", String(translationVisible));
    bookmarkButton.setAttribute("aria-pressed", String(isSaved));
    bookmarkButton.setAttribute(
      "aria-label",
      isSaved ? "Bỏ đánh dấu câu hỏi" : "Đánh dấu câu hỏi",
    );
    bookmarkButton.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="${isSaved ? "currentColor" : "none"}" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-bookmark"><path d="m19 21-7-4-7 4V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v16z"/></svg> <span>${isSaved ? "Đã đánh dấu" : "Đánh dấu"}</span>`;
    document
      .getElementById("practiceExplainToggle")
      .setAttribute("aria-pressed", String(explanationVisible));
    document.getElementById("practiceExplainToggle").disabled =
      !questionAnswered;
    practiceOptions
      .querySelectorAll(".practice-option-explanation")
      .forEach((note) => {
        note.hidden = !explanationVisible || !questionAnswered;
        const button = note.previousElementSibling;
        if (note.hidden) button.removeAttribute("aria-describedby");
        else button.setAttribute("aria-describedby", note.id);
      });
  }

  function makeTopicCard(record) {
    const stat = topicStats[record.id] || { done: 0, wrong: 0, correct: 0 };
    const accuracy = stat.done
      ? Math.round((stat.correct / stat.done) * 100)
      : 0;
    const isWeak = stat.done > 0 && accuracy < 50;
    const totalQuestions = record.questions.length;
    const answeredInTopic = record.questions.filter((item) =>
      answeredQuestions.has(item.id),
    ).length;
    const article = document.createElement("article");
    article.className = `topic-card ${isWeak ? "is-weak" : ""}`;
    article.dataset.topicId = record.id;
    article.dataset.group = record.group.id;
    article.dataset.exam = record.exam;
    article.dataset.title = record.title.toLocaleLowerCase("vi");
    article.dataset.wrong = stat.wrong;
    article.innerHTML = `
          <div class="topic-card-top">
            <span class="topic-card-icon" aria-hidden="true"><i data-lucide="${escapeHtml(record.icon || 'book-open')}"></i></span>
            <span class="topic-card-title">${record.title}</span>
            ${stat.done > 0 ? `
              <button class="topic-bookmark" type="button" data-reset-topic="${record.id}"
                aria-label="Làm lại từ đầu chủ đề ${record.title}"
                title="Làm lại từ đầu">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-rotate-ccw"><path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"></path><path d="M3 3v5h5"></path></svg>
              </button>
            ` : ""}
            <span class="topic-exam-badge">${record.exam}</span>
          </div>
          <div class="topic-progress">
            <div class="topic-progress-heading"><span>Mức độ chính xác</span><strong class="${isWeak ? "text-weak" : ""}">${accuracy}%</strong></div>
            <div class="topic-progress-track"><div class="topic-progress-fill ${isWeak ? "fill-weak" : ""}" style="width:${accuracy}%"></div></div>
          </div>
          <div class="topic-card-footer">
            <span class="topic-question-count">${answeredInTopic}/${totalQuestions} câu</span>
            ${totalQuestions > 0 ? `
              <button class="practice-button" type="button" data-practice="${record.id}">
                Luyện ngay <i class="fa-solid fa-arrow-right" aria-hidden="true"></i>
              </button>
            ` : `
              <button class="practice-button" type="button" disabled style="opacity: 0.65; cursor: not-allowed; background: #94a3b8;" title="Chủ đề đang được cập nhật câu hỏi">
                Đang cập nhật
              </button>
            `}
          </div>`;
    return article;
  }

  let initialRenderDone = false;
  function renderTopics() {
    const query = document
      .getElementById("topicSearch")
      .value.trim()
      .toLocaleLowerCase("vi");

    if (activeTab === "notebook") {
      renderNotebookTab(query);
      return;
    }

    if (!initialRenderDone && !query && activeCategory === "all" && activeExam === "all" && activeSort === "default" && topicSections.children.length > 0) {
      initialRenderDone = true;
      document.getElementById("emptyState").classList.remove("visible");
      return;
    }
    initialRenderDone = true;

    topicSections.replaceChildren();

    let visibleCount = 0;

    grammarGroups.forEach((group) => {
      if (activeCategory !== "all" && activeCategory !== group.id) return;
      let records = allTopicRecords().filter(
        (record) => record.group.id === group.id,
      );
      records = records.filter((record) => {
        const matchesSearch =
          !query ||
          record.title.toLocaleLowerCase("vi").includes(query) ||
          group.title.toLocaleLowerCase("vi").includes(query);
        const matchesExam =
          activeExam === "all" || record.exam.includes(activeExam);
        const matchesTab =
          activeTab === "learning" || savedTopics.has(record.id);
        return matchesSearch && matchesExam && matchesTab;
      });
      if (activeSort === "weak") {
        records.sort(
          (a, b) =>
            (topicStats[b.id]?.wrong || 0) - (topicStats[a.id]?.wrong || 0),
        );
      }
      if (!records.length) return;
      visibleCount += records.length;

      const section = document.createElement("section");
      section.className = "topic-section";
      section.dataset.group = group.id;
      const heading = document.createElement("div");
      heading.className = "topic-section-heading";
      heading.innerHTML = `<div><h2>${group.title}</h2><p>${group.description}</p></div><span class="topic-section-count">${records.length} chủ đề</span>`;
      const grid = document.createElement("div");
      grid.className = "topic-grid";
      records.forEach((record) => grid.appendChild(makeTopicCard(record)));

      if (activeTab === "learning" && !query && activeExam !== "VSTEP") {
        grid.appendChild(makeReviewCard(group));
        grid.appendChild(makeMiniTestCard(group));
      }
      section.append(heading, grid);
      topicSections.appendChild(section);
    });

    document
      .getElementById("emptyState")
      .classList.toggle("visible", visibleCount === 0);
    topicSections.setAttribute(
      "aria-labelledby",
      activeTab === "learning" ? "learningTab" : "notebookTab",
    );
    if (window.lucide) {
      lucide.createIcons();
    }
  }

  function renderNotebookTab(query) {
    topicSections.replaceChildren();
    document.getElementById("emptyState").classList.remove("visible");
    topicSections.setAttribute("aria-labelledby", "notebookTab");

    const allRecords = allQuestionRecords();
    let bookmarkedQuestions = allRecords.filter((rec) => savedQuestions.has(rec.id));
    if (query) {
      bookmarkedQuestions = bookmarkedQuestions.filter((rec) =>
        rec.title.toLocaleLowerCase("vi").includes(query) ||
        rec.question.toLocaleLowerCase("vi").includes(query) ||
        rec.group.title.toLocaleLowerCase("vi").includes(query)
      );
    }

    const container = document.createElement("div");
    container.className = "grammar-notebook-container";

    // Section 1: Câu hỏi đã đánh dấu
    const qSection = document.createElement("div");
    qSection.className = "notebook-section";

    const qHeader = document.createElement("div");
    qHeader.className = "notebook-section-header";
    qHeader.innerHTML = `
      <div class="notebook-section-title">
        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#ef4444" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-tag text-red-500"><path d="M12.586 2.586A2 2 0 0 0 11.172 2H4a2 2 0 0 0-2 2v7.172a2 2 0 0 0 .586 1.414l8.704 8.704a2.426 2.426 0 0 0 3.42 0l6.58-6.58a2.426 2.426 0 0 0 0-3.42z"/><circle cx="7.5" cy="7.5" r=".5" fill="currentColor"/></svg>
        <span>Câu hỏi đã đánh dấu</span>
      </div>
      <span class="notebook-section-count">${bookmarkedQuestions.length} câu</span>
    `;
    qSection.appendChild(qHeader);

    if (bookmarkedQuestions.length > 0) {
      const qGrid = document.createElement("div");
      qGrid.className = "notebook-questions-grid";

      bookmarkedQuestions.forEach((rec) => {
        const card = document.createElement("div");
        card.className = "notebook-question-card";
        const groupTitleUpper = rec.group.title.toUpperCase();
        const questionNumber = `Câu ${rec.index + 1}`;

        card.innerHTML = `
          <div class="notebook-card-header">
            <div class="notebook-card-badges">
              <span class="notebook-badge-topic">${escapeHtml(groupTitleUpper)}</span>
              <span class="notebook-badge-num">${escapeHtml(questionNumber)}</span>
            </div>
            <button type="button" class="notebook-card-delete" data-remove-question="${rec.id}" title="Xóa khỏi câu hỏi đã đánh dấu" aria-label="Xóa khỏi câu hỏi đã đánh dấu">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-trash-2"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/><line x1="10" x2="10" y1="11" y2="17"/><line x1="14" x2="14" y1="11" y2="17"/></svg>
            </button>
          </div>
          <div class="notebook-card-body">
            <p class="notebook-card-question">${escapeHtml(rec.question)}</p>
          </div>
          <div class="notebook-card-footer">
            <button type="button" class="notebook-card-retry" data-retry-topic="${rec.id}">
              Luyện lại chủ đề này <span class="arrow">&rarr;</span>
            </button>
          </div>
        `;

        card.querySelector("[data-remove-question]").addEventListener("click", (e) => {
          e.preventDefault();
          e.stopPropagation();
          const targetId = e.currentTarget.dataset.removeQuestion || rec.id;
          savedQuestions.delete(targetId);
          grammarApi(grammarApiUrls.setBookmark, {
            questionId: numericId(targetId),
            saved: false,
          }).catch(showSyncError);
          updateSummary();
          card.remove();
          const remainingCards = qGrid.querySelectorAll(".notebook-question-card");
          const countElem = qSection.querySelector(".notebook-section-count");
          if (countElem) {
            countElem.textContent = `${remainingCards.length} câu`;
          }
          if (remainingCards.length === 0) {
            const currentQuery = document
              .getElementById("topicSearch")
              .value.trim()
              .toLocaleLowerCase("vi");
            renderNotebookTab(currentQuery);
          }
        });

        card.querySelector("[data-retry-topic]").addEventListener("click", (e) => {
          const topicRecord = allTopicRecords().find((item) => item.id === rec.topicId);
          openPractice(topicRecord ? topicRecord.questions : [rec], e.currentTarget);
        });

        qGrid.appendChild(card);
      });

      qSection.appendChild(qGrid);
    } else {
      const emptyCard = document.createElement("div");
      emptyCard.className = "notebook-empty-subcard";
      emptyCard.textContent = "Chưa có câu hỏi nào được đánh dấu. Bạn có thể nhấn biểu tượng 'Đánh dấu' khi luyện tập để lưu câu hỏi vào đây.";
      qSection.appendChild(emptyCard);
    }

    container.appendChild(qSection);

    // Section 2: Sổ tay Ngữ pháp Cá nhân
    const grammarSection = document.createElement("div");
    grammarSection.className = "notebook-section";

    let filteredTheories = savedTheories;
    if (query) {
      filteredTheories = filteredTheories.filter((t) =>
        t.topic.toLocaleLowerCase("vi").includes(query) ||
        t.content.toLocaleLowerCase("vi").includes(query) ||
        (t.subContent && t.subContent.toLocaleLowerCase("vi").includes(query))
      );
    }

    const grammarHeader = document.createElement("div");
    grammarHeader.className = "notebook-section-header";
    grammarHeader.innerHTML = `
      <div class="notebook-section-title">
        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#7c3aed" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-book-text text-purple-600"><path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20"/><path d="M8 7h6"/><path d="M8 11h8"/></svg>
        <span>Sổ tay Ngữ pháp Cá nhân</span>
      </div>
      <span class="notebook-section-badge-pill">Đã lưu ${filteredTheories.length} cấu trúc</span>
    `;
    grammarSection.appendChild(grammarHeader);

    if (filteredTheories.length > 0) {
      const gGrid = document.createElement("div");
      gGrid.className = "notebook-theories-grid";

      filteredTheories.forEach((theoryItem) => {
        const card = document.createElement("div");
        card.className = "notebook-theory-card";
        const topicUpper = (theoryItem.topic || "NGỮ PHÁP").toUpperCase();
        const typeBadge = theoryItem.typeLabel || (theoryItem.type === "formula" ? "Công thức" : "Ví dụ");

        card.innerHTML = `
          <div class="notebook-card-header">
            <div class="notebook-card-badges">
              <span class="notebook-badge-topic">${escapeHtml(topicUpper)}</span>
              <span class="notebook-badge-type">${escapeHtml(typeBadge)}</span>
            </div>
            <button type="button" class="notebook-card-delete" data-remove-theory="${theoryItem.id}" title="Xóa khỏi sổ tay cá nhân" aria-label="Xóa khỏi sổ tay cá nhân">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-trash-2"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/><line x1="10" x2="10" y1="11" y2="17"/><line x1="14" x2="14" y1="11" y2="17"/></svg>
            </button>
          </div>
          <div class="notebook-card-body">
            <div class="notebook-theory-content-box">
              <code>${escapeHtml(theoryItem.content)}</code>
              ${theoryItem.subContent ? `<p class="notebook-theory-sub">${escapeHtml(theoryItem.subContent)}</p>` : ""}
            </div>
          </div>
        `;

        card.querySelector("[data-remove-theory]").addEventListener("click", (e) => {
          e.preventDefault();
          e.stopPropagation();
          const targetId = e.currentTarget.dataset.removeTheory || theoryItem.id;
          const idx = savedTheories.findIndex((t) => t.id === targetId);
          if (idx !== -1) {
            const [removedNote] = savedTheories.splice(idx, 1);
            removeNoteOnServer(removedNote);
            updateSummary();
            card.remove();
            const remaining = gGrid.querySelectorAll(".notebook-theory-card");
            const countElem = grammarSection.querySelector(".notebook-section-badge-pill");
            if (countElem) {
              countElem.textContent = `Đã lưu ${remaining.length} cấu trúc`;
            }
            if (remaining.length === 0) {
              const currentQuery = document
                .getElementById("topicSearch")
                .value.trim()
                .toLocaleLowerCase("vi");
              renderNotebookTab(currentQuery);
            }
          }
        });

        gGrid.appendChild(card);
      });

      grammarSection.appendChild(gGrid);
    } else {
      const grammarEmptyBox = document.createElement("div");
      grammarEmptyBox.className = "notebook-grammar-empty-box";
      grammarEmptyBox.innerHTML = `
        <div class="notebook-grammar-empty-icon">
          <svg xmlns="http://www.w3.org/2000/svg" width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-bookmark"><path d="m19 21-7-4-7 4V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v16z"/></svg>
        </div>
        <p class="notebook-grammar-empty-title">Chưa có công thức hoặc ví dụ nào được lưu.</p>
        <p class="notebook-grammar-empty-desc">Nhấp vào biểu tượng bookmark bên cạnh công thức/câu ví dụ mẫu trong các bài học ngữ pháp để lưu vào đây.</p>
      `;
      grammarSection.appendChild(grammarEmptyBox);
    }

    container.appendChild(grammarSection);
    topicSections.appendChild(container);
  }

  function makeReviewCard(group) {
    const card = document.createElement("article");
    card.className = "topic-utility-card topic-card-review";
    card.innerHTML = `
          <div class="utility-content">
            <div class="utility-heading">
              <span class="utility-icon" aria-hidden="true"><i class="fa-solid fa-shuffle"></i></span>
              <h3 class="utility-title">Ôn tập ngẫu nhiên</h3>
            </div>
            <p class="utility-description">Luyện câu hỏi ngẫu nhiên từ các chủ đề trong <strong>${group.title}</strong>.</p>
            <div class="utility-footer">
              <div class="choice-pills" data-size-group="review" role="group" aria-label="Số câu ôn tập">
                ${[20, 30, 50].map((size) => `<button type="button" data-size="${size}" aria-pressed="${selectedTestSize === size}">${selectedTestSize === size ? '<i class="fa-solid fa-check me-1" aria-hidden="true"></i>' : ""}${size} câu</button>`).join("")}
              </div>
              <button class="practice-button" type="button" data-start-group="${group.id}" data-mode="review">Bắt đầu ôn tập <i class="fa-solid fa-arrow-right ms-1"></i></button>
            </div>
          </div>
        `;
    return card;
  }

  function makeMiniTestCard(group) {
    const card = document.createElement("article");
    card.className = "topic-utility-card test-card topic-card-mini-test";
    card.innerHTML = `
          <div class="utility-content">
            <div class="utility-heading">
              <span class="utility-icon" aria-hidden="true"><i class="fa-regular fa-clipboard"></i></span>
              <h3 class="utility-title">Mini Test</h3>
              <div class="utility-actions">
                <button class="topic-bookmark" type="button" data-start-group="${group.id}" data-mode="test" aria-label="Làm lại Mini Test" title="Làm lại Mini Test">
                  <i class="fa-solid fa-rotate-right"></i>
                </button>
                <span class="topic-exam-badge">TOEIC</span>
              </div>
            </div>
            <p class="utility-description">Bài kiểm tra các chủ đề trong <strong>${group.title}</strong>, đếm ngược thời gian làm cho từng câu.</p>
            <div class="utility-footer">
              <div class="choice-pills">
                <button type="button" aria-pressed="true"><i class="fa-regular fa-clock me-1"></i>1p</button>
                <button type="button" aria-pressed="false"><i class="fa-regular fa-clock me-1"></i>30s</button>
              </div>
              <button class="practice-button minitest-btn" type="button" data-start-group="${group.id}" data-mode="test">Làm tiếp <i class="fa-solid fa-arrow-right ms-1"></i></button>
            </div>
          </div>`;
    return card;
  }

  function renderCategoryFilters() {
    if (categoryFilters && categoryFilters.querySelectorAll(".category-filter[data-category]:not([data-category='all'])").length > 0) {
      return;
    }
    grammarGroups.forEach((group) => {
      const button = document.createElement("button");
      button.className = "category-filter filter-option";
      button.type = "button";
      button.dataset.category = group.id;
      button.setAttribute("aria-pressed", "false");
      button.textContent = group.title;
      categoryFilters.appendChild(button);
    });
  }

  function openPractice(records, trigger, limit = records.length) {
    if (!records.length) return;
    stopMiniTestTimer();
    modalTrigger = trigger;
    sessionQuestions = [...records]
      .sort(() => Math.random() - 0.5)
      .slice(0, limit);
    sessionAnswers = [];
    questionIndex = 0;
    sessionCorrect = 0;
    sessionAttempted = 0;
    practiceComplete = false;
    explanationVisible = false;
    questionMapFilter = "all";
    isMiniTest = trigger.dataset.mode === "test";
    practicePage.classList.toggle("is-mini-test", isMiniTest);
    practicePage.classList.toggle("is-regular-practice", !isMiniTest);
    document.getElementById("miniTestStatus").hidden = true;
    document.getElementById("miniTestTimerWrap").hidden = !isMiniTest;
    closePracticeQuestionMap(false);
    document
      .getElementById("practiceTheoryToggle")
      .setAttribute("aria-pressed", "false");
    catalogWindowScrollY = window.scrollY;
    grammarCatalog.hidden = true;
    practicePage.hidden = false;
    dashboardLayout.classList.add("practice-active");
    window.scrollTo(
      0,
      window.scrollY + grammarPage.getBoundingClientRect().top,
    );
    const group = grammarGroups.find((item) => item.id === trigger.dataset?.startGroup) || sessionQuestions[0]?.group;
    const groupTitle = group ? group.title : (sessionQuestions[0]?.group?.title || "");
    const practiceTitle = isMiniTest
      ? (groupTitle ? `Mini test: ${groupTitle} (TOEIC Part 5)` : "Mini test: Thì thời gian (TOEIC Part 5)")
      : new Set(sessionQuestions.map((item) => item.topicId)).size === 1
        ? sessionQuestions[0].title
        : `Ôn tập ngẫu nhiên · ${sessionQuestions[0].group.title}`;
    document.getElementById("practiceTitle").textContent = practiceTitle;
    const topicCrumb = document.getElementById("practiceTopicCrumb");
    const topicCrumbWrap = document.getElementById("practiceTopicCrumbWrap");
    const topicChevron = document.getElementById("practiceTopicCrumbChevron");
    if (topicCrumbWrap) {
      topicCrumbWrap.hidden = isMiniTest;
    }
    if (topicCrumb) {
      topicCrumb.hidden = isMiniTest;
      topicCrumb.textContent = sessionQuestions[0].title;
    }
    if (topicChevron) {
      topicChevron.hidden = isMiniTest;
    }
    document.getElementById("practiceBreadcrumbTitle").textContent = "Luyện";
    renderQuestion();
    document.getElementById("practiceClose").focus({ preventScroll: true });
  }

  function stopMiniTestTimer() {
    if (miniTestTimerId !== null) {
      window.clearInterval(miniTestTimerId);
      miniTestTimerId = null;
    }
  }

  function updateMiniTestTimer() {
    const minutes = Math.floor(miniTestTimeRemaining / 60);
    const seconds = miniTestTimeRemaining % 60;
    document.getElementById("miniTestTimer").textContent =
      `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
    document
      .getElementById("miniTestTimerWrap")
      .classList.toggle("is-urgent", miniTestTimeRemaining <= 10);
  }

  function startMiniTestTimer() {
    stopMiniTestTimer();
    miniTestTimeRemaining = 60;
    updateMiniTestTimer();
    miniTestTimerId = window.setInterval(() => {
      miniTestTimeRemaining -= 1;
      updateMiniTestTimer();
      if (miniTestTimeRemaining <= 0) {
        stopMiniTestTimer();
        sessionAnswers[questionIndex] = null;
        questionAnswered = true;
        sessionAttempted += 1;
        advancePractice();
      }
    }, 1000);
  }

  function renderQuestion() {
    const question = sessionQuestions[questionIndex];
    questionAnswered =
      !isMiniTest && sessionAnswers[questionIndex] !== undefined;
    translationVisible = false;
    if (isMiniTest) {
      document.getElementById("miniTestQuestionNumber").textContent =
        questionIndex + 1;
      document.getElementById("practiceProgress").textContent =
        `Câu ${questionIndex + 1}/${sessionQuestions.length}`;
    } else {
      document.getElementById("practiceProgress").innerHTML =
        `Câu <strong class="progress-current">${questionIndex + 1}</strong>/${sessionQuestions.length} <span class="progress-sep">·</span> Đúng <strong class="progress-correct">${sessionCorrect}</strong>`;
    }
    const progress = Math.round(
      ((questionIndex + 1) / sessionQuestions.length) * 100,
    );
    const progressTrack = document.querySelector(".practice-progress-track");
    progressTrack.setAttribute("aria-valuenow", progress);
    document.getElementById("practiceProgressFill").style.width =
      `${progress}%`;
    if (isMiniTest) {
      const qEl = document.getElementById("practiceQuestion");
      qEl.replaceChildren();
      const numBadge = document.createElement("span");
      numBadge.className = "mini-test-q-badge";
      numBadge.textContent = questionIndex + 1;
      qEl.appendChild(numBadge);
      qEl.appendChild(document.createTextNode(" " + question.question));
    } else {
      document.getElementById("practiceQuestion").textContent = question.question;
    }
    document.getElementById("practicePromptBadge").textContent = isMiniTest
      ? "CHỌN MỘT ĐÁP ÁN"
      : "CHỌN ĐÁP ÁN ĐÚNG ĐỂ HOÀN THÀNH CÂU";
    const translation = question.translation;
    const questionTranslation = document.getElementById(
      "practiceQuestionTranslation",
    );
    const questionTranslationText = document.getElementById(
      "practiceQuestionTranslationText",
    );
    const translationContent = translation
      ? translation.question
      : "Chưa có bản dịch cho câu hỏi này.";
    if (questionTranslationText) {
      questionTranslationText.textContent = translationContent;
    } else {
      questionTranslation.textContent = translationContent;
    }
    questionTranslation.hidden = !translationVisible;
    document.getElementById("practiceFeedback").textContent = "";
    document.getElementById("practiceFeedback").className = "";
    document.getElementById("practiceResultBanner").hidden = true;
    document
      .getElementById("practiceResultBanner")
      .classList.remove("is-correct");
    document.getElementById("practiceAnswerSummary").hidden = true;
    document.getElementById("practiceGrammarReminder").hidden = true;
    document.getElementById("practiceExplanation").replaceChildren();
    document
      .getElementById("practiceExplanationPanel")
      .classList.toggle("is-awaiting-answer", !isMiniTest && !questionAnswered);
    document.getElementById("practiceNextLabel").textContent = isMiniTest
      ? questionIndex === sessionQuestions.length - 1
        ? "Nộp bài"
        : "Câu tiếp theo"
      : "Câu tiếp theo";
    practiceNext.disabled = !questionAnswered;
    document.getElementById("practicePrevious").disabled = questionIndex === 0;
    const nextSvg = practiceNext.querySelector("svg");
    if (nextSvg) {
      nextSvg.innerHTML = '<path d="m9 18 6-6-6-6"/>';
    }
    practiceOptions.replaceChildren();
    question.options.forEach((option, index) => {
      const button = document.createElement("button");
      button.type = "button";
      button.className = "answer-option";
      const marker = document.createElement("span");
      marker.className = "answer-option-marker";
      marker.setAttribute("aria-hidden", "true");
      marker.textContent = String.fromCharCode(65 + index);
      const optionContent = document.createElement("span");
      optionContent.className = "answer-option-content";
      const optionLabel = document.createElement("span");
      optionLabel.className = "answer-option-label";
      optionLabel.textContent = option;
      optionContent.appendChild(optionLabel);
      button.append(marker, optionContent);
      if (translation?.options[index]) {
        const optionTranslation = document.createElement("span");
        optionTranslation.className = "practice-option-translation";
        optionTranslation.textContent = translation.options[index];
        optionTranslation.hidden = true;
        optionContent.appendChild(optionTranslation);
      }
      button.addEventListener("click", () => answerQuestion(index, question));
      const item = document.createElement("div");
      item.className = "practice-option-item";
      const note = document.createElement("p");
      note.className = "practice-option-explanation";
      note.id = `practiceOptionExplanation${index}`;
      note.hidden = true;
      item.append(button, note);
      practiceOptions.appendChild(item);
    });
    if (questionAnswered) {
      renderPracticeAnswer(question, sessionAnswers[questionIndex]);
    }
    renderPracticeQuestionMap();
    document.querySelector(".practice-actions").hidden = false;
    if (!isMiniTest) updatePracticeActions(question);
    else startMiniTestTimer();
  }

  function renderPracticeAnswer(question, selectedIndex) {
    const isCorrect = selectedIndex === question.answer;
    const answerLetter = String.fromCharCode(65 + question.answer);
    const reasoning = question.reasoning;
    const details =
      reasoning &&
      (reasoning.context ||
        reasoning.rule ||
        (Array.isArray(reasoning.steps) && reasoning.steps.length > 0) ||
        (Array.isArray(reasoning.distractors) && reasoning.distractors.some(Boolean)))
        ? reasoning
        : null;
    practiceOptions
      .querySelectorAll(".answer-option")
      .forEach((button, index) => {
        const correct = index === question.answer;
        const incorrect = index === selectedIndex && !isCorrect;
        button.disabled = true;
        button.classList.toggle("correct", correct);
        button.classList.toggle("incorrect", incorrect);
        button.classList.toggle("eliminated", !correct && !incorrect);
        const letter = String.fromCharCode(65 + index);
        const status = correct
          ? "Đáp án đúng"
          : incorrect
            ? "Bạn đã chọn, chưa đúng"
            : "Đáp án bị loại";
        button.setAttribute(
          "aria-label",
          `${letter}. ${question.options[index]}. ${status}`,
        );
        const note = document.getElementById(
          `practiceOptionExplanation${index}`,
        );
        note.textContent = correct
          ? `Chính xác. ${question.explanation}`
          : `Sai. ${details?.distractors[index] || "Lựa chọn này không phù hợp với quy tắc và ngữ cảnh của câu."}`;
        note.classList.toggle("is-correct", correct);
        note.hidden = !explanationVisible;
        if (!note.hidden) button.setAttribute("aria-describedby", note.id);
        const marker = button.querySelector(".answer-option-marker");
        marker.replaceChildren();
        if (correct || incorrect) {
          const icon = document.createElement("i");
          icon.className = correct ? "fa-solid fa-check" : "fa-solid fa-xmark";
          marker.appendChild(icon);
        } else {
          marker.textContent = letter;
        }
      });

    const feedback = document.getElementById("practiceFeedback");
    feedback.textContent = isCorrect
      ? "Chính xác! Đáp án bạn chọn là đáp án đúng."
      : `Chưa đúng. Đáp án đúng là ${answerLetter}: "${question.options[question.answer]}".`;
    feedback.classList.toggle("is-correct", isCorrect);
    feedback.classList.toggle("is-incorrect", !isCorrect);
    document.getElementById("practiceResultBanner").hidden = false;
    document
      .getElementById("practiceResultBanner")
      .classList.toggle("is-correct", isCorrect);
    document.getElementById("practiceResultIcon").className = isCorrect
      ? "fa-regular fa-circle-check"
      : "fa-regular fa-circle-xmark";
    document.getElementById("practiceResultText").textContent = isCorrect
      ? "Chính xác"
      : "Chưa đúng";
    document.getElementById("practiceCorrectLetter").textContent =
      `Đáp án: ${answerLetter}`;

    const explanation = document.getElementById("practiceExplanation");
    explanation.replaceChildren();
    const steps = document.createElement("ol");
    steps.className = "practice-reasoning-steps";
    function addStep(title, text, eliminatedList) {
      const step = document.createElement("li");
      step.className = "practice-reasoning-step";
      const heading = document.createElement("h4");
      heading.textContent = title;
      const description = document.createElement("p");
      description.textContent = text;
      step.append(heading, description);

      if (eliminatedList) {
        const list = Array.isArray(eliminatedList) ? eliminatedList : [eliminatedList];
        if (list.length > 0) {
          const group = document.createElement("div");
          group.className = "practice-elimination-group";
          list.forEach((item) => {
            if (item === undefined || item === null || item === "") return;
            const tag = document.createElement("span");
            tag.className = "practice-elimination";
            const label = typeof item === "number" ? String.fromCharCode(65 + item) : String(item);
            tag.textContent = label.startsWith("Loại") ? label : `Loại ${label}`;
            group.appendChild(tag);
          });
          if (group.children.length > 0) {
            step.appendChild(group);
          }
        }
      }
      steps.appendChild(step);
    }

    if (details && Array.isArray(details.steps) && details.steps.length > 0) {
      details.steps.forEach((s) => {
        if (s && (s.text || s.title)) {
          addStep(s.title || "Phân tích", s.text || "", s.eliminated);
        }
      });
    } else if (details) {
      if (details.context) addStep("Vị trí chỗ trống", details.context);
      if (Array.isArray(details.distractors)) {
        details.distractors.forEach((reason, index) => {
          if (index !== question.answer && reason) {
            addStep(`Xét "${question.options[index]}"`, reason, [index]);
          }
        });
      }
    } else {
      addStep("Áp dụng quy tắc", question.explanation);
    }
    explanation.appendChild(steps);
    document.getElementById("practiceAnswerText").textContent =
      `Chọn ${answerLetter} — "${question.options[question.answer]}".`;
    document.getElementById("practiceAnswerSummary").hidden = false;
    document.getElementById("practiceGrammarRule").textContent =
      details?.rule || question.explanation;
    document.getElementById("practiceGrammarReminder").hidden = false;
    document
      .getElementById("practiceExplanationPanel")
      .classList.remove("is-awaiting-answer");
  }

  function answerQuestion(selectedIndex, question) {
    if (questionAnswered) return;
    questionAnswered = true;
    sessionAnswers[questionIndex] = selectedIndex;
    if (isMiniTest) {
      sessionAttempted += 1;
      stopMiniTestTimer();
      practiceOptions
        .querySelectorAll(".answer-option")
        .forEach((button, index) => {
          button.disabled = true;
          if (index === selectedIndex) button.classList.add("selected");
        });
      document.getElementById("practiceProgress").textContent =
        `Câu ${questionIndex + 1}/${sessionQuestions.length}`;
      practiceNext.disabled = false;
      return;
    }
    sessionAttempted += 1;
    answeredTotal += 1;
    const isCorrect = selectedIndex === question.answer;
    const stat = topicStats[question.topicId] || { done: 0, wrong: 0, correct: 0 };
    stat.done += 1;
    if (isCorrect) {
      correctTotal += 1;
      sessionCorrect += 1;
      stat.correct += 1;
    } else {
      stat.wrong += 1;
    }
    topicStats[question.topicId] = stat;
    answeredQuestions.add(question.id);
    grammarApi(grammarApiUrls.submitAnswer, {
      questionId: question.dbId,
      selectedIndex,
    }).catch(showSyncError);

    renderPracticeAnswer(question, selectedIndex);
    updatePracticeActions(question);
    practiceNext.disabled = false;
    document.getElementById("practiceProgress").innerHTML =
      `Câu <strong class="progress-current">${questionIndex + 1}</strong>/${sessionQuestions.length} <span class="progress-sep">·</span> Đúng <strong class="progress-correct">${sessionCorrect}</strong>`;
    updateSummary();
    renderTopics();
    renderPracticeQuestionMap();
  }

  function renderPracticeQuestionMap() {
    const content = document.getElementById("practiceQuestionMapContent");
    const answered = sessionQuestions.filter(
      (_, index) => sessionAnswers[index] !== undefined,
    ).length;
    const percent = sessionQuestions.length
      ? Math.round((answered / sessionQuestions.length) * 100)
      : 0;
    document.getElementById("practiceQuestionMapProgress").textContent =
      `Câu ${questionIndex + 1}/${sessionQuestions.length} · ${percent}% hoàn thành`;
    document.querySelectorAll("[data-map-filter]").forEach((button) => {
      button.setAttribute(
        "aria-pressed",
        String(button.dataset.mapFilter === questionMapFilter),
      );
    });
    content.replaceChildren();
    const groups = new Map();
    sessionQuestions.forEach((question, index) => {
      if (!groups.has(question.title)) groups.set(question.title, []);
      groups.get(question.title).push({ question, index });
    });
    groups.forEach((entries, title) => {
      const visible = entries.filter(({ question, index }) => {
        const selected = sessionAnswers[index];
        if (questionMapFilter === "unanswered") return selected === undefined;
        if (questionMapFilter === "incorrect")
          return selected !== undefined && selected !== question.answer;
        return true;
      });
      if (!visible.length) return;
      const section = document.createElement("section");
      section.className = "practice-map-group";
      const heading = document.createElement("div");
      heading.className = "practice-map-group-heading";
      const name = document.createElement("h3");
      name.textContent = title;
      const count = document.createElement("span");
      count.className = "practice-map-group-count";
      count.textContent = `${entries.filter(({ index }) => sessionAnswers[index] !== undefined).length}/${entries.length}`;
      count.setAttribute("aria-label", `${count.textContent} câu đã làm`);
      heading.append(name, count);
      const grid = document.createElement("div");
      grid.className = "practice-map-grid";
      visible.forEach(({ question, index }) => {
        const selected = sessionAnswers[index];
        const state =
          selected === undefined
            ? "unanswered"
            : selected === question.answer
              ? "correct"
              : "incorrect";
        const current = index === questionIndex;
        const label = {
          unanswered: "Chưa làm",
          correct: "Đúng",
          incorrect: "Làm sai",
        }[state];
        const button = document.createElement("button");
        button.type = "button";
        button.className = `practice-map-question is-${state}`;
        button.dataset.questionIndex = index;
        button.textContent = index + 1;
        button.setAttribute(
          "aria-label",
          `Câu ${index + 1}: ${current ? "Đang làm, " : ""}${label.toLowerCase()}`,
        );
        button.title = `Câu ${index + 1}: ${current ? "Đang làm" : label}`;
        if (current) button.setAttribute("aria-current", "step");
        else {
          const icon = document.createElement("i");
          icon.className = `practice-map-status-icon ${state === "correct" ? "fa-regular fa-circle-check" : state === "incorrect" ? "fa-solid fa-triangle-exclamation" : "fa-regular fa-circle"}`;
          icon.setAttribute("aria-hidden", "true");
          button.appendChild(icon);
        }
        button.addEventListener("click", () => {
          closePracticeQuestionMap(false);
          questionIndex = index;
          renderQuestion();
          const target =
            practiceOptions.querySelector("button:not(:disabled)") ||
            practiceNext;
          target.focus({ preventScroll: true });
        });
        grid.appendChild(button);
      });
      section.append(heading, grid);
      content.appendChild(section);
    });
    if (!content.children.length) {
      const empty = document.createElement("p");
      empty.className = "practice-map-empty";
      empty.setAttribute("role", "status");
      empty.textContent =
        questionMapFilter === "incorrect"
          ? "Chưa có câu trả lời sai."
          : "Bạn đã làm tất cả câu hỏi.";
      content.appendChild(empty);
    }
  }

  function openPracticeQuestionMap() {
    renderPracticeQuestionMap();
    document.getElementById("practiceQuestionMap").hidden = false;
    document
      .getElementById("practiceQuestionMapToggle")
      .setAttribute("aria-expanded", "true");
    document.body.classList.add("question-map-open");
    dashboardLayout.inert = true;
    document
      .getElementById("practiceQuestionMapClose")
      .focus({ preventScroll: true });
    document.getElementById("practiceQuestionMapContent").scrollTop = 0;
    document
      .querySelector('.practice-map-question[aria-current="step"]')
      ?.scrollIntoView({ block: "nearest" });
  }

  function closePracticeQuestionMap(restoreFocus = true) {
    const map = document.getElementById("practiceQuestionMap");
    const wasOpen = !map.hidden;
    map.hidden = true;
    document
      .getElementById("practiceQuestionMapToggle")
      .setAttribute("aria-expanded", "false");
    document.body.classList.remove("question-map-open");
    dashboardLayout.inert = false;
    if (wasOpen && restoreFocus) {
      document
        .getElementById("practiceQuestionMapToggle")
        .focus({ preventScroll: true });
    }
  }

  const grammarTheoryContent = Object.fromEntries(grammarGroups.filter((group) => group.theory).map((group) => [group.id, group.theory]));
  const grammarTopicTheories = {};
  grammarGroups.forEach((g) => {
    (g.topics || []).forEach((t) => {
      if (t.theory) {
        grammarTopicTheories[t.id] = t.theory;
        if (t.dbId) grammarTopicTheories[`topic-${t.dbId}`] = t.theory;
      }
    });
  });

  function fillTheoryMistakes(containerId, items) {
    const list = document.getElementById(containerId);
    if (!list) return;
    list.replaceChildren();
    items.forEach((text, index) => {
      const card = document.createElement("div");
      card.className = "mistake-item";
      card.innerHTML = `
        <div class="mistake-item-header">
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-circle-x"><circle cx="12" cy="12" r="10"></circle><path d="m15 9-6 6"></path><path d="m9 9 6 6"></path></svg>
          <span>Bẫy ${index + 1}: ${escapeHtml(text.split(":")[0] || "Lưu ý")}</span>
        </div>
        <p class="mistake-item-body">${escapeHtml(text.includes(":") ? text.substring(text.indexOf(":") + 1).trim() : text)}</p>
      `;
      list.appendChild(card);
    });
  }

  function showTheoryToast(message = "Đã lưu vào sổ tay cá nhân", isRemoved = false) {
    const toast = document.getElementById("theoryToast");
    if (!toast) return;
    toast.querySelector("span").textContent = message;
    toast.classList.toggle("is-removed", isRemoved);
    const icon = toast.querySelector("svg");
    if (icon) {
      if (isRemoved) {
        icon.innerHTML = '<circle cx="12" cy="12" r="10"></circle><path d="m15 9-6 6"></path><path d="m9 9 6 6"></path>';
      } else {
        icon.innerHTML = '<circle cx="12" cy="12" r="10"></circle><path d="m9 12 2 2 4-4"></path>';
      }
    }
    toast.hidden = false;
    clearTimeout(toast._timer);
    toast._timer = setTimeout(() => {
      toast.hidden = true;
    }, 2500);
  }

  function fillTheoryExamples(containerId, items, topicTitle) {
    const list = document.getElementById(containerId);
    if (!list) return;
    list.replaceChildren();
    items.forEach((text) => {
      const card = document.createElement("div");
      card.className = "example-item";
      const parts = text.split("—");
      const en = parts[0]?.trim() || text;
      const vi = parts[1]?.trim() || "";
      const isSaved = savedTheories.some((t) => t.type === "example" && t.content === en);

      card.innerHTML = `
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-quote quote-icon"><path d="M16 3a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2 1 1 0 0 1 1 1v1a2 2 0 0 1-2 2 1 1 0 0 0-1 1v2a1 1 0 0 0 1 1 6 6 0 0 0 6-6V5a2 2 0 0 0-2-2z"></path><path d="M5 3a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2 1 1 0 0 1 1 1v1a2 2 0 0 1-2 2 1 1 0 0 0-1 1v2a1 1 0 0 0 1 1 6 6 0 0 0 6-6V5a2 2 0 0 0-2-2z"></path></svg>
        <div class="example-copy">
          <p class="example-text">${escapeHtml(en)}</p>
          ${vi ? `<p class="example-subtext">${escapeHtml(vi)}</p>` : ""}
        </div>
        <button type="button" aria-label="Lưu ví dụ" class="${isSaved ? "saved" : ""}" aria-pressed="${isSaved}">
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="${isSaved ? "currentColor" : "none"}" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-bookmark"><path d="m19 21-7-4-7 4V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v16z"></path></svg>
        </button>
      `;

      const saveBtn = card.querySelector("button");
      saveBtn.addEventListener("click", () => {
        const currentlySaved = saveBtn.getAttribute("aria-pressed") === "true";
        if (currentlySaved) {
          const idx = savedTheories.findIndex((t) => t.type === "example" && t.content === en);
          if (idx !== -1) removeNoteOnServer(savedTheories.splice(idx, 1)[0]);
          saveBtn.setAttribute("aria-pressed", "false");
          saveBtn.classList.remove("saved");
          saveBtn.querySelector("svg").setAttribute("fill", "none");
          showTheoryToast("Đã xóa khỏi sổ tay", true);
        } else {
          const exampleNote = {
            id: `tmp-ex-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
            topic: topicTitle || "NGỮ PHÁP",
            type: "example",
            typeLabel: "Ví dụ",
            content: en,
            subContent: vi,
          };
          savedTheories.push(exampleNote);
          addNoteOnServer(exampleNote);
          saveBtn.setAttribute("aria-pressed", "true");
          saveBtn.classList.add("saved");
          saveBtn.querySelector("svg").setAttribute("fill", "currentColor");
          showTheoryToast("Đã lưu vào sổ tay cá nhân");
        }
        updateSummary();
        if (activeTab === "notebook") renderTopics();
      });

      list.appendChild(card);
    });
  }

  function escapeHtml(str) {
    if (!str) return "";
    return str.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
  }

  // Lý thuyết mặc định khi quản trị viên chưa nhập lý thuyết cho nhóm chủ đề.
  function buildFallbackTheory(group, question) {
    const samples = group.topics
      .map((topic) => ({ title: topic.title, item: topic.questions[0] }))
      .filter((sample) => sample.item);
    return {
      goldenRules: [question.title, "Xác định cấu trúc và ngữ cảnh câu"],
      summary: group.description,
      quickIntro: "Ghi nhớ nhanh các điểm trọng tâm của chủ đề:",
      quickItems: samples.slice(0, 2).map((s) => [s.title, s.item.explanation]),
      model: ["Cấu trúc", "ngữ cảnh?"],
      mentalDescription: group.description,
      formulas: samples.slice(0, 4).map((s) => s.item.explanation),
      usage: samples.slice(0, 2).map((s, index) => ({
        title: s.title,
        text: s.item.explanation,
        result: `→ ${s.item.options[s.item.answer]}`,
        green: index === 1,
      })),
      mistakes: [
        "Đọc cả câu để xác định ngữ cảnh trước khi chọn đáp án.",
        "Kiểm tra vai trò ngữ pháp của chỗ trống.",
        "Loại đáp án không phù hợp về cấu trúc.",
        "Để ý các từ khóa chỉ quan hệ hoặc thời gian.",
      ],
      examples: samples
        .slice(0, 4)
        .map(
          (s) =>
            `${s.item.question.replace("___", s.item.options[s.item.answer])} — ${s.item.explanation}`,
        ),
    };
  }

  function renderGrammarTheory(question) {
    const group = question.group;
    const theory = question.theory ||
                   grammarTopicTheories[question.topicId] ||
                   grammarTopicTheories[`topic-${question.topicDbId}`] ||
                   (question.topic && question.topic.theory) ||
                   grammarTheoryContent[group.id] ||
                   buildFallbackTheory(group, question);

    document.getElementById("grammarTheoryDialogTitle").textContent =
      "Lý thuyết";
    document.getElementById("grammarTheoryDialogSubtitle").textContent =
      question.title;
    const goldenRules = document.getElementById("theoryGoldenRules");
    goldenRules.replaceChildren();
    theory.goldenRules.forEach((rule) => {
      const line = document.createElement("span");
      line.textContent = rule;
      goldenRules.appendChild(line);
    });
    document.getElementById("theorySummary").textContent = theory.summary;
    document.getElementById("theoryQuickIntro").textContent = theory.quickIntro;

    const quickList = document.getElementById("theoryQuickList");
    quickList.replaceChildren();
    const iconSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-circle-check"><circle cx="12" cy="12" r="10"></circle><path d="m9 12 2 2 4-4"></path></svg>`;

    (theory.quickItems || []).forEach((entry) => {
      let label = "";
      let result = "";
      if (Array.isArray(entry)) {
        label = entry[0] || "";
        result = entry[1] || "";
      } else if (typeof entry === "string") {
        label = entry;
      }

      const item = document.createElement("li");
      item.className = "grammar-theory-quick-item";

      if (result && result.trim()) {
        // Kiểu 2: Có dòng mũi tên kết quả riêng biệt (He, She, It... \n → V(s/es))
        item.classList.add("quick-item-paired");
        item.innerHTML = `
          ${iconSvg}
          <div class="quick-item-copy">
            <span class="quick-item-label">${escapeHtml(label)}</span>
            <strong class="quick-item-result">${escapeHtml(result)}</strong>
          </div>
        `;
      } else {
        // Kiểu 1: Dạng đoạn văn diễn giải liền mạch (Past Simple: Dùng với yesterday...)
        item.classList.add("quick-item-descriptive");
        item.innerHTML = `
          ${iconSvg}
          <div class="quick-item-copy">
            <span class="quick-item-text">${escapeHtml(label)}</span>
          </div>
        `;
      }
      quickList.appendChild(item);
    });

    document.getElementById("theoryModelLeft").textContent = theory.model[0];
    document.getElementById("theoryModelRight").textContent = theory.model[1];
    document.getElementById("theoryMentalDescription").textContent =
      theory.mentalDescription;
    const formulaList = document.getElementById("theoryFormulaList");
    formulaList.replaceChildren();
    theory.formulas.forEach((formula) => {
      const isSaved = savedTheories.some((t) => t.type === "formula" && t.content === formula);
      const row = document.createElement("div");
      row.className = "grammar-theory-formula";
      row.innerHTML = `
        <code>${escapeHtml(formula)}</code>
        <button type="button" aria-label="Lưu công thức" class="${isSaved ? "saved" : ""}" aria-pressed="${isSaved}">
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="${isSaved ? "currentColor" : "none"}" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-bookmark"><path d="m19 21-7-4-7 4V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v16z"></path></svg>
        </button>
      `;
      const saveButton = row.querySelector("button");
      saveButton.addEventListener("click", () => {
        const currentlySaved = saveButton.getAttribute("aria-pressed") === "true";
        if (currentlySaved) {
          const idx = savedTheories.findIndex((t) => t.type === "formula" && t.content === formula);
          if (idx !== -1) removeNoteOnServer(savedTheories.splice(idx, 1)[0]);
          saveButton.setAttribute("aria-pressed", "false");
          saveButton.classList.remove("saved");
          saveButton.querySelector("svg").setAttribute("fill", "none");
          showTheoryToast("Đã xóa khỏi sổ tay", true);
        } else {
          const formulaNote = {
            id: `tmp-f-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
            topic: question.title || question.group.title || "NGỮ PHÁP",
            type: "formula",
            typeLabel: "Công thức",
            content: formula,
          };
          savedTheories.push(formulaNote);
          addNoteOnServer(formulaNote);
          saveButton.setAttribute("aria-pressed", "true");
          saveButton.classList.add("saved");
          saveButton.querySelector("svg").setAttribute("fill", "currentColor");
          showTheoryToast("Đã lưu vào sổ tay cá nhân");
        }
        updateSummary();
        if (activeTab === "notebook") renderTopics();
      });
      formulaList.appendChild(row);
    });

    const usageList = document.getElementById("theoryUsageList");
    usageList.replaceChildren();

    // Nếu các mục cách dùng không có 'result' (hoặc ở dạng danh sách diễn giải như Past Simple: Dùng với...)
    const isDescriptiveList = Array.isArray(theory.usage) && theory.usage.some(item => !item.result || item.result.trim() === "");

    if (isDescriptiveList) {
      usageList.className = "grammar-theory-usage-list";
      theory.usage.forEach((item) => {
        const row = document.createElement("div");
        row.className = "grammar-theory-usage-item";
        const titleText = item.title ? item.title.trim() : "";
        const bodyText = item.text ? item.text.trim() : "";
        const resultText = item.result ? item.result.trim() : "";

        let contentHtml = "";
        if (titleText && bodyText) {
          contentHtml = `<strong>${escapeHtml(titleText)}:</strong> ${escapeHtml(bodyText)}`;
        } else {
          contentHtml = escapeHtml(titleText || bodyText);
        }

        if (resultText) {
          contentHtml += ` <span class="usage-item-result text-green font-semibold">${escapeHtml(resultText)}</span>`;
        }

        row.innerHTML = `
          <span class="usage-item-icon" aria-hidden="true">
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-target text-green"><circle cx="12" cy="12" r="10"></circle><circle cx="12" cy="12" r="6"></circle><circle cx="12" cy="12" r="2"></circle></svg>
          </span>
          <div class="usage-item-text">${contentHtml}</div>
        `;
        usageList.appendChild(row);
      });
    } else {
      usageList.className = "grammar-theory-usage-columns";
      theory.usage.forEach((item) => {
        const box = document.createElement("div");
        box.className = `grammar-theory-usage-box ${item.green ? "usage-plural" : "usage-singular"}`;
        box.innerHTML = `
          <div class="usage-box-header">
            ${item.green 
              ? '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-users-round"><path d="M18 21a8 8 0 0 0-16 0"></path><circle cx="10" cy="8" r="5"></circle><path d="M22 20c0-3.37-2-6.5-4-8a5 5 0 0 0-.45-8.3"></path></svg>'
              : '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-user-round"><circle cx="12" cy="8" r="5"></circle><path d="M20 21a8 8 0 0 0-16 0"></path></svg>'
            }
            <strong>${escapeHtml(item.title)}</strong>
          </div>
          <p class="usage-box-text">${escapeHtml(item.text)}</p>
          ${item.result ? `<p class="usage-box-result ${item.green ? 'text-green' : 'text-purple'}">${escapeHtml(item.result)}</p>` : ''}
        `;
        usageList.appendChild(box);
      });
    }
    fillTheoryMistakes("theoryMistakes", theory.mistakes);
    fillTheoryExamples("theoryExamples", theory.examples, question.title || question.group.title);
  }

  function openGrammarTheory() {
    const question = sessionQuestions[questionIndex];
    if (!question) return;
    renderGrammarTheory(question);
    document
      .getElementById("practiceTheoryToggle")
      .setAttribute("aria-pressed", "true");
    const dialog = document.getElementById("grammarTheoryDialog");
    document.querySelector(".grammar-theory-scroll").scrollTop = 0;
    dialog.hidden = false;
    document
      .getElementById("grammarTheoryClose")
      .focus({ preventScroll: true });
  }

  function closeGrammarTheory() {
    document.getElementById("grammarTheoryDialog").hidden = true;
    document
      .getElementById("practiceTheoryToggle")
      .setAttribute("aria-pressed", "false");
    document
      .getElementById("practiceTheoryToggle")
      .focus({ preventScroll: true });
  }

  function advancePractice() {
    if (!questionAnswered) return;
    closePracticeQuestionMap(false);
    if (questionIndex < sessionQuestions.length - 1) {
      questionIndex += 1;
      renderQuestion();
      return;
    }
    finishPractice();
  }

  function finishPractice() {
    stopMiniTestTimer();
    if (isMiniTest) {
      sessionCorrect = sessionQuestions.reduce(
        (total, question, index) =>
          total + (sessionAnswers[index] === question.answer ? 1 : 0),
        0,
      );
      sessionAttempted = sessionQuestions.length;
      sessionQuestions.forEach((question, index) => {
        const selected = sessionAnswers[index];
        if (selected !== undefined && selected !== null) {
          const isCorrect = selected === question.answer;
          const stat = topicStats[question.topicId] || { done: 0, wrong: 0, correct: 0 };
          stat.done += 1;
          answeredTotal += 1;
          if (isCorrect) {
            correctTotal += 1;
            stat.correct += 1;
          } else {
            stat.wrong += 1;
          }
          topicStats[question.topicId] = stat;
          answeredQuestions.add(question.id);
        }
      });
      updateSummary();
      renderTopics();
      grammarApi(grammarApiUrls.submitMiniTest, {
        answers: sessionQuestions.map((question, index) => ({
          questionId: question.dbId,
          selectedIndex: sessionAnswers[index] ?? null,
        })),
      }).catch(showSyncError);
    }
    document.getElementById("practiceTitle").textContent = isMiniTest
      ? "Hoàn thành Mini Test"
      : "Hoàn thành luyện tập";
    document.getElementById("practiceBreadcrumbTitle").textContent = isMiniTest
      ? "Hoàn thành Mini Test"
      : "Hoàn thành luyện tập";
    document.getElementById("practiceProgress").textContent =
      `Bạn đã làm ${sessionAttempted} câu`;
    document
      .querySelector(".practice-progress-track")
      .setAttribute("aria-valuenow", 100);
    document.getElementById("practiceProgressFill").style.width = "100%";
    document.getElementById("practiceQuestion").textContent = isMiniTest
      ? `Bạn trả lời đúng ${sessionCorrect}/${sessionQuestions.length} câu. Mini Test đã hoàn thành!`
      : `Bạn trả lời đúng ${sessionCorrect}/${sessionAttempted} câu. Hãy tiếp tục luyện tập để củng cố kiến thức nhé!`;
    document.getElementById("practiceQuestionTranslation").hidden = true;
    document.getElementById("miniTestStatus").hidden = true;
    document.getElementById("miniTestTimerWrap").hidden = true;
    closePracticeQuestionMap(false);
    document
      .getElementById("practiceTheoryToggle")
      .setAttribute("aria-pressed", "false");
    document
      .getElementById("practiceQuestionMapToggle")
      .setAttribute("aria-expanded", "false");
    practiceOptions.replaceChildren();
    document.querySelector(".practice-actions").hidden = true;
    document.getElementById("practiceFeedback").textContent = "";
    document.getElementById("practiceResultBanner").hidden = true;
    document.getElementById("practiceAnswerSummary").hidden = true;
    document.getElementById("practiceGrammarReminder").hidden = true;
    document
      .getElementById("practiceExplanationPanel")
      .classList.remove("is-awaiting-answer");
    document.getElementById("practiceExplanation").textContent = isMiniTest
      ? `Kết quả: ${sessionCorrect} câu đúng trên tổng số ${sessionQuestions.length} câu.`
      : `Bạn đã hoàn thành bài luyện với ${sessionCorrect} câu trả lời đúng trên tổng số ${sessionAttempted} câu.`;
    document.getElementById("practiceNextLabel").textContent = "Đóng";
    practiceNext.querySelector("i").className = "fa-solid fa-xmark";
    practiceNext.disabled = false;
    practiceComplete = true;
  }

  function closePractice() {
    closePracticeQuestionMap(false);
    stopMiniTestTimer();
    practicePage.classList.remove("is-mini-test");
    practicePage.classList.remove("is-regular-practice");
    document.getElementById("miniTestStatus").hidden = true;
    document.getElementById("miniTestTimerWrap").hidden = true;
    const topicCrumbWrap = document.getElementById("practiceTopicCrumbWrap");
    if (topicCrumbWrap) topicCrumbWrap.hidden = true;
    if (document.getElementById("practiceTopicCrumb")) {
      document.getElementById("practiceTopicCrumb").hidden = true;
    }
    if (document.getElementById("practiceTopicCrumbChevron")) {
      document.getElementById("practiceTopicCrumbChevron").hidden = true;
    }
    practicePage.hidden = true;
    grammarCatalog.hidden = false;
    dashboardLayout.classList.remove("practice-active");
    window.scrollTo(0, catalogWindowScrollY);
    if (modalTrigger && modalTrigger.isConnected)
      modalTrigger.focus({ preventScroll: true });
    else document.getElementById("learningTab").focus({ preventScroll: true });
  }

  let topicToReset = null;
  const resetTopicModal = document.getElementById("resetTopicModal");
  const resetTopicClose = document.getElementById("resetTopicClose");
  const resetTopicCancel = document.getElementById("resetTopicCancel");
  const resetTopicConfirm = document.getElementById("resetTopicConfirm");

  function openResetTopicModal(topicId) {
    topicToReset = topicId;
    if (resetTopicModal) {
      resetTopicModal.hidden = false;
      if (resetTopicCancel) resetTopicCancel.focus();
    }
  }

  function closeResetTopicModal() {
    topicToReset = null;
    if (resetTopicModal) {
      resetTopicModal.hidden = true;
    }
  }

  if (resetTopicClose) resetTopicClose.addEventListener("click", closeResetTopicModal);
  if (resetTopicCancel) resetTopicCancel.addEventListener("click", closeResetTopicModal);
  if (resetTopicModal) {
    resetTopicModal.addEventListener("click", (e) => {
      if (e.target === resetTopicModal) closeResetTopicModal();
    });
  }
  if (resetTopicConfirm) {
    resetTopicConfirm.addEventListener("click", () => {
      if (topicToReset && topicStats[topicToReset]) {
        const stat = topicStats[topicToReset];
        const topicRecord = allTopicRecords().find((item) => item.id === topicToReset);
        answeredTotal = Math.max(0, answeredTotal - (stat.done || 0));
        correctTotal = Math.max(0, correctTotal - (stat.correct || 0));
        delete topicStats[topicToReset];
        topicRecord?.questions.forEach((item) => answeredQuestions.delete(item.id));
        grammarApi(grammarApiUrls.resetTopic, {
          topicId: topicRecord?.dbId ?? numericId(topicToReset),
        }).catch(showSyncError);
        updateSummary();
        renderTopics();
      }
      closeResetTopicModal();
    });
  }

  topicSections.addEventListener("click", (event) => {
    const resetTopicBtn = event.target.closest("[data-reset-topic]");
    if (resetTopicBtn) {
      event.preventDefault();
      event.stopPropagation();
      openResetTopicModal(resetTopicBtn.dataset.resetTopic);
      return;
    }
    const removeTheoryBtn = event.target.closest("[data-remove-theory]");
    if (removeTheoryBtn) {
      event.preventDefault();
      event.stopPropagation();
      const theoryId = removeTheoryBtn.dataset.removeTheory;
      const idx = savedTheories.findIndex((t) => t.id === theoryId);
      if (idx !== -1) {
        const [removedNote] = savedTheories.splice(idx, 1);
        removeNoteOnServer(removedNote);
        updateSummary();
        const card = removeTheoryBtn.closest(".notebook-theory-card");
        if (card) card.remove();
        const gGrid = topicSections.querySelector(".notebook-theories-grid");
        const remaining = gGrid ? gGrid.querySelectorAll(".notebook-theory-card") : [];
        const countElem = topicSections.querySelector(".notebook-section-badge-pill");
        if (countElem) {
          countElem.textContent = `Đã lưu ${remaining.length} cấu trúc`;
        }
        if (!remaining || remaining.length === 0) {
          const query = document
            .getElementById("topicSearch")
            .value.trim()
            .toLocaleLowerCase("vi");
          renderNotebookTab(query);
        }
      }
      return;
    }

    const removeQuestionBtn = event.target.closest("[data-remove-question]");
    if (removeQuestionBtn) {
      event.preventDefault();
      event.stopPropagation();
      const questionId = removeQuestionBtn.dataset.removeQuestion;
      savedQuestions.delete(questionId);
      grammarApi(grammarApiUrls.setBookmark, {
        questionId: numericId(questionId),
        saved: false,
      }).catch(showSyncError);
      updateSummary();
      const card = removeQuestionBtn.closest(".notebook-question-card");
      if (card) card.remove();
      const qGrid = topicSections.querySelector(".notebook-questions-grid");
      const remainingCards = qGrid ? qGrid.querySelectorAll(".notebook-question-card") : [];
      const countElem = topicSections.querySelector(".notebook-section-count");
      if (countElem) {
        countElem.textContent = `${remainingCards.length} câu`;
      }
      if (!remainingCards || remainingCards.length === 0) {
        const query = document
          .getElementById("topicSearch")
          .value.trim()
          .toLocaleLowerCase("vi");
        renderNotebookTab(query);
      }
      return;
    }

    const bookmarkButton = event.target.closest("[data-bookmark]");
    if (bookmarkButton) {
      const id = bookmarkButton.dataset.bookmark;
      if (savedTopics.has(id)) savedTopics.delete(id);
      else savedTopics.add(id);
      saveProgress();
      updateSummary();
      renderTopics();
      return;
    }

    const practiceButton = event.target.closest("[data-practice]");
    if (practiceButton) {
      const record = allTopicRecords().find(
        (item) => item.id === practiceButton.dataset.practice,
      );
      if (record) {
        if (!record.questions || record.questions.length === 0) {
          alert("Chủ đề này chưa có câu hỏi luyện tập. Đang cập nhật nội dung!");
          return;
        }
        openPractice(record.questions, practiceButton);
      }
      return;
    }

    const sizeButton = event.target.closest("[data-size]");
    if (sizeButton) {
      selectedTestSize = Number(sizeButton.dataset.size);
      renderTopics();
      return;
    }

    const groupButton = event.target.closest("[data-start-group]");
    if (groupButton) {
      const group = grammarGroups.find(
        (item) => item.id === groupButton.dataset.startGroup,
      );
      if (!group) return;
      const isTest = groupButton.dataset.mode === "test";
      let records = allQuestionRecords().filter((item) => item.group.id === group.id);
      if (isTest) {
        const toeicRecords = records.filter((item) => item.exam && item.exam.includes("TOEIC"));
        if (toeicRecords.length > 0) {
          records = toeicRecords;
        }
      }
      if (!records || records.length === 0) {
        alert("Chủ đề này chưa có câu hỏi luyện tập. Đang cập nhật nội dung!");
        return;
      }
      if (isTest && records.length) {
        const targetCount = Math.min(50, Math.max(records.length, 10));
        const shuffledQuestions = [];
        while (shuffledQuestions.length < targetCount && shuffledQuestions.length < 50) {
          const round = [...records].sort(() => Math.random() - 0.5);
          if (
            round.length > 1 &&
            shuffledQuestions.length &&
            round[0].id === shuffledQuestions[shuffledQuestions.length - 1].id
          ) {
            [round[0], round[1]] = [round[1], round[0]];
          }
          shuffledQuestions.push(...round);
        }
        records = shuffledQuestions.slice(0, 50);
      }
      openPractice(
        records,
        groupButton,
        isTest ? records.length : Math.min(selectedTestSize, records.length),
      );
    }
  });

  practiceNext.addEventListener("click", () => {
    if (practiceComplete) {
      closePractice();
      return;
    }
    advancePractice();
  });

  document.getElementById("practicePrevious").addEventListener("click", () => {
    if (questionIndex === 0) return;
    closePracticeQuestionMap(false);
    questionIndex -= 1;
    renderQuestion();
  });

  document
    .getElementById("practiceTheoryToggle")
    .addEventListener("click", openGrammarTheory);
  document
    .getElementById("practiceFullTheory")
    .addEventListener("click", openGrammarTheory);
  document
    .getElementById("grammarTheoryClose")
    .addEventListener("click", closeGrammarTheory);
  document
    .getElementById("grammarTheoryDialog")
    .addEventListener("click", (event) => {
      if (event.target === event.currentTarget) closeGrammarTheory();
    });

  document
    .getElementById("practiceQuestionMapToggle")
    .addEventListener("click", openPracticeQuestionMap);
  document
    .getElementById("practiceQuestionMapClose")
    .addEventListener("click", () => closePracticeQuestionMap());
  document
    .getElementById("practiceQuestionMap")
    .addEventListener("click", (event) => {
      if (event.target === event.currentTarget) closePracticeQuestionMap();
    });
  document.querySelectorAll("[data-map-filter]").forEach((button) => {
    button.addEventListener("click", () => {
      questionMapFilter = button.dataset.mapFilter;
      renderPracticeQuestionMap();
      document.getElementById("practiceQuestionMapContent").scrollTop = 0;
    });
  });

  document
    .getElementById("practiceClose")
    .addEventListener("click", closePractice);
  document
    .getElementById("practiceTranslationToggle")
    .addEventListener("click", (event) => {
      translationVisible = !translationVisible;
      event.currentTarget.setAttribute(
        "aria-pressed",
        String(translationVisible),
      );
      document.getElementById("practiceQuestionTranslation").hidden =
        !translationVisible;
    });
  document
    .getElementById("practiceExplainToggle")
    .addEventListener("click", (event) => {
      explanationVisible = !explanationVisible;
      updatePracticeActions(sessionQuestions[questionIndex]);
    });
  document
    .getElementById("practiceBookmarkToggle")
    .addEventListener("click", () => {
      const question = sessionQuestions[questionIndex];
      if (savedQuestions.has(question.id)) savedQuestions.delete(question.id);
      else savedQuestions.add(question.id);
      grammarApi(grammarApiUrls.setBookmark, {
        questionId: question.dbId,
        saved: savedQuestions.has(question.id),
      }).catch(showSyncError);
      updatePracticeActions(question);
      updateSummary();
      if (activeTab === "notebook") renderTopics();
    });
  let selectedReportCategory = "Sai đáp án";
  let reportToastTimer = null;

  function showReportToast(message) {
    const toast = document.getElementById("practiceReportToast");
    if (!toast) return;
    toast.textContent = message;
    toast.hidden = false;
    clearTimeout(reportToastTimer);
    reportToastTimer = setTimeout(() => {
      toast.hidden = true;
    }, 3200);
  }

  function resetReportDialog() {
    selectedReportCategory = "Sai đáp án";
    document.querySelectorAll(".practice-report-chip").forEach((chip) => {
      chip.setAttribute(
        "aria-pressed",
        chip.dataset.reportCategory === "Sai đáp án" ? "true" : "false"
      );
    });
    const detailsInput = document.getElementById("practiceReportDetails");
    if (detailsInput) detailsInput.value = "";
    const status = document.getElementById("practiceReportStatus");
    if (status) status.textContent = "";
  }

  document.querySelectorAll(".practice-report-chip").forEach((chip) => {
    chip.addEventListener("click", () => {
      selectedReportCategory = chip.dataset.reportCategory || "Sai đáp án";
      document.querySelectorAll(".practice-report-chip").forEach((c) => {
        c.setAttribute("aria-pressed", c === chip ? "true" : "false");
      });
    });
  });

  const practiceReportClose = document.getElementById("practiceReportClose");
  if (practiceReportClose) {
    practiceReportClose.addEventListener("click", () => {
      practiceReportDialog.hidden = true;
      document.getElementById("practiceReportToggle").focus();
    });
  }

  document
    .getElementById("practiceReportToggle")
    .addEventListener("click", () => {
      const question = sessionQuestions[questionIndex];
      if (!question) return;
      document.getElementById("practiceReportQuestion").textContent =
        question.question || question.stem || "";
      resetReportDialog();
      practiceReportDialog.hidden = false;
      document.getElementById("practiceReportDetails").focus();
    });
  document
    .getElementById("practiceReportCancel")
    .addEventListener("click", () => {
      practiceReportDialog.hidden = true;
      document.getElementById("practiceReportToggle").focus();
    });
  practiceReportDialog.addEventListener("click", (event) => {
    if (event.target === practiceReportDialog)
      practiceReportDialog.hidden = true;
  });
  document
    .getElementById("practiceReportSubmit")
    .addEventListener("click", () => {
      const details = document
        .getElementById("practiceReportDetails")
        .value.trim();
      const status = document.getElementById("practiceReportStatus");
      const question = sessionQuestions[questionIndex];
      if (!question) return;

      const submitButton = document.getElementById("practiceReportSubmit");
      submitButton.disabled = true;
      const originalText = submitButton.textContent;
      submitButton.textContent = "Đang gửi...";
      status.textContent = "";

      const qId = Number(question.dbId) || numericId(question.id) || 0;

      grammarApi(grammarApiUrls.reportQuestion, {
        questionId: qId,
        details: details,
        category: selectedReportCategory,
      })
        .then((res) => {
          if (res && res.ok === false) {
            status.textContent = res.message || "Không gửi được báo lỗi. Vui lòng thử lại.";
            return;
          }
          practiceReportDialog.hidden = true;
          showReportToast("Cảm ơn bạn! Báo lỗi đã được gửi tới đội ngũ rà soát.");
          resetReportDialog();
        })
        .catch((err) => {
          console.error("Report Question Error:", err);
          status.textContent =
            err && err.message
              ? err.message
              : "Không gửi được báo lỗi. Vui lòng thử lại.";
        })
        .finally(() => {
          submitButton.disabled = false;
          submitButton.textContent = originalText;
        });
    });
  document
    .getElementById("practiceFeedbackToggle")
    .addEventListener("click", () => {
      if (typeof window.triggerFeedbackModal === "function")
        window.triggerFeedbackModal();
    });
  document.addEventListener("keydown", (event) => {
    if (!document.getElementById("practiceQuestionMap").hidden) {
      if (event.key === "Escape") {
        event.preventDefault();
        closePracticeQuestionMap();
      } else if (event.key === "Tab") {
        const buttons = [
          ...document.querySelectorAll(
            ".practice-map-drawer button:not(:disabled)",
          ),
        ];
        const first = buttons[0];
        const last = buttons[buttons.length - 1];
        if (event.shiftKey && document.activeElement === first) {
          event.preventDefault();
          last.focus();
        } else if (!event.shiftKey && document.activeElement === last) {
          event.preventDefault();
          first.focus();
        }
      }
      return;
    }
    if (
      event.key === "Tab" &&
      !document.getElementById("grammarTheoryDialog").hidden
    ) {
      const dialog = document.querySelector(".grammar-theory-window");
      const focusable = [...dialog.querySelectorAll("button:not(:disabled)")];
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
      return;
    }
    if (event.key === "Tab" && !filterPanel.hidden) {
      const focusable = [...filterPanel.querySelectorAll("button:not(:disabled)")];
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && (document.activeElement === first || document.activeElement === filterPanel)) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && (document.activeElement === last || document.activeElement === filterPanel)) {
        event.preventDefault();
        first.focus();
      }
      return;
    }
    if (event.key !== "Escape") return;
    if (!filterPanel.hidden) {
      closeFilterDrawer();
      return;
    }
    if (!practiceReportDialog.hidden) {
      practiceReportDialog.hidden = true;
      document.getElementById("practiceReportToggle").focus();
    } else if (!document.getElementById("grammarTheoryDialog").hidden) {
      closeGrammarTheory();
    } else if (!practicePage.hidden) {
      closePractice();
    }
  });
  function updateFilterResetState() {
    const hasActiveFilters = activeCategory !== "all" || activeExam !== "all" ||
      activeSort !== "default" || document.getElementById("topicSearch").value.trim() !== "";
    document.getElementById("filterReset").disabled = !hasActiveFilters;
  }

  document.getElementById("topicSearch").addEventListener("input", () => {
    renderTopics();
    updateFilterResetState();
  });
  function openFilterDrawer() {
    filterPanel.hidden = false;
    filterBackdrop.hidden = false;
    filterToggle.setAttribute("aria-expanded", "true");
    filterPanel.focus({ preventScroll: true });
  }

  function closeFilterDrawer() {
    filterPanel.hidden = true;
    filterBackdrop.hidden = true;
    filterToggle.setAttribute("aria-expanded", "false");
    filterToggle.focus({ preventScroll: true });
  }

  function syncFilterButtons(attribute, value) {
    document.querySelectorAll(`[${attribute}]`).forEach((button) => {
      button.setAttribute("aria-pressed", String(button.dataset[attribute.slice(5)] === value));
    });
  }

  filterToggle.addEventListener("click", openFilterDrawer);
  document.getElementById("filterClose").addEventListener("click", closeFilterDrawer);
  filterBackdrop.addEventListener("click", closeFilterDrawer);

  function handleFilterControls(event) {
    const categoryButton = event.target.closest("[data-category]");
    if (categoryButton) {
      activeCategory = categoryButton.dataset.category;
      syncFilterButtons("data-category", activeCategory);
      updateFilterResetState();
      renderTopics();
      return;
    }
    const examButton = event.target.closest("[data-exam]");
    if (examButton) {
      activeExam = examButton.dataset.exam;
      syncFilterButtons("data-exam", activeExam);
      updateFilterResetState();
      renderTopics();
      return;
    }
    const sortButton = event.target.closest("[data-sort]");
    if (sortButton) {
      activeSort = sortButton.dataset.sort;
      syncFilterButtons("data-sort", activeSort);
      updateFilterResetState();
      renderTopics();
    }
  }

  document.querySelector(".grammar-tools").addEventListener("click", handleFilterControls);
  filterPanel.addEventListener("click", handleFilterControls);

  document.getElementById("filterReset").addEventListener("click", () => {
    activeCategory = "all";
    activeExam = "all";
    activeSort = "default";
    document.getElementById("topicSearch").value = "";
    syncFilterButtons("data-category", activeCategory);
    syncFilterButtons("data-exam", activeExam);
    syncFilterButtons("data-sort", activeSort);
    updateFilterResetState();
    renderTopics();
  });

  document.querySelector(".grammar-tabs").addEventListener("click", (event) => {
    const tab = event.target.closest('[role="tab"]');
    if (!tab) return;
    activeTab = tab.id === "notebookTab" ? "notebook" : "learning";
    document
      .querySelectorAll(".grammar-tab")
      .forEach((item) =>
        item.setAttribute("aria-selected", String(item === tab)),
      );
    renderTopics();
  });

  renderCategoryFilters();
  updateFilterResetState();
  updateSummary();
  renderTopics();
})();
