using Api.Extensions;
using Core.Entities;
using Microsoft.EntityFrameworkCore;

namespace Api.Messaging;

public class SendMessageMessage
{
    public int? ServerConversationId { get; set; }
    public string? ClientConversationId { get; set; }
    public string[] MemberIds { get; set; } = [];
    public string Text { get; set; }
    public string? ClientMessageId { get; set; }
}

public partial class ChatHub
{
    public async Task SendMessage(SendMessageMessage pack)
    {
        logger.LogInformation("SendMessage: {ServerConversationId}, {ClientConversationId}, {MemberIds}, {Text}, {ClientMessageId}", 
            pack.ServerConversationId, pack.ClientConversationId, pack.MemberIds, pack.Text, pack.ClientMessageId);
        
        var userId = Context.User!.GetUserId();
        
        Conversation conversation;
        if (pack.ServerConversationId is not null)
        {
            conversation = await dbContext.Conversations
                .Include(c => c.Users)
                .SingleAsync(c => c.Id == pack.ServerConversationId && c.Users.Any(u => u.UserId == userId));
        }
        else
        {
            var memberIds = pack.MemberIds
                .Where(m => m != userId).ToList();
            
            var members = await dbContext.Users
                .Where(u => memberIds.Contains(u.Id))
                .Select(u => u.Id).ToListAsync();
            
            conversation = new Conversation
            {
                CreatedAt = DateTime.UtcNow
            };
            
            conversation.Users =
            [
                new ConversationUser
                {
                    UserId = userId,
                    Conversation = conversation
                }
            ];
            
            foreach (var member in members)
            {
                conversation.Users.Add(new ConversationUser
                {
                    UserId = member,
                    Conversation = conversation
                });
            }
            
            if (conversation.Users.Count < 2)
            {
                throw new Exception("Conversation must have at least 2 members");
            }
            
            await dbContext.Conversations.AddAsync(conversation);
        }
        
        var message = new Message
        {
            SenderId = userId,
            Conversation = conversation,
            Text = pack.Text,
            CreatedAt = DateTime.UtcNow
        };

        await dbContext.Messages.AddAsync(message);
        await dbContext.SaveChangesAsync();

        foreach (var user in conversation.Users)
        {
            foreach (var connectionId in connections.GetConnections(user.UserId))
            {
                await Clients.Client(connectionId).ReceiveMessage(new
                {
                    message.Id,
                    message.SenderId,
                    message.Text,
                    message.CreatedAt,
                    pack.ClientMessageId
                });
            }
        }
    }
}