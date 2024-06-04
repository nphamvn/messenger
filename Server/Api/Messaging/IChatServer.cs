namespace Api.Messaging;

public interface IChatServer
{
    Task SendMessage(
        int? conversationId,
        string? clientConversationId,
        string? commaJoinedMembers, 
        string text, 
        string? clientMessageId);

    Task SendTypingIndicator(int conversationId, bool isTyping);
}