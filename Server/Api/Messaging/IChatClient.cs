namespace Api.Messaging;

public interface IChatClient
{
    Task ReceiveConversation(object conversation);
    Task ReceiveMessage(object message);
    Task ReceiveTypingIndicator(int conversationId, string userId, bool isTyping);
    Task ReceiveMessageAction(int messageId, string userId, string action);
    Task ReceivePing(ReceivePingMessage message);
}