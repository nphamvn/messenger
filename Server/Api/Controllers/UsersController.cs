using Api.Extensions;
using Core;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace Api.Controllers;

[Route("[controller]")]
public class UsersController(AppDbContext dbContext) : BaseController
{
    [HttpGet]
    public async Task<IActionResult> GetPeople()
    {
        var userId = User.GetUserId();

        var people = await dbContext.Users
            .Where(u => u.Id != userId)
            .ToListAsync();

        var contacts = await dbContext.Contacts
            .Where(c => c.UserId == userId)
            .ToListAsync();

        return Ok(people.Select(p => new
        {
            p.Id,
            p.FullName,
            p.Picture,
            IsContact = contacts.Exists(c => c.Contact == p)
        }));
    }
}