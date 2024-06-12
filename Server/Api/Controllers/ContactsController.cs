using Api.Extensions;
using Api.Models.Contacts;
using Core;
using Core.Entities;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace Api.Controllers;

[Route("[controller]")]
public class ContactsController (AppDbContext dbContext): BaseController
{
    public async Task<IActionResult> GetContacts()
    {
        var userId = HttpContext.User.GetUserId();
        var contacts = await dbContext.Contacts
            .Include(c => c.Contact)
            .Where(c => c.UserId == userId)
            .ToListAsync();
        
        return Ok(contacts.Select(c => new
        {
            Id = c.ContactId,
            c.Contact.FullName,
            c.Contact.Picture,
            c.CreatedAt,
        }));
    }
    
    public async Task<IActionResult> PostContacts(PostContactPayload payload)
    {
        var userId = User.GetUserId();
        var user = await dbContext.Users.SingleAsync(u => u.Id == userId);
        var other = await dbContext.Users.SingleAsync(u => u.Id == payload.Id);
                
        await dbContext.Contacts.AddAsync(new UserContact
        {
            User = user,
            Contact = other,
            CreatedAt = DateTime.UtcNow,
        });
                
        await dbContext.SaveChangesAsync();

        return Created();
    }
}