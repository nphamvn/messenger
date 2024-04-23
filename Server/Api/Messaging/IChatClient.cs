namespace Api.Messaging;

public interface IChatClient
{
    Task ReceiveChatMessage(object conversation, object message);
    
    Task ReceiveTypingIndicator(int conversationId, string userId, bool isTyping);
}