import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { obterSessaoReal, iniciarAtuarComo, SessionPayload } from '@/lib/auth';
import { RoleUsuario } from '@prisma/client';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const sessaoReal = await obterSessaoReal();
    if (!sessaoReal || sessaoReal.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Apenas Administradores podem alternar perfis na Climatização.' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { targetEmail, role, empresaNome } = body as {
      targetEmail?: string;
      role?: RoleUsuario;
      empresaNome?: string;
    };

    let payload: SessionPayload;

    if (targetEmail) {
      const usuario = await prisma.usuario.findUnique({
        where: { email: targetEmail },
        include: { unidade: true, empresa: true },
      });

      if (!usuario) {
        return NextResponse.json({ error: 'Usuário não encontrado.' }, { status: 404 });
      }

      payload = {
        id: usuario.id,
        nome: usuario.nome,
        email: usuario.email,
        cpf: usuario.cpf,
        matricula: usuario.matricula,
        role: usuario.role,
        unidadeId: usuario.unidadeId,
        unidadeSigla: usuario.unidade?.sigla,
        unidadeNome: usuario.unidade?.nome,
        empresaId: usuario.empresaId,
        empresaRazaoSocial: usuario.empresa?.razaoSocial,
      };
    } else if (role === 'EMPRESA') {
      const empresa = await prisma.empresa.findFirst({ orderBy: { razaoSocial: 'asc' } });
      payload = {
        id: 'sim_empresa_clima',
        nome: `Preposto - ${empresaNome || empresa?.razaoSocial || 'Contratada de Climatização'}`,
        email: 'preposto.clima@empresa.com.br',
        cpf: '000.000.000-00',
        matricula: 'EXT-CLIMA',
        role: 'EMPRESA',
        empresaId: empresa?.id || 'sim_empresa_id',
        empresaRazaoSocial: empresaNome || empresa?.razaoSocial || 'Contratada de Climatização',
      };
    } else {
      const roleAlvo: RoleUsuario = role || 'DEMANDANTE';
      const primeiraUnidade = await prisma.unidade.findFirst({ orderBy: { nome: 'asc' } });

      const mapNomes: Record<string, { nome: string; matricula: string }> = {
        FISCAL_TECNICO: { nome: 'Engenheiro Fiscal Técnico (Climatização)', matricula: '010101-1' },
        FISCAL_ADM: { nome: 'Fiscal Administrativo do Contrato', matricula: '010202-2' },
        GESTOR_CONTRATO: { nome: 'Prof. Gestor do Contrato de Clima', matricula: '010303-3' },
        DEMANDANTE: { nome: 'Servidor Demandante da Unidade', matricula: '010404-4' },
        ENGENHARIA_SOBE: { nome: 'Superintendência de Obras e Engenharia (SOBE)', matricula: '010505-5' },
      };

      const info = mapNomes[roleAlvo] || { nome: `Simulação - ${roleAlvo}`, matricula: '000000-0' };

      payload = {
        id: `sim_${roleAlvo.toLowerCase()}`,
        nome: info.nome,
        email: `sim.${roleAlvo.toLowerCase()}@uern.br`,
        cpf: '000.000.000-00',
        matricula: info.matricula,
        role: roleAlvo,
        unidadeId: primeiraUnidade?.id || null,
        unidadeSigla: primeiraUnidade?.sigla || 'CAMPUS-MOSSORO',
        unidadeNome: primeiraUnidade?.nome || 'Campus Central Mossoró',
      };
    }

    await iniciarAtuarComo(payload);

    return NextResponse.json({
      success: true,
      user: payload,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
