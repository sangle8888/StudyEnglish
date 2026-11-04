using System.Diagnostics;
using Microsoft.AspNetCore.Mvc;
using StudyEnglish.Models;

namespace StudyEnglish.Controllers;

public class HomeController : Controller
{
    public IActionResult Index()
    {
        return View();
    }
}
