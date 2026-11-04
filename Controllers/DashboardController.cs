using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using StudyEnglish.Data;
using StudyEnglish.Models.ViewModels;

namespace StudyEnglish.Controllers;

[Authorize(Roles = "Student")]
public class DashboardController : Controller
{
    private readonly AppDbContext _context;

    public DashboardController(AppDbContext context)
    {
        _context = context;
    }

    [HttpGet]
    public async Task<IActionResult> Index()
    {
        // Lấy UserId từ Cookie Claims đã lưu lúc đăng nhập
        var userIdStr = User.FindFirstValue(ClaimTypes.NameIdentifier);

        if (int.TryParse(userIdStr, out int userId))
        {
            var dashboardUser = await _context.Users
                .AsNoTracking()
                .FirstOrDefaultAsync(u => u.UserId == userId);

            if (dashboardUser != null)
            {
                return View(new StudentDashboardViewModel
                {
                    FullName = dashboardUser.FullName,
                    Email = dashboardUser.Email,
                    Avatar = string.IsNullOrEmpty(dashboardUser.Avatar)
                        ? "/images/default-avatar.png"
                        : dashboardUser.Avatar,
                    Hometown = dashboardUser.Hometown ?? "Chưa cập nhật",
                    BirthYear = dashboardUser.BirthYear?.ToString() ?? "Chưa cập nhật",
                    JoinedDate = dashboardUser.CreatedAt.ToString("dd/MM/yyyy")
                });
            }
        }

        return View(new StudentDashboardViewModel
        {
            FullName = User.Identity?.Name ?? "Học viên",
            Email = string.Empty
        });
    }
}