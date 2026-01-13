-- AlterTable: Add folio column to tickets table
ALTER TABLE [dbo].[tickets] ADD [folio] INT NOT NULL IDENTITY(1,1);

-- CreateIndex: Add unique constraint on tickets.folio
ALTER TABLE [dbo].[tickets] ADD CONSTRAINT [tickets_folio_key] UNIQUE ([folio]);

-- CreateIndex: Add index on tickets.folio
CREATE INDEX [idx_ticket_folio] ON [dbo].[tickets]([folio]);

-- AlterTable: Add folio column to citas table
ALTER TABLE [dbo].[citas] ADD [folio] INT NOT NULL IDENTITY(1,1);

-- CreateIndex: Add unique constraint on citas.folio
ALTER TABLE [dbo].[citas] ADD CONSTRAINT [citas_folio_key] UNIQUE ([folio]);

-- CreateIndex: Add index on citas.folio
CREATE INDEX [idx_cita_folio] ON [dbo].[citas]([folio]);
