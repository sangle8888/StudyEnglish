using System.ComponentModel.DataAnnotations;
using Microsoft.AspNetCore.Mvc.Rendering;

namespace StudyEnglish.Models.ViewModels.Admin;

public sealed class UserFormViewModel
{
    public int UserId { get; set; }

    [Required(ErrorMessage = "Họ và tên là bắt buộc")]
    [StringLength(100)]
    [Display(Name = "Họ và tên")]
    public string FullName { get; set; } = string.Empty;

    [Required(ErrorMessage = "Email là bắt buộc")]
    [EmailAddress(ErrorMessage = "Email không đúng định dạng")]
    [StringLength(150)]
    public string Email { get; set; } = string.Empty;

    [DataType(DataType.Password)]
    [StringLength(100, MinimumLength = 6, ErrorMessage = "Mật khẩu phải có ít nhất 6 ký tự")]
    [Display(Name = "Mật khẩu")]
    public string? Password { get; set; }

    [Required(ErrorMessage = "Vui lòng chọn vai trò")]
    [Display(Name = "Vai trò")]
    public int RoleId { get; set; }

    [StringLength(500)]
    [Display(Name = "Ảnh đại diện")]
    public string? Avatar { get; set; }

    [Range(1950, 2030, ErrorMessage = "Năm sinh không hợp lệ")]
    [Display(Name = "Năm sinh")]
    public int? BirthYear { get; set; }

    [StringLength(200)]
    [Display(Name = "Quê quán")]
    public string? Hometown { get; set; }

    [Display(Name = "Đang hoạt động")]
    public bool IsActive { get; set; } = true;

    public IEnumerable<SelectListItem> Roles { get; set; } = [];
}
