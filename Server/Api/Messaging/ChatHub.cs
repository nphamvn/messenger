using Api.Extensions;
using Core;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.SignalR;

namespace Api.Messaging;

[Authorize]
public partial class ChatHub(AppDbContext dbContext, ILogger<ChatHub> logger) : Hub<IChatClient>
{
    private static readonly ConnectionMapping<string> Connections = new();

    public override Task OnConnectedAsync()
    {
        var userId = Context.User!.GetUserId();
        logger.LogInformation("User connected: {UserId}", userId);
        Connections.Add(userId, Context.ConnectionId);
        return base.OnConnectedAsync();
    }

    public override Task OnDisconnectedAsync(Exception? exception)
    {
        var userId = Context.User!.GetUserId();
        logger.LogInformation("User disconnected: {UserId}", userId);
        Connections.Remove(userId, Context.ConnectionId);
        return base.OnDisconnectedAsync(exception);
    }
}