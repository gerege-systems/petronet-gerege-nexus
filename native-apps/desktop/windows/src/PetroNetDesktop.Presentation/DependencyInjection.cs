using PetroNetDesktop.Presentation.ViewModels;
using PetroNetDesktop.Presentation.ViewModels.Pages;
using Microsoft.Extensions.DependencyInjection;

namespace PetroNetDesktop.Presentation;

public static class DependencyInjection
{
    public static IServiceCollection AddPresentation(this IServiceCollection services)
    {
        services.AddSingleton<ShellViewModel>();

        services.AddTransient<HomeViewModel>();
        services.AddTransient<VerifyViewModel>();
        services.AddTransient<SignViewModel>();
        services.AddTransient<LoginViewModel>();
        services.AddTransient<DashboardViewModel>();
        services.AddTransient<OrganizationsViewModel>();
        services.AddTransient<ChildrenViewModel>();
        services.AddTransient<CertificatesViewModel>();
        services.AddTransient<SettingsViewModel>();
        services.AddTransient<TokensViewModel>();
        services.AddTransient<TokenDetailViewModel>();

        return services;
    }
}
