import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const sgcUrl = process.env.SGC_URL || 'http://localhost:3000';
    const serviceKey = process.env.PROAD_SERVICE_KEY || 'proad_interop_internal_service_key_2026_uern';

    let sgcContratos: any[] = [];
    try {
      const res = await fetch(`${sgcUrl}/api/integracao/manutencao/contratos`, {
        headers: {
          Authorization: `Bearer ${serviceKey}`,
        },
        cache: 'no-store',
      });

      if (res.ok) {
        const data = await res.json();
        sgcContratos = data.contratos || [];
      }
    } catch (fetchErr) {
      console.warn('[AUTO_DISCOVERY_WARN] Falha ao conectar na API SGC (usando dados locais):', fetchErr);
    }

    // Se encontrou contratos no SGC, atualiza ou sincroniza
    let contratoAtivo = await prisma.contratoClima.findFirst({
      where: { isReferenciaAtiva: true },
      include: { empresa: true, itensPreco: true },
    });

    if (sgcContratos.length > 0) {
      // Localiza contrato de climatização ou manutenção 14/2025
      const sgcAlvo = sgcContratos.find((c: any) =>
        (c.objeto && c.objeto.toLowerCase().includes('climatiza')) ||
        (c.objeto && c.objeto.toLowerCase().includes('refrigera')) ||
        (c.numeroContrato && c.numeroContrato.includes('14/2025'))
      ) || sgcContratos[0];

      if (sgcAlvo) {
        // Garante empresa
        let empresaDb = await prisma.empresa.findFirst({
          where: { cnpj: sgcAlvo.fornecedor?.cnpj || '12.345.678/0001-90' },
        });

        if (!empresaDb) {
          empresaDb = await prisma.empresa.create({
            data: {
              cnpj: sgcAlvo.fornecedor?.cnpj || '12.345.678/0001-90',
              razaoSocial: sgcAlvo.fornecedor?.razaoSocial || 'Fornecedor Contratado SGC',
              nomeFantasia: sgcAlvo.fornecedor?.nomeFantasia,
              telefone: sgcAlvo.fornecedor?.telefone,
              email: sgcAlvo.fornecedor?.email,
            },
          });
        }

        // Upsert Contrato
        contratoAtivo = await prisma.contratoClima.upsert({
          where: { numeroContrato: sgcAlvo.numeroContrato || 'Contrato nº 14/2025' },
          update: {
            sgcContratoId: sgcAlvo.id,
            processoSeiMae: sgcAlvo.processoSei || '23077.014298/2025-11',
            valorGlobal: sgcAlvo.valorAtualizado || sgcAlvo.valorGlobal || 180000.0,
            saldoDisponivel: sgcAlvo.saldoDisponivel || 164200.0,
            vigenciaInicio: new Date(sgcAlvo.vigenciaInicio || '2025-01-01'),
            vigenciaFim: new Date(sgcAlvo.vigenciaFim || '2026-12-31'),
            isReferenciaAtiva: true,
            autoSincronizadoEm: new Date(),
          },
          create: {
            numeroContrato: sgcAlvo.numeroContrato || 'Contrato nº 14/2025',
            sgcContratoId: sgcAlvo.id,
            processoSeiMae: sgcAlvo.processoSei || '23077.014298/2025-11',
            empresaId: empresaDb.id,
            valorGlobal: sgcAlvo.valorAtualizado || sgcAlvo.valorGlobal || 180000.0,
            saldoDisponivel: sgcAlvo.saldoDisponivel || 164200.0,
            vigenciaInicio: new Date(sgcAlvo.vigenciaInicio || '2025-01-01'),
            vigenciaFim: new Date(sgcAlvo.vigenciaFim || '2026-12-31'),
            ativo: true,
            isReferenciaAtiva: true,
            autoSincronizadoEm: new Date(),
          },
          include: { empresa: true, itensPreco: true },
        });
      }
    }

    return NextResponse.json({
      success: true,
      mensagem: 'Auto-discovery do contrato de climatização SGC concluído!',
      contratoAtivo: {
        id: contratoAtivo?.id,
        numeroContrato: contratoAtivo?.numeroContrato,
        processoSei: contratoAtivo?.processoSeiMae,
        empresa: contratoAtivo?.empresa?.razaoSocial,
        saldoDisponivel: contratoAtivo?.saldoDisponivel,
        isReferenciaAtiva: contratoAtivo?.isReferenciaAtiva,
        autoSincronizadoEm: contratoAtivo?.autoSincronizadoEm,
      },
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
