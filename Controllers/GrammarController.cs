using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using StudyEnglish.Data;

namespace StudyEnglish.Controllers;

[Authorize(Roles = "Student")]
public class GrammarController : Controller
{
    private readonly AppDbContext _context;

    public GrammarController(AppDbContext context)
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
            var Grammar = await _context.Users
                .Include(u => u.Role)
                .FirstOrDefaultAsync(u => u.UserId == userId);

            if (Grammar != null)
            {
                ViewBag.FullName = Grammar.FullName;
                ViewBag.Email = Grammar.Email;
                ViewBag.Avatar = string.IsNullOrEmpty(Grammar.Avatar) ? "/images/default-avatar.png" : Grammar.Avatar;
                ViewBag.Hometown = Grammar.Hometown ?? "Chưa cập nhật";
                ViewBag.BirthYear = Grammar.BirthYear?.ToString() ?? "Chưa cập nhật";
                ViewBag.JoinedDate = Grammar.CreatedAt.ToString("dd/MM/yyyy");
            }
        }

        return View();
    }
}