using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using StudyEnglish.Data;

namespace StudyEnglish.Controllers;

[Authorize(Roles = "Student")]
public class ReadingController : Controller
{
    private readonly AppDbContext _context;

    public ReadingController(AppDbContext context)
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
            var Reading = await _context.Users
                .Include(u => u.Role)
                .FirstOrDefaultAsync(u => u.UserId == userId);

            if (Reading != null)
            {
                ViewBag.FullName = Reading.FullName;
                ViewBag.Email = Reading.Email;
                ViewBag.Avatar = string.IsNullOrEmpty(Reading.Avatar) ? "/images/default-avatar.png" : Reading.Avatar;
                ViewBag.Hometown = Reading.Hometown ?? "Chưa cập nhật";
                ViewBag.BirthYear = Reading.BirthYear?.ToString() ?? "Chưa cập nhật";
                ViewBag.JoinedDate = Reading.CreatedAt.ToString("dd/MM/yyyy");
            }
        }

        return View();
    }
}