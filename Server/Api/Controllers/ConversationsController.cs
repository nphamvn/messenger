using Api.Extensions;
using Api.Services;
using Core;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace Api.Controllers;

[Route("[controller]")]
public class ConversationsController(AppDbContext dbContext, IConversationService conversationService) : BaseController
{
    [HttpGet]
    public async Task<IActionResult> GetConversations()
    {
        var userId = User.GetUserId();

        var conversations = await dbContext.Conversations
            .Include(c => c.Users)
            .ThenInclude(u => u.User)
            .Include(c => c.Messages.OrderByDescending(m => m.CreatedAt).Take(1))
            .Where(c => c.Users.Any(u => u.UserId == userId))
            .ToListAsync();

        return Ok(conversations.Select(c =>
        {
            var lastMessage = c.Messages.FirstOrDefault();
            return new
            {
                c.Id,
                c.Name,
                LastMessage = lastMessage != null
                    ? new
                    {
                        lastMessage.Id,
                        lastMessage.Text,
                        lastMessage.CreatedAt,
                        lastMessage.SenderId
                    }
                    : null,
                c.CreatedAt,
                Members = c.Users.Select(u => new
                {
                    Id = u.UserId,
                    u.User.FullName,
                    u.User.Picture
                })
            };
        }));
    }
    
    [HttpGet("{id:int}")]
    public async Task<IActionResult> GetConversation(int id)
    {
        var userId = User.GetUserId();

        var conversation = await dbContext.Conversations
            .Include(c => c.Users)
            .ThenInclude(u => u.User)
            .SingleAsync(c => c.Id == id && c.Users.Any(u => u.UserId == userId));

        return Ok(new
        {
            conversation.Id,
            conversation.Name,
            conversation.CreatedAt,
            Members = conversation.Users.Select(u => new
            {
                Id = u.UserId,
                u.User.FullName,
                u.User.Picture
            }).ToList()
        });
    }
    
    [HttpGet("o2o/{partnerId}")]
    public async Task<IActionResult> GetOneToOneConversation(string partnerId)
    {
        var conversation = await conversationService.GetOneToOneConversation([User.GetUserId(), partnerId]);   

        if (conversation is not null)
        {
            return Ok(new
            {
                conversation.Id,
                conversation.Name,
                conversation.CreatedAt,
                Members = conversation.Users.Select(u => new
                {
                    Id = u.UserId,
                    u.User.FullName,
                    u.User.Picture
                }).ToList()
            });
        }

        return NotFound();
    }
    
    
}