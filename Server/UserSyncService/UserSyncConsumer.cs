using MassTransit;

namespace UserSyncService;

public class Message
{
    public string Text { get; set; }
}

public class MessageConsumer(ILogger<MessageConsumer> logger) : IConsumer<Message>
{
    public Task Consume(ConsumeContext<Message> context)
    {
        logger.LogInformation("Received Message: {Text}", context.Message.Text);

        return Task.CompletedTask;
    }
}