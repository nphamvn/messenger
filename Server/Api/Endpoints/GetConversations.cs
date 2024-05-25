using System.Security.Claims;
using Api.Extensions;
using Core;
using Microsoft.EntityFrameworkCore;

namespace Api.Endpoints;

public static class GetConversations
{
    public static void MapGetConversations(this WebApplication app)
    {
        app.MapGet("/conversations", async (
                ClaimsPrincipal user, 
                AppDbContext dbContext) =>
            {
                var userId = user.GetUserId();
    
                var conversations = await dbContext.Conversations
                    .Include(c => c.Users)
                    .ThenInclude(u => u.User)
                    .Include(c => c.Messages.OrderByDescending(m => m.CreatedAt).Take(1))
                    .Where(c => c.Users.Any(u => u.UserId == userId))
                    .ToListAsync();

                return conversations.Select(c =>
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
                        Members = c.Users.Where(u => u.UserId != userId).Select(u => new
                        {
                            Id = u.UserId,
                            u.User.FullName,
                            u.User.Picture
                        })
                    };
                });
            })
            .WithName("GetConversations")
            .WithOpenApi()
            .RequireAuthorization();
    }
}