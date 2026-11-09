using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace StudyEnglish.Models;

[Table("Feedbacks")]
public class Feedback
{
    [Key]
    [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
    public int FeedbackId { get; set; }

    public int? UserId { get; set; }

    [Required]
    [StringLength(100)]
    public string FeedbackType { get; set; } = string.Empty;

    [Required]
    [StringLength(2000)]
    public string Content { get; set; } = string.Empty;

    [StringLength(150)]
    public string? SenderName { get; set; }

    [StringLength(150)]
    public string? SenderEmail { get; set; }

    [Required]
    [StringLength(50)]
    public string Status { get; set; } = "New"; // "New", "Read", "Resolved"

    [StringLength(1000)]
    public string? AdminNote { get; set; }

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public DateTime? ResolvedAt { get; set; }

    [ForeignKey(nameof(UserId))]
    public virtual User? User { get; set; }
}
