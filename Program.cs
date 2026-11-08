using Microsoft.AspNetCore.Authentication.Cookies;
using Microsoft.EntityFrameworkCore;
using StudyEnglish.Data; // Thêm namespace chứa AppDbContext

var builder = WebApplication.CreateBuilder(args);

// 1. ĐĂNG KÝ APPDBCONTEXT VÀO CONTAINER (Dòng khắc phục lỗi trên)
builder.Services.AddDbContext<AppDbContext>(options =>
    options.UseSqlServer(builder.Configuration.GetConnectionString("DefaultConnection")));

// 2. Cấu hình Cookie Authentication
builder.Services.AddAuthentication(CookieAuthenticationDefaults.AuthenticationScheme)
    .AddCookie(options =>
    {
        options.LoginPath = "/Login";
        options.AccessDeniedPath = "/Home/AccessDenied";
        options.ExpireTimeSpan = TimeSpan.FromDays(7);
        options.SlidingExpiration = true;
    });

builder.Services.AddScoped<StudyEnglish.Services.GrammarContentService>();
builder.Services.AddAntiforgery(options => options.HeaderName = "RequestVerificationToken");
builder.Services.AddControllersWithViews();

var app = builder.Build();

if (!app.Environment.IsDevelopment())
{
    app.UseExceptionHandler("/Home/Error");
    app.UseHsts();
}

app.UseHttpsRedirection();
app.UseRouting();

// Thứ tự bắt buộc: UseAuthentication trước UseAuthorization
app.UseAuthentication();
app.UseAuthorization();

app.MapStaticAssets();

app.MapControllerRoute(
    name: "areas",
    pattern: "{area:exists}/{controller=Dashboard}/{action=Index}/{id?}")
    .WithStaticAssets();

app.MapControllerRoute(
    name: "default",
    pattern: "{controller=Home}/{action=Index}/{id?}")
    .WithStaticAssets();

// Tự động kiểm tra và thêm cột SortOrder vào bảng Questions nếu chưa tồn tại
try
{
    using var scope = app.Services.CreateScope();
    var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
    db.Database.ExecuteSqlRaw(@"
        IF NOT EXISTS (
            SELECT 1 FROM sys.columns 
            WHERE object_id = OBJECT_ID('dbo.Questions') AND name = 'SortOrder'
        )
        BEGIN
            ALTER TABLE dbo.Questions ADD SortOrder INT NOT NULL CONSTRAINT DF_Questions_SortOrder DEFAULT (1);
        END
    ");
}
catch
{
    // Bỏ qua nếu môi trường không cho phép DDL
}

app.Run();
