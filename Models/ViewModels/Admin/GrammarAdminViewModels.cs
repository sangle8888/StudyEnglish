using System.ComponentModel.DataAnnotations;
using StudyEnglish.Models.Grammar;

namespace StudyEnglish.Models.ViewModels.Admin;

public class GrammarIndexViewModel
{
    public List<GrammarCategoryRow> Categories { get; set; } = [];
    public int? SelectedCategoryId { get; set; }
    public List<GrammarTopicRow> Topics { get; set; } = [];
    public int TotalTopics { get; set; }
    public int TotalQuestions { get; set; }
    public int OpenReports { get; set; }
}

public class GrammarCategoryRow
{
    public int Id { get; set; }
    public string Title { get; set; } = "";
    public string Slug { get; set; } = "";
    public int SortOrder { get; set; }
    public bool IsActive { get; set; }
    public bool HasTheory { get; set; }
    public int TopicCount { get; set; }
}

public class GrammarTopicRow
{
    public int Id { get; set; }
    public int CategoryId { get; set; }
    public string CategoryTitle { get; set; } = "";
    public string Title { get; set; } = "";
    public string ExamLabel { get; set; } = "";
    public int SortOrder { get; set; }
    public bool IsActive { get; set; }
    public int QuestionCount { get; set; }
}

public class GrammarCategoryFormViewModel
{
    public int Id { get; set; }

    [Required(ErrorMessage = "Mã (code) là bắt buộc"), StringLength(100)]
    [RegularExpression("^[a-z0-9-]+$", ErrorMessage = "Chỉ dùng chữ thường không dấu, số và dấu gạch ngang")]
    [Display(Name = "Mã danh mục (code)")]
    public string Slug { get; set; } = "";

    [Required(ErrorMessage = "Tiêu đề là bắt buộc"), StringLength(200)]
    [Display(Name = "Tiêu đề")]
    public string Title { get; set; } = "";

    [StringLength(500)]
    [Display(Name = "Mô tả")]
    public string? Description { get; set; }

    [Required, StringLength(50)]
    [Display(Name = "Biểu tượng (Font Awesome)")]
    public string Icon { get; set; } = "fa-book-open";

    [Display(Name = "Thứ tự")]
    public int SortOrder { get; set; }

    [Display(Name = "Hiển thị")]
    public bool IsActive { get; set; } = true;
}

public class GrammarTopicFormViewModel
{
    public int Id { get; set; }

    [Display(Name = "Nhóm chủ đề")]
    public int CategoryId { get; set; }

    [Required(ErrorMessage = "Tên chủ đề là bắt buộc"), StringLength(200)]
    [Display(Name = "Tên chủ đề")]
    public string Title { get; set; } = "";

    [Required, StringLength(50)]
    [Display(Name = "Kỳ thi")]
    public string ExamLabel { get; set; } = "TOEIC · VSTEP";

    [Display(Name = "Thứ tự")]
    public int SortOrder { get; set; }

    [Display(Name = "Hiển thị")]
    public bool IsActive { get; set; } = true;

    public List<GrammarCategory> Categories { get; set; } = [];
}

public class GrammarQuestionListViewModel
{
    public int TopicId { get; set; }
    public int CategoryId { get; set; }
    public string TopicTitle { get; set; } = "";
    public string CategoryTitle { get; set; } = "";
    public List<Question> Questions { get; set; } = [];
}

public class GrammarQuestionFormViewModel
{
    public int Id { get; set; }
    public int TopicId { get; set; }
    public string TopicTitle { get; set; } = "";

    [Required(ErrorMessage = "Nội dung câu hỏi là bắt buộc"), StringLength(1000)]
    [Display(Name = "Câu hỏi (dùng ___ cho chỗ trống)")]
    public string Content { get; set; } = "";

    [StringLength(1000)]
    [Display(Name = "Bản dịch tiếng Việt")]
    public string? ContentVi { get; set; }

    [Range(0, 3)]
    [Display(Name = "Đáp án đúng")]
    public int CorrectPosition { get; set; }

    [StringLength(1000)]
    [Display(Name = "Giải thích đáp án đúng")]
    public string? Explanation { get; set; }

    [StringLength(1000)]
    [Display(Name = "Vị trí chỗ trống / ngữ cảnh")]
    public string? ReasoningContext { get; set; }

    [StringLength(1000)]
    [Display(Name = "Ngữ pháp cần nhớ")]
    public string? Rule { get; set; }

    // CÁCH SUY LUẬN LINH HOẠT (TIÊU CHÍ CÓ THỂ CHỈNH SỬA / THÊM BỚT)
    public List<GrammarReasoningStepInputModel> ReasoningSteps { get; set; } = [];

    [Display(Name = "Độ khó")]
    public byte Difficulty { get; set; } = 1;

    [Display(Name = "Trạng thái")]
    public string? Status { get; set; }

    [Display(Name = "Thứ tự")]
    public int SortOrder { get; set; }

    [Display(Name = "Hiển thị")]
    public bool IsActive { get; set; } = true;

    public string[] OptionTexts { get; set; } = new string[4];
    public string?[] OptionTextsVi { get; set; } = new string?[4];
    public string?[] OptionReasons { get; set; } = new string?[4];
}

public class GrammarReasoningStepInputModel
{
    [StringLength(100)]
    [Display(Name = "Tiêu đề tiêu chí")]
    public string Title { get; set; } = "Vị trí chỗ trống";

    [StringLength(1000)]
    [Display(Name = "Nội dung phân tích")]
    public string? Text { get; set; }

    public List<string> Eliminated { get; set; } = [];
}

public class GrammarTheoryFormViewModel
{
    public int TopicId { get; set; }
    public string TopicTitle { get; set; } = "";

    [Display(Name = "Quy tắc vàng (mỗi dòng một quy tắc)")]
    public string GoldenRules { get; set; } = "";

    [Display(Name = "Tóm tắt")]
    public string Summary { get; set; } = "";

    [Display(Name = "Lời dẫn mẹo nhớ nhanh")]
    public string QuickIntro { get; set; } = "";

    [Display(Name = "Mẹo nhớ nhanh (mỗi dòng: nhãn | kết quả)")]
    public string QuickItems { get; set; } = "";

    [Display(Name = "Mental model - vế trái")]
    public string ModelLeft { get; set; } = "";

    [Display(Name = "Mental model - vế phải")]
    public string ModelRight { get; set; } = "";

    [Display(Name = "Mô tả mental model")]
    public string MentalDescription { get; set; } = "";

    [Display(Name = "Công thức nhanh (mỗi dòng một công thức)")]
    public string Formulas { get; set; } = "";

    [Display(Name = "Cách dùng (mỗi dòng: tiêu đề | nội dung | kết quả | green)")]
    public string Usage { get; set; } = "";

    [Display(Name = "Bẫy thường gặp (mỗi dòng: Tiêu đề: nội dung)")]
    public string Mistakes { get; set; } = "";

    [Display(Name = "Ví dụ (mỗi dòng: English — Tiếng Việt)")]
    public string Examples { get; set; } = "";
}

public class GrammarReportRow
{
    public int Id { get; set; }
    public string UserName { get; set; } = "";
    public string TopicTitle { get; set; } = "";
    public int QuestionId { get; set; }
    public int TopicId { get; set; }
    public string QuestionContent { get; set; } = "";
    public string Details { get; set; } = "";
    public string? ReportType { get; set; }
    public bool IsResolved { get; set; }
    public DateTime CreatedAt { get; set; }
}
