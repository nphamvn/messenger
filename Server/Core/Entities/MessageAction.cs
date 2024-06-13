namespace Core.Entities;

public class MessageAction
{
    public string UserId { get; set; }
    public int MessageId { get; set; }
    
    public string Action { get; set; }
    
    public DateTime ActionAt { get; set; }
    
    public User User { get; set; }
    
    public Message Message { get; set; }
}