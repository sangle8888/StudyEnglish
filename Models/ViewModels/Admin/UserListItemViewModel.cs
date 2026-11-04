namespace StudyEnglish.Models.ViewModels.Admin;

public sealed class UserListItemViewModel
{
    public int UserId { get; init; }
    public string FullName { get; init; } = string.Empty;
    public string Email { get; init; } = string.Empty;
    public string RoleName { get; init; } = string.Empty;
    public bool IsActive { get; init; }
    public DateTime CreatedAt { get; init; }
}
