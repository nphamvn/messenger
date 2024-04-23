using System.Text.Json.Serialization;

namespace UserSyncService.Auth0Api;

public class GetAccessTokenRequest
{
    [JsonPropertyName("client_id")]
    public string ClientId { get; set; }
    
    [JsonPropertyName("client_secret")]
    public string ClientSecret { get; set; }
    
    [JsonPropertyName("audience")]
    public string Audience { get; set; }
    
    [JsonPropertyName("grant_type")]
    public string GrantType { get; set; } = "client_credentials";
}