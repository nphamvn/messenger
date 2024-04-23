using UserSyncService;

var builder = Host.CreateApplicationBuilder(args);
builder.Services.AddHostedService<Auth0UserAsyncService>();

var host = builder.Build();
host.Run();