using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace StudyEnglish.Models;

[Table("Roles")]
public class Role
{
    [Key]
    [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
    public int RoleId { get; set; }

    [Required(ErrorMessage = "Tên vai trò không được để trống")]
    [StringLength(50)]
    public string RoleName { get; set; } = string.Empty;

    [StringLength(255)]
    public string? Description { get; set; }

    // Navigation property: Danh sách người dùng thuộc vai trò này
    public virtual ICollection<User> Users { get; set; } = new List<User>();
}