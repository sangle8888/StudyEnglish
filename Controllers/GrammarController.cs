using System.Security.Claims;
using System.Text.Json;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using StudyEnglish.Data;
using StudyEnglish.Models.Grammar;
using StudyEnglish.Services;

namespace StudyEnglish.Controllers;

[Authorize(Roles = "Student")]
public class GrammarController : Controller
{
    private readonly AppDbContext _context;
    private readonly GrammarContentService _content;

    public GrammarController(AppDbContext context, GrammarContentService content)
    {
        _context = context;
        _content = content;
    }

    private int? CurrentUserId =>
        int.TryParse(User.FindFirstValue(ClaimTypes.NameIdentifier), out var id) ? id : null;

    [HttpGet]
    public async Task<IActionResult> Index()
    {
        if (CurrentUserId is not int userId) return Challenge();

        var user = await _context.Users.AsNoTracking()
            .Include(u => u.Role)
            .FirstOrDefaultAsync(u => u.UserId == userId);

        if (user != null)
        {
            ViewBag.FullName = user.FullName;
            ViewBag.Email = user.Email;
            ViewBag.Avatar = string.IsNullOrEmpty(user.Avatar) ? "/images/default-avatar.png" : user.Avatar;
            ViewBag.Hometown = user.Hometown ?? "Chưa cập nhật";
            ViewBag.BirthYear = user.BirthYear?.ToString() ?? "Chưa cập nhật";
            ViewBag.JoinedDate = user.CreatedAt.ToString("dd/MM/yyyy");
        }

        var page = await _content.BuildPageAsync(userId);
        ViewBag.GrammarDataJson = JsonSerializer.Serialize(page, new JsonSerializerOptions(JsonSerializerDefaults.Web));
        return View(page);
    }

    public sealed record AnswerRequest(int QuestionId, int SelectedIndex);

    [HttpPost, ValidateAntiForgeryToken]
    public async Task<IActionResult> SubmitAnswer([FromBody] AnswerRequest request)
    {
        if (CurrentUserId is not int userId) return Unauthorized();

        var question = await _context.Questions
            .Include(q => q.Options.OrderBy(o => o.SortOrder))
            .FirstOrDefaultAsync(q => q.QuestionId == request.QuestionId && !q.IsDeleted);
        if (question is null) return NotFound();

        var options = question.Options.OrderBy(o => o.SortOrder).ToList();
        var selectedOption = options.ElementAtOrDefault(request.SelectedIndex);
        var correctIndex = options.FindIndex(o => o.IsCorrect);
        if (correctIndex < 0) correctIndex = 0;
        var isCorrect = selectedOption?.IsCorrect == true;

        // 1. Cập nhật thống kê chủ đề của học viên
        var stat = await _context.UserTopicStats
            .FirstOrDefaultAsync(s => s.UserId == userId && s.TopicId == question.TopicId);
        if (stat is null)
        {
            stat = new UserTopicStat
            {
                UserId = userId,
                TopicId = question.TopicId
            };
            _context.UserTopicStats.Add(stat);
        }

        stat.TotalAttempted++;
        if (isCorrect) stat.CorrectCount++; else stat.WrongCount++;
        stat.AccuracyRate = stat.TotalAttempted > 0 ? (stat.CorrectCount * 100 / stat.TotalAttempted) : 0;
        stat.LastPracticedAt = DateTime.UtcNow;

        // 2. Ghi nhận lượt làm bài vào phiên
        var session = await _context.PracticeSessions
            .OrderByDescending(s => s.SessionId)
            .FirstOrDefaultAsync(s => s.UserId == userId && s.TopicId == question.TopicId && !s.IsCompleted);

        if (session is null)
        {
            session = new PracticeSession
            {
                UserId = userId,
                TopicId = question.TopicId,
                Mode = "Practice",
                TotalQuestions = 1,
                StartedAt = DateTime.UtcNow
            };
            _context.PracticeSessions.Add(session);
            await _context.SaveChangesAsync();
        }

        _context.PracticeAnswers.Add(new PracticeAnswer
        {
            SessionId = session.SessionId,
            QuestionId = question.QuestionId,
            SelectedOptionId = selectedOption?.OptionId,
            IsCorrect = isCorrect,
            AnsweredAt = DateTime.UtcNow
        });

        await _context.SaveChangesAsync();

        return Json(new { isCorrect, correctIndex });
    }

    public sealed record TopicRequest(int TopicId);

    [HttpPost, ValidateAntiForgeryToken]
    public async Task<IActionResult> ResetTopic([FromBody] TopicRequest request)
    {
        if (CurrentUserId is not int userId) return Unauthorized();

        var stat = await _context.UserTopicStats
            .FirstOrDefaultAsync(s => s.UserId == userId && s.TopicId == request.TopicId);
        if (stat != null)
        {
            _context.UserTopicStats.Remove(stat);
        }

        var sessions = await _context.PracticeSessions
            .Where(s => s.UserId == userId && s.TopicId == request.TopicId)
            .ToListAsync();
        var sessionIds = sessions.Select(s => s.SessionId).ToList();

        if (sessionIds.Count > 0)
        {
            await _context.PracticeAnswers
                .Where(pa => sessionIds.Contains(pa.SessionId))
                .ExecuteDeleteAsync();
            await _context.PracticeSessions
                .Where(s => sessionIds.Contains(s.SessionId))
                .ExecuteDeleteAsync();
        }

        await _context.SaveChangesAsync();
        return Json(new { ok = true });
    }

    public sealed record BookmarkRequest(int QuestionId, bool Saved);

    [HttpPost, ValidateAntiForgeryToken]
    public async Task<IActionResult> SetBookmark([FromBody] BookmarkRequest request)
    {
        if (CurrentUserId is not int userId) return Unauthorized();

        var existing = await _context.UserQuestionBookmarks
            .FirstOrDefaultAsync(b => b.UserId == userId && b.QuestionId == request.QuestionId);

        if (request.Saved && existing is null)
        {
            if (!await _context.Questions.AnyAsync(q => q.QuestionId == request.QuestionId)) return NotFound();
            _context.UserQuestionBookmarks.Add(new UserQuestionBookmark
            {
                UserId = userId,
                QuestionId = request.QuestionId,
                CreatedAt = DateTime.UtcNow
            });
            await _context.SaveChangesAsync();
        }
        else if (!request.Saved && existing is not null)
        {
            _context.UserQuestionBookmarks.Remove(existing);
            await _context.SaveChangesAsync();
        }

        return Json(new { ok = true });
    }

    public sealed record NoteRequest(string Topic, string Type, string TypeLabel, string Content, string? SubContent);

    [HttpPost, ValidateAntiForgeryToken]
    public async Task<IActionResult> SaveNote([FromBody] NoteRequest request)
    {
        if (CurrentUserId is not int userId) return Unauthorized();
        if (string.IsNullOrWhiteSpace(request.Content)) return BadRequest();

        var content = request.Content.Trim();
        var item = await _context.GrammarTheoryItems
            .Include(i => i.Theory)
                .ThenInclude(th => th.Topic)
            .FirstOrDefaultAsync(i => i.Content == content);

        if (item is null)
        {
            item = await _context.GrammarTheoryItems
                .Include(i => i.Theory)
                    .ThenInclude(th => th.Topic)
                .FirstOrDefaultAsync(i => i.Content!.Contains(content) || content.Contains(i.Content!));
        }

        if (item != null)
        {
            var existing = await _context.UserTheoryItemBookmarks
                .FirstOrDefaultAsync(b => b.UserId == userId && b.ItemId == item.ItemId);

            if (existing is null)
            {
                _context.UserTheoryItemBookmarks.Add(new UserTheoryItemBookmark
                {
                    UserId = userId,
                    ItemId = item.ItemId,
                    CreatedAt = DateTime.UtcNow
                });
                await _context.SaveChangesAsync();
            }

            return Json(new GrammarNoteDto
            {
                Id = $"n{item.ItemId}",
                Topic = item.Theory?.Topic?.Title ?? request.Topic,
                Type = string.Equals(item.ItemType, "Formula", StringComparison.OrdinalIgnoreCase) ? "formula" : "example",
                TypeLabel = string.Equals(item.ItemType, "Formula", StringComparison.OrdinalIgnoreCase) ? "Công thức" : "Ví dụ",
                Content = item.Content ?? content,
                SubContent = item.Result ?? request.SubContent
            });
        }

        return Json(new { ok = true });
    }

    public sealed record NoteIdRequest(int NoteId);

    [HttpPost, ValidateAntiForgeryToken]
    public async Task<IActionResult> RemoveNote([FromBody] NoteIdRequest request)
    {
        if (CurrentUserId is not int userId) return Unauthorized();

        await _context.UserTheoryItemBookmarks
            .Where(b => b.UserId == userId && b.ItemId == request.NoteId)
            .ExecuteDeleteAsync();
        return Json(new { ok = true });
    }

    public sealed record ReportRequest(int QuestionId, string Details);

    [HttpPost, ValidateAntiForgeryToken]
    public async Task<IActionResult> ReportQuestion([FromBody] ReportRequest request)
    {
        if (CurrentUserId is not int userId) return Unauthorized();
        if (string.IsNullOrWhiteSpace(request.Details)) return BadRequest();
        if (!await _context.Questions.AnyAsync(q => q.QuestionId == request.QuestionId)) return NotFound();

        _context.QuestionReports.Add(new QuestionReport
        {
            QuestionId = request.QuestionId,
            UserId = userId,
            ReportType = "UserGrammarReport",
            Details = request.Details.Trim(),
            Status = "Pending",
            CreatedAt = DateTime.UtcNow
        });
        await _context.SaveChangesAsync();
        return Json(new { ok = true });
    }

    public sealed record TestAnswer(int QuestionId, int? SelectedIndex);

    public sealed record TestRequest(List<TestAnswer> Answers);

    [HttpPost, ValidateAntiForgeryToken]
    public async Task<IActionResult> SubmitMiniTest([FromBody] TestRequest request)
    {
        if (CurrentUserId is not int userId) return Unauthorized();
        if (request.Answers is not { Count: > 0 }) return BadRequest();

        var qIds = request.Answers.Select(a => a.QuestionId).Distinct().ToList();
        var questions = await _context.Questions.AsNoTracking()
            .Where(q => qIds.Contains(q.QuestionId))
            .Include(q => q.Options.OrderBy(o => o.SortOrder))
            .ToListAsync();

        var correctMap = new Dictionary<int, int>();
        foreach (var q in questions)
        {
            var idx = q.Options.OrderBy(o => o.SortOrder).ToList().FindIndex(o => o.IsCorrect);
            correctMap[q.QuestionId] = idx >= 0 ? idx : 0;
        }

        var total = request.Answers.Count;
        var correct = request.Answers.Count(a =>
            a.SelectedIndex.HasValue &&
            correctMap.TryGetValue(a.QuestionId, out var c) &&
            c == a.SelectedIndex.Value);

        var session = new PracticeSession
        {
            UserId = userId,
            Mode = "MiniTest",
            TotalQuestions = total,
            CorrectCount = correct,
            TimeLimitPerQuestion = 60,
            IsCompleted = true,
            StartedAt = DateTime.UtcNow.AddMinutes(-Math.Max(1, total)),
            FinishedAt = DateTime.UtcNow
        };
        _context.PracticeSessions.Add(session);
        await _context.SaveChangesAsync();

        foreach (var a in request.Answers)
        {
            var isAnsCorrect = a.SelectedIndex.HasValue &&
                               correctMap.TryGetValue(a.QuestionId, out var c) &&
                               c == a.SelectedIndex.Value;

            _context.PracticeAnswers.Add(new PracticeAnswer
            {
                SessionId = session.SessionId,
                QuestionId = a.QuestionId,
                IsCorrect = isAnsCorrect,
                AnsweredAt = DateTime.UtcNow
            });
        }
        await _context.SaveChangesAsync();

        return Json(new { total, correct });
    }
}
