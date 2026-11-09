using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using StudyEnglish.Data;
using StudyEnglish.Models;
using StudyEnglish.Models.ViewModels.Admin;

namespace StudyEnglish.Areas.Admin.Controllers;

[Area("Admin")]
[Authorize(Roles = "Admin")]
public class FeedbackController : Controller
{
    private readonly AppDbContext _context;

    public FeedbackController(AppDbContext context)
    {
        _context = context;
    }

    private static bool _tableEnsured = false;

    private async Task EnsureFeedbackColumnsAsync()
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

    public async Task<IActionResult> Index(string? type, string? status, string? search, int page = 1)
    {
        await EnsureFeedbackColumnsAsync();
        if (page < 1) page = 1;
        const int pageSize = 15;

        // Thống kê tổng quan
        var totalCount = await _context.Feedbacks.CountAsync();
        var newCount = await _context.Feedbacks.CountAsync(f => f.Status == "New");
        var readCount = await _context.Feedbacks.CountAsync(f => f.Status == "Read");
        var resolvedCount = await _context.Feedbacks.CountAsync(f => f.Status == "Resolved");

        var query = _context.Feedbacks.AsNoTracking().AsQueryable();

        // Lọc theo loại góp ý
        if (!string.IsNullOrWhiteSpace(type) && type != "all")
        {
            query = query.Where(f => f.FeedbackType == type);
        }

        // Lọc theo trạng thái
        if (!string.IsNullOrWhiteSpace(status) && status != "all")
        {
            query = query.Where(f => f.Status == status);
        }

        // Tìm kiếm theo từ khóa
        if (!string.IsNullOrWhiteSpace(search))
        {
            var s = search.Trim().ToLower();
            query = query.Where(f => f.Content.ToLower().Contains(s)
                                  || (f.SenderName != null && f.SenderName.ToLower().Contains(s))
                                  || (f.SenderEmail != null && f.SenderEmail.ToLower().Contains(s)));
        }

        var filteredCount = await query.CountAsync();

        var items = await query
            .OrderByDescending(f => f.CreatedAt)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .Select(f => new FeedbackItemViewModel
            {
                FeedbackId = f.FeedbackId,
                UserId = f.UserId,
                FeedbackType = f.FeedbackType,
                Content = f.Content,
                SenderName = f.SenderName ?? "Người dùng",
                SenderEmail = f.SenderEmail,
                Status = f.Status,
                AdminNote = f.AdminNote,
                CreatedAt = f.CreatedAt,
                ResolvedAt = f.ResolvedAt
            })
            .ToListAsync();

        var model = new FeedbackListViewModel
        {
            Items = items,
            TotalCount = filteredCount,
            NewCount = newCount,
            ReadCount = readCount,
            ResolvedCount = resolvedCount,
            CurrentType = type,
            CurrentStatus = status,
            CurrentSearch = search,
            PageIndex = page,
            PageSize = pageSize
        };

        return View(model);
    }

    [HttpGet]
    public async Task<IActionResult> GetDetails(int id)
    {
        var feedback = await _context.Feedbacks
            .Include(f => f.User)
            .FirstOrDefaultAsync(f => f.FeedbackId == id);

        if (feedback == null)
        {
            return NotFound(new { success = false, message = "Không tìm thấy góp ý này." });
        }

        // Nếu là "New", tự động chuyển sang "Read" khi admin mở xem
        if (feedback.Status == "New")
        {
            feedback.Status = "Read";
            await _context.SaveChangesAsync();
        }

        return Json(new
        {
            success = true,
            data = new
            {
                id = feedback.FeedbackId,
                feedbackType = feedback.FeedbackType,
                content = feedback.Content,
                senderName = feedback.SenderName ?? feedback.User?.FullName ?? "Khách ẩn danh",
                senderEmail = feedback.SenderEmail ?? feedback.User?.Email ?? "Chưa cung cấp",
                status = feedback.Status,
                adminNote = feedback.AdminNote ?? "",
                createdAt = feedback.CreatedAt.ToLocalTime().ToString("dd/MM/yyyy HH:mm:ss"),
                resolvedAt = feedback.ResolvedAt?.ToLocalTime().ToString("dd/MM/yyyy HH:mm:ss")
            }
        });
    }

    [HttpPost]
    public async Task<IActionResult> UpdateStatus([FromBody] UpdateFeedbackStatusRequest request)
    {
        if (request == null)
        {
            return BadRequest(new { success = false, message = "Dữ liệu không hợp lệ." });
        }

        var feedback = await _context.Feedbacks.FindAsync(request.FeedbackId);
        if (feedback == null)
        {
            return NotFound(new { success = false, message = "Không tìm thấy góp ý." });
        }

        feedback.Status = request.Status;
        feedback.AdminNote = request.AdminNote;
        if (request.Status == "Resolved")
        {
            feedback.ResolvedAt = DateTime.UtcNow;
        }

        await _context.SaveChangesAsync();

        return Json(new { success = true, message = "Cập nhật trạng thái thành công." });
    }

    [HttpPost]
    public async Task<IActionResult> QuickResolve(int id)
    {
        var feedback = await _context.Feedbacks.FindAsync(id);
        if (feedback == null)
        {
            return NotFound(new { success = false, message = "Không tìm thấy góp ý." });
        }

        feedback.Status = "Resolved";
        feedback.ResolvedAt = DateTime.UtcNow;
        await _context.SaveChangesAsync();

        if (Request.Headers["X-Requested-With"] == "XMLHttpRequest")
        {
            return Json(new { success = true, message = "Đã đánh dấu giải quyết thành công." });
        }

        return RedirectToAction(nameof(Index));
    }

    [HttpPost]
    public async Task<IActionResult> Delete(int id)
    {
        var feedback = await _context.Feedbacks.FindAsync(id);
        if (feedback != null)
        {
            _context.Feedbacks.Remove(feedback);
            await _context.SaveChangesAsync();
        }

        if (Request.Headers["X-Requested-With"] == "XMLHttpRequest")
        {
            return Json(new { success = true, message = "Đã xóa góp ý thành công." });
        }

        TempData["Success"] = "Đã xóa góp ý thành công.";
        return RedirectToAction(nameof(Index));
    }
}
