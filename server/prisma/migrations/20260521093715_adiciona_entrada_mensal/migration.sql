-- AlterTable
ALTER TABLE "Condominio" ADD COLUMN     "diaArrecadacao" INTEGER NOT NULL DEFAULT 10;

-- CreateTable
CREATE TABLE "EntradaMensal" (
    "id" TEXT NOT NULL,
    "condominioId" TEXT NOT NULL,
    "mes" TEXT NOT NULL,
    "valor" DOUBLE PRECISION NOT NULL,
    "observacao" TEXT,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "EntradaMensal_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "EntradaMensal_condominioId_mes_key" ON "EntradaMensal"("condominioId", "mes");

-- AddForeignKey
ALTER TABLE "EntradaMensal" ADD CONSTRAINT "EntradaMensal_condominioId_fkey" FOREIGN KEY ("condominioId") REFERENCES "Condominio"("id") ON DELETE CASCADE ON UPDATE CASCADE;
