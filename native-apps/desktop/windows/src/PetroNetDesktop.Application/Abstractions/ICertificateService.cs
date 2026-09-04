using PetroNetDesktop.Domain.Certificates;
using PetroNetDesktop.Domain.Primitives;

namespace PetroNetDesktop.Application.Abstractions;

public interface ICertificateService
{
    Result<CertificateInfo> ParsePem(string pemContents);

    Result<CertificateInfo> ParseFile(string filePath);
}
