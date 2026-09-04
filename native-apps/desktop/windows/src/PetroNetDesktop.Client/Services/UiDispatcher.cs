using PetroNetDesktop.Presentation.Services;
using Microsoft.UI.Dispatching;

namespace PetroNetDesktop.Client.Services;

public sealed class UiDispatcher : IUiDispatcher
{
    private readonly DispatcherQueue _queue;

    public UiDispatcher(DispatcherQueue queue) => _queue = queue;

    public bool HasThreadAccess => _queue.HasThreadAccess;

    public void Post(Action action)
    {
        if (HasThreadAccess)
        {
            action();
        }
        else
        {
            _queue.TryEnqueue(() => action());
        }
    }
}
