namespace Api.Models.Messages;

public class PostMessagePayload
{
    public int? ConversationId { get; set; }
    public List<string> MemberIds { get; set; } = [];
    public string Text { get; set; }
}