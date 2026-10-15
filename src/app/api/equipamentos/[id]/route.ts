import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { TipoEquipamento, StatusEquipamento, TipoModeloGelagua, TipoRefrigerador } from '@prisma/client';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { id } = params;
    const eq = await prisma.equipamento.findUnique({
      where: { id },
      include: {
        unidade: true,
        intervencoes: {
          include: {
            chamado: true,
          },
        },
      },
    });

    if (!eq) {
      return NextResponse.json({ error: 'Equipamento não encontrado.' }, { status: 404 });
    }

    return NextResponse.json({ equipamento: eq });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { id } = params;
    const body = await request.json();
    const {
      unidadeId,
      ambienteId,
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

    const tomboLimpo = tombo ? String(tombo).trim() : undefined;

    if (tomboLimpo) {
      const duplicado = await prisma.equipamento.findFirst({
        where: {
          id: { not: id },
          tombo: tomboLimpo,
        },
        include: { unidade: true },
      });
      if (duplicado) {
        return NextResponse.json(
          { error: `Bloqueio de Duplicidade: Já existe outro equipamento cadastrado com o tombo "${tomboLimpo}" na unidade ${duplicado.unidade.sigla}.` },
          { status: 409 }
        );
      }
    }

    const dataToUpdate: any = {};
    if (unidadeId) dataToUpdate.unidadeId = unidadeId;
    if (tomboLimpo) dataToUpdate.tombo = tomboLimpo;
    if (tipo) dataToUpdate.tipo = tipo as TipoEquipamento;
    if (marca) dataToUpdate.marca = String(marca).trim();
    if (modelo !== undefined) dataToUpdate.modelo = modelo ? String(modelo).trim() : null;
    if (localizacao) dataToUpdate.localizacao = String(localizacao).trim();
    if (status) dataToUpdate.status = status as StatusEquipamento;
    if (btus !== undefined) dataToUpdate.btus = btus ? parseInt(btus, 10) : null;
    if (tipoAc !== undefined) dataToUpdate.tipoAc = tipoAc;
    if (gasRefrigerante !== undefined) dataToUpdate.gasRefrigerante = gasRefrigerante;
    if (tecnologiaInverter !== undefined) dataToUpdate.tecnologiaInverter = Boolean(tecnologiaInverter);
    if (litragem !== undefined) dataToUpdate.litragem = litragem ? parseInt(litragem, 10) : null;
    if (tipoRefrigerador !== undefined) dataToUpdate.tipoRefrigerador = tipoRefrigerador as TipoRefrigerador;
    if (qtdTorneiras !== undefined) dataToUpdate.qtdTorneiras = qtdTorneiras ? parseInt(qtdTorneiras, 10) : null;
    if (capacidadeLitros !== undefined) dataToUpdate.capacidadeLitros = capacidadeLitros ? parseInt(capacidadeLitros, 10) : null;
    if (modeloGelagua !== undefined) dataToUpdate.modeloGelagua = modeloGelagua as TipoModeloGelagua;
    if (refrigeracaoEletronica !== undefined) dataToUpdate.refrigeracaoEletronica = Boolean(refrigeracaoEletronica);
    if (emGarantiaAte) dataToUpdate.emGarantiaAte = new Date(emGarantiaAte);

    if (ambienteId !== undefined) {
      if (ambienteId) {
        const amb = await prisma.ambienteUnidade.findUnique({ where: { id: ambienteId } });
        if (!amb) {
          return NextResponse.json({ error: 'Ambiente físico informado não encontrado.' }, { status: 404 });
        }
        dataToUpdate.ambienteId = ambienteId;
        if (!localizacao) {
          dataToUpdate.localizacao = amb.descricaoDetalhe;
        }
      } else {
        dataToUpdate.ambienteId = null;
      }
    }

    const atualizado = await prisma.equipamento.update({
      where: { id },
      data: dataToUpdate,
      include: {
        unidade: true,
        ambiente: true,
      },
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

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { id } = params;

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
