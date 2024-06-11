namespace Api.Messaging;

public partial class ChatHub
{
    public async Task SendPing(SendPingMessage message)
    {
        logger.LogInformation("Ping: {Message}", message.Message);
        await Clients.Caller.ReceivePing(new ReceivePingMessage
        {
            Message = message.Message
        });
    }
}

public class SendPingMessage
{
    public string Message { get; set; }
}

public class ReceivePingMessage
{
    public string Message { get; set; }
}