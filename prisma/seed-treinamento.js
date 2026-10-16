/**
 * Script de Seed do Ambiente de Treinamento e Capacitação (SIG-CLIMA UERN)
 * Popula o schema 'climatizacao_treinamento' com dados realistas, usuários didáticos
 * e cenários de teste para oficinas de capacitação de fiscais e demandantes.
 */

const {
  PrismaClient,
  RoleUsuario,
  TipoEquipamento,
  StatusEquipamento,
  StatusChamado,
  CategoriaServico,
  DefeitoCorretivaComum,
} = require('@prisma/client');

const connectionUrl =
  process.env.DATABASE_URL_TREINAMENTO ||
  process.env.DATABASE_URL ||
  'postgresql://neondb_owner:npg_U3vzx7PrcCna@ep-still-butterfly-acl9x8uu-pooler.sa-east-1.aws.neon.tech/neondb?schema=climatizacao_treinamento&sslmode=require&channel_binding=require&pgbouncer=true';

const prisma = new PrismaClient({
  datasources: {
    db: { url: connectionUrl },
  },
});

async function runSeedTreinamento() {
  console.log('--- INICIANDO SEED DIDÁTICO DE TREINAMENTO (SIG-CLIMA UERN) ---');

  // 1. Limpeza segura de dados de treinamento anteriores
  try {
    console.log('Limpando dados anteriores de treinamento...');
    await prisma.historicoChamado.deleteMany({});
    await prisma.orcamentoItemDetalhamento.deleteMany({});
    await prisma.intervencaoItem.deleteMany({});
    await prisma.chamado.deleteMany({});
    await prisma.equipamento.deleteMany({});
    await prisma.ambienteUnidade.deleteMany({});
    await prisma.itemContratoPreco.deleteMany({});
    await prisma.medicaoMensal.deleteMany({});
    await prisma.contratoClima.deleteMany({});
    await prisma.usuario.deleteMany({});
    await prisma.empresa.deleteMany({});
    await prisma.unidade.deleteMany({});
    console.log('Limpeza concluída.');
  } catch (err) {
    console.log('Aviso ao limpar tabelas:', err.message);
  }

  // 2. Unidades e Cidades
  console.log('Cadastrando unidades simuladas...');
  const unidadesData = [
    { sigla: 'FAFIC', nome: 'Faculdade de Filosofia e Ciências Sociais (Treinamento)', campus: 'Central Mossoró', cidade: 'Mossoró' },
    { sigla: 'DINF', nome: 'Departamento de Informática (Treinamento)', campus: 'Central Mossoró', cidade: 'Mossoró' },
    { sigla: 'PROAD', nome: 'Pró-Reitoria de Administração (Treinamento)', campus: 'Central Mossoró', cidade: 'Mossoró' },
    { sigla: 'CAMPUS-ASSU', nome: 'Campus Avançado de Assú (Treinamento)', campus: 'Assú', cidade: 'Assú' },
    { sigla: 'CAMPUS-PAU-DOS-FERROS', nome: 'Campus de Pau dos Ferros (Treinamento)', campus: 'Pau dos Ferros', cidade: 'Pau dos Ferros' },
  ];

  const unidades = {};
  for (const u of unidadesData) {
    unidades[u.sigla] = await prisma.unidade.upsert({
      where: { sigla: u.sigla },
      update: { nome: u.nome, campus: u.campus, cidade: u.cidade },
      create: u,
    });
  }

  // 3. Ambientes Simulados com Prioridades
  console.log('Cadastrando ambientes e salas simuladas...');
  const ambientesData = [
    { unidadeSigla: 'FAFIC', tipo: 'SALA_DE_AULA', descricaoDetalhe: 'Sala de Aula 04 (Treinamento)', bloco: 'Bloco Central' },
    { unidadeSigla: 'FAFIC', tipo: 'SALA_ESTUDOS_BIBLIOTECA', descricaoDetalhe: 'Sala de Estudos Biblioteca FAFIC', bloco: 'Biblioteca Setorial' },
    { unidadeSigla: 'FAFIC', tipo: 'SALA_ADMINISTRATIVA', descricaoDetalhe: 'Secretaria Acadêmica FAFIC', bloco: 'Bloco Central' },
    { unidadeSigla: 'DINF', tipo: 'LABORATORIO_PESQUISA_ININTERRUPTO', descricaoDetalhe: 'Lab de Servidores & Datacenter (Ininterrupto)', bloco: 'Bloco DINF' },
    { unidadeSigla: 'DINF', tipo: 'LABORATORIOS_DIVERSOS', descricaoDetalhe: 'Laboratório de Informática 01', bloco: 'Bloco DINF' },
    { unidadeSigla: 'PROAD', tipo: 'SALA_ADMINISTRATIVA', descricaoDetalhe: 'Gabinete PROAD', bloco: 'Reitoria' },
    { unidadeSigla: 'CAMPUS-ASSU', tipo: 'SALA_DE_AULA', descricaoDetalhe: 'Sala de Aula 01 - Bloco A', bloco: 'Pavilhão A' },
    { unidadeSigla: 'CAMPUS-PAU-DOS-FERROS', tipo: 'SALA_DE_AULA', descricaoDetalhe: 'Sala de Aula 02 - Pavilhão Central', bloco: 'Bloco Principal' },
  ];

  const ambientes = {};
  for (const a of ambientesData) {
    const un = unidades[a.unidadeSigla];
    const ambCriado = await prisma.ambienteUnidade.upsert({
      where: {
        unidadeId_descricaoDetalhe: {
          unidadeId: un.id,
          descricaoDetalhe: a.descricaoDetalhe,
        },
      },
      update: { tipo: a.tipo, bloco: a.bloco },
      create: {
        unidadeId: un.id,
        tipo: a.tipo,
        descricaoDetalhe: a.descricaoDetalhe,
        bloco: a.bloco,
      },
    });
    ambientes[a.descricaoDetalhe] = ambCriado;
  }

  // 4. Empresa Prestadora Simulada
  console.log('Cadastrando empresa prestadora didática...');
  const empresa = await prisma.empresa.upsert({
    where: { cnpj: '99.999.999/0001-99' },
    update: {
      razaoSocial: 'ECOCLIMA SERVIÇOS TÉCNICOS LTDA (TREINAMENTO)',
      nomeFantasia: 'ECOCLIMA TREINAMENTO UERN',
      telefone: '(84) 98888-7777',
      email: 'contato@ecoclimatreinamento.com.br',
    },
    create: {
      cnpj: '99.999.999/0001-99',
      razaoSocial: 'ECOCLIMA SERVIÇOS TÉCNICOS LTDA (TREINAMENTO)',
      nomeFantasia: 'ECOCLIMA TREINAMENTO UERN',
      telefone: '(84) 98888-7777',
      email: 'contato@ecoclimatreinamento.com.br',
    },
  });

  // 5. Contrato Didático
  console.log('Cadastrando contrato vigente simulado...');
  const contrato = await prisma.contratoClima.upsert({
    where: { numeroContrato: '88/2026-TREINO' },
    update: {
      valorGlobal: 350000.0,
      saldoDisponivel: 342800.0,
      limiteAprovacaoAutomatica: 1000.0,
      prazoAtendimentoHorasRegular: 72,
      prazoAtendimentoHorasUrgente: 24,
      diasGarantiaPadrao: 90,
      diasPrazoAtesteDemandante: 5,
      isReferenciaAtiva: true,
    },
    create: {
      numeroContrato: '88/2026-TREINO',
      processoSeiMae: '04410035.TREINO/2026-01',
      empresaId: empresa.id,
      valorGlobal: 350000.0,
      saldoDisponivel: 342800.0,
      limiteAprovacaoAutomatica: 1000.0,
      prazoAtendimentoHorasRegular: 72,
      prazoAtendimentoHorasUrgente: 24,
      diasGarantiaPadrao: 90,
      diasPrazoAtesteDemandante: 5,
      vigenciaInicio: new Date('2026-01-01'),
      vigenciaFim: new Date('2027-12-31'),
      ativo: true,
      isReferenciaAtiva: true,
    },
  });

  // 6. Itens de Tabela de Preço SGC Simulados
  console.log('Cadastrando itens da tabela de serviços/preços...');
  const itensTabela = [
    { numeroItem: 1, descricao: 'Manutenção Preventiva de Split até 18.000 BTUs (Limpeza e Higienização)', unidadeMedida: 'UN', valorUnitario: 180.0 },
    { numeroItem: 2, descricao: 'Manutenção Preventiva de Split 24.000 a 60.000 BTUs', unidadeMedida: 'UN', valorUnitario: 260.0 },
    { numeroItem: 3, descricao: 'Carga de Gás Refrigerante R410A / R32 completa com teste de vazamento', unidadeMedida: 'SERVIÇO', valorUnitario: 240.0 },
    { numeroItem: 4, descricao: 'Substituição de Capacitor de Partida e Rele Térmico', unidadeMedida: 'UN', valorUnitario: 195.0 },
    { numeroItem: 5, descricao: 'Substituição de Placa Eletrônica Principal Inverter', unidadeMedida: 'UN', valorUnitario: 890.0 },
    { numeroItem: 6, descricao: 'Substituição de Compressor 18.000 BTUs', unidadeMedida: 'UN', valorUnitario: 1250.0 },
    { numeroItem: 7, descricao: 'Instalação Completa de Split Hi-Wall com tubulação até 3m', unidadeMedida: 'UN', valorUnitario: 450.0 },
    { numeroItem: 8, descricao: 'Desinstalação de Aparelho Split e transporte ao depósito', unidadeMedida: 'UN', valorUnitario: 160.0 },
    { numeroItem: 9, descricao: 'Manutenção Corretiva Geral em Bebedouro Industrial / Termostato', unidadeMedida: 'SERVIÇO', valorUnitario: 220.0 },
  ];

  const itensPrecoDb = {};
  for (const it of itensTabela) {
    itensPrecoDb[it.numeroItem] = await prisma.itemContratoPreco.upsert({
      where: {
        contratoId_numeroItem: {
          contratoId: contrato.id,
          numeroItem: it.numeroItem,
        },
      },
      update: { valorUnitario: it.valorUnitario, descricao: it.descricao },
      create: {
        contratoId: contrato.id,
        numeroItem: it.numeroItem,
        descricao: it.descricao,
        unidadeMedida: it.unidadeMedida,
        valorUnitario: it.valorUnitario,
      },
    });
  }

  // 7. Usuários Didáticos (Sem senhas complexas nem CPFs reais)
  console.log('Cadastrando usuários didáticos para simulação de turmas...');
  const usuariosData = [
    {
      nome: 'Aluno Demandante (Prof. Fátima Souza)',
      cpf: '000.111.222-33',
      email: 'aluno.demandante@uern.br',
      matricula: 'TR-1001',
      role: RoleUsuario.DEMANDANTE,
      unidadeId: unidades['FAFIC'].id,
    },
    {
      nome: 'Aluno Fiscal Técnico (Eng. Carlos Eduardo)',
      cpf: '000.222.333-44',
      email: 'aluno.fiscal.tec@uern.br',
      matricula: 'TR-2002',
      role: RoleUsuario.FISCAL_TECNICO,
      unidadeId: unidades['PROAD'].id,
    },
    {
      nome: 'Aluno Fiscal Administrativo (Dra. Renata Medeiros)',
      cpf: '000.333.444-55',
      email: 'aluno.fiscal.adm@uern.br',
      matricula: 'TR-3003',
      role: RoleUsuario.FISCAL_ADM,
      unidadeId: unidades['PROAD'].id,
    },
    {
      nome: 'Aluno Engenharia SOBE (Eng. Marcelo Costa)',
      cpf: '000.777.888-99',
      email: 'aluno.sobe@uern.br',
      matricula: 'TR-7007',
      role: RoleUsuario.ENGENHARIA_SOBE,
      unidadeId: unidades['PROAD'].id,
    },
    {
      nome: 'Aluno Empresa (Técnico Roberto Silva)',
      cpf: '000.444.555-66',
      email: 'aluno.empresa@prestadora.com',
      matricula: 'EMP-4004',
      role: RoleUsuario.EMPRESA,
      empresaId: empresa.id,
    },
    {
      nome: 'Aluno Administrador Geral (Instrutor PROAD)',
      cpf: '000.555.666-77',
      email: 'aluno.admin@uern.br',
      matricula: 'ADM-5005',
      role: RoleUsuario.ADMIN,
      unidadeId: unidades['PROAD'].id,
    },
  ];

  const usuarios = {};
  for (const u of usuariosData) {
    usuarios[u.role] = await prisma.usuario.upsert({
      where: { cpf: u.cpf },
      update: u,
      create: u,
    });
  }

  // 8. Máquinas Simuladas
  console.log('Cadastrando parque de máquinas simuladas...');
  const maquinasData = [
    {
      tombo: 'TR-90001',
      tipo: TipoEquipamento.AR_CONDICIONADO,
      marca: 'Springer Midea',
      modelo: 'AirVolution Inverter',
      btus: 18000,
      tipoAc: 'Split Hi-Wall',
      gasRefrigerante: 'R410A',
      tecnologiaInverter: true,
      status: StatusEquipamento.ATIVO,
      unidadeId: unidades['FAFIC'].id,
      ambienteId: ambientes['Sala de Aula 04 (Treinamento)'].id,
      localizacao: 'Sala de Aula 04 (Treinamento)',
    },
    {
      tombo: 'TR-90002',
      tipo: TipoEquipamento.AR_CONDICIONADO,
      marca: 'Daikin',
      modelo: 'EcoAdvance Cassete',
      btus: 36000,
      tipoAc: 'Cassete',
      gasRefrigerante: 'R32',
      tecnologiaInverter: true,
      status: StatusEquipamento.ATIVO,
      unidadeId: unidades['FAFIC'].id,
      ambienteId: ambientes['Sala de Estudos Biblioteca FAFIC'].id,
      localizacao: 'Sala de Estudos Biblioteca FAFIC',
    },
    {
      tombo: 'TR-90003',
      tipo: TipoEquipamento.AR_CONDICIONADO,
      marca: 'Elgin',
      modelo: 'Eco Inverter',
      btus: 24000,
      tipoAc: 'Piso Teto',
      gasRefrigerante: 'R410A',
      tecnologiaInverter: true,
      status: StatusEquipamento.ATIVO,
      unidadeId: unidades['DINF'].id,
      ambienteId: ambientes['Lab de Servidores & Datacenter (Ininterrupto)'].id,
      localizacao: 'Lab de Servidores & Datacenter (Ininterrupto)',
    },
    {
      tombo: 'TR-90004',
      tipo: TipoEquipamento.BEBEDOURO_INDUSTRIAL,
      marca: 'Frisbel',
      modelo: 'Coluna Inox 100L',
      qtdTorneiras: 3,
      capacidadeLitros: 100,
      status: StatusEquipamento.ATIVO,
      unidadeId: unidades['FAFIC'].id,
      ambienteId: ambientes['Secretaria Acadêmica FAFIC'].id,
      localizacao: 'Secretaria Acadêmica FAFIC',
    },
    {
      tombo: 'TR-90005',
      tipo: TipoEquipamento.REFRIGERADOR_FREEZER,
      marca: 'Consul',
      modelo: 'Duplex Frost Free 380L',
      litragem: 380,
      tipoRefrigerador: 'REFRIGERADOR_DUPLEX',
      status: StatusEquipamento.ATIVO,
      unidadeId: unidades['PROAD'].id,
      ambienteId: ambientes['Gabinete PROAD'].id,
      localizacao: 'Gabinete PROAD',
    },
    {
      tombo: 'TR-90006',
      tipo: TipoEquipamento.AR_CONDICIONADO,
      marca: 'Consul',
      modelo: 'Hi-Wall Convencional',
      btus: 12000,
      tipoAc: 'Split Hi-Wall',
      gasRefrigerante: 'R22',
      tecnologiaInverter: false,
      status: StatusEquipamento.DESINSTALADO_DEPOSITO,
      unidadeId: unidades['FAFIC'].id,
      ambienteId: null,
      localizacao: 'Desinstalada / Depósito FAFIC',
    },
  ];

  const maquinas = {};
  for (const m of maquinasData) {
    maquinas[m.tombo] = await prisma.equipamento.upsert({
      where: {
        unidadeId_tombo: {
          unidadeId: m.unidadeId,
          tombo: m.tombo,
        },
      },
      update: m,
      create: m,
    });
  }

  // 9. Chamados Didáticos em Estágios Diferentes (Para a turma experimentar o fluxo completo)
  console.log('Cadastrando chamados didáticos simulando o ciclo de vida...');

  // Cenário 1: Chamado Aberto (Demandante abriu, aguardando triagem)
  const ch1 = await prisma.chamado.upsert({
    where: { numeroProtocolo: 'CLIMA-2026-TR001' },
    update: {},
    create: {
      numeroProtocolo: 'CLIMA-2026-TR001',
      tituloDemanda: 'Ar-condicionado vazando água dentro da Sala de Aula 04',
      descricaoGeral: 'Durante as aulas matutinas, a evaporadora começou a gotejar sobre as carteiras discentes. Necessário desobstrução de dreno.',
      status: StatusChamado.ABERTO,
      percentualEvolucao: 10,
      etapaAtualDescricao: 'Aberto pela Unidade - Aguardando Triagem da Empresa',
      isAmbientePrioritario: true,
      ambienteId: ambientes['Sala de Aula 04 (Treinamento)'].id,
      unidadeId: unidades['FAFIC'].id,
      demandanteId: usuarios['DEMANDANTE'].id,
      contratoId: contrato.id,
      empresaId: empresa.id,
      criadoEm: new Date(Date.now() - 3600000 * 4),
    },
  });

  await prisma.intervencaoItem.create({
    data: {
      chamadoId: ch1.id,
      equipamentoId: maquinas['TR-90001'].id,
      categoriaServico: CategoriaServico.MANUTENCAO_CORRETIVA,
      defeitoComum: DefeitoCorretivaComum.PINGANDO_DENTRO_DA_SALA,
      descricaoDefeito: 'Gotejamento persistente na bandeja plástica interna da evaporadora.',
    },
  });

  // Cenário 2: Orçamento Acima de R$ 1.000,00 (Para testar aprovação do Fiscal Adm / Gestor)
  const ch2 = await prisma.chamado.upsert({
    where: { numeroProtocolo: 'CLIMA-2026-TR002' },
    update: {},
    create: {
      numeroProtocolo: 'CLIMA-2026-TR002',
      tituloDemanda: 'Substituição de compressor queimado no Datacenter DINF',
      descricaoGeral: 'Compressor em curto-circuito detectado na vistoria in loco. Orçamento ultrapassa o limite de aprovação automática de R$ 1.000,00.',
      status: StatusChamado.ORCAMENTO_ANEXADO,
      percentualEvolucao: 45,
      etapaAtualDescricao: 'Orçamento Anexado pela Empresa - Aguardando Aprovação do Fiscal Adm',
      isAmbientePrioritario: true,
      ambienteId: ambientes['Lab de Servidores & Datacenter (Ininterrupto)'].id,
      unidadeId: unidades['DINF'].id,
      demandanteId: usuarios['DEMANDANTE'].id,
      contratoId: contrato.id,
      empresaId: empresa.id,
      orcamentoValorTotal: 1490.0,
      criadoEm: new Date(Date.now() - 3600000 * 24),
    },
  });

  const interv2 = await prisma.intervencaoItem.create({
    data: {
      chamadoId: ch2.id,
      equipamentoId: maquinas['TR-90003'].id,
      categoriaServico: CategoriaServico.MANUTENCAO_CORRETIVA,
      defeitoComum: DefeitoCorretivaComum.NAO_GELA,
      descricaoDefeito: 'Compressor travado com queima de enrolamento.',
    },
  });

  await prisma.orcamentoItemDetalhamento.create({
    data: {
      intervencaoId: interv2.id,
      itemPrecoId: itensPrecoDb[6].id,
      quantidade: 1.0,
      valorUnitarioContratual: 1250.0,
      valorTotal: 1250.0,
    },
  });
  await prisma.orcamentoItemDetalhamento.create({
    data: {
      intervencaoId: interv2.id,
      itemPrecoId: itensPrecoDb[3].id,
      quantidade: 1.0,
      valorUnitarioContratual: 240.0,
      valorTotal: 240.0,
    },
  });

  // Cenário 3: Aguardando Ateste do Demandante (5 dias úteis)
  const ch3 = await prisma.chamado.upsert({
    where: { numeroProtocolo: 'CLIMA-2026-TR003' },
    update: {},
    create: {
      numeroProtocolo: 'CLIMA-2026-TR003',
      tituloDemanda: 'Higienização e revisão geral da Biblioteca FAFIC',
      descricaoGeral: 'Serviço concluído pela empresa. Aguardando o servidor demandante testar e validar o ateste ou aguardar homologação tácita.',
      status: StatusChamado.AGUARDANDO_CONFIRMACAO,
      percentualEvolucao: 85,
      etapaAtualDescricao: 'Serviço Concluído pela Empresa - Aguardando Seu Ateste',
      isAmbientePrioritario: true,
      ambienteId: ambientes['Sala de Estudos Biblioteca FAFIC'].id,
      unidadeId: unidades['FAFIC'].id,
      demandanteId: usuarios['DEMANDANTE'].id,
      contratoId: contrato.id,
      empresaId: empresa.id,
      orcamentoValorTotal: 260.0,
      orcamentoAprovadoPor: 'aluno.admin@uern.br',
      orcamentoAprovadoEm: new Date(Date.now() - 3600000 * 20),
      dataExecucaoConclusao: new Date(Date.now() - 3600000 * 6),
      dataLimiteConfirmacao: new Date(Date.now() + 3600000 * 24 * 4), // restam 4 dias
      criadoEm: new Date(Date.now() - 3600000 * 72),
    },
  });

  await prisma.intervencaoItem.create({
    data: {
      chamadoId: ch3.id,
      equipamentoId: maquinas['TR-90002'].id,
      categoriaServico: CategoriaServico.MANUTENCAO_PREVENTIVA,
      descricaoDefeito: 'Preventiva periódica com higienização química.',
      laudoTecnico: 'Limpeza de serpentina, turbina e bandejas efetuada com bactericida biodegradável. Aparelho operando em 18°C com vazão ideal.',
      nomeTecnicoEmpresa: 'Roberto Silva (Técnico ECOCLIMA)',
    },
  });

  // Cenário 4: Máquina Condenada / Laudo de Baixa Inservível
  const ch4 = await prisma.chamado.upsert({
    where: { numeroProtocolo: 'CLIMA-2026-TR004' },
    update: {},
    create: {
      numeroProtocolo: 'CLIMA-2026-TR004',
      tituloDemanda: 'Perícia Técnica - Ar-condicionado Antigo Secretaria FAFIC',
      descricaoGeral: 'Aparelho antigo de janela com corrosão total na serpentina e compressor travado.',
      status: StatusChamado.FINALIZADO,
      percentualEvolucao: 100,
      etapaAtualDescricao: 'Finalizado - Máquina Condenada / Laudo Técnico Anexado',
      ambienteId: ambientes['Secretaria Acadêmica FAFIC'].id,
      unidadeId: unidades['FAFIC'].id,
      demandanteId: usuarios['DEMANDANTE'].id,
      contratoId: contrato.id,
      empresaId: empresa.id,
      dataExecucaoConclusao: new Date(),
      criadoEm: new Date(Date.now() - 3600000 * 96),
    },
  });

  await prisma.intervencaoItem.create({
    data: {
      chamadoId: ch4.id,
      equipamentoId: maquinas['TR-90006'].id,
      categoriaServico: CategoriaServico.MANUTENCAO_CORRETIVA,
      defeitoComum: DefeitoCorretivaComum.NAO_LIGA,
      descricaoDefeito: 'Perícia de viabilidade de recuperação.',
      maquinaCondenada: true,
      laudoTecnico: 'LAUDO DE CONDENAÇÃO TÉCNICA PATRIMONIAL: Equipamento classificado como antieconômico/inservível, recomendado recolhimento ao depósito de patrimônio e abertura de processo de máquina substituta nova via PROAD.',
      nomeTecnicoEmpresa: 'Roberto Silva (Técnico Responsável)',
      cpfTecnicoEmpresa: '000.444.555-66',
    },
  });

  console.log('--- SEED DE TREINAMENTO CONCLUÍDO COM SUCESSO! ---');
  console.log('Ambiente preparado com:');
  console.log('• 5 Unidades Simuladas');
  console.log('• 8 Ambientes com Prioridades');
  console.log('• 6 Máquinas em diferentes status');
  console.log('• 1 Contrato de Treinamento (88/2026-TREINO)');
  console.log('• 5 Usuários Didáticos com login direto');
  console.log('• 4 Chamados cobrindo todo o ciclo operacional');
}

if (require.main === module) {
  runSeedTreinamento()
    .then(async () => {
      await prisma.$disconnect();
    })
    .catch(async (e) => {
      console.error('Erro ao executar seed de treinamento:', e);
      await prisma.$disconnect();
      process.exit(1);
    });
}

module.exports = { runSeedTreinamento };
