using System.Data;
using System.IO.Compression;
using System.Text;
using System.Text.Json;
using Auth0.ManagementApi;
using Auth0.ManagementApi.Models;
using Dapper;
using Npgsql;
using UserSyncService.Auth0Api;

namespace UserSyncService;

public class Auth0UserSyncService(
    IConfiguration configuration,
    IHostApplicationLifetime hostApplicationLifetime,
    ILogger<Auth0UserSyncService> logger) : BackgroundService
{
    private async Task<GetAccessTokenResponse> GetAccessToken()
    {
        var client = new HttpClient();
        var request = new HttpRequestMessage();
        request.RequestUri = new Uri($"{configuration["Auth0ManagementAPIM2M:Domain"]}/oauth/token");
        request.Method = HttpMethod.Post;

        var bodyString = JsonSerializer.Serialize(new GetAccessTokenRequest
        {
            ClientId = configuration["Auth0ManagementAPIM2M:ClientId"]!,
            ClientSecret = configuration["Auth0ManagementAPIM2M:ClientSecret"]!,
            Audience = configuration["Auth0ManagementAPIM2M:Audience"]!
        });
        request.Content = new StringContent(bodyString, Encoding.UTF8, "application/json");

        var response = await client.SendAsync(request);
        var result = await response.Content.ReadAsStringAsync();
        return JsonSerializer.Deserialize<GetAccessTokenResponse>(result)!;
    }

    private async Task<Job> CreateExportUsersJob(CancellationToken stoppingToken)
    {
        var accessToken = (await GetAccessToken()).AccessToken;
        
        var client = new ManagementApiClient(accessToken, new Uri($"{configuration["Auth0ManagementAPIM2M:Domain"]}/api/v2")); 
        
        var job = await client.Jobs.ExportUsersAsync(new UsersExportsJobRequest
        {
            Format = UsersExportsJobFormat.CSV,
            Fields = new List<UsersExportsJobField>
            {
                new() { Name = "user_id" },
                new() { Name = "name" },
                new() { Name = "picture" },
            }
        }, stoppingToken);

        while (true)
        {
            if (stoppingToken.IsCancellationRequested)
            {
                break;
            }
            logger.LogInformation("Getting job");
            job = await client.Jobs.GetAsync(job.Id, stoppingToken);
            logger.LogInformation("Job status: {Status}", job.Status);
            
            if (job.Status == "completed")
            {
                logger.LogInformation("Job completed");
                break;
            }
            
            await Task.Delay(1000, stoppingToken);
        }
        
        return job;
    }

    private async Task DoWork(CancellationToken stoppingToken)
    {
        var job = await CreateExportUsersJob(stoppingToken);
        
        var zipFilePath = await DownloadAndSave(job.Location, $"users_{job.Id}.csv.gz");
        var csvFilePath = await ExtractFile(zipFilePath);
        var users = await ReadUsersFromCsvFile(csvFilePath);
        await Import(stoppingToken, users);
        File.Delete(zipFilePath);
        File.Delete(csvFilePath);
    }

    private async Task Import(CancellationToken stoppingToken, DataTable users)
    {
        await using var connection = new NpgsqlConnection(configuration.GetConnectionString("DefaultConnection"));
        await connection.OpenAsync(stoppingToken);
        await using var transaction = await connection.BeginTransactionAsync(stoppingToken);
        try
        {
            const string createTempTableSql =
                """
                CREATE TEMP TABLE temp_users
                (
                  id TEXT PRIMARY KEY,
                  full_name TEXT,
                  picture TEXT
                );
                """;
            await connection.ExecuteAsync(createTempTableSql);

            const string copySql = "COPY temp_users (id, full_name, picture) FROM STDIN (FORMAT BINARY)";
            await using (var writer = await connection.BeginBinaryImportAsync(copySql, stoppingToken))
            {
                for (var i = 1; i < users.Rows.Count; i++)
                {
                    var row = users.Rows[i];
                    await writer.StartRowAsync(stoppingToken);
                    await writer.WriteAsync(row["id"], NpgsqlTypes.NpgsqlDbType.Text, stoppingToken);
                    await writer.WriteAsync(row["full_name"], NpgsqlTypes.NpgsqlDbType.Text, stoppingToken);
                    await writer.WriteAsync(row["picture"], NpgsqlTypes.NpgsqlDbType.Text, stoppingToken);
                }

                await writer.CompleteAsync(stoppingToken);
            }

            const string upsertSql =
                """
                INSERT INTO "Users" ("Id", "FullName", "Picture")
                SELECT id, full_name, picture
                FROM temp_users
                ON CONFLICT ("Id") DO UPDATE
                    SET "FullName" = EXCLUDED."FullName", "Picture" = EXCLUDED."Picture";
                """;
            await connection.ExecuteAsync(upsertSql);

            await transaction.CommitAsync(stoppingToken);
        }
        catch (Exception)
        {
            await transaction.RollbackAsync(stoppingToken);
            throw;
        }
    }

    private static async Task<DataTable> ReadUsersFromCsvFile(string filePath)
    {
        // Create a DataTable
        var dt = new DataTable();
        dt.Columns.Add("id", typeof(string));
        dt.Columns.Add("full_name", typeof(string));
        dt.Columns.Add("picture", typeof(string));
        
        // Read the file
        var lines = await File.ReadAllLinesAsync(filePath);

        foreach (var line in lines)
        {
            var values = line.Split(',')
                .Select(x => x.Trim('\"').TrimStart('\'').Replace("\"", string.Empty))
                .ToArray();

            // ReSharper disable once CoVariantArrayConversion
            dt.Rows.Add(values);
        }
        
        return dt;
    }

    private static async Task<string> ExtractFile(string zipFilePath)
    {
        var extractedFilePath = Path.Combine("temp", Path.GetFileNameWithoutExtension(zipFilePath));
        await using var fileStream = File.OpenRead(zipFilePath);
        await using var gzipStream = new GZipStream(fileStream, CompressionMode.Decompress);
        await using var extractedFileStream = File.Create(extractedFilePath);
        await gzipStream.CopyToAsync(extractedFileStream);

        return extractedFilePath;
    }

    private async Task<string> DownloadAndSave(Uri sourceFile, string destinationFileName)
    {
        using var httpClient = new HttpClient();
        var fileStream = await httpClient.GetStreamAsync(sourceFile);
        Directory.CreateDirectory("temp");
        var path = Path.Combine("temp", destinationFileName);

        await using var outputFileStream = new FileStream(path, FileMode.CreateNew);
        await fileStream.CopyToAsync(outputFileStream);

        return path;
    }

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        logger.LogInformation("Auth0UserService is starting.");
        await DoWork(stoppingToken);
        logger.LogInformation("Auth0UserService is stopping.");
        hostApplicationLifetime.StopApplication();
        logger.LogInformation("Auth0UserService has stopped.");
    }
}