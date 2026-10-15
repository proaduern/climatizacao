import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { TipoAmbiente } from '@prisma/client';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { id } = params;

    const ambiente = await prisma.ambienteUnidade.findUnique({
      where: { id },
      include: {
        unidade: true,
        equipamentos: true,
        chamados: {
          select: { id: true, numeroProtocolo: true, status: true, tituloDemanda: true, criadoEm: true },
          orderBy: { criadoEm: 'desc' },
        },
      },
    });

    if (!ambiente) {
      return NextResponse.json({ error: 'Ambiente não encontrado.' }, { status: 404 });
    }

    const prioritarios = ['SALA_DE_AULA', 'LABORATORIO_PESQUISA_ININTERRUPTO', 'SALA_ESTUDOS_BIBLIOTECA'];

    return NextResponse.json({
      ambiente: {
        ...ambiente,
        isPrioritario: prioritarios.includes(ambiente.tipo),
      },
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { id } = params;
    const body = await request.json();
    const { tipo, descricaoDetalhe, bloco, ativo } = body;

    const existente = await prisma.ambienteUnidade.findUnique({
      where: { id },
    });

    if (!existente) {
      return NextResponse.json({ error: 'Ambiente não encontrado.' }, { status: 404 });
    }

    const dataToUpdate: any = {};

    if (tipo !== undefined) {
      if (!Object.values(TipoAmbiente).includes(tipo as TipoAmbiente)) {
        return NextResponse.json({ error: 'Tipo de ambiente inválido.' }, { status: 400 });
      }
      dataToUpdate.tipo = tipo as TipoAmbiente;
    }

    if (descricaoDetalhe !== undefined) {
      const descricaoLimpa = String(descricaoDetalhe).trim();
      if (!descricaoLimpa) {
        return NextResponse.json({ error: 'A descrição do ambiente não pode ser vazia.' }, { status: 400 });
      }

      // Checa duplicidade com outros ambientes da mesma unidade
      const duplicado = await prisma.ambienteUnidade.findFirst({
        where: {
          id: { not: id },
          unidadeId: existente.unidadeId,
          descricaoDetalhe: { equals: descricaoLimpa, mode: 'insensitive' },
        },
      });

      if (duplicado) {
        return NextResponse.json(
          { error: `Já existe outro ambiente cadastrado com o nome "${descricaoLimpa}" nesta unidade.` },
          { status: 409 }
        );
      }

      dataToUpdate.descricaoDetalhe = descricaoLimpa;
    }

    if (bloco !== undefined) {
      dataToUpdate.bloco = bloco ? String(bloco).trim() : null;
    }

    if (ativo !== undefined) {
      dataToUpdate.ativo = Boolean(ativo);
    }

    const atualizado = await prisma.ambienteUnidade.update({
      where: { id },
      data: dataToUpdate,
      include: {
        unidade: true,
        equipamentos: true,
      },
    });

    const prioritarios = ['SALA_DE_AULA', 'LABORATORIO_PESQUISA_ININTERRUPTO', 'SALA_ESTUDOS_BIBLIOTECA'];

    return NextResponse.json({
      success: true,
      mensagem: `Ambiente "${atualizado.descricaoDetalhe}" atualizado com sucesso!`,
      ambiente: {
        ...atualizado,
        isPrioritario: prioritarios.includes(atualizado.tipo),
      },
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { id } = params;

    const ambiente = await prisma.ambienteUnidade.findUnique({
      where: { id },
      include: {
        equipamentos: true,
        chamados: {
          where: { status: { notIn: ['FINALIZADO', 'CANCELADO'] } },
        },
      },
    });

    if (!ambiente) {
      return NextResponse.json({ error: 'Ambiente não encontrado.' }, { status: 404 });
    }

    if (ambiente.equipamentos.length > 0) {
      return NextResponse.json(
        {
          error: `Não é possível excluir o ambiente "${ambiente.descricaoDetalhe}" porque existem ${ambiente.equipamentos.length} máquina(s) vinculada(s) a ele. Remaneje as máquinas antes de excluir.`,
          maquinasCount: ambiente.equipamentos.length,
        },
        { status: 400 }
      );
    }

    if (ambiente.chamados.length > 0) {
      return NextResponse.json(
        {
          error: `Não é possível excluir o ambiente "${ambiente.descricaoDetalhe}" pois existem chamados em andamento vinculados a ele.`,
          chamadosCount: ambiente.chamados.length,
        },
        { status: 400 }
      );
    }

    await prisma.ambienteUnidade.delete({
      where: { id },
    });

    return NextResponse.json({
      success: true,
      mensagem: `Ambiente "${ambiente.descricaoDetalhe}" excluído com sucesso!`,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
