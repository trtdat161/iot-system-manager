using System;
using System.Collections.Generic;

namespace IoT_system.Models;

public partial class Account
{
    public int Id { get; set; }

    public string Fullname { get; set; } = null!;

    public string Email { get; set; } = null!;

    public string Password { get; set; } = null!;

    public bool Status { get; set; }

    public string? Note { get; set; }

    public string Role { get; set; } = null!;

    public int? DeviceId { get; set; }

    public int LanguageId { get; set; }

    public DateTime CreatedAt { get; set; }

    public DateTime? UpdatedAt { get; set; }

    public DateTime? DeletedAt { get; set; }

    public string? ResetToken { get; set; }

    public DateTime? ResetTokenExpires { get; set; }

    public virtual Device? Device { get; set; }

    public virtual Language Language { get; set; } = null!;

    public virtual ICollection<Notification> Notifications { get; set; } = new List<Notification>();
}
