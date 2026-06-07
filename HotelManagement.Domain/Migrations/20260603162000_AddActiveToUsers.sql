IF COL_LENGTH(N'dbo.Users', N'Active') IS NULL
BEGIN
    ALTER TABLE [dbo].[Users]
    ADD [Active] int NOT NULL
        CONSTRAINT [DF_Users_Active] DEFAULT(1);
END;

UPDATE [dbo].[Users]
SET [Active] = 1
WHERE [Active] IS NULL;
