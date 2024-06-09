namespace Api.Messaging;

public interface IChatServer
{
    Task SendMessage(
        int? serverConversationId,
        string? clientConversationId,
        string? commaJoinedMembers, 
        string text, 
        string? clientMessageId,
        string ackId);

    Task SendTypingIndicator(int conversationId, bool isTyping);
    
    Task SendMessageAction(int messageId, string action);
}