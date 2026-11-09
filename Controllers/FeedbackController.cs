using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using StudyEnglish.Data;
using StudyEnglish.Models;

namespace StudyEnglish.Controllers;

[AllowAnonymous]
[IgnoreAntiforgeryToken]
public class FeedbackController : Controller
{
    private readonly AppDbContext _context;
    private static bool _tableEnsured = false;

    public FeedbackController(AppDbContext context)
    {
        _context = context;
    }

    public class FeedbackSubmitRequest
    {
        public string? FeedbackType { get; set; }
        public string? Content { get; set; }
    }

    [HttpPost]
    [Route("/Feedback/Submit")]
    [Route("/api/feedback")]
    public async Task<IActionResult> Submit([FromBody] FeedbackSubmitRequest? request)
    {
        string? feedbackType = request?.FeedbackType;
        string? content = request?.Content;

        if (string.IsNullOrWhiteSpace(content) && Request.HasFormContentType)
        {
            if (Request.Form.ContainsKey("feedbackType")) feedbackType = Request.Form["feedbackType"].ToString();
            if (Request.Form.ContainsKey("content")) content = Request.Form["content"].ToString();
        }

        if (string.IsNullOrWhiteSpace(content))
        {
            return Json(new { success = false, message = "Vui lòng nhập nội dung góp ý." });
        }

        content = content.Trim();
        if (content.Length > 1000)
        {
            return Json(new { success = false, message = "Nội dung góp ý không được vượt quá 1000 ký tự." });
        }

        feedbackType = string.IsNullOrWhiteSpace(feedbackType)
            ? "Đề xuất tính năng mới"
            : feedbackType.Trim();

        int? userId = null;
        int? validUserId = null;
        string? senderName = null;
        string? senderEmail = null;

        try
        {
            if (User.Identity?.IsAuthenticated == true)
            {
                var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
                if (int.TryParse(userIdClaim, out int parsedId))
                {
                    userId = parsedId;
                }

                senderName = User.FindFirst(ClaimTypes.Name)?.Value;
                senderEmail = User.FindFirst(ClaimTypes.Email)?.Value;

                if (userId.HasValue && (string.IsNullOrEmpty(senderName) || string.IsNullOrEmpty(senderEmail)))
                {
                    var user = await _context.Users.FindAsync(userId.Value);
                    if (user != null)
                    {
                        senderName ??= user.FullName;
                        senderEmail ??= user.Email;
                    }
                }
            }

            await EnsureTableCreatedAsync();

            if (userId.HasValue)
            {
                var userExists = await _context.Users.AnyAsync(u => u.UserId == userId.Value);
                if (userExists)
                {
                    validUserId = userId;
                }
            }

            var feedback = new Feedback
            {
                UserId = validUserId,
                FeedbackType = feedbackType,
                Content = content,
                SenderName = string.IsNullOrWhiteSpace(senderName) ? "Người dùng ẩn danh" : senderName,
                SenderEmail = senderEmail,
                Status = "New",
                CreatedAt = DateTime.UtcNow
            };

            _context.Feedbacks.Add(feedback);
            await _context.SaveChangesAsync();

            return Json(new
            {
                success = true,
                message = "Cảm ơn bạn đã đóng góp ý kiến! Ý tưởng của bạn giúp TART tốt hơn mỗi ngày."
            });
        }
        catch (DbUpdateException)
        {
            try
            {
                // Thử chèn trực tiếp bằng Raw SQL để vượt qua các xung đột tracking/model
                await _context.Database.ExecuteSqlRawAsync(
                    @"INSERT INTO dbo.Feedbacks (UserId, FeedbackType, Content, SenderName, SenderEmail, Status, CreatedAt)
                      VALUES ({0}, {1}, {2}, {3}, {4}, {5}, {6})",
                    (object?)validUserId ?? DBNull.Value,
                    feedbackType,
                    content,
                    string.IsNullOrWhiteSpace(senderName) ? "Người dùng ẩn danh" : senderName,
                    (object?)senderEmail ?? DBNull.Value,
                    "New",
                    DateTime.UtcNow
                );

                return Json(new
                {
                    success = true,
                    message = "Cảm ơn bạn đã đóng góp ý kiến! Ý tưởng của bạn giúp TART tốt hơn mỗi ngày."
                });
            }
            catch
            {
                try
                {
                    // Nếu lỗi do ràng buộc khóa ngoại UserId, chèn với UserId = NULL
                    await _context.Database.ExecuteSqlRawAsync(
                        @"INSERT INTO dbo.Feedbacks (UserId, FeedbackType, Content, SenderName, SenderEmail, Status, CreatedAt)
                          VALUES (NULL, {0}, {1}, {2}, {3}, {4}, {5})",
                        feedbackType,
                        content,
                        string.IsNullOrWhiteSpace(senderName) ? "Người dùng ẩn danh" : senderName,
                        (object?)senderEmail ?? DBNull.Value,
                        "New",
                        DateTime.UtcNow
                    );

                    return Json(new
                    {
                        success = true,
                        message = "Cảm ơn bạn đã đóng góp ý kiến! Ý tưởng của bạn giúp TART tốt hơn mỗi ngày."
                    });
                }
                catch (Exception sqlEx)
                {
                    var msg = sqlEx.Message;
                    return Json(new
                    {
                        success = false,
                        message = "Có lỗi xảy ra trong CSDL: " + msg
                    });
                }
            }
        }
        catch (Exception ex)
        {
            var detail = ex.InnerException?.InnerException?.Message 
                      ?? ex.InnerException?.Message 
                      ?? ex.Message;
            return Json(new
            {
                success = false,
                message = "Có lỗi xảy ra: " + detail
            });
        }
    }

    private async Task EnsureTableCreatedAsync()
    {
        if (_tableEnsured) return;
        try
        {
            await _context.Database.ExecuteSqlRawAsync(@"
                -- Nếu bảng Feedbacks cũ không có cột FeedbackId IDENTITY -> Tạo lại bảng chuẩn
                IF EXISTS (SELECT 1 FROM sys.tables WHERE name = 'Feedbacks')
                BEGIN
                    IF NOT EXISTS (
                        SELECT 1 FROM sys.columns c 
                        JOIN sys.tables t ON c.object_id = t.object_id 
                        WHERE t.name = 'Feedbacks' AND c.name = 'FeedbackId' AND c.is_identity = 1
                    )
                    BEGIN
                        DROP TABLE dbo.Feedbacks;
                    END
                END

                IF NOT EXISTS (
                    SELECT 1 FROM sys.tables WHERE name = 'Feedbacks'
                )
                BEGIN
                    CREATE TABLE dbo.Feedbacks (
                        FeedbackId INT IDENTITY(1,1) PRIMARY KEY,
                        UserId INT NULL,
                        FeedbackType NVARCHAR(100) NOT NULL CONSTRAINT DF_Feedbacks_FeedbackType DEFAULT (N'Đề xuất tính năng mới'),
                        Content NVARCHAR(2000) NOT NULL CONSTRAINT DF_Feedbacks_Content DEFAULT (''),
                        SenderName NVARCHAR(150) NULL,
                        SenderEmail NVARCHAR(150) NULL,
                        Status NVARCHAR(50) NOT NULL CONSTRAINT DF_Feedbacks_Status DEFAULT ('New'),
                        AdminNote NVARCHAR(1000) NULL,
                        CreatedAt DATETIME2 NOT NULL CONSTRAINT DF_Feedbacks_CreatedAt DEFAULT (GETUTCDATE()),
                        ResolvedAt DATETIME2 NULL,
                        CONSTRAINT FK_Feedbacks_Users FOREIGN KEY (UserId) REFERENCES dbo.Users(UserId) ON DELETE SET NULL
                    );
                END
                ELSE
                BEGIN
                    -- Đảm bảo UserId cho phép NULL
                    IF EXISTS (
                        SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS 
                        WHERE TABLE_NAME = 'Feedbacks' AND COLUMN_NAME = 'UserId' AND IS_NULLABLE = 'NO'
                    )
                    BEGIN
                        ALTER TABLE dbo.Feedbacks ALTER COLUMN UserId INT NULL;
                    END

                    IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('dbo.Feedbacks') AND name = 'Status')
                    BEGIN
                        ALTER TABLE dbo.Feedbacks ADD Status NVARCHAR(50) NOT NULL CONSTRAINT DF_Feedbacks_Status DEFAULT ('New');
                    END
                    IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('dbo.Feedbacks') AND name = 'FeedbackType')
                    BEGIN
                        ALTER TABLE dbo.Feedbacks ADD FeedbackType NVARCHAR(100) NOT NULL CONSTRAINT DF_Feedbacks_FeedbackType DEFAULT (N'Đề xuất tính năng mới');
                    END
                    IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('dbo.Feedbacks') AND name = 'Content')
                    BEGIN
                        ALTER TABLE dbo.Feedbacks ADD Content NVARCHAR(2000) NOT NULL CONSTRAINT DF_Feedbacks_Content DEFAULT ('');
                    END
                    IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('dbo.Feedbacks') AND name = 'SenderName')
                    BEGIN
                        ALTER TABLE dbo.Feedbacks ADD SenderName NVARCHAR(150) NULL;
                    END
                    IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('dbo.Feedbacks') AND name = 'SenderEmail')
                    BEGIN
                        ALTER TABLE dbo.Feedbacks ADD SenderEmail NVARCHAR(150) NULL;
                    END
                    IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('dbo.Feedbacks') AND name = 'AdminNote')
                    BEGIN
                        ALTER TABLE dbo.Feedbacks ADD AdminNote NVARCHAR(1000) NULL;
                    END
                    IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('dbo.Feedbacks') AND name = 'CreatedAt')
                    BEGIN
                        ALTER TABLE dbo.Feedbacks ADD CreatedAt DATETIME2 NOT NULL CONSTRAINT DF_Feedbacks_CreatedAt DEFAULT (GETUTCDATE());
                    END
                    IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('dbo.Feedbacks') AND name = 'ResolvedAt')
                    BEGIN
                        ALTER TABLE dbo.Feedbacks ADD ResolvedAt DATETIME2 NULL;
                    END
                END

                IF EXISTS (SELECT 1 FROM sys.tables WHERE name = 'Questions')
                BEGIN
                    IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('dbo.Questions') AND name = 'Status')
                    BEGIN
                        ALTER TABLE dbo.Questions ADD Status NVARCHAR(50) NULL;
                    END
                END

                IF EXISTS (SELECT 1 FROM sys.tables WHERE name = 'QuestionReports')
                BEGIN
                    IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('dbo.QuestionReports') AND name = 'Status')
                    BEGIN
                        ALTER TABLE dbo.QuestionReports ADD Status NVARCHAR(50) NULL CONSTRAINT DF_QuestionReports_Status DEFAULT ('New');
                    END
                    IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('dbo.QuestionReports') AND name = 'AdminNote')
                    BEGIN
                        ALTER TABLE dbo.QuestionReports ADD AdminNote NVARCHAR(1000) NULL;
                    END
                    IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('dbo.QuestionReports') AND name = 'ResolvedAt')
                    BEGIN
                        ALTER TABLE dbo.QuestionReports ADD ResolvedAt DATETIME2 NULL;
                    END
                END
            ");
            _tableEnsured = true;
        }
        catch
        {
            // Bỏ qua nếu môi trường không cho phép DDL
        }
    }
}
