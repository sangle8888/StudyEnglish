using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using StudyEnglish.Data;

namespace StudyEnglish.Controllers;

[Authorize(Roles = "Student")]
public class LeaderboardController : Controller
{
    private readonly AppDbContext _context;

    public LeaderboardController(AppDbContext context)
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
            var Leaderboard = await _context.Users
                .Include(u => u.Role)
                .FirstOrDefaultAsync(u => u.UserId == userId);

            if (Leaderboard != null)
            {
                ViewBag.FullName = Leaderboard.FullName;
                ViewBag.Email = Leaderboard.Email;
                ViewBag.Avatar = string.IsNullOrEmpty(Leaderboard.Avatar) ? "/images/default-avatar.png" : Leaderboard.Avatar;
                ViewBag.Hometown = Leaderboard.Hometown ?? "Chưa cập nhật";
                ViewBag.BirthYear = Leaderboard.BirthYear?.ToString() ?? "Chưa cập nhật";
                ViewBag.JoinedDate = Leaderboard.CreatedAt.ToString("dd/MM/yyyy");
            }
        }

        return View();
    }
}