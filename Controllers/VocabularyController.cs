using System.Security.Claims;
using System.Text.RegularExpressions;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using StudyEnglish.Data;
using StudyEnglish.Models.Vocabulary;
using StudyEnglish.Services;

namespace StudyEnglish.Controllers;

[Authorize(Roles = "Student")]
public class VocabularyController : Controller
{
    private readonly AppDbContext _context;
    private readonly IEdgeTtsService _edgeTts;

    public VocabularyController(AppDbContext context, IEdgeTtsService edgeTts)
    {
        _context = context;
        _edgeTts = edgeTts;
    }

    // ===== 1. TRANG CHÍNH TỪ VỰNG HỌC VIÊN (MVC VIEW) =====
    [HttpGet]
    public async Task<IActionResult> Index()
    {
        var userIdStr = User.FindFirstValue(ClaimTypes.NameIdentifier);
        int userId = 0;
        int.TryParse(userIdStr, out userId);

        string? fullName = null;
        string? email = null;
        string? avatar = null;

        if (userId > 0)
        {
            var user = await _context.Users
                .Include(u => u.Role)
                .FirstOrDefaultAsync(u => u.UserId == userId);

            if (user != null)
            {
                fullName = user.FullName;
                email = user.Email;
                avatar = string.IsNullOrEmpty(user.Avatar) ? "/images/default-avatar.png" : user.Avatar;
                ViewBag.FullName = user.FullName;
                ViewBag.Email = user.Email;
                ViewBag.Avatar = avatar;
                ViewBag.Hometown = user.Hometown ?? "Chưa cập nhật";
                ViewBag.BirthYear = user.BirthYear?.ToString() ?? "Chưa cập nhật";
                ViewBag.JoinedDate = user.CreatedAt.ToString("dd/MM/yyyy");
            }
        }

        // 1.1 Lấy cấu hình hệ thống do Admin thiết lập
        var settings = await _context.VocabSettings.AsNoTracking()
            .ToDictionaryAsync(s => s.SettingKey, s => s.SettingValue);

        bool enableFlashcards = !settings.TryGetValue("EnableFlashcards", out var ef) || ef.Equals("true", StringComparison.OrdinalIgnoreCase);
        bool enablePhrases = !settings.TryGetValue("EnablePhrases", out var ep) || ep.Equals("true", StringComparison.OrdinalIgnoreCase);
        bool enableReview = !settings.TryGetValue("EnableReview", out var er) || er.Equals("true", StringComparison.OrdinalIgnoreCase);
        bool enableQuiz = !settings.TryGetValue("EnableQuiz", out var eq) || eq.Equals("true", StringComparison.OrdinalIgnoreCase);
        bool enableNotebook = !settings.TryGetValue("EnableNotebook", out var en) || en.Equals("true", StringComparison.OrdinalIgnoreCase);
        bool enableAutoAudio = !settings.TryGetValue("EnableAutoAudio", out var ea) || ea.Equals("true", StringComparison.OrdinalIgnoreCase);
        int dailyGoal = settings.TryGetValue("DailyNewWordsGoal", out var dg) && int.TryParse(dg, out int g) ? g : 10;
        string bannerNotice = settings.TryGetValue("BannerNotice", out var bn) ? bn : "Mỗi ngày 10 từ vựng - Bứt phá điểm số TOEIC và giao tiếp tự tin!";

        // 1.2 Lấy tiến độ học thực tế của người dùng
        var userProgressMap = new Dictionary<int, UserVocabProgress>();
        if (userId > 0)
        {
            var pList = await _context.UserVocabProgresses.AsNoTracking()
                .Where(p => p.UserId == userId)
                .ToListAsync();
            foreach (var p in pList)
            {
                userProgressMap[p.WordId] = p;
            }
        }

        int learnedCount = userProgressMap.Count;
        int masteredCount = userProgressMap.Values.Count(p => p.Status == "Mastered");
        int learningCount = userProgressMap.Values.Count(p => p.Status == "Learning");
        int dueReviewCount = userProgressMap.Values.Count(p => p.NextReviewDate.HasValue && p.NextReviewDate.Value <= DateTime.UtcNow);
        int notebookCount = userProgressMap.Values.Count(p => p.IsBookmarked);

        // 1.3 Lấy danh mục và các bộ từ vựng từ cơ sở dữ liệu (tối ưu truy vấn nhẹ, không load toàn bộ text/JSON của hàng ngàn từ vào RAM)
        var categories = await _context.VocabCategories.AsNoTracking()
            .Where(c => !c.IsDeleted && c.IsActive)
            .Include(c => c.Topics.Where(t => !t.IsDeleted && t.IsActive))
            .OrderBy(c => c.SortOrder).ThenBy(c => c.CategoryId)
            .ToListAsync();

        var activeWordsMeta = await _context.VocabWords.AsNoTracking()
            .Where(w => !w.IsDeleted && w.IsActive)
            .Select(w => new { w.WordId, w.TopicId })
            .ToListAsync();

        var wordsByTopic = activeWordsMeta
            .GroupBy(w => w.TopicId)
            .ToDictionary(g => g.Key, g => g.Select(x => x.WordId).ToList());

        int totalWordsInDb = activeWordsMeta.Count;
        int totalSystemWords = totalWordsInDb > 0 ? totalWordsInDb : 4514;

        var groups = new List<VocabGroupViewModel>();
        string nextTopic = "Contracts";

        foreach (var cat in categories)
        {
            var groupVm = new VocabGroupViewModel
            {
                GroupName = cat.Name,
                GroupCode = cat.Code.ToLower(),
                Color = string.IsNullOrEmpty(cat.Color) ? "fuchsia" : cat.Color.ToLower(),
                Icon = string.IsNullOrEmpty(cat.Icon) ? "book-open" : cat.Icon
            };

            foreach (var topic in cat.Topics.OrderBy(t => t.SortOrder).ThenBy(t => t.TopicId))
            {
                var topicWordIds = wordsByTopic.TryGetValue(topic.TopicId, out var wIds) ? wIds : new List<int>();
                int totalWords = topicWordIds.Count;
                int learnedInTopic = topicWordIds.Count(id => userProgressMap.ContainsKey(id));
                int dueInTopic = topicWordIds.Count(id => userProgressMap.TryGetValue(id, out var p) && p.NextReviewDate.HasValue && p.NextReviewDate.Value <= DateTime.UtcNow);

                if (learnedInTopic < totalWords && nextTopic == "Contracts" && learnedInTopic > 0)
                {
                    nextTopic = topic.Title;
                }

                groupVm.Sets.Add(new VocabTopicCardViewModel
                {
                    TopicId = topic.TopicId,
                    Title = topic.Title,
                    Code = topic.Code ?? topic.Title.ToLower().Replace(" ", "-"),
                    GroupCode = cat.Code.ToLower(),
                    Level = topic.Level ?? "B1",
                    Icon = string.IsNullOrEmpty(topic.Icon) ? "book-open" : topic.Icon,
                    Color = string.IsNullOrEmpty(topic.Color) ? groupVm.Color : topic.Color.ToLower(),
                    IsLearned = learnedInTopic > 0,
                    LearnedCount = learnedInTopic,
                    DueReviewCount = dueInTopic,
                    TotalCount = totalWords > 0 ? totalWords : 12
                });
            }

            if (groupVm.Sets.Count > 0)
            {
                groups.Add(groupVm);
            }
        }

        var vm = new StudentVocabIndexViewModel
        {
            FullName = fullName,
            Email = email,
            Avatar = avatar,
            TotalWords = totalSystemWords,
            LearnedWords = learnedCount,
            LearningWords = learningCount,
            MasteredWords = masteredCount,
            DueReviewCount = dueReviewCount,
            SavedNotebookCount = notebookCount,
            NewWordsToday = 0,
            NewWordsGoal = dailyGoal,
            NextTopicTitle = nextTopic,
            BannerNotice = bannerNotice,
            EnableFlashcards = enableFlashcards,
            EnablePhrases = enablePhrases,
            EnableReview = enableReview,
            EnableQuiz = enableQuiz,
            EnableNotebook = enableNotebook,
            EnableAutoAudio = enableAutoAudio,
            Groups = groups
        };

        // Gán ViewBag dự phòng
        ViewBag.TotalSystemWords = totalSystemWords;
        ViewBag.LearnedCount = learnedCount;
        ViewBag.LearningCount = learningCount;
        ViewBag.MasteredCount = masteredCount;
        ViewBag.DueReviewCount = dueReviewCount;
        ViewBag.NotebookCount = notebookCount;
        ViewBag.DailyNewWordsGoal = dailyGoal;
        ViewBag.BannerNotice = bannerNotice;
        ViewBag.EnableFlashcards = enableFlashcards;
        ViewBag.EnablePhrases = enablePhrases;
        ViewBag.EnableReview = enableReview;
        ViewBag.EnableQuiz = enableQuiz;
        ViewBag.EnableNotebook = enableNotebook;
        ViewBag.EnableAutoAudio = enableAutoAudio;

        return View(vm);
    }

    // ===== 2. API TRẢ VỀ DANH SÁCH BÀI HỌC TỪ VỰNG (FLASHCARDS, QUIZ, TYPING, DETAILS) =====
    [HttpGet]
    public async Task<IActionResult> GetWordsByTopic(string? topicTitle, int? topicId)
    {
        return await GetTopicLesson(topicTitle, topicId);
    }

    [HttpGet]
    public async Task<IActionResult> GetTopicLesson(string? topicTitle, int? topicId)
    {
        var query = _context.VocabWords.AsNoTracking()
            .Include(w => w.Topic)
            .Where(w => !w.IsDeleted && w.IsActive);

        if (topicId.HasValue && topicId.Value > 0)
        {
            query = query.Where(w => w.TopicId == topicId.Value);
        }
        else if (!string.IsNullOrWhiteSpace(topicTitle))
        {
            query = query.Where(w => w.Topic != null && w.Topic.Title.ToLower() == topicTitle.Trim().ToLower());
        }
        else
        {
            return BadRequest(new { success = false, message = "Vui lòng chọn bộ từ hợp lệ." });
        }

        var words = await query.OrderBy(w => w.SortOrder).ThenBy(w => w.WordId).ToListAsync();

        if (words.Count == 0)
        {
            return Json(new { success = false, message = "Chưa có từ vựng nào trong bộ này." });
        }

        // Lấy danh sách từ đang hoạt động kèm PartOfSpeech, TopicId, Synonyms để chọn đáp án nhiễu thông minh
        var distractorPool = await _context.VocabWords.AsNoTracking()
            .Where(w => !w.IsDeleted && w.IsActive && !string.IsNullOrWhiteSpace(w.Meaning))
            .Select(w => new QuizCandidate(
                w.WordId,
                w.TopicId,
                w.Word,
                w.PartOfSpeech,
                w.Meaning,
                w.Synonyms))
            .ToListAsync();

        int userId = GetCurrentUserId();
        var progressMap = new Dictionary<int, UserVocabProgress>();
        if (userId > 0)
        {
            var pList = await _context.UserVocabProgresses.AsNoTracking()
                .Where(p => p.UserId == userId)
                .ToListAsync();
            foreach (var p in pList) progressMap[p.WordId] = p;
        }

        var rng = new Random();
        var resultList = words.Select(w =>
        {
            bool isLearned = progressMap.TryGetValue(w.WordId, out var up) && (up.Status == "Mastered" || up.ReviewCount > 0);
            bool isSaved = up?.IsBookmarked ?? false;
            return MapLessonWordDto(w, distractorPool, rng, isLearned, isSaved);
        }).ToList();

        return Json(new { success = true, data = resultList });
    }

    // ===== 3. API LẤY BỘ GHÉP CỤM TỪ (PHRASE SETS CATALOG & DETAILS) =====
    [HttpGet]
    public async Task<IActionResult> GetPhraseCatalog()
    {
        var activeTopics = await _context.VocabTopics.AsNoTracking()
            .Where(t => !t.IsDeleted && t.IsActive && t.Category != null && !t.Category.IsDeleted && t.Category.IsActive)
            .Select(t => new { Category = t.Category.Code.Trim().ToLower(), Title = t.Title.Trim().ToLower() })
            .ToListAsync();
        var activeTopicSet = activeTopics.Select(t => $"{t.Category}:{t.Title}").ToHashSet();

        var pairs = await _context.VocabPhrasePairs.AsNoTracking()
            .Where(p => !p.IsDeleted && p.IsActive)
            .OrderBy(p => p.TopicCategory).ThenBy(p => p.SortOrder).ThenBy(p => p.PairId)
            .ToListAsync();

        // CHỈ giữ lại các cụm từ thuộc bộ từ đang tồn tại và hoạt động bên Thẻ học (tuyệt đối không hiển thị General thừa hoặc danh mục đã xóa)
        pairs = pairs.Where(p =>
        {
            var cat = (p.TopicCategory ?? "").Trim().ToLower();
            var title = (p.SetTitle ?? "").Trim().ToLower();
            return activeTopicSet.Contains($"{cat}:{title}");
        }).ToList();

        var allWords = await _context.VocabWords.AsNoTracking()
            .Include(w => w.Topic)
            .Where(w => !w.IsDeleted && w.IsActive)
            .ToListAsync();

        var wordsByText = allWords
            .GroupBy(w => w.Word.Trim(), StringComparer.OrdinalIgnoreCase)
            .ToDictionary(g => g.Key, g => g.ToList(), StringComparer.OrdinalIgnoreCase);

        var lightHeads = new HashSet<string>(StringComparer.OrdinalIgnoreCase)
        {
            "key", "make", "take", "give", "get", "pay", "set", "hold",
            "have", "do", "go", "come", "put", "run", "keep", "leave",
            "read", "open", "book", "ask", "try", "meet", "find", "show", "use"
        };

        VocabWord? PickPreferredWord(List<VocabWord>? candidates, string setTitle)
        {
            if (candidates == null || candidates.Count == 0) return null;
            return candidates.FirstOrDefault(w => w.Topic != null && w.Topic.Title.Equals(setTitle, StringComparison.OrdinalIgnoreCase))
                ?? candidates[0];
        }

        VocabWord? FindLessonWordForPair(string left, string right, string setTitle)
        {
            var leftClean = (left ?? "").Trim();
            var rightClean = Regex.Replace((right ?? "").Trim(), "^(?:a|an|the|to|in|for|on|of|from)\\s+", "", RegexOptions.IgnoreCase).Trim();
            var orderedKeys = lightHeads.Contains(leftClean)
                ? new[] { rightClean, leftClean }
                : new[] { leftClean, rightClean };

            foreach (var key in orderedKeys)
            {
                if (!string.IsNullOrEmpty(key) && wordsByText.TryGetValue(key, out var list))
                {
                    var match = PickPreferredWord(list, setTitle);
                    if (match != null) return match;
                }
            }

            var fullPhrase = $"{leftClean} {(right ?? "").Trim()}".Trim();
            if (!string.IsNullOrEmpty(fullPhrase))
            {
                var collocationMatches = allWords
                    .Where(w => !string.IsNullOrEmpty(w.Collocations) && w.Collocations.Contains(fullPhrase, StringComparison.OrdinalIgnoreCase))
                    .ToList();
                var match = PickPreferredWord(collocationMatches, setTitle);
                if (match != null) return match;
            }

            return null;
        }

        var emptyDistractors = new List<QuizCandidate>();
        var rng = new Random();
        var wordLessons = new Dictionary<string, object>(StringComparer.OrdinalIgnoreCase);

        int userId = GetCurrentUserId();
        var progressList = new List<UserPhraseProgress>();
        if (userId > 0)
        {
            progressList = await _context.UserPhraseProgresses.AsNoTracking()
                .Where(p => p.UserId == userId)
                .ToListAsync();
        }

        var groups = pairs.GroupBy(p => p.TopicCategory.ToLower()).Select(g => new
        {
            category = g.Key,
            sets = g.GroupBy(p => string.IsNullOrEmpty(p.SetTitle) ? "General" : p.SetTitle).Select(sg =>
            {
                var prog = progressList.FirstOrDefault(p => p.TopicCategory == g.Key && p.SetTitle == sg.Key);
                var mappedPairs = sg.Select(p =>
                {
                    var matchedWord = FindLessonWordForPair(p.LeftWord, p.RightWord, sg.Key);
                    if (matchedWord != null)
                    {
                        var wordKey = matchedWord.Word.Trim().ToLowerInvariant();
                        if (!wordLessons.ContainsKey(wordKey))
                        {
                            wordLessons[wordKey] = MapLessonWordDto(matchedWord, emptyDistractors, rng, isLearned: false, isSaved: false);
                        }
                    }
                    return new object[]
                    {
                        p.LeftWord,
                        p.RightWord,
                        p.Meaning,
                        p.SentenceBefore ?? "",
                        p.SentenceAfter ?? "",
                        matchedWord?.Word ?? ""
                    };
                }).ToList();

                return new
                {
                    title = sg.Key,
                    topic = g.Key,
                    pairs = mappedPairs,
                    completedCount = prog?.CompletedPairsCount ?? 0,
                    isCompleted = prog?.IsCompleted ?? false
                };
            }).ToList()
        }).ToList();

        return Json(new { success = true, data = groups, words = wordLessons });
    }

    // ===== 4. API LẤY TỪ CẦN ÔN TẬP (SPACED REPETITION REVIEW) =====
    [HttpGet]
    public async Task<IActionResult> GetReviewWords()
    {
        int userId = GetCurrentUserId();

        var dueWords = await _context.UserVocabProgresses.AsNoTracking()
            .Where(p => p.UserId == userId && p.NextReviewDate.HasValue && p.NextReviewDate.Value <= DateTime.UtcNow)
            .Include(p => p.Word).ThenInclude(w => w!.Topic)
            .Select(p => p.Word)
            .Where(w => w != null && !w.IsDeleted && w.IsActive)
            .Take(30)
            .ToListAsync();

        if (dueWords.Count == 0)
        {
            dueWords = await _context.UserVocabProgresses.AsNoTracking()
                .Where(p => p.UserId == userId && (p.ReviewCount > 0 || p.Status == "Mastered" || p.Status == "Learning"))
                .Include(p => p.Word).ThenInclude(w => w!.Topic)
                .Select(p => p.Word)
                .Where(w => w != null && !w.IsDeleted && w.IsActive)
                .Take(20)
                .ToListAsync();
        }

        if (dueWords.Count == 0)
        {
            var fallbackWords = await _context.VocabWords.AsNoTracking()
                .Where(w => !w.IsDeleted && w.IsActive)
                .OrderBy(w => w.SortOrder).ThenBy(w => w.WordId)
                .Take(12)
                .Select(w => (VocabWord?)w)
                .ToListAsync();
            dueWords = fallbackWords;
        }

        var reviewList = dueWords.Where(w => w != null).Cast<VocabWord>().ToList();
        var distractorPool = await _context.VocabWords.AsNoTracking()
            .Where(w => !w.IsDeleted && w.IsActive && !string.IsNullOrWhiteSpace(w.Meaning))
            .Select(w => new QuizCandidate(w.WordId, w.TopicId, w.Word, w.PartOfSpeech, w.Meaning, w.Synonyms))
            .ToListAsync();

        var rng = new Random();
        var mapped = reviewList
            .Select(w => MapLessonWordDto(w, distractorPool, rng, isLearned: true, isSaved: false))
            .ToList();

        return Json(new { success = true, data = mapped });
    }

    // ===== 5. API LẤY SỔ TAY TỪ VỰNG (BOOKMARKED WORDS) =====
    [HttpGet]
    public async Task<IActionResult> GetNotebookWords()
    {
        int userId = GetCurrentUserId();

        var rawNotebook = await _context.UserVocabProgresses.AsNoTracking()
            .Where(p => p.UserId == userId && p.IsBookmarked && p.Word != null && !p.Word.IsDeleted && p.Word.IsActive)
            .Include(p => p.Word).ThenInclude(w => w!.Topic)
            .OrderByDescending(p => p.UpdatedAt ?? p.CreatedAt)
            .Select(p => new
            {
                p.Word!.WordId,
                p.Word.Word,
                p.Word.PartOfSpeech,
                p.Word.Meaning,
                p.Word.PhoneticUs,
                p.Word.PhoneticUk,
                p.Word.EnglishDefinition,
                TopicTitle = p.Word.Topic != null ? p.Word.Topic.Title : "Vocabulary",
                p.Word.ExampleSentence,
                p.Word.ExampleMeaning,
                p.Word.Collocations
            })
            .ToListAsync();

        var bookmarkedWords = rawNotebook.Select(w =>
        {
            var examples = ParseExamplesList(w.ExampleSentence, w.ExampleMeaning, w.Word, w.PartOfSpeech, w.Meaning);
            return new
            {
                wordId = w.WordId,
                word = w.Word,
                type = (w.PartOfSpeech ?? "noun").ToUpper(),
                meaning = w.Meaning,
                us = w.PhoneticUs ?? "",
                uk = w.PhoneticUk ?? "",
                definition = w.EnglishDefinition ?? "",
                topicTitle = w.TopicTitle,
                example = examples.Count > 0 ? examples[0][0] : "",
                exampleMeaning = examples.Count > 0 ? examples[0][1] : "",
                examples,
                collocations = ParseCollocationList(w.Collocations)
            };
        }).ToList();

        return Json(new { success = true, data = bookmarkedWords });
    }

    // ===== 6. API LƯU SỔ TAY TỪ VỰNG (BOOKMARK) =====
    [HttpPost]
    public async Task<IActionResult> ToggleBookmark([FromBody] VocabBookmarkRequest model)
    {
        int userId = GetCurrentUserId();
        if (userId <= 0) return Unauthorized();

        var word = await _context.VocabWords.FirstOrDefaultAsync(w =>
            (model.WordId > 0 && w.WordId == model.WordId) ||
            (!string.IsNullOrEmpty(model.Word) && w.Word.ToLower() == model.Word.Trim().ToLower()));

        if (word == null) return NotFound(new { success = false, message = "Không tìm thấy từ vựng." });

        var progress = await _context.UserVocabProgresses
            .FirstOrDefaultAsync(p => p.UserId == userId && p.WordId == word.WordId);

        if (progress == null)
        {
            progress = new UserVocabProgress
            {
                UserId = userId,
                WordId = word.WordId,
                Status = "Learning",
                IsBookmarked = true,
                CreatedAt = DateTime.UtcNow
            };
            _context.UserVocabProgresses.Add(progress);
        }
        else
        {
            progress.IsBookmarked = !progress.IsBookmarked;
            progress.UpdatedAt = DateTime.UtcNow;
        }

        await _context.SaveChangesAsync();

        int totalBookmarked = await _context.UserVocabProgresses.AsNoTracking()
            .CountAsync(p => p.UserId == userId && p.IsBookmarked);

        return Json(new
        {
            success = true,
            isBookmarked = progress.IsBookmarked,
            notebookCount = totalBookmarked,
            message = progress.IsBookmarked ? "Đã lưu vào Sổ tay từ vựng" : "Đã bỏ lưu khỏi Sổ tay"
        });
    }

    // ===== 7. API CẬP NHẬT TIẾN ĐỘ HỌC (SPACED REPETITION & QUIZ) =====
    [HttpPost]
    public async Task<IActionResult> UpdateProgress([FromBody] VocabProgressUpdateRequest model)
    {
        int userId = GetCurrentUserId();
        if (userId <= 0) return Unauthorized();

        var word = await _context.VocabWords.FirstOrDefaultAsync(w =>
            (model.WordId > 0 && w.WordId == model.WordId) ||
            (!string.IsNullOrEmpty(model.Word) && w.Word.ToLower() == model.Word.Trim().ToLower()));

        if (word == null) return NotFound(new { success = false, message = "Không tìm thấy từ." });

        var progress = await _context.UserVocabProgresses
            .FirstOrDefaultAsync(p => p.UserId == userId && p.WordId == word.WordId);

        if (progress == null)
        {
            progress = new UserVocabProgress
            {
                UserId = userId,
                WordId = word.WordId,
                Status = model.IsCorrect ? "Mastered" : "Learning",
                RepetitionLevel = model.IsCorrect ? 1 : 0,
                ReviewCount = 1,
                CorrectCount = model.IsCorrect ? 1 : 0,
                AgainCount = (model.IsAgain || !model.IsCorrect) ? 1 : 0,
                TypingFailCount = Math.Max(0, model.TypingFails),
                LastReviewedDate = DateTime.UtcNow,
                NextReviewDate = DateTime.UtcNow.AddDays(model.IsCorrect ? 3 : 1),
                CreatedAt = DateTime.UtcNow
            };
            _context.UserVocabProgresses.Add(progress);
        }
        else
        {
            progress.ReviewCount++;
            if (model.IsAgain || !model.IsCorrect)
            {
                progress.AgainCount++;
            }
            if (model.TypingFails > 0)
            {
                progress.TypingFailCount += model.TypingFails;
            }
            if (model.IsCorrect)
            {
                progress.CorrectCount++;
                progress.RepetitionLevel = Math.Min(5, progress.RepetitionLevel + 1);
                progress.Status = progress.RepetitionLevel >= 3 ? "Mastered" : "Learning";
                int days = progress.RepetitionLevel switch
                {
                    1 => 1,
                    2 => 3,
                    3 => 7,
                    4 => 14,
                    _ => 30
                };
                progress.NextReviewDate = DateTime.UtcNow.AddDays(days);
            }
            else
            {
                progress.RepetitionLevel = Math.Max(0, progress.RepetitionLevel - 1);
                progress.Status = "Learning";
                progress.NextReviewDate = DateTime.UtcNow.AddDays(1);
            }
            progress.LastReviewedDate = DateTime.UtcNow;
            progress.UpdatedAt = DateTime.UtcNow;
        }

        await _context.SaveChangesAsync();

        return Json(new
        {
            success = true,
            status = progress.Status,
            repetitionLevel = progress.RepetitionLevel,
            nextReview = progress.NextReviewDate?.ToString("dd/MM/yyyy")
        });
    }

    // ===== 8. API LƯU TIẾN ĐỘ GHÉP CỤM TỪ (PHRASE PROGRESS) =====
    [HttpPost]
    public async Task<IActionResult> SavePhraseProgress([FromBody] PhraseProgressRequest model)
    {
        int userId = GetCurrentUserId();
        if (userId <= 0) return Unauthorized();

        var existing = await _context.UserPhraseProgresses
            .FirstOrDefaultAsync(p => p.UserId == userId && p.TopicCategory == model.TopicCategory && p.SetTitle == model.SetTitle);

        if (existing == null)
        {
            existing = new UserPhraseProgress
            {
                UserId = userId,
                TopicCategory = model.TopicCategory.Trim().ToLower(),
                SetTitle = model.SetTitle.Trim(),
                CompletedPairsCount = model.CompletedCount,
                TotalPairsCount = model.TotalCount,
                IsCompleted = model.CompletedCount >= model.TotalCount,
                UpdatedAt = DateTime.UtcNow
            };
            _context.UserPhraseProgresses.Add(existing);
        }
        else
        {
            existing.CompletedPairsCount = Math.Max(existing.CompletedPairsCount, model.CompletedCount);
            existing.TotalPairsCount = model.TotalCount;
            existing.IsCompleted = existing.CompletedPairsCount >= existing.TotalPairsCount;
            existing.UpdatedAt = DateTime.UtcNow;
        }

        await _context.SaveChangesAsync();
        return Json(new { success = true });
    }

    // ===== 9. API PHÁT ÂM CHUẨN TỰ NHIÊN EDGE-TTS (MIỄN PHÍ 100%, US / UK) =====
    [HttpGet]
    [AllowAnonymous]
    [ResponseCache(Duration = 86400, Location = ResponseCacheLocation.Client)]
    public async Task<IActionResult> AudioStream(string? text, string? accent = "us", string? voice = null, CancellationToken cancellationToken = default)
    {
        var clean = (text ?? string.Empty).Trim();
        if (string.IsNullOrWhiteSpace(clean)) return BadRequest("Text is required");
        if (clean.Length > 500) clean = clean[..500];

        var selectedVoice = !string.IsNullOrWhiteSpace(voice)
            ? voice.Trim()
            : string.Equals(accent, "uk", StringComparison.OrdinalIgnoreCase)
                ? "en-GB-SoniaNeural"
                : "en-US-JennyNeural";

        var bytes = await _edgeTts.SynthesizeAsync(clean, selectedVoice, cancellationToken: cancellationToken);
        if (bytes == null || bytes.Length == 0)
        {
            return NotFound("Audio synthesis failed");
        }

        return File(bytes, "audio/mpeg", enableRangeProcessing: true);
    }

    private int GetCurrentUserId()
    {
        var idStr = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (int.TryParse(idStr, out int id) && id > 0) return id;

        var student = _context.Users.AsNoTracking().FirstOrDefault(u => u.Role != null && u.Role.RoleName == "Student")
            ?? _context.Users.AsNoTracking().FirstOrDefault();
        return student?.UserId ?? 1;
    }

    private sealed record QuizCandidate(
        int WordId,
        int TopicId,
        string Word,
        string? PartOfSpeech,
        string Meaning,
        string? Synonyms);

    private static string NormalizePhrase(string? text)
    {
        if (string.IsNullOrWhiteSpace(text)) return string.Empty;
        return Regex.Replace(text.Trim().ToLowerInvariant(), @"\s+", " ");
    }

    private static string NormalizePartOfSpeech(string? pos)
    {
        var p = NormalizePhrase(pos);
        if (string.IsNullOrEmpty(p)) return "noun";
        if (p.Contains("phrasal")) return "phrasal verb";
        if (p.Contains("noun")) return "noun";
        if (p.Contains("verb")) return "verb";
        if (p.Contains("adj")) return "adjective";
        if (p.Contains("adv")) return "adverb";
        if (p.Contains("prep")) return "preposition";
        return p;
    }

    private static HashSet<string> SplitTermTokens(string? raw)
    {
        var set = new HashSet<string>(StringComparer.OrdinalIgnoreCase);
        if (string.IsNullOrWhiteSpace(raw)) return set;
        foreach (var part in raw.Split(new[] { ',', ';', '|', '\n', '\r' }, StringSplitOptions.RemoveEmptyEntries))
        {
            var norm = NormalizePhrase(part);
            if (!string.IsNullOrEmpty(norm)) set.Add(norm);
        }
        return set;
    }

    private static List<string> SplitMeaningClauses(string? meaning)
    {
        var list = new List<string>();
        if (string.IsNullOrWhiteSpace(meaning)) return list;
        foreach (var part in meaning.Split(new[] { ',', ';', '/', '(', ')' }, StringSplitOptions.RemoveEmptyEntries))
        {
            var norm = NormalizePhrase(part);
            if (!string.IsNullOrEmpty(norm)) list.Add(norm);
        }
        return list;
    }

    private static bool IsSemanticallyConflicting(VocabWord target, QuizCandidate candidate)
    {
        if (candidate.WordId == target.WordId) return true;

        var targetMeaning = NormalizePhrase(target.Meaning);
        var candMeaning = NormalizePhrase(candidate.Meaning);
        if (string.IsNullOrEmpty(candMeaning)) return true;
        if (string.Equals(targetMeaning, candMeaning, StringComparison.Ordinal)) return true;

        var targetWord = NormalizePhrase(target.Word);
        var candWord = NormalizePhrase(candidate.Word);
        if (string.Equals(targetWord, candWord, StringComparison.Ordinal)) return true;

        // Lọc bỏ các cặp đồng nghĩa đã khai báo chéo nhau
        var targetSyns = SplitTermTokens(target.Synonyms);
        var candSyns = SplitTermTokens(candidate.Synonyms);
        if (targetSyns.Contains(candWord) || candSyns.Contains(targetWord)) return true;
        if (targetSyns.Count > 0 && candSyns.Count > 0 && targetSyns.Overlaps(candSyns)) return true;

        // Lọc bỏ nghĩa tiếng Việt trùng hoặc bao hàm nhau (vd: "sự bảo đảm" vs "sự cam đoan, sự bảo đảm")
        var targetClauses = SplitMeaningClauses(target.Meaning);
        var candClauses = SplitMeaningClauses(candidate.Meaning);
        foreach (var tc in targetClauses)
        {
            foreach (var cc in candClauses)
            {
                if (string.Equals(tc, cc, StringComparison.Ordinal)) return true;
                if (tc.Length >= 4 && cc.Length >= 4 && (tc.Contains(cc, StringComparison.Ordinal) || cc.Contains(tc, StringComparison.Ordinal)))
                {
                    return true;
                }
            }
        }

        return false;
    }

    private static (List<string> Options, int CorrectIndex) BuildQuizForWord(
        VocabWord target,
        IReadOnlyList<QuizCandidate> pool,
        Random rng)
    {
        var targetPos = NormalizePartOfSpeech(target.PartOfSpeech);
        var targetLen = (target.Meaning ?? string.Empty).Trim().Length;

        var validCandidates = pool
            .Where(c => !IsSemanticallyConflicting(target, c))
            .ToList();

        // 4 tầng ưu tiên: (1) cùng topic + cùng từ loại, (2) khác topic + cùng từ loại, (3) cùng topic, (4) phần còn lại
        var tiers = new[]
        {
            validCandidates.Where(c => c.TopicId == target.TopicId && NormalizePartOfSpeech(c.PartOfSpeech) == targetPos),
            validCandidates.Where(c => c.TopicId != target.TopicId && NormalizePartOfSpeech(c.PartOfSpeech) == targetPos),
            validCandidates.Where(c => c.TopicId == target.TopicId && NormalizePartOfSpeech(c.PartOfSpeech) != targetPos),
            validCandidates.Where(c => c.TopicId != target.TopicId && NormalizePartOfSpeech(c.PartOfSpeech) != targetPos)
        };

        var wrongOptions = new List<string>(3);
        var seenMeanings = new HashSet<string>(StringComparer.OrdinalIgnoreCase)
        {
            NormalizePhrase(target.Meaning)
        };

        // Nếu Admin bật Manual Override cho Quiz thì ưu tiên dùng tối đa 3 đáp án nhiễu chủ đích trước
        if (target.UseManualQuiz && !string.IsNullOrWhiteSpace(target.QuizDistractorsJson))
        {
            try
            {
                var customList = System.Text.Json.JsonSerializer.Deserialize<List<string>>(target.QuizDistractorsJson);
                if (customList != null)
                {
                    foreach (var raw in customList)
                    {
                        var trimmed = (raw ?? string.Empty).Trim();
                        if (string.IsNullOrEmpty(trimmed)) continue;
                        if (seenMeanings.Add(NormalizePhrase(trimmed)))
                        {
                            wrongOptions.Add(trimmed);
                            if (wrongOptions.Count >= 3) break;
                        }
                    }
                }
            }
            catch
            {
                // Bỏ qua nếu JSON cấu hình tay bị lỗi, tự động rơi về 4 tầng CSDL
            }
        }

        foreach (var tier in tiers)
        {
            if (wrongOptions.Count >= 3) break;
            // Ưu tiên độ dài nghĩa gần tương đương kết hợp ngẫu nhiên nhẹ để tránh lệch pha
            var ranked = tier
                .OrderBy(c => Math.Abs(c.Meaning.Trim().Length - targetLen) + rng.Next(0, 12))
                .ToList();

            foreach (var c in ranked)
            {
                var trimmedMeaning = c.Meaning.Trim();
                var norm = NormalizePhrase(trimmedMeaning);
                if (seenMeanings.Add(norm))
                {
                    wrongOptions.Add(trimmedMeaning);
                    if (wrongOptions.Count >= 3) break;
                }
            }
        }

        while (wrongOptions.Count < 3)
        {
            wrongOptions.Add("Ý nghĩa khác");
        }

        int correctIndex = rng.Next(4);
        var options = new List<string>(wrongOptions);
        options.Insert(correctIndex, target.Meaning ?? string.Empty);
        return (options, correctIndex);
    }

    private static (string Before, string After, string Answer) BuildTypingForWord(VocabWord w)
    {
        string firstSentence = string.Empty;
        if (!string.IsNullOrWhiteSpace(w.SensesJson))
        {
            try
            {
                var parsed = System.Text.Json.JsonSerializer.Deserialize<List<StudyEnglish.Models.Vocabulary.VocabWordSense>>(
                    w.SensesJson,
                    new System.Text.Json.JsonSerializerOptions { PropertyNameCaseInsensitive = true });
                var firstEx = parsed?.FirstOrDefault(s => s.Examples != null && s.Examples.Count > 0)?.Examples?.FirstOrDefault(e => !string.IsNullOrWhiteSpace(e.En))?.En;
                if (!string.IsNullOrWhiteSpace(firstEx))
                {
                    firstSentence = firstEx.Trim();
                }
            }
            catch { }
        }

        if (string.IsNullOrEmpty(firstSentence))
        {
            var rawSentences = (w.ExampleSentence ?? string.Empty)
                .Split(new[] { "\r\n", "\r", "\n", "|||" }, StringSplitOptions.RemoveEmptyEntries);
            firstSentence = rawSentences.Length > 0 ? rawSentences[0].Trim() : string.Empty;
        }

        if (string.IsNullOrEmpty(firstSentence))
        {
            return (string.Empty, string.Empty, w.Word);
        }

        // Quy ước CMS: bọc từ cần điền (kể cả chia thì/số nhiều) trong ngoặc vuông [word]
        var bracketMatch = Regex.Match(firstSentence, @"\[([^\[\]]+)\]");
        if (bracketMatch.Success)
        {
            var innerWord = bracketMatch.Groups[1].Value.Trim();
            if (!string.IsNullOrEmpty(innerWord))
            {
                var before = firstSentence.Substring(0, bracketMatch.Index).TrimEnd();
                var after = firstSentence.Substring(bracketMatch.Index + bracketMatch.Length).TrimStart();
                return (before, after, innerWord);
            }
        }

        // Fallback theo ranh giới từ nguyên gốc trước, rồi mới tới substring
        var escapedWord = Regex.Escape(w.Word);
        var wordBoundaryMatch = Regex.Match(firstSentence, $@"\b{escapedWord}\b", RegexOptions.IgnoreCase);
        if (wordBoundaryMatch.Success)
        {
            var before = firstSentence.Substring(0, wordBoundaryMatch.Index).TrimEnd();
            var after = firstSentence.Substring(wordBoundaryMatch.Index + wordBoundaryMatch.Length).TrimStart();
            return (before, after, wordBoundaryMatch.Value);
        }

        var idx = firstSentence.IndexOf(w.Word, StringComparison.OrdinalIgnoreCase);
        if (idx >= 0)
        {
            var before = firstSentence.Substring(0, idx).TrimEnd();
            var after = firstSentence.Substring(idx + w.Word.Length).TrimStart();
            return (before, after, firstSentence.Substring(idx, w.Word.Length));
        }

        return ("Please learn how to use", "in context.", w.Word);
    }

    private static object MapLessonWordDto(
        VocabWord w,
        IReadOnlyList<QuizCandidate> distractorPool,
        Random rng,
        bool isLearned,
        bool isSaved)
    {
        var (options, correctIndex) = BuildQuizForWord(w, distractorPool, rng);
        var (sentenceBefore, sentenceAfter, typingAnswer) = BuildTypingForWord(w);

        var examplesList = ParseExamplesList(w.ExampleSentence, w.ExampleMeaning, w.Word, w.PartOfSpeech, w.Meaning);

        // Parse SensesJson if present
        var sensesList = new List<object>();
        string primaryMeaning = w.Meaning;
        string primaryDefinition = w.EnglishDefinition ?? "";
        string primaryType = (w.PartOfSpeech ?? "noun").ToUpper();
        string? primaryCollocations = w.Collocations;
        string? primarySynonyms = w.Synonyms;
        string? primaryAntonyms = w.Antonyms;

        if (!string.IsNullOrWhiteSpace(w.SensesJson))
        {
            try
            {
                var parsedSenses = System.Text.Json.JsonSerializer.Deserialize<List<StudyEnglish.Models.Vocabulary.VocabWordSense>>(
                    w.SensesJson,
                    new System.Text.Json.JsonSerializerOptions { PropertyNameCaseInsensitive = true });

                if (parsedSenses != null && parsedSenses.Count > 0)
                {
                    var p1 = parsedSenses[0];
                    if (!string.IsNullOrWhiteSpace(p1.Meaning)) primaryMeaning = p1.Meaning;
                    if (!string.IsNullOrWhiteSpace(p1.EnglishDefinition)) primaryDefinition = p1.EnglishDefinition;
                    if (!string.IsNullOrWhiteSpace(p1.PartOfSpeech)) primaryType = p1.PartOfSpeech.ToUpper();
                    if (!string.IsNullOrWhiteSpace(p1.Collocations)) primaryCollocations = p1.Collocations;
                    if (!string.IsNullOrWhiteSpace(p1.Synonyms)) primarySynonyms = p1.Synonyms;
                    if (!string.IsNullOrWhiteSpace(p1.Antonyms)) primaryAntonyms = p1.Antonyms;

                    // Ưu tiên ví dụ của nét nghĩa 1 nếu có
                    if (p1.Examples != null && p1.Examples.Count > 0)
                    {
                        var validEx = p1.Examples.Where(e => !string.IsNullOrWhiteSpace(e.En)).ToList();
                        if (validEx.Count > 0)
                        {
                            examplesList = validEx.Select(e => new string[] { e.En ?? "", e.Vi ?? "" }).ToList();
                        }
                    }

                    foreach (var s in parsedSenses)
                    {
                        var sExamples = (s.Examples != null && s.Examples.Count > 0)
                            ? s.Examples.Select(e => new object[] { e.En ?? "", e.Vi ?? "" }).ToList()
                            : new List<object[]>();

                        sensesList.Add(new
                        {
                            type = (s.PartOfSpeech ?? w.PartOfSpeech ?? "noun").ToUpper(),
                            meaning = s.Meaning ?? "",
                            definition = s.EnglishDefinition ?? "",
                            examples = sExamples,
                            collocations = ParseCollocationList(s.Collocations),
                            synonyms = !string.IsNullOrEmpty(s.Synonyms)
                                ? s.Synonyms.Split(new[] { ',', ';' }, StringSplitOptions.RemoveEmptyEntries).Select(x => x.Trim()).ToList()
                                : new List<string>(),
                            antonyms = !string.IsNullOrEmpty(s.Antonyms)
                                ? s.Antonyms.Split(new[] { ',', ';' }, StringSplitOptions.RemoveEmptyEntries).Select(x => x.Trim()).ToList()
                                : new List<string>()
                        });
                    }
                }
            }
            catch
            {
                // Fallback nếu JSON lỗi
            }
        }

        if (sensesList.Count == 0)
        {
            sensesList.Add(new
            {
                type = primaryType,
                meaning = primaryMeaning,
                definition = primaryDefinition,
                examples = examplesList,
                collocations = ParseCollocationList(primaryCollocations),
                synonyms = !string.IsNullOrEmpty(primarySynonyms)
                    ? primarySynonyms.Split(new[] { ',', ';' }, StringSplitOptions.RemoveEmptyEntries).Select(x => x.Trim()).ToList()
                    : new List<string>(),
                antonyms = !string.IsNullOrEmpty(primaryAntonyms)
                    ? primaryAntonyms.Split(new[] { ',', ';' }, StringSplitOptions.RemoveEmptyEntries).Select(x => x.Trim()).ToList()
                    : new List<string>()
            });
        }

        return new
        {
            wordId = w.WordId,
            word = w.Word,
            type = primaryType,
            meaning = primaryMeaning,
            us = w.PhoneticUs ?? "",
            uk = w.PhoneticUk ?? "",
            definition = primaryDefinition,
            audio = w.AudioUrl ?? "",
            imageUrl = w.ImageUrl ?? "",
            learned = isLearned,
            isBookmarked = isSaved,
            examples = examplesList,
            senses = sensesList,
            collocations = ParseCollocationList(primaryCollocations),
            synonyms = !string.IsNullOrEmpty(primarySynonyms)
                ? primarySynonyms.Split(new[] { ',', ';' }, StringSplitOptions.RemoveEmptyEntries).Select(s => s.Trim()).ToList()
                : new List<string>(),
            antonyms = !string.IsNullOrEmpty(primaryAntonyms)
                ? primaryAntonyms.Split(new[] { ',', ';' }, StringSplitOptions.RemoveEmptyEntries).Select(s => s.Trim()).ToList()
                : new List<string>(),
            family = !string.IsNullOrEmpty(w.WordFamily)
                ? w.WordFamily.Split(new[] { ';', '\n' }, StringSplitOptions.RemoveEmptyEntries).Select(s => s.Trim()).ToList()
                : new List<string>(),
            tip = w.MemoryTip ?? "",
            mistake = !string.IsNullOrEmpty(w.CommonMistakeWrong)
                ? new string[] { w.CommonMistakeWrong, w.CommonMistakeRight ?? "", w.CommonMistakeNote ?? "" }
                : new string[] { "", "", "" },
            tags = new string[] { "#toeic", "#vocabulary" },
            quiz = new
            {
                options,
                correctIndex
            },
            typing = new
            {
                before = sentenceBefore,
                after = sentenceAfter,
                answer = typingAnswer,
                translation = w.ExampleMeaning ?? ""
            }
        };
    }

    private static List<string> ParseCollocationList(string? raw)
    {
        if (string.IsNullOrWhiteSpace(raw)) return new List<string>();
        if (raw.Contains(';') || raw.Contains('\n') || raw.Contains('|'))
        {
            return raw.Split(new[] { ';', '\n', '|' }, StringSplitOptions.RemoveEmptyEntries)
                .Select(s => s.Trim())
                .Where(s => !string.IsNullOrWhiteSpace(s))
                .ToList();
        }
        if (raw.Contains(" — "))
        {
            return new List<string> { raw.Trim() };
        }
        return raw.Split(',', StringSplitOptions.RemoveEmptyEntries)
            .Select(s => s.Trim())
            .Where(s => !string.IsNullOrWhiteSpace(s))
            .ToList();
    }

    private static List<string[]> ParseExamplesList(
        string? rawSentence,
        string? rawMeaning,
        string word,
        string? partOfSpeech,
        string? meaning)
    {
        var exSentences = (rawSentence ?? string.Empty)
            .Split(new[] { "\r\n", "\r", "\n", "|||" }, StringSplitOptions.RemoveEmptyEntries);
        var exMeanings = (rawMeaning ?? string.Empty)
            .Split(new[] { "\r\n", "\r", "\n", "|||" }, StringSplitOptions.None);

        var examplesList = new List<string[]>();
        var seen = new HashSet<string>(StringComparer.OrdinalIgnoreCase);

        for (int i = 0; i < exSentences.Length; i++)
        {
            var cleanSentence = Regex.Replace(exSentences[i].Trim(), @"\[([^\[\]]+)\]", "$1");
            if (string.IsNullOrWhiteSpace(cleanSentence) || !seen.Add(cleanSentence)) continue;
            var m = i < exMeanings.Length ? exMeanings[i].Trim() : string.Empty;
            examplesList.Add(new[] { cleanSentence, m });
        }

        if (examplesList.Count < 2 && !string.IsNullOrWhiteSpace(word))
        {
            foreach (var fallback in VocabAiSuggestionService.BuildFallbackExtraExamplePool(word.Trim(), partOfSpeech, meaning))
            {
                if (examplesList.Count >= 2) break;
                if (seen.Add(fallback.En))
                {
                    examplesList.Add(new[] { fallback.En, fallback.FallbackVi });
                }
            }
        }

        return examplesList;
    }
}

public class VocabBookmarkRequest
{
    public int WordId { get; set; }
    public string? Word { get; set; }
}

public class VocabProgressUpdateRequest
{
    public int WordId { get; set; }
    public string? Word { get; set; }
    public bool IsCorrect { get; set; }
    public bool IsAgain { get; set; }
    public int TypingFails { get; set; }
}

public class PhraseProgressRequest
{
    public string TopicCategory { get; set; } = string.Empty;
    public string SetTitle { get; set; } = string.Empty;
    public int CompletedCount { get; set; }
    public int TotalCount { get; set; }
}
