using Microsoft.EntityFrameworkCore;
using StudyEnglish.Models;
using StudyEnglish.Models.Grammar;
using StudyEnglish.Models.Vocabulary;

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

    // Phân hệ Từ vựng (Vocabulary Module)
    public DbSet<VocabCategory> VocabCategories => Set<VocabCategory>();
    public DbSet<VocabTopic> VocabTopics => Set<VocabTopic>();
    public DbSet<VocabWord> VocabWords => Set<VocabWord>();
    public DbSet<UserVocabProgress> UserVocabProgresses => Set<UserVocabProgress>();
    public DbSet<VocabPhrasePair> VocabPhrasePairs => Set<VocabPhrasePair>();
    public DbSet<VocabSetting> VocabSettings => Set<VocabSetting>();
    public DbSet<UserPhraseProgress> UserPhraseProgresses => Set<UserPhraseProgress>();

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

        // Quan hệ cho Từ vựng (Vocabulary)
        modelBuilder.Entity<VocabTopic>()
            .HasOne(t => t.Category)
            .WithMany(c => c.Topics)
            .HasForeignKey(t => t.CategoryId)
            .OnDelete(DeleteBehavior.Restrict);

        modelBuilder.Entity<VocabWord>()
            .HasOne(w => w.Topic)
            .WithMany(t => t.Words)
            .HasForeignKey(w => w.TopicId)
            .OnDelete(DeleteBehavior.Cascade);

        modelBuilder.Entity<UserVocabProgress>()
            .HasIndex(p => new { p.UserId, p.WordId })
            .IsUnique();

        modelBuilder.Entity<UserVocabProgress>()
            .HasOne(p => p.User)
            .WithMany()
            .HasForeignKey(p => p.UserId)
            .OnDelete(DeleteBehavior.Cascade);

        modelBuilder.Entity<UserVocabProgress>()
            .HasOne(p => p.Word)
            .WithMany()
            .HasForeignKey(p => p.WordId)
            .OnDelete(DeleteBehavior.Cascade);
    }
}
