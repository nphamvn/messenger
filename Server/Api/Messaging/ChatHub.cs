using Api.Extensions;
using Core;
using Core.Entities;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.SignalR;
using Microsoft.EntityFrameworkCore;

namespace Api.Messaging;

[Authorize]
public class ChatHub(AppDbContext dbContext, ILogger<ChatHub> logger) : Hub<IChatClient>, IChatServer
{
    private static readonly ConnectionMapping<string> Connections = new();
    
    public async Task SendMessage(
        int? conversationId,
        string? clientConversationId,
        string? commaJoinedMembers, 
        string text, 
        string? clientMessageId)
    {
        logger.LogInformation("SendMessage: {ConversationId}, {ClientConversationId}, {CommaJoinedMembers}, {Text}, {ClientMessageId}", 
            conversationId, clientConversationId, commaJoinedMembers, text, clientMessageId);
        
        if (conversationId == null && string.IsNullOrEmpty(commaJoinedMembers))
        {
            throw new ArgumentException("Either conversationId or commaJoinedMembers must be provided");
        }
        
        var userId = Context.User!.GetUserId();
        
        Conversation conversation;
        if (conversationId is not null)
        {
            conversation = await dbContext.Conversations
                .Include(c => c.Users)
                .SingleAsync(c => c.Id == conversationId && c.Users.Any(u => u.UserId == userId));
        }
        else
        {
            var memberIds = commaJoinedMembers!.Split(",")
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
            await dbContext.SaveChangesAsync();
        }
        
        var message = new Message
        {
            SenderId = userId,
            Conversation = conversation,
            Text = text,
            CreatedAt = DateTime.UtcNow
        };

        await dbContext.Messages.AddAsync(message);
        await dbContext.SaveChangesAsync();

        foreach (var user in conversation.Users)
        {
            foreach (var connectionId in Connections.GetConnections(user.UserId))
            {
                await Clients.Client(connectionId).ReceiveMessage(
                    new
                    {
                        conversation.Id,
                        conversation.Name,
                        conversation.CreatedAt
                    }, new
                    {
                        message.Id,
                        message.SenderId,
                        message.Text,
                        message.CreatedAt,
                        clientMessageId
                    });
            }
        }
    }

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