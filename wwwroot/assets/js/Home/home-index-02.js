
        document.addEventListener('DOMContentLoaded', () => {
            
            // 1. Dark/Light Theme Toggle Logic
            const themeToggleBtn = document.getElementById('themeToggle');
            const themeIcon = document.getElementById('themeIcon');
            const mobileThemeToggleBtn = document.getElementById('mobileThemeToggle');
            const mobileThemeIcon = document.getElementById('mobileThemeIcon');

            function updateThemeIcons(isDark) {
                const iconClass = isDark ? 'fa-solid fa-moon' : 'fa-regular fa-sun';
                if (themeIcon) themeIcon.className = iconClass;
                if (mobileThemeIcon) mobileThemeIcon.className = iconClass;
            }

            function toggleTheme() {
                if (document.documentElement.classList.contains('dark')) {
                    document.documentElement.classList.remove('dark');
                    localStorage.setItem('theme', 'light');
                    updateThemeIcons(false);
                } else {
                    document.documentElement.classList.add('dark');
                    localStorage.setItem('theme', 'dark');
                    updateThemeIcons(true);
                }
            }

            const savedTheme = localStorage.getItem('theme');
            const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;

            if (savedTheme === 'dark' || (!savedTheme && systemPrefersDark)) {
                document.documentElement.classList.add('dark');
                updateThemeIcons(true);
            } else {
                document.documentElement.classList.remove('dark');
                updateThemeIcons(false);
            }

            if (themeToggleBtn) themeToggleBtn.addEventListener('click', toggleTheme);
            if (mobileThemeToggleBtn) mobileThemeToggleBtn.addEventListener('click', toggleTheme);

            // 2. Mobile Menu Toggle
            const mobileMenuBtn = document.getElementById('mobileMenuBtn');
            const mobileMenu = document.getElementById('mobileMenu');

            if (mobileMenuBtn && mobileMenu) {
                mobileMenuBtn.addEventListener('click', () => {
                    mobileMenu.classList.toggle('hidden');
                });
            }

            // 3. Counter Animation for Statistics
            const counters = document.querySelectorAll('.counter');
            let hasAnimated = false;

            const animateCounters = () => {
                counters.forEach(counter => {
                    const target = +counter.getAttribute('data-target');
                    const duration = 2000;
                    const stepTime = 20;
                    const steps = duration / stepTime;
                    const increment = target / steps;
                    let current = 0;

                    const timer = setInterval(() => {
                        current += increment;
                        if (current >= target) {
                            counter.innerText = target.toLocaleString('vi-VN');
                            clearInterval(timer);
                        } else {
                            counter.innerText = Math.ceil(current).toLocaleString('vi-VN');
                        }
                    }, stepTime);
                });
            };

            const statsSection = document.getElementById('stats');
            if (statsSection) {
                const observer = new IntersectionObserver((entries) => {
                    entries.forEach(entry => {
                        if (entry.isIntersecting && !hasAnimated) {
                            hasAnimated = true;
                            animateCounters();
                        }
                    });
                }, { threshold: 0.3 });

                observer.observe(statsSection);
            }
        });

        // Pronunciation Audio Synthesis
        function playPronunciation(lang) {
            if ('speechSynthesis' in window) {
                const utterance = new SpeechSynthesisUtterance("access");
                utterance.lang = lang === 'UK' ? 'en-GB' : 'en-US';
                window.speechSynthesis.speak(utterance);
            }
        }

        // Grammar Option Selection Simulation
        function selectOption(label, text) {
            const display = document.getElementById('selectedAnswerDisplay');
            if (display) {
                display.innerText = text;
            }
        }

        // Demo Audio Player Toggle
        let isAudioPlaying = false;
        function toggleAudio() {
            const icon = document.getElementById('playAudioIcon');
            const progressBar = document.getElementById('audioProgressBar');
            
            isAudioPlaying = !isAudioPlaying;
            if (isAudioPlaying) {
                icon.className = 'fa-solid fa-pause text-xs';
                progressBar.classList.add('animate-pulse');
            } else {
                icon.className = 'fa-solid fa-play text-xs';
                progressBar.classList.remove('animate-pulse');
            }
        }

        function seekAudio(event) {
            const progressBar = document.getElementById('audioProgressBar');
            const rect = event.currentTarget.getBoundingClientRect();
            const clickPosition = event.clientX - rect.left;
            const percentage = (clickPosition / rect.width) * 100;
            progressBar.style.width = percentage + '%';
        }

        // Exam Option Click Handler
        function selectExamOption(selectedBtn) {
            const options = document.querySelectorAll('.exam-opt');
            options.forEach(btn => {
                btn.className = 'exam-opt w-full p-3 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700/50 text-left flex items-center gap-3 transition';
                const badge = btn.querySelector('.opt-badge');
                if (badge) {
                    badge.className = 'opt-badge w-6 h-6 rounded-full bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 text-xs font-bold flex items-center justify-center flex-shrink-0';
                }
            });

            selectedBtn.className = 'exam-opt w-full p-3 rounded-xl border border-amber-300 bg-amber-50/70 dark:bg-amber-950/30 text-left flex items-center gap-3 transition';
            const badge = selectedBtn.querySelector('.opt-badge');
            if (badge) {
                badge.className = 'opt-badge w-6 h-6 rounded-full bg-amber-200 dark:bg-amber-900 text-amber-900 dark:text-amber-200 text-xs font-bold flex items-center justify-center flex-shrink-0';
            }
        }
    