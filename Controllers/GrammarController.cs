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

        await EnsureReportTableAsync();

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

    public class ReportRequest
    {
        public int QuestionId { get; set; }
        public string? Details { get; set; }
        public string? Category { get; set; }
    }

    private static bool _reportTableEnsured = false;
    private static readonly SemaphoreSlim _reportLock = new(1, 1);

    private async Task EnsureReportTableAsync()
    {
        if (_reportTableEnsured) return;
        await _reportLock.WaitAsync();
        try
        {
            if (_reportTableEnsured) return;
            await _context.Database.ExecuteSqlRawAsync(@"
                IF NOT EXISTS (SELECT 1 FROM sys.tables WHERE name = 'QuestionReports')
                BEGIN
                    CREATE TABLE dbo.QuestionReports (
                        ReportId INT IDENTITY(1,1) PRIMARY KEY,
                        QuestionId INT NOT NULL,
                        UserId INT NULL,
                        ReportType NVARCHAR(100) NULL,
                        Details NVARCHAR(1000) NOT NULL,
                        Status NVARCHAR(50) NULL CONSTRAINT DF_QuestionReports_Status DEFAULT ('New'),
                        AdminNote NVARCHAR(1000) NULL,
                        CreatedAt DATETIME2 NOT NULL CONSTRAINT DF_QuestionReports_CreatedAt DEFAULT (GETUTCDATE()),
                        ResolvedAt DATETIME2 NULL
                    );
                END
                ELSE
                BEGIN
                    IF EXISTS (SELECT 1 FROM sys.check_constraints WHERE name = 'CK_Reports_Status')
                    BEGIN
                        ALTER TABLE dbo.QuestionReports DROP CONSTRAINT CK_Reports_Status;
                    END
                    IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('dbo.QuestionReports') AND name = 'Status')
                    BEGIN
                        ALTER TABLE dbo.QuestionReports ADD Status NVARCHAR(50) NULL CONSTRAINT DF_QuestionReports_Status DEFAULT ('New');
                    END
                    IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('dbo.QuestionReports') AND name = 'ReportType')
                    BEGIN
                        ALTER TABLE dbo.QuestionReports ADD ReportType NVARCHAR(100) NULL;
                    END
                    IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('dbo.QuestionReports') AND name = 'AdminNote')
                    BEGIN
                        ALTER TABLE dbo.QuestionReports ADD AdminNote NVARCHAR(1000) NULL;
                    END
                    IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('dbo.QuestionReports') AND name = 'ResolvedAt')
                    BEGIN
                        ALTER TABLE dbo.QuestionReports ADD ResolvedAt DATETIME2 NULL;
                    END
                    IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('dbo.QuestionReports') AND name = 'CreatedAt')
                    BEGIN
                        ALTER TABLE dbo.QuestionReports ADD CreatedAt DATETIME2 NOT NULL CONSTRAINT DF_QuestionReports_CreatedAt DEFAULT (GETUTCDATE());
                    END
                END
            ");
            _reportTableEnsured = true;
        }
        catch
        {
            // Bỏ qua nếu môi trường không cho phép DDL
        }
        finally
        {
            _reportLock.Release();
        }
    }

    private async Task<string> GetValidReportStatusAsync()
    {
        try
        {
            var ckDef = await _context.Database.SqlQueryRaw<string>(
                "SELECT definition FROM sys.check_constraints WHERE name = 'CK_Reports_Status'"
            ).FirstOrDefaultAsync();

            if (!string.IsNullOrEmpty(ckDef))
            {
                var matches = System.Text.RegularExpressions.Regex.Matches(ckDef, @"'([^']+)'");
                var allowed = matches.Select(m => m.Groups[1].Value).Distinct().ToList();
                if (allowed.Count > 0)
                {
                    var pref = allowed.FirstOrDefault(a =>
                        string.Equals(a, "New", StringComparison.OrdinalIgnoreCase) ||
                        string.Equals(a, "Open", StringComparison.OrdinalIgnoreCase) ||
                        string.Equals(a, "Pending", StringComparison.OrdinalIgnoreCase));

                    return pref ?? allowed.FirstOrDefault(a => !string.Equals(a, "Resolved", StringComparison.OrdinalIgnoreCase)) ?? allowed[0];
                }
            }
        }
        catch { }

        try
        {
            var existing = await _context.Database.SqlQueryRaw<string>(
                "SELECT TOP 1 Status FROM dbo.QuestionReports WHERE Status IS NOT NULL"
            ).FirstOrDefaultAsync();
            if (!string.IsNullOrEmpty(existing)) return existing;
        }
        catch { }

        return "New";
    }

    [HttpPost, ValidateAntiForgeryToken]
    public async Task<IActionResult> ReportQuestion([FromBody] ReportRequest? request)
    {
        if (request == null)
            return BadRequest(new { ok = false, message = "Dữ liệu không hợp lệ." });

        await EnsureReportTableAsync();

        var category = string.IsNullOrWhiteSpace(request.Category) ? "Sai đáp án" : request.Category.Trim();
        var detailsText = string.IsNullOrWhiteSpace(request.Details)
            ? $"[{category}]"
            : $"[{category}] {request.Details.Trim()}";

        if (detailsText.Length > 1000) detailsText = detailsText[..1000];

        int? userId = CurrentUserId;

        var questionId = request.QuestionId;
        if (questionId <= 0)
        {
            questionId = await _context.Questions.OrderBy(q => q.QuestionId).Select(q => q.QuestionId).FirstOrDefaultAsync();
        }

        var reportStatus = await GetValidReportStatusAsync();

        try
        {
            await _context.Database.ExecuteSqlRawAsync(@"
                INSERT INTO dbo.QuestionReports (QuestionId, UserId, ReportType, Details, Status, CreatedAt)
                VALUES ({0}, {1}, {2}, {3}, {4}, {5})
            ", questionId, (object?)userId ?? DBNull.Value, category, detailsText, reportStatus, DateTime.UtcNow);

            return Json(new { ok = true, message = "Báo lỗi đã được gửi thành công!" });
        }
        catch (Exception ex)
        {
            try
            {
                _context.QuestionReports.Add(new QuestionReport
                {
                    QuestionId = questionId,
                    UserId = userId ?? 1,
                    ReportType = category,
                    Details = detailsText,
                    Status = reportStatus,
                    CreatedAt = DateTime.UtcNow
                });
                await _context.SaveChangesAsync();
                return Json(new { ok = true, message = "Báo lỗi đã được gửi thành công!" });
            }
            catch (Exception innerEx)
            {
                return StatusCode(500, new { ok = false, message = "Không thể lưu báo lỗi: " + (ex.Message ?? innerEx.Message) });
            }
        }
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

        var topicStatMap = new Dictionary<int, UserTopicStat>();
        var userTopicIds = questions.Select(q => q.TopicId).Distinct().ToList();
        var existingStats = await _context.UserTopicStats
            .Where(s => s.UserId == userId && userTopicIds.Contains(s.TopicId))
            .ToListAsync();
        foreach (var s in existingStats)
        {
            topicStatMap[s.TopicId] = s;
        }

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

            if (a.SelectedIndex.HasValue)
            {
                var q = questions.FirstOrDefault(x => x.QuestionId == a.QuestionId);
                if (q != null)
                {
                    if (!topicStatMap.TryGetValue(q.TopicId, out var stat))
                    {
                        stat = new UserTopicStat
                        {
                            UserId = userId,
                            TopicId = q.TopicId
                        };
                        _context.UserTopicStats.Add(stat);
                        topicStatMap[q.TopicId] = stat;
                    }

                    stat.TotalAttempted++;
                    if (isAnsCorrect) stat.CorrectCount++; else stat.WrongCount++;
                    stat.AccuracyRate = stat.TotalAttempted > 0 ? (int)Math.Round((double)(stat.CorrectCount * 100) / stat.TotalAttempted) : 0;
                    stat.LastPracticedAt = DateTime.UtcNow;
                }
            }
        }
        await _context.SaveChangesAsync();

        return Json(new { total, correct });
    }
}
