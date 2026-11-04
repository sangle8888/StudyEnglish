using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using StudyEnglish.Data;

namespace StudyEnglish.Controllers;

[Authorize(Roles = "Student")]
public class ListeningController : Controller
{
    private readonly AppDbContext _context;

    public ListeningController(AppDbContext context)
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
            var Listening = await _context.Users
                .Include(u => u.Role)
                .FirstOrDefaultAsync(u => u.UserId == userId);

            if (Listening != null)
            {
                ViewBag.FullName = Listening.FullName;
                ViewBag.Email = Listening.Email;
                ViewBag.Avatar = string.IsNullOrEmpty(Listening.Avatar) ? "/images/default-avatar.png" : Listening.Avatar;
                ViewBag.Hometown = Listening.Hometown ?? "Chưa cập nhật";
                ViewBag.BirthYear = Listening.BirthYear?.ToString() ?? "Chưa cập nhật";
                ViewBag.JoinedDate = Listening.CreatedAt.ToString("dd/MM/yyyy");
            }
        }

        return View();
    }
}