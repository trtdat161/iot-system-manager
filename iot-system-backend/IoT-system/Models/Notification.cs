using System;
using System.Collections.Generic;

namespace IoT_system.Models;

public partial class Notification
{
    public int Id { get; set; }

    public int DeviceId { get; set; }

    public int UserId { get; set; }

    public string Message { get; set; } = null!;

    public string Type { get; set; } = null!;

    public bool IsRead { get; set; }

    public DateTime CreatedAt { get; set; }

    public virtual Device Device { get; set; } = null!;

    public virtual Account User { get; set; } = null!;
}
