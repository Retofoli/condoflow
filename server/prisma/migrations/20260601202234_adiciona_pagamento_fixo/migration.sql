-- CreateTable
CREATE TABLE "PagamentoFixo" (
    "id" TEXT NOT NULL,
    "condominioId" TEXT NOT NULL,
    "contaFixaId" TEXT NOT NULL,
    "mes" TEXT NOT NULL,
    "valorPrevisto" DOUBLE PRECISION NOT NULL,
    "valorPago" DOUBLE PRECISION,
    "dataPagamento" TIMESTAMP(3),
    "observacao" TEXT,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PagamentoFixo_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "PagamentoFixo_contaFixaId_mes_key" ON "PagamentoFixo"("contaFixaId", "mes");

-- AddForeignKey
ALTER TABLE "PagamentoFixo" ADD CONSTRAINT "PagamentoFixo_condominioId_fkey" FOREIGN KEY ("condominioId") REFERENCES "Condominio"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PagamentoFixo" ADD CONSTRAINT "PagamentoFixo_contaFixaId_fkey" FOREIGN KEY ("contaFixaId") REFERENCES "ContaFixa"("id") ON DELETE CASCADE ON UPDATE CASCADE;
