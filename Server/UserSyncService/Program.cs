using UserSyncService;

var builder = Host.CreateApplicationBuilder(args);
builder.Services.AddHostedService<Auth0UserSyncService>();

var host = builder.Build();
host.Run();