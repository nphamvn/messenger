namespace Api.Messaging;

public interface IChatClient
{
    Task ReceiveAckMessage(string ackId, string? error);
    Task ReceiveMessage(object conversation, object message);
    
    Task ReceiveTypingIndicator(int conversationId, string userId, bool isTyping);
    
    Task ReceiveMessageAction(int messageId, string userId, string action);

    Task ReceivePing(ReceivePingMessage message);
}