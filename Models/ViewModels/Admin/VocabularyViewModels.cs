using System.ComponentModel.DataAnnotations;
using StudyEnglish.Models.Vocabulary;

namespace StudyEnglish.Models.ViewModels.Admin;

public class VocabManagementViewModel
{
    // Thống kê nhanh
    public int TotalCategories { get; set; }
    public int TotalTopics { get; set; }
    public int TotalWords { get; set; }
    public int ActiveWordsCount { get; set; }
    public int InactiveWordsCount { get; set; }

    // Bộ lọc
    public int? SelectedCategoryId { get; set; }
    public int? SelectedTopicId { get; set; }
    public string? SearchQuery { get; set; }
    public string? SelectedLevel { get; set; }
    public string? SelectedPos { get; set; }
    public string? SelectedPhraseCategory { get; set; }
    public string? ActiveTab { get; set; } = "words"; // "words", "topics", "categories", "phrases", "settings", "analytics"

    // Thống kê nhanh bổ sung
    public int TotalPhrases { get; set; }

    // Dữ liệu danh sách
    public List<VocabCategoryRow> Categories { get; set; } = new();
    public List<VocabTopicRow> Topics { get; set; } = new();
    public List<VocabWordRow> Words { get; set; } = new();
    public List<VocabPhrasePairRow> Phrases { get; set; } = new();

    // Cấu hình tính năng & Báo cáo học tập
    public VocabSystemSettingsViewModel Settings { get; set; } = new();
    public VocabAnalyticsViewModel Analytics { get; set; } = new();

    // Phân trang cho Words
    public int PageIndex { get; set; } = 1;
    public int PageSize { get; set; } = 20;
    public int TotalWordsCount { get; set; }
    public int TotalPages => (int)Math.Ceiling((double)TotalWordsCount / PageSize);
}

public class VocabTopicWordsViewModel
{
    public int TopicId { get; set; }
    public int CategoryId { get; set; }
    public string TopicTitle { get; set; } = string.Empty;
    public string CategoryTitle { get; set; } = string.Empty;
    public string CategoryCode { get; set; } = string.Empty;
    public string Level { get; set; } = string.Empty;
    public string? Description { get; set; }
    public string ActiveTab { get; set; } = "flashcards";
    public List<VocabWordRow> Words { get; set; } = new();
    public List<VocabPhrasePairRow> Phrases { get; set; } = new();
    public List<VocabCategoryRow> Categories { get; set; } = new();
    public List<string> CategoryTopics { get; set; } = new();
}

public class VocabCategoryRow
{
    public int CategoryId { get; set; }
    public string Name { get; set; } = string.Empty;
    public string Code { get; set; } = string.Empty;
    public string? Description { get; set; }
    public string? Icon { get; set; }
    public string? Color { get; set; }
    public int SortOrder { get; set; }
    public bool IsActive { get; set; }
    public int TopicCount { get; set; }
    public int WordCount { get; set; }
    public int PhraseCount { get; set; }
}

public class VocabTopicRow
{
    public int TopicId { get; set; }
    public int CategoryId { get; set; }
    public string CategoryName { get; set; } = string.Empty;
    public string? CategoryColor { get; set; }
    public string? Color { get; set; }
    public string Title { get; set; } = string.Empty;
    public string? Code { get; set; }
    public string? Description { get; set; }
    public string? Level { get; set; }
    public string? Icon { get; set; }
    public string? ImageUrl { get; set; }
    public int SortOrder { get; set; }
    public bool IsActive { get; set; }
    public int WordCount { get; set; }
    public int PhraseCount { get; set; }
}

public class VocabWordRow
{
    public int WordId { get; set; }
    public int TopicId { get; set; }
    public string TopicTitle { get; set; } = string.Empty;
    public string CategoryName { get; set; } = string.Empty;
    public string Word { get; set; } = string.Empty;
    public string? PartOfSpeech { get; set; }
    public string? PhoneticUs { get; set; }
    public string? PhoneticUk { get; set; }
    public string Meaning { get; set; } = string.Empty;
    public string? EnglishDefinition { get; set; }
    public string? ExampleSentence { get; set; }
    public string? ExampleMeaning { get; set; }
    public string? Collocations { get; set; }
    public string? Synonyms { get; set; }
    public string? Antonyms { get; set; }
    public string? WordFamily { get; set; }
    public string? MemoryTip { get; set; }
    public string? CommonMistakeWrong { get; set; }
    public string? CommonMistakeRight { get; set; }
    public string? CommonMistakeNote { get; set; }
    public string? QuizDistractorsJson { get; set; }
    public bool UseManualQuiz { get; set; }
    public string? AudioUrl { get; set; }
    public string? ImageUrl { get; set; }
    public int SortOrder { get; set; }
    public bool IsActive { get; set; }
    public DateTime CreatedAt { get; set; }
}

public class VocabWordInputModel
{
    public int WordId { get; set; }

    public int? CategoryId { get; set; }

    [Required(ErrorMessage = "Vui lòng chọn bộ từ / chủ đề")]
    public int TopicId { get; set; }

    [Required(ErrorMessage = "Từ tiếng Anh không được để trống")]
    [MaxLength(150, ErrorMessage = "Từ tiếng Anh tối đa 150 ký tự")]
    public string Word { get; set; } = string.Empty;

    [MaxLength(50)]
    public string? PartOfSpeech { get; set; } = "noun";

    [MaxLength(100)]
    public string? PhoneticUs { get; set; }

    [MaxLength(100)]
    public string? PhoneticUk { get; set; }

    [Required(ErrorMessage = "Nghĩa tiếng Việt không được để trống")]
    [MaxLength(500, ErrorMessage = "Nghĩa tiếng Việt tối đa 500 ký tự")]
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

    [MaxLength(300)]
    public string? CommonMistakeWrong { get; set; }

    [MaxLength(300)]
    public string? CommonMistakeRight { get; set; }

    [MaxLength(500)]
    public string? CommonMistakeNote { get; set; }

    [MaxLength(1500)]
    public string? QuizDistractorsJson { get; set; }

    /// <summary>
    /// Danh sách các nét nghĩa khác của từ (JSON array của VocabWordSense)
    /// </summary>
    public string? SensesJson { get; set; }

    public bool UseManualQuiz { get; set; } = false;

    public int SortOrder { get; set; } = 1;

    public bool IsActive { get; set; } = true;
}

public class VocabTopicInputModel
{
    public int TopicId { get; set; }

    [Required(ErrorMessage = "Vui lòng chọn danh mục cha")]
    public int CategoryId { get; set; }

    [Required(ErrorMessage = "Tiêu đề bộ từ không được để trống")]
    [MaxLength(200, ErrorMessage = "Tiêu đề tối đa 200 ký tự")]
    public string Title { get; set; } = string.Empty;

    [MaxLength(150)]
    public string? Code { get; set; }

    [MaxLength(1000)]
    public string? Description { get; set; }

    [MaxLength(50)]
    public string? Level { get; set; } = "B1";

    [MaxLength(500)]
    public string? ImageUrl { get; set; }

    [MaxLength(100)]
    public string? Icon { get; set; } = "book-open";

    [MaxLength(50)]
    public string? Color { get; set; }

    public int SortOrder { get; set; } = 1;

    public bool IsActive { get; set; } = true;
}

public class VocabCategoryInputModel
{
    public int CategoryId { get; set; }

    [Required(ErrorMessage = "Tên danh mục không được để trống")]
    [MaxLength(150, ErrorMessage = "Tên tối đa 150 ký tự")]
    public string Name { get; set; } = string.Empty;

    [Required(ErrorMessage = "Mã/Slug danh mục không được để trống")]
    [MaxLength(100, ErrorMessage = "Mã tối đa 100 ký tự")]
    public string Code { get; set; } = string.Empty;

    [MaxLength(500)]
    public string? Description { get; set; }

    [MaxLength(100)]
    public string? Icon { get; set; } = "book-open";

    [MaxLength(50)]
    public string? Color { get; set; } = "fuchsia";

    public int SortOrder { get; set; } = 1;

    public bool IsActive { get; set; } = true;
}

public class VocabBulkImportModel
{
    [Required(ErrorMessage = "Vui lòng chọn bộ từ để nạp")]
    public int TopicId { get; set; }

    [Required(ErrorMessage = "Nội dung nhập nhanh không được để trống")]
    public string RawData { get; set; } = string.Empty;
}

public class VocabBulkDeleteWordsModel
{
    public List<int> Ids { get; set; } = new();
}

public class VocabBulkTopicsModel
{
    public List<int> Ids { get; set; } = new();
    public string Action { get; set; } = string.Empty;
}

public class VocabPhrasePairRow
{
    public int PairId { get; set; }
    public string TopicCategory { get; set; } = string.Empty;
    public string? SetTitle { get; set; }
    public string LeftWord { get; set; } = string.Empty;
    public string RightWord { get; set; } = string.Empty;
    public string Meaning { get; set; } = string.Empty;
    public string? SentenceBefore { get; set; }
    public string? SentenceAfter { get; set; }
    public int SortOrder { get; set; }
    public bool IsActive { get; set; }
}

public class VocabPhrasePairInputModel
{
    public int PairId { get; set; }

    [Required(ErrorMessage = "Vui lòng chọn nhóm chủ đề")]
    public string TopicCategory { get; set; } = "business";

    public string? SetTitle { get; set; }

    [Required(ErrorMessage = "Vế 1 không được để trống")]
    public string LeftWord { get; set; } = string.Empty;

    [Required(ErrorMessage = "Vế 2 không được để trống")]
    public string RightWord { get; set; } = string.Empty;

    [Required(ErrorMessage = "Nghĩa tiếng Việt không được để trống")]
    public string Meaning { get; set; } = string.Empty;

    public string? SentenceBefore { get; set; }
    public string? SentenceAfter { get; set; }
    public int SortOrder { get; set; } = 1;
    public bool IsActive { get; set; } = true;
}

public class VocabSystemSettingsViewModel
{
    public bool EnableFlashcards { get; set; } = true;
    public bool EnablePhrases { get; set; } = true;
    public bool EnableReview { get; set; } = true;
    public bool EnableQuiz { get; set; } = true;
    public bool EnableNotebook { get; set; } = true;
    public bool EnableAutoAudio { get; set; } = true;
    public int DailyNewWordsGoal { get; set; } = 10;
    public int QuizQuestionCount { get; set; } = 5;
    public string BannerNotice { get; set; } = "Mỗi ngày 10 từ vựng - Bứt phá điểm số TOEIC và giao tiếp tự tin!";
}

public class VocabAnalyticsViewModel
{
    public int TotalStudentsLearning { get; set; }
    public int TotalWordsMastered { get; set; }
    public int TotalWordsLearning { get; set; }
    public int TotalWordsDueReview { get; set; }
    public int TotalBookmarks { get; set; }
    public List<TopWordStatItem> TopBookmarkedWords { get; set; } = new();
    public List<TopWordStatItem> TopDifficultWords { get; set; } = new();
    public List<TopicProgressStatItem> TopicProgressStats { get; set; } = new();
}

public class TopWordStatItem
{
    public string Word { get; set; } = string.Empty;
    public string Meaning { get; set; } = string.Empty;
    public string? TopicTitle { get; set; }
    public int Count { get; set; }
    public double? AccuracyRate { get; set; }
}

public class TopicProgressStatItem
{
    public string TopicTitle { get; set; } = string.Empty;
    public string CategoryName { get; set; } = string.Empty;
    public int TotalWords { get; set; }
    public int TotalLearners { get; set; }
    public int TotalMasteredCount { get; set; }
    public double MasteredPercentage => TotalWords > 0 && TotalLearners > 0
        ? Math.Min(100.0, Math.Round((double)TotalMasteredCount / (TotalWords * TotalLearners) * 100, 1))
        : 0;
}

