FROM mcr.microsoft.com/dotnet/sdk:8.0.202 AS build
WORKDIR /source

RUN dotnet tool install --global dotnet-ef
ENV PATH="${PATH}:/root/.dotnet/tools"

COPY Core/Core.csproj Core/Core.csproj
COPY DbMigrator/DbMigrator.csproj DbMigrator/DbMigrator.csproj

RUN dotnet restore DbMigrator/DbMigrator.csproj

COPY Core/ Core/
COPY DbMigrator/ DbMigrator/

RUN dotnet ef migrations bundle -p DbMigrator/DbMigrator.csproj -o /out/efbundle -v

FROM mcr.microsoft.com/dotnet/runtime:8.0.3
WORKDIR /db-migrator
COPY --from=build /out/efbundle .
COPY DbMigrator/appsettings.json .
ENTRYPOINT [ "/db-migrator/efbundle" ]