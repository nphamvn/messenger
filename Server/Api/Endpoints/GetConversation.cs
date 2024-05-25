using System.Security.Claims;
using Api.Extensions;
using Core;
using Microsoft.EntityFrameworkCore;

namespace Api.Endpoints;

public static class GetConversation
{
    public static void MapGetConversation(this WebApplication app)
    {
        app.MapGet("/conversations/{id:int}", async (
                int id,
                ClaimsPrincipal user, 
                AppDbContext dbContext) =>
            {
                var userId = user.GetUserId();

                var conversation = await dbContext.Conversations
                    .Include(c => c.Users)
                    .ThenInclude(u => u.User)
                    .SingleAsync(c => c.Id == id && c.Users.Any(u => u.UserId == userId));

                return new
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
                };
            })
            .WithName("GetConversation")
            .WithOpenApi()
            .RequireAuthorization();
    }
}