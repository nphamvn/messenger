using Api.Extensions;
using Core.Entities;
using Microsoft.EntityFrameworkCore;

namespace Api.Messaging;

public partial class ChatHub
{
    public async Task SendMessageAction(int messageId, string action)
    {
        var actor = await dbContext.Users.SingleAsync(u => u.Id == Context.User!.GetUserId());
        var message = await dbContext.Messages
            .Include(m => m.Conversation).ThenInclude(conversation => conversation.Users)
            .SingleAsync(m => m.Id == messageId && m.Conversation.Users.Any(u => u.User == actor));
        
        logger.LogInformation("MessageAction: {MessageId}, {UserId}, {Action}", messageId, actor.Id, action);

        message.Actions.Add(new MessageAction
        {
            User = actor,
            Action = action,
            ActionAt = DateTime.UtcNow
        });
        
        await dbContext.SaveChangesAsync();
        
        foreach (var user in message.Conversation.Users)
        {
            foreach (var connectionId in Connections.GetConnections(user.UserId))
            {
                await Clients.Client(connectionId).ReceiveMessageAction(messageId, actor.Id, action);
            }
        }
    }
}