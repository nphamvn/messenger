using System.Linq.Expressions;
using Api.Extensions;
using Core;
using Core.Entities;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace Api.Controllers;

[Route("[controller]")]
public class ConversationsController(AppDbContext dbContext) : BaseController
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
        var user = await dbContext.Users.SingleAsync(u => u.Id == User.GetUserId());
        var partner = await dbContext.Users.SingleAsync(u => u.Id == partnerId);
                
        var conversation = await dbContext.Conversations
            .Include(c => c.Users)
            .SingleOrDefaultAsync(PrivateConversation(user, partner));

        if (conversation is not null)
        {
            return Ok(new
            {
                conversation.Id,
            });
        }

        return NotFound();
    }
    
    private static Expression<Func<Conversation, bool>> PrivateConversation(User user, User partner)
    {
        return c => c.Users.Count == 2 
                    && c.Users.Any(u => u.UserId == user.Id) 
                    && c.Users.Any(u => u.UserId == partner.Id);
    }
}