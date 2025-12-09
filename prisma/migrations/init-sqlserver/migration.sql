BEGIN TRY

BEGIN TRAN;

-- CreateTable
CREATE TABLE [dbo].[users] (
    [id] NVARCHAR(100) NOT NULL,
    [email] NVARCHAR(255) NOT NULL,
    [name] NVARCHAR(255),
    [hashedPassword] NVARCHAR(255) NOT NULL,
    [role] NVARCHAR(50) CONSTRAINT [users_role_df] DEFAULT 'USER',
    [createdAt] DATETIME2 NOT NULL CONSTRAINT [users_createdAt_df] DEFAULT CURRENT_TIMESTAMP,
    [updatedAt] DATETIME2 NOT NULL,
    CONSTRAINT [users_pkey] PRIMARY KEY CLUSTERED ([id]),
    CONSTRAINT [users_email_key] UNIQUE NONCLUSTERED ([email])
);

-- CreateTable
CREATE TABLE [dbo].[accounts] (
    [id] NVARCHAR(100) NOT NULL,
    [user_id] NVARCHAR(100) NOT NULL,
    [type] NVARCHAR(100) NOT NULL,
    [provider] NVARCHAR(100) NOT NULL,
    [provider_account_id] NVARCHAR(255) NOT NULL,
    [refresh_token] NVARCHAR(max),
    [access_token] NVARCHAR(max),
    [expires_at] INT,
    [token_type] NVARCHAR(100),
    [scope] NVARCHAR(255),
    [id_token] NVARCHAR(max),
    [session_state] NVARCHAR(255),
    CONSTRAINT [accounts_pkey] PRIMARY KEY CLUSTERED ([id]),
    CONSTRAINT [accounts_provider_provider_account_id_key] UNIQUE NONCLUSTERED ([provider],[provider_account_id])
);

-- CreateTable
CREATE TABLE [dbo].[sessions] (
    [id] NVARCHAR(100) NOT NULL,
    [session_token] NVARCHAR(255) NOT NULL,
    [user_id] NVARCHAR(100) NOT NULL,
    [expires] DATETIME2 NOT NULL,
    CONSTRAINT [sessions_pkey] PRIMARY KEY CLUSTERED ([id]),
    CONSTRAINT [sessions_session_token_key] UNIQUE NONCLUSTERED ([session_token])
);

-- CreateTable
CREATE TABLE [dbo].[verificationtokens] (
    [identifier] NVARCHAR(255) NOT NULL,
    [token] NVARCHAR(255) NOT NULL,
    [expires] DATETIME2 NOT NULL,
    CONSTRAINT [verificationtokens_token_key] UNIQUE NONCLUSTERED ([token]),
    CONSTRAINT [verificationtokens_identifier_token_key] UNIQUE NONCLUSTERED ([identifier],[token])
);

-- CreateTable
CREATE TABLE [dbo].[tickets] (
    [id] NVARCHAR(100) NOT NULL,
    [title] NVARCHAR(255) NOT NULL,
    [description] NVARCHAR(max),
    [type] NVARCHAR(100) NOT NULL,
    [priority] NVARCHAR(50) NOT NULL CONSTRAINT [tickets_priority_df] DEFAULT 'MEDIA',
    [status] NVARCHAR(50) NOT NULL CONSTRAINT [tickets_status_df] DEFAULT 'ABIERTO',
    [assignee] NVARCHAR(255),
    [owner_id] NVARCHAR(100) NOT NULL,
    [createdAt] DATETIME2 NOT NULL CONSTRAINT [tickets_createdAt_df] DEFAULT CURRENT_TIMESTAMP,
    [updatedAt] DATETIME2 NOT NULL,
    CONSTRAINT [tickets_pkey] PRIMARY KEY CLUSTERED ([id])
);

-- CreateIndex
CREATE NONCLUSTERED INDEX [idx_ticket_owner] ON [dbo].[tickets]([owner_id]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [idx_ticket_status] ON [dbo].[tickets]([status]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [idx_ticket_priority] ON [dbo].[tickets]([priority]);

-- AddForeignKey
ALTER TABLE [dbo].[accounts] ADD CONSTRAINT [accounts_user_id_fkey] FOREIGN KEY ([user_id]) REFERENCES [dbo].[users]([id]) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE [dbo].[sessions] ADD CONSTRAINT [sessions_user_id_fkey] FOREIGN KEY ([user_id]) REFERENCES [dbo].[users]([id]) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE [dbo].[tickets] ADD CONSTRAINT [tickets_owner_id_fkey] FOREIGN KEY ([owner_id]) REFERENCES [dbo].[users]([id]) ON DELETE NO ACTION ON UPDATE CASCADE;

COMMIT TRAN;

END TRY
BEGIN CATCH

IF @@TRANCOUNT > 0
BEGIN
    ROLLBACK TRAN;
END;
THROW

END CATCH
