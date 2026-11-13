using System.Text;
using System.Text.Json;
using System.Text.RegularExpressions;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using StudyEnglish.Data;
using StudyEnglish.Models.ViewModels.Admin;
using StudyEnglish.Models.Vocabulary;
using StudyEnglish.Services;

namespace StudyEnglish.Areas.Admin.Controllers;

[Area("Admin")]
[Authorize(Roles = "Admin")]
public sealed class Vocabulary_managementController : Controller
{
    private readonly AppDbContext _context;
    private readonly IWebHostEnvironment _env;
    private readonly VocabAiSuggestionService _aiService;
    private readonly IEdgeTtsService _edgeTts;
    private static readonly HttpClient _httpClient = new() { Timeout = TimeSpan.FromSeconds(6) };
    private static bool _vocabSchemaEnsured;

    public Vocabulary_managementController(AppDbContext context, IWebHostEnvironment env, VocabAiSuggestionService aiService, IEdgeTtsService edgeTts)
    {
        _context = context;
        _env = env;
        _aiService = aiService;
        _edgeTts = edgeTts;
    }

    private async Task EnsureVocabSchemaColumnsAsync()
    {
        if (_vocabSchemaEnsured) return;
        try
        {
            const string ddl = @"
                IF OBJECT_ID(N'[dbo].[VocabWords]', N'U') IS NOT NULL
                BEGIN
                    IF COL_LENGTH(N'dbo.VocabWords', N'QuizDistractorsJson') IS NULL
                        ALTER TABLE [dbo].[VocabWords] ADD [QuizDistractorsJson] NVARCHAR(1000) NULL;
                    IF COL_LENGTH(N'dbo.VocabWords', N'UseManualQuiz') IS NULL
                        ALTER TABLE [dbo].[VocabWords] ADD [UseManualQuiz] BIT NOT NULL DEFAULT 0;
                    IF COL_LENGTH(N'dbo.VocabWords', N'SensesJson') IS NULL
                        ALTER TABLE [dbo].[VocabWords] ADD [SensesJson] NVARCHAR(MAX) NULL;
                END
                IF OBJECT_ID(N'[dbo].[UserVocabProgresses]', N'U') IS NOT NULL
                BEGIN
                    IF COL_LENGTH(N'dbo.UserVocabProgresses', N'AgainCount') IS NULL
                        ALTER TABLE [dbo].[UserVocabProgresses] ADD [AgainCount] INT NOT NULL DEFAULT 0;
                    IF COL_LENGTH(N'dbo.UserVocabProgresses', N'TypingFailCount') IS NULL
                        ALTER TABLE [dbo].[UserVocabProgresses] ADD [TypingFailCount] INT NOT NULL DEFAULT 0;
                END";
            await _context.Database.ExecuteSqlRawAsync(ddl);
            _vocabSchemaEnsured = true;
        }
        catch
        {
            // Bỏ qua nếu không có quyền DDL runtime (đã chạy lúc startup trong Program.cs)
        }
    }

    // ===== 1. TRANG CHÍNH / BẢNG ĐIỀU KHIỂN QUẢN LÝ TỪ VỰNG =====
    [HttpGet]
    public async Task<IActionResult> Index(
        int? categoryId,
        int? topicId,
        string? q,
        string? level,
        string? pos,
        string? phraseCategory,
        int page = 1,
        string tab = "words")
    {
        if (page < 1) page = 1;
        int pageSize = 15;

        await EnsureVocabSchemaColumnsAsync();

        // Thống kê nhanh
        var totalCats = await _context.VocabCategories.CountAsync(c => !c.IsDeleted);
        var totalTopics = await _context.VocabTopics.CountAsync(t => !t.IsDeleted);
        var totalWords = await _context.VocabWords.CountAsync(w => !w.IsDeleted);
        var activeWords = await _context.VocabWords.CountAsync(w => !w.IsDeleted && w.IsActive);
        var inactiveWords = totalWords - activeWords;
        var totalPhrases = await _context.VocabPhrasePairs.CountAsync(p => !p.IsDeleted);

        var allPhrasePairs = await _context.VocabPhrasePairs.AsNoTracking()
            .Where(p => !p.IsDeleted)
            .Select(p => new { TopicCategory = p.TopicCategory.ToLower(), SetTitle = (p.SetTitle ?? "General").Trim().ToLower() })
            .ToListAsync();

        var phraseCountByCat = allPhrasePairs
            .GroupBy(p => p.TopicCategory)
            .ToDictionary(g => g.Key, g => g.Count());

        var phraseCountByCatSet = allPhrasePairs
            .GroupBy(p => (p.TopicCategory, p.SetTitle))
            .ToDictionary(g => g.Key, g => g.Count());

        // Lấy danh sách Danh mục
        var categories = await _context.VocabCategories.AsNoTracking()
            .Where(c => !c.IsDeleted)
            .OrderBy(c => c.SortOrder).ThenBy(c => c.CategoryId)
            .Select(c => new VocabCategoryRow
            {
                CategoryId = c.CategoryId,
                Name = c.Name,
                Code = c.Code,
                Description = c.Description,
                Icon = c.Icon,
                Color = c.Color,
                SortOrder = c.SortOrder,
                IsActive = c.IsActive,
                TopicCount = c.Topics.Count(t => !t.IsDeleted),
                WordCount = c.Topics.Where(t => !t.IsDeleted).SelectMany(t => t.Words).Count(w => !w.IsDeleted)
            })
            .ToListAsync();

        foreach (var cat in categories)
        {
            var codeKey = (cat.Code ?? string.Empty).Trim().ToLower();
            cat.PhraseCount = phraseCountByCat.TryGetValue(codeKey, out var pc) ? pc : 0;
        }

        // Lấy danh sách Bộ từ (Topics)
        var topicsQuery = _context.VocabTopics.AsNoTracking()
            .Include(t => t.Category)
            .Where(t => !t.IsDeleted);

        if (categoryId.HasValue)
        {
            topicsQuery = topicsQuery.Where(t => t.CategoryId == categoryId.Value);
        }

        var rawTopics = await topicsQuery
            .OrderBy(t => t.SortOrder).ThenBy(t => t.TopicId)
            .Select(t => new
            {
                Row = new VocabTopicRow
                {
                    TopicId = t.TopicId,
                    CategoryId = t.CategoryId,
                    CategoryName = t.Category != null ? t.Category.Name : "Chưa phân loại",
                    CategoryColor = t.Category != null ? t.Category.Color : "slate",
                    Color = t.Color,
                    Title = t.Title,
                    Code = t.Code,
                    Description = t.Description,
                    Level = t.Level,
                    Icon = t.Icon,
                    ImageUrl = t.ImageUrl,
                    SortOrder = t.SortOrder,
                    IsActive = t.IsActive,
                    WordCount = t.Words.Count(w => !w.IsDeleted)
                },
                CategoryCode = t.Category != null ? t.Category.Code : string.Empty
            })
            .ToListAsync();

        var topics = rawTopics.Select(x =>
        {
            var catKey = (x.CategoryCode ?? string.Empty).Trim().ToLower();
            var titleKey = (x.Row.Title ?? string.Empty).Trim().ToLower();
            x.Row.PhraseCount = phraseCountByCatSet.TryGetValue((catKey, titleKey), out var tpc) ? tpc : 0;
            return x.Row;
        }).ToList();

        // Lấy danh sách Từ vựng (Words) kèm bộ lọc và phân trang
        var wordsQuery = _context.VocabWords.AsNoTracking()
            .Include(w => w.Topic).ThenInclude(t => t!.Category)
            .Where(w => !w.IsDeleted);

        if (categoryId.HasValue)
        {
            wordsQuery = wordsQuery.Where(w => w.Topic != null && w.Topic.CategoryId == categoryId.Value);
        }

        if (topicId.HasValue)
        {
            wordsQuery = wordsQuery.Where(w => w.TopicId == topicId.Value);
        }

        if (!string.IsNullOrWhiteSpace(level))
        {
            wordsQuery = wordsQuery.Where(w => w.Topic != null && w.Topic.Level == level);
        }

        if (!string.IsNullOrWhiteSpace(pos))
        {
            wordsQuery = wordsQuery.Where(w => w.PartOfSpeech != null && w.PartOfSpeech.ToLower() == pos.ToLower());
        }

        if (!string.IsNullOrWhiteSpace(q))
        {
            var search = q.Trim().ToLower();
            wordsQuery = wordsQuery.Where(w =>
                w.Word.ToLower().Contains(search) ||
                w.Meaning.ToLower().Contains(search) ||
                (w.EnglishDefinition != null && w.EnglishDefinition.ToLower().Contains(search)) ||
                (w.Collocations != null && w.Collocations.ToLower().Contains(search)));
        }

        var totalFilteredWords = await wordsQuery.CountAsync();

        var words = await wordsQuery
            .OrderBy(w => w.TopicId)
            .ThenBy(w => w.SortOrder)
            .ThenBy(w => w.WordId)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .Select(w => new VocabWordRow
            {
                WordId = w.WordId,
                TopicId = w.TopicId,
                TopicTitle = w.Topic != null ? w.Topic.Title : "Chưa gắn bộ",
                CategoryName = (w.Topic != null && w.Topic.Category != null) ? w.Topic.Category.Name : "Chưa phân loại",
                Word = w.Word,
                PartOfSpeech = w.PartOfSpeech,
                PhoneticUs = w.PhoneticUs,
                PhoneticUk = w.PhoneticUk,
                Meaning = w.Meaning,
                EnglishDefinition = w.EnglishDefinition,
                ExampleSentence = w.ExampleSentence,
                ExampleMeaning = w.ExampleMeaning,
                Collocations = w.Collocations,
                Synonyms = w.Synonyms,
                Antonyms = w.Antonyms,
                WordFamily = w.WordFamily,
                MemoryTip = w.MemoryTip,
                CommonMistakeWrong = w.CommonMistakeWrong,
                CommonMistakeRight = w.CommonMistakeRight,
                CommonMistakeNote = w.CommonMistakeNote,
                QuizDistractorsJson = w.QuizDistractorsJson,
                UseManualQuiz = w.UseManualQuiz,
                AudioUrl = w.AudioUrl,
                ImageUrl = w.ImageUrl,
                SortOrder = w.SortOrder,
                IsActive = w.IsActive,
                CreatedAt = w.CreatedAt
            })
            .ToListAsync();

        // Lấy danh sách Ghép cụm từ (Phrases)
        var phrasesQuery = _context.VocabPhrasePairs.AsNoTracking().Where(p => !p.IsDeleted);
        if (!string.IsNullOrWhiteSpace(phraseCategory))
        {
            phrasesQuery = phrasesQuery.Where(p => p.TopicCategory == phraseCategory.ToLower());
        }
        var phrases = await phrasesQuery
            .OrderBy(p => p.TopicCategory).ThenBy(p => p.SortOrder).ThenBy(p => p.PairId)
            .Select(p => new VocabPhrasePairRow
            {
                PairId = p.PairId,
                TopicCategory = p.TopicCategory,
                SetTitle = p.SetTitle,
                LeftWord = p.LeftWord,
                RightWord = p.RightWord,
                Meaning = p.Meaning,
                SentenceBefore = p.SentenceBefore,
                SentenceAfter = p.SentenceAfter,
                SortOrder = p.SortOrder,
                IsActive = p.IsActive
            })
            .ToListAsync();

        // Lấy cấu hình tính năng học tập
        var allSettings = await _context.VocabSettings.AsNoTracking()
            .ToDictionaryAsync(s => s.SettingKey, s => s.SettingValue);

        var settingsVm = new VocabSystemSettingsViewModel
        {
            EnableFlashcards = !allSettings.TryGetValue("EnableFlashcards", out var ef) || ef.Equals("true", StringComparison.OrdinalIgnoreCase),
            EnablePhrases = !allSettings.TryGetValue("EnablePhrases", out var ep) || ep.Equals("true", StringComparison.OrdinalIgnoreCase),
            EnableReview = !allSettings.TryGetValue("EnableReview", out var er) || er.Equals("true", StringComparison.OrdinalIgnoreCase),
            EnableQuiz = !allSettings.TryGetValue("EnableQuiz", out var eq) || eq.Equals("true", StringComparison.OrdinalIgnoreCase),
            EnableNotebook = !allSettings.TryGetValue("EnableNotebook", out var en) || en.Equals("true", StringComparison.OrdinalIgnoreCase),
            EnableAutoAudio = !allSettings.TryGetValue("EnableAutoAudio", out var ea) || ea.Equals("true", StringComparison.OrdinalIgnoreCase),
            DailyNewWordsGoal = allSettings.TryGetValue("DailyNewWordsGoal", out var dg) && int.TryParse(dg, out int g) ? g : 10,
            QuizQuestionCount = allSettings.TryGetValue("QuizQuestionCount", out var qc) && int.TryParse(qc, out int qVal) ? qVal : 5,
            BannerNotice = allSettings.TryGetValue("BannerNotice", out var bn) ? bn : "Mỗi ngày 10 từ vựng - Bứt phá điểm số TOEIC và giao tiếp tự tin!"
        };

        // Lấy thống kê & phân tích học viên
        var totalStudents = await _context.UserVocabProgresses.Select(p => p.UserId).Distinct().CountAsync();
        var totalMastered = await _context.UserVocabProgresses.CountAsync(p => p.Status == "Mastered");
        var totalLearning = await _context.UserVocabProgresses.CountAsync(p => p.Status == "Learning");
        var totalDueReview = await _context.UserVocabProgresses.CountAsync(p => p.NextReviewDate <= DateTime.UtcNow);
        var totalBookmarks = await _context.UserVocabProgresses.CountAsync(p => p.IsBookmarked);

        var topBookmarked = await _context.UserVocabProgresses
            .Where(p => p.IsBookmarked)
            .GroupBy(p => p.WordId)
            .OrderByDescending(g => g.Count())
            .Take(5)
            .Select(g => new { WordId = g.Key, Count = g.Count() })
            .Join(_context.VocabWords, b => b.WordId, w => w.WordId, (b, w) => new TopWordStatItem
            {
                Word = w.Word,
                Meaning = w.Meaning,
                TopicTitle = w.Topic != null ? w.Topic.Title : "",
                Count = b.Count
            })
            .ToListAsync();

        var topDifficult = await _context.UserVocabProgresses
            .Where(p => p.ReviewCount > 0)
            .GroupBy(p => p.WordId)
            .Select(g => new
            {
                WordId = g.Key,
                TotalReviews = g.Sum(x => x.ReviewCount),
                TotalCorrect = g.Sum(x => x.CorrectCount)
            })
            .OrderByDescending(x => x.TotalReviews)
            .Take(5)
            .Join(_context.VocabWords, d => d.WordId, w => w.WordId, (d, w) => new TopWordStatItem
            {
                Word = w.Word,
                Meaning = w.Meaning,
                TopicTitle = w.Topic != null ? w.Topic.Title : "",
                Count = d.TotalReviews,
                AccuracyRate = d.TotalReviews > 0 ? Math.Round((double)d.TotalCorrect / d.TotalReviews * 100, 1) : 0
            })
            .ToListAsync();

        var topicStats = await _context.VocabTopics.AsNoTracking()
            .Where(t => !t.IsDeleted)
            .Select(t => new TopicProgressStatItem
            {
                TopicTitle = t.Title,
                CategoryName = t.Category != null ? t.Category.Name : "",
                TotalWords = t.Words.Count(w => !w.IsDeleted),
                TotalLearners = _context.UserVocabProgresses.Where(p => t.Words.Any(w => w.WordId == p.WordId)).Select(p => p.UserId).Distinct().Count(),
                TotalMasteredCount = _context.UserVocabProgresses.Count(p => t.Words.Any(w => w.WordId == p.WordId) && p.Status == "Mastered")
            })
            .Take(8)
            .ToListAsync();

        var analyticsVm = new VocabAnalyticsViewModel
        {
            TotalStudentsLearning = totalStudents,
            TotalWordsMastered = totalMastered,
            TotalWordsLearning = totalLearning,
            TotalWordsDueReview = totalDueReview,
            TotalBookmarks = totalBookmarks,
            TopBookmarkedWords = topBookmarked,
            TopDifficultWords = topDifficult,
            TopicProgressStats = topicStats
        };

        var vm = new VocabManagementViewModel
        {
            TotalCategories = totalCats,
            TotalTopics = totalTopics,
            TotalWords = totalWords,
            TotalPhrases = totalPhrases,
            ActiveWordsCount = activeWords,
            InactiveWordsCount = inactiveWords,

            SelectedCategoryId = categoryId,
            SelectedTopicId = topicId,
            SearchQuery = q,
            SelectedLevel = level,
            SelectedPos = pos,
            SelectedPhraseCategory = phraseCategory,
            ActiveTab = tab,

            Categories = categories,
            Topics = topics,
            Words = words,
            Phrases = phrases,
            Settings = settingsVm,
            Analytics = analyticsVm,

            PageIndex = page,
            PageSize = pageSize,
            TotalWordsCount = totalFilteredWords
        };

        return View(vm);
    }

    // ===== 2. TRANG KHO TỪ VỰNG CHI TIẾT (THEO BỘ TỪ: HỌC THẺ + GHÉP CỤM TỪ) =====
    [HttpGet]
    public async Task<IActionResult> Words(int topicId, string tab = "flashcards")
    {
        await EnsureVocabSchemaColumnsAsync();

        var topic = await _context.VocabTopics.AsNoTracking()
            .Include(t => t.Category)
            .Include(t => t.Words.Where(w => !w.IsDeleted))
            .FirstOrDefaultAsync(t => t.TopicId == topicId && !t.IsDeleted);

        if (topic is null)
        {
            TempData["Error"] = "Không tìm thấy bộ từ vựng yêu cầu.";
            return RedirectToAction(nameof(Index));
        }

        ViewData["Title"] = $"Từ vựng - {topic.Title}";

        var catCode = (topic.Category?.Code ?? string.Empty).Trim().ToLower();
        var phrasesQuery = _context.VocabPhrasePairs.AsNoTracking()
            .Where(p => !p.IsDeleted);

        if (!string.IsNullOrEmpty(catCode))
        {
            phrasesQuery = phrasesQuery.Where(p => p.TopicCategory.ToLower() == catCode);
        }
        else
        {
            var titleLower = topic.Title.Trim().ToLower();
            phrasesQuery = phrasesQuery.Where(p => (p.SetTitle ?? string.Empty).Trim().ToLower() == titleLower);
        }

        var rawPhrases = await phrasesQuery
            .OrderBy(p => p.SortOrder)
            .ThenBy(p => p.PairId)
            .Select(p => new VocabPhrasePairRow
            {
                PairId = p.PairId,
                TopicCategory = p.TopicCategory,
                SetTitle = p.SetTitle,
                LeftWord = p.LeftWord,
                RightWord = p.RightWord,
                Meaning = p.Meaning,
                SentenceBefore = p.SentenceBefore,
                SentenceAfter = p.SentenceAfter,
                SortOrder = p.SortOrder,
                IsActive = p.IsActive
            })
            .ToListAsync();

        var orderedPhrases = rawPhrases
            .OrderBy(p => string.Equals((p.SetTitle ?? string.Empty).Trim(), topic.Title.Trim(), StringComparison.OrdinalIgnoreCase) ? 0 : 1)
            .ThenBy(p => p.SortOrder)
            .ThenBy(p => p.PairId)
            .ToList();

        var categories = await _context.VocabCategories.AsNoTracking()
            .Where(c => !c.IsDeleted)
            .OrderBy(c => c.SortOrder).ThenBy(c => c.CategoryId)
            .Select(c => new VocabCategoryRow
            {
                CategoryId = c.CategoryId,
                Name = c.Name,
                Code = c.Code
            })
            .ToListAsync();

        var siblingTopics = await _context.VocabTopics.AsNoTracking()
            .Where(t => !t.IsDeleted && t.CategoryId == topic.CategoryId)
            .OrderBy(t => t.SortOrder).ThenBy(t => t.Title)
            .Select(t => t.Title)
            .ToListAsync();

        var model = new VocabTopicWordsViewModel
        {
            TopicId = topic.TopicId,
            CategoryId = topic.CategoryId,
            TopicTitle = topic.Title,
            CategoryTitle = topic.Category != null ? topic.Category.Name : "Chưa phân loại",
            CategoryCode = catCode,
            Level = topic.Level ?? "B1",
            Description = topic.Description,
            ActiveTab = string.Equals(tab, "phrases", StringComparison.OrdinalIgnoreCase) ? "phrases" : "flashcards",
            Categories = categories,
            CategoryTopics = siblingTopics,
            Phrases = orderedPhrases,
            Words = topic.Words
                .Where(w => !w.IsDeleted)
                .OrderBy(w => w.SortOrder)
                .ThenBy(w => w.WordId)
                .Select(w => new VocabWordRow
                {
                    WordId = w.WordId,
                    TopicId = w.TopicId,
                    TopicTitle = topic.Title,
                    CategoryName = topic.Category != null ? topic.Category.Name : "Chưa phân loại",
                    Word = w.Word,
                    PartOfSpeech = w.PartOfSpeech,
                    PhoneticUs = w.PhoneticUs,
                    PhoneticUk = w.PhoneticUk,
                    Meaning = w.Meaning,
                    EnglishDefinition = w.EnglishDefinition,
                    ExampleSentence = w.ExampleSentence,
                    ExampleMeaning = w.ExampleMeaning,
                    Collocations = w.Collocations,
                    Synonyms = w.Synonyms,
                    Antonyms = w.Antonyms,
                    WordFamily = w.WordFamily,
                    MemoryTip = w.MemoryTip,
                    CommonMistakeWrong = w.CommonMistakeWrong,
                    CommonMistakeRight = w.CommonMistakeRight,
                    CommonMistakeNote = w.CommonMistakeNote,
                    QuizDistractorsJson = w.QuizDistractorsJson,
                    UseManualQuiz = w.UseManualQuiz,
                    AudioUrl = w.AudioUrl,
                    ImageUrl = w.ImageUrl,
                    SortOrder = w.SortOrder,
                    IsActive = w.IsActive,
                    CreatedAt = w.CreatedAt
                }).ToList()
        };

        return View(model);
    }

    // ===== 3. QUẢN LÝ TỪ VỰNG (CRUD WORDS) =====

    [HttpGet]
    public async Task<IActionResult> GetWord(int id)
    {
        var word = await _context.VocabWords
            .AsNoTracking()
            .Include(w => w.Topic).ThenInclude(t => t!.Category)
            .FirstOrDefaultAsync(w => w.WordId == id && !w.IsDeleted);

        if (word == null) return NotFound(new { success = false, message = "Không tìm thấy từ vựng này." });

        return Json(new
        {
            success = true,
            data = new
            {
                word.WordId,
                word.TopicId,
                CategoryId = word.Topic?.CategoryId ?? 0,
                TopicTitle = word.Topic?.Title,
                CategoryName = word.Topic?.Category?.Name,
                word.Word,
                word.PartOfSpeech,
                word.PhoneticUs,
                word.PhoneticUk,
                word.Meaning,
                word.EnglishDefinition,
                word.AudioUrl,
                word.ImageUrl,
                word.ExampleSentence,
                word.ExampleMeaning,
                word.Collocations,
                word.Synonyms,
                word.Antonyms,
                word.WordFamily,
                word.MemoryTip,
                word.CommonMistakeWrong,
                word.CommonMistakeRight,
                word.CommonMistakeNote,
                word.QuizDistractorsJson,
                word.SensesJson,
                word.UseManualQuiz,
                word.SortOrder,
                word.IsActive
            }
        });
    }

    [HttpPost]
    [ValidateAntiForgeryToken]
    public async Task<IActionResult> SaveWord([FromBody] VocabWordInputModel model)
    {
        if (!ModelState.IsValid)
        {
            var errors = ModelState.Values.SelectMany(v => v.Errors).Select(e => e.ErrorMessage).ToList();
            return BadRequest(new { success = false, message = string.Join("; ", errors) });
        }

        // Kiểm tra TopicId hợp lệ
        var topicExists = await _context.VocabTopics.AnyAsync(t => t.TopicId == model.TopicId && !t.IsDeleted);
        if (!topicExists)
        {
            return BadRequest(new { success = false, message = "Chủ đề / Bộ từ được chọn không tồn tại." });
        }

        if (model.WordId == 0)
        {
            // Thêm mới
            var word = new VocabWord
            {
                TopicId = model.TopicId,
                Word = model.Word.Trim(),
                PartOfSpeech = model.PartOfSpeech?.Trim().ToLower(),
                PhoneticUs = model.PhoneticUs?.Trim(),
                PhoneticUk = model.PhoneticUk?.Trim(),
                Meaning = model.Meaning.Trim(),
                EnglishDefinition = model.EnglishDefinition?.Trim(),
                AudioUrl = model.AudioUrl?.Trim(),
                ImageUrl = model.ImageUrl?.Trim(),
                ExampleSentence = model.ExampleSentence?.Trim(),
                ExampleMeaning = model.ExampleMeaning?.Trim(),
                Collocations = model.Collocations?.Trim(),
                Synonyms = model.Synonyms?.Trim(),
                Antonyms = model.Antonyms?.Trim(),
                WordFamily = model.WordFamily?.Trim(),
                MemoryTip = model.MemoryTip?.Trim(),
                CommonMistakeWrong = model.CommonMistakeWrong?.Trim(),
                CommonMistakeRight = model.CommonMistakeRight?.Trim(),
                CommonMistakeNote = model.CommonMistakeNote?.Trim(),
                QuizDistractorsJson = model.QuizDistractorsJson?.Trim(),
                SensesJson = model.SensesJson?.Trim(),
                UseManualQuiz = model.UseManualQuiz,
                SortOrder = model.SortOrder,
                IsActive = model.IsActive,
                CreatedAt = DateTime.UtcNow
            };

            _context.VocabWords.Add(word);
            await _context.SaveChangesAsync();

            return Json(new { success = true, message = $"Đã thêm thành công từ vựng '{word.Word}'!", wordId = word.WordId });
        }
        else
        {
            // Cập nhật
            var word = await _context.VocabWords.FirstOrDefaultAsync(w => w.WordId == model.WordId && !w.IsDeleted);
            if (word == null) return NotFound(new { success = false, message = "Không tìm thấy từ vựng cần cập nhật." });

            word.TopicId = model.TopicId;
            word.Word = model.Word.Trim();
            word.PartOfSpeech = model.PartOfSpeech?.Trim().ToLower();
            word.PhoneticUs = model.PhoneticUs?.Trim();
            word.PhoneticUk = model.PhoneticUk?.Trim();
            word.Meaning = model.Meaning.Trim();
            word.EnglishDefinition = model.EnglishDefinition?.Trim();
            word.AudioUrl = model.AudioUrl?.Trim();
            word.ImageUrl = model.ImageUrl?.Trim();
            word.ExampleSentence = model.ExampleSentence?.Trim();
            word.ExampleMeaning = model.ExampleMeaning?.Trim();
            word.Collocations = model.Collocations?.Trim();
            word.Synonyms = model.Synonyms?.Trim();
            word.Antonyms = model.Antonyms?.Trim();
            word.WordFamily = model.WordFamily?.Trim();
            word.MemoryTip = model.MemoryTip?.Trim();
            word.CommonMistakeWrong = model.CommonMistakeWrong?.Trim();
            word.CommonMistakeRight = model.CommonMistakeRight?.Trim();
            word.CommonMistakeNote = model.CommonMistakeNote?.Trim();
            word.QuizDistractorsJson = model.QuizDistractorsJson?.Trim();
            word.SensesJson = model.SensesJson?.Trim();
            word.UseManualQuiz = model.UseManualQuiz;
            word.SortOrder = model.SortOrder;
            word.IsActive = model.IsActive;
            word.UpdatedAt = DateTime.UtcNow;

            await _context.SaveChangesAsync();

            return Json(new { success = true, message = $"Đã cập nhật từ vựng '{word.Word}' thành công!", wordId = word.WordId });
        }
    }

    // ===== TRANG CHỈNH SỬA & TẠO MỚI TỪ VỰNG DẠNG TOÀN TRANG (STANDALONE FORM) =====
    [HttpGet]
    public async Task<IActionResult> CreateWord(int? topicId, int? categoryId)
    {
        var categories = await _context.VocabCategories.AsNoTracking()
            .Where(c => !c.IsDeleted)
            .OrderBy(c => c.SortOrder).ThenBy(c => c.Name)
            .ToListAsync();

        var topics = await _context.VocabTopics.AsNoTracking()
            .Include(t => t.Category)
            .Where(t => !t.IsDeleted)
            .OrderBy(t => t.SortOrder).ThenBy(t => t.Title)
            .ToListAsync();

        ViewBag.Categories = categories;
        ViewBag.Topics = topics;
        ViewBag.DefaultTopicId = topicId;

        var selectedTopic = topics.FirstOrDefault(t => t.TopicId == topicId);
        int defaultCatId = categoryId ?? (selectedTopic?.CategoryId ?? (categories.FirstOrDefault()?.CategoryId ?? 0));

        var model = new VocabWordInputModel
        {
            CategoryId = defaultCatId,
            TopicId = topicId ?? (topics.FirstOrDefault(t => t.CategoryId == defaultCatId)?.TopicId ?? (topics.FirstOrDefault()?.TopicId ?? 0)),
            SortOrder = 1,
            IsActive = true
        };

        return View("WordForm", model);
    }

    [HttpGet]
    public async Task<IActionResult> EditWord(int id)
    {
        var word = await _context.VocabWords
            .AsNoTracking()
            .Include(w => w.Topic).ThenInclude(t => t!.Category)
            .FirstOrDefaultAsync(w => w.WordId == id && !w.IsDeleted);

        if (word == null) return NotFound("Không tìm thấy từ vựng này.");

        var categories = await _context.VocabCategories.AsNoTracking()
            .Where(c => !c.IsDeleted)
            .OrderBy(c => c.SortOrder).ThenBy(c => c.Name)
            .ToListAsync();

        var topics = await _context.VocabTopics.AsNoTracking()
            .Include(t => t.Category)
            .Where(t => !t.IsDeleted)
            .OrderBy(t => t.SortOrder).ThenBy(t => t.Title)
            .ToListAsync();

        ViewBag.Categories = categories;
        ViewBag.Topics = topics;

        var model = new VocabWordInputModel
        {
            WordId = word.WordId,
            CategoryId = word.Topic?.CategoryId,
            TopicId = word.TopicId,
            Word = word.Word,
            PartOfSpeech = word.PartOfSpeech,
            PhoneticUs = word.PhoneticUs,
            PhoneticUk = word.PhoneticUk,
            Meaning = word.Meaning,
            EnglishDefinition = word.EnglishDefinition,
            AudioUrl = word.AudioUrl,
            ImageUrl = word.ImageUrl,
            ExampleSentence = word.ExampleSentence,
            ExampleMeaning = word.ExampleMeaning,
            Collocations = word.Collocations,
            Synonyms = word.Synonyms,
            Antonyms = word.Antonyms,
            WordFamily = word.WordFamily,
            MemoryTip = word.MemoryTip,
            CommonMistakeWrong = word.CommonMistakeWrong,
            CommonMistakeRight = word.CommonMistakeRight,
            CommonMistakeNote = word.CommonMistakeNote,
            SensesJson = word.SensesJson,
            SortOrder = word.SortOrder,
            IsActive = word.IsActive
        };

        return View("WordForm", model);
    }

    [HttpPost]
    [ValidateAntiForgeryToken]
    public async Task<IActionResult> SaveWordForm(VocabWordInputModel model)
    {
        if (!ModelState.IsValid)
        {
            ViewBag.Categories = await _context.VocabCategories.AsNoTracking()
                .Where(c => !c.IsDeleted)
                .OrderBy(c => c.SortOrder).ThenBy(c => c.Name)
                .ToListAsync();

            ViewBag.Topics = await _context.VocabTopics.AsNoTracking()
                .Include(t => t.Category)
                .Where(t => !t.IsDeleted)
                .OrderBy(t => t.SortOrder).ThenBy(t => t.Title)
                .ToListAsync();

            return View("WordForm", model);
        }

        if (model.WordId == 0)
        {
            var word = new VocabWord
            {
                TopicId = model.TopicId,
                Word = model.Word.Trim(),
                PartOfSpeech = model.PartOfSpeech?.Trim().ToLower(),
                PhoneticUs = model.PhoneticUs?.Trim(),
                PhoneticUk = model.PhoneticUk?.Trim(),
                Meaning = model.Meaning.Trim(),
                EnglishDefinition = model.EnglishDefinition?.Trim(),
                AudioUrl = model.AudioUrl?.Trim(),
                ImageUrl = model.ImageUrl?.Trim(),
                ExampleSentence = model.ExampleSentence?.Trim(),
                ExampleMeaning = model.ExampleMeaning?.Trim(),
                Collocations = model.Collocations?.Trim(),
                Synonyms = model.Synonyms?.Trim(),
                Antonyms = model.Antonyms?.Trim(),
                WordFamily = model.WordFamily?.Trim(),
                MemoryTip = model.MemoryTip?.Trim(),
                CommonMistakeWrong = model.CommonMistakeWrong?.Trim(),
                CommonMistakeRight = model.CommonMistakeRight?.Trim(),
                CommonMistakeNote = model.CommonMistakeNote?.Trim(),
                QuizDistractorsJson = model.QuizDistractorsJson?.Trim(),
                SensesJson = model.SensesJson?.Trim(),
                UseManualQuiz = model.UseManualQuiz,
                SortOrder = model.SortOrder,
                IsActive = model.IsActive,
                CreatedAt = DateTime.UtcNow
            };
            _context.VocabWords.Add(word);
            await _context.SaveChangesAsync();
            TempData["SuccessMessage"] = $"Đã thêm thành công từ vựng '{word.Word}'!";
        }
        else
        {
            var word = await _context.VocabWords.FirstOrDefaultAsync(w => w.WordId == model.WordId && !w.IsDeleted);
            if (word == null) return NotFound("Không tìm thấy từ vựng cần cập nhật.");

            word.TopicId = model.TopicId;
            word.Word = model.Word.Trim();
            word.PartOfSpeech = model.PartOfSpeech?.Trim().ToLower();
            word.PhoneticUs = model.PhoneticUs?.Trim();
            word.PhoneticUk = model.PhoneticUk?.Trim();
            word.Meaning = model.Meaning.Trim();
            word.EnglishDefinition = model.EnglishDefinition?.Trim();
            word.AudioUrl = model.AudioUrl?.Trim();
            word.ImageUrl = model.ImageUrl?.Trim();
            word.ExampleSentence = model.ExampleSentence?.Trim();
            word.ExampleMeaning = model.ExampleMeaning?.Trim();
            word.Collocations = model.Collocations?.Trim();
            word.Synonyms = model.Synonyms?.Trim();
            word.Antonyms = model.Antonyms?.Trim();
            word.WordFamily = model.WordFamily?.Trim();
            word.MemoryTip = model.MemoryTip?.Trim();
            word.CommonMistakeWrong = model.CommonMistakeWrong?.Trim();
            word.CommonMistakeRight = model.CommonMistakeRight?.Trim();
            word.CommonMistakeNote = model.CommonMistakeNote?.Trim();
            word.QuizDistractorsJson = model.QuizDistractorsJson?.Trim();
            word.SensesJson = model.SensesJson?.Trim();
            word.UseManualQuiz = model.UseManualQuiz;
            word.SortOrder = model.SortOrder;
            word.IsActive = model.IsActive;
            word.UpdatedAt = DateTime.UtcNow;

            await _context.SaveChangesAsync();
            TempData["SuccessMessage"] = $"Đã cập nhật từ vựng '{word.Word}' thành công!";
        }

        return RedirectToAction(nameof(Index), new { tab = "words", topicId = model.TopicId });
    }

    [HttpPost]
    [ValidateAntiForgeryToken]
    public async Task<IActionResult> ToggleWordStatus(int id)
    {
        var word = await _context.VocabWords.FirstOrDefaultAsync(w => w.WordId == id && !w.IsDeleted);
        if (word == null) return NotFound(new { success = false, message = "Không tìm thấy từ vựng." });

        word.IsActive = !word.IsActive;
        word.UpdatedAt = DateTime.UtcNow;
        await _context.SaveChangesAsync();

        return Json(new
        {
            success = true,
            isActive = word.IsActive,
            message = word.IsActive ? $"Đã kích hoạt từ '{word.Word}'" : $"Đã ẩn từ '{word.Word}'"
        });
    }

    [HttpPost]
    [ValidateAntiForgeryToken]
    public async Task<IActionResult> DeleteWord(int id)
    {
        var word = await _context.VocabWords.FirstOrDefaultAsync(w => w.WordId == id && !w.IsDeleted);
        if (word == null) return NotFound(new { success = false, message = "Không tìm thấy từ vựng." });

        // Xóa mềm để an toàn dữ liệu học viên
        word.IsDeleted = true;
        word.UpdatedAt = DateTime.UtcNow;
        await _context.SaveChangesAsync();

        return Json(new { success = true, message = $"Đã xóa từ vựng '{word.Word}' thành công." });
    }

    [HttpPost]
    [ValidateAntiForgeryToken]
    public async Task<IActionResult> DeleteMultipleWords([FromBody] VocabBulkDeleteWordsModel model)
    {
        if (model?.Ids == null || model.Ids.Count == 0)
        {
            return BadRequest(new { success = false, message = "Không có từ vựng nào được chọn để xóa." });
        }

        var words = await _context.VocabWords
            .Where(w => model.Ids.Contains(w.WordId) && !w.IsDeleted)
            .ToListAsync();

        if (words.Count == 0)
        {
            return NotFound(new { success = false, message = "Không tìm thấy từ vựng hợp lệ để xóa." });
        }

        foreach (var w in words)
        {
            w.IsDeleted = true;
            w.UpdatedAt = DateTime.UtcNow;
        }

        await _context.SaveChangesAsync();

        return Json(new { success = true, count = words.Count, message = $"Đã xóa {words.Count} từ vựng đã chọn thành công." });
    }

    [HttpPost]
    [ValidateAntiForgeryToken]
    public async Task<IActionResult> BulkImport([FromBody] VocabBulkImportModel model)
    {
        if (!ModelState.IsValid || string.IsNullOrWhiteSpace(model.RawData))
        {
            return BadRequest(new { success = false, message = "Vui lòng chọn bộ từ và nhập dữ liệu hợp lệ." });
        }

        var topic = await _context.VocabTopics.FirstOrDefaultAsync(t => t.TopicId == model.TopicId && !t.IsDeleted);
        if (topic == null)
        {
            return BadRequest(new { success = false, message = "Bộ từ không tồn tại." });
        }

        var lines = model.RawData.Split(new[] { "\r\n", "\r", "\n" }, StringSplitOptions.RemoveEmptyEntries);
        var addedWords = new List<VocabWord>();
        int currentMaxSort = await _context.VocabWords
            .Where(w => w.TopicId == model.TopicId && !w.IsDeleted)
            .Select(w => (int?)w.SortOrder).MaxAsync() ?? 0;

        foreach (var rawLine in lines)
        {
            var line = rawLine.Trim();
            if (string.IsNullOrWhiteSpace(line) || line.StartsWith("#")) continue;

            // Hỗ trợ dấu gạch đứng | hoặc dấu tab
            var parts = line.Split('|');
            if (parts.Length < 2)
            {
                parts = line.Split('\t');
            }

            if (parts.Length < 2) continue;

            // Cấu trúc dự kiến: Word | Meaning | PartOfSpeech | Phonetic | Example | ExampleMeaning
            var wordText = parts[0].Trim();
            var meaningText = parts.Length > 1 ? parts[1].Trim() : "";
            var posText = parts.Length > 2 ? parts[2].Trim() : "noun";
            var phoneticText = parts.Length > 3 ? parts[3].Trim() : "";
            var exampleText = parts.Length > 4 ? parts[4].Trim() : "";
            var exampleMeaningText = parts.Length > 5 ? parts[5].Trim() : "";
            var tipText = parts.Length > 6 ? parts[6].Trim() : "";
            var wrongText = parts.Length > 7 ? parts[7].Trim() : "";
            var rightText = parts.Length > 8 ? parts[8].Trim() : "";
            var noteText = parts.Length > 9 ? parts[9].Trim() : "";

            if (string.IsNullOrEmpty(wordText) || string.IsNullOrEmpty(meaningText)) continue;

            currentMaxSort++;
            var newWord = new VocabWord
            {
                TopicId = model.TopicId,
                Word = wordText,
                Meaning = meaningText,
                PartOfSpeech = string.IsNullOrEmpty(posText) ? "noun" : posText.ToLower(),
                PhoneticUs = string.IsNullOrEmpty(phoneticText) ? null : phoneticText,
                ExampleSentence = string.IsNullOrEmpty(exampleText) ? null : exampleText,
                ExampleMeaning = string.IsNullOrEmpty(exampleMeaningText) ? null : exampleMeaningText,
                MemoryTip = string.IsNullOrEmpty(tipText) ? null : tipText,
                CommonMistakeWrong = string.IsNullOrEmpty(wrongText) ? null : wrongText,
                CommonMistakeRight = string.IsNullOrEmpty(rightText) ? null : rightText,
                CommonMistakeNote = string.IsNullOrEmpty(noteText) ? null : noteText,
                SortOrder = currentMaxSort,
                IsActive = true,
                CreatedAt = DateTime.UtcNow
            };

            addedWords.Add(newWord);
        }

        if (addedWords.Count == 0)
        {
            return BadRequest(new { success = false, message = "Không có dòng dữ liệu nào hợp lệ để nhập. Vui lòng nhập theo định dạng: Từ | Nghĩa | Loại từ | Phiên âm | Ví dụ | Dịch ví dụ | Mẹo nhớ | Lỗi sai | Cách đúng | Giải thích lỗi" });
        }

        _context.VocabWords.AddRange(addedWords);
        await _context.SaveChangesAsync();

        return Json(new
        {
            success = true,
            count = addedWords.Count,
            message = $"Đã nhập thành công {addedWords.Count} từ vựng vào bộ '{topic.Title}'!"
        });
    }

    // ===== 3. QUẢN LÝ BỘ TỪ / CHỦ ĐỀ (TOPICS) =====

    [HttpGet]
    public async Task<IActionResult> GetTopic(int id)
    {
        var topic = await _context.VocabTopics
            .AsNoTracking()
            .Include(t => t.Category)
            .FirstOrDefaultAsync(t => t.TopicId == id && !t.IsDeleted);

        if (topic == null) return NotFound(new { success = false, message = "Không tìm thấy bộ từ này." });

        return Json(new
        {
            success = true,
            data = new
            {
                topic.TopicId,
                topic.CategoryId,
                CategoryName = topic.Category?.Name,
                topic.Title,
                topic.Code,
                topic.Description,
                topic.Level,
                topic.Icon,
                topic.Color,
                topic.ImageUrl,
                topic.SortOrder,
                topic.IsActive
            }
        });
    }

    [HttpPost]
    [ValidateAntiForgeryToken]
    public async Task<IActionResult> SaveTopic([FromBody] VocabTopicInputModel model)
    {
        if (!ModelState.IsValid)
        {
            var errors = ModelState.Values.SelectMany(v => v.Errors).Select(e => e.ErrorMessage).ToList();
            return BadRequest(new { success = false, message = string.Join("; ", errors) });
        }

        var catExists = await _context.VocabCategories.AnyAsync(c => c.CategoryId == model.CategoryId && !c.IsDeleted);
        if (!catExists) return BadRequest(new { success = false, message = "Danh mục cha không tồn tại." });

        if (model.TopicId == 0)
        {
            var topic = new VocabTopic
            {
                CategoryId = model.CategoryId,
                Title = model.Title.Trim(),
                Code = string.IsNullOrWhiteSpace(model.Code) ? GenerateSlug(model.Title) : model.Code.Trim().ToLower(),
                Description = model.Description?.Trim(),
                Level = model.Level?.Trim() ?? "B1",
                Icon = string.IsNullOrWhiteSpace(model.Icon) ? "book-open" : model.Icon.Trim(),
                Color = string.IsNullOrWhiteSpace(model.Color) ? null : model.Color.Trim().ToLower(),
                ImageUrl = model.ImageUrl?.Trim(),
                SortOrder = model.SortOrder,
                IsActive = model.IsActive,
                CreatedAt = DateTime.UtcNow
            };

            _context.VocabTopics.Add(topic);
            await _context.SaveChangesAsync();

            return Json(new { success = true, message = $"Đã tạo mới bộ từ '{topic.Title}' thành công!", topicId = topic.TopicId });
        }
        else
        {
            var topic = await _context.VocabTopics.FirstOrDefaultAsync(t => t.TopicId == model.TopicId && !t.IsDeleted);
            if (topic == null) return NotFound(new { success = false, message = "Không tìm thấy bộ từ để cập nhật." });

            topic.CategoryId = model.CategoryId;
            topic.Title = model.Title.Trim();
            topic.Code = string.IsNullOrWhiteSpace(model.Code) ? GenerateSlug(model.Title) : model.Code.Trim().ToLower();
            topic.Description = model.Description?.Trim();
            topic.Level = model.Level?.Trim() ?? "B1";
            topic.Icon = string.IsNullOrWhiteSpace(model.Icon) ? "book-open" : model.Icon.Trim();
            topic.Color = string.IsNullOrWhiteSpace(model.Color) ? null : model.Color.Trim().ToLower();
            topic.ImageUrl = model.ImageUrl?.Trim();
            topic.SortOrder = model.SortOrder;
            topic.IsActive = model.IsActive;
            topic.UpdatedAt = DateTime.UtcNow;

            await _context.SaveChangesAsync();

            return Json(new { success = true, message = $"Đã cập nhật bộ từ '{topic.Title}' thành công!", topicId = topic.TopicId });
        }
    }

    [HttpPost]
    [ValidateAntiForgeryToken]
    public async Task<IActionResult> ToggleTopicStatus(int id)
    {
        var topic = await _context.VocabTopics.FirstOrDefaultAsync(t => t.TopicId == id && !t.IsDeleted);
        if (topic == null) return NotFound(new { success = false, message = "Không tìm thấy bộ từ." });

        topic.IsActive = !topic.IsActive;
        topic.UpdatedAt = DateTime.UtcNow;
        await _context.SaveChangesAsync();

        return Json(new
        {
            success = true,
            isActive = topic.IsActive,
            message = topic.IsActive ? $"Đã kích hoạt bộ từ '{topic.Title}'" : $"Đã ẩn bộ từ '{topic.Title}'"
        });
    }

    [HttpPost]
    [ValidateAntiForgeryToken]
    public async Task<IActionResult> DeleteTopic(int id)
    {
        var topic = await _context.VocabTopics
            .Include(t => t.Words)
            .FirstOrDefaultAsync(t => t.TopicId == id && !t.IsDeleted);

        if (topic == null) return NotFound(new { success = false, message = "Không tìm thấy bộ từ." });

        topic.IsDeleted = true;
        topic.UpdatedAt = DateTime.UtcNow;

        // Xóa mềm các từ thuộc bộ này
        foreach (var w in topic.Words.Where(w => !w.IsDeleted))
        {
            w.IsDeleted = true;
            w.UpdatedAt = DateTime.UtcNow;
        }

        // Đồng bộ xóa mềm luôn các cụm từ ghép thuộc bộ này bên Ghép cụm từ
        var topicTitleLower = topic.Title.Trim().ToLower();
        var relatedPhrases = await _context.VocabPhrasePairs
            .Where(p => !p.IsDeleted && p.SetTitle.ToLower() == topicTitleLower)
            .ToListAsync();

        foreach (var p in relatedPhrases)
        {
            p.IsDeleted = true;
            p.IsActive = false;
            p.UpdatedAt = DateTime.UtcNow;
        }

        await _context.SaveChangesAsync();

        return Json(new { success = true, message = $"Đã xóa bộ từ '{topic.Title}', các từ vựng và cụm từ ghép liên quan." });
    }

    [HttpPost]
    [ValidateAntiForgeryToken]
    public async Task<IActionResult> BulkUpdateTopics([FromBody] VocabBulkTopicsModel request)
    {
        if (request == null || request.Ids.Count == 0)
        {
            return Json(new { success = false, message = "Chưa chọn bộ từ nào." });
        }

        var topics = await _context.VocabTopics
            .Include(t => t.Words)
            .Where(t => request.Ids.Contains(t.TopicId) && !t.IsDeleted)
            .ToListAsync();

        if (topics.Count == 0)
        {
            return Json(new { success = false, message = "Không tìm thấy bộ từ phù hợp." });
        }

        switch (request.Action?.ToLowerInvariant())
        {
            case "show":
                foreach (var t in topics) { t.IsActive = true; t.UpdatedAt = DateTime.UtcNow; }
                break;
            case "hide":
                foreach (var t in topics) { t.IsActive = false; t.UpdatedAt = DateTime.UtcNow; }
                break;
            case "delete":
                var topicTitles = topics.Select(t => t.Title.Trim().ToLower()).ToList();
                var relatedPhrases = await _context.VocabPhrasePairs
                    .Where(p => !p.IsDeleted && topicTitles.Contains(p.SetTitle.ToLower()))
                    .ToListAsync();

                foreach (var p in relatedPhrases)
                {
                    p.IsDeleted = true;
                    p.IsActive = false;
                    p.UpdatedAt = DateTime.UtcNow;
                }

                foreach (var t in topics)
                {
                    t.IsDeleted = true;
                    t.IsActive = false;
                    t.UpdatedAt = DateTime.UtcNow;
                    foreach (var w in t.Words.Where(w => !w.IsDeleted))
                    {
                        w.IsDeleted = true;
                        w.UpdatedAt = DateTime.UtcNow;
                    }
                }
                break;
            default:
                return Json(new { success = false, message = "Hành động không hợp lệ." });
        }

        await _context.SaveChangesAsync();
        return Json(new { success = true, count = topics.Count, message = $"Đã cập nhật {topics.Count} bộ từ." });
    }

    // ===== 4. QUẢN LÝ DANH MỤC (CATEGORIES) =====

    [HttpGet]
    public async Task<IActionResult> GetCategory(int id)
    {
        var cat = await _context.VocabCategories
            .AsNoTracking()
            .FirstOrDefaultAsync(c => c.CategoryId == id && !c.IsDeleted);

        if (cat == null) return NotFound(new { success = false, message = "Không tìm thấy danh mục." });

        return Json(new
        {
            success = true,
            data = new
            {
                cat.CategoryId,
                cat.Name,
                cat.Code,
                cat.Description,
                cat.Icon,
                cat.Color,
                cat.SortOrder,
                cat.IsActive
            }
        });
    }

    [HttpPost]
    [ValidateAntiForgeryToken]
    public async Task<IActionResult> SaveCategory([FromBody] VocabCategoryInputModel model)
    {
        if (!ModelState.IsValid)
        {
            var errors = ModelState.Values.SelectMany(v => v.Errors).Select(e => e.ErrorMessage).ToList();
            return BadRequest(new { success = false, message = string.Join("; ", errors) });
        }

        if (model.CategoryId == 0)
        {
            var cat = new VocabCategory
            {
                Name = model.Name.Trim(),
                Code = string.IsNullOrWhiteSpace(model.Code) ? GenerateSlug(model.Name) : model.Code.Trim().ToLower(),
                Description = model.Description?.Trim(),
                Icon = string.IsNullOrWhiteSpace(model.Icon) ? "book-open" : model.Icon.Trim(),
                Color = string.IsNullOrWhiteSpace(model.Color) ? "fuchsia" : model.Color.Trim().ToLower(),
                SortOrder = model.SortOrder,
                IsActive = model.IsActive,
                CreatedAt = DateTime.UtcNow
            };

            _context.VocabCategories.Add(cat);
            await _context.SaveChangesAsync();

            return Json(new { success = true, message = $"Đã thêm danh mục '{cat.Name}' thành công!", categoryId = cat.CategoryId });
        }
        else
        {
            var cat = await _context.VocabCategories.FirstOrDefaultAsync(c => c.CategoryId == model.CategoryId && !c.IsDeleted);
            if (cat == null) return NotFound(new { success = false, message = "Không tìm thấy danh mục để cập nhật." });

            cat.Name = model.Name.Trim();
            cat.Code = string.IsNullOrWhiteSpace(model.Code) ? GenerateSlug(model.Name) : model.Code.Trim().ToLower();
            cat.Description = model.Description?.Trim();
            cat.Icon = string.IsNullOrWhiteSpace(model.Icon) ? "book-open" : model.Icon.Trim();
            cat.Color = string.IsNullOrWhiteSpace(model.Color) ? "fuchsia" : model.Color.Trim().ToLower();
            cat.SortOrder = model.SortOrder;
            cat.IsActive = model.IsActive;
            cat.UpdatedAt = DateTime.UtcNow;

            await _context.SaveChangesAsync();

            return Json(new { success = true, message = $"Đã cập nhật danh mục '{cat.Name}' thành công!", categoryId = cat.CategoryId });
        }
    }

    [HttpPost]
    [ValidateAntiForgeryToken]
    public async Task<IActionResult> ToggleCategoryStatus(int id)
    {
        var cat = await _context.VocabCategories.FirstOrDefaultAsync(c => c.CategoryId == id && !c.IsDeleted);
        if (cat == null) return NotFound(new { success = false, message = "Không tìm thấy danh mục." });

        cat.IsActive = !cat.IsActive;
        cat.UpdatedAt = DateTime.UtcNow;
        await _context.SaveChangesAsync();

        return Json(new
        {
            success = true,
            isActive = cat.IsActive,
            message = cat.IsActive ? $"Đã kích hoạt danh mục '{cat.Name}'" : $"Đã ẩn danh mục '{cat.Name}'"
        });
    }

    [HttpPost]
    [ValidateAntiForgeryToken]
    public async Task<IActionResult> DeleteCategory(int id)
    {
        var cat = await _context.VocabCategories
            .Include(c => c.Topics).ThenInclude(t => t.Words)
            .FirstOrDefaultAsync(c => c.CategoryId == id && !c.IsDeleted);

        if (cat == null) return NotFound(new { success = false, message = "Không tìm thấy danh mục." });

        cat.IsDeleted = true;
        cat.UpdatedAt = DateTime.UtcNow;

        foreach (var t in cat.Topics.Where(t => !t.IsDeleted))
        {
            t.IsDeleted = true;
            t.UpdatedAt = DateTime.UtcNow;
            foreach (var w in t.Words.Where(w => !w.IsDeleted))
            {
                w.IsDeleted = true;
                w.UpdatedAt = DateTime.UtcNow;
            }
        }

        // Đồng bộ xóa mềm luôn các cụm từ ghép thuộc danh mục này
        var catCodeLower = cat.Code.Trim().ToLower();
        var catTopicTitles = cat.Topics.Select(t => t.Title.Trim().ToLower()).ToList();
        var relatedCatPhrases = await _context.VocabPhrasePairs
            .Where(p => !p.IsDeleted && (p.TopicCategory.ToLower() == catCodeLower || catTopicTitles.Contains(p.SetTitle.ToLower())))
            .ToListAsync();

        foreach (var p in relatedCatPhrases)
        {
            p.IsDeleted = true;
            p.IsActive = false;
            p.UpdatedAt = DateTime.UtcNow;
        }

        await _context.SaveChangesAsync();

        return Json(new { success = true, message = $"Đã xóa danh mục '{cat.Name}' thành công." });
    }

    // ===== 5. QUẢN LÝ GHÉP CỤM TỪ (PHRASES / COLLOCATIONS) =====

    [HttpGet]
    public async Task<IActionResult> GetPhrase(int id)
    {
        var phrase = await _context.VocabPhrasePairs.AsNoTracking()
            .FirstOrDefaultAsync(p => p.PairId == id && !p.IsDeleted);

        if (phrase == null) return NotFound(new { success = false, message = "Không tìm thấy cụm từ." });

        return Json(new
        {
            success = true,
            data = new
            {
                phrase.PairId,
                phrase.TopicCategory,
                phrase.SetTitle,
                phrase.LeftWord,
                phrase.RightWord,
                phrase.Meaning,
                phrase.SentenceBefore,
                phrase.SentenceAfter,
                phrase.SortOrder,
                phrase.IsActive
            }
        });
    }

    [HttpPost]
    [ValidateAntiForgeryToken]
    public async Task<IActionResult> SavePhrase([FromBody] VocabPhrasePairInputModel model)
    {
        if (!ModelState.IsValid)
        {
            var errors = ModelState.Values.SelectMany(v => v.Errors).Select(e => e.ErrorMessage).ToList();
            return BadRequest(new { success = false, message = string.Join("; ", errors) });
        }

        if (model.PairId == 0)
        {
            var phrase = new VocabPhrasePair
            {
                TopicCategory = model.TopicCategory.Trim().ToLower(),
                SetTitle = string.IsNullOrWhiteSpace(model.SetTitle) ? "General" : model.SetTitle.Trim(),
                LeftWord = model.LeftWord.Trim(),
                RightWord = model.RightWord.Trim(),
                Meaning = model.Meaning.Trim(),
                SentenceBefore = model.SentenceBefore?.Trim(),
                SentenceAfter = model.SentenceAfter?.Trim(),
                SortOrder = model.SortOrder,
                IsActive = model.IsActive,
                CreatedAt = DateTime.UtcNow
            };

            _context.VocabPhrasePairs.Add(phrase);
            await _context.SaveChangesAsync();

            return Json(new { success = true, message = $"Đã thêm cụm từ '{phrase.LeftWord} {phrase.RightWord}' thành công!", pairId = phrase.PairId });
        }
        else
        {
            var phrase = await _context.VocabPhrasePairs.FirstOrDefaultAsync(p => p.PairId == model.PairId && !p.IsDeleted);
            if (phrase == null) return NotFound(new { success = false, message = "Không tìm thấy cụm từ cần cập nhật." });

            phrase.TopicCategory = model.TopicCategory.Trim().ToLower();
            phrase.SetTitle = string.IsNullOrWhiteSpace(model.SetTitle) ? "General" : model.SetTitle.Trim();
            phrase.LeftWord = model.LeftWord.Trim();
            phrase.RightWord = model.RightWord.Trim();
            phrase.Meaning = model.Meaning.Trim();
            phrase.SentenceBefore = model.SentenceBefore?.Trim();
            phrase.SentenceAfter = model.SentenceAfter?.Trim();
            phrase.SortOrder = model.SortOrder;
            phrase.IsActive = model.IsActive;
            phrase.UpdatedAt = DateTime.UtcNow;

            await _context.SaveChangesAsync();

            return Json(new { success = true, message = $"Đã cập nhật cụm từ '{phrase.LeftWord} {phrase.RightWord}' thành công!", pairId = phrase.PairId });
        }
    }

    [HttpPost]
    [ValidateAntiForgeryToken]
    public async Task<IActionResult> TogglePhraseStatus(int id)
    {
        var phrase = await _context.VocabPhrasePairs.FirstOrDefaultAsync(p => p.PairId == id && !p.IsDeleted);
        if (phrase == null) return NotFound(new { success = false, message = "Không tìm thấy cụm từ." });

        phrase.IsActive = !phrase.IsActive;
        phrase.UpdatedAt = DateTime.UtcNow;
        await _context.SaveChangesAsync();

        return Json(new
        {
            success = true,
            isActive = phrase.IsActive,
            message = phrase.IsActive ? $"Đã kích hoạt cụm '{phrase.LeftWord} {phrase.RightWord}'" : $"Đã ẩn cụm '{phrase.LeftWord} {phrase.RightWord}'"
        });
    }

    [HttpPost]
    [ValidateAntiForgeryToken]
    public async Task<IActionResult> DeletePhrase(int id)
    {
        var phrase = await _context.VocabPhrasePairs.FirstOrDefaultAsync(p => p.PairId == id && !p.IsDeleted);
        if (phrase == null) return NotFound(new { success = false, message = "Không tìm thấy cụm từ." });

        phrase.IsDeleted = true;
        phrase.UpdatedAt = DateTime.UtcNow;
        await _context.SaveChangesAsync();

        return Json(new { success = true, message = $"Đã xóa cụm từ '{phrase.LeftWord} {phrase.RightWord}' thành công." });
    }

    [HttpPost]
    [ValidateAntiForgeryToken]
    public async Task<IActionResult> BulkUpdatePhrases([FromBody] VocabBulkTopicsModel request)
    {
        if (request == null || request.Ids.Count == 0)
        {
            return Json(new { success = false, message = "Chưa chọn cụm từ nào." });
        }

        var phrases = await _context.VocabPhrasePairs
            .Where(p => request.Ids.Contains(p.PairId) && !p.IsDeleted)
            .ToListAsync();

        if (phrases.Count == 0)
        {
            return Json(new { success = false, message = "Không tìm thấy cụm từ phù hợp." });
        }

        switch (request.Action?.ToLowerInvariant())
        {
            case "show":
                foreach (var p in phrases) { p.IsActive = true; p.UpdatedAt = DateTime.UtcNow; }
                break;
            case "hide":
                foreach (var p in phrases) { p.IsActive = false; p.UpdatedAt = DateTime.UtcNow; }
                break;
            case "delete":
                foreach (var p in phrases) { p.IsDeleted = true; p.IsActive = false; p.UpdatedAt = DateTime.UtcNow; }
                break;
            default:
                return Json(new { success = false, message = "Hành động không hợp lệ." });
        }

        await _context.SaveChangesAsync();
        return Json(new { success = true, count = phrases.Count, message = $"Đã cập nhật {phrases.Count} cụm từ ghép." });
    }

    // ===== 6. QUẢN LÝ CẤU HÌNH & CHỨC NĂNG HỌC (SYSTEM SETTINGS) =====

    [HttpPost]
    [ValidateAntiForgeryToken]
    public async Task<IActionResult> SaveSettings([FromBody] VocabSystemSettingsViewModel model)
    {
        if (model == null) return BadRequest(new { success = false, message = "Dữ liệu cấu hình không hợp lệ." });

        var settingsMap = new Dictionary<string, string>
        {
            ["EnableFlashcards"] = model.EnableFlashcards ? "true" : "false",
            ["EnablePhrases"] = model.EnablePhrases ? "true" : "false",
            ["EnableReview"] = model.EnableReview ? "true" : "false",
            ["EnableQuiz"] = model.EnableQuiz ? "true" : "false",
            ["EnableNotebook"] = model.EnableNotebook ? "true" : "false",
            ["EnableAutoAudio"] = model.EnableAutoAudio ? "true" : "false",
            ["DailyNewWordsGoal"] = model.DailyNewWordsGoal.ToString(),
            ["QuizQuestionCount"] = model.QuizQuestionCount.ToString(),
            ["BannerNotice"] = model.BannerNotice ?? ""
        };

        foreach (var (key, value) in settingsMap)
        {
            var existing = await _context.VocabSettings.FirstOrDefaultAsync(s => s.SettingKey == key);
            if (existing != null)
            {
                existing.SettingValue = value;
                existing.UpdatedAt = DateTime.UtcNow;
            }
            else
            {
                _context.VocabSettings.Add(new VocabSetting
                {
                    SettingKey = key,
                    SettingValue = value,
                    UpdatedAt = DateTime.UtcNow
                });
            }
        }

        await _context.SaveChangesAsync();

        return Json(new { success = true, message = "Đã lưu cài đặt và cấu hình tính năng thành công!" });
    }

    // ===== 7. TIỆN ÍCH HỖ TRỢ =====

    [HttpGet]
    public async Task<IActionResult> GetTopicsByCategory(int categoryId)
    {
        var topics = await _context.VocabTopics.AsNoTracking()
            .Where(t => t.CategoryId == categoryId && !t.IsDeleted && t.IsActive)
            .OrderBy(t => t.SortOrder)
            .Select(t => new { t.TopicId, t.Title, t.Level })
            .ToListAsync();

        return Json(new { success = true, data = topics });
    }

    // ===== 8. CÔNG CỤ NĂNG SUẤT ADMIN (AUTO-FILL, UPLOAD AUDIO/TTS, CSV PREVIEW IMPORT) =====

    [HttpGet]
    public async Task<IActionResult> AutoFillWord(string word, string? pos = null)
    {
        var clean = (word ?? string.Empty).Trim();
        if (string.IsNullOrWhiteSpace(clean))
        {
            return BadRequest(new { success = false, message = "Vui lòng nhập từ tiếng Anh trước khi gợi ý tự động." });
        }

        var res = await _aiService.SuggestCoreInfoAsync(clean, pos);
        return Json(new
        {
            success = true,
            source = res.Source,
            data = new
            {
                word = res.Word,
                partOfSpeech = res.PartOfSpeech,
                phoneticUs = res.PhoneticUs,
                phoneticUk = res.PhoneticUk,
                meaning = res.Meaning,
                englishDefinition = res.EnglishDefinition,
                audioUrl = res.AudioUrl,
                source = res.Source
            }
        });
    }

    [HttpPost]
    [ValidateAntiForgeryToken]
    public async Task<IActionResult> AutoFillLessonByAi([FromBody] VocabAiSuggestRequest req)
    {
        var clean = (req?.Word ?? string.Empty).Trim();
        if (string.IsNullOrWhiteSpace(clean))
        {
            return BadRequest(new { success = false, message = "Vui lòng nhập từ tiếng Anh ở Tab 1 trước khi gợi ý bài học." });
        }

        var topicTitle = req?.TopicTitle;
        if (string.IsNullOrWhiteSpace(topicTitle) && req?.TopicId > 0)
        {
            topicTitle = await _context.VocabTopics.AsNoTracking()
                .Where(t => t.TopicId == req.TopicId)
                .Select(t => t.Title)
                .FirstOrDefaultAsync();
        }

        var res = await _aiService.SuggestLessonContentAsync(clean, req?.PartOfSpeech, req?.Meaning, topicTitle);
        return Json(new
        {
            success = true,
            source = res.Source,
            data = new
            {
                englishDefinition = res.EnglishDefinition,
                extraExamples = res.ExtraExamples,
                collocations = res.Collocations,
                synonyms = res.Synonyms,
                antonyms = res.Antonyms,
                wordFamily = res.WordFamily,
                commonMistakeWrong = res.CommonMistakeWrong,
                commonMistakeRight = res.CommonMistakeRight,
                commonMistakeNote = res.CommonMistakeNote,
                memoryTip = res.MemoryTip,
                source = res.Source
            }
        });
    }

    [HttpGet]
    public async Task<IActionResult> PreviewAutoQuizDistractors(int wordId, int topicId, string? pos, string? meaning)
    {
        var res = await _aiService.PreviewDatabaseQuizDistractorsAsync(wordId, topicId, pos, meaning);
        return Json(new
        {
            success = true,
            source = res.Source,
            data = new
            {
                distractors = res.Distractors,
                sameTopicCount = res.SameTopicCount,
                sameTopicPosCount = res.SameTopicPosCount,
                isLowTopicPool = res.IsLowTopicPool,
                source = res.Source
            }
        });
    }

    [HttpPost]
    [ValidateAntiForgeryToken]
    public async Task<IActionResult> SuggestQuizTrapsByAi([FromBody] VocabAiSuggestRequest req)
    {
        var clean = (req?.Word ?? string.Empty).Trim();
        if (string.IsNullOrWhiteSpace(clean))
        {
            return BadRequest(new { success = false, message = "Vui lòng nhập từ tiếng Anh ở Tab 1 trước khi gợi ý đáp án bẫy." });
        }

        var topicTitle = req?.TopicTitle;
        if (string.IsNullOrWhiteSpace(topicTitle) && req?.TopicId > 0)
        {
            topicTitle = await _context.VocabTopics.AsNoTracking()
                .Where(t => t.TopicId == req.TopicId)
                .Select(t => t.Title)
                .FirstOrDefaultAsync();
        }

        var res = await _aiService.SuggestQuizTrapsByAiAsync(
            clean,
            req?.PartOfSpeech,
            req?.Meaning,
            topicTitle,
            req?.TopicId ?? 0,
            req?.WordId ?? 0);

        return Json(new
        {
            success = true,
            source = res.Source,
            data = new
            {
                distractors = res.Distractors,
                note = res.Note,
                source = res.Source
            }
        });
    }

    [HttpPost]
    [ValidateAntiForgeryToken]
    public async Task<IActionResult> AutoFillTypingByAi([FromBody] VocabAiSuggestRequest req)
    {
        var clean = (req?.Word ?? string.Empty).Trim();
        if (string.IsNullOrWhiteSpace(clean))
        {
            return BadRequest(new { success = false, message = "Vui lòng nhập từ tiếng Anh ở Tab 1 trước khi sinh câu ví dụ." });
        }

        var topicTitle = req?.TopicTitle;
        if (string.IsNullOrWhiteSpace(topicTitle) && req?.TopicId > 0)
        {
            topicTitle = await _context.VocabTopics.AsNoTracking()
                .Where(t => t.TopicId == req.TopicId)
                .Select(t => t.Title)
                .FirstOrDefaultAsync();
        }

        var res = await _aiService.SuggestTypingContextAsync(clean, req?.PartOfSpeech, req?.Meaning, topicTitle);
        return Json(new
        {
            success = true,
            source = res.Source,
            data = new
            {
                exampleSentence = res.ExampleSentence,
                exampleMeaning = res.ExampleMeaning,
                source = res.Source
            }
        });
    }

    [HttpPost]
    [ValidateAntiForgeryToken]
    public async Task<IActionResult> SuggestExtraExamplesByAi([FromBody] VocabAiSuggestRequest req)
    {
        var clean = (req?.Word ?? string.Empty).Trim();
        if (string.IsNullOrWhiteSpace(clean))
        {
            return BadRequest(new { success = false, message = "Vui lòng nhập từ tiếng Anh ở Tab 1 trước khi tự sinh ví dụ." });
        }

        var topicTitle = req?.TopicTitle;
        if (string.IsNullOrWhiteSpace(topicTitle) && req?.TopicId > 0)
        {
            topicTitle = await _context.VocabTopics.AsNoTracking()
                .Where(t => t.TopicId == req.TopicId)
                .Select(t => t.Title)
                .FirstOrDefaultAsync();
        }

        var (examples, source) = await _aiService.SuggestExtraExamplesAsync(
            clean,
            req?.PartOfSpeech,
            req?.Meaning,
            topicTitle,
            req?.ExistingExamples);

        return Json(new
        {
            success = true,
            source,
            data = new
            {
                examples,
                source
            }
        });
    }

    [HttpPost]
    [ValidateAntiForgeryToken]
    public async Task<IActionResult> AiSuggestPhrasePair([FromBody] AiSuggestPhraseRequest? req)
    {
        var focusWord = (req?.FocusWord ?? string.Empty).Trim();
        if (string.IsNullOrWhiteSpace(focusWord))
            return BadRequest(new { success = false, message = "Vui lòng nhập hoặc chọn từ vựng gốc trọng tâm." });

        var dbWord = await _context.VocabWords.AsNoTracking()
            .Include(w => w.Topic)
            .FirstOrDefaultAsync(w => !w.IsDeleted &&
                ((req != null && req.WordId > 0 && w.WordId == req.WordId)
                 || w.Word.ToLower() == focusWord.ToLower()));

        var topicTitle = !string.IsNullOrWhiteSpace(req?.SetTitle)
            ? req!.SetTitle!.Trim()
            : dbWord?.Topic?.Title;

        var result = await _aiService.SuggestPhrasePairAsync(
            dbWord?.Word ?? focusWord,
            dbWord?.PartOfSpeech,
            dbWord?.Meaning,
            topicTitle,
            dbWord?.Collocations,
            dbWord?.ExampleSentence);

        return Json(new
        {
            success = true,
            source = result.Source,
            data = result
        });
    }

    [HttpPost]
    [ValidateAntiForgeryToken]
    public async Task<IActionResult> AiGeneratePhrasesFromTopic([FromBody] AiGeneratePhrasesTopicRequest? req)
    {
        if (req == null || req.TopicId <= 0)
            return BadRequest(new { success = false, message = "Vui lòng chọn bộ từ vựng hợp lệ." });

        var topic = await _context.VocabTopics.AsNoTracking()
            .Include(t => t.Category)
            .FirstOrDefaultAsync(t => t.TopicId == req.TopicId && !t.IsDeleted);

        if (topic == null)
            return NotFound(new { success = false, message = "Không tìm thấy bộ từ vựng." });

        var setTitle = string.IsNullOrWhiteSpace(req.SetTitle) ? topic.Title : req.SetTitle.Trim();
        var categoryCode = string.IsNullOrWhiteSpace(req.CategoryCode)
            ? (topic.Category?.Code ?? "business").ToLower()
            : req.CategoryCode.Trim().ToLower();

        var wordsQuery = _context.VocabWords.AsNoTracking()
            .Where(w => w.TopicId == req.TopicId && !w.IsDeleted && w.IsActive)
            .OrderBy(w => w.SortOrder).ThenBy(w => w.WordId);

        var allTopicWords = await wordsQuery.ToListAsync();
        if (allTopicWords.Count == 0)
            return BadRequest(new { success = false, message = "Bộ từ này chưa có từ vựng thẻ học nào để AI sinh câu hỏi." });

        List<VocabWord> selectedWords;
        if (req.WordIds != null && req.WordIds.Count > 0)
        {
            var idSet = req.WordIds.ToHashSet();
            selectedWords = allTopicWords.Where(w => idSet.Contains(w.WordId)).ToList();
        }
        else
        {
            var existingPhrases = await _context.VocabPhrasePairs.AsNoTracking()
                .Where(p => !p.IsDeleted && p.SetTitle.ToLower() == setTitle.ToLower())
                .Select(p => (p.LeftWord + " " + p.RightWord).ToLower())
                .ToListAsync();

            selectedWords = allTopicWords
                .Where(w => !existingPhrases.Any(ph => ph.Contains(w.Word.Trim().ToLower())))
                .Take(Math.Clamp(req.Count > 0 ? req.Count : 5, 1, 10))
                .ToList();

            if (selectedWords.Count == 0)
            {
                selectedWords = allTopicWords.Take(Math.Clamp(req.Count > 0 ? req.Count : 5, 1, 10)).ToList();
            }
        }

        if (selectedWords.Count == 0)
            return BadRequest(new { success = false, message = "Không có từ vựng nào được chọn." });

        var generated = await _aiService.SuggestPhraseBatchAsync(
            selectedWords.Select(w => (w.Word, (string?)w.PartOfSpeech, (string?)w.Meaning, w.Collocations, w.ExampleSentence)),
            setTitle);

        int maxSort = await _context.VocabPhrasePairs
            .Where(p => !p.IsDeleted && p.TopicCategory == categoryCode && p.SetTitle == setTitle)
            .Select(p => (int?)p.SortOrder)
            .MaxAsync() ?? 0;

        var addedPairs = new List<VocabPhrasePair>();
        foreach (var item in generated)
        {
            if (string.IsNullOrWhiteSpace(item.LeftWord) || string.IsNullOrWhiteSpace(item.RightWord)) continue;
            bool duplicate = await _context.VocabPhrasePairs.AnyAsync(p =>
                !p.IsDeleted
                && p.SetTitle.ToLower() == setTitle.ToLower()
                && p.LeftWord.ToLower() == item.LeftWord.Trim().ToLower()
                && p.RightWord.ToLower() == item.RightWord.Trim().ToLower());
            if (duplicate) continue;

            maxSort += 1;
            var entity = new VocabPhrasePair
            {
                TopicCategory = categoryCode,
                SetTitle = setTitle,
                LeftWord = item.LeftWord.Trim(),
                RightWord = item.RightWord.Trim(),
                Meaning = item.Meaning.Trim(),
                SentenceBefore = item.SentenceBefore?.Trim(),
                SentenceAfter = item.SentenceAfter?.Trim(),
                SortOrder = maxSort,
                IsActive = true,
                CreatedAt = DateTime.UtcNow
            };
            _context.VocabPhrasePairs.Add(entity);
            addedPairs.Add(entity);
        }

        await _context.SaveChangesAsync();

        return Json(new
        {
            success = true,
            addedCount = addedPairs.Count,
            message = addedPairs.Count > 0
                ? $"AI đã sinh và lưu {addedPairs.Count} câu hỏi ghép cụm từ từ từ vựng gốc trọng tâm!"
                : "Các cụm từ được sinh đã tồn tại trong bộ này."
        });
    }

    [HttpPost]
    [ValidateAntiForgeryToken]
    public async Task<IActionResult> UploadWordAudio(IFormFile file)
    {
        if (file == null || file.Length == 0)
        {
            return BadRequest(new { success = false, message = "Vui lòng chọn tệp âm thanh MP3/WAV/OGG." });
        }

        var ext = Path.GetExtension(file.FileName).ToLowerInvariant();
        var allowed = new[] { ".mp3", ".wav", ".ogg", ".m4a" };
        if (!allowed.Contains(ext))
        {
            return BadRequest(new { success = false, message = "Định dạng không hỗ trợ. Chỉ chấp nhận .mp3, .wav, .ogg, .m4a." });
        }

        if (file.Length > 5 * 1024 * 1024)
        {
            return BadRequest(new { success = false, message = "Tệp âm thanh vượt quá giới hạn 5MB." });
        }

        var folder = Path.Combine(_env.WebRootPath, "uploads", "vocab-audio");
        Directory.CreateDirectory(folder);
        var fileName = $"{Guid.NewGuid():N}{ext}";
        var fullPath = Path.Combine(folder, fileName);

        await using (var stream = new FileStream(fullPath, FileMode.Create))
        {
            await file.CopyToAsync(stream);
        }

        return Json(new { success = true, url = $"/uploads/vocab-audio/{fileName}", message = "Đã tải tệp âm thanh lên máy chủ!" });
    }

    [HttpPost]
    [ValidateAntiForgeryToken]
    public async Task<IActionResult> GenerateWordTts([FromBody] WordTtsRequest req)
    {
        var text = (req?.Word ?? string.Empty).Trim();
        if (string.IsNullOrWhiteSpace(text))
        {
            return BadRequest(new { success = false, message = "Cần nhập từ tiếng Anh để tạo âm thanh TTS." });
        }

        var lang = string.Equals(req?.Accent, "uk", StringComparison.OrdinalIgnoreCase) ? "en-GB" : "en-US";
        var voice = string.Equals(req?.Accent, "uk", StringComparison.OrdinalIgnoreCase) ? "en-GB-SoniaNeural" : "en-US-JennyNeural";
        try
        {
            var folder = Path.Combine(_env.WebRootPath, "uploads", "vocab-audio");
            var fileName = await _edgeTts.SynthesizeToFileAsync(text, folder, voice);
            if (!string.IsNullOrEmpty(fileName))
            {
                return Json(new { success = true, url = $"/uploads/vocab-audio/{fileName}", message = $"Đã tạo tệp âm thanh Edge-TTS ({voice}) tự nhiên thành công!" });
            }

            // Fallback sang Google TTS nếu Edge-TTS bị gián đoạn mạng
            var ttsUrl = $"https://translate.google.com/translate_tts?ie=UTF-8&tl={lang}&client=tw-ob&q={Uri.EscapeDataString(text)}";
            using var message = new HttpRequestMessage(HttpMethod.Get, ttsUrl);
            message.Headers.TryAddWithoutValidation("User-Agent", "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36");
            using var response = await _httpClient.SendAsync(message);
            if (!response.IsSuccessStatusCode)
            {
                return Json(new { success = false, fallbackSpeech = true, message = "Dịch vụ TTS từ xa không phản hồi, đã đọc thử qua giọng máy trình duyệt." });
            }

            var bytes = await response.Content.ReadAsByteArrayAsync();
            if (bytes.Length < 256)
            {
                return Json(new { success = false, fallbackSpeech = true, message = "Không thể sinh tệp MP3 từ dịch vụ TTS." });
            }

            Directory.CreateDirectory(folder);
            var safeWord = Regex.Replace(text.ToLowerInvariant(), @"[^a-z0-9_-]", "");
            if (string.IsNullOrEmpty(safeWord)) safeWord = "word";
            var fbFileName = $"tts-{safeWord}-{Guid.NewGuid().ToString("N")[..8]}.mp3";
            var fullPath = Path.Combine(folder, fbFileName);
            await System.IO.File.WriteAllBytesAsync(fullPath, bytes);

            return Json(new { success = true, url = $"/uploads/vocab-audio/{fbFileName}", message = $"Đã tạo tệp âm thanh TTS ({lang}) thành công!" });
        }
        catch
        {
            return Json(new { success = false, fallbackSpeech = true, message = "Không kết nối được dịch vụ TTS bên ngoài (đang dùng trình đọc Web Speech trên máy)." });
        }
    }

    [HttpGet]
    public IActionResult DownloadWordTemplate()
    {
        var sb = new StringBuilder();
        sb.AppendLine("Word,PartOfSpeech,Meaning,Phonetic,ExampleSentence,ExampleMeaning,Mnemonic,Collocations,Synonyms,CommonMistakeWrong,CommonMistakeRight,CommonMistakeNote");
        sb.AppendLine("\"assurance\",noun,\"sự bảo đảm, lời cam đoan\",/əˈʃʊərəns/,\"The supplier gave us an [assurance] that goods will arrive on time.\",\"Nhà cung cấp đã đưa cho chúng tôi lời cam đoan rằng hàng sẽ đến đúng hạn.\",\"Gốc 'sure' = chắc chắn -> 'assurance' là mang lại sự chắc chắn.\",\"give an assurance; formal assurance\",\"guarantee, promise\",\"make an assurance\",\"give an assurance\",\"Dùng động từ give thay vì make với assurance.\"");
        sb.AppendLine("\"negotiate\",verb,\"đàm phán, thương lượng\",/nɪˈɡəʊʃieɪt/,\"Both teams will [negotiate] the final terms tomorrow.\",\"Hai nhóm sẽ đàm phán các điều khoản cuối cùng vào ngày mai.\",\"Liên tưởng 'ne-go-tiate' = đi lại nhiều vòng để thương lượng.\",\"negotiate a contract; negotiate terms\",\"bargain, discuss\",\"negotiate about the contract\",\"negotiate the contract\",\"Không thêm 'about' ngay sau negotiate.\"");
        var utf8Bom = new UTF8Encoding(true);
        var bytes = utf8Bom.GetBytes(sb.ToString());
        return File(bytes, "text/csv; charset=utf-8", "vocab-import-template.csv");
    }

    [HttpPost]
    [ValidateAntiForgeryToken]
    public async Task<IActionResult> PreviewBulkImport([FromBody] VocabBulkImportModel model)
    {
        if (model == null || model.TopicId <= 0 || string.IsNullOrWhiteSpace(model.RawData))
        {
            return BadRequest(new { success = false, message = "Vui lòng chọn bộ từ và nhập/tải dữ liệu CSV trước khi kiểm tra." });
        }

        var topic = await _context.VocabTopics.AsNoTracking().FirstOrDefaultAsync(t => t.TopicId == model.TopicId && !t.IsDeleted);
        if (topic == null)
        {
            return BadRequest(new { success = false, message = "Bộ từ được chọn không tồn tại." });
        }

        var existingSet = await _context.VocabWords.AsNoTracking()
            .Where(w => w.TopicId == model.TopicId && !w.IsDeleted)
            .Select(w => w.Word.ToLower())
            .ToListAsync();
        var existingDbWords = new HashSet<string>(existingSet, StringComparer.OrdinalIgnoreCase);

        var parsedRows = ParseBulkImportRows(model.RawData);
        var batchSeen = new HashSet<string>(StringComparer.OrdinalIgnoreCase);
        var results = new List<object>();
        int validCount = 0;
        int errorCount = 0;
        int warningCount = 0;

        foreach (var row in parsedRows)
        {
            var issues = new List<string>();
            bool hasError = false;
            bool hasWarning = false;

            if (string.IsNullOrWhiteSpace(row.Word))
            {
                issues.Add("Thiếu từ tiếng Anh (Word)");
                hasError = true;
            }
            if (string.IsNullOrWhiteSpace(row.Meaning))
            {
                issues.Add("Thiếu nghĩa tiếng Việt (Meaning)");
                hasError = true;
            }
            if (!string.IsNullOrWhiteSpace(row.Word))
            {
                if (existingDbWords.Contains(row.Word))
                {
                    issues.Add("Từ đã tồn tại trong bộ từ này");
                    hasError = true;
                }
                else if (!batchSeen.Add(row.Word))
                {
                    issues.Add("Bị trùng lặp trong chính file nhập");
                    hasError = true;
                }
            }
            if (!string.IsNullOrWhiteSpace(row.ExampleSentence) && !Regex.IsMatch(row.ExampleSentence, @"\[[^\[\]]+\]"))
            {
                issues.Add("Câu ví dụ chưa đánh dấu ô trống bằng cú pháp [...]");
                hasWarning = true;
            }

            if (hasError) errorCount++;
            else
            {
                validCount++;
                if (hasWarning) warningCount++;
            }

            results.Add(new
            {
                rowNumber = row.RowNumber,
                word = row.Word,
                partOfSpeech = row.PartOfSpeech,
                meaning = row.Meaning,
                phonetic = row.Phonetic,
                exampleSentence = row.ExampleSentence,
                exampleMeaning = row.ExampleMeaning,
                mnemonic = row.Mnemonic,
                collocations = row.Collocations,
                synonyms = row.Synonyms,
                commonMistakeWrong = row.CommonMistakeWrong,
                commonMistakeRight = row.CommonMistakeRight,
                commonMistakeNote = row.CommonMistakeNote,
                status = hasError ? "error" : (hasWarning ? "warning" : "ok"),
                issues
            });
        }

        return Json(new
        {
            success = true,
            topicTitle = topic.Title,
            totalRows = results.Count,
            validCount,
            errorCount,
            warningCount,
            rows = results
        });
    }

    [HttpPost]
    [ValidateAntiForgeryToken]
    public async Task<IActionResult> CommitBulkImport([FromBody] VocabBulkImportModel model)
    {
        if (model == null || model.TopicId <= 0 || string.IsNullOrWhiteSpace(model.RawData))
        {
            return BadRequest(new { success = false, message = "Thiếu bộ từ hoặc dữ liệu nhập." });
        }

        var topic = await _context.VocabTopics.FirstOrDefaultAsync(t => t.TopicId == model.TopicId && !t.IsDeleted);
        if (topic == null)
        {
            return BadRequest(new { success = false, message = "Bộ từ không tồn tại." });
        }

        var existingSet = await _context.VocabWords.AsNoTracking()
            .Where(w => w.TopicId == model.TopicId && !w.IsDeleted)
            .Select(w => w.Word.ToLower())
            .ToListAsync();
        var existingDbWords = new HashSet<string>(existingSet, StringComparer.OrdinalIgnoreCase);

        int currentMaxSort = await _context.VocabWords
            .Where(w => w.TopicId == model.TopicId && !w.IsDeleted)
            .Select(w => (int?)w.SortOrder).MaxAsync() ?? 0;

        var parsedRows = ParseBulkImportRows(model.RawData);
        var batchSeen = new HashSet<string>(StringComparer.OrdinalIgnoreCase);
        var toAdd = new List<VocabWord>();
        int skipped = 0;

        foreach (var row in parsedRows)
        {
            if (string.IsNullOrWhiteSpace(row.Word) || string.IsNullOrWhiteSpace(row.Meaning))
            {
                skipped++;
                continue;
            }
            if (existingDbWords.Contains(row.Word) || !batchSeen.Add(row.Word))
            {
                skipped++;
                continue;
            }

            currentMaxSort++;
            toAdd.Add(new VocabWord
            {
                TopicId = model.TopicId,
                Word = row.Word,
                PartOfSpeech = string.IsNullOrWhiteSpace(row.PartOfSpeech) ? "noun" : row.PartOfSpeech.ToLowerInvariant(),
                Meaning = row.Meaning,
                PhoneticUs = string.IsNullOrWhiteSpace(row.Phonetic) ? null : row.Phonetic,
                ExampleSentence = string.IsNullOrWhiteSpace(row.ExampleSentence) ? null : row.ExampleSentence,
                ExampleMeaning = string.IsNullOrWhiteSpace(row.ExampleMeaning) ? null : row.ExampleMeaning,
                MemoryTip = string.IsNullOrWhiteSpace(row.Mnemonic) ? null : row.Mnemonic,
                Collocations = string.IsNullOrWhiteSpace(row.Collocations) ? null : row.Collocations,
                Synonyms = string.IsNullOrWhiteSpace(row.Synonyms) ? null : row.Synonyms,
                CommonMistakeWrong = string.IsNullOrWhiteSpace(row.CommonMistakeWrong) ? null : row.CommonMistakeWrong,
                CommonMistakeRight = string.IsNullOrWhiteSpace(row.CommonMistakeRight) ? null : row.CommonMistakeRight,
                CommonMistakeNote = string.IsNullOrWhiteSpace(row.CommonMistakeNote) ? null : row.CommonMistakeNote,
                SortOrder = currentMaxSort,
                IsActive = true,
                CreatedAt = DateTime.UtcNow
            });
        }

        if (toAdd.Count == 0)
        {
            return BadRequest(new { success = false, message = "Không có dòng hợp lệ nào được lưu (tất cả bị thiếu trường hoặc trùng từ)." });
        }

        _context.VocabWords.AddRange(toAdd);
        await _context.SaveChangesAsync();

        return Json(new
        {
            success = true,
            count = toAdd.Count,
            skipped,
            message = $"Đã nhập {toAdd.Count} từ vựng hợp lệ vào '{topic.Title}' (bỏ qua {skipped} dòng lỗi/trùng)."
        });
    }

    // ===== 9. KIỂM DUYỆT CHẤT LƯỢNG (QUALITY CONTROL LOOP) =====

    [HttpGet]
    public async Task<IActionResult> GetQualityControlData()
    {
        await EnsureVocabSchemaColumnsAsync();

        // 1. Hộp thư Báo lỗi (Error Queue)
        var rawFeedbacks = await _context.Feedbacks.AsNoTracking()
            .Where(f => f.Status != "Resolved" &&
                        (f.FeedbackType.Contains("Vocab") ||
                         f.FeedbackType.Contains("Lỗi") ||
                         f.FeedbackType.Contains("Báo lỗi") ||
                         f.FeedbackType.Contains("từ vựng") ||
                         f.Content.Contains("[Word:#") ||
                         f.Content.Contains("Báo lỗi ở từ")))
            .OrderByDescending(f => f.CreatedAt)
            .Take(80)
            .ToListAsync();

        var errorQueue = new List<object>();
        foreach (var fb in rawFeedbacks)
        {
            int parsedWordId = 0;
            string parsedWord = string.Empty;
            string displayContent = fb.Content ?? string.Empty;

            var match = Regex.Match(displayContent, @"\[Word:#(\d+):([^\]]+)\]\s*");
            if (match.Success)
            {
                int.TryParse(match.Groups[1].Value, out parsedWordId);
                parsedWord = match.Groups[2].Value.Trim();
                displayContent = displayContent.Substring(match.Length).Trim();
            }
            else
            {
                var legacyMatch = Regex.Match(displayContent, @"Báo lỗi ở từ:\s*([A-Za-z\s-]+)");
                if (legacyMatch.Success)
                {
                    parsedWord = legacyMatch.Groups[1].Value.Trim();
                }
            }

            if (parsedWordId == 0 && !string.IsNullOrEmpty(parsedWord))
            {
                parsedWordId = await _context.VocabWords.AsNoTracking()
                    .Where(w => !w.IsDeleted && w.Word.ToLower() == parsedWord.ToLower())
                    .Select(w => w.WordId)
                    .FirstOrDefaultAsync();
            }

            var tag = (fb.FeedbackType ?? "Lỗi nội dung").Replace("[Vocab] ", "").Trim();
            errorQueue.Add(new
            {
                feedbackId = fb.FeedbackId,
                wordId = parsedWordId,
                word = parsedWord,
                categoryTag = tag,
                content = displayContent,
                status = fb.Status,
                createdAt = fb.CreatedAt.ToString("dd/MM/yyyy HH:mm")
            });
        }

        // 2. Cảnh báo độ khó bất thường (Again > 70% hoặc Gõ sai >= 3)
        var progressList = await _context.UserVocabProgresses.AsNoTracking()
            .Where(p => !p.Word.IsDeleted)
            .Select(p => new
            {
                p.WordId,
                Word = p.Word.Word,
                Meaning = p.Word.Meaning,
                TopicTitle = p.Word.Topic != null ? p.Word.Topic.Title : "Chưa gắn bộ",
                p.ReviewCount,
                p.CorrectCount,
                p.AgainCount,
                p.TypingFailCount
            })
            .ToListAsync();

        var difficultWords = progressList
            .GroupBy(p => new { p.WordId, p.Word, p.Meaning, p.TopicTitle })
            .Select(g =>
            {
                int totalReviews = g.Sum(x => x.ReviewCount);
                int totalAgain = g.Sum(x => x.AgainCount > 0 ? x.AgainCount : Math.Max(0, x.ReviewCount - x.CorrectCount));
                int totalTypingFails = g.Sum(x => x.TypingFailCount);
                double againRate = totalReviews > 0 ? Math.Round(totalAgain * 100.0 / totalReviews, 1) : 0;
                return new
                {
                    wordId = g.Key.WordId,
                    word = g.Key.Word,
                    meaning = g.Key.Meaning,
                    topicTitle = g.Key.TopicTitle,
                    reviewCount = totalReviews,
                    againCount = totalAgain,
                    againRate,
                    typingFailCount = totalTypingFails
                };
            })
            .Where(x => (x.reviewCount > 0 && x.againRate > 70) || x.typingFailCount >= 3)
            .OrderByDescending(x => x.againRate)
            .ThenByDescending(x => x.typingFailCount)
            .Take(50)
            .ToList();

        // 3. Kiểm tra tính toàn vẹn (Data Integrity Check)
        var activeWords = await _context.VocabWords.AsNoTracking()
            .Where(w => !w.IsDeleted)
            .Select(w => new
            {
                w.WordId,
                w.Word,
                w.Meaning,
                TopicTitle = w.Topic != null ? w.Topic.Title : "Chưa gắn bộ",
                w.AudioUrl,
                w.ExampleSentence,
                w.MemoryTip
            })
            .ToListAsync();

        var integrityIssues = activeWords
            .Select(w =>
            {
                bool missingAudio = string.IsNullOrWhiteSpace(w.AudioUrl);
                bool missingExample = string.IsNullOrWhiteSpace(w.ExampleSentence);
                bool missingBlankMarker = !missingExample && !Regex.IsMatch(w.ExampleSentence!, @"\[[^\[\]]+\]");
                bool missingTip = string.IsNullOrWhiteSpace(w.MemoryTip);
                var tags = new List<string>();
                if (missingAudio) tags.Add("Thiếu Audio");
                if (missingExample) tags.Add("Thiếu Ví dụ");
                if (missingBlankMarker) tags.Add("Chưa bọc [...] ô trống");
                if (missingTip) tags.Add("Thiếu Mẹo nhớ");

                return new
                {
                    wordId = w.WordId,
                    word = w.Word,
                    meaning = w.Meaning,
                    topicTitle = w.TopicTitle,
                    missingAudio,
                    missingExample,
                    missingBlankMarker,
                    missingTip,
                    tags
                };
            })
            .Where(x => x.tags.Count > 0)
            .Take(120)
            .ToList();

        return Json(new
        {
            success = true,
            errorQueue,
            difficultWords,
            integrityIssues
        });
    }

    [HttpPost]
    [ValidateAntiForgeryToken]
    public async Task<IActionResult> ResolveVocabFeedback(int feedbackId)
    {
        var fb = await _context.Feedbacks.FirstOrDefaultAsync(f => f.FeedbackId == feedbackId);
        if (fb == null) return NotFound(new { success = false, message = "Không tìm thấy phản hồi." });

        fb.Status = "Resolved";
        fb.ResolvedAt = DateTime.UtcNow;
        await _context.SaveChangesAsync();

        return Json(new { success = true, message = "Đã đánh dấu đã xử lý phản hồi." });
    }

    private sealed class ParsedBulkRow
    {
        public int RowNumber { get; set; }
        public string Word { get; set; } = string.Empty;
        public string PartOfSpeech { get; set; } = string.Empty;
        public string Meaning { get; set; } = string.Empty;
        public string Phonetic { get; set; } = string.Empty;
        public string ExampleSentence { get; set; } = string.Empty;
        public string ExampleMeaning { get; set; } = string.Empty;
        public string Mnemonic { get; set; } = string.Empty;
        public string Collocations { get; set; } = string.Empty;
        public string Synonyms { get; set; } = string.Empty;
        public string CommonMistakeWrong { get; set; } = string.Empty;
        public string CommonMistakeRight { get; set; } = string.Empty;
        public string CommonMistakeNote { get; set; } = string.Empty;
    }

    private static List<ParsedBulkRow> ParseBulkImportRows(string rawData)
    {
        var list = new List<ParsedBulkRow>();
        var lines = rawData.Split(new[] { "\r\n", "\r", "\n" }, StringSplitOptions.RemoveEmptyEntries);
        int rowIndex = 0;

        foreach (var rawLine in lines)
        {
            var line = rawLine.Trim();
            if (string.IsNullOrWhiteSpace(line) || line.StartsWith("#")) continue;

            List<string> cols;
            bool isCsvHeaderOrder = false;

            if (line.Contains('|'))
            {
                cols = line.Split('|').Select(s => s.Trim()).ToList();
            }
            else if (line.Contains('\t'))
            {
                cols = line.Split('\t').Select(s => s.Trim()).ToList();
            }
            else
            {
                cols = SplitCsvLine(line);
                isCsvHeaderOrder = true;
            }

            if (cols.Count == 0) continue;

            // Bỏ qua dòng tiêu đề CSV nếu phát hiện
            var first = cols[0].Trim().Trim('"');
            if (first.Equals("Word", StringComparison.OrdinalIgnoreCase) && cols.Count >= 2 &&
                (cols[1].Trim().Equals("PartOfSpeech", StringComparison.OrdinalIgnoreCase) || cols[1].Trim().Equals("Meaning", StringComparison.OrdinalIgnoreCase)))
            {
                continue;
            }

            rowIndex++;
            // CSV Template order: Word, PartOfSpeech, Meaning, Phonetic, ExampleSentence, ExampleMeaning, Mnemonic, Collocations, Synonyms, CommonMistakeWrong, CommonMistakeRight, CommonMistakeNote
            // Legacy Pipe order: Word | Meaning | PartOfSpeech | Phonetic | Example | ExampleMeaning | Mnemonic | Wrong | Right | Note
            bool looksLikePosInCol1 = cols.Count > 2 && Regex.IsMatch(cols[1].Trim(), @"^(noun|verb|adj|adjective|adv|adverb|prep|preposition|conj|phrase)$", RegexOptions.IgnoreCase);
            bool useCsvOrder = isCsvHeaderOrder || looksLikePosInCol1;

            string GetCol(int i) => i >= 0 && i < cols.Count ? cols[i].Trim() : string.Empty;

            if (useCsvOrder)
            {
                list.Add(new ParsedBulkRow
                {
                    RowNumber = rowIndex,
                    Word = GetCol(0),
                    PartOfSpeech = GetCol(1),
                    Meaning = GetCol(2),
                    Phonetic = GetCol(3),
                    ExampleSentence = GetCol(4),
                    ExampleMeaning = GetCol(5),
                    Mnemonic = GetCol(6),
                    Collocations = GetCol(7),
                    Synonyms = GetCol(8),
                    CommonMistakeWrong = GetCol(9),
                    CommonMistakeRight = GetCol(10),
                    CommonMistakeNote = GetCol(11)
                });
            }
            else
            {
                list.Add(new ParsedBulkRow
                {
                    RowNumber = rowIndex,
                    Word = GetCol(0),
                    Meaning = GetCol(1),
                    PartOfSpeech = GetCol(2),
                    Phonetic = GetCol(3),
                    ExampleSentence = GetCol(4),
                    ExampleMeaning = GetCol(5),
                    Mnemonic = GetCol(6),
                    CommonMistakeWrong = GetCol(7),
                    CommonMistakeRight = GetCol(8),
                    CommonMistakeNote = GetCol(9)
                });
            }
        }

        return list;
    }

    private static List<string> SplitCsvLine(string line)
    {
        var result = new List<string>();
        var current = new StringBuilder();
        bool inQuotes = false;

        for (int i = 0; i < line.Length; i++)
        {
            char c = line[i];
            if (c == '"')
            {
                if (inQuotes && i + 1 < line.Length && line[i + 1] == '"')
                {
                    current.Append('"');
                    i++;
                }
                else
                {
                    inQuotes = !inQuotes;
                }
            }
            else if (c == ',' && !inQuotes)
            {
                result.Add(current.ToString().Trim());
                current.Clear();
            }
            else
            {
                current.Append(c);
            }
        }
        result.Add(current.ToString().Trim());
        return result;
    }

    public sealed class WordTtsRequest
    {
        public string? Word { get; set; }
        public string? Accent { get; set; }
    }

    public sealed class VocabAiSuggestRequest
    {
        public string? Word { get; set; }
        public string? PartOfSpeech { get; set; }
        public string? Meaning { get; set; }
        public int TopicId { get; set; }
        public string? TopicTitle { get; set; }
        public int WordId { get; set; }
        public List<string>? ExistingExamples { get; set; }
    }

    public sealed class AiSuggestPhraseRequest
    {
        public string? FocusWord { get; set; }
        public int WordId { get; set; }
        public int TopicId { get; set; }
        public string? SetTitle { get; set; }
    }

    public sealed class AiGeneratePhrasesTopicRequest
    {
        public int TopicId { get; set; }
        public string? CategoryCode { get; set; }
        public string? SetTitle { get; set; }
        public int Count { get; set; } = 5;
        public List<int>? WordIds { get; set; }
    }

    private static string GenerateSlug(string phrase)
    {
        string str = phrase.ToLowerInvariant();
        // Thay ký tự tiếng Việt có dấu
        string[] vietnamese = new[] { "aáàảãạâấầẩẫậăắằẳẵặ", "eéèẻẽẹêếềểễệ", "iíìỉĩị", "oóòỏõọôốồổỗộơớờởỡợ", "uúùủũụưứừửữự", "yýỳỷỹỵ", "dđ" };
        string[] ascii = new[] { "a", "e", "i", "o", "u", "y", "d" };
        for (int i = 0; i < vietnamese.Length; i++)
        {
            foreach (char c in vietnamese[i])
            {
                str = str.Replace(c, ascii[i][0]);
            }
        }
        // Xóa ký tự không hợp lệ
        str = Regex.Replace(str, @"[^a-z0-9\s-]", "");
        // Thu gọn khoảng trắng thành gạch ngang
        str = Regex.Replace(str, @"\s+", "-").Trim('-');
        return string.IsNullOrEmpty(str) ? "item-" + Guid.NewGuid().ToString("N")[..6] : str;
    }
}
