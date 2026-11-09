namespace StudyEnglish.Models.ViewModels.Admin;

public class FeedbackListViewModel
{
    public List<FeedbackItemViewModel> Items { get; set; } = new();
    public int TotalCount { get; set; }
    public int NewCount { get; set; }
    public int ReadCount { get; set; }
    public int ResolvedCount { get; set; }

    public string? CurrentType { get; set; }
    public string? CurrentStatus { get; set; }
    public string? CurrentSearch { get; set; }

    public int PageIndex { get; set; } = 1;
    public int PageSize { get; set; } = 15;
    public int TotalPages => (int)Math.Ceiling((double)TotalCount / Math.Max(1, PageSize));
    public bool HasPreviousPage => PageIndex > 1;
    public bool HasNextPage => PageIndex < TotalPages;
}

public class FeedbackItemViewModel
{
    public int FeedbackId { get; set; }
    public int? UserId { get; set; }
    public string FeedbackType { get; set; } = string.Empty;
    public string Content { get; set; } = string.Empty;
    public string SenderName { get; set; } = string.Empty;
    public string? SenderEmail { get; set; }
    public string Status { get; set; } = "New";
    public string? AdminNote { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime? ResolvedAt { get; set; }
}

public class UpdateFeedbackStatusRequest
{
    public int FeedbackId { get; set; }
    public string Status { get; set; } = "New";
    public string? AdminNote { get; set; }
}
