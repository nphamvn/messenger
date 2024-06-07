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
        int? serverConversationId,
        string? clientConversationId,
        string? commaJoinedMembers, 
        string text, 
        string? clientMessageId)
    {
        logger.LogInformation("SendMessage: {ConversationId}, {ClientConversationId}, {CommaJoinedMembers}, {Text}, {ClientMessageId}", 
            serverConversationId, clientConversationId, commaJoinedMembers, text, clientMessageId);
        
        var userId = Context.User!.GetUserId();
        
        Conversation conversation;
        if (serverConversationId is not null)
        {
            conversation = await dbContext.Conversations
                .Include(c => c.Users)
                .SingleAsync(c => c.Id == serverConversationId && c.Users.Any(u => u.UserId == userId));
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