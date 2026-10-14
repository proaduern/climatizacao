'use client';

import React, { useState, useEffect } from 'react';
import Navbar from '@/components/Navbar';
import {
  Snowflake,
  Wrench,
  FileText,
  Clock,
  CheckCircle2,
  AlertCircle,
  PlusCircle,
  Search,
  Filter,
  DollarSign,
  Calendar,
  Building2,
  ShieldCheck,
  ChevronRight,
  TrendingUp,
  Star,
  RefreshCw,
  Printer,
  Sparkles,
  Zap,
  ArrowRight,
  Sliders,
  History,
  Lock,
  XCircle,
  ExternalLink,
} from 'lucide-react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

export default function HomePage() {
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [loadingUser, setLoadingUser] = useState(true);

  // Dados do Contrato
  const [contratoData, setContratoData] = useState<any>(null);
  const [loadingContrato, setLoadingContrato] = useState(true);

  // Tabs: 'chamados' | 'novo' | 'inventario' | 'faturamento' | 'configuracao'
  const [activeTab, setActiveTab] = useState<'chamados' | 'novo' | 'inventario' | 'faturamento' | 'configuracao'>('chamados');

  // Listagem de Chamados
  const [chamados, setChamados] = useState<any[]>([]);
  const [loadingChamados, setLoadingChamados] = useState(true);
  const [statusFiltro, setStatusFiltro] = useState<string>('TODOS');
  const [buscaChamado, setBuscaChamado] = useState('');

  // Equipamentos da Unidade
  const [equipamentos, setEquipamentos] = useState<any[]>([]);
  const [loadingEquipamentos, setLoadingEquipamentos] = useState(false);

  // Modal de Detalhe do Chamado & Timeline
  const [chamadoDetalhe, setChamadoDetalhe] = useState<any | null>(null);
  const [loadingDetalhe, setLoadingDetalhe] = useState(false);

  // Estados de Ações em Chamados
  const [modalOrcamento, setModalOrcamento] = useState(false);
  const [itensOrcados, setItensOrcados] = useState<{ [itemPrecoId: string]: number }>({});
  const [laudoOrcamento, setLaudoOrcamento] = useState('');

  const [modalExecucao, setModalExecucao] = useState(false);
  const [execucaoLaudo, setExecucaoLaudo] = useState('');
  const [execucaoFotosAntes, setExecucaoFotosAntes] = useState('/demo/ar_quebrado_antes.jpg');
  const [execucaoFotosDepois, setExecucaoFotosDepois] = useState('/demo/ar_reparado_depois.jpg');

  const [modalAteste, setModalAteste] = useState(false);
  const [atesteRating, setAtesteRating] = useState(5);
  const [atesteComentario, setAtesteComentario] = useState('');

  const [modalRejeicao, setModalRejeicao] = useState(false);
  const [motivoRejeicao, setMotivoRejeicao] = useState('');

  // Estados de Abertura de Novo Chamado
  const [tipoFluxo, setTipoFluxo] = useState<'SIMPLES' | 'SUBSTITUICAO'>('SIMPLES');
  const [tituloNovoChamado, setTituloNovoChamado] = useState('');
  const [descricaoNovaDemanda, setDescricaoNovaDemanda] = useState('');
  const [urgenteNovo, setUrgenteNovo] = useState(false);

  // Equipamento no Chamado Simples
  const [modoEquipamento, setModoEquipamento] = useState<'EXISTENTE' | 'NOVO_ON_THE_FLY'>('EXISTENTE');
  const [equipamentoSelecionadoId, setEquipamentoSelecionadoId] = useState('');
  const [categoriaServico, setCategoriaServico] = useState('MANUTENCAO_CORRETIVA');
  const [defeitoComum, setDefeitoComum] = useState('NAO_GELA');
  const [descricaoDefeito, setDescricaoDefeito] = useState('');

  // Cadastro On-the-Fly
  const [novoTipo, setNovoTipo] = useState('AR_CONDICIONADO');
  const [novoTombo, setNovoTombo] = useState('');
  const [novaMarca, setNovaMarca] = useState('');
  const [novoModelo, setNovoModelo] = useState('');
  const [novaLocalizacao, setNovaLocalizacao] = useState('');
  const [novoBtus, setNovoBtus] = useState(18000);
  const [novoTipoAc, setNovoTipoAc] = useState('Split Hi-Wall');
  const [novaLitragem, setNovaLitragem] = useState(380);
  const [novasTorneiras, setNovasTorneiras] = useState(3);
  const [novoModeloGelagua, setNovoModeloGelagua] = useState('COLUNA');

  // Substituição (2 Máquinas)
  const [substAntigaId, setSubstAntigaId] = useState('');
  const [substNovaId, setSubstNovaId] = useState('');
  const [substDestinoAntiga, setSubstDestinoAntiga] = useState('DEPOSITO_UNIDADE');

  // Relatório Mensal & Faturamento
  const [faturamentoData, setFaturamentoData] = useState<any>(null);
  const [loadingFaturamento, setLoadingFaturamento] = useState(false);

  // Carrega Usuário e Contrato
  const carregarUsuario = async () => {
    try {
      const res = await fetch('/api/auth/me');
      if (res.ok) {
        const data = await res.json();
        setCurrentUser(data.user);
      }
    } finally {
      setLoadingUser(false);
    }
  };

  const carregarContrato = async () => {
    try {
      const res = await fetch('/api/contrato');
      if (res.ok) {
        const data = await res.json();
        setContratoData(data);
      }
    } finally {
      setLoadingContrato(false);
    }
  };

  const carregarChamados = async () => {
    setLoadingChamados(true);
    try {
      let url = '/api/chamados';
      const params = new URLSearchParams();
      if (statusFiltro !== 'TODOS') params.append('status', statusFiltro);
      if (buscaChamado.trim()) params.append('q', buscaChamado.trim());
      // Se demandante, filtra por sua unidade
      if (currentUser?.role === 'DEMANDANTE' && currentUser?.unidadeId) {
        params.append('unidadeId', currentUser.unidadeId);
      }
      if (params.toString()) url += `?${params.toString()}`;

      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        setChamados(data.chamados || []);
      }
    } finally {
      setLoadingChamados(false);
    }
  };

  const carregarEquipamentos = async () => {
    setLoadingEquipamentos(true);
    try {
      let url = '/api/equipamentos';
      if (currentUser?.role === 'DEMANDANTE' && currentUser?.unidadeId) {
        url += `?unidadeId=${currentUser.unidadeId}`;
      }
      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        setEquipamentos(data.equipamentos || []);
      }
    } finally {
      setLoadingEquipamentos(false);
    }
  };

  const carregarFaturamento = async () => {
    setLoadingFaturamento(true);
    try {
      const res = await fetch('/api/faturamento/mensal');
      if (res.ok) {
        const data = await res.json();
        setFaturamentoData(data);
      }
    } finally {
      setLoadingFaturamento(false);
    }
  };

  useEffect(() => {
    carregarUsuario();
    carregarContrato();
  }, []);

  useEffect(() => {
    if (currentUser) {
      carregarChamados();
      carregarEquipamentos();
      carregarFaturamento();
    }
  }, [currentUser, statusFiltro]);

  const abrirDetalheChamado = async (chamadoId: string) => {
    setLoadingDetalhe(true);
    try {
      const res = await fetch(`/api/chamados/${chamadoId}`);
      if (res.ok) {
        const data = await res.json();
        setChamadoDetalhe(data.chamado);
      }
    } finally {
      setLoadingDetalhe(false);
    }
  };

  // Submissão do Orçamento pela Empresa
  const handleEnviarOrcamento = async () => {
    if (!chamadoDetalhe) return;
    const intervencaoAlvo = chamadoDetalhe.intervencoes[0];
    if (!intervencaoAlvo) return;

    const itensParaEnviar = Object.entries(itensOrcados)
      .filter(([_, qtd]) => qtd > 0)
      .map(([itemPrecoId, quantidade]) => ({ itemPrecoId, quantidade }));

    if (itensParaEnviar.length === 0) {
      alert('Selecione pelo menos um item da planilha contratual.');
      return;
    }

    try {
      const res = await fetch(`/api/chamados/${chamadoDetalhe.id}/orcamento`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          intervencoesItens: [
            {
              intervencaoId: intervencaoAlvo.id,
              itens: itensParaEnviar,
            },
          ],
          tecnicoNome: currentUser?.nome,
          tecnicoId: currentUser?.id,
          laudoTecnico: laudoOrcamento,
        }),
      });

      if (res.ok) {
        alert('Orçamento anexado com sucesso para validação do Admin PROAD!');
        setModalOrcamento(false);
        abrirDetalheChamado(chamadoDetalhe.id);
        carregarChamados();
      } else {
        const err = await res.json();
        alert(err.error || 'Erro ao anexar orçamento.');
      }
    } catch (e: any) {
      alert(e.message);
    }
  };

  // Aprovação/Rejeição de Orçamento pelo Admin
  const handleAprovarOrcamento = async (acao: 'APROVAR' | 'REJEITAR') => {
    if (!chamadoDetalhe) return;

    try {
      const res = await fetch(`/api/chamados/${chamadoDetalhe.id}/orcamento`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          acao,
          adminNome: currentUser?.nome,
        }),
      });

      if (res.ok) {
        alert(acao === 'APROVAR' ? 'Orçamento aprovado e execução autorizada!' : 'Orçamento rejeitado.');
        abrirDetalheChamado(chamadoDetalhe.id);
        carregarChamados();
        carregarContrato();
      } else {
        const err = await res.json();
        alert(err.error || 'Erro ao processar orçamento.');
      }
    } catch (e: any) {
      alert(e.message);
    }
  };

  // Conclusão de Execução pela Empresa
  const handleConcluirExecucao = async () => {
    if (!chamadoDetalhe) return;

    try {
      const res = await fetch(`/api/chamados/${chamadoDetalhe.id}/execucao`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tecnicoNome: currentUser?.nome || 'Carlos Lima',
          tecnicoCpf: currentUser?.cpf || '456.789.012-34',
          tecnicoId: currentUser?.id,
          laudoTecnico: execucaoLaudo,
          fotosAntes: [execucaoFotosAntes],
          fotosDepois: [execucaoFotosDepois],
          observacoesConclusao: 'Teste térmico realizado com sucesso a 17°C.',
        }),
      });

      if (res.ok) {
        alert('Execução concluída e fotos anexadas! O chamado abriu o prazo de 5 dias úteis para teste do demandante.');
        setModalExecucao(false);
        abrirDetalheChamado(chamadoDetalhe.id);
        carregarChamados();
      } else {
        const err = await res.json();
        alert(err.error || 'Erro ao concluir execução.');
      }
    } catch (e: any) {
      alert(e.message);
    }
  };

  // Ateste Digital do Demandante
  const handleAtestarServico = async () => {
    if (!chamadoDetalhe) return;

    try {
      const res = await fetch(`/api/chamados/${chamadoDetalhe.id}/ateste`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          acao: 'ATESTADO',
          servidorNome: currentUser?.nome,
          servidorMatricula: currentUser?.matricula || '12345-6',
          servidorId: currentUser?.id,
          rating: atesteRating,
          comentario: atesteComentario,
        }),
      });

      if (res.ok) {
        alert('Ateste digital registrado com fé pública! Garantia de 90 dias ativada com sucesso.');
        setModalAteste(false);
        abrirDetalheChamado(chamadoDetalhe.id);
        carregarChamados();
      } else {
        const err = await res.json();
        alert(err.error || 'Erro ao atestar serviço.');
      }
    } catch (e: any) {
      alert(e.message);
    }
  };

  // Rejeição da Solução pelo Demandante
  const handleRejeitarSolucao = async () => {
    if (!chamadoDetalhe) return;
    if (!motivoRejeicao.trim()) {
      alert('Informe a justificativa da rejeição do serviço.');
      return;
    }

    try {
      const res = await fetch(`/api/chamados/${chamadoDetalhe.id}/ateste`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          acao: 'REJEITADO',
          servidorNome: currentUser?.nome,
          motivoRejeicao,
        }),
      });

      if (res.ok) {
        alert('Solução rejeitada com sucesso! O chamado retornou para a empresa refazer.');
        setModalRejeicao(false);
        abrirDetalheChamado(chamadoDetalhe.id);
        carregarChamados();
      } else {
        const err = await res.json();
        alert(err.error || 'Erro ao rejeitar solução.');
      }
    } catch (e: any) {
      alert(e.message);
    }
  };

  // Simular Confirmação Tácita (Cron)
  const handleDispararCronTacito = async () => {
    try {
      const res = await fetch('/api/chamados/cron-tacito', { method: 'POST' });
      const data = await res.json();
      alert(`Mecanismo de confirmação tácita executado! Total homologado: ${data.totalHomologados || 0}`);
      carregarChamados();
      if (chamadoDetalhe) abrirDetalheChamado(chamadoDetalhe.id);
    } catch (e: any) {
      alert(e.message);
    }
  };

  // Abertura de Novo Chamado
  const handleCriarChamado = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!tituloNovoChamado.trim()) {
      alert('Informe o título da demanda.');
      return;
    }

    let idAlvo = equipamentoSelecionadoId;

    // Se estiver no modo On-The-Fly, cadastra o equipamento primeiro
    if (tipoFluxo === 'SIMPLES' && modoEquipamento === 'NOVO_ON_THE_FLY') {
      if (!novoTombo.trim() || !novaMarca.trim() || !novaLocalizacao.trim()) {
        alert('Preencha os campos obrigatórios do equipamento: Tombo, Marca e Localização.');
        return;
      }

      const resEq = await fetch('/api/equipamentos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          unidadeId: currentUser?.unidadeId,
          tombo: novoTombo,
          tipo: novoTipo,
          marca: novaMarca,
          modelo: novoModelo,
          localizacao: novaLocalizacao,
          btus: novoBtus,
          tipoAc: novoTipoAc,
          litragem: novaLitragem,
          qtdTorneiras: novasTorneiras,
          modeloGelagua: novoModeloGelagua,
        }),
      });

      const dataEq = await resEq.json();
      if (!resEq.ok) {
        alert(dataEq.error || 'Erro ao cadastrar equipamento on-the-fly.');
        return;
      }

      idAlvo = dataEq.equipamento.id;
    }

    // Cria o chamado
    try {
      const payload: any = {
        unidadeId: currentUser?.unidadeId,
        demandanteId: currentUser?.id,
        tituloDemanda: tituloNovoChamado,
        descricaoGeral: descricaoNovaDemanda,
        urgente: urgenteNovo,
        tipoFluxo,
      };

      if (tipoFluxo === 'SIMPLES') {
        payload.equipamentoId = idAlvo;
        payload.categoriaServico = categoriaServico;
        payload.defeitoComum = defeitoComum;
        payload.descricaoDefeito = descricaoDefeito;
      } else {
        payload.maquinaAntigaId = substAntigaId;
        payload.maquinaNovaId = substNovaId;
        payload.destinoMaquinaRetirada = substDestinoAntiga;
      }

      const resCh = await fetch('/api/chamados', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const dataCh = await resCh.json();

      if (!resCh.ok) {
        alert(dataCh.error || 'Erro ao abrir chamado.');
        return;
      }

      alert(`Chamado ${dataCh.chamado.numeroProtocolo} aberto com sucesso!`);
      // Reset form
      setTituloNovoChamado('');
      setDescricaoNovaDemanda('');
      setNovoTombo('');
      setNovaMarca('');
      setNovaLocalizacao('');
      setActiveTab('chamados');
      carregarChamados();
      carregarEquipamentos();
    } catch (err: any) {
      alert(err.message);
    }
  };

  // Emissão de Recebimento Provisório pelo Fiscal Técnico
  const handleEmitirRecebimentoProvisorio = async () => {
    try {
      const res = await fetch('/api/faturamento/mensal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fiscalNome: currentUser?.nome,
          fiscalMatricula: currentUser?.matricula || '98765-4',
          fiscalId: currentUser?.id,
        }),
      });

      const data = await res.json();
      if (res.ok) {
        alert(`Recebimento Provisório emitido com sucesso! Medição de R$ ${data.valorTotalMedido?.toFixed(2)} sincronizada com o SGC.`);
        carregarFaturamento();
      } else {
        alert(data.error || 'Erro ao emitir medição.');
      }
    } catch (e: any) {
      alert(e.message);
    }
  };

  // Gerador de PDF Oficial de Fiscalização Técnica (jspdf + autotable)
  const handleGerarPdfOficial = () => {
    if (!faturamentoData || !faturamentoData.listaMaquinas) {
      alert('Não há dados de faturamento para gerar o PDF.');
      return;
    }

    const doc = new jsPDF('landscape');

    // Cabeçalho Oficial
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(13);
    doc.setTextColor(0, 34, 68);
    doc.text('UNIVERSIDADE DO ESTADO DO RIO GRANDE DO NORTE - UERN', 14, 15);
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(50, 50, 50);
    doc.text('PRÓ-REITORIA DE ADMINISTRAÇÃO - PROAD • DIRETORIA DE INFRAESTRUTURA', 14, 21);
    doc.text('RELATÓRIO MENSAL DE FISCALIZAÇÃO TÉCNICA - MANUTENÇÃO DE CLIMATIZAÇÃO E REFRIGERAÇÃO', 14, 27);

    doc.setDrawColor(200, 200, 200);
    doc.line(14, 30, 282, 30);

    // Dados do Contrato e Processo
    doc.setFontSize(9);
    doc.text(`Contrato nº: ${faturamentoData.contrato?.numeroContrato} • Empresa: ${faturamentoData.contrato?.empresa} (CNPJ: ${faturamentoData.contrato?.cnpj})`, 14, 36);
    doc.text(`Processo SEI de Despesa: ${faturamentoData.processoSeiDespesa} • Mês de Referência: ${faturamentoData.mesAno}`, 14, 41);
    doc.text(`Resumo do Faturamento: ${faturamentoData.resumo?.totalChamados} Chamados • ${faturamentoData.resumo?.totalMaquinas} Máquinas Atendidas • Valor Total Medido: R$ ${faturamentoData.resumo?.valorTotalMedido?.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`, 14, 46);

    // Tabela Máquina por Máquina
    const rows = faturamentoData.listaMaquinas.map((item: any, idx: number) => [
      String(idx + 1).padStart(2, '0'),
      item.tombo,
      `${item.unidadeSigla} - ${item.localizacao}`,
      `${item.tipoEquipamento} (${item.marcaModelo} - ${item.btusOuCapacidade})`,
      item.descricaoServico,
      `R$ ${item.valorTotal.toFixed(2)}`,
      `${item.tecnicoNome}\n(CPF: ${item.tecnicoCpf})`,
      `${item.servidorAtestanteNome}\n(Matr.: ${item.servidorAtestanteMatricula})`,
      new Date(item.dataAteste).toLocaleDateString('pt-BR'),
    ]);

    autoTable(doc, {
      startY: 50,
      head: [
        [
          'Item',
          'Tombo',
          'Unidade / Local',
          'Máquina / Especificação',
          'Serviço Executado & Itens SGC',
          'Valor',
          'Técnico Empresa (Nome/CPF)',
          'Atestante UERN (Nome/Matr.)',
          'Data Ateste',
        ],
      ],
      body: rows,
      theme: 'grid',
      headStyles: { fillColor: [0, 34, 68], textColor: 255, fontSize: 8, fontStyle: 'bold' },
      bodyStyles: { fontSize: 7, textColor: 30 },
      columnStyles: {
        0: { cellWidth: 10 },
        1: { cellWidth: 18, fontStyle: 'bold' },
        2: { cellWidth: 32 },
        3: { cellWidth: 40 },
        4: { cellWidth: 55 },
        5: { cellWidth: 20, fontStyle: 'bold' },
        6: { cellWidth: 35 },
        7: { cellWidth: 38 },
        8: { cellWidth: 20 },
      },
      styles: { overflow: 'linebreak' },
    });

    // Termo de Recebimento Provisório
    const finalY = (doc as any).lastAutoTable.finalY + 12;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.text('TERMO DE RECEBIMENTO PROVISÓRIO (Art. 140, I, "a" da Lei 14.133/21):', 14, finalY);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.text(
      'Atesto provisoriamente a conformidade e execução dos serviços discriminados neste relatório analítico, objeto do Contrato acima referido, para fins de regular processamento da despesa perante a Pró-Reitoria de Administração da UERN.',
      14,
      finalY + 5
    );

    doc.line(14, finalY + 18, 120, finalY + 18);
    doc.text(`${faturamentoData.fiscalTecnicoNome || 'Prof. Dr. Fernando Santos'}`, 14, finalY + 22);
    doc.text(`Fiscal Técnico do Contrato • Matrícula UERN: ${faturamentoData.fiscalTecnicoMatricula || '98765-4'}`, 14, finalY + 26);

    doc.save(`Relatorio_Fiscalizacao_Climatizacao_${faturamentoData.mesAno.replace('/', '_')}.pdf`);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-between">
      {/* Top Navbar */}
      <Navbar currentUser={currentUser} onRoleSwitched={carregarUsuario} />

      <main className="flex-1 max-w-7xl mx-auto w-full px-6 py-6 space-y-6">
        {/* Banner de Topo com Saldo Contratual e Auto-Discovery SGC */}
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-blue-950 via-[#002244] to-slate-900 border border-blue-500/30 p-6 shadow-xl">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative z-10">
            <div>
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-cyan-500/15 border border-cyan-400/30 text-cyan-300 text-xs font-semibold mb-2">
                <Sparkles className="w-3.5 h-3.5 text-cyan-400" /> Sincronizado com SGC • Contrato Ativo
              </div>
              <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight flex items-center gap-2">
                <span>{contratoData?.contrato?.numeroContrato || 'Contrato nº 14/2025'}</span>
                <span className="text-xs bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-2 py-0.5 rounded font-normal">
                  Vigente até 31/12/2026
                </span>
              </h2>
              <p className="text-xs text-slate-300 mt-1">
                Empresa Contratada:{' '}
                <strong className="text-amber-300">
                  {contratoData?.contrato?.empresa?.razaoSocial || 'ClimaFrio Serviços e Comércio Ltda'}
                </strong>{' '}
                • Processo SEI: {contratoData?.contrato?.processoSeiMae}
              </p>
            </div>

            {/* Saldo Contratual Disponível */}
            <div className="bg-slate-900/90 border border-white/10 rounded-xl p-4 min-w-[300px]">
              <div className="flex justify-between items-center text-xs mb-1.5">
                <span className="text-slate-400">Saldo Contratual Disponível:</span>
                <span className="text-emerald-400 font-extrabold text-sm">
                  R$ {contratoData?.contrato?.saldoDisponivel?.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </span>
              </div>
              <div className="w-full h-2.5 bg-slate-800 rounded-full overflow-hidden mb-1.5">
                <div
                  className="h-full bg-gradient-to-r from-cyan-500 to-blue-500 rounded-full"
                  style={{ width: `${Math.min(100, contratoData?.contrato?.percentualConsumido || 8.8)}%` }}
                />
              </div>
              <div className="flex justify-between text-[11px] text-slate-400">
                <span>Consumido: R$ {contratoData?.contrato?.totalConsumido?.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                <span>Global: R$ {contratoData?.contrato?.valorGlobal?.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 pb-3">
          <div className="flex items-center gap-2 overflow-x-auto">
            <button
              type="button"
              onClick={() => setActiveTab('chamados')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
                activeTab === 'chamados'
                  ? 'bg-cyan-500 text-slate-950 shadow-md'
                  : 'bg-slate-900 hover:bg-slate-800 text-slate-300 border border-white/10'
              }`}
            >
              <Clock className="w-4 h-4" />
              <span>Chamados ({chamados.length})</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('novo')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
                activeTab === 'novo'
                  ? 'bg-amber-500 text-slate-950 shadow-md'
                  : 'bg-slate-900 hover:bg-slate-800 text-slate-300 border border-white/10'
              }`}
            >
              <PlusCircle className="w-4 h-4" />
              <span>Abrir Chamado</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('inventario')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
                activeTab === 'inventario'
                  ? 'bg-cyan-500 text-slate-950 shadow-md'
                  : 'bg-slate-900 hover:bg-slate-800 text-slate-300 border border-white/10'
              }`}
            >
              <Snowflake className="w-4 h-4" />
              <span>Inventário de Máquinas</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('faturamento')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
                activeTab === 'faturamento'
                  ? 'bg-cyan-500 text-slate-950 shadow-md'
                  : 'bg-slate-900 hover:bg-slate-800 text-slate-300 border border-white/10'
              }`}
            >
              <FileText className="w-4 h-4" />
              <span>Fechamento Mensal (PDF)</span>
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleDispararCronTacito}
              className="text-[11px] px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 border border-white/10 flex items-center gap-1.5"
              title="Executa teste do timer de 5 dias úteis para aceite tácito"
            >
              <Zap className="w-3.5 h-3.5 text-amber-400" />
              <span>Testar Aceite Tácito</span>
            </button>
          </div>
        </div>

        {/* ------------------------------------------------------------- */}
        {/* TAB 1: LISTAGEM DE CHAMADOS COM BARRA DE EVOLUÇÃO E TIMELINE */}
        {/* ------------------------------------------------------------- */}
        {activeTab === 'chamados' && (
          <div className="space-y-4">
            {/* Filtros */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-900/60 p-3.5 rounded-xl border border-white/10">
              <div className="flex items-center gap-2 flex-1 max-w-md">
                <Search className="w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  placeholder="Buscar por protocolo, máquina ou problema..."
                  value={buscaChamado}
                  onChange={(e) => setBuscaChamado(e.target.value)}
                  className="w-full bg-slate-950 border border-white/10 rounded-lg px-3 py-1.5 text-xs text-white placeholder-slate-500 outline-none focus:border-cyan-500"
                />
              </div>

              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-400">Filtrar:</span>
                <select
                  value={statusFiltro}
                  onChange={(e) => setStatusFiltro(e.target.value)}
                  className="bg-slate-950 border border-white/10 rounded-lg px-2.5 py-1.5 text-xs text-white outline-none cursor-pointer"
                >
                  <option value="TODOS">Todos os Status</option>
                  <option value="ABERTO">Aberto / Em Triagem</option>
                  <option value="ORCAMENTO_ANEXADO">Aguardando Aprovação Orçamento</option>
                  <option value="APROVADO_EM_EXECUCAO">Em Execução</option>
                  <option value="AGUARDANDO_CONFIRMACAO">Aguardando Ateste do Demandante</option>
                  <option value="FINALIZADO">Finalizado</option>
                </select>
              </div>
            </div>

            {/* Cards dos Chamados */}
            <div className="grid grid-cols-1 gap-4">
              {chamados.map((ch) => (
                <div
                  key={ch.id}
                  className="rounded-2xl bg-slate-900/80 border border-white/10 hover:border-cyan-500/40 p-5 transition shadow-lg space-y-4"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-white/10 pb-3">
                    <div className="flex items-center gap-3">
                      <span className="text-sm font-black text-white">{ch.numeroProtocolo}</span>
                      <span className="text-xs px-2.5 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-white/10">
                        {ch.unidade?.sigla} • {ch.unidade?.campus}
                      </span>
                      {ch.intervencoes?.some((i: any) => i.emGarantia) && (
                        <span className="text-[11px] px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 font-bold flex items-center gap-1">
                          <ShieldCheck className="w-3 h-3" /> Em Garantia (R$ 0,00)
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-2">
                      {ch.slaEmHorasRestantes !== null && (
                        <span
                          className={`text-[11px] px-2.5 py-0.5 rounded-full font-bold border ${
                            ch.slaEmHorasRestantes > 0
                              ? 'bg-blue-500/10 text-blue-300 border-blue-500/30'
                              : 'bg-red-500/10 text-red-300 border-red-500/30'
                          }`}
                        >
                          SLA: {ch.slaEmHorasRestantes > 0 ? `Restam ${ch.slaEmHorasRestantes}h` : 'Expirado'}
                        </span>
                      )}

                      <span className="text-xs text-slate-400">
                        {new Date(ch.criadoEm).toLocaleDateString('pt-BR')}
                      </span>
                    </div>
                  </div>

                  <div>
                    <h3 className="text-base font-bold text-white">{ch.tituloDemanda}</h3>
                    <p className="text-xs text-slate-300 mt-1 leading-relaxed">{ch.descricaoGeral}</p>
                  </div>

                  {/* BARRA DE EVOLUÇÃO VISUAL (STEPPER / PROGRESS BAR) */}
                  <div className="bg-slate-950/80 p-3.5 rounded-xl border border-white/10 space-y-2">
                    <div className="flex justify-between items-center text-xs">
                      <span className="font-bold text-cyan-400 flex items-center gap-1.5">
                        <TrendingUp className="w-3.5 h-3.5" /> Etapa Atual: {ch.etapaAtualDescricao}
                      </span>
                      <span className="font-extrabold text-white">{ch.percentualEvolucao}%</span>
                    </div>

                    <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-cyan-500 via-blue-500 to-emerald-400 rounded-full transition-all duration-500"
                        style={{ width: `${ch.percentualEvolucao}%` }}
                      />
                    </div>

                    <div className="flex justify-between text-[10px] text-slate-500 pt-1">
                      <span>1. Abertura</span>
                      <span>2. Diagnóstico/Orçamento</span>
                      <span>3. Execução</span>
                      <span>4. Ateste Demandante</span>
                      <span>5. Conclusão</span>
                    </div>
                  </div>

                  {/* Intervenções por Máquina */}
                  <div className="flex flex-wrap gap-2 text-xs">
                    {ch.intervencoes?.map((it: any) => (
                      <div
                        key={it.id}
                        className="px-2.5 py-1.5 rounded-lg bg-slate-800/80 border border-white/10 flex items-center gap-2"
                      >
                        <Wrench className="w-3.5 h-3.5 text-cyan-400" />
                        <span>
                          Tombo <strong className="text-white">{it.equipamento?.tombo}</strong> • {it.equipamento?.marca} ({it.categoriaServico})
                        </span>
                        {it.valorTotalIntervencao > 0 && (
                          <span className="text-amber-300 font-bold">R$ {it.valorTotalIntervencao.toFixed(2)}</span>
                        )}
                      </div>
                    ))}
                  </div>

                  {/* Ações */}
                  <div className="flex items-center justify-between pt-2 border-t border-white/10">
                    <div className="text-xs text-slate-400">
                      Demandante: <span className="text-slate-200">{ch.demandante?.nome}</span>
                    </div>

                    <button
                      type="button"
                      onClick={() => abrirDetalheChamado(ch.id)}
                      className="px-3.5 py-1.5 rounded-xl bg-cyan-500/15 hover:bg-cyan-500/25 border border-cyan-500/40 text-cyan-300 font-bold text-xs flex items-center gap-1.5 transition"
                    >
                      <span>Acompanhar Timeline & Ações</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ------------------------------------------------------------- */}
        {/* TAB 2: ABERTURA DE NOVO CHAMADO (SIMPLES OU SUBSTITUIÇÃO)     */}
        {/* ------------------------------------------------------------- */}
        {activeTab === 'novo' && (
          <div className="max-w-3xl mx-auto rounded-2xl bg-slate-900 border border-white/10 p-6 sm:p-8 shadow-2xl space-y-6">
            <div>
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/20 border border-amber-500/40 text-amber-300 text-xs font-semibold mb-2">
                <PlusCircle className="w-3.5 h-3.5" /> Novo Atendimento
              </div>
              <h2 className="text-xl font-black text-white">Abertura de Chamado de Climatização</h2>
              <p className="text-xs text-slate-300 mt-1">
                Preencha os dados da demanda para encaminhamento automático à empresa contratada ({contratoData?.contrato?.numeroContrato}).
              </p>
            </div>

            <form onSubmit={handleCriarChamado} className="space-y-5">
              {/* Seletor de Fluxo: Simples vs Substituição */}
              <div className="grid grid-cols-2 gap-3 p-1.5 bg-slate-950 rounded-xl border border-white/10">
                <button
                  type="button"
                  onClick={() => setTipoFluxo('SIMPLES')}
                  className={`py-2 rounded-lg text-xs font-bold transition ${
                    tipoFluxo === 'SIMPLES'
                      ? 'bg-cyan-500 text-slate-950 shadow'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Manutenção / Chamado de 1 Máquina
                </button>
                <button
                  type="button"
                  onClick={() => setTipoFluxo('SUBSTITUICAO')}
                  className={`py-2 rounded-lg text-xs font-bold transition ${
                    tipoFluxo === 'SUBSTITUICAO'
                      ? 'bg-cyan-500 text-slate-950 shadow'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Substituição (Desinstalar Antiga + Instalar Nova)
                </button>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Título da Demanda</label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Ar não gela na Sala 04 / Substituição de ar no gabinete"
                  value={tituloNovoChamado}
                  onChange={(e) => setTituloNovoChamado(e.target.value)}
                  className="w-full bg-slate-950 border border-white/15 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-500 outline-none focus:border-cyan-500"
                />
              </div>

              {/* SE FLUXO SIMPLES */}
              {tipoFluxo === 'SIMPLES' && (
                <div className="space-y-4 p-4 rounded-xl bg-slate-950/80 border border-white/10">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-white">Seleção do Equipamento:</span>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => setModoEquipamento('EXISTENTE')}
                        className={`text-[11px] px-2.5 py-1 rounded-lg font-bold border transition ${
                          modoEquipamento === 'EXISTENTE'
                            ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40'
                            : 'text-slate-400 border-white/10'
                        }`}
                      >
                        Máquina já no Inventário
                      </button>
                      <button
                        type="button"
                        onClick={() => setModoEquipamento('NOVO_ON_THE_FLY')}
                        className={`text-[11px] px-2.5 py-1 rounded-lg font-bold border transition ${
                          modoEquipamento === 'NOVO_ON_THE_FLY'
                            ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                            : 'text-slate-400 border-white/10'
                        }`}
                      >
                        + Cadastrar Nova Máquina On-The-Fly
                      </button>
                    </div>
                  </div>

                  {modoEquipamento === 'EXISTENTE' ? (
                    <div>
                      <select
                        value={equipamentoSelecionadoId}
                        onChange={(e) => setEquipamentoSelecionadoId(e.target.value)}
                        className="w-full bg-slate-900 border border-white/15 rounded-xl px-3.5 py-2.5 text-xs text-white outline-none cursor-pointer"
                      >
                        <option value="">Selecione o equipamento da sua unidade...</option>
                        {equipamentos.map((eq) => (
                          <option key={eq.id} value={eq.id} disabled={eq.possuiChamadoAtivo}>
                            Tombo {eq.tombo} • {eq.marca} {eq.modelo || ''} ({eq.localizacao}){' '}
                            {eq.possuiChamadoAtivo ? '[CHAMADO ATIVO]' : ''}{' '}
                            {eq.emGarantia ? '[GARANTIA ATIVA]' : ''}
                          </option>
                        ))}
                      </select>
                    </div>
                  ) : (
                    /* Formulário de Cadastro On-The-Fly */
                    <div className="space-y-3 pt-2 border-t border-white/10">
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        <div>
                          <label className="block text-[11px] text-slate-400 mb-1">Tipo de Máquina</label>
                          <select
                            value={novoTipo}
                            onChange={(e) => setNovoTipo(e.target.value)}
                            className="w-full bg-slate-900 border border-white/15 rounded-lg px-2.5 py-2 text-xs text-white outline-none"
                          >
                            <option value="AR_CONDICIONADO">Ar-Condicionado</option>
                            <option value="REFRIGERADOR_FREEZER">Geladeira / Freezer</option>
                            <option value="BEBEDOURO_INDUSTRIAL">Bebedouro Industrial</option>
                            <option value="GELAGUA">Gelágua / Purificador</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-[11px] text-slate-400 mb-1">Nº Tombo (Patrimônio)</label>
                          <input
                            type="text"
                            placeholder="Ex: 109844"
                            value={novoTombo}
                            onChange={(e) => setNovoTombo(e.target.value)}
                            className="w-full bg-slate-900 border border-white/15 rounded-lg px-2.5 py-2 text-xs text-white outline-none"
                          />
                        </div>
                        <div>
                          <label className="block text-[11px] text-slate-400 mb-1">Marca</label>
                          <input
                            type="text"
                            placeholder="Ex: Springer / Consul"
                            value={novaMarca}
                            onChange={(e) => setNovaMarca(e.target.value)}
                            className="w-full bg-slate-900 border border-white/15 rounded-lg px-2.5 py-2 text-xs text-white outline-none"
                          />
                        </div>
                      </div>

                      {/* Campos dinâmicos por tipo */}
                      {novoTipo === 'AR_CONDICIONADO' && (
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className="block text-[11px] text-slate-400 mb-1">Capacidade (BTUs)</label>
                            <select
                              value={novoBtus}
                              onChange={(e) => setNovoBtus(parseInt(e.target.value, 10))}
                              className="w-full bg-slate-900 border border-white/15 rounded-lg px-2.5 py-2 text-xs text-white outline-none"
                            >
                              <option value={9000}>9.000 BTUs</option>
                              <option value={12000}>12.000 BTUs</option>
                              <option value={18000}>18.000 BTUs</option>
                              <option value={24000}>24.000 BTUs</option>
                              <option value={30000}>30.000 BTUs</option>
                              <option value={60000}>60.000 BTUs</option>
                            </select>
                          </div>
                          <div>
                            <label className="block text-[11px] text-slate-400 mb-1">Tipo de AC</label>
                            <input
                              type="text"
                              value={novoTipoAc}
                              onChange={(e) => setNovoTipoAc(e.target.value)}
                              placeholder="Split Hi-Wall, Cassete, Piso Teto, Janela"
                              className="w-full bg-slate-900 border border-white/15 rounded-lg px-2.5 py-2 text-xs text-white outline-none"
                            />
                          </div>
                        </div>
                      )}

                      <div>
                        <label className="block text-[11px] text-slate-400 mb-1">Localização Precisa</label>
                        <input
                          type="text"
                          placeholder="Ex: Sala 04, Bloco D, Laboratório de Informática"
                          value={novaLocalizacao}
                          onChange={(e) => setNovaLocalizacao(e.target.value)}
                          className="w-full bg-slate-900 border border-white/15 rounded-lg px-2.5 py-2 text-xs text-white outline-none"
                        />
                      </div>
                    </div>
                  )}

                  {/* Defeitos comuns estruturados */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                    <div>
                      <label className="block text-[11px] text-slate-400 mb-1">Defeito Constatado</label>
                      <select
                        value={defeitoComum}
                        onChange={(e) => setDefeitoComum(e.target.value)}
                        className="w-full bg-slate-900 border border-white/15 rounded-lg px-2.5 py-2 text-xs text-white outline-none"
                      >
                        <option value="NAO_GELA">Não Gela</option>
                        <option value="NAO_LIGA">Não Liga</option>
                        <option value="PINGANDO_DENTRO_DA_SALA">Está pingando dentro da sala</option>
                        <option value="RUIDO_EXCESSIVO">Ruído excessivo / vibração</option>
                        <option value="ODOR_DESAGRADAVEL">Odor desagradável</option>
                        <option value="VAZAMENTO_DE_GAS">Vazamento visível de gás</option>
                        <option value="OUTRO">Outro defeito (descrever abaixo)</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-[11px] text-slate-400 mb-1">Tipo de Serviço</label>
                      <select
                        value={categoriaServico}
                        onChange={(e) => setCategoriaServico(e.target.value)}
                        className="w-full bg-slate-900 border border-white/15 rounded-lg px-2.5 py-2 text-xs text-white outline-none"
                      >
                        <option value="MANUTENCAO_CORRETIVA">Manutenção Corretiva (Conserto)</option>
                        <option value="MANUTENCAO_PREVENTIVA">Preventiva (Higienização / Filtros)</option>
                        <option value="INSTALACAO">Instalação Nova</option>
                      </select>
                    </div>
                  </div>
                </div>
              )}

              {/* SE FLUXO SUBSTITUIÇÃO */}
              {tipoFluxo === 'SUBSTITUICAO' && (
                <div className="space-y-4 p-4 rounded-xl bg-slate-950/80 border border-white/10">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-red-400 mb-1">1. Máquina Antiga a Retirar</label>
                      <select
                        value={substAntigaId}
                        onChange={(e) => setSubstAntigaId(e.target.value)}
                        className="w-full bg-slate-900 border border-white/15 rounded-xl px-3 py-2 text-xs text-white outline-none"
                      >
                        <option value="">Selecione a máquina a ser desinstalada...</option>
                        {equipamentos.map((eq) => (
                          <option key={eq.id} value={eq.id}>
                            Tombo {eq.tombo} • {eq.marca} ({eq.localizacao})
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-emerald-400 mb-1">2. Máquina Nova a Instalar</label>
                      <select
                        value={substNovaId}
                        onChange={(e) => setSubstNovaId(e.target.value)}
                        className="w-full bg-slate-900 border border-white/15 rounded-xl px-3 py-2 text-xs text-white outline-none"
                      >
                        <option value="">Selecione a máquina nova do inventário...</option>
                        {equipamentos.map((eq) => (
                          <option key={eq.id} value={eq.id}>
                            Tombo {eq.tombo} • {eq.marca} ({eq.localizacao})
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Descrição Detalhada do Problema</label>
                <textarea
                  rows={3}
                  placeholder="Relate sintomas, horários de falha ou observações relevantes para o diagnóstico da empresa..."
                  value={descricaoNovaDemanda}
                  onChange={(e) => setDescricaoNovaDemanda(e.target.value)}
                  className="w-full bg-slate-950 border border-white/15 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-500 outline-none focus:border-cyan-500"
                />
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="chkUrgente"
                  checked={urgenteNovo}
                  onChange={(e) => setUrgenteNovo(e.target.checked)}
                  className="rounded text-cyan-500 focus:ring-0 cursor-pointer"
                />
                <label htmlFor="chkUrgente" className="text-xs text-slate-300 cursor-pointer">
                  Marcar como <strong>Urgente / Prioritário</strong> (SLA reduzido de 24h para atendimento emergencial)
                </label>
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => setActiveTab('chamados')}
                  className="px-4 py-2 rounded-xl border border-white/10 hover:bg-slate-800 text-xs text-slate-300"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-bold text-xs shadow-lg transition"
                >
                  Registrar e Encaminhar Chamado
                </button>
              </div>
            </form>
          </div>
        )}

        {/* ------------------------------------------------------------- */}
        {/* TAB 3: INVENTÁRIO DE MÁQUINAS COM RETIFICAÇÃO TÉCNICA         */}
        {/* ------------------------------------------------------------- */}
        {activeTab === 'inventario' && (
          <div className="space-y-4">
            <div className="flex justify-between items-center bg-slate-900/60 p-4 rounded-xl border border-white/10">
              <div>
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <Snowflake className="w-4 h-4 text-cyan-400" />
                  <span>Inventário Patrimonial Térmico por Unidade</span>
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Ar-condicionados, geladeiras, bebedouros e geláguas cadastrados organicamente pelos chamados.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {equipamentos.map((eq) => (
                <div
                  key={eq.id}
                  className="rounded-2xl bg-slate-900/80 border border-white/10 p-5 space-y-3 shadow-md relative"
                >
                  <div className="flex justify-between items-start">
                    <span className="text-xs px-2 py-0.5 rounded bg-slate-800 text-slate-300 font-bold border border-white/10">
                      Tombo: {eq.tombo}
                    </span>
                    {eq.emGarantia ? (
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 font-bold">
                        Garantia: Restam {eq.diasGarantiaRestantes} dias
                      </span>
                    ) : (
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-800 text-slate-400">
                        Sem Garantia
                      </span>
                    )}
                  </div>

                  <div>
                    <h4 className="text-sm font-bold text-white">{eq.marca} {eq.modelo}</h4>
                    <p className="text-xs text-cyan-400 font-semibold">{eq.tipo} • {eq.btus ? `${eq.btus} BTUs` : eq.litragem ? `${eq.litragem} L` : `${eq.qtdTorneiras || 3} torneiras`}</p>
                    <p className="text-xs text-slate-400 mt-1 flex items-center gap-1">
                      <Building2 className="w-3.5 h-3.5 text-slate-500" />
                      <span>{eq.unidade?.sigla} • {eq.localizacao}</span>
                    </p>
                  </div>

                  {eq.retificadoPelaEmpresa && (
                    <div className="text-[11px] p-2 rounded-lg bg-cyan-950/40 border border-cyan-500/20 text-cyan-300">
                      ✓ Retificado pela empresa ({eq.retificadoPorNome})
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ------------------------------------------------------------- */}
        {/* TAB 4: FECHAMENTO MENSAL & RELATÓRIO PDF DE FISCALIZAÇÃO      */}
        {/* ------------------------------------------------------------- */}
        {activeTab === 'faturamento' && (
          <div className="space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-gradient-to-r from-blue-950 to-slate-900 p-5 rounded-2xl border border-blue-500/30 shadow-xl">
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <FileText className="w-5 h-5 text-amber-400" />
                  <span>Fechamento Mensal de Fiscalização Técnica (Mês: {faturamentoData?.mesAno || '04/2026'})</span>
                </h3>
                <p className="text-xs text-slate-300 mt-1">
                  Listagem máquina por máquina para instrução do processo SEI de pagamento do Contrato nº {faturamentoData?.contrato?.numeroContrato}.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleEmitirRecebimentoProvisorio}
                  className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs shadow-md transition flex items-center gap-1.5"
                >
                  <ShieldCheck className="w-4 h-4" />
                  <span>Emitir Recebimento Provisório (SGC)</span>
                </button>

                <button
                  type="button"
                  onClick={handleGerarPdfOficial}
                  className="px-4 py-2 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 text-slate-950 font-bold text-xs shadow-md transition flex items-center gap-1.5"
                >
                  <Printer className="w-4 h-4" />
                  <span>Gerar Relatório Oficial em PDF</span>
                </button>
              </div>
            </div>

            {/* Tabela Máquina por Máquina */}
            <div className="rounded-2xl bg-slate-900 border border-white/10 overflow-hidden shadow-xl">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs text-slate-300">
                  <thead className="bg-slate-950 text-slate-400 uppercase text-[10px] font-bold border-b border-white/10">
                    <tr>
                      <th className="py-3 px-4">Item / Tombo</th>
                      <th className="py-3 px-4">Unidade / Local</th>
                      <th className="py-3 px-4">Máquina / Especificação</th>
                      <th className="py-3 px-4">Serviço Executado & Itens SGC</th>
                      <th className="py-3 px-4">Valor</th>
                      <th className="py-3 px-4">Técnico da Empresa</th>
                      <th className="py-3 px-4">Atestante UERN</th>
                      <th className="py-3 px-4">Data Ateste</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {faturamentoData?.listaMaquinas?.map((it: any, idx: number) => (
                      <tr key={it.intervencaoId} className="hover:bg-slate-800/50">
                        <td className="py-3 px-4">
                          <span className="font-bold text-white">#{String(idx + 1).padStart(2, '0')}</span> • {it.tombo}
                        </td>
                        <td className="py-3 px-4">
                          <span className="text-white font-semibold">{it.unidadeSigla}</span>
                          <div className="text-[11px] text-slate-500">{it.localizacao}</div>
                        </td>
                        <td className="py-3 px-4">
                          <div className="text-cyan-300 font-bold">{it.tipoEquipamento}</div>
                          <div className="text-[11px] text-slate-400">{it.marcaModelo} • {it.btusOuCapacidade}</div>
                        </td>
                        <td className="py-3 px-4 max-w-xs truncate" title={it.descricaoServico}>
                          {it.descricaoServico}
                        </td>
                        <td className="py-3 px-4 font-extrabold text-amber-300">
                          R$ {it.valorTotal.toFixed(2)}
                        </td>
                        <td className="py-3 px-4">
                          <div className="text-white font-semibold">{it.tecnicoNome}</div>
                          <div className="text-[10px] text-slate-500">CPF: {it.tecnicoCpf}</div>
                        </td>
                        <td className="py-3 px-4">
                          <div className="text-white font-semibold">{it.servidorAtestanteNome}</div>
                          <div className="text-[10px] text-slate-500">Matrícula: {it.servidorAtestanteMatricula}</div>
                        </td>
                        <td className="py-3 px-4 text-slate-400">
                          {new Date(it.dataAteste).toLocaleDateString('pt-BR')}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* ------------------------------------------------------------- */}
      {/* MODAL DE DETALHES DO CHAMADO COM TIMELINE E AÇÕES CONTEXTUAIS */}
      {/* ------------------------------------------------------------- */}
      {chamadoDetalhe && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-slate-900 border border-white/15 rounded-2xl max-w-3xl w-full p-6 shadow-2xl space-y-6 max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex justify-between items-start border-b border-white/10 pb-4">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-black text-cyan-400">{chamadoDetalhe.numeroProtocolo}</span>
                  <span className="text-xs px-2 py-0.5 rounded bg-slate-800 text-slate-300">
                    {chamadoDetalhe.unidade?.sigla}
                  </span>
                </div>
                <h3 className="text-lg font-bold text-white mt-1">{chamadoDetalhe.tituloDemanda}</h3>
              </div>

              <button
                type="button"
                onClick={() => setChamadoDetalhe(null)}
                className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            {/* Barra de Evolução no Modal */}
            <div className="bg-slate-950 p-4 rounded-xl border border-white/10 space-y-2">
              <div className="flex justify-between items-center text-xs">
                <span className="text-cyan-400 font-bold">Progresso: {chamadoDetalhe.etapaAtualDescricao}</span>
                <span className="text-white font-extrabold">{chamadoDetalhe.percentualEvolucao}%</span>
              </div>
              <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-cyan-500 via-blue-500 to-emerald-400 rounded-full"
                  style={{ width: `${chamadoDetalhe.percentualEvolucao}%` }}
                />
              </div>
            </div>

            {/* Intervenções por Máquina */}
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">Máquinas Vinculadas</h4>
              <div className="space-y-2">
                {chamadoDetalhe.intervencoes?.map((it: any) => (
                  <div key={it.id} className="p-3 rounded-xl bg-slate-950 border border-white/10 text-xs space-y-1">
                    <div className="flex justify-between items-center">
                      <span className="font-bold text-white">
                        Tombo {it.equipamento?.tombo} • {it.equipamento?.marca} ({it.categoriaServico})
                      </span>
                      {it.valorTotalIntervencao > 0 && (
                        <span className="text-amber-300 font-bold">R$ {it.valorTotalIntervencao.toFixed(2)}</span>
                      )}
                    </div>
                    <div className="text-slate-400">Localização: {it.equipamento?.localizacao}</div>
                    {it.laudoTecnico && (
                      <div className="text-cyan-300 pt-1 text-[11px]">Laudo Técnico: {it.laudoTecnico}</div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* LINHA DO TEMPO CRONOLÓGICA (TIMELINE) */}
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3 flex items-center gap-1.5">
                <History className="w-4 h-4 text-cyan-400" />
                <span>Linha do Tempo de Status (Timeline)</span>
              </h4>

              <div className="relative pl-6 space-y-4 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-800">
                {chamadoDetalhe.historicos?.map((h: any, idx: number) => (
                  <div key={h.id || idx} className="relative">
                    <div className="absolute -left-6 top-1 w-3 h-3 rounded-full bg-cyan-400 border-2 border-slate-900" />
                    <div className="text-xs">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-white">{h.autorNome}</span>
                        <span className="text-[10px] text-slate-500">
                          {new Date(h.criadoEm).toLocaleString('pt-BR')}
                        </span>
                        {h.statusNovo && (
                          <span className="text-[10px] px-2 py-0.5 rounded bg-slate-800 text-cyan-300 font-semibold border border-white/10">
                            {h.statusNovo}
                          </span>
                        )}
                      </div>
                      <p className="text-slate-300 mt-0.5 leading-relaxed">{h.mensagem}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* PAINEL DE AÇÕES CONTEXTUAIS POR PAPEL */}
            <div className="p-4 rounded-xl bg-slate-950 border border-cyan-500/30 flex flex-wrap items-center justify-between gap-3">
              <div className="text-xs text-slate-300">
                Ações disponíveis para seu perfil ({currentUser?.role}):
              </div>

              <div className="flex flex-wrap gap-2">
                {/* 1. Empresa anexa orçamento */}
                {currentUser?.role === 'EMPRESA' && chamadoDetalhe.status === 'AGUARDANDO_ORCAMENTO' && (
                  <button
                    type="button"
                    onClick={() => setModalOrcamento(true)}
                    className="px-3 py-1.5 rounded-lg bg-amber-500 text-slate-950 font-bold text-xs"
                  >
                    Montar Orçamento com Itens SGC
                  </button>
                )}

                {/* 2. Admin aprova/rejeita orçamento */}
                {currentUser?.role === 'ADMIN' && chamadoDetalhe.status === 'ORCAMENTO_ANEXADO' && (
                  <>
                    <button
                      type="button"
                      onClick={() => handleAprovarOrcamento('APROVAR')}
                      className="px-3 py-1.5 rounded-lg bg-emerald-500 text-slate-950 font-bold text-xs"
                    >
                      Aprovar Orçamento (R$ {chamadoDetalhe.orcamentoValorTotal?.toFixed(2)})
                    </button>
                    <button
                      type="button"
                      onClick={() => handleAprovarOrcamento('REJEITAR')}
                      className="px-3 py-1.5 rounded-lg bg-red-500/20 text-red-300 border border-red-500/40 text-xs font-bold"
                    >
                      Rejeitar
                    </button>
                  </>
                )}

                {/* 3. Empresa conclui execução */}
                {currentUser?.role === 'EMPRESA' && chamadoDetalhe.status === 'APROVADO_EM_EXECUCAO' && (
                  <button
                    type="button"
                    onClick={() => setModalExecucao(true)}
                    className="px-3 py-1.5 rounded-lg bg-cyan-500 text-slate-950 font-bold text-xs"
                  >
                    Concluir Execução & Anexar Fotos
                  </button>
                )}

                {/* 4. Demandante valida / rejeita solução */}
                {currentUser?.role === 'DEMANDANTE' && chamadoDetalhe.status === 'AGUARDANDO_CONFIRMACAO' && (
                  <>
                    <button
                      type="button"
                      onClick={() => setModalAteste(true)}
                      className="px-3 py-1.5 rounded-lg bg-emerald-500 text-slate-950 font-bold text-xs"
                    >
                      Atestar Digitalmente (Sem papel)
                    </button>
                    <button
                      type="button"
                      onClick={() => setModalRejeicao(true)}
                      className="px-3 py-1.5 rounded-lg bg-red-500/20 text-red-300 border border-red-500/40 text-xs font-bold"
                    >
                      Rejeitar Solução
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL DE ORÇAMENTO (EMPRESA SELECIONANDO ITENS DA PLANILHA SGC) */}
      {modalOrcamento && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-white/15 rounded-2xl max-w-xl w-full p-6 shadow-2xl space-y-4">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <DollarSign className="w-5 h-5 text-amber-400" />
              <span>Orçamento Baseado na Planilha Contratual SGC</span>
            </h3>

            <p className="text-xs text-slate-300">
              Selecione as quantidades aplicadas de cada item contratual ({contratoData?.contrato?.numeroContrato}):
            </p>

            <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
              {contratoData?.contrato?.itensPreco?.map((item: any) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between p-2.5 rounded-xl bg-slate-950 border border-white/10 text-xs"
                >
                  <div className="flex-1 pr-2">
                    <span className="font-semibold text-white">{item.descricao}</span>
                    <div className="text-[11px] text-amber-300 font-bold">R$ {item.valorUnitario.toFixed(2)} / {item.unidadeMedida}</div>
                  </div>

                  <input
                    type="number"
                    min="0"
                    placeholder="Qtd"
                    value={itensOrcados[item.id] || ''}
                    onChange={(e) =>
                      setItensOrcados({ ...itensOrcados, [item.id]: parseFloat(e.target.value) || 0 })
                    }
                    className="w-16 bg-slate-900 border border-white/15 rounded-lg px-2 py-1 text-center text-xs text-white"
                  />
                </div>
              ))}
            </div>

            <div>
              <label className="block text-xs text-slate-300 mb-1">Justificativa Técnica</label>
              <textarea
                rows={2}
                placeholder="Detalhes das peças ou do serviço..."
                value={laudoOrcamento}
                onChange={(e) => setLaudoOrcamento(e.target.value)}
                className="w-full bg-slate-950 border border-white/15 rounded-xl p-2.5 text-xs text-white outline-none"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-white/10">
              <button
                type="button"
                onClick={() => setModalOrcamento(false)}
                className="px-3.5 py-1.5 rounded-xl border border-white/10 text-xs text-slate-300"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleEnviarOrcamento}
                className="px-4 py-1.5 rounded-xl bg-amber-500 text-slate-950 font-bold text-xs"
              >
                Enviar Orçamento para Aprovação
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL DE CONCLUSÃO DE EXECUÇÃO */}
      {modalExecucao && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-white/15 rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-cyan-400" />
              <span>Comprovação de Conclusão do Serviço</span>
            </h3>

            <p className="text-xs text-slate-300">
              Anexe as fotos de comprovação técnica (antes e depois). O demandante terá 5 dias úteis para testar e validar digitalmente.
            </p>

            <div className="space-y-3">
              <div>
                <label className="block text-xs text-slate-300 mb-1">Laudo / Descrição Técnica dos Reparos</label>
                <textarea
                  rows={2}
                  placeholder="Relatório dos testes térmicos, pressões medidas e peças substituídas..."
                  value={execucaoLaudo}
                  onChange={(e) => setExecucaoLaudo(e.target.value)}
                  className="w-full bg-slate-950 border border-white/15 rounded-xl p-2 text-xs text-white outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="p-3 rounded-xl bg-slate-950 border border-white/10 text-center">
                  <span className="text-[11px] text-slate-400 block mb-1">Foto Antes</span>
                  <span className="text-emerald-400 font-bold">✓ Foto Anexada</span>
                </div>
                <div className="p-3 rounded-xl bg-slate-950 border border-white/10 text-center">
                  <span className="text-[11px] text-slate-400 block mb-1">Foto Depois (Reparado)</span>
                  <span className="text-emerald-400 font-bold">✓ Foto Anexada</span>
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-white/10">
              <button
                type="button"
                onClick={() => setModalExecucao(false)}
                className="px-3.5 py-1.5 rounded-xl border border-white/10 text-xs text-slate-300"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleConcluirExecucao}
                className="px-4 py-1.5 rounded-xl bg-cyan-500 text-slate-950 font-bold text-xs"
              >
                Finalizar e Abrir Prazo para Ateste
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL DE ATESTE DIGITAL (DEMANDANTE AVALIANDO COM NOTA 1-5) */}
      {modalAteste && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-white/15 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Star className="w-5 h-5 text-amber-400" />
              <span>Ateste Digital e Avaliação de Qualidade</span>
            </h3>

            <p className="text-xs text-slate-300">
              Seu aceite digital substitui a OS física assinada. Avalie a qualidade do atendimento prestado:
            </p>

            <div className="flex justify-center gap-2 py-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setAtesteRating(star)}
                  className="p-1 transition hover:scale-110"
                >
                  <Star
                    className={`w-7 h-7 ${
                      star <= atesteRating
                        ? 'fill-amber-400 text-amber-400'
                        : 'text-slate-600'
                    }`}
                  />
                </button>
              ))}
            </div>

            <div>
              <label className="block text-xs text-slate-300 mb-1">Comentário sobre a Execução</label>
              <textarea
                rows={2}
                placeholder="Ar gelando perfeitamente, ambiente limpo, serviço rápido..."
                value={atesteComentario}
                onChange={(e) => setAtesteComentario(e.target.value)}
                className="w-full bg-slate-950 border border-white/15 rounded-xl p-2 text-xs text-white outline-none"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-white/10">
              <button
                type="button"
                onClick={() => setModalAteste(false)}
                className="px-3.5 py-1.5 rounded-xl border border-white/10 text-xs text-slate-300"
              >
                Voltar
              </button>
              <button
                type="button"
                onClick={handleAtestarServico}
                className="px-4 py-1.5 rounded-xl bg-emerald-500 text-slate-950 font-bold text-xs"
              >
                Confirmar Ateste e Ativar Garantia
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL DE REJEIÇÃO DE SOLUÇÃO */}
      {modalRejeicao && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-white/15 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <XCircle className="w-5 h-5 text-red-400" />
              <span>Rejeitar Solução Apresentada</span>
            </h3>

            <p className="text-xs text-slate-300">
              Indique o motivo pelo qual o reparo não atendeu aos parâmetros de funcionamento. O chamado retornará para a empresa:
            </p>

            <div>
              <label className="block text-xs text-slate-300 mb-1">Motivo da Rejeição</label>
              <textarea
                rows={3}
                placeholder="Ex: O ar continuou pingando ou ainda não atinge temperatura..."
                value={motivoRejeicao}
                onChange={(e) => setMotivoRejeicao(e.target.value)}
                className="w-full bg-slate-950 border border-white/15 rounded-xl p-2.5 text-xs text-white outline-none focus:border-red-500"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-white/10">
              <button
                type="button"
                onClick={() => setModalRejeicao(false)}
                className="px-3.5 py-1.5 rounded-xl border border-white/10 text-xs text-slate-300"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleRejeitarSolucao}
                className="px-4 py-1.5 rounded-xl bg-red-500 text-white font-bold text-xs"
              >
                Devolver para a Empresa Corrigir
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Footer Oficial */}
      <footer className="border-t border-white/10 bg-slate-950 px-6 py-4 text-center text-xs text-slate-400">
        © 2026 Universidade do Estado do Rio Grande do Norte - UERN • Pró-Reitoria de Administração (PROAD) • SIG-CLIMA
      </footer>
    </div>
  );
}
