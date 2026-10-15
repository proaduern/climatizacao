const { PrismaClient, RoleUsuario, TipoEquipamento, StatusEquipamento, StatusChamado, CategoriaServico, SubtipoInstalacao, DefeitoCorretivaComum } = require('@prisma/client');

const prisma = new PrismaClient();

async function main() {
  console.log('Iniciando seed do SIG-CLIMA UERN...');

  // 1. Unidades e Cidades
  const unidadesData = [
    { sigla: 'PROAD', nome: 'Pró-Reitoria de Administração', campus: 'Central Mossoró', cidade: 'Mossoró' },
    { sigla: 'FAFIC', nome: 'Faculdade de Filosofia e Ciências Sociais', campus: 'Central Mossoró', cidade: 'Mossoró' },
    { sigla: 'DINF', nome: 'Departamento de Informática', campus: 'Central Mossoró', cidade: 'Mossoró' },
    { sigla: 'CAMPUS-ASSU', nome: 'Campus Avançado de Assú', campus: 'Assú', cidade: 'Assú' },
    { sigla: 'CAMPUS-PAU-DOS-FERROS', nome: 'Campus Avançado de Pau dos Ferros', campus: 'Pau dos Ferros', cidade: 'Pau dos Ferros' },
    { sigla: 'CAMPUS-CAICO', nome: 'Campus de Caicó (CERES)', campus: 'Caicó', cidade: 'Caicó' },
    { sigla: 'CAMPUS-PATU', nome: 'Campus Avançado de Patu', campus: 'Pau dos Ferros / Patu', cidade: 'Patu' },
    { sigla: 'CAMPUS-NATAL', nome: 'Complexo Cultural / Campus Natal', campus: 'Natal', cidade: 'Natal' },
  ];

  const unidades = {};
  for (const u of unidadesData) {
    unidades[u.sigla] = await prisma.unidade.upsert({
      where: { sigla: u.sigla },
      update: { nome: u.nome, campus: u.campus, cidade: u.cidade },
      create: u,
    });
  }

  // 1.1 Ambientes Padronizados da Unidade
  const ambientesIniciais = [
    { unidadeSigla: 'FAFIC', tipo: 'SALA_DE_AULA', descricaoDetalhe: 'Sala de aula 04, Bloco Central', bloco: 'Bloco Central' },
    { unidadeSigla: 'FAFIC', tipo: 'SALA_ESTUDOS_BIBLIOTECA', descricaoDetalhe: 'Sala de Estudos Setorial FAFIC', bloco: 'Biblioteca Setorial' },
    { unidadeSigla: 'FAFIC', tipo: 'SALA_ADMINISTRATIVA', descricaoDetalhe: 'Secretaria Acadêmica FAFIC', bloco: 'Bloco Central' },
    { unidadeSigla: 'PROAD', tipo: 'SALA_ADMINISTRATIVA', descricaoDetalhe: 'Gabinete PROAD', bloco: 'Reitoria' },
    { unidadeSigla: 'PROAD', tipo: 'SALA_ADMINISTRATIVA', descricaoDetalhe: 'Diretoria de Contratos e Convênios', bloco: 'Reitoria' },
    { unidadeSigla: 'PROAD', tipo: 'AUDITORIO', descricaoDetalhe: 'Auditório da Reitoria / PROAD', bloco: 'Reitoria' },
    { unidadeSigla: 'DINF', tipo: 'LABORATORIO_PESQUISA_ININTERRUPTO', descricaoDetalhe: 'Laboratório de Datacenter & Servidores (Ininterrupto)', bloco: 'Bloco DINF' },
    { unidadeSigla: 'DINF', tipo: 'LABORATORIOS_DIVERSOS', descricaoDetalhe: 'Laboratório de Informática 01', bloco: 'Bloco DINF' },
    { unidadeSigla: 'CAMPUS-ASSU', tipo: 'SALA_DE_AULA', descricaoDetalhe: 'Sala de aula 01, Pavilhão A', bloco: 'Pavilhão A' },
    { unidadeSigla: 'CAMPUS-PAU-DOS-FERROS', tipo: 'SALA_DE_AULA', descricaoDetalhe: 'Sala de aula 03, Bloco Principal', bloco: 'Bloco Principal' },
  ];

  for (const amb of ambientesIniciais) {
    const un = unidades[amb.unidadeSigla];
    if (un) {
      await prisma.ambienteUnidade.upsert({
        where: {
          unidadeId_descricaoDetalhe: {
            unidadeId: un.id,
            descricaoDetalhe: amb.descricaoDetalhe,
          },
        },
        update: { tipo: amb.tipo, bloco: amb.bloco },
        create: {
          unidadeId: un.id,
          tipo: amb.tipo,
          descricaoDetalhe: amb.descricaoDetalhe,
          bloco: amb.bloco,
        },
      });
    }
  }

  // 2. Empresa Fornecedora (Oficial SGC)
  const empresa = await prisma.empresa.upsert({
    where: { cnpj: '63.034.369/0001-35' },
    update: {
      razaoSocial: 'L O DOS SANTOS ECOMSER',
      nomeFantasia: 'L O DOS SANTOS ECOMSER',
      telefone: '(84) 921685387',
      email: 'ebenezerecomser@gmail.com',
    },
    create: {
      cnpj: '63.034.369/0001-35',
      razaoSocial: 'L O DOS SANTOS ECOMSER',
      nomeFantasia: 'L O DOS SANTOS ECOMSER',
      telefone: '(84) 921685387',
      email: 'ebenezerecomser@gmail.com',
    },
  });

  // 3. Contrato Vigente do SGC
  const contrato = await prisma.contratoClima.upsert({
    where: { numeroContrato: '11/2026' },
    update: {
      isReferenciaAtiva: true,
      prazoAtendimentoHorasRegular: 72,
      prazoAtendimentoHorasUrgente: 24,
      diasGarantiaPadrao: 90,
      diasPrazoAtesteDemandante: 5,
    },
    create: {
      numeroContrato: '11/2026',
      processoSeiMae: '04410035.003671/2025-75',
      empresaId: empresa.id,
      valorGlobal: 1166605.42,
      saldoDisponivel: 1166605.42,
      vigenciaInicio: new Date('2026-07-08'),
      vigenciaFim: new Date('2028-07-07'),
      ativo: true,
      isReferenciaAtiva: true,
      prazoAtendimentoHorasRegular: 72,
      prazoAtendimentoHorasUrgente: 24,
      diasGarantiaPadrao: 90,
      diasPrazoAtesteDemandante: 5,
      autoSincronizadoEm: new Date(),
    },
  });

  // 4. Itens da Planilha Contratual SGC
  const itensPlanilha = [
    { numeroItem: 1, codigo: 'SERV-01', descricao: 'Higienização e Limpeza Completa de Split até 18.000 BTUs', unidadeMedida: 'UN', valorUnitario: 120.0, saldoQuantidade: 300 },
    { numeroItem: 2, codigo: 'SERV-02', descricao: 'Higienização e Limpeza Completa de Split de 24.000 a 60.000 BTUs', unidadeMedida: 'UN', valorUnitario: 180.0, saldoQuantidade: 150 },
    { numeroItem: 3, codigo: 'SERV-03', descricao: 'Instalação de Split substituindo máquina antiga existente', unidadeMedida: 'UN', valorUnitario: 380.0, saldoQuantidade: 80 },
    { numeroItem: 4, codigo: 'SERV-04', descricao: 'Instalação nova de Split com ponto elétrico e dreno existentes', unidadeMedida: 'UN', valorUnitario: 320.0, saldoQuantidade: 60 },
    { numeroItem: 5, codigo: 'SERV-05', descricao: 'Instalação nova de Split sem ponto elétrico e sem dreno', unidadeMedida: 'UN', valorUnitario: 540.0, saldoQuantidade: 40 },
    { numeroItem: 6, codigo: 'SERV-06', descricao: 'Desinstalação e Remoção de Ar-Condicionado com recolhimento', unidadeMedida: 'UN', valorUnitario: 120.0, saldoQuantidade: 90 },
    { numeroItem: 7, codigo: 'SERV-07', descricao: 'Carga Completa de Gás Refrigerante R410A / R32', unidadeMedida: 'UN', valorUnitario: 150.0, saldoQuantidade: 120 },
    { numeroItem: 8, codigo: 'SERV-08', descricao: 'Substituição de Capacitor de Partida e Fiação Elétrica', unidadeMedida: 'UN', valorUnitario: 90.0, saldoQuantidade: 140 },
    { numeroItem: 9, codigo: 'SERV-09', descricao: 'Manutenção Corretiva em Bebedouro Industrial com troca de torneiras', unidadeMedida: 'UN', valorUnitario: 160.0, saldoQuantidade: 50 },
    { numeroItem: 10, codigo: 'SERV-10', descricao: 'Substituição de Termostato e Carga de Gás em Geladeira / Freezer', unidadeMedida: 'UN', valorUnitario: 210.0, saldoQuantidade: 40 },
  ];

  for (const item of itensPlanilha) {
    await prisma.itemContratoPreco.upsert({
      where: {
        contratoId_numeroItem: {
          contratoId: contrato.id,
          numeroItem: item.numeroItem,
        },
      },
      update: { valorUnitario: item.valorUnitario, saldoQuantidade: item.saldoQuantidade },
      create: {
        contratoId: contrato.id,
        ...item,
      },
    });
  }

  // 5. Usuários
  const usuariosData = [
    {
      nome: 'Prof. Dr. Fernando Santos',
      email: 'fernando.admin@uern.br',
      cpf: '111.222.333-44',
      matricula: '98765-4',
      role: RoleUsuario.ADMIN,
      unidadeId: unidades['PROAD'].id,
    },
    {
      nome: 'Maria Souza Silva',
      email: 'maria.fafic@uern.br',
      cpf: '222.333.444-55',
      matricula: '12345-6',
      role: RoleUsuario.DEMANDANTE,
      unidadeId: unidades['FAFIC'].id,
    },
    {
      nome: 'João Paulo Medeiros',
      email: 'joao.proad@uern.br',
      cpf: '333.444.555-66',
      matricula: '23456-7',
      role: RoleUsuario.DEMANDANTE,
      unidadeId: unidades['PROAD'].id,
    },
    {
      nome: 'Eng. Roberto Silva',
      email: 'fiscal.tecnico@uern.br',
      cpf: '444.555.666-77',
      matricula: '34567-8',
      role: RoleUsuario.FISCAL_TECNICO,
      unidadeId: unidades['PROAD'].id,
    },
    {
      nome: 'Josemildo (Preposto • L O DOS SANTOS ECOMSER)',
      email: 'ebenezerecomser@gmail.com',
      cpf: '630.343.690-01',
      matricula: null,
      role: RoleUsuario.EMPRESA,
      empresaId: empresa.id,
    },
    {
      nome: 'Carlos Lima (Técnico Executor • L O DOS SANTOS)',
      email: 'carlos.tecnico@climafrio.com.br',
      cpf: '456.789.012-34',
      matricula: null,
      role: RoleUsuario.EMPRESA,
      empresaId: empresa.id,
    },
  ];

  const usuarios = {};
  for (const u of usuariosData) {
    usuarios[u.email] = await prisma.usuario.upsert({
      where: { email: u.email },
      update: { role: u.role, unidadeId: u.unidadeId, empresaId: u.empresaId },
      create: u,
    });
  }

  // 6. Equipamentos do Inventário
  const equipamentosData = [
    {
      unidadeId: unidades['FAFIC'].id,
      tombo: '104521',
      tipo: TipoEquipamento.AR_CONDICIONADO,
      marca: 'Springer Midea',
      modelo: 'AirVolution Inverter',
      btus: 18000,
      tipoAc: 'Split Hi-Wall',
      localizacao: 'Sala 04 - Bloco de Aulas',
      status: StatusEquipamento.EM_MANUTENCAO,
    },
    {
      unidadeId: unidades['PROAD'].id,
      tombo: '108932',
      tipo: TipoEquipamento.AR_CONDICIONADO,
      marca: 'Daikin',
      modelo: 'EcoSwing Inverter',
      btus: 24000,
      tipoAc: 'Split Hi-Wall',
      localizacao: 'Gabinete Pró-Reitor',
      status: StatusEquipamento.EM_MANUTENCAO,
    },
    {
      unidadeId: unidades['PROAD'].id,
      tombo: '104110',
      tipo: TipoEquipamento.AR_CONDICIONADO,
      marca: 'Consul',
      modelo: 'Janela Mecânico',
      btus: 12000,
      tipoAc: 'Janela',
      localizacao: 'Gabinete Pró-Reitor (Antigo)',
      status: StatusEquipamento.EM_MANUTENCAO,
    },
    {
      unidadeId: unidades['CAMPUS-ASSU'].id,
      tombo: '109201',
      tipo: TipoEquipamento.BEBEDOURO_INDUSTRIAL,
      marca: 'Frisbel',
      modelo: 'Inox 3 Torneiras',
      qtdTorneiras: 3,
      capacidadeLitros: 100,
      localizacao: 'Corredor Central - Próximo ao Bloco B',
      status: StatusEquipamento.ATIVO,
      emGarantiaAte: new Date('2026-07-15'),
    },
    {
      unidadeId: unidades['DINF'].id,
      tombo: '107332',
      tipo: TipoEquipamento.GELAGUA,
      marca: 'Esmaltec',
      modelo: 'Coluna Garrafão EGC35B',
      localizacao: 'Sala dos Professores - Bloco DINF',
      status: StatusEquipamento.ATIVO,
    },
    {
      unidadeId: unidades['FAFIC'].id,
      tombo: '106440',
      tipo: TipoEquipamento.REFRIGERADOR_FREEZER,
      marca: 'Electrolux',
      modelo: 'Duplex Frost Free DF36A',
      litragem: 380,
      localizacao: 'Copa dos Servidores',
      status: StatusEquipamento.ATIVO,
    },
  ];

  const equipamentos = {};
  for (const eq of equipamentosData) {
    equipamentos[eq.tombo] = await prisma.equipamento.upsert({
      where: {
        unidadeId_tombo: {
          unidadeId: eq.unidadeId,
          tombo: eq.tombo,
        },
      },
      update: { status: eq.status, localizacao: eq.localizacao },
      create: eq,
    });
  }

  // 7. Chamados Demonstrativos (com Barra de Evolução e Timeline)
  // Chamado 1: FAFIC - Sala 04 (Aguardando Confirmação do Demandante)
  const dataAbertura1 = new Date();
  dataAbertura1.setDate(dataAbertura1.getDate() - 3);

  const chamado1 = await prisma.chamado.upsert({
    where: { numeroProtocolo: 'CLIMA-2026-00001' },
    update: {},
    create: {
      numeroProtocolo: 'CLIMA-2026-00001',
      unidadeId: unidades['FAFIC'].id,
      demandanteId: usuarios['maria.fafic@uern.br'].id,
      contratoId: contrato.id,
      empresaId: empresa.id,
      status: StatusChamado.AGUARDANDO_CONFIRMACAO,
      percentualEvolucao: 85,
      etapaAtualDescricao: 'Serviço Concluído pela Empresa - Aguardando Seu Ateste',
      tituloDemanda: 'Ar da Sala 04 não gela e faz ruído',
      descricaoGeral: 'O aparelho parou de gelar durante a aula matutina e começou a apresentar ruído contínuo no condensador externo.',
      orcamentoValorTotal: 240.0,
      orcamentoAprovadoPor: 'fernando.admin@uern.br',
      orcamentoAprovadoEm: new Date(Date.now() - 24 * 3600 * 1000),
      dataExecucaoConclusao: new Date(Date.now() - 6 * 3600 * 1000),
      dataLimiteConfirmacao: new Date(Date.now() + 4 * 24 * 3600 * 1000), // Restam 4 dias
      prazoLimiteAtendimento: new Date(Date.now() + 18 * 3600 * 1000),
      atendidoNoPrazo: true,
      criadoEm: dataAbertura1,
    },
  });

  // Intervenção da máquina no Chamado 1
  const itemPrecoGas = await prisma.itemContratoPreco.findFirst({ where: { contratoId: contrato.id, numeroItem: 7 } });
  const itemPrecoCap = await prisma.itemContratoPreco.findFirst({ where: { contratoId: contrato.id, numeroItem: 8 } });

  const intervencao1 = await prisma.intervencaoItem.create({
    data: {
      chamadoId: chamado1.id,
      equipamentoId: equipamentos['104521'].id,
      categoriaServico: CategoriaServico.MANUTENCAO_CORRETIVA,
      defeitoComum: DefeitoCorretivaComum.NAO_GELA,
      descricaoDefeito: 'Vazamento na porca flange do condensador e capacitor estufado.',
      tecnicoExecutorId: usuarios['carlos.tecnico@climafrio.com.br'].id,
      nomeTecnicoEmpresa: 'Carlos Lima',
      cpfTecnicoEmpresa: '456.789.012-34',
      valorTotalIntervencao: 240.0,
      diasGarantiaConcedida: 90,
      garantiaValidaAte: new Date(Date.now() + 90 * 24 * 3600 * 1000),
      fotosAntesUrls: ['/demo/ar_quebrado_antes.jpg'],
      fotosDepoisUrls: ['/demo/ar_reparado_depois.jpg'],
      itensOrcamento: {
        create: [
          { itemPrecoId: itemPrecoGas.id, quantidade: 1, valorUnitarioContratual: 150.0, valorTotal: 150.0 },
          { itemPrecoId: itemPrecoCap.id, quantidade: 1, valorUnitarioContratual: 90.0, valorTotal: 90.0 },
        ],
      },
    },
  });

  // Timeline de eventos do Chamado 1
  await prisma.historicoChamado.createMany({
    data: [
      {
        chamadoId: chamado1.id,
        statusAnterior: null,
        statusNovo: StatusChamado.ABERTO,
        autorNome: 'Maria Souza Silva',
        autorId: usuarios['maria.fafic@uern.br'].id,
        mensagem: 'Chamado aberto pela unidade com fotos do defeito.',
        criadoEm: dataAbertura1,
      },
      {
        chamadoId: chamado1.id,
        statusAnterior: StatusChamado.ABERTO,
        statusNovo: StatusChamado.AGUARDANDO_ORCAMENTO,
        autorNome: 'Sistema (Auto-Triagem)',
        autorId: null,
        mensagem: 'Demanda encaminhada para a ClimaFrio Serviços. SLA de início: 72 horas.',
        criadoEm: new Date(dataAbertura1.getTime() + 2 * 3600 * 1000),
      },
      {
        chamadoId: chamado1.id,
        statusAnterior: StatusChamado.AGUARDANDO_ORCAMENTO,
        statusNovo: StatusChamado.ORCAMENTO_ANEXADO,
        autorNome: 'Carlos Lima (ClimaFrio)',
        autorId: usuarios['carlos.tecnico@climafrio.com.br'].id,
        mensagem: 'Orçamento anexado conforme itens 07 e 08 da planilha SGC. Valor total: R$ 240,00.',
        criadoEm: new Date(Date.now() - 30 * 3600 * 1000),
      },
      {
        chamadoId: chamado1.id,
        statusAnterior: StatusChamado.ORCAMENTO_ANEXADO,
        statusNovo: StatusChamado.APROVADO_EM_EXECUCAO,
        autorNome: 'Prof. Dr. Fernando Santos',
        autorId: usuarios['fernando.admin@uern.br'].id,
        mensagem: 'Orçamento aprovado pelo Admin PROAD. Saldo contratual deduzido.',
        criadoEm: new Date(Date.now() - 24 * 3600 * 1000),
      },
      {
        chamadoId: chamado1.id,
        statusAnterior: StatusChamado.APROVADO_EM_EXECUCAO,
        statusNovo: StatusChamado.AGUARDANDO_CONFIRMACAO,
        autorNome: 'Carlos Lima (ClimaFrio)',
        autorId: usuarios['carlos.tecnico@climafrio.com.br'].id,
        mensagem: 'Serviço concluído com teste térmico a 17°C. Fotos antes/depois anexadas. Aberto prazo de 5 dias úteis para ateste.',
        criadoEm: new Date(Date.now() - 6 * 3600 * 1000),
      },
    ],
  });

  // Chamado 2: PROAD - Gabinete (Substituição: Desinstalar Tombo 104110 e Instalar Tombo 108932)
  const itemInstalacaoSubst = await prisma.itemContratoPreco.findFirst({ where: { contratoId: contrato.id, numeroItem: 3 } });
  const itemDesinstalacao = await prisma.itemContratoPreco.findFirst({ where: { contratoId: contrato.id, numeroItem: 6 } });

  const chamado2 = await prisma.chamado.upsert({
    where: { numeroProtocolo: 'CLIMA-2026-00002' },
    update: {},
    create: {
      numeroProtocolo: 'CLIMA-2026-00002',
      unidadeId: unidades['PROAD'].id,
      demandanteId: usuarios['joao.proad@uern.br'].id,
      contratoId: contrato.id,
      empresaId: empresa.id,
      status: StatusChamado.APROVADO_EM_EXECUCAO,
      percentualEvolucao: 65,
      etapaAtualDescricao: 'Orçamento Aprovado - Em Execução pela Empresa',
      tituloDemanda: 'Substituição de Ar-Condicionado no Gabinete PROAD',
      descricaoGeral: 'Retirada do ar de janela antigo condenado (Tombo 104110) e instalação do novo Split Daikin 24.000 BTUs (Tombo 108932).',
      orcamentoValorTotal: 500.0,
      orcamentoAprovadoPor: 'fernando.admin@uern.br',
      orcamentoAprovadoEm: new Date(Date.now() - 12 * 3600 * 1000),
      prazoLimiteAtendimento: new Date(Date.now() + 48 * 3600 * 1000),
      atendidoNoPrazo: true,
      criadoEm: new Date(Date.now() - 36 * 3600 * 1000),
    },
  });

  // 2 Intervenções no Chamado 2!
  await prisma.intervencaoItem.createMany({
    data: [
      {
        chamadoId: chamado2.id,
        equipamentoId: equipamentos['104110'].id,
        categoriaServico: CategoriaServico.DESINSTALACAO,
        destinoMaquinaRetirada: 'DEPOSITO_PATRIMONIO_BAIXA',
        maquinaCondenada: true,
        laudoTecnico: 'Equipamento com compressor travado, corrosão generalizada na serpentina e ineficiência energética.',
        valorTotalIntervencao: 120.0,
      },
      {
        chamadoId: chamado2.id,
        equipamentoId: equipamentos['108932'].id,
        categoriaServico: CategoriaServico.INSTALACAO,
        subtipoInstalacao: SubtipoInstalacao.SUBSTITUINDO_MAQUINA_EXISTENTE,
        maquinaSubstituidaId: equipamentos['104110'].id,
        valorTotalIntervencao: 380.0,
        diasGarantiaConcedida: 90,
      },
    ],
  });

  await prisma.historicoChamado.createMany({
    data: [
      {
        chamadoId: chamado2.id,
        statusAnterior: null,
        statusNovo: StatusChamado.ABERTO,
        autorNome: 'João Paulo Medeiros',
        autorId: usuarios['joao.proad@uern.br'].id,
        mensagem: 'Solicitação de substituição de ar aberta com indicação da máquina antiga e nova.',
        criadoEm: new Date(Date.now() - 36 * 3600 * 1000),
      },
      {
        chamadoId: chamado2.id,
        statusAnterior: StatusChamado.ABERTO,
        statusNovo: StatusChamado.APROVADO_EM_EXECUCAO,
        autorNome: 'Prof. Dr. Fernando Santos',
        autorId: usuarios['fernando.admin@uern.br'].id,
        mensagem: 'Orçamento de desinstalação (R$ 120) + instalação (R$ 380) aprovado. Total: R$ 500,00.',
        criadoEm: new Date(Date.now() - 12 * 3600 * 1000),
      },
    ],
  });

  console.log('Seed do SIG-CLIMA concluído com sucesso!');
}

main()
  .catch((e) => {
    console.error('Erro no seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
