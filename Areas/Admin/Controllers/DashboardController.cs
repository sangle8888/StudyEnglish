using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using StudyEnglish.Data;

namespace StudyEnglish.Areas.Admin.Controllers;

[Area("Admin")]
[Authorize(Roles = "Admin")]
public sealed class DashboardController : Controller
{
    private readonly AppDbContext _context;

    public DashboardController(AppDbContext context)
    {
        _context = context;
    }

    public async Task<IActionResult> Index()
    {
        ViewBag.UserCount = await _context.Users.CountAsync();
        ViewBag.ActiveUserCount = await _context.Users.CountAsync(user => user.IsActive);
        ViewBag.RoleCount = await _context.Roles.CountAsync();
        return View();
    }
}
