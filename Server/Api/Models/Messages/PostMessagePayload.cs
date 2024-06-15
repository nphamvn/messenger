using System.ComponentModel.DataAnnotations;

namespace Api.Models.Messages;

public class PostMessagePayload
{
    public int? ConversationId { get; set; }
    public List<string> MemberIds { get; set; } = [];
    [Required]
    public string Text { get; set; }
    public string? ClientMessageId { get; set; }
}