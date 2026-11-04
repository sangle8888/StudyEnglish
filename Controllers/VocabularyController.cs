using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using StudyEnglish.Data;

namespace StudyEnglish.Controllers;

[Authorize(Roles = "Student")]
public class VocabularyController : Controller
{
    private readonly AppDbContext _context;

    public VocabularyController(AppDbContext context)
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
            var Vocabulary = await _context.Users
                .Include(u => u.Role)
                .FirstOrDefaultAsync(u => u.UserId == userId);

            if (Vocabulary != null)
            {
                ViewBag.FullName = Vocabulary.FullName;
                ViewBag.Email = Vocabulary.Email;
                ViewBag.Avatar = string.IsNullOrEmpty(Vocabulary.Avatar) ? "/images/default-avatar.png" : Vocabulary.Avatar;
                ViewBag.Hometown = Vocabulary.Hometown ?? "Chưa cập nhật";
                ViewBag.BirthYear = Vocabulary.BirthYear?.ToString() ?? "Chưa cập nhật";
                ViewBag.JoinedDate = Vocabulary.CreatedAt.ToString("dd/MM/yyyy");
            }
        }

        return View();
    }
}