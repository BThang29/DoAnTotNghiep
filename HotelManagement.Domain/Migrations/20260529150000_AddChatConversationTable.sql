IF OBJECT_ID(N'[dbo].[ChatConversations]', N'U') IS NULL
BEGIN
    CREATE TABLE [dbo].[ChatConversations]
    (
        [id] int IDENTITY(1,1) NOT NULL,
        [conversationKey] nvarchar(128) NOT NULL,
        [customerId] int NULL,
        [guestSessionToken] nvarchar(128) NULL,
        [guestDisplayName] nvarchar(255) NULL,
        [guestEmail] nvarchar(255) NULL,
        [guestPhone] nvarchar(32) NULL,
        [verificationStatus] nvarchar(32) NOT NULL CONSTRAINT [DF_ChatConversations_verificationStatus] DEFAULT N'Unverified',
        [verificationCode] nvarchar(16) NULL,
        [verificationCodeExpiresAt] datetime NULL,
        [verifiedAt] datetime NULL,
        [assignedAdminUserId] int NULL,
        [createdDate] datetime NOT NULL CONSTRAINT [DF_ChatConversations_createdDate] DEFAULT GETDATE(),
        [lastMessageDate] datetime NULL,
        [lastMessagePreview] nvarchar(max) NULL,
        CONSTRAINT [PK_ChatConversations] PRIMARY KEY ([id])
    );
END;

IF COL_LENGTH(N'dbo.Messages', N'conversationId') IS NULL
BEGIN
    ALTER TABLE [dbo].[Messages] ADD [conversationId] int NULL;
END;

IF OBJECT_ID('tempdb..#CanonicalMessages') IS NOT NULL
    DROP TABLE #CanonicalMessages;

SELECT
    M.[id],
    CASE
        WHEN ISNULL(M.[customerId], 0) > 0 THEN CONCAT(N'customer:', M.[customerId])
        WHEN NULLIF(LTRIM(RTRIM(M.[guestToken])), N'') IS NOT NULL THEN CONCAT(N'guest:', LTRIM(RTRIM(M.[guestToken])))
        WHEN ISNULL(LTRIM(RTRIM(M.[conversationKey])), N'') <> N'' THEN LTRIM(RTRIM(M.[conversationKey]))
        ELSE CONCAT(N'conversation:', M.[id])
    END AS [canonicalConversationKey],
    M.[customerId],
    M.[guestToken],
    M.[customerName],
    M.[assignedAdminUserId],
    M.[createDate],
    M.[content]
INTO #CanonicalMessages
FROM [dbo].[Messages] M;

;WITH ConversationSeed AS
(
    SELECT
        M.[canonicalConversationKey] AS [conversationKey],
        MAX(M.[customerId]) AS [customerId],
        MAX(NULLIF(LTRIM(RTRIM(M.[guestToken])), N'')) AS [guestSessionToken],
        MAX(CASE WHEN ISNULL(M.[customerId], 0) = 0 THEN NULLIF(LTRIM(RTRIM(M.[customerName])), N'') END) AS [guestDisplayName],
        MAX(M.[assignedAdminUserId]) AS [assignedAdminUserId],
        MIN(M.[createDate]) AS [createdDate],
        MAX(M.[createDate]) AS [lastMessageDate]
    FROM #CanonicalMessages M
    GROUP BY M.[canonicalConversationKey]
),
LatestMessage AS
(
    SELECT
        M.[canonicalConversationKey] AS [conversationKey],
        M.[content],
        ROW_NUMBER() OVER (PARTITION BY M.[canonicalConversationKey] ORDER BY M.[createDate] DESC, M.[id] DESC) AS [rn]
    FROM #CanonicalMessages M
)
INSERT INTO [dbo].[ChatConversations]
(
    [conversationKey],
    [customerId],
    [guestSessionToken],
    [guestDisplayName],
    [guestEmail],
    [guestPhone],
    [verificationStatus],
    [verificationCode],
    [verificationCodeExpiresAt],
    [verifiedAt],
    [assignedAdminUserId],
    [createdDate],
    [lastMessageDate],
    [lastMessagePreview]
)
SELECT
    S.[conversationKey],
    S.[customerId],
    S.[guestSessionToken],
    COALESCE(S.[guestDisplayName], N'Khach vang lai'),
    NULL,
    NULL,
    CASE WHEN ISNULL(S.[customerId], 0) > 0 THEN N'Verified' ELSE N'Unverified' END,
    NULL,
    NULL,
    CASE WHEN ISNULL(S.[customerId], 0) > 0 THEN S.[createdDate] ELSE NULL END,
    S.[assignedAdminUserId],
    S.[createdDate],
    S.[lastMessageDate],
    LM.[content]
FROM ConversationSeed S
LEFT JOIN LatestMessage LM
    ON LM.[conversationKey] = S.[conversationKey]
   AND LM.[rn] = 1
WHERE NOT EXISTS
(
    SELECT 1
    FROM [dbo].[ChatConversations] C
    WHERE C.[conversationKey] = S.[conversationKey]
);

UPDATE M
SET M.[conversationKey] = C.[canonicalConversationKey]
FROM [dbo].[Messages] M
INNER JOIN #CanonicalMessages C
    ON C.[id] = M.[id]
WHERE ISNULL(M.[conversationKey], N'') <> C.[canonicalConversationKey];

UPDATE M
SET M.[conversationId] = C.[id]
FROM [dbo].[Messages] M
INNER JOIN [dbo].[ChatConversations] C
    ON C.[conversationKey] = M.[conversationKey]
WHERE M.[conversationId] IS NULL;

IF EXISTS (SELECT 1 FROM [dbo].[Messages] WHERE [conversationId] IS NULL)
BEGIN
    RAISERROR(N'Khong the backfill conversationId cho bang Messages.', 16, 1);
END;

IF EXISTS
(
    SELECT 1
    FROM sys.columns
    WHERE [object_id] = OBJECT_ID(N'[dbo].[Messages]')
      AND [name] = N'conversationId'
      AND [is_nullable] = 1
)
BEGIN
    ALTER TABLE [dbo].[Messages] ALTER COLUMN [conversationId] int NOT NULL;
END;

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE [name] = N'IX_ChatConversations_assignedAdminUserId' AND [object_id] = OBJECT_ID(N'[dbo].[ChatConversations]'))
    CREATE INDEX [IX_ChatConversations_assignedAdminUserId] ON [dbo].[ChatConversations]([assignedAdminUserId]);

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE [name] = N'IX_ChatConversations_conversationKey' AND [object_id] = OBJECT_ID(N'[dbo].[ChatConversations]'))
    CREATE UNIQUE INDEX [IX_ChatConversations_conversationKey] ON [dbo].[ChatConversations]([conversationKey]);

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE [name] = N'IX_ChatConversations_customerId' AND [object_id] = OBJECT_ID(N'[dbo].[ChatConversations]'))
    CREATE UNIQUE INDEX [IX_ChatConversations_customerId] ON [dbo].[ChatConversations]([customerId]) WHERE [customerId] IS NOT NULL;

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE [name] = N'IX_ChatConversations_guestSessionToken' AND [object_id] = OBJECT_ID(N'[dbo].[ChatConversations]'))
    CREATE UNIQUE INDEX [IX_ChatConversations_guestSessionToken] ON [dbo].[ChatConversations]([guestSessionToken]) WHERE [guestSessionToken] IS NOT NULL;

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE [name] = N'IX_ChatConversations_verificationStatus' AND [object_id] = OBJECT_ID(N'[dbo].[ChatConversations]'))
    CREATE INDEX [IX_ChatConversations_verificationStatus] ON [dbo].[ChatConversations]([verificationStatus]);

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE [name] = N'IX_Messages_conversationId' AND [object_id] = OBJECT_ID(N'[dbo].[Messages]'))
    CREATE INDEX [IX_Messages_conversationId] ON [dbo].[Messages]([conversationId]);

IF NOT EXISTS (SELECT 1 FROM sys.foreign_keys WHERE [name] = N'FK_Messages_ChatConversations_conversationId')
BEGIN
    ALTER TABLE [dbo].[Messages]
    ADD CONSTRAINT [FK_Messages_ChatConversations_conversationId]
        FOREIGN KEY ([conversationId]) REFERENCES [dbo].[ChatConversations]([id]) ON DELETE CASCADE;
END;

IF OBJECT_ID('tempdb..#CanonicalMessages') IS NOT NULL
    DROP TABLE #CanonicalMessages;
