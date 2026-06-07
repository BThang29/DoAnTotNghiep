IF OBJECT_ID(N'[dbo].[Messages]', N'U') IS NULL
BEGIN
    CREATE TABLE [dbo].[Messages]
    (
        [id] INT IDENTITY(1,1) NOT NULL,
        [customerName] NVARCHAR(MAX) NOT NULL,
        [userid] INT NOT NULL,
        [createDate] DATETIME NOT NULL,
        [content] NVARCHAR(MAX) NOT NULL,
        CONSTRAINT [PK_Messages] PRIMARY KEY ([id])
    );
END;
GO

IF OBJECT_ID(N'[dbo].[__EFMigrationsHistory]', N'U') IS NOT NULL
AND NOT EXISTS
(
    SELECT 1
    FROM [dbo].[__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260523134500_AddMessageTable'
)
BEGIN
    INSERT INTO [dbo].[__EFMigrationsHistory] ([MigrationId], [ProductVersion])
    VALUES (N'20260523134500_AddMessageTable', N'8.0.7');
END;
GO
