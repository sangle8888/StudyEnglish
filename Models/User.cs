using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace StudyEnglish.Models;

[Table("Users")]
public class User
{
    [Key]
    [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
    public int UserId { get; set; }

    [Required(ErrorMessage = "Họ và tên là bắt buộc")]
    [StringLength(100, ErrorMessage = "Họ và tên không quá 100 ký tự")]
    public string FullName { get; set; } = string.Empty;

    [Required(ErrorMessage = "Email là bắt buộc")]
    [EmailAddress(ErrorMessage = "Email không đúng định dạng")]
    [StringLength(150, ErrorMessage = "Email không quá 150 ký tự")]
    public string Email { get; set; } = string.Empty;

    [Required]
    public string PasswordHash { get; set; } = string.Empty;

    [Required]
    public int RoleId { get; set; }

    [StringLength(500)]
    public string? Avatar { get; set; } = "/images/default-avatar.png";

    [Range(1950, 2030, ErrorMessage = "Năm sinh không hợp lệ")]
    public int? BirthYear { get; set; }

    [StringLength(200, ErrorMessage = "Quê quán không quá 200 ký tự")]
    public string? Hometown { get; set; }

    public bool IsActive { get; set; } = true;

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    // Khóa ngoại liên kết với bảng Roles
    [ForeignKey(nameof(RoleId))]
    public virtual Role Role { get; set; } = null!;
}