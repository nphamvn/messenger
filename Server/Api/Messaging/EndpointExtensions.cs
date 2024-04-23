namespace Api.Messaging;

public static class EndpointExtensions
{
    public static void MapChatHub(this IEndpointRouteBuilder endpoints)
    {
        endpoints.MapHub<ChatHub>("/chat");
    }
}