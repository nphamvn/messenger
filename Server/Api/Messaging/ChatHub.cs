using Api.Extensions;
using Core;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.SignalR;

namespace Api.Messaging;

[Authorize]
public partial class ChatHub(
    AppDbContext dbContext,
    ILogger<ChatHub> logger,
    [FromKeyedServices("ChatHubConnectionMapping")] ConnectionMapping<string> connections) : Hub<IChatClient>
{
    public override Task OnConnectedAsync()
    {
        var userId = Context.User!.GetUserId();
        logger.LogInformation("User connected: {UserId}", userId);
        connections.Add(userId, Context.ConnectionId);
        return base.OnConnectedAsync();
    }

    public override Task OnDisconnectedAsync(Exception? exception)
    {
        var userId = Context.User!.GetUserId();
        logger.LogInformation("User disconnected: {UserId}", userId);
        connections.Remove(userId, Context.ConnectionId);
        return base.OnDisconnectedAsync(exception);
    }
}