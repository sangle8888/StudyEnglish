using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace StudyEnglish.Models.Grammar;

[Table("GrammarCategories")]
public class GrammarCategory
{
    [Key]
    public int CategoryId { get; set; }

    [NotMapped]
    public int Id => CategoryId;

    [Required, StringLength(100)]
    public string Code { get; set; } = string.Empty;

    [Required, StringLength(200)]
    public string Title { get; set; } = string.Empty;

    [StringLength(500)]
    public string? Description { get; set; }

    [StringLength(50)]
    public string? Icon { get; set; }

    public int SortOrder { get; set; }

    public bool IsActive { get; set; } = true;

    public bool IsDeleted { get; set; }

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public int? CreatedBy { get; set; }

    public DateTime? UpdatedAt { get; set; }

    public int? UpdatedBy { get; set; }

    public virtual ICollection<GrammarTopic> Topics { get; set; } = new List<GrammarTopic>();
}

[Table("GrammarTopics")]
public class GrammarTopic
{
    [Key]
    public int TopicId { get; set; }

    [NotMapped]
    public int Id => TopicId;

    public int CategoryId { get; set; }

    [Required, StringLength(200)]
    public string Title { get; set; } = string.Empty;

    [StringLength(200)]
    public string Slug { get; set; } = string.Empty;

    [StringLength(500)]
    public string? Description { get; set; }

    public int SortOrder { get; set; }

    public bool IsActive { get; set; } = true;

    public bool IsDeleted { get; set; }

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public int? CreatedBy { get; set; }

    public DateTime? UpdatedAt { get; set; }

    public int? UpdatedBy { get; set; }

    [ForeignKey(nameof(CategoryId))]
    public virtual GrammarCategory Category { get; set; } = null!;

    public virtual ICollection<Question> Questions { get; set; } = new List<Question>();

    public virtual GrammarTheory? Theory { get; set; }

    public virtual ICollection<GrammarTopicExam> TopicExams { get; set; } = new List<GrammarTopicExam>();
}

[Table("Exams")]
public class Exam
{
    [Key]
    public int ExamId { get; set; }

    [Required, StringLength(50)]
    public string Code { get; set; } = string.Empty;

    [Required, StringLength(200)]
    public string Name { get; set; } = string.Empty;

    [StringLength(500)]
    public string? Description { get; set; }

    public bool IsActive { get; set; } = true;

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public virtual ICollection<GrammarTopicExam> TopicExams { get; set; } = new List<GrammarTopicExam>();
}

[Table("GrammarTopicExams")]
public class GrammarTopicExam
{
    public int TopicId { get; set; }
    public int ExamId { get; set; }

    [ForeignKey(nameof(TopicId))]
    public virtual GrammarTopic Topic { get; set; } = null!;

    [ForeignKey(nameof(ExamId))]
    public virtual Exam Exam { get; set; } = null!;
}

[Table("Questions")]
public class Question
{
    [Key]
    public int QuestionId { get; set; }

    [NotMapped]
    public int Id => QuestionId;

    public int TopicId { get; set; }

    [Required, StringLength(1000)]
    public string Stem { get; set; } = string.Empty;

    [StringLength(1000)]
    public string? StemVi { get; set; }

    [StringLength(1000)]
    public string? ContextNote { get; set; }

    [StringLength(1000)]
    public string? RuleNote { get; set; }

    [StringLength(1000)]
    public string? ShortExplanation { get; set; }

    public byte Difficulty { get; set; } = 1;

    [StringLength(50)]
    public string? Status { get; set; }

    public int SortOrder { get; set; } = 1;

    public bool IsDeleted { get; set; }

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public int? CreatedBy { get; set; }

    public DateTime? UpdatedAt { get; set; }

    public int? UpdatedBy { get; set; }

    [ForeignKey(nameof(TopicId))]
    public virtual GrammarTopic Topic { get; set; } = null!;

    public virtual ICollection<QuestionOption> Options { get; set; } = new List<QuestionOption>();
}

[Table("QuestionOptions")]
public class QuestionOption
{
    [Key]
    public int OptionId { get; set; }

    public int QuestionId { get; set; }

    public byte SortOrder { get; set; }

    [Required, StringLength(500)]
    public string Content { get; set; } = string.Empty;

    [StringLength(500)]
    public string? ContentVi { get; set; }

    public bool IsCorrect { get; set; }

    [StringLength(1000)]
    public string? WhyWrong { get; set; }

    [ForeignKey(nameof(QuestionId))]
    public virtual Question Question { get; set; } = null!;
}

[Table("GrammarTheories")]
public class GrammarTheory
{
    [Key]
    public int TheoryId { get; set; }

    public int TopicId { get; set; }

    public string? Summary { get; set; }

    public string? QuickIntro { get; set; }

    [StringLength(200)]
    public string? ModelLeft { get; set; }

    [StringLength(200)]
    public string? ModelRight { get; set; }

    public string? MentalDescription { get; set; }

    public DateTime? UpdatedAt { get; set; }

    public int? UpdatedBy { get; set; }

    [ForeignKey(nameof(TopicId))]
    public virtual GrammarTopic Topic { get; set; } = null!;

    public virtual ICollection<GrammarTheoryItem> Items { get; set; } = new List<GrammarTheoryItem>();
}

[Table("GrammarTheoryItems")]
public class GrammarTheoryItem
{
    [Key]
    public int ItemId { get; set; }

    public int TheoryId { get; set; }

    [Required, StringLength(50)]
    public string ItemType { get; set; } = string.Empty;

    public int SortOrder { get; set; }

    public string? Title { get; set; }

    public string? Content { get; set; }

    public string? Result { get; set; }

    public bool IsGreen { get; set; } = false;

    [ForeignKey(nameof(TheoryId))]
    public virtual GrammarTheory Theory { get; set; } = null!;
}

[Table("UserTopicStats")]
public class UserTopicStat
{
    public int UserId { get; set; }

    public int TopicId { get; set; }

    public int TotalAttempted { get; set; }

    public int CorrectCount { get; set; }

    public int WrongCount { get; set; }

    public int AccuracyRate { get; set; }

    public DateTime? LastPracticedAt { get; set; }

    [ForeignKey(nameof(UserId))]
    public virtual User User { get; set; } = null!;

    [ForeignKey(nameof(TopicId))]
    public virtual GrammarTopic Topic { get; set; } = null!;
}

[Table("UserQuestionBookmarks")]
public class UserQuestionBookmark
{
    public int UserId { get; set; }

    public int QuestionId { get; set; }

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    [ForeignKey(nameof(UserId))]
    public virtual User User { get; set; } = null!;

    [ForeignKey(nameof(QuestionId))]
    public virtual Question Question { get; set; } = null!;
}

[Table("UserTheoryItemBookmarks")]
public class UserTheoryItemBookmark
{
    public int UserId { get; set; }

    public int ItemId { get; set; }

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    [ForeignKey(nameof(UserId))]
    public virtual User User { get; set; } = null!;

    [ForeignKey(nameof(ItemId))]
    public virtual GrammarTheoryItem Item { get; set; } = null!;
}

[Table("UserTopicBookmarks")]
public class UserTopicBookmark
{
    public int UserId { get; set; }

    public int TopicId { get; set; }

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    [ForeignKey(nameof(UserId))]
    public virtual User User { get; set; } = null!;

    [ForeignKey(nameof(TopicId))]
    public virtual GrammarTopic Topic { get; set; } = null!;
}

[Table("PracticeSessions")]
public class PracticeSession
{
    [Key]
    public long SessionId { get; set; }

    public int UserId { get; set; }

    [StringLength(50)]
    public string? Mode { get; set; }

    public int? TopicId { get; set; }

    public int? CategoryId { get; set; }

    public int TotalQuestions { get; set; }

    public int CorrectCount { get; set; }

    public int TimeLimitPerQuestion { get; set; }

    public bool IsCompleted { get; set; }

    public DateTime StartedAt { get; set; } = DateTime.UtcNow;

    public DateTime? FinishedAt { get; set; }

    [ForeignKey(nameof(UserId))]
    public virtual User User { get; set; } = null!;

    public virtual ICollection<PracticeAnswer> Answers { get; set; } = new List<PracticeAnswer>();
}

[Table("PracticeAnswers")]
public class PracticeAnswer
{
    [Key]
    public long AnswerId { get; set; }

    public long SessionId { get; set; }

    public int QuestionId { get; set; }

    public int? SelectedOptionId { get; set; }

    public bool IsCorrect { get; set; }

    public int? TimeSpentSeconds { get; set; }

    public DateTime AnsweredAt { get; set; } = DateTime.UtcNow;

    [ForeignKey(nameof(SessionId))]
    public virtual PracticeSession Session { get; set; } = null!;

    [ForeignKey(nameof(QuestionId))]
    public virtual Question Question { get; set; } = null!;
}

[Table("QuestionReports")]
public class QuestionReport
{
    [Key]
    public int ReportId { get; set; }

    public int QuestionId { get; set; }

    public int UserId { get; set; }

    [StringLength(100)]
    public string? ReportType { get; set; }

    [Required, StringLength(1000)]
    public string Details { get; set; } = string.Empty;

    [StringLength(50)]
    public string? Status { get; set; }

    [StringLength(1000)]
    public string? AdminNote { get; set; }

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public DateTime? ResolvedAt { get; set; }

    [ForeignKey(nameof(QuestionId))]
    public virtual Question Question { get; set; } = null!;

    [ForeignKey(nameof(UserId))]
    public virtual User User { get; set; } = null!;
}
