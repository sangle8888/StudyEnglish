using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using StudyEnglish.Data;

namespace StudyEnglish.Controllers;

[Authorize(Roles = "Student")]
public class ExamController : Controller
{
    private readonly AppDbContext _context;

    public ExamController(AppDbContext context)
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
            var Exam = await _context.Users
                .Include(u => u.Role)
                .FirstOrDefaultAsync(u => u.UserId == userId);

            if (Exam != null)
            {
                ViewBag.FullName = Exam.FullName;
                ViewBag.Email = Exam.Email;
                ViewBag.Avatar = string.IsNullOrEmpty(Exam.Avatar) ? "/images/default-avatar.png" : Exam.Avatar;
                ViewBag.Hometown = Exam.Hometown ?? "Chưa cập nhật";
                ViewBag.BirthYear = Exam.BirthYear?.ToString() ?? "Chưa cập nhật";
                ViewBag.JoinedDate = Exam.CreatedAt.ToString("dd/MM/yyyy");
            }
        }

        return View();
    }
}