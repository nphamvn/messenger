namespace Api.Messaging;

public interface IChatClient
{
    Task ReceiveMessage(object conversation, object message);
    
    Task ReceiveTypingIndicator(int conversationId, string userId, bool isTyping);
}