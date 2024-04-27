using Core.Entities;
using Microsoft.EntityFrameworkCore;

namespace Core;

public class AppDbContext(DbContextOptions<AppDbContext> options) : DbContext(options)
{
    public DbSet<User> Users { get; set; } = null!;

    public DbSet<Conversation> Conversations { get; set; } = null!;

    public DbSet<UserContact> Contacts { get; set; } = null!;

    public DbSet<Message> Messages { get; set; } = null!;


    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);
        
        modelBuilder.Entity<UserContact>()
            .HasKey(uc => new { uc.UserId, uc.ContactId });
        
        modelBuilder.Entity<ConversationUser>()
            .HasKey(cu => new { cu.UserId, cu.ConversationId });
    }
}