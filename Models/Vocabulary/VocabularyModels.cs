using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace StudyEnglish.Models.Vocabulary;

/// <summary>
/// Danh mục lớn các chủ đề từ vựng (ví dụ: Business & Workplace, Daily Life, Academic, Travel & Dining...)
/// </summary>
public class VocabCategory
{
    [Key]
    public int CategoryId { get; set; }

    [Required(ErrorMessage = "Tên danh mục không được để trống")]
    [MaxLength(150)]
    public string Name { get; set; } = string.Empty;

    [Required(ErrorMessage = "Mã/Slug danh mục không được để trống")]
    [MaxLength(100)]
    public string Code { get; set; } = string.Empty;

    [MaxLength(500)]
    public string? Description { get; set; }

    [MaxLength(100)]
    public string? Icon { get; set; } = "book-open";

    [MaxLength(50)]
    public string? Color { get; set; } = "fuchsia";

    public int SortOrder { get; set; } = 1;

    public bool IsActive { get; set; } = true;

    public bool IsDeleted { get; set; } = false;

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public DateTime? UpdatedAt { get; set; }

    public ICollection<VocabTopic> Topics { get; set; } = new List<VocabTopic>();
}

/// <summary>
/// Bộ từ vựng / Chủ đề cụ thể (ví dụ: Contracts, Marketing, Job Interview, Airport, Restaurant...)
/// </summary>
public class VocabTopic
{
    [Key]
    public int TopicId { get; set; }

    [Required]
    public int CategoryId { get; set; }

    [ForeignKey(nameof(CategoryId))]
    public VocabCategory? Category { get; set; }

    [Required(ErrorMessage = "Tiêu đề bộ từ không được để trống")]
    [MaxLength(200)]
    public string Title { get; set; } = string.Empty;

    [MaxLength(150)]
    public string? Code { get; set; }

    [MaxLength(1000)]
    public string? Description { get; set; }

    [MaxLength(50)]
    public string? Level { get; set; } = "B1"; // A1, A2, B1, B2, C1, C2, TOEIC, IELTS

    [MaxLength(500)]
    public string? ImageUrl { get; set; }

    [MaxLength(100)]
    public string? Icon { get; set; } = "book-open";

    [MaxLength(50)]
    public string? Color { get; set; }

    public int SortOrder { get; set; } = 1;

    public bool IsActive { get; set; } = true;

    public bool IsDeleted { get; set; } = false;

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public DateTime? UpdatedAt { get; set; }

    public ICollection<VocabWord> Words { get; set; } = new List<VocabWord>();
}

/// <summary>
/// Từ vựng chi tiết chuẩn ngữ nghĩa học, bao gồm IPA, loại từ, ví dụ, collocations, họ từ, mẹo nhớ
/// </summary>
public class VocabWord
{
    [Key]
    public int WordId { get; set; }

    [Required]
    public int TopicId { get; set; }

    [ForeignKey(nameof(TopicId))]
    public VocabTopic? Topic { get; set; }

    [Required(ErrorMessage = "Từ vựng tiếng Anh không được để trống")]
    [MaxLength(150)]
    public string Word { get; set; } = string.Empty;

    [MaxLength(50)]
    public string? PartOfSpeech { get; set; } = "noun"; // noun, verb, adjective, adverb, idiom, phrase, phrasal verb

    [MaxLength(100)]
    public string? PhoneticUs { get; set; }

    [MaxLength(100)]
    public string? PhoneticUk { get; set; }

    [Required(ErrorMessage = "Nghĩa tiếng Việt không được để trống")]
    [MaxLength(500)]
    public string Meaning { get; set; } = string.Empty;

    [MaxLength(1000)]
    public string? EnglishDefinition { get; set; }

    [MaxLength(500)]
    public string? AudioUrl { get; set; }

    [MaxLength(500)]
    public string? ImageUrl { get; set; }

    [MaxLength(1000)]
    public string? ExampleSentence { get; set; }

    [MaxLength(1000)]
    public string? ExampleMeaning { get; set; }

    [MaxLength(1000)]
    public string? Collocations { get; set; }

    [MaxLength(500)]
    public string? Synonyms { get; set; }

    [MaxLength(500)]
    public string? Antonyms { get; set; }

    [MaxLength(1000)]
    public string? WordFamily { get; set; }

    [MaxLength(1000)]
    public string? MemoryTip { get; set; }

    [MaxLength(500)]
    public string? CommonMistakeWrong { get; set; }

    [MaxLength(500)]
    public string? CommonMistakeRight { get; set; }

    [MaxLength(1000)]
    public string? CommonMistakeNote { get; set; }

    [MaxLength(1500)]
    public string? QuizDistractorsJson { get; set; }

    /// <summary>
    /// Danh sách các nét nghĩa khác của từ dưới dạng JSON (mỗi nghĩa gồm nghĩa tiếng Việt, định nghĩa tiếng Anh, loại từ, ví dụ, cụm từ đi kèm, đồng nghĩa, trái nghĩa)
    /// </summary>
    public string? SensesJson { get; set; }

    public bool UseManualQuiz { get; set; } = false;

    public int SortOrder { get; set; } = 1;

    public bool IsActive { get; set; } = true;

    public bool IsDeleted { get; set; } = false;

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public DateTime? UpdatedAt { get; set; }
}

/// <summary>
/// Tiến độ học từ của từng học viên (Spaced Repetition, Flashcard, Sổ tay từ vựng)
/// </summary>
public class UserVocabProgress
{
    [Key]
    public int ProgressId { get; set; }

    [Required]
    public int UserId { get; set; }

    [ForeignKey(nameof(UserId))]
    public User? User { get; set; }

    [Required]
    public int WordId { get; set; }

    [ForeignKey(nameof(WordId))]
    public VocabWord? Word { get; set; }

    [MaxLength(50)]
    public string Status { get; set; } = "Learning"; // New, Learning, Mastered, NeedsReview

    public int RepetitionLevel { get; set; } = 0;

    public DateTime? NextReviewDate { get; set; }

    public DateTime? LastReviewedDate { get; set; }

    public int ReviewCount { get; set; } = 0;

    public int CorrectCount { get; set; } = 0;

    public int AgainCount { get; set; } = 0;

    public int TypingFailCount { get; set; } = 0;

    public bool IsBookmarked { get; set; } = false;

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public DateTime? UpdatedAt { get; set; }
}

/// <summary>
/// Cặp cụm từ ghép (Collocations / Phrases) dùng cho tính năng Ghép cụm từ của học viên
/// </summary>
public class VocabPhrasePair
{
    [Key]
    public int PairId { get; set; }

    [Required(ErrorMessage = "Vui lòng chọn hoặc nhập nhóm chủ đề")]
    [MaxLength(100)]
    public string TopicCategory { get; set; } = "business"; // business, toeic, finance, health, travel, dining

    [MaxLength(200)]
    public string? SetTitle { get; set; } // Contracts, Business Planning...

    [Required(ErrorMessage = "Vế 1 (Động từ / Từ ghép trước) không được để trống")]
    [MaxLength(150)]
    public string LeftWord { get; set; } = string.Empty; // meet

    [Required(ErrorMessage = "Vế 2 (Cụm sau) không được để trống")]
    [MaxLength(250)]
    public string RightWord { get; set; } = string.Empty; // deadlines

    [Required(ErrorMessage = "Nghĩa tiếng Việt không được để trống")]
    [MaxLength(300)]
    public string Meaning { get; set; } = string.Empty; // đáp ứng thời hạn

    [MaxLength(500)]
    public string? SentenceBefore { get; set; } // "Careful planning helps employees"

    [MaxLength(500)]
    public string? SentenceAfter { get; set; } // "on important projects."

    public int SortOrder { get; set; } = 1;

    public bool IsActive { get; set; } = true;

    public bool IsDeleted { get; set; } = false;

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public DateTime? UpdatedAt { get; set; }
}

/// <summary>
/// Cấu hình hệ thống và tính năng học từ vựng trên giao diện người dùng
/// </summary>
public class VocabSetting
{
    [Key]
    [MaxLength(100)]
    public string SettingKey { get; set; } = string.Empty;

    [MaxLength(1000)]
    public string SettingValue { get; set; } = string.Empty;

    [MaxLength(300)]
    public string? Description { get; set; }

    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
}

/// <summary>
/// Tiến độ hoàn thành bài ghép cụm từ của học viên
/// </summary>
public class UserPhraseProgress
{
    [Key]
    public int Id { get; set; }

    [Required]
    public int UserId { get; set; }

    [ForeignKey(nameof(UserId))]
    public User? User { get; set; }

    [Required]
    [MaxLength(100)]
    public string TopicCategory { get; set; } = string.Empty;

    [MaxLength(200)]
    public string SetTitle { get; set; } = string.Empty;

    public int CompletedPairsCount { get; set; } = 0;

    public int TotalPairsCount { get; set; } = 0;

    public bool IsCompleted { get; set; } = false;

    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
}

/// <summary>
/// ViewModel chính cho giao diện học Từ vựng của Sinh viên (Views/Vocabulary/Index.cshtml)
/// </summary>
public class StudentVocabIndexViewModel
{
    public string? FullName { get; set; }
    public string? Email { get; set; }
    public string? Avatar { get; set; }

    public int TotalWords { get; set; }
    public int LearnedWords { get; set; }
    public int LearningWords { get; set; }
    public int MasteredWords { get; set; }
    public int DueReviewCount { get; set; }
    public int SavedNotebookCount { get; set; }
    public int NewWordsToday { get; set; }
    public int NewWordsGoal { get; set; } = 10;
    public string NextTopicTitle { get; set; } = "Business Planning";
    public string? BannerNotice { get; set; }

    public int GlobalProgressPercent => TotalWords > 0
        ? Math.Min(100, (int)Math.Round((double)LearnedWords / TotalWords * 100))
        : 0;

    public bool EnableFlashcards { get; set; } = true;
    public bool EnablePhrases { get; set; } = true;
    public bool EnableReview { get; set; } = true;
    public bool EnableQuiz { get; set; } = true;
    public bool EnableNotebook { get; set; } = true;
    public bool EnableAutoAudio { get; set; } = true;

    public List<VocabGroupViewModel> Groups { get; set; } = new();
}

public class VocabGroupViewModel
{
    public string GroupName { get; set; } = string.Empty;
    public string GroupCode { get; set; } = string.Empty;
    public string Color { get; set; } = "fuchsia";
    public string Icon { get; set; } = "book-open";
    public int TotalSets => Sets.Count;
    public List<VocabTopicCardViewModel> Sets { get; set; } = new();
}

public class VocabTopicCardViewModel
{
    public int TopicId { get; set; }
    public string Title { get; set; } = string.Empty;
    public string Code { get; set; } = string.Empty;
    public string GroupCode { get; set; } = string.Empty;
    public string Level { get; set; } = "B1";
    public string Icon { get; set; } = "book-open";
    public string Color { get; set; } = "fuchsia";
    public bool IsLearned { get; set; }
    public int LearnedCount { get; set; }
    public int DueReviewCount { get; set; }
    public int TotalCount { get; set; }
    public int Percent => TotalCount > 0 ? Math.Min(100, (int)Math.Round((double)LearnedCount / TotalCount * 100)) : 0;
    public string StatusBadge => Percent >= 100 ? "Xong" : (LearnedCount > 0 ? "Đang học" : "Mới");
}

public class VocabSenseExample
{
    public string En { get; set; } = string.Empty;
    public string Vi { get; set; } = string.Empty;
}

public class VocabWordSense
{
    public string Meaning { get; set; } = string.Empty;
    public string? PartOfSpeech { get; set; } = "noun";
    public string? EnglishDefinition { get; set; }
    public List<VocabSenseExample>? Examples { get; set; } = new();
    public string? Collocations { get; set; }
    public string? Synonyms { get; set; }
    public string? Antonyms { get; set; }
}


