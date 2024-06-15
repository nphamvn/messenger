using Api.Extensions;
using Api.Hubs;
using Api.Models.Messages;
using Api.Services;
using Core;
using Core.Entities;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.SignalR;
using Microsoft.EntityFrameworkCore;
using ChatHub = Api.Hubs.ChatHub;

namespace Api.Controllers;

[Route("conversations/{conversationId:int}/messages")]
public class ConversationMessagesController(
    AppDbContext dbContext,
    IConversationService conversationService,
    IHubContext<ChatHub, IChatClient> chatHub,
    [FromKeyedServices("ChatHubConnectionMapping")]
    ConnectionMapping<string> connections) : BaseController
{
    [HttpGet]
    public async Task<IActionResult> GetConversationMessages(int conversationId)
    {
        var userId = User.GetUserId();

        var conversation = await dbContext.Conversations
            .Include(c => c.Users)
            .SingleAsync(c => c.Id == conversationId && c.Users.Any(u => u.UserId == userId));

        var messages = await dbContext.Messages
            .Where(m => m.Conversation == conversation)
            .OrderByDescending(m => m.CreatedAt)
            .Take(50)
            .ToListAsync();

        return Ok(messages.Select(m => new
        {
            m.Id,
            m.SenderId,
            m.Text,
            m.CreatedAt,
        }));
    }

    [HttpPost("/conversations/messages")]
    public async Task<IActionResult> PostMessage(PostMessagePayload payload)
    {
        var sender = await dbContext.Users.SingleAsync(u => u.Id == User.GetUserId());
        var shouldCreateConversation = payload.ConversationId is null;
        var conversation = shouldCreateConversation
            ? await CreateConversation(payload, sender)
            : await GetConversation(payload, sender);

        var message = await CreateMessage(dbContext, conversation, sender, payload);
        await dbContext.SaveChangesAsync();


        if (shouldCreateConversation)
        {
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

        foreach (var conversationUser in conversation.Users)
        {
            foreach (var connectionId in connections.GetConnections(conversationUser.UserId))
            {
                await chatHub.Clients.Client(connectionId).ReceiveMessage(new
                {
                    message.Id,
                    payload.ClientMessageId,
                    message.ConversationId,
                    message.SenderId,
                    message.Text,
                    message.CreatedAt
                });
            }
        }

        return Created(message.Id.ToString(), new
        {
            message.Id,
            message.ConversationId,
        });
    }

    private static async Task<Message> CreateMessage(AppDbContext dbContext, Conversation conversation, User sender,
        PostMessagePayload payload)
    {
        var message = new Message
        {
            Conversation = conversation,
            Sender = sender,
            Text = payload.Text,
            CreatedAt = DateTime.UtcNow
        };

        await dbContext.Messages.AddAsync(message);

        return message;
    }

    private async Task<Conversation> CreateConversation(PostMessagePayload payload,
        User sender)
    {
        var otherMemberIds = payload.MemberIds
            .Where(id => id != sender.Id)
            .Distinct()
            .ToList();

        if (otherMemberIds.Count < 1)
        {
            throw new Exception("Conversation must have at least 2 members");
        }

        if (otherMemberIds.Count == 1)
        {
            var o2oConversation = await conversationService.GetOneToOneConversation([sender.Id, otherMemberIds[0]]);
            if (o2oConversation is not null)
            {
                return o2oConversation;
            }
        }

        var members = await dbContext.Users
            .Where(u => otherMemberIds.Contains(u.Id))
            .ToListAsync();

        var conversation = new Conversation
        {
            CreatedBy = sender,
            Users = []
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


        await dbContext.Conversations.AddAsync(conversation);

        return conversation;
    }

    private async Task<Conversation> GetConversation(PostMessagePayload payload,
        User sender)
    {
        return await dbContext.Conversations
            .Include(c => c.Users)
            .SingleAsync(c => c.Id == payload.ConversationId && c.Users.Any(u => u.User == sender));
    }
}