(() => {
  const metricLabels = {
    studyTime: 'Thời gian học',
    correctAnswers: 'Số câu đúng',
    studyDays: 'Số ngày học',
    learnedWords: 'Từ vựng đã ôn',
    mockTests: 'Điểm thi thử'
  };

  const periodMultipliers = {
    week: 0.18,
    month: 0.45,
    all: 1.0
  };

  const learners = [
    {
      rank: 1,
      name: 'Nam Phùng',
      slogan: 'Học nhiều hơn, tiến xa hơn',
      avatar: 'https://lh3.googleusercontent.com/a/ACg8ocJmJXf21vKp6pXx9vW1lEMPyleJoNwQrMiycT39UsRNKqhDox34=s96-c',
      baseValues: { studyTime: 5976, correctAnswers: 3840, studyDays: 98, learnedWords: 2450, mockTests: 985 }
    },
    {
      rank: 2,
      name: 'Chanmi',
      slogan: 'Kiên trì tạo nên khác biệt',
      avatar: 'https://lh3.googleusercontent.com/a/ACg8ocLIBUkf5dP19bkXU3c10QxyEvMuApTG7W-qnVivbGc3wIrnIAM=s96-c',
      baseValues: { studyTime: 4382, correctAnswers: 3210, studyDays: 86, learnedWords: 2130, mockTests: 940 }
    },
    {
      rank: 3,
      name: 'Ziip riview phim',
      slogan: 'Mỗi ngày là một bước tiến',
      avatar: 'https://lh3.googleusercontent.com/a/ACg8ocJCVduf396n_t9bmnXrCvwCdKbE8vStGtfZDrIUI19QJurVxg=s96-c',
      baseValues: { studyTime: 4327, correctAnswers: 2980, studyDays: 79, learnedWords: 1890, mockTests: 915 }
    },
    {
      rank: 4,
      name: 'Huyền Thanh',
      avatar: 'https://lh3.googleusercontent.com/a/ACg8ocIV-FoCEkMiOXywwHLS6hHLUJ1C4oR46gmw5lH8lAL846u5oLu6=s96-c',
      baseValues: { studyTime: 4010, correctAnswers: 2650, studyDays: 72, learnedWords: 1680, mockTests: 885 }
    },
    {
      rank: 5,
      name: 'Minh Triển Nguyễn',
      avatar: 'https://lh3.googleusercontent.com/a/ACg8ocKdmQDTSB6qypaVwFpUTLrx7q8ERkboDSzwe8YsjSA0FjWmLA=s96-c',
      baseValues: { studyTime: 3299, correctAnswers: 2410, studyDays: 68, learnedWords: 1540, mockTests: 860 }
    },
    {
      rank: 6,
      name: 'Cường Nguyễn Văn',
      avatar: 'https://lh3.googleusercontent.com/a/ACg8ocK83O5WfW7I-WyqQuYbjZ5XuyQCBQlFGmTyL9A6BTaKqeNRxzI=s96-c',
      baseValues: { studyTime: 2828, correctAnswers: 2180, studyDays: 61, learnedWords: 1390, mockTests: 830 }
    },
    {
      rank: 7,
      name: 'Khiêm Khiêm',
      avatar: 'https://lh3.googleusercontent.com/a/ACg8ocKCgihBqapi0AiyQTpE65vQ6XpNK8pcFqMFB-GWXQGi6HowE0NN=s96-c',
      baseValues: { studyTime: 2472, correctAnswers: 1950, studyDays: 55, learnedWords: 1240, mockTests: 810 }
    },
    {
      rank: 8,
      name: 'Trần Anh Tú',
      avatar: 'https://lh3.googleusercontent.com/a/ACg8ocIFH3zX5FYcrIr1uhQeTb8DQwQ1XIiinhDURDkvOrpgQPPsnvG5=s96-c',
      baseValues: { studyTime: 2417, correctAnswers: 1840, studyDays: 51, learnedWords: 1180, mockTests: 785 }
    },
    {
      rank: 9,
      name: 'The Dep',
      avatar: 'https://lh3.googleusercontent.com/a/ACg8ocL-wrcszu8Dg42Qp5qGH5unN7hj48tkuHui1QVhCA2n-FGuuw=s96-c',
      baseValues: { studyTime: 2388, correctAnswers: 1790, studyDays: 49, learnedWords: 1120, mockTests: 770 }
    },
    {
      rank: 10,
      name: 'Nhi Quynh',
      avatar: 'https://lh3.googleusercontent.com/a/ACg8ocJZjrAAg49HXaFKejlHI9ZOCgS4BWf9pZ0_N_swsOtdjRC52w=s96-c',
      baseValues: { studyTime: 2242, correctAnswers: 1650, studyDays: 45, learnedWords: 1040, mockTests: 745 }
    }
  ];

  const currentUser = {
    rank: 326,
    name: 'Sáng Lê',
    avatar: 'https://lh3.googleusercontent.com/a/ACg8ocK-nP1k_SeIlx2e0s3puIPThXAAz7TlPDW-0FmcXll1pHEnCYgK=s96-c',
    baseValues: { studyTime: 133, correctAnswers: 326, studyDays: 12, learnedWords: 185, mockTests: 520 }
  };

  let currentMetric = 'studyTime';
  let currentPeriod = 'all';

  function formatMetricValue(rawMinutesOrCount, metric) {
    if (metric === 'studyTime') {
      const totalMinutes = Math.max(1, Math.round(rawMinutesOrCount));
      const hours = Math.floor(totalMinutes / 60);
      const mins = totalMinutes % 60;
      return `${hours}h ${mins}p`;
    }
    if (metric === 'correctAnswers') {
      return `${Math.round(rawMinutesOrCount).toLocaleString('vi-VN')} câu`;
    }
    if (metric === 'studyDays') {
      return `${Math.max(1, Math.round(rawMinutesOrCount))} ngày`;
    }
    if (metric === 'learnedWords') {
      return `${Math.round(rawMinutesOrCount).toLocaleString('vi-VN')} từ`;
    }
    if (metric === 'mockTests') {
      return `${Math.round(rawMinutesOrCount)} điểm`;
    }
    return String(rawMinutesOrCount);
  }

  function getCalculatedValue(baseVal, metric, period) {
    if (metric === 'mockTests') {
      return baseVal;
    }
    const factor = periodMultipliers[period] || 1;
    if (metric === 'studyDays') {
      return Math.max(1, Math.round(baseVal * (period === 'week' ? 0.08 : period === 'month' ? 0.35 : 1)));
    }
    return Math.max(1, Math.round(baseVal * factor));
  }

  function renderLeaderboard() {
    const headingEl = document.getElementById('leaderboardValueHeading');
    if (headingEl) {
      headingEl.textContent = metricLabels[currentMetric];
    }

    const mobileMetricLabel = document.getElementById('mobileMetricLabel');
    if (mobileMetricLabel) {
      mobileMetricLabel.textContent = metricLabels[currentMetric];
    }

    const top1 = learners[0];
    const top2 = learners[1];
    const top3 = learners[2];

    const val1 = getCalculatedValue(top1.baseValues[currentMetric], currentMetric, currentPeriod);
    const val2 = getCalculatedValue(top2.baseValues[currentMetric], currentMetric, currentPeriod);
    const val3 = getCalculatedValue(top3.baseValues[currentMetric], currentMetric, currentPeriod);

    document.getElementById('podiumValue1').textContent = formatMetricValue(val1, currentMetric);
    document.getElementById('podiumValue2').textContent = formatMetricValue(val2, currentMetric);
    document.getElementById('podiumValue3').textContent = formatMetricValue(val3, currentMetric);

    const container = document.getElementById('leaderboardRowsContainer');
    container.replaceChildren();

    learners.slice(3).forEach((item) => {
      const val = getCalculatedValue(item.baseValues[currentMetric], currentMetric, currentPeriod);
      const row = document.createElement('div');
      row.className = 'leaderboard-row flex items-center gap-3 px-3 transition-colors sm:px-5';
      row.setAttribute('role', 'listitem');

      const rankSpan = document.createElement('span');
      rankSpan.className = 'w-6 shrink-0 text-center font-display text-sm font-extrabold tabular-nums text-muted-foreground sm:w-9 sm:text-base';
      rankSpan.setAttribute('aria-label', `Hạng ${item.rank}`);
      rankSpan.textContent = String(item.rank);

      const avatarWrap = document.createElement('div');
      avatarWrap.className = 'relative p-[2px] rounded-full bg-gradient-to-br from-[hsl(var(--brand-from))] to-[hsl(var(--brand-to))] shadow-[0_0_10px_hsl(var(--primary)/0.2)] hover:shadow-[0_0_16px_hsl(var(--primary)/0.45)] hover:scale-105 transition-all duration-300 leaderboard-row-avatar shrink-0 text-xs';
      avatarWrap.innerHTML = `
        <div class="h-full w-full rounded-full bg-background p-[1.5px] flex items-center justify-center">
          <div class="relative flex h-full w-full items-center justify-center rounded-full bg-spectrum text-white font-bold overflow-hidden">
            <img alt="${item.name}" class="h-full w-full object-cover" referrerpolicy="no-referrer" loading="lazy" decoding="async" src="${item.avatar}">
          </div>
        </div>
      `;

      const nameP = document.createElement('p');
      nameP.className = 'min-w-0 flex-1 truncate text-sm font-semibold text-foreground sm:text-[0.9375rem]';
      nameP.textContent = item.name;

      const scoreSpan = document.createElement('span');
      scoreSpan.className = 'shrink-0 font-display text-sm font-extrabold tabular-nums text-foreground sm:text-base';
      scoreSpan.textContent = formatMetricValue(val, currentMetric);

      row.append(rankSpan, avatarWrap, nameP, scoreSpan);
      container.append(row);
    });

    const myVal = getCalculatedValue(currentUser.baseValues[currentMetric], currentMetric, currentPeriod);
    document.getElementById('myLeaderboardRank').textContent = String(currentUser.rank);
    document.getElementById('myLeaderboardValue').textContent = formatMetricValue(myVal, currentMetric);
  }

  // Desktop tab filters
  document.querySelectorAll('.leaderboard-tab').forEach((btn) => {
    btn.addEventListener('click', () => {
      currentMetric = btn.dataset.metric;
      document.querySelectorAll('.leaderboard-tab').forEach((item) => {
        const isActive = item === btn;
        item.setAttribute('aria-selected', String(isActive));
        if (isActive) {
          item.className = 'leaderboard-tab min-h-touch inline-flex items-center gap-2 whitespace-nowrap rounded-full px-4 py-2 text-sm font-bold transition-all bg-blue-600 text-white shadow-soft';
        } else {
          item.className = 'leaderboard-tab min-h-touch inline-flex items-center gap-2 whitespace-nowrap rounded-full px-4 py-2 text-sm font-bold transition-all border border-slate-200/90 dark:border-slate-700 bg-white/90 dark:bg-slate-800/90 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700';
        }
      });
      renderLeaderboard();
    });
  });

  // Period buttons
  document.querySelectorAll('.leaderboard-period-btn').forEach((btn) => {
    btn.addEventListener('click', () => {
      currentPeriod = btn.dataset.period;
      const mobilePeriodLabel = document.getElementById('mobilePeriodLabel');
      if (mobilePeriodLabel) mobilePeriodLabel.textContent = btn.textContent.trim();

      document.querySelectorAll('.leaderboard-period-btn').forEach((item) => {
        const isActive = item === btn;
        item.setAttribute('aria-pressed', String(isActive));
        if (isActive) {
          item.className = 'leaderboard-period-btn min-h-touch whitespace-nowrap rounded-full border px-4 py-2 text-sm font-bold shadow-sm transition-all border-amber-300 dark:border-amber-500/50 bg-[#fef0cd] dark:bg-amber-500/20 text-[#8a5b17] dark:text-amber-300';
        } else {
          item.className = 'leaderboard-period-btn min-h-touch whitespace-nowrap rounded-full border px-4 py-2 text-sm font-bold shadow-sm transition-all border-slate-200/90 dark:border-slate-700 bg-white/90 dark:bg-slate-800/90 text-slate-700 dark:text-slate-200 hover:border-amber-400 hover:bg-amber-50';
        }
      });
      renderLeaderboard();
    });
  });

  renderLeaderboard();
})();
