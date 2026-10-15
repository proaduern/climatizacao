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
        unidade: { select: { id: true, sigla: true, nome: true, campus: true, cidade: true } },
        ambiente: { select: { id: true, tipo: true, descricaoDetalhe: true, bloco: true } },
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
        ambienteId: eq.ambienteId,
        ambiente: eq.ambiente,
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
      ambienteId,
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

    if (!unidadeId || !tombo || !tipo || !marca) {
      return NextResponse.json(
        { error: 'Campos obrigatórios ausentes: Unidade, Tombo, Tipo e Marca.' },
        { status: 400 }
      );
    }

    const tomboLimpo = tombo.trim();

    // 1. Bloqueio Estrito de Duplicidade de Tombo em todo o patrimônio da UERN
    const existente = await prisma.equipamento.findFirst({
      where: { tombo: tomboLimpo },
      include: { unidade: true },
    });

    if (existente) {
      return NextResponse.json(
        {
          error: `Bloqueio de Duplicidade: Já existe um equipamento cadastrado com o tombo "${tomboLimpo}" na unidade ${existente.unidade.sigla}. O número de tombo patrimonial é único.`,
        },
        { status: 409 }
      );
    }

    // 2. Vínculo Obrigatório com Ambiente / Espaço Físico
    if (!ambienteId) {
      return NextResponse.json(
        {
          error: 'Vínculo Obrigatório: Toda máquina cadastrada deve ser necessariamente vinculada a um ambiente/espaço físico da unidade.',
        },
        { status: 400 }
      );
    }

    const ambiente = await prisma.ambienteUnidade.findUnique({
      where: { id: ambienteId },
    });

    if (!ambiente) {
      return NextResponse.json(
        { error: 'O ambiente/espaço físico selecionado não foi encontrado na base de dados.' },
        { status: 404 }
      );
    }

    const finalLocalizacao = localizacao?.trim() || ambiente.descricaoDetalhe;

    const novo = await prisma.equipamento.create({
      data: {
        unidadeId,
        ambienteId,
        tombo: tomboLimpo,
        tipo: tipo as TipoEquipamento,
        marca: marca.trim(),
        modelo: modelo?.trim() || null,
        localizacao: finalLocalizacao,
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
      include: {
        unidade: true,
        ambiente: true,
      },
    });

    return NextResponse.json({
      success: true,
      mensagem: `Equipamento Tombo ${novo.tombo} adicionado com sucesso e vinculado ao ambiente "${ambiente.descricaoDetalhe}"!`,
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

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      id,
      equipamentoId,
      unidadeId,
      tombo,
      tipo,
      marca,
      modelo,
      localizacao,
      status,
      btus,
      tipoAc,
      gasRefrigerante,
      tecnologiaInverter,
      litragem,
      tipoRefrigerador,
      qtdTorneiras,
      capacidadeLitros,
      modeloGelagua,
      refrigeracaoEletronica,
      emGarantiaAte,
    } = body;

    const targetId = id || equipamentoId;
    if (!targetId) {
      return NextResponse.json({ error: 'ID do equipamento é obrigatório para atualização.' }, { status: 400 });
    }

    const tomboLimpo = tombo ? String(tombo).trim() : undefined;

    // Se mudou o tombo ou unidade, checa duplicidade
    if (tomboLimpo && unidadeId) {
      const duplicado = await prisma.equipamento.findFirst({
        where: {
          id: { not: targetId },
          unidadeId,
          tombo: tomboLimpo,
        },
      });
      if (duplicado) {
        return NextResponse.json(
          { error: `Já existe outro equipamento com tombo ${tomboLimpo} cadastrado nesta unidade.` },
          { status: 409 }
        );
      }
    }

    const atualizado = await prisma.equipamento.update({
      where: { id: targetId },
      data: {
        unidadeId: unidadeId || undefined,
        tombo: tomboLimpo,
        tipo: tipo ? (tipo as TipoEquipamento) : undefined,
        marca: marca ? String(marca).trim() : undefined,
        modelo: modelo !== undefined ? (modelo ? String(modelo).trim() : null) : undefined,
        localizacao: localizacao ? String(localizacao).trim() : undefined,
        status: status ? (status as StatusEquipamento) : undefined,
        btus: btus !== undefined ? (btus ? parseInt(btus, 10) : null) : undefined,
        tipoAc: tipoAc !== undefined ? tipoAc : undefined,
        gasRefrigerante: gasRefrigerante !== undefined ? gasRefrigerante : undefined,
        tecnologiaInverter: tecnologiaInverter !== undefined ? Boolean(tecnologiaInverter) : undefined,
        litragem: litragem !== undefined ? (litragem ? parseInt(litragem, 10) : null) : undefined,
        tipoRefrigerador: tipoRefrigerador !== undefined ? (tipoRefrigerador as TipoRefrigerador) : undefined,
        qtdTorneiras: qtdTorneiras !== undefined ? (qtdTorneiras ? parseInt(qtdTorneiras, 10) : null) : undefined,
        capacidadeLitros: capacidadeLitros !== undefined ? (capacidadeLitros ? parseInt(capacidadeLitros, 10) : null) : undefined,
        modeloGelagua: modeloGelagua !== undefined ? (modeloGelagua as TipoModeloGelagua) : undefined,
        refrigeracaoEletronica: refrigeracaoEletronica !== undefined ? Boolean(refrigeracaoEletronica) : undefined,
        emGarantiaAte: emGarantiaAte ? new Date(emGarantiaAte) : undefined,
      },
      include: { unidade: true },
    });

    return NextResponse.json({
      success: true,
      mensagem: `Equipamento ${atualizado.tombo} atualizado com sucesso no inventário!`,
      equipamento: atualizado,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    let id = searchParams.get('id');

    if (!id) {
      try {
        const body = await request.json();
        id = body?.id;
      } catch (e) {}
    }

    if (!id) {
      return NextResponse.json({ error: 'ID do equipamento é obrigatório para exclusão.' }, { status: 400 });
    }

    const eq = await prisma.equipamento.findUnique({
      where: { id },
      include: {
        intervencoes: {
          include: {
            chamado: { select: { id: true, numeroProtocolo: true, status: true } },
          },
        },
      },
    });

    if (!eq) {
      return NextResponse.json({ error: 'Equipamento não encontrado.' }, { status: 404 });
    }

    const chamadosAtivos = eq.intervencoes.filter(
      (i) => i.chamado && !['FINALIZADO', 'CANCELADO'].includes(i.chamado.status)
    );

    if (chamadosAtivos.length > 0) {
      return NextResponse.json(
        {
          error: `Não é possível excluir o equipamento ${eq.tombo} pois há o chamado ativo ${chamadosAtivos[0].chamado.numeroProtocolo} vinculado. Cancele ou finalize o chamado primeiro.`,
        },
        { status: 400 }
      );
    }

    // Se tiver intervenções passadas, desvincula ou remove para permitir a exclusão patrimonial pelo Admin
    if (eq.intervencoes.length > 0) {
      await prisma.intervencaoItem.deleteMany({
        where: { equipamentoId: id },
      });
    }

    await prisma.equipamento.delete({
      where: { id },
    });

    return NextResponse.json({
      success: true,
      mensagem: `Equipamento ${eq.tombo} (${eq.marca} ${eq.modelo || ''}) excluído com sucesso do inventário!`,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

