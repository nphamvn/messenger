namespace Api.Messaging;

public interface IChatServer
{
    Task SendMessage(
        int? conversationId,
        string? commaJoinedMembers,
        string text,
        string? clientMessageId = null);

    Task SendTypingIndicator(int conversationId, bool isTyping);
}