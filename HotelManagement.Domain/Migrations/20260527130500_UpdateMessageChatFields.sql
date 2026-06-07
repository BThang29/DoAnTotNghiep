IF COL_LENGTH(N'dbo.Messages', N'customerId') IS NULL
BEGIN
    ALTER TABLE [dbo].[Messages] ADD [customerId] int NULL;
END

IF COL_LENGTH(N'dbo.Messages', N'guestToken') IS NULL
BEGIN
    ALTER TABLE [dbo].[Messages] ADD [guestToken] nvarchar(128) NULL;
END

IF COL_LENGTH(N'dbo.Messages', N'assignedAdminUserId') IS NULL
BEGIN
    ALTER TABLE [dbo].[Messages] ADD [assignedAdminUserId] int NULL;
END

IF COL_LENGTH(N'dbo.Messages', N'senderUserId') IS NULL
BEGIN
    ALTER TABLE [dbo].[Messages] ADD [senderUserId] int NULL;
END

IF COL_LENGTH(N'dbo.Messages', N'senderRole') IS NULL
BEGIN
    ALTER TABLE [dbo].[Messages] ADD [senderRole] nvarchar(20) NOT NULL CONSTRAINT [DF_Messages_senderRole] DEFAULT N'Customer';
END

IF COL_LENGTH(N'dbo.Messages', N'conversationKey') IS NULL
BEGIN
    ALTER TABLE [dbo].[Messages] ADD [conversationKey] nvarchar(128) NOT NULL CONSTRAINT [DF_Messages_conversationKey] DEFAULT N'';
END

IF COL_LENGTH(N'dbo.Messages', N'seenDate') IS NULL
BEGIN
    ALTER TABLE [dbo].[Messages] ADD [seenDate] datetime NULL;
END
GO

UPDATE [dbo].[Messages]
SET [conversationKey] =
    CASE
        WHEN ISNULL([customerId], 0) > 0 AND ISNULL([assignedAdminUserId], 0) > 0 THEN CONCAT(N'customer:', [customerId], N':admin:', [assignedAdminUserId])
        WHEN ISNULL([customerId], 0) > 0 THEN CONCAT(N'customer:', [customerId])
        WHEN [guestToken] IS NOT NULL AND LTRIM(RTRIM([guestToken])) <> N'' AND ISNULL([assignedAdminUserId], 0) > 0 THEN CONCAT(N'guest:', LTRIM(RTRIM([guestToken])), N':admin:', [assignedAdminUserId])
        WHEN [guestToken] IS NOT NULL AND LTRIM(RTRIM([guestToken])) <> N'' THEN CONCAT(N'guest:', LTRIM(RTRIM([guestToken])))
        ELSE CONCAT(N'legacy:', [id])
    END
WHERE ISNULL([conversationKey], N'') = N'';
GO

UPDATE [dbo].[Messages]
SET [assignedAdminUserId] = CASE WHEN [userid] > 0 THEN [userid] ELSE NULL END
WHERE [assignedAdminUserId] IS NULL;
GO

UPDATE [dbo].[Messages]
SET [senderRole] = N'Customer'
WHERE ISNULL([senderRole], N'') = N'';
GO

UPDATE [dbo].[Messages]
SET [seenDate] = [createDate]
WHERE [seen] = 1 AND [seenDate] IS NULL;
GO

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = N'IX_Messages_assignedAdminUserId' AND object_id = OBJECT_ID(N'dbo.Messages'))
BEGIN
    CREATE INDEX [IX_Messages_assignedAdminUserId] ON [dbo].[Messages]([assignedAdminUserId]);
END
GO

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = N'IX_Messages_conversationKey' AND object_id = OBJECT_ID(N'dbo.Messages'))
BEGIN
    CREATE INDEX [IX_Messages_conversationKey] ON [dbo].[Messages]([conversationKey]);
END
GO

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = N'IX_Messages_customerId' AND object_id = OBJECT_ID(N'dbo.Messages'))
BEGIN
    CREATE INDEX [IX_Messages_customerId] ON [dbo].[Messages]([customerId]);
END
GO

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = N'IX_Messages_guestToken' AND object_id = OBJECT_ID(N'dbo.Messages'))
BEGIN
    CREATE INDEX [IX_Messages_guestToken] ON [dbo].[Messages]([guestToken]);
END
GO

IF NOT EXISTS (SELECT 1 FROM [dbo].[__EFMigrationsHistory] WHERE [MigrationId] = N'20260527130500_UpdateMessageChatFields')
BEGIN
    INSERT INTO [dbo].[__EFMigrationsHistory] ([MigrationId], [ProductVersion])
    VALUES (N'20260527130500_UpdateMessageChatFields', N'8.0.7');
END
