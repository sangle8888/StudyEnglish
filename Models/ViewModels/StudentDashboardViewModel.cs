namespace StudyEnglish.Models.ViewModels;

public sealed class StudentDashboardViewModel
{
    public string FullName { get; init; } = string.Empty;
    public string Email { get; init; } = string.Empty;
    public string Avatar { get; init; } = "/images/default-avatar.png";
    public string Hometown { get; init; } = "Chưa cập nhật";
    public string BirthYear { get; init; } = "Chưa cập nhật";
    public string JoinedDate { get; init; } = string.Empty;
}
