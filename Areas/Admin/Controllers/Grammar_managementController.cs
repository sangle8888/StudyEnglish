using System.Text.Json;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using StudyEnglish.Data;
using StudyEnglish.Models.Grammar;
using StudyEnglish.Models.ViewModels.Admin;

namespace StudyEnglish.Areas.Admin.Controllers;

[Area("Admin")]
[Authorize(Roles = "Admin")]
public sealed class Grammar_managementController : Controller
{
    private static readonly string[] ExamLabels = ["TOEIC · VSTEP", "TOEIC", "VSTEP"];

    private readonly AppDbContext _context;

    public Grammar_managementController(AppDbContext context)
    {
        _context = context;
    }

    // ===== Tổng quan =====
    [HttpGet]
    public async Task<IActionResult> Index(int? categoryId)
    {
        var model = new GrammarIndexViewModel
        {
            SelectedCategoryId = categoryId,
            Categories = await _context.GrammarCategories.AsNoTracking()
                .Where(c => !c.IsDeleted)
                .OrderBy(c => c.SortOrder).ThenBy(c => c.CategoryId)
                .Select(c => new GrammarCategoryRow
                {
                    Id = c.CategoryId,
                    Title = c.Title,
                    Slug = c.Code,
                    SortOrder = c.SortOrder,
                    IsActive = c.IsActive,
                    HasTheory = c.Topics.Any(t => t.Theory != null),
                    TopicCount = c.Topics.Count(t => !t.IsDeleted)
                })
                .ToListAsync(),
            TotalTopics = await _context.GrammarTopics.CountAsync(t => !t.IsDeleted),
            TotalQuestions = await _context.Questions.CountAsync(q => !q.IsDeleted),
            OpenReports = await _context.QuestionReports.CountAsync(r => r.Status != "Resolved")
        };

        var topics = _context.GrammarTopics.AsNoTracking().Where(t => !t.IsDeleted).AsQueryable();
        if (categoryId.HasValue) topics = topics.Where(t => t.CategoryId == categoryId);

        model.Topics = await topics
            .Include(t => t.Category)
            .Include(t => t.TopicExams).ThenInclude(te => te.Exam)
            .Include(t => t.Questions)
            .OrderBy(t => t.Category.SortOrder).ThenBy(t => t.SortOrder).ThenBy(t => t.TopicId)
            .Select(t => new GrammarTopicRow
            {
                Id = t.TopicId,
                CategoryId = t.CategoryId,
                CategoryTitle = t.Category.Title,
                Title = t.Title,
                ExamLabel = t.TopicExams.Any() ? string.Join(" · ", t.TopicExams.Select(te => te.Exam.Code)) : "TOEIC · VSTEP",
                SortOrder = t.SortOrder,
                IsActive = t.IsActive,
                QuestionCount = t.Questions.Count(q => !q.IsDeleted)
            })
            .ToListAsync();

        return View(model);
    }

    // ===== Nhóm chủ đề =====
    [HttpGet]
    public async Task<IActionResult> CreateCategory()
    {
        var next = (await _context.GrammarCategories.MaxAsync(c => (int?)c.SortOrder) ?? 0) + 1;
        ViewData["Title"] = "Thêm nhóm chủ đề";
        return View("CategoryForm", new GrammarCategoryFormViewModel { SortOrder = next });
    }

    [HttpPost, ValidateAntiForgeryToken]
    public async Task<IActionResult> CreateCategory(GrammarCategoryFormViewModel model)
    {
        await ValidateCategoryCodeAsync(model);
        if (!ModelState.IsValid)
        {
            ViewData["Title"] = "Thêm nhóm chủ đề";
            return View("CategoryForm", model);
        }

        _context.GrammarCategories.Add(new GrammarCategory
        {
            Code = model.Slug.Trim(),
            Title = model.Title.Trim(),
            Description = model.Description?.Trim(),
            Icon = model.Icon.Trim(),
            SortOrder = model.SortOrder,
            IsActive = model.IsActive,
            CreatedAt = DateTime.UtcNow
        });
        await _context.SaveChangesAsync();
        TempData["Success"] = "Đã thêm nhóm chủ đề.";
        return RedirectToAction(nameof(Index));
    }

    [HttpGet]
    public async Task<IActionResult> EditCategory(int id)
    {
        var c = await _context.GrammarCategories.AsNoTracking().FirstOrDefaultAsync(x => x.CategoryId == id);
        if (c is null) return NotFound();
        ViewData["Title"] = "Sửa nhóm chủ đề";
        return View("CategoryForm", new GrammarCategoryFormViewModel
        {
            Id = c.CategoryId,
            Slug = c.Code,
            Title = c.Title,
            Description = c.Description,
            Icon = c.Icon ?? "fa-book-open",
            SortOrder = c.SortOrder,
            IsActive = c.IsActive
        });
    }

    [HttpPost, ValidateAntiForgeryToken]
    public async Task<IActionResult> EditCategory(int id, GrammarCategoryFormViewModel model)
    {
        var c = await _context.GrammarCategories.FirstOrDefaultAsync(x => x.CategoryId == id);
        if (c is null) return NotFound();

        model.Id = id;
        await ValidateCategoryCodeAsync(model);
        if (!ModelState.IsValid)
        {
            ViewData["Title"] = "Sửa nhóm chủ đề";
            return View("CategoryForm", model);
        }

        c.Code = model.Slug.Trim();
        c.Title = model.Title.Trim();
        c.Description = model.Description?.Trim();
        c.Icon = model.Icon.Trim();
        c.SortOrder = model.SortOrder;
        c.IsActive = model.IsActive;
        c.UpdatedAt = DateTime.UtcNow;
        await _context.SaveChangesAsync();
        TempData["Success"] = "Đã cập nhật nhóm chủ đề.";
        return RedirectToAction(nameof(Index));
    }

    [HttpPost, ValidateAntiForgeryToken]
    public async Task<IActionResult> DeleteCategory(int id)
    {
        var c = await _context.GrammarCategories.FirstOrDefaultAsync(x => x.CategoryId == id);
        if (c is not null)
        {
            c.IsDeleted = true;
            c.IsActive = false;
            c.UpdatedAt = DateTime.UtcNow;
            await _context.SaveChangesAsync();
            TempData["Success"] = "Đã xoá nhóm chủ đề.";
        }
        return RedirectToAction(nameof(Index));
    }

    private async Task ValidateCategoryCodeAsync(GrammarCategoryFormViewModel model)
    {
        var code = model.Slug?.Trim();
        if (!string.IsNullOrEmpty(code) &&
            await _context.GrammarCategories.AnyAsync(c => c.Code == code && c.CategoryId != model.Id && !c.IsDeleted))
        {
            ModelState.AddModelError(nameof(model.Slug), "Mã nhóm này đã tồn tại");
        }
    }

    // ===== Chủ đề =====
    [HttpGet]
    public async Task<IActionResult> CreateTopic(int? categoryId)
    {
        var model = await NewTopicFormAsync(categoryId);
        ViewData["Title"] = "Thêm chủ đề";
        return View("TopicForm", model);
    }

    [HttpPost, ValidateAntiForgeryToken]
    public async Task<IActionResult> CreateTopic(GrammarTopicFormViewModel model)
    {
        await ValidateTopicAsync(model);
        if (!ModelState.IsValid)
        {
            model.Categories = await LoadCategoriesAsync();
            ViewData["Title"] = "Thêm chủ đề";
            return View("TopicForm", model);
        }

        var topic = new GrammarTopic
        {
            CategoryId = model.CategoryId,
            Title = model.Title.Trim(),
            Slug = GenerateSlug(model.Title),
            SortOrder = model.SortOrder,
            IsActive = model.IsActive,
            CreatedAt = DateTime.UtcNow
        };
        _context.GrammarTopics.Add(topic);
        await _context.SaveChangesAsync();

        await SyncTopicExamsAsync(topic.TopicId, model.ExamLabel);

        TempData["Success"] = "Đã thêm chủ đề.";
        return RedirectToAction(nameof(Index), new { categoryId = model.CategoryId });
    }

    [HttpGet]
    public async Task<IActionResult> EditTopic(int id)
    {
        var t = await _context.GrammarTopics.AsNoTracking()
            .Include(x => x.TopicExams).ThenInclude(te => te.Exam)
            .FirstOrDefaultAsync(x => x.TopicId == id);
        if (t is null) return NotFound();

        var examLabel = t.TopicExams.Any() ? string.Join(" · ", t.TopicExams.Select(te => te.Exam.Code)) : "TOEIC · VSTEP";
        ViewData["Title"] = "Sửa chủ đề";
        return View("TopicForm", new GrammarTopicFormViewModel
        {
            Id = t.TopicId,
            CategoryId = t.CategoryId,
            Title = t.Title,
            ExamLabel = examLabel,
            SortOrder = t.SortOrder,
            IsActive = t.IsActive,
            Categories = await LoadCategoriesAsync()
        });
    }

    [HttpPost, ValidateAntiForgeryToken]
    public async Task<IActionResult> EditTopic(int id, GrammarTopicFormViewModel model)
    {
        var t = await _context.GrammarTopics.FirstOrDefaultAsync(x => x.TopicId == id);
        if (t is null) return NotFound();

        model.Id = id;
        await ValidateTopicAsync(model);
        if (!ModelState.IsValid)
        {
            model.Categories = await LoadCategoriesAsync();
            ViewData["Title"] = "Sửa chủ đề";
            return View("TopicForm", model);
        }

        t.CategoryId = model.CategoryId;
        t.Title = model.Title.Trim();
        t.SortOrder = model.SortOrder;
        t.IsActive = model.IsActive;
        t.UpdatedAt = DateTime.UtcNow;
        await _context.SaveChangesAsync();

        await SyncTopicExamsAsync(t.TopicId, model.ExamLabel);

        TempData["Success"] = "Đã cập nhật chủ đề.";
        return RedirectToAction(nameof(Index), new { categoryId = t.CategoryId });
    }

    [HttpPost, ValidateAntiForgeryToken]
    public async Task<IActionResult> DeleteTopic(int id)
    {
        var t = await _context.GrammarTopics.FirstOrDefaultAsync(x => x.TopicId == id);
        if (t is null) return RedirectToAction(nameof(Index));

        var categoryId = t.CategoryId;
        t.IsDeleted = true;
        t.IsActive = false;
        t.UpdatedAt = DateTime.UtcNow;
        await _context.SaveChangesAsync();
        TempData["Success"] = "Đã xoá chủ đề.";
        return RedirectToAction(nameof(Index), new { categoryId });
    }

    private async Task SyncTopicExamsAsync(int topicId, string examLabel)
    {
        await _context.GrammarTopicExams.Where(te => te.TopicId == topicId).ExecuteDeleteAsync();
        var allExams = await _context.Exams.ToListAsync();
        foreach (var ex in allExams)
        {
            if (examLabel.Contains(ex.Code, StringComparison.OrdinalIgnoreCase))
            {
                _context.GrammarTopicExams.Add(new GrammarTopicExam { TopicId = topicId, ExamId = ex.ExamId });
            }
        }
        await _context.SaveChangesAsync();
    }

    private static string GenerateSlug(string text)
    {
        var slug = text.ToLowerInvariant().Trim();
        slug = System.Text.RegularExpressions.Regex.Replace(slug, @"[^a-z0-9\s-]", "");
        slug = System.Text.RegularExpressions.Regex.Replace(slug, @"\s+", "-").Trim('-');
        return string.IsNullOrEmpty(slug) ? "topic-" + Guid.NewGuid().ToString("N")[..6] : slug;
    }

    private async Task<GrammarTopicFormViewModel> NewTopicFormAsync(int? categoryId)
    {
        var categories = await LoadCategoriesAsync();
        var selected = categoryId ?? categories.FirstOrDefault()?.CategoryId ?? 0;
        var next = (await _context.GrammarTopics.Where(t => t.CategoryId == selected)
            .MaxAsync(t => (int?)t.SortOrder) ?? 0) + 1;
        return new GrammarTopicFormViewModel { CategoryId = selected, SortOrder = next, Categories = categories };
    }

    private Task<List<GrammarCategory>> LoadCategoriesAsync() =>
        _context.GrammarCategories.AsNoTracking().Where(c => !c.IsDeleted).OrderBy(c => c.SortOrder).ToListAsync();

    private async Task ValidateTopicAsync(GrammarTopicFormViewModel model)
    {
        if (!ExamLabels.Contains(model.ExamLabel))
            ModelState.AddModelError(nameof(model.ExamLabel), "Kỳ thi không hợp lệ");
        if (!await _context.GrammarCategories.AnyAsync(c => c.CategoryId == model.CategoryId && !c.IsDeleted))
            ModelState.AddModelError(nameof(model.CategoryId), "Nhóm chủ đề không tồn tại");
    }

    // ===== Câu hỏi =====
    [HttpGet]
    public async Task<IActionResult> Questions(int topicId)
    {
        var topic = await _context.GrammarTopics.AsNoTracking()
            .Include(t => t.Category)
            .Include(t => t.Questions.OrderBy(q => q.SortOrder).ThenBy(q => q.QuestionId))
                .ThenInclude(q => q.Options.OrderBy(o => o.SortOrder))
            .FirstOrDefaultAsync(t => t.TopicId == topicId && !t.IsDeleted);
        if (topic is null) return NotFound();

        ViewData["Title"] = $"Câu hỏi - {topic.Title}";
        return View(new GrammarQuestionListViewModel
        {
            TopicId = topic.TopicId,
            CategoryId = topic.CategoryId,
            TopicTitle = topic.Title,
            CategoryTitle = topic.Category.Title,
            Questions = topic.Questions.OrderBy(q => q.SortOrder).ThenBy(q => q.QuestionId).ToList()
        });
    }

    [HttpGet]
    public async Task<IActionResult> CreateQuestion(int topicId)
    {
        var topic = await _context.GrammarTopics.AsNoTracking().FirstOrDefaultAsync(t => t.TopicId == topicId);
        if (topic is null) return NotFound();

        var count = await _context.Questions.CountAsync(q => q.TopicId == topicId && !q.IsDeleted);
        var maxOrder = await _context.Questions
            .Where(q => q.TopicId == topicId && !q.IsDeleted)
            .MaxAsync(q => (int?)q.SortOrder) ?? 0;
        var nextSortOrder = Math.Max(count, maxOrder) + 1;

        ViewData["Title"] = "Thêm câu hỏi";
        return View("QuestionForm", new GrammarQuestionFormViewModel
        {
            TopicId = topicId,
            TopicTitle = topic.Title,
            SortOrder = nextSortOrder,
            ReasoningSteps =
            [
                new() { Title = "Vị trí chỗ trống" },
                new() { Title = "Dạng từ" },
                new() { Title = "Hoà hợp S-V" },
                new() { Title = "Xét thì" }
            ]
        });
    }

    [HttpPost, ValidateAntiForgeryToken]
    public async Task<IActionResult> CreateQuestion(GrammarQuestionFormViewModel model)
    {
        var topic = await _context.GrammarTopics.AsNoTracking().FirstOrDefaultAsync(t => t.TopicId == model.TopicId);
        if (topic is null) return NotFound();

        if (model.SortOrder <= 0)
        {
            var count = await _context.Questions.CountAsync(q => q.TopicId == model.TopicId && !q.IsDeleted);
            var maxOrder = await _context.Questions
                .Where(q => q.TopicId == model.TopicId && !q.IsDeleted)
                .MaxAsync(q => (int?)q.SortOrder) ?? 0;
            model.SortOrder = Math.Max(count, maxOrder) + 1;
        }

        ValidateOptions(model);
        if (!ModelState.IsValid)
        {
            model.TopicTitle = topic.Title;
            ViewData["Title"] = "Thêm câu hỏi";
            return View("QuestionForm", model);
        }

        var validStatus = await GetValidQuestionStatusAsync(model.Status);
        var question = new Question
        {
            TopicId = model.TopicId,
            Difficulty = model.Difficulty > 0 ? model.Difficulty : (byte)1,
            Status = validStatus,
            CreatedAt = DateTime.UtcNow
        };
        ApplyQuestion(question, model, validStatus);
        _context.Questions.Add(question);

        // Đánh lại số thứ tự chuẩn (Re-indexing) khi chèn câu hỏi vào vị trí cụ thể
        var otherQuestions = await _context.Questions
            .Where(x => x.TopicId == model.TopicId)
            .OrderBy(x => x.SortOrder).ThenBy(x => x.QuestionId)
            .ToListAsync();

        var insertIndex = Math.Max(0, Math.Min(model.SortOrder - 1, otherQuestions.Count));
        otherQuestions.Insert(insertIndex, question);

        for (int i = 0; i < otherQuestions.Count; i++)
        {
            otherQuestions[i].SortOrder = i + 1;
        }

        await _context.SaveChangesAsync();
        TempData["Success"] = "Đã thêm câu hỏi.";
        return RedirectToAction(nameof(Questions), new { topicId = model.TopicId });
    }

    [HttpGet]
    public async Task<IActionResult> EditQuestion(int id)
    {
        var q = await _context.Questions.AsNoTracking()
            .Include(x => x.Topic)
            .Include(x => x.Options.OrderBy(o => o.SortOrder))
            .FirstOrDefaultAsync(x => x.QuestionId == id);
        if (q is null)
        {
            TempData["Error"] = $"Không tìm thấy câu hỏi #{id}.";
            return RedirectToAction(nameof(Index));
        }

        var options = q.Options.OrderBy(o => o.SortOrder).ToList();
        var correctIdx = options.FindIndex(o => o.IsCorrect);
        if (correctIdx < 0) correctIdx = 0;

        var topicQIds = await _context.Questions
            .Where(x => x.TopicId == q.TopicId)
            .OrderBy(x => x.SortOrder).ThenBy(x => x.QuestionId)
            .Select(x => x.QuestionId)
            .ToListAsync();
        var pos = topicQIds.IndexOf(q.QuestionId);
        var sortOrder = pos >= 0 ? pos + 1 : (q.SortOrder > 0 ? q.SortOrder : 1);

        var model = new GrammarQuestionFormViewModel
        {
            Id = q.QuestionId,
            TopicId = q.TopicId,
            TopicTitle = q.Topic?.Title ?? "Chủ đề",
            Content = q.Stem,
            ContentVi = q.StemVi,
            CorrectPosition = correctIdx,
            Explanation = q.ShortExplanation ?? "",
            ReasoningContext = q.ContextNote,
            Rule = q.RuleNote,
            Difficulty = q.Difficulty,
            Status = q.Status ?? "Active",
            SortOrder = sortOrder,
            IsActive = !q.IsDeleted
        };

        if (!string.IsNullOrWhiteSpace(q.ContextNote) && q.ContextNote.TrimStart().StartsWith("{"))
        {
            try
            {
                using var doc = JsonDocument.Parse(q.ContextNote);
                if (doc.RootElement.TryGetProperty("steps", out var stepsEl) && stepsEl.ValueKind == JsonValueKind.Array)
                {
                    foreach (var step in stepsEl.EnumerateArray())
                    {
                        var title = step.TryGetProperty("title", out var t) ? t.GetString() ?? "" : "";
                        var text = step.TryGetProperty("text", out var tx) ? tx.GetString() ?? "" : "";
                        var elim = new List<string>();
                        if (step.TryGetProperty("elim", out var el) && el.ValueKind == JsonValueKind.Array)
                        {
                            elim = el.EnumerateArray().Select(x => x.GetString() ?? "").Where(x => !string.IsNullOrEmpty(x)).ToList();
                        }

                        if (!string.IsNullOrWhiteSpace(title) || !string.IsNullOrWhiteSpace(text))
                        {
                            model.ReasoningSteps.Add(new GrammarReasoningStepInputModel
                            {
                                Title = string.IsNullOrWhiteSpace(title) ? "Tiêu chí suy luận" : title,
                                Text = text,
                                Eliminated = elim
                            });
                        }
                    }
                }
            }
            catch
            {
                // Fallback
            }
        }

        if (model.ReasoningSteps.Count == 0)
        {
            if (!string.IsNullOrWhiteSpace(q.ContextNote))
            {
                model.ReasoningSteps.Add(new GrammarReasoningStepInputModel
                {
                    Title = "Vị trí chỗ trống",
                    Text = q.ContextNote,
                    Eliminated = []
                });
            }
            else
            {
                model.ReasoningSteps =
                [
                    new() { Title = "Vị trí chỗ trống" },
                    new() { Title = "Dạng từ" },
                    new() { Title = "Hoà hợp S-V" },
                    new() { Title = "Xét thì" }
                ];
            }
        }

        for (var i = 0; i < 4 && i < options.Count; i++)
        {
            model.OptionTexts[i] = options[i].Content;
            model.OptionTextsVi[i] = options[i].ContentVi;
            model.OptionReasons[i] = options[i].WhyWrong;
        }

        ViewData["Title"] = "Sửa câu hỏi";
        return View("QuestionForm", model);
    }

    [HttpPost, ValidateAntiForgeryToken]
    public async Task<IActionResult> EditQuestion(int id, GrammarQuestionFormViewModel model)
    {
        var q = await _context.Questions
            .Include(x => x.Topic)
            .Include(x => x.Options.OrderBy(o => o.SortOrder))
            .FirstOrDefaultAsync(x => x.QuestionId == id);
        if (q is null)
        {
            TempData["Error"] = $"Không tìm thấy câu hỏi #{id}.";
            return RedirectToAction(nameof(Index));
        }

        model.Id = id;
        model.TopicId = q.TopicId;
        ValidateOptions(model);
        if (!ModelState.IsValid)
        {
            model.TopicTitle = q.Topic?.Title ?? "Chủ đề";
            ViewData["Title"] = "Sửa câu hỏi";
            return View("QuestionForm", model);
        }

        var validStatus = await GetValidQuestionStatusAsync(model.Status ?? q.Status);
        ApplyQuestion(q, model, validStatus);
        q.UpdatedAt = DateTime.UtcNow;

        // Đánh lại số thứ tự chuẩn (Re-indexing / Reordering) để đảm bảo vị trí hiển thị chính xác 100%
        var otherQuestions = await _context.Questions
            .Where(x => x.TopicId == q.TopicId && x.QuestionId != q.QuestionId)
            .OrderBy(x => x.SortOrder).ThenBy(x => x.QuestionId)
            .ToListAsync();

        var targetIndex = Math.Max(0, Math.Min(model.SortOrder - 1, otherQuestions.Count));
        otherQuestions.Insert(targetIndex, q);

        for (int i = 0; i < otherQuestions.Count; i++)
        {
            otherQuestions[i].SortOrder = i + 1;
        }

        await _context.SaveChangesAsync();
        TempData["Success"] = "Đã cập nhật câu hỏi.";
        return RedirectToAction(nameof(Questions), new { topicId = q.TopicId });
    }

    [HttpPost, ValidateAntiForgeryToken]
    public async Task<IActionResult> DeleteQuestion(int id)
    {
        var q = await _context.Questions.AsNoTracking().FirstOrDefaultAsync(x => x.QuestionId == id);
        if (q is null) return RedirectToAction(nameof(Index));

        var topicId = q.TopicId;

        await using var transaction = await _context.Database.BeginTransactionAsync();
        try
        {
            // 1. Xoá câu trả lời luyện tập liên quan đến câu hỏi này (tránh lỗi FK_Answers_Options)
            await _context.PracticeAnswers.Where(pa => pa.QuestionId == id).ExecuteDeleteAsync();

            // 2. Xoá đánh dấu bookmark của người dùng
            await _context.UserQuestionBookmarks.Where(uqb => uqb.QuestionId == id).ExecuteDeleteAsync();

            // 3. Xoá báo cáo câu hỏi nếu có
            await _context.QuestionReports.Where(qr => qr.QuestionId == id).ExecuteDeleteAsync();

            // 4. Xoá các đáp án lựa chọn của câu hỏi
            await _context.QuestionOptions.Where(qo => qo.QuestionId == id).ExecuteDeleteAsync();

            // 5. Xoá câu hỏi
            await _context.Questions.Where(x => x.QuestionId == id).ExecuteDeleteAsync();

            await transaction.CommitAsync();
            TempData["Success"] = "Đã xoá câu hỏi thành công.";
        }
        catch (Exception ex)
        {
            await transaction.RollbackAsync();

            // Nếu không thể xoá cứng do ràng buộc khác, fallback sang ẩn (soft-delete)
            var questionToHide = await _context.Questions.FirstOrDefaultAsync(x => x.QuestionId == id);
            if (questionToHide != null)
            {
                questionToHide.IsDeleted = true;
                questionToHide.UpdatedAt = DateTime.UtcNow;
                await _context.SaveChangesAsync();
                TempData["Success"] = "Đã ẩn câu hỏi.";
            }
            else
            {
                TempData["Error"] = $"Không thể xoá câu hỏi: {ex.Message}";
            }
        }

        return RedirectToAction(nameof(Questions), new { topicId });
    }

    [HttpPost, ValidateAntiForgeryToken]
    public async Task<IActionResult> DeleteMultipleQuestions(int topicId, List<int> questionIds)
    {
        if (questionIds is { Count: > 0 })
        {
            await using var transaction = await _context.Database.BeginTransactionAsync();
            try
            {
                await _context.PracticeAnswers.Where(pa => questionIds.Contains(pa.QuestionId)).ExecuteDeleteAsync();
                await _context.UserQuestionBookmarks.Where(uqb => questionIds.Contains(uqb.QuestionId)).ExecuteDeleteAsync();
                await _context.QuestionReports.Where(qr => questionIds.Contains(qr.QuestionId)).ExecuteDeleteAsync();
                await _context.QuestionOptions.Where(qo => questionIds.Contains(qo.QuestionId)).ExecuteDeleteAsync();
                var count = await _context.Questions.Where(q => q.TopicId == topicId && questionIds.Contains(q.QuestionId)).ExecuteDeleteAsync();

                await transaction.CommitAsync();
                TempData["Success"] = $"Đã xoá {count} câu hỏi đã chọn.";
            }
            catch
            {
                await transaction.RollbackAsync();
                var questionsToHide = await _context.Questions
                    .Where(q => q.TopicId == topicId && questionIds.Contains(q.QuestionId))
                    .ToListAsync();
                foreach (var q in questionsToHide)
                {
                    q.IsDeleted = true;
                    q.UpdatedAt = DateTime.UtcNow;
                }
                await _context.SaveChangesAsync();
                TempData["Success"] = $"Đã xoá (ẩn) {questionsToHide.Count} câu hỏi.";
            }
        }

        return RedirectToAction(nameof(Questions), new { topicId });
    }

    private void ValidateOptions(GrammarQuestionFormViewModel model)
    {
        for (var i = 0; i < 4; i++)
        {
            if (string.IsNullOrWhiteSpace(model.OptionTexts.ElementAtOrDefault(i)))
                ModelState.AddModelError($"OptionTexts[{i}]", $"Đáp án {(char)('A' + i)} không được để trống");
        }
    }

    private static void ApplyQuestion(Question q, GrammarQuestionFormViewModel m, string? validStatus)
    {
        q.Stem = m.Content.Trim();
        q.StemVi = Clean(m.ContentVi);
        q.ShortExplanation = m.Explanation.Trim();
        q.RuleNote = Clean(m.Rule);
        q.Difficulty = m.Difficulty > 0 ? m.Difficulty : (byte)1;
        q.Status = validStatus;
        q.SortOrder = m.SortOrder > 0 ? m.SortOrder : 1;
        q.IsDeleted = !m.IsActive;

        // Lưu danh sách tiêu chí suy luận tuỳ biến (tiêu đề, nội dung, đáp án loại)
        var correctLetter = ((char)('A' + m.CorrectPosition)).ToString();
        var eliminatedSoFar = new HashSet<string>(StringComparer.OrdinalIgnoreCase);

        var validSteps = new List<object>();
        foreach (var s in m.ReasoningSteps ?? [])
        {
            if (string.IsNullOrWhiteSpace(s.Title) || string.IsNullOrWhiteSpace(s.Text)) continue;

            var isBlank = s.Title.Trim().Contains("vị trí chỗ trống", StringComparison.OrdinalIgnoreCase);
            var elimList = new List<string>();

            if (!isBlank && s.Eliminated != null)
            {
                foreach (var raw in s.Eliminated)
                {
                    var letter = raw?.Trim().ToUpperInvariant();
                    if (string.IsNullOrEmpty(letter)) continue;
                    if (letter == correctLetter) continue; // Không cho phép loại đáp án đúng
                    if (eliminatedSoFar.Contains(letter)) continue; // Không cho phép loại lại đáp án đã bị loại trước đó

                    elimList.Add(letter);
                    eliminatedSoFar.Add(letter);
                }
            }

            validSteps.Add(new
            {
                title = s.Title.Trim(),
                text = s.Text!.Trim(),
                elim = elimList
            });
        }

        if (validSteps.Count > 0)
        {
            q.ContextNote = JsonSerializer.Serialize(new { steps = validSteps });
        }
        else
        {
            q.ContextNote = Clean(m.ReasoningContext);
        }

        var existingOptions = q.Options.OrderBy(o => o.SortOrder).ToList();
        for (byte i = 0; i < 4; i++)
        {
            var opt = existingOptions.ElementAtOrDefault(i);
            if (opt is null)
            {
                opt = new QuestionOption { SortOrder = (byte)(i + 1) };
                q.Options.Add(opt);
            }
            opt.SortOrder = (byte)(i + 1);
            opt.Content = m.OptionTexts[i].Trim();
            opt.ContentVi = Clean(m.OptionTextsVi.ElementAtOrDefault(i));
            opt.IsCorrect = (i == m.CorrectPosition);
            opt.WhyWrong = (i == m.CorrectPosition) ? null : Clean(m.OptionReasons.ElementAtOrDefault(i));
        }
    }

    private async Task<string?> GetValidQuestionStatusAsync(string? requestedStatus)
    {
        try
        {
            var ckDef = await _context.Database.SqlQueryRaw<string>(
                "SELECT definition FROM sys.check_constraints WHERE name = 'CK_Questions_Status'"
            ).FirstOrDefaultAsync();

            if (!string.IsNullOrEmpty(ckDef))
            {
                var matches = System.Text.RegularExpressions.Regex.Matches(ckDef, @"'([^']+)'");
                var allowed = matches.Select(m => m.Groups[1].Value).Distinct().ToList();

                if (allowed.Count > 0)
                {
                    if (!string.IsNullOrWhiteSpace(requestedStatus))
                    {
                        var match = allowed.FirstOrDefault(a => string.Equals(a, requestedStatus, StringComparison.OrdinalIgnoreCase));
                        if (match != null) return match;
                    }

                    var preferred = allowed.FirstOrDefault(a =>
                        string.Equals(a, "Published", StringComparison.OrdinalIgnoreCase) ||
                        string.Equals(a, "Approved", StringComparison.OrdinalIgnoreCase) ||
                        string.Equals(a, "Active", StringComparison.OrdinalIgnoreCase) ||
                        string.Equals(a, "Normal", StringComparison.OrdinalIgnoreCase));

                    return preferred ?? allowed[0];
                }
            }
        }
        catch
        {
        }

        try
        {
            var existingStatus = await _context.Questions.AsNoTracking()
                .Where(q => q.Status != null)
                .Select(q => q.Status)
                .FirstOrDefaultAsync();

            if (!string.IsNullOrEmpty(existingStatus)) return existingStatus;
        }
        catch
        {
        }

        return null;
    }

    private static string? Clean(string? s) => string.IsNullOrWhiteSpace(s) ? null : s.Trim();

    private static bool IsMojibake(string? text)
    {
        if (string.IsNullOrEmpty(text)) return false;
        return text.Contains('Ã') || text.Contains("á»") || text.Contains("áº") ||
               text.Contains('Â') || text.Contains("CÃ") || text.Contains("á»i") ||
               text.Contains("Æ°") || text.Contains("Ä‘") || text.Contains("Ä ") ||
               text.Contains("â€”") || text.Contains("â†’") || text.Contains("Náº") ||
               text.Contains("TrÆ");
    }

    private GrammarTheoryFormViewModel? GetSeedTheory(string? categoryCode)
    {
        try
        {
            var seedPath = Path.Combine(Directory.GetCurrentDirectory(), "Data", "Seed", "grammar-seed.json");
            if (!System.IO.File.Exists(seedPath))
                seedPath = Path.Combine(AppContext.BaseDirectory, "Data", "Seed", "grammar-seed.json");
            if (!System.IO.File.Exists(seedPath)) return null;

            var json = System.IO.File.ReadAllText(seedPath, System.Text.Encoding.UTF8);
            using var doc = JsonDocument.Parse(json);
            if (!doc.RootElement.TryGetProperty("theory", out var theoryEl)) return null;

            JsonElement tEl = default;
            if (!string.IsNullOrEmpty(categoryCode) && theoryEl.TryGetProperty(categoryCode, out var matchEl))
            {
                tEl = matchEl;
            }
            else if (theoryEl.TryGetProperty("tenses", out var tensesEl))
            {
                tEl = tensesEl;
            }
            else
            {
                var first = theoryEl.EnumerateObject().FirstOrDefault();
                if (first.Value.ValueKind == JsonValueKind.Object)
                    tEl = first.Value;
                else
                    return null;
            }

            var vm = new GrammarTheoryFormViewModel();
            if (tEl.TryGetProperty("summary", out var sum)) vm.Summary = sum.GetString() ?? "";
            if (tEl.TryGetProperty("quickIntro", out var qi)) vm.QuickIntro = qi.GetString() ?? "";
            if (tEl.TryGetProperty("mentalDescription", out var md)) vm.MentalDescription = md.GetString() ?? "";

            if (tEl.TryGetProperty("model", out var modelEl) && modelEl.ValueKind == JsonValueKind.Array)
            {
                var mList = modelEl.EnumerateArray().Select(x => x.GetString() ?? "").ToList();
                vm.ModelLeft = mList.ElementAtOrDefault(0) ?? "";
                vm.ModelRight = mList.ElementAtOrDefault(1) ?? "";
            }

            if (tEl.TryGetProperty("goldenRules", out var grEl) && grEl.ValueKind == JsonValueKind.Array)
            {
                vm.GoldenRules = string.Join("\n", grEl.EnumerateArray().Select(x => x.GetString() ?? "").Where(s => !string.IsNullOrEmpty(s)));
            }

            if (tEl.TryGetProperty("quickItems", out var qiEl) && qiEl.ValueKind == JsonValueKind.Array)
            {
                var qItems = new List<string>();
                foreach (var item in qiEl.EnumerateArray())
                {
                    if (item.ValueKind == JsonValueKind.Array)
                    {
                        var pair = item.EnumerateArray().Select(x => x.GetString() ?? "").ToList();
                        qItems.Add($"{pair.ElementAtOrDefault(0)} | {pair.ElementAtOrDefault(1)}");
                    }
                }
                vm.QuickItems = string.Join("\n", qItems);
            }

            if (tEl.TryGetProperty("formulas", out var fEl) && fEl.ValueKind == JsonValueKind.Array)
            {
                vm.Formulas = string.Join("\n", fEl.EnumerateArray().Select(x => x.GetString() ?? "").Where(s => !string.IsNullOrEmpty(s)));
            }

            if (tEl.TryGetProperty("usage", out var uEl) && uEl.ValueKind == JsonValueKind.Array)
            {
                var uItems = new List<string>();
                foreach (var u in uEl.EnumerateArray())
                {
                    var title = u.TryGetProperty("title", out var ut) ? ut.GetString() ?? "" : "";
                    var text = u.TryGetProperty("text", out var ux) ? ux.GetString() ?? "" : "";
                    var result = u.TryGetProperty("result", out var ur) ? ur.GetString() ?? "" : "";
                    var isGreen = u.TryGetProperty("green", out var ug) && ug.GetBoolean();
                    uItems.Add($"{title} | {text} | {result}" + (isGreen ? " | green" : ""));
                }
                vm.Usage = string.Join("\n", uItems);
            }

            if (tEl.TryGetProperty("mistakes", out var misEl) && misEl.ValueKind == JsonValueKind.Array)
            {
                vm.Mistakes = string.Join("\n", misEl.EnumerateArray().Select(x => x.GetString() ?? "").Where(s => !string.IsNullOrEmpty(s)));
            }

            if (tEl.TryGetProperty("examples", out var exEl) && exEl.ValueKind == JsonValueKind.Array)
            {
                vm.Examples = string.Join("\n", exEl.EnumerateArray().Select(x => x.GetString() ?? "").Where(s => !string.IsNullOrEmpty(s)));
            }

            return vm;
        }
        catch
        {
            return null;
        }
    }

    // ===== Lý thuyết =====
    [HttpGet]
    public async Task<IActionResult> EditTheory(int topicId)
    {
        var t = await _context.GrammarTopics.AsNoTracking()
            .Include(x => x.Category)
            .Include(x => x.Theory)
                .ThenInclude(th => th!.Items.OrderBy(i => i.SortOrder))
            .FirstOrDefaultAsync(x => x.TopicId == topicId);
        if (t is null) return NotFound();

        var th = t.Theory ?? new GrammarTheory();
        var items = th.Items.OrderBy(i => i.SortOrder).ToList();

        var goldenRules = string.Join("\n", items.Where(i => i.ItemType == "GoldenRule").Select(i => i.Content ?? i.Title ?? ""));
        var quickItems = string.Join("\n", items.Where(i => i.ItemType == "QuickItem").Select(i => $"{i.Title} | {i.Result ?? i.Content}"));
        var formulas = string.Join("\n", items.Where(i => i.ItemType == "Formula").Select(i => i.Content ?? ""));
        var usage = string.Join("\n", items.Where(i => i.ItemType == "Usage").Select(i => $"{i.Title} | {i.Content} | {i.Result}" + (i.IsGreen == true ? " | green" : "")));
        var mistakes = string.Join("\n", items.Where(i => i.ItemType == "Mistake").Select(i => string.IsNullOrEmpty(i.Title) ? (i.Content ?? "") : $"{i.Title}: {i.Content}"));
        var examples = string.Join("\n", items.Where(i => i.ItemType == "Example").Select(i => string.IsNullOrEmpty(i.Result) ? (i.Content ?? "") : $"{i.Content} — {i.Result}"));

        var vm = new GrammarTheoryFormViewModel
        {
            TopicId = t.TopicId,
            TopicTitle = t.Title,
            GoldenRules = goldenRules,
            Summary = th.Summary ?? "",
            QuickIntro = th.QuickIntro ?? "",
            QuickItems = quickItems,
            ModelLeft = th.ModelLeft ?? "",
            ModelRight = th.ModelRight ?? "",
            MentalDescription = th.MentalDescription ?? "",
            Formulas = formulas,
            Usage = usage,
            Mistakes = mistakes,
            Examples = examples
        };

        // Tự động kiểm tra phát hiện lỗi bảng mã tiếng Việt (mojibake)
        bool hasMojibake = IsMojibake(vm.Summary) || IsMojibake(vm.QuickIntro) || IsMojibake(vm.MentalDescription) ||
                           IsMojibake(vm.ModelLeft) || IsMojibake(vm.ModelRight) ||
                           IsMojibake(vm.GoldenRules) || IsMojibake(vm.QuickItems) ||
                           IsMojibake(vm.Formulas) || IsMojibake(vm.Usage) ||
                           IsMojibake(vm.Mistakes) || IsMojibake(vm.Examples);

        if (hasMojibake)
        {
            var seedVm = GetSeedTheory(t.Category?.Code);
            if (seedVm != null)
            {
                vm.GoldenRules = seedVm.GoldenRules;
                vm.Summary = seedVm.Summary;
                vm.QuickIntro = seedVm.QuickIntro;
                vm.QuickItems = seedVm.QuickItems;
                vm.ModelLeft = seedVm.ModelLeft;
                vm.ModelRight = seedVm.ModelRight;
                vm.MentalDescription = seedVm.MentalDescription;
                vm.Formulas = seedVm.Formulas;
                vm.Usage = seedVm.Usage;
                vm.Mistakes = seedVm.Mistakes;
                vm.Examples = seedVm.Examples;
                ViewBag.RepairedFromSeed = true;
            }
        }

        ViewData["Title"] = $"Lý thuyết - {t.Title}";
        return View("~/Areas/Admin/Views/Grammar_management/EditTheory.cshtml", vm);
    }

    [HttpPost, ValidateAntiForgeryToken]
    public async Task<IActionResult> RestoreTheorySeed(int topicId)
    {
        var t = await _context.GrammarTopics
            .Include(x => x.Category)
            .Include(x => x.Theory)
                .ThenInclude(th => th!.Items)
            .FirstOrDefaultAsync(x => x.TopicId == topicId);
        if (t is null) return NotFound();

        var seedVm = GetSeedTheory(t.Category?.Code);
        if (seedVm is null)
        {
            TempData["Error"] = "Không tìm thấy dữ liệu lý thuyết mẫu cho chủ đề này.";
            return RedirectToAction(nameof(EditTheory), new { topicId });
        }

        seedVm.TopicId = topicId;
        seedVm.TopicTitle = t.Title;
        await SaveTheoryInternalAsync(t, seedVm);

        TempData["Success"] = "Đã khôi phục toàn bộ nội dung lý thuyết chuẩn tiếng Việt thành công!";
        return RedirectToAction(nameof(EditTheory), new { topicId });
    }

    [HttpPost, ValidateAntiForgeryToken]
    public async Task<IActionResult> EditTheory(GrammarTheoryFormViewModel model)
    {
        var t = await _context.GrammarTopics
            .Include(x => x.Theory)
                .ThenInclude(th => th!.Items)
            .FirstOrDefaultAsync(x => x.TopicId == model.TopicId);
        if (t is null) return NotFound();

        await SaveTheoryInternalAsync(t, model);
        TempData["Success"] = "Đã lưu lý thuyết thành công.";
        return RedirectToAction(nameof(EditTheory), new { topicId = t.TopicId });
    }

    private async Task SaveTheoryInternalAsync(GrammarTopic t, GrammarTheoryFormViewModel model)
    {
        var th = t.Theory;
        if (th is null)
        {
            th = new GrammarTheory { TopicId = t.TopicId };
            _context.GrammarTheories.Add(th);
            await _context.SaveChangesAsync();
        }

        th.Summary = model.Summary?.Trim();
        th.QuickIntro = model.QuickIntro?.Trim();
        th.ModelLeft = model.ModelLeft?.Trim();
        th.ModelRight = model.ModelRight?.Trim();
        th.MentalDescription = model.MentalDescription?.Trim();
        th.UpdatedAt = DateTime.UtcNow;

        _context.GrammarTheoryItems.RemoveRange(th.Items);

        var sortOrder = 0;
        void AddLines(string? text, string type, Action<string, GrammarTheoryItem> parse)
        {
            if (string.IsNullOrWhiteSpace(text)) return;
            foreach (var line in text.Replace("\r\n", "\n").Split('\n', StringSplitOptions.TrimEntries | StringSplitOptions.RemoveEmptyEntries))
            {
                var item = new GrammarTheoryItem
                {
                    TheoryId = th.TheoryId,
                    ItemType = type,
                    SortOrder = ++sortOrder,
                    IsGreen = false
                };
                parse(line, item);
                _context.GrammarTheoryItems.Add(item);
            }
        }

        AddLines(model.GoldenRules, "GoldenRule", (line, item) => item.Content = line);
        AddLines(model.QuickItems, "QuickItem", (line, item) =>
        {
            var p = line.Split('|', 2, StringSplitOptions.TrimEntries);
            item.Title = p.ElementAtOrDefault(0);
            item.Result = p.ElementAtOrDefault(1);
        });
        AddLines(model.Formulas, "Formula", (line, item) => item.Content = line);
        AddLines(model.Usage, "Usage", (line, item) =>
        {
            var p = line.Split('|', StringSplitOptions.TrimEntries);
            item.Title = p.ElementAtOrDefault(0);
            item.Content = p.ElementAtOrDefault(1);
            item.Result = p.ElementAtOrDefault(2);
            item.IsGreen = string.Equals(p.ElementAtOrDefault(3), "green", StringComparison.OrdinalIgnoreCase);
        });
        AddLines(model.Mistakes, "Mistake", (line, item) =>
        {
            if (line.Contains(':'))
            {
                var p = line.Split(':', 2, StringSplitOptions.TrimEntries);
                item.Title = p.ElementAtOrDefault(0);
                item.Content = p.ElementAtOrDefault(1);
            }
            else
            {
                item.Content = line.Trim();
            }
        });
        AddLines(model.Examples, "Example", (line, item) =>
        {
            if (line.Contains('—'))
            {
                var p = line.Split('—', 2, StringSplitOptions.TrimEntries);
                item.Content = p.ElementAtOrDefault(0);
                item.Result = p.ElementAtOrDefault(1);
            }
            else
            {
                item.Content = line.Trim();
            }
        });

        await _context.SaveChangesAsync();
    }

    // ===== Báo lỗi câu hỏi =====
    [HttpGet]
    public async Task<IActionResult> Reports(bool showResolved = false)
    {
        ViewData["Title"] = "Báo lỗi câu hỏi";
        ViewBag.ShowResolved = showResolved;
        var rows = await _context.QuestionReports.AsNoTracking()
            .Include(r => r.Question).ThenInclude(q => q.Topic)
            .Include(r => r.User)
            .Where(r => showResolved || r.Status != "Resolved")
            .OrderBy(r => r.Status == "Resolved").ThenByDescending(r => r.CreatedAt)
            .Select(r => new GrammarReportRow
            {
                Id = r.ReportId,
                UserName = r.User.FullName,
                TopicTitle = r.Question.Topic.Title,
                TopicId = r.Question.TopicId,
                QuestionId = r.QuestionId,
                QuestionContent = r.Question.Stem,
                Details = r.Details,
                IsResolved = (r.Status == "Resolved"),
                CreatedAt = r.CreatedAt
            })
            .ToListAsync();
        return View(rows);
    }

    [HttpPost, ValidateAntiForgeryToken]
    public async Task<IActionResult> ResolveReport(int id)
    {
        var r = await _context.QuestionReports.FirstOrDefaultAsync(x => x.ReportId == id);
        if (r is not null)
        {
            r.Status = "Resolved";
            r.ResolvedAt = DateTime.UtcNow;
            await _context.SaveChangesAsync();
        }
        return RedirectToAction(nameof(Reports));
    }

    [HttpPost, ValidateAntiForgeryToken]
    public async Task<IActionResult> DeleteReport(int id)
    {
        await _context.QuestionReports.Where(r => r.ReportId == id).ExecuteDeleteAsync();
        return RedirectToAction(nameof(Reports));
    }
}
