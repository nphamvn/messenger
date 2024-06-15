using System.Linq.Expressions;
using Core;
using Core.Entities;
using Microsoft.EntityFrameworkCore;

namespace Api.Services;

public interface IConversationService
{
    Task<Conversation?> GetOneToOneConversation(string[] userIds);
}

public class ConversationService(AppDbContext dbContext) : IConversationService
{
    public async Task<Conversation?> GetOneToOneConversation(string[] userIds)
    {
        if (userIds.Length != 2)
        {
            throw new ArgumentException("Invalid number of users");
        }

        var user1 = await dbContext.Users.SingleAsync(u => u.Id == userIds[0]);
        var user2 = await dbContext.Users.SingleAsync(u => u.Id == userIds[1]);

        return await dbContext.Conversations
            .Include(c => c.Users)
            .SingleOrDefaultAsync(PrivateConversation(user1, user2));
    }

    private static Expression<Func<Conversation, bool>> PrivateConversation(User user1, User user2)
    {
        return c => c.Users.Count == 2
                    && c.Users.Any(u => u.UserId == user1.Id)
                    && c.Users.Any(u => u.UserId == user2.Id);
    }
}