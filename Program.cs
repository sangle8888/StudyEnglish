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

    // Mở rộng độ dài cột Title và Result của bảng GrammarTheoryItems lên NVARCHAR(1000)
    db.Database.ExecuteSqlRaw(@"
        IF EXISTS (
            SELECT 1 FROM sys.columns 
            WHERE object_id = OBJECT_ID('dbo.GrammarTheoryItems') AND name = 'Title' AND max_length < 2000 AND max_length > 0
        )
        BEGIN
            ALTER TABLE dbo.GrammarTheoryItems ALTER COLUMN Title NVARCHAR(1000) NULL;
        END

        IF EXISTS (
            SELECT 1 FROM sys.columns 
            WHERE object_id = OBJECT_ID('dbo.GrammarTheoryItems') AND name = 'Result' AND max_length < 2000 AND max_length > 0
        )
        BEGIN
            ALTER TABLE dbo.GrammarTheoryItems ALTER COLUMN Result NVARCHAR(1000) NULL;
        END
    ");

    // Tự động kiểm tra và đảm bảo cột UpdatedAt cho bảng GrammarTheories không bị lỗi NOT NULL
    db.Database.ExecuteSqlRaw(@"
        IF EXISTS (SELECT 1 FROM sys.tables WHERE name = 'GrammarTheories')
        BEGIN
            IF EXISTS (
                SELECT 1 FROM sys.columns 
                WHERE object_id = OBJECT_ID('dbo.GrammarTheories') AND name = 'UpdatedAt' AND is_nullable = 0
            )
            BEGIN
                ALTER TABLE dbo.GrammarTheories ALTER COLUMN UpdatedAt DATETIME2 NULL;
            END

            IF NOT EXISTS (
                SELECT 1 FROM sys.default_constraints dc 
                JOIN sys.columns c ON dc.parent_object_id = c.object_id AND dc.parent_column_id = c.column_id 
                WHERE dc.parent_object_id = OBJECT_ID('dbo.GrammarTheories') AND c.name = 'UpdatedAt'
            )
            BEGIN
                ALTER TABLE dbo.GrammarTheories ADD CONSTRAINT DF_GrammarTheories_UpdatedAt DEFAULT (GETUTCDATE()) FOR UpdatedAt;
            END
        END
    ");
    // Tự động kiểm tra và tạo bảng Feedbacks / thêm các cột thiếu nếu chưa tồn tại
    db.Database.ExecuteSqlRaw(@"
        IF EXISTS (SELECT 1 FROM sys.tables WHERE name = 'Feedbacks')
        BEGIN
            IF NOT EXISTS (
                SELECT 1 FROM sys.columns c 
                JOIN sys.tables t ON c.object_id = t.object_id 
                WHERE t.name = 'Feedbacks' AND c.name = 'FeedbackId' AND c.is_identity = 1
            )
            BEGIN
                DROP TABLE dbo.Feedbacks;
            END
        END

        IF NOT EXISTS (
            SELECT 1 FROM sys.tables WHERE name = 'Feedbacks'
        )
        BEGIN
            CREATE TABLE dbo.Feedbacks (
                FeedbackId INT IDENTITY(1,1) PRIMARY KEY,
                UserId INT NULL,
                FeedbackType NVARCHAR(100) NOT NULL CONSTRAINT DF_Feedbacks_FeedbackType DEFAULT (N'Đề xuất tính năng mới'),
                Content NVARCHAR(2000) NOT NULL CONSTRAINT DF_Feedbacks_Content DEFAULT (''),
                SenderName NVARCHAR(150) NULL,
                SenderEmail NVARCHAR(150) NULL,
                Status NVARCHAR(50) NOT NULL CONSTRAINT DF_Feedbacks_Status DEFAULT ('New'),
                AdminNote NVARCHAR(1000) NULL,
                CreatedAt DATETIME2 NOT NULL CONSTRAINT DF_Feedbacks_CreatedAt DEFAULT (GETUTCDATE()),
                ResolvedAt DATETIME2 NULL,
                CONSTRAINT FK_Feedbacks_Users FOREIGN KEY (UserId) REFERENCES dbo.Users(UserId) ON DELETE SET NULL
            );
        END
        ELSE
        BEGIN
            IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('dbo.Feedbacks') AND name = 'Status')
            BEGIN
                ALTER TABLE dbo.Feedbacks ADD Status NVARCHAR(50) NOT NULL CONSTRAINT DF_Feedbacks_Status DEFAULT ('New');
            END
            IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('dbo.Feedbacks') AND name = 'FeedbackType')
            BEGIN
                ALTER TABLE dbo.Feedbacks ADD FeedbackType NVARCHAR(100) NOT NULL CONSTRAINT DF_Feedbacks_FeedbackType DEFAULT (N'Đề xuất tính năng mới');
            END
            IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('dbo.Feedbacks') AND name = 'Content')
            BEGIN
                ALTER TABLE dbo.Feedbacks ADD Content NVARCHAR(2000) NOT NULL CONSTRAINT DF_Feedbacks_Content DEFAULT ('');
            END
            IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('dbo.Feedbacks') AND name = 'SenderName')
            BEGIN
                ALTER TABLE dbo.Feedbacks ADD SenderName NVARCHAR(150) NULL;
            END
            IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('dbo.Feedbacks') AND name = 'SenderEmail')
            BEGIN
                ALTER TABLE dbo.Feedbacks ADD SenderEmail NVARCHAR(150) NULL;
            END
            IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('dbo.Feedbacks') AND name = 'AdminNote')
            BEGIN
                ALTER TABLE dbo.Feedbacks ADD AdminNote NVARCHAR(1000) NULL;
            END
            IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('dbo.Feedbacks') AND name = 'CreatedAt')
            BEGIN
                ALTER TABLE dbo.Feedbacks ADD CreatedAt DATETIME2 NOT NULL CONSTRAINT DF_Feedbacks_CreatedAt DEFAULT (GETUTCDATE());
            END
            IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('dbo.Feedbacks') AND name = 'ResolvedAt')
            BEGIN
                ALTER TABLE dbo.Feedbacks ADD ResolvedAt DATETIME2 NULL;
            END
        END

        IF EXISTS (SELECT 1 FROM sys.tables WHERE name = 'Questions')
        BEGIN
            IF EXISTS (SELECT 1 FROM sys.check_constraints WHERE name = 'CK_Questions_Status')
            BEGIN
                ALTER TABLE dbo.Questions DROP CONSTRAINT CK_Questions_Status;
            END

            IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('dbo.Questions') AND name = 'Status')
            BEGIN
                ALTER TABLE dbo.Questions ADD Status NVARCHAR(50) NULL;
            END

            IF EXISTS (
                SELECT 1 FROM sys.columns 
                WHERE object_id = OBJECT_ID('dbo.Questions') AND name = 'UpdatedAt' AND is_nullable = 0
            )
            BEGIN
                ALTER TABLE dbo.Questions ALTER COLUMN UpdatedAt DATETIME2 NULL;
            END

            IF NOT EXISTS (
                SELECT 1 FROM sys.default_constraints dc 
                JOIN sys.columns c ON dc.parent_object_id = c.object_id AND dc.parent_column_id = c.column_id 
                WHERE dc.parent_object_id = OBJECT_ID('dbo.Questions') AND c.name = 'UpdatedAt'
            )
            BEGIN
                ALTER TABLE dbo.Questions ADD CONSTRAINT DF_Questions_UpdatedAt DEFAULT (GETUTCDATE()) FOR UpdatedAt;
            END
        END

        IF NOT EXISTS (SELECT 1 FROM sys.tables WHERE name = 'QuestionReports')
        BEGIN
            CREATE TABLE dbo.QuestionReports (
                ReportId INT IDENTITY(1,1) PRIMARY KEY,
                QuestionId INT NOT NULL,
                UserId INT NULL,
                ReportType NVARCHAR(100) NULL,
                Details NVARCHAR(1000) NOT NULL,
                Status NVARCHAR(50) NULL CONSTRAINT DF_QuestionReports_Status DEFAULT ('Pending'),
                AdminNote NVARCHAR(1000) NULL,
                CreatedAt DATETIME2 NOT NULL CONSTRAINT DF_QuestionReports_CreatedAt DEFAULT (GETUTCDATE()),
                ResolvedAt DATETIME2 NULL
            );
        END
        ELSE
        BEGIN
            IF EXISTS (SELECT 1 FROM sys.check_constraints WHERE name = 'CK_Reports_Status')
            BEGIN
                ALTER TABLE dbo.QuestionReports DROP CONSTRAINT CK_Reports_Status;
            END
            IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('dbo.QuestionReports') AND name = 'Status')
            BEGIN
                ALTER TABLE dbo.QuestionReports ADD Status NVARCHAR(50) NULL CONSTRAINT DF_QuestionReports_Status DEFAULT ('New');
            END
            IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('dbo.QuestionReports') AND name = 'ReportType')
            BEGIN
                ALTER TABLE dbo.QuestionReports ADD ReportType NVARCHAR(100) NULL;
            END
            IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('dbo.QuestionReports') AND name = 'AdminNote')
            BEGIN
                ALTER TABLE dbo.QuestionReports ADD AdminNote NVARCHAR(1000) NULL;
            END
            IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('dbo.QuestionReports') AND name = 'ResolvedAt')
            BEGIN
                ALTER TABLE dbo.QuestionReports ADD ResolvedAt DATETIME2 NULL;
            END
            IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('dbo.QuestionReports') AND name = 'CreatedAt')
            BEGIN
                ALTER TABLE dbo.QuestionReports ADD CreatedAt DATETIME2 NOT NULL CONSTRAINT DF_QuestionReports_CreatedAt DEFAULT (GETUTCDATE());
            END
        END

        IF EXISTS (SELECT 1 FROM sys.tables WHERE name = 'GrammarTopics')
        BEGIN
            IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('dbo.GrammarTopics') AND name = 'Icon')
            BEGIN
                ALTER TABLE dbo.GrammarTopics ADD Icon NVARCHAR(100) NULL CONSTRAINT DF_GrammarTopics_Icon DEFAULT ('book-open');
            END
            EXEC(N'UPDATE dbo.GrammarTopics SET Icon = ''book-open'' WHERE Icon IS NULL OR Icon = ''''');
        END
    ");
}
catch
{
    // Bỏ qua nếu môi trường không cho phép DDL
}

app.Run();
