using System.ComponentModel.DataAnnotations;

namespace Api.Models.Contacts;

public class PostContactPayload
{
    [Required]
    public required string Id { get; set; }
}