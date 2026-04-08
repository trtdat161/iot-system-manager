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

    public string? Note { get; set; }// null

    public string Role { get; set; } = null!;// understand null

    public int? DeviceId { get; set; }// null

    public int LanguageId { get; set; }

    public DateTime CreatedAt { get; set; }

    public DateTime? UpdatedAt { get; set; }// null

    public DateTime? DeletedAt { get; set; }// null

    public string? ResetToken { get; set; }

    public DateTime? ResetTokenExpires { get; set; }// null

    public virtual Device? Device { get; set; }// null

    public virtual Language Language { get; set; } = null!;

    public virtual ICollection<Notification> Notifications { get; set; } = new List<Notification>();
}
