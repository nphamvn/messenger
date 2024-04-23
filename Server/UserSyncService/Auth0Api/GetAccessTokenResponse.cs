using System.Text.Json.Serialization;

namespace UserSyncService.Auth0Api;

public class GetAccessTokenResponse
{
    [JsonPropertyName("access_token")]
    public required string AccessToken { get; set; }
}