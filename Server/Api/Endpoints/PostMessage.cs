using System.Security.Claims;
using Api.Extensions;
using Api.Messaging;
using Core;
using Core.Entities;
using Microsoft.AspNetCore.SignalR;
using Microsoft.EntityFrameworkCore;

namespace Api.Endpoints;

public static class PostMessage
{
    public static void MapPostMessage(this WebApplication app)
    {
        app.MapPost("/conversations/messages", async (
            ClaimsPrincipal claimsPrincipal,
            AppDbContext dbContext,
            IHubContext<ChatHub, IChatClient> chatHub,
            [FromKeyedServices("ChatHubConnectionMapping")] ConnectionMapping<string> connections,
            PostMessagePayload message) =>
        {
            var sender = await dbContext.Users.SingleAsync(u => u.Id == claimsPrincipal.GetUserId());
            var conversation = await GetOrCreateConversation(message, dbContext, sender, connections, chatHub);
            await CreateMessage(dbContext, chatHub, connections, conversation, sender, message);
            await dbContext.SaveChangesAsync();
        });
    }

    private static async Task CreateMessage(AppDbContext dbContext, IHubContext<ChatHub, IChatClient> chatHub,
        ConnectionMapping<string> connections, Conversation conversation, User sender, PostMessagePayload payload)
    {
        var message = new Message
        {
            Conversation = conversation,
            Sender = sender,
            Text = payload.Text,
            CreatedAt = DateTime.UtcNow
        };
        
        await dbContext.Messages.AddAsync(message);
        
        foreach (var conversationUser in conversation.Users)
        {
            foreach (var connectionId in connections.GetConnections(conversationUser.UserId))
            {
                await chatHub.Clients.Client(connectionId).ReceiveMessage(new
                {
                    message.Id,
                    message.ConversationId,
                    message.SenderId,
                    message.Text,
                    message.CreatedAt
                });
            }
        }
        
    }

    private static async Task<Conversation> GetOrCreateConversation(PostMessagePayload message, AppDbContext dbContext,
        User sender, ConnectionMapping<string> connections, IHubContext<ChatHub, IChatClient> chatHub)
    {
        Conversation conversation;

        if (message.ConversationId is not null)
        {
            conversation = await dbContext.Conversations
                .Include(c => c.Users)
                .SingleAsync(c => c.Id == message.ConversationId && c.Users.Any(u => u.User == sender));
        }
        else
        {
            var otherMemberIds = message.MemberIds
                .Where(id => id != sender.Id)
                .Distinct()
                .ToList();

            var members = await dbContext.Users
                .Where(u => otherMemberIds.Contains(u.Id))
                .ToListAsync();

            conversation = new Conversation
            {
                CreatedBy = sender
            };
                
            conversation.Users.Add(new ConversationUser
            {
                User = sender,
                Conversation = conversation
            });
                
            foreach (var member in members)
            {
                conversation.Users.Add(new ConversationUser
                {
                    User = member,
                    Conversation = conversation
                });
            }
            
            if (conversation.Users.Count < 2)
            {
                throw new Exception("Conversation must have at least 2 members");
            }
                
            await dbContext.Conversations.AddAsync(conversation);

            foreach (var conversationUser in conversation.Users)
            {
                foreach (var connectionId in connections.GetConnections(conversationUser.UserId))
                {
                    await chatHub.Clients.Client(connectionId).ReceiveConversation(new
                    {
                        conversation.Id,
                        Members = conversation.Users.Select(u => u.UserId).ToList(),
                        conversation.CreatedAt,
                        CreatedBy = conversation.CreatedBy.Id
                    });
                }
            }
        }

        return conversation;
    }
}

public class PostMessagePayload
{
    public int? ConversationId { get; set; }
    public List<string> MemberIds { get; set; } = [];
    public string Text { get; set; }
}