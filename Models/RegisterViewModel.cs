using System.ComponentModel.DataAnnotations;

namespace StudyEnglish.Models;

public class RegisterViewModel
{
    [Required(ErrorMessage = "Vui lòng nhập họ và tên")]
    [StringLength(100, ErrorMessage = "Họ và tên tối đa 100 ký tự")]
    public string FullName { get; set; } = string.Empty;

    [Required(ErrorMessage = "Vui lòng nhập Email")]
    [EmailAddress(ErrorMessage = "Email không đúng định dạng")]
    public string Email { get; set; } = string.Empty;

    [Required(ErrorMessage = "Vui lòng tạo mật khẩu")]
    [MinLength(6, ErrorMessage = "Mật khẩu phải từ 6 ký tự trở lên")]
    [DataType(DataType.Password)]
    public string Password { get; set; } = string.Empty;

    [Range(1950, 2030, ErrorMessage = "Năm sinh không hợp lệ")]
    public int? BirthYear { get; set; }

    [MaxLength(200)]
    public string? Hometown { get; set; }
}