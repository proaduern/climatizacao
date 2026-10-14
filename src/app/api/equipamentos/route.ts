import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { TipoEquipamento, StatusEquipamento, TipoModeloGelagua, TipoRefrigerador } from '@prisma/client';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const unidadeId = searchParams.get('unidadeId');
    const tipo = searchParams.get('tipo');
    const q = searchParams.get('q');

    const where: any = {};
    if (unidadeId) where.unidadeId = unidadeId;
    if (tipo) where.tipo = tipo as TipoEquipamento;
    if (q) {
      where.OR = [
        { tombo: { contains: q, mode: 'insensitive' } },
        { marca: { contains: q, mode: 'insensitive' } },
        { modelo: { contains: q, mode: 'insensitive' } },
        { localizacao: { contains: q, mode: 'insensitive' } },
      ];
    }

    const equipamentos = await prisma.equipamento.findMany({
      where,
      include: {
        unidade: { select: { id: true, sigla: true, nome: true, campus: true } },
        intervencoes: {
          where: { chamado: { status: { notIn: ['FINALIZADO', 'CANCELADO'] } } },
          select: {
            id: true,
            chamado: {
              select: { id: true, numeroProtocolo: true, status: true },
            },
          },
        },
      },
      orderBy: { criadoEm: 'desc' },
    });

    const now = new Date();

    const formatados = equipamentos.map((eq) => {
      const emGarantia = eq.emGarantiaAte && new Date(eq.emGarantiaAte) > now;
      const diasGarantiaRestantes = emGarantia
        ? Math.ceil((new Date(eq.emGarantiaAte!).getTime() - now.getTime()) / (1000 * 3600 * 24))
        : 0;

      const chamadoAtivo = eq.intervencoes.length > 0 ? eq.intervencoes[0].chamado : null;

      return {
        id: eq.id,
        tombo: eq.tombo,
        tipo: eq.tipo,
        marca: eq.marca,
        modelo: eq.modelo,
        localizacao: eq.localizacao,
        status: eq.status,
        btus: eq.btus,
        tipoAc: eq.tipoAc,
        gasRefrigerante: eq.gasRefrigerante,
        tecnologiaInverter: eq.tecnologiaInverter,
        litragem: eq.litragem,
        tipoRefrigerador: eq.tipoRefrigerador,
        qtdTorneiras: eq.qtdTorneiras,
        capacidadeLitros: eq.capacidadeLitros,
        modeloGelagua: eq.modeloGelagua,
        refrigeracaoEletronica: eq.refrigeracaoEletronica,
        emGarantia,
        diasGarantiaRestantes,
        emGarantiaAte: eq.emGarantiaAte,
        possuiChamadoAtivo: Boolean(chamadoAtivo),
        chamadoAtivo,
        retificadoPelaEmpresa: eq.retificadoPelaEmpresa,
        retificadoEm: eq.retificadoEm,
        retificadoPorNome: eq.retificadoPorNome,
        observacaoRetificacao: eq.observacaoRetificacao,
        unidade: eq.unidade,
      };
    });

    return NextResponse.json({ equipamentos: formatados });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      unidadeId,
      tombo,
      tipo,
      marca,
      modelo,
      localizacao,
      // AC
      btus,
      tipoAc,
      gasRefrigerante,
      tecnologiaInverter,
      // Geladeira / Freezer
      litragem,
      tipoRefrigerador,
      // Bebedouro
      qtdTorneiras,
      capacidadeLitros,
      // Gelágua
      modeloGelagua,
      refrigeracaoEletronica,
    } = body;

    if (!unidadeId || !tombo || !tipo || !marca || !localizacao) {
      return NextResponse.json(
        { error: 'Campos obrigatórios ausentes: Unidade, Tombo, Tipo, Marca e Localização.' },
        { status: 400 }
      );
    }

    const tomboLimpo = tombo.trim();

    // Verifica se já existe na mesma unidade
    const existente = await prisma.equipamento.findUnique({
      where: {
        unidadeId_tombo: {
          unidadeId,
          tombo: tomboLimpo,
        },
      },
    });

    if (existente) {
      return NextResponse.json(
        { error: `Equipamento com tombo ${tomboLimpo} já cadastrado no inventário desta unidade. Selecione-o na lista.` },
        { status: 409 }
      );
    }

    const novo = await prisma.equipamento.create({
      data: {
        unidadeId,
        tombo: tomboLimpo,
        tipo: tipo as TipoEquipamento,
        marca: marca.trim(),
        modelo: modelo?.trim() || null,
        localizacao: localizacao.trim(),
        status: StatusEquipamento.ATIVO,
        btus: btus ? parseInt(btus, 10) : null,
        tipoAc: tipoAc || null,
        gasRefrigerante: gasRefrigerante || 'R410A',
        tecnologiaInverter: tecnologiaInverter !== undefined ? Boolean(tecnologiaInverter) : true,
        litragem: litragem ? parseInt(litragem, 10) : null,
        tipoRefrigerador: tipoRefrigerador ? (tipoRefrigerador as TipoRefrigerador) : null,
        qtdTorneiras: qtdTorneiras ? parseInt(qtdTorneiras, 10) : null,
        capacidadeLitros: capacidadeLitros ? parseInt(capacidadeLitros, 10) : null,
        modeloGelagua: modeloGelagua ? (modeloGelagua as TipoModeloGelagua) : null,
        refrigeracaoEletronica: Boolean(refrigeracaoEletronica),
      },
      include: { unidade: true },
    });

    return NextResponse.json({
      success: true,
      mensagem: 'Equipamento adicionado ao inventário da unidade com sucesso!',
      equipamento: novo,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      equipamentoId,
      marca,
      modelo,
      btus,
      tipoAc,
      gasRefrigerante,
      litragem,
      qtdTorneiras,
      modeloGelagua,
      observacaoRetificacao,
      tecnicoNome,
    } = body;

    if (!equipamentoId) {
      return NextResponse.json({ error: 'ID do equipamento é obrigatório.' }, { status: 400 });
    }

    const atualizado = await prisma.equipamento.update({
      where: { id: equipamentoId },
      data: {
        marca: marca || undefined,
        modelo: modelo || undefined,
        btus: btus ? parseInt(btus, 10) : undefined,
        tipoAc: tipoAc || undefined,
        gasRefrigerante: gasRefrigerante || undefined,
        litragem: litragem ? parseInt(litragem, 10) : undefined,
        qtdTorneiras: qtdTorneiras ? parseInt(qtdTorneiras, 10) : undefined,
        modeloGelagua: modeloGelagua || undefined,
        retificadoPelaEmpresa: true,
        retificadoEm: new Date(),
        retificadoPorNome: tecnicoNome || 'Técnico Especialista Climatização',
        observacaoRetificacao: observacaoRetificacao || 'Retificação técnica de especificações realizada in loco pela empresa.',
      },
    });

    return NextResponse.json({
      success: true,
      mensagem: 'Especificações técnicas do equipamento retificadas com sucesso no inventário.',
      equipamento: atualizado,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
