using PetroNetDesktop.Application.Abstractions;
using PetroNetDesktop.Domain.Auth;

namespace PetroNetDesktop.Infrastructure.Auth;

/// In-memory, process-lifetime identity cache (single logged-in user).
/// See <see cref="ISessionIdentityCache"/> for why this exists.
public sealed class SessionIdentityCache : ISessionIdentityCache
{
    private volatile UserProfile? _current;

    public UserProfile? Current => _current;

    public void Set(UserProfile profile) => _current = profile;

    public void Clear() => _current = null;
}
