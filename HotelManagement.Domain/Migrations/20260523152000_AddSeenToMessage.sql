IF OBJECT_ID(N'[dbo].[Messages]', N'U') IS NULL
BEGIN
    RAISERROR(N'Bang dbo.Messages khong ton tai.', 16, 1);
    RETURN;
END;
GO

IF COL_LENGTH(N'dbo.Messages', N'seen') IS NULL
BEGIN
    ALTER TABLE [dbo].[Messages]
    ADD [seen] bit NOT NULL CONSTRAINT [DF_Messages_seen] DEFAULT ((0));
END;
GO

IF OBJECT_ID(N'[dbo].[__EFMigrationsHistory]', N'U') IS NOT NULL
AND NOT EXISTS
(
    SELECT 1
    FROM [dbo].[__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260523152000_AddSeenToMessage'
)
BEGIN
    INSERT INTO [dbo].[__EFMigrationsHistory] ([MigrationId], [ProductVersion])
    VALUES (N'20260523152000_AddSeenToMessage', N'8.0.7');
END;
GO
