using Microsoft.EntityFrameworkCore;
using StudyEnglish.Models;
using StudyEnglish.Models.Grammar;

namespace StudyEnglish.Data;

public class AppDbContext : DbContext
{
    public AppDbContext(DbContextOptions<AppDbContext> options) : base(options) { }

    public DbSet<User> Users => Set<User>();
    public DbSet<Role> Roles => Set<Role>();

    public DbSet<GrammarCategory> GrammarCategories => Set<GrammarCategory>();
    public DbSet<GrammarTopic> GrammarTopics => Set<GrammarTopic>();
    public DbSet<Exam> Exams => Set<Exam>();
    public DbSet<GrammarTopicExam> GrammarTopicExams => Set<GrammarTopicExam>();
    public DbSet<Question> Questions => Set<Question>();
    public DbSet<QuestionOption> QuestionOptions => Set<QuestionOption>();
    public DbSet<GrammarTheory> GrammarTheories => Set<GrammarTheory>();
    public DbSet<GrammarTheoryItem> GrammarTheoryItems => Set<GrammarTheoryItem>();
    public DbSet<UserTopicStat> UserTopicStats => Set<UserTopicStat>();
    public DbSet<UserQuestionBookmark> UserQuestionBookmarks => Set<UserQuestionBookmark>();
    public DbSet<UserTheoryItemBookmark> UserTheoryItemBookmarks => Set<UserTheoryItemBookmark>();
    public DbSet<UserTopicBookmark> UserTopicBookmarks => Set<UserTopicBookmark>();
    public DbSet<PracticeSession> PracticeSessions => Set<PracticeSession>();
    public DbSet<PracticeAnswer> PracticeAnswers => Set<PracticeAnswer>();
    public DbSet<QuestionReport> QuestionReports => Set<QuestionReport>();
    public DbSet<Feedback> Feedbacks => Set<Feedback>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        // Ràng buộc duy nhất cho Email
        modelBuilder.Entity<User>()
            .HasIndex(u => u.Email)
            .IsUnique();

        // Thiết lập mối quan hệ 1 Role có nhiều User
        modelBuilder.Entity<User>()
            .HasOne(u => u.Role)
            .WithMany(r => r.Users)
            .HasForeignKey(u => u.RoleId)
            .OnDelete(DeleteBehavior.Restrict);

        // Khóa chính phức hợp
        modelBuilder.Entity<GrammarTopicExam>()
            .HasKey(te => new { te.TopicId, te.ExamId });

        modelBuilder.Entity<UserTopicStat>()
            .HasKey(uts => new { uts.UserId, uts.TopicId });

        modelBuilder.Entity<UserQuestionBookmark>()
            .HasKey(uqb => new { uqb.UserId, uqb.QuestionId });

        modelBuilder.Entity<UserTheoryItemBookmark>()
            .HasKey(utib => new { utib.UserId, utib.ItemId });

        modelBuilder.Entity<UserTopicBookmark>()
            .HasKey(utb => new { utb.UserId, utb.TopicId });

        modelBuilder.Entity<GrammarTopic>()
            .HasOne(t => t.Theory)
            .WithOne(th => th.Topic)
            .HasForeignKey<GrammarTheory>(th => th.TopicId);

        modelBuilder.Entity<Feedback>()
            .HasOne(f => f.User)
            .WithMany()
            .HasForeignKey(f => f.UserId)
            .OnDelete(DeleteBehavior.SetNull);
    }
}
