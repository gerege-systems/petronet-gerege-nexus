using PetroNetDesktop.Application.Abstractions;

namespace PetroNetDesktop.Infrastructure.Time;

public sealed class SystemClock : IClock
{
    public DateTimeOffset UtcNow => DateTimeOffset.UtcNow;
}
