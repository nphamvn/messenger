using Api.Extensions;
using Microsoft.EntityFrameworkCore;

namespace Api.Messaging;

public partial class ChatHub
{
    public async Task SendTypingIndicator(int conversationId, bool isTyping)
    {
        var userId = Context.User!.GetUserId();
        
        logger.LogInformation("Typing: {ConversationId}, {UserId}, {IsTyping}", conversationId, userId, isTyping);
        
        var conversation = await dbContext.Conversations
            .Include(c => c.Users)
            .SingleAsync(c => c.Id == conversationId && c.Users.Any(u => u.UserId == userId));

        foreach (var user in conversation.Users)
        {
            foreach (var connectionId in Connections.GetConnections(user.UserId))
            {
                await Clients.Client(connectionId).ReceiveTypingIndicator(conversationId, userId, isTyping);
            }
        }
    }
}