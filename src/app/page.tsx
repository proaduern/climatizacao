'use client';

import React, { useState, useEffect } from 'react';
import Navbar from '@/components/Navbar';
import BannerTreinamento from '@/components/BannerTreinamento';
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
  Users,
  UserPlus,
  Edit3,
  Trash2,
  ShieldAlert,
  Check,
  AlertTriangle,
  Download,
  MapPin,
  Send,
  Share2,
} from 'lucide-react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

export default function HomePage() {
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [loadingUser, setLoadingUser] = useState(true);

  // Dados do Contrato
  const [contratoData, setContratoData] = useState<any>(null);
  const [loadingContrato, setLoadingContrato] = useState(true);
  const [sincronizandoSgc, setSincronizandoSgc] = useState(false);
  const [mensagemSgc, setMensagemSgc] = useState<string | null>(null);

  // Filtros de Itens no Modal de Orçamento
  const [buscaItemOrcamento, setBuscaItemOrcamento] = useState('');
  const [cidadeFiltroOrcamento, setCidadeFiltroOrcamento] = useState('TODOS');

  // Tabs: 'chamados' | 'novo' | 'ambientes' | 'inventario' | 'faturamento' | 'usuarios' | 'parametros'
  const [activeTab, setActiveTab] = useState<'chamados' | 'novo' | 'ambientes' | 'inventario' | 'faturamento' | 'usuarios' | 'parametros'>('chamados');

  // Gestão de Usuários & Técnicos da Empresa
  const [usuariosData, setUsuariosData] = useState<any>(null);
  const [loadingUsuarios, setLoadingUsuarios] = useState(false);
  const [modalUsuarioOpen, setModalUsuarioOpen] = useState(false);
  const [usuarioEmEdicao, setUsuarioEmEdicao] = useState<any | null>(null);
  const [formUsuarioNome, setFormUsuarioNome] = useState('');
  const [formUsuarioCpf, setFormUsuarioCpf] = useState('');
  const [formUsuarioEmail, setFormUsuarioEmail] = useState('');
  const [formUsuarioMatricula, setFormUsuarioMatricula] = useState('');
  const [formUsuarioRole, setFormUsuarioRole] = useState('EMPRESA');
  const [formUsuarioUnidadeId, setFormUsuarioUnidadeId] = useState('');

  // Edição de Chamados pelo Admin
  const [modalEditarChamadoOpen, setModalEditarChamadoOpen] = useState(false);
  const [chamadoEmEdicao, setChamadoEmEdicao] = useState<any | null>(null);
  const [editChamadoTitulo, setEditChamadoTitulo] = useState('');
  const [editChamadoDescricao, setEditChamadoDescricao] = useState('');
  const [editChamadoStatus, setEditChamadoStatus] = useState('ABERTO');
  const [editChamadoUnidadeId, setEditChamadoUnidadeId] = useState('');
  const [editChamadoValor, setEditChamadoValor] = useState('');
  const [editChamadoJustificativa, setEditChamadoJustificativa] = useState('');

  // Parâmetros Operacionais do Contrato Vigente (SLAs, Garantia, Ateste, Alçada)
  const [limiteAprovacao, setLimiteAprovacao] = useState<string>('1000.00');
  const [paramPrazoRegular, setParamPrazoRegular] = useState<string>('72');
  const [paramPrazoUrgente, setParamPrazoUrgente] = useState<string>('24');
  const [paramDiasGarantia, setParamDiasGarantia] = useState<string>('90');
  const [paramDiasAteste, setParamDiasAteste] = useState<string>('5');
  const [salvandoParametros, setSalvandoParametros] = useState(false);
  const [msgSucessoParametros, setMsgSucessoParametros] = useState<string | null>(null);
  const [salvandoLimite, setSalvandoLimite] = useState(false);
  const [msgSucessoLimite, setMsgSucessoLimite] = useState<string | null>(null);
  const [zerandoSaldo, setZerandoSaldo] = useState(false);

  // Gestão / CRUD de Equipamentos pelo Admin
  const [modalEquipamentoOpen, setModalEquipamentoOpen] = useState(false);
  const [equipamentoEmEdicao, setEquipamentoEmEdicao] = useState<any | null>(null);
  const [formEqUnidadeId, setFormEqUnidadeId] = useState('');
  const [formEqAmbienteId, setFormEqAmbienteId] = useState('');
  const [formEqTombo, setFormEqTombo] = useState('');
  const [formEqTipo, setFormEqTipo] = useState('AR_CONDICIONADO');
  const [formEqMarca, setFormEqMarca] = useState('');
  const [formEqModelo, setFormEqModelo] = useState('');
  const [formEqLocalizacao, setFormEqLocalizacao] = useState('');
  const [formEqStatus, setFormEqStatus] = useState('ATIVO');
  const [formEqBtus, setFormEqBtus] = useState('18000');
  const [formEqTipoAc, setFormEqTipoAc] = useState('Split Hi-Wall');
  const [formEqGas, setFormEqGas] = useState('R410A');
  const [formEqInverter, setFormEqInverter] = useState(true);
  const [formEqLitragem, setFormEqLitragem] = useState('380');
  const [formEqTipoRefrigerador, setFormEqTipoRefrigerador] = useState('REFRIGERADOR_DUPLEX');
  const [formEqTorneiras, setFormEqTorneiras] = useState('3');
  const [formEqCapacidadeLitros, setFormEqCapacidadeLitros] = useState('100');
  const [formEqModeloGelagua, setFormEqModeloGelagua] = useState('COLUNA');
  const [buscaInventario, setBuscaInventario] = useState('');
  const [tipoFiltroInventario, setTipoFiltroInventario] = useState('TODOS');
  const [unidadeFiltroInventario, setUnidadeFiltroInventario] = useState('TODOS');

  // Modal de Extrato Detalhado do Saldo Consumido (R$ 740,00)
  const [modalExtratoConsumoOpen, setModalExtratoConsumoOpen] = useState(false);

  // Seleção de Técnico na Execução
  const [execucaoTecnicoId, setExecucaoTecnicoId] = useState('');
  const [execucaoTecnicoNome, setExecucaoTecnicoNome] = useState('');
  const [execucaoTecnicoCpf, setExecucaoTecnicoCpf] = useState('');

  // Gestão de Ambientes da Unidade & Priorização Contratual
  const [ambientes, setAmbientes] = useState<any[]>([]);
  const [loadingAmbientes, setLoadingAmbientes] = useState(false);
  const [modoAmbiente, setModoAmbiente] = useState<'EXISTENTE' | 'NOVO_ON_THE_FLY'>('EXISTENTE');
  const [ambienteSelecionadoId, setAmbienteSelecionadoId] = useState('');
  const [novoAmbienteTipo, setNovoAmbienteTipo] = useState('SALA_DE_AULA');
  const [novoAmbienteDetalhe, setNovoAmbienteDetalhe] = useState('');
  const [novoAmbienteBloco, setNovoAmbienteBloco] = useState('');

  // Menu dedicado: Gestão de Ambientes / Espaços
  const [modalAmbienteOpen, setModalAmbienteOpen] = useState(false);
  const [ambienteEmEdicao, setAmbienteEmEdicao] = useState<any | null>(null);
  const [formAmbUnidadeId, setFormAmbUnidadeId] = useState('');
  const [formAmbTipo, setFormAmbTipo] = useState('SALA_DE_AULA');
  const [formAmbDetalhe, setFormAmbDetalhe] = useState('');
  const [formAmbBloco, setFormAmbBloco] = useState('');
  const [salvandoAmbiente, setSalvandoAmbiente] = useState(false);
  const [buscaAmbiente, setBuscaAmbiente] = useState('');
  const [tipoFiltroAmbiente, setTipoFiltroAmbiente] = useState('TODOS');
  const [unidadeFiltroAmbientes, setUnidadeFiltroAmbientes] = useState('TODAS');

  // Controle e Filtros por Cidade
  const [cidadesList, setCidadesList] = useState<string[]>([]);
  const [unidadesList, setUnidadesList] = useState<any[]>([]);
  const [cidadeFiltroChamados, setCidadeFiltroChamados] = useState('TODOS');
  const [apenasPrioritariosFiltro, setApenasPrioritariosFiltro] = useState(false);
  const [cidadeFiltroFaturamento, setCidadeFiltroFaturamento] = useState('TODOS');

  // Modal para o Admin Editar Cidade da Unidade
  const [modalEditarCidadeOpen, setModalEditarCidadeOpen] = useState(false);
  const [unidadeParaEditarCidade, setUnidadeParaEditarCidade] = useState<any | null>(null);
  const [editUnidadeCidade, setEditUnidadeCidade] = useState('');
  const [salvandoCidadeUnidade, setSalvandoCidadeUnidade] = useState(false);

  // Condenação de Máquina com Laudo Técnico (Inservível / Sem Conserto)
  const [modalCondenarOpen, setModalCondenarOpen] = useState(false);
  const [condenarChamado, setCondenarChamado] = useState<any | null>(null);
  const [condenarIntervencao, setCondenarIntervencao] = useState<any | null>(null);
  const [condenarLaudo, setCondenarLaudo] = useState('');
  const [condenarTecnicoNome, setCondenarTecnicoNome] = useState('');
  const [condenarTecnicoCpf, setCondenarTecnicoCpf] = useState('');
  const [condenarTecnicoId, setCondenarTecnicoId] = useState('');
  const [condenarMotivo, setCondenarMotivo] = useState('Inviabilidade técnica de conserto (perda total de compressor/serpentina)');
  const [salvandoCondenacao, setSalvandoCondenacao] = useState(false);

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

  // Estados para o Fluxo Oficial de Laudo e Parecer da SOBE (Conforme Fluxograma)
  const [modalLaudoEmpresa, setModalLaudoEmpresa] = useState(false);
  const [laudoEmpresaTexto, setLaudoEmpresaTexto] = useState('');
  const [laudoEmpresaMotivo, setLaudoEmpresaMotivo] = useState('ALTA_COMPLEXIDADE');
  const [laudoEmpresaCusto, setLaudoEmpresaCusto] = useState('');
  const [laudoEmpresaTecnico, setLaudoEmpresaTecnico] = useState('');

  const [modalDespachoSobe, setModalDespachoSobe] = useState(false);
  const [despachoSobeDuvida, setDespachoSobeDuvida] = useState('');

  const [modalParecerSobe, setModalParecerSobe] = useState(false);
  const [parecerSobeTexto, setParecerSobeTexto] = useState('');
  const [parecerSobeFavoravel, setParecerSobeFavoravel] = useState(true);
  const [parecerSobeEngenheiro, setParecerSobeEngenheiro] = useState('');
  const [parecerSobeMatricula, setParecerSobeMatricula] = useState('');

  const [modalReprovarLaudo, setModalReprovarLaudo] = useState(false);
  const [reprovarLaudoMotivo, setReprovarLaudoMotivo] = useState('');
  const [salvandoLaudoAcao, setSalvandoLaudoAcao] = useState(false);

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

  const carregarContrato = async (force?: boolean) => {
    try {
      const res = await fetch(`/api/contrato${force ? '?forceSync=true' : ''}`);
      if (res.ok) {
        const data = await res.json();
        setContratoData(data);
        if (data?.contrato?.limiteAprovacaoAutomatica !== undefined && data?.contrato?.limiteAprovacaoAutomatica !== null) {
          setLimiteAprovacao(String(data.contrato.limiteAprovacaoAutomatica));
        }
        if (data?.contrato?.prazoAtendimentoHorasRegular !== undefined && data?.contrato?.prazoAtendimentoHorasRegular !== null) {
          setParamPrazoRegular(String(data.contrato.prazoAtendimentoHorasRegular));
        }
        if (data?.contrato?.prazoAtendimentoHorasUrgente !== undefined && data?.contrato?.prazoAtendimentoHorasUrgente !== null) {
          setParamPrazoUrgente(String(data.contrato.prazoAtendimentoHorasUrgente));
        }
        if (data?.contrato?.diasGarantiaPadrao !== undefined && data?.contrato?.diasGarantiaPadrao !== null) {
          setParamDiasGarantia(String(data.contrato.diasGarantiaPadrao));
        }
        if (data?.contrato?.diasPrazoAtesteDemandante !== undefined && data?.contrato?.diasPrazoAtesteDemandante !== null) {
          setParamDiasAteste(String(data.contrato.diasPrazoAtesteDemandante));
        }
      }
    } finally {
      setLoadingContrato(false);
    }
  };

  const handleSincronizarSgc = async () => {
    setSincronizandoSgc(true);
    setMensagemSgc(null);
    try {
      const res = await fetch('/api/contrato', { method: 'POST' });
      if (res.ok) {
        const data = await res.json();
        await carregarContrato(true);
        setMensagemSgc(`SGC Sincronizado com sucesso! Contrato nº ${data?.contrato?.numeroContrato} (${data?.contrato?.totalItens || 108} itens).`);
        setTimeout(() => setMensagemSgc(null), 6000);
      } else {
        const err = await res.json();
        alert(`Erro na sincronização: ${err.error || 'Erro desconhecido'}`);
      }
    } catch (e: any) {
      alert(`Falha ao conectar com o serviço de sincronização: ${e.message}`);
    } finally {
      setSincronizandoSgc(false);
    }
  };

  const formatTipoAmbiente = (tipo?: string) => {
    switch (tipo) {
      case 'SALA_DE_AULA':
        return 'Sala de Aula';
      case 'LABORATORIO_PESQUISA_ININTERRUPTO':
        return 'Lab. de Pesquisa Ininterrupto';
      case 'SALA_ESTUDOS_BIBLIOTECA':
        return 'Sala de Estudos (Biblioteca)';
      case 'LABORATORIOS_DIVERSOS':
        return 'Laboratórios Diversos';
      case 'OUTRAS_SALAS_USO_ACADEMICO':
        return 'Uso Acadêmico';
      case 'AUDITORIO':
        return 'Auditório';
      case 'SALA_ADMINISTRATIVA':
        return 'Sala Administrativa';
      case 'CORREDOR_PATIO':
        return 'Corredor / Pátio';
      default:
        return tipo || 'Ambiente';
    }
  };

  const carregarChamados = async () => {
    setLoadingChamados(true);
    try {
      let url = '/api/chamados';
      const params = new URLSearchParams();
      if (statusFiltro !== 'TODOS') params.append('status', statusFiltro);
      if (cidadeFiltroChamados !== 'TODOS') params.append('cidade', cidadeFiltroChamados);
      if (apenasPrioritariosFiltro) params.append('prioritario', 'true');
      if (buscaChamado.trim()) params.append('q', buscaChamado.trim());
      // Se demandante, filtra por sua unidade
      if (currentUser?.role === 'DEMANDANTE' && currentUser?.unidadeId) {
        params.append('unidadeId', currentUser.unidadeId);
      }
      if (params.toString()) url += `?${params.toString()}`;

      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        const list = data.chamados || [];
        setChamados(list);
        if (typeof window !== 'undefined') {
          const p = new URLSearchParams(window.location.search);
          if (p.get('detalhe') && list.length > 0) {
            abrirDetalheChamado(list[0].id);
          }
        }
      }
    } finally {
      setLoadingChamados(false);
    }
  };

  const carregarAmbientes = async (unidadeId?: string) => {
    const unId = unidadeId !== undefined ? unidadeId : (currentUser?.role === 'ADMIN' ? '' : currentUser?.unidadeId);
    setLoadingAmbientes(true);
    try {
      const url = unId && unId !== 'TODAS' ? `/api/ambientes?unidadeId=${unId}` : '/api/ambientes';
      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        setAmbientes(data.ambientes || []);
        if (data.ambientes?.length > 0 && !ambienteSelecionadoId) {
          setAmbienteSelecionadoId(data.ambientes[0].id);
        }
      }
    } finally {
      setLoadingAmbientes(false);
    }
  };

  const carregarUnidades = async () => {
    try {
      const res = await fetch('/api/unidades');
      if (res.ok) {
        const data = await res.json();
        setUnidadesList(data.unidades || []);
        setCidadesList(data.cidades || []);
      }
    } catch (e) {
      console.error(e);
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

  const carregarFaturamento = async (cidade?: string) => {
    setLoadingFaturamento(true);
    try {
      const cid = cidade || cidadeFiltroFaturamento;
      const url = `/api/faturamento/mensal${cid && cid !== 'TODOS' ? `?cidade=${encodeURIComponent(cid)}` : ''}`;
      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        setFaturamentoData(data);
      }
    } finally {
      setLoadingFaturamento(false);
    }
  };

  const carregarUsuarios = async () => {
    setLoadingUsuarios(true);
    try {
      const res = await fetch('/api/usuarios');
      if (res.ok) {
        const data = await res.json();
        setUsuariosData(data);
      }
    } finally {
      setLoadingUsuarios(false);
    }
  };

  const handleAbrirEditarCidade = (unidade: any) => {
    setUnidadeParaEditarCidade(unidade);
    setEditUnidadeCidade(unidade.cidade || 'Mossoró');
    setModalEditarCidadeOpen(true);
  };

  const handleSalvarCidadeUnidade = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!unidadeParaEditarCidade) return;
    if (!editUnidadeCidade.trim()) {
      alert('Informe o nome da cidade.');
      return;
    }

    setSalvandoCidadeUnidade(true);
    try {
      const res = await fetch(`/api/unidades/${unidadeParaEditarCidade.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cidade: editUnidadeCidade.trim() }),
      });
      const data = await res.json();
      if (res.ok) {
        alert(data.mensagem || 'Cidade da unidade atualizada com sucesso!');
        setModalEditarCidadeOpen(false);
        await carregarUnidades();
        await carregarChamados();
      } else {
        alert(data.error || 'Erro ao atualizar cidade.');
      }
    } catch (err: any) {
      alert(err.message);
    } finally {
      setSalvandoCidadeUnidade(false);
    }
  };

  useEffect(() => {
    carregarUsuario();
    carregarContrato();
    carregarUnidades();
    if (typeof window !== 'undefined') {
      const p = new URLSearchParams(window.location.search);
      const tabParam = p.get('tab');
      if (tabParam && ['chamados', 'novo', 'ambientes', 'inventario', 'faturamento', 'usuarios', 'parametros'].includes(tabParam)) {
        setActiveTab(tabParam as any);
      }
    }
  }, []);

  useEffect(() => {
    if (currentUser) {
      carregarChamados();
      carregarEquipamentos();
      carregarFaturamento();
      carregarUsuarios();
      if (currentUser.unidadeId) {
        carregarAmbientes(currentUser.unidadeId);
      }
    }
  }, [currentUser, statusFiltro, cidadeFiltroChamados, apenasPrioritariosFiltro]);

  // Gestão de Usuários & Técnicos Handlers
  const handleAbrirCriarTecnico = () => {
    setUsuarioEmEdicao(null);
    setFormUsuarioNome('');
    setFormUsuarioCpf('');
    setFormUsuarioEmail('');
    setFormUsuarioMatricula('');
    setFormUsuarioRole('EMPRESA');
    setFormUsuarioUnidadeId('');
    setModalUsuarioOpen(true);
  };

  const handleAbrirEditarUsuario = (u: any) => {
    setUsuarioEmEdicao(u);
    setFormUsuarioNome(u.nome || '');
    setFormUsuarioCpf(u.cpf || '');
    setFormUsuarioEmail(u.email || '');
    setFormUsuarioMatricula(u.matricula || '');
    setFormUsuarioRole(u.role || 'DEMANDANTE');
    setFormUsuarioUnidadeId(u.unidadeId || '');
    setModalUsuarioOpen(true);
  };

  const handleSalvarUsuario = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formUsuarioNome.trim() || !formUsuarioCpf.trim()) {
      alert('Nome e CPF são obrigatórios.');
      return;
    }

    try {
      const url = usuarioEmEdicao ? `/api/usuarios/${usuarioEmEdicao.id}` : '/api/usuarios';
      const method = usuarioEmEdicao ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nome: formUsuarioNome,
          cpf: formUsuarioCpf,
          email: formUsuarioEmail || undefined,
          matricula: formUsuarioMatricula || undefined,
          role: formUsuarioRole,
          unidadeId: formUsuarioUnidadeId || undefined,
        }),
      });

      const data = await res.json();
      if (res.ok) {
        alert(data.mensagem || 'Usuário salvo com sucesso!');
        setModalUsuarioOpen(false);
        carregarUsuarios();
        carregarUsuario();
      } else {
        alert(data.error || 'Erro ao salvar usuário.');
      }
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleExcluirUsuario = async (id: string, nome: string) => {
    if (!confirm(`Deseja realmente excluir ou inativar o usuário "${nome}"?`)) return;

    try {
      const res = await fetch(`/api/usuarios/${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (res.ok) {
        alert(data.mensagem || 'Usuário processado com sucesso!');
        carregarUsuarios();
      } else {
        alert(data.error || 'Erro ao excluir usuário.');
      }
    } catch (err: any) {
      alert(err.message);
    }
  };

  // Edição e Exclusão de Chamados pelo Admin Handlers
  const handleAbrirEdicaoChamado = (ch: any) => {
    setChamadoEmEdicao(ch);
    setEditChamadoTitulo(ch.tituloDemanda || '');
    setEditChamadoDescricao(ch.descricaoGeral || '');
    setEditChamadoStatus(ch.status || 'ABERTO');
    setEditChamadoUnidadeId(ch.unidadeId || '');
    setEditChamadoValor(ch.orcamentoValorTotal ? String(ch.orcamentoValorTotal) : '');
    setEditChamadoJustificativa('');
    setModalEditarChamadoOpen(true);
  };

  const handleSalvarEdicaoChamado = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chamadoEmEdicao) return;

    try {
      const res = await fetch(`/api/chamados/${chamadoEmEdicao.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tituloDemanda: editChamadoTitulo,
          descricaoGeral: editChamadoDescricao,
          status: editChamadoStatus,
          unidadeId: editChamadoUnidadeId || undefined,
          orcamentoValorTotal: editChamadoValor ? Number(editChamadoValor) : undefined,
          justificativaEdicao: editChamadoJustificativa,
          autorNome: currentUser?.nome || 'Admin PROAD',
        }),
      });

      const data = await res.json();
      if (res.ok) {
        alert('Chamado atualizado com sucesso pelo Administrador!');
        setModalEditarChamadoOpen(false);
        carregarChamados();
        carregarContrato();
        if (chamadoDetalhe && chamadoDetalhe.id === chamadoEmEdicao.id) {
          abrirDetalheChamado(chamadoEmEdicao.id);
        }
      } else {
        alert(data.error || 'Erro ao atualizar chamado.');
      }
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleExcluirChamado = async (id: string, numeroProtocolo: string) => {
    if (!confirm(`Atenção: Deseja realmente excluir o chamado "${numeroProtocolo}" do sistema?\n\nOs aparelhos vinculados voltarão para o status ATIVO imediatamente.`)) {
      return;
    }

    try {
      const res = await fetch(`/api/chamados/${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (res.ok) {
        alert(data.mensagem || 'Chamado excluído com sucesso!');
        if (chamadoDetalhe && chamadoDetalhe.id === id) {
          setChamadoDetalhe(null);
        }
        carregarChamados();
        carregarEquipamentos();
        carregarContrato();
      } else {
        alert(data.error || 'Erro ao excluir chamado.');
      }
    } catch (err: any) {
      alert(err.message);
    }
  };

  // Gestão / CRUD de Equipamentos pelo Admin Handlers
  const handleAbrirCriarEquipamento = () => {
    setEquipamentoEmEdicao(null);
    const defaultUnid = currentUser?.unidadeId || usuariosData?.unidades?.[0]?.id || '';
    setFormEqUnidadeId(defaultUnid);
    setFormEqAmbienteId('');
    setFormEqTombo('');
    setFormEqTipo('AR_CONDICIONADO');
    setFormEqMarca('');
    setFormEqModelo('');
    setFormEqLocalizacao('');
    setFormEqStatus('ATIVO');
    setFormEqBtus('18000');
    setFormEqTipoAc('Split Hi-Wall');
    setFormEqGas('R410A');
    setFormEqInverter(true);
    setFormEqLitragem('380');
    setFormEqTipoRefrigerador('REFRIGERADOR_DUPLEX');
    setFormEqTorneiras('3');
    setFormEqCapacidadeLitros('100');
    setFormEqModeloGelagua('COLUNA');
    setModalEquipamentoOpen(true);
  };

  const handleAbrirEditarEquipamento = (eq: any) => {
    setEquipamentoEmEdicao(eq);
    setFormEqUnidadeId(eq.unidade?.id || eq.unidadeId || '');
    setFormEqAmbienteId(eq.ambienteId || '');
    setFormEqTombo(eq.tombo || '');
    setFormEqTipo(eq.tipo || 'AR_CONDICIONADO');
    setFormEqMarca(eq.marca || '');
    setFormEqModelo(eq.modelo || '');
    setFormEqLocalizacao(eq.localizacao || '');
    setFormEqStatus(eq.status || 'ATIVO');
    setFormEqBtus(eq.btus ? String(eq.btus) : '18000');
    setFormEqTipoAc(eq.tipoAc || 'Split Hi-Wall');
    setFormEqGas(eq.gasRefrigerante || 'R410A');
    setFormEqInverter(eq.tecnologiaInverter ?? true);
    setFormEqLitragem(eq.litragem ? String(eq.litragem) : '380');
    setFormEqTipoRefrigerador(eq.tipoRefrigerador || 'REFRIGERADOR_DUPLEX');
    setFormEqTorneiras(eq.qtdTorneiras ? String(eq.qtdTorneiras) : '3');
    setFormEqCapacidadeLitros(eq.capacidadeLitros ? String(eq.capacidadeLitros) : '100');
    setFormEqModeloGelagua(eq.modeloGelagua || 'COLUNA');
    setModalEquipamentoOpen(true);
  };

  const handleSalvarEquipamento = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formEqTombo.trim() || !formEqMarca.trim() || !formEqUnidadeId) {
      alert('Unidade, Tombo e Marca são obrigatórios.');
      return;
    }

    if (!formEqAmbienteId && formEqStatus !== 'DESINSTALADO_DEPOSITO') {
      alert('Vínculo Obrigatório: A máquina deve ser necessariamente vinculada a um ambiente/espaço físico da unidade.');
      return;
    }

    try {
      const url = equipamentoEmEdicao ? `/api/equipamentos/${equipamentoEmEdicao.id}` : '/api/equipamentos';
      const method = equipamentoEmEdicao ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: equipamentoEmEdicao?.id,
          unidadeId: formEqUnidadeId,
          ambienteId: formEqAmbienteId || null,
          tombo: formEqTombo.trim(),
          tipo: formEqTipo,
          marca: formEqMarca.trim(),
          modelo: formEqModelo.trim() || null,
          localizacao: formEqLocalizacao.trim() || null,
          status: formEqStatus,
          btus: formEqTipo === 'AR_CONDICIONADO' ? parseInt(formEqBtus, 10) : null,
          tipoAc: formEqTipo === 'AR_CONDICIONADO' ? formEqTipoAc : null,
          gasRefrigerante: formEqTipo === 'AR_CONDICIONADO' ? formEqGas : null,
          tecnologiaInverter: formEqTipo === 'AR_CONDICIONADO' ? formEqInverter : null,
          litragem: formEqTipo === 'REFRIGERADOR_FREEZER' ? parseInt(formEqLitragem, 10) : null,
          tipoRefrigerador: formEqTipo === 'REFRIGERADOR_FREEZER' ? formEqTipoRefrigerador : null,
          qtdTorneiras: formEqTipo === 'BEBEDOURO_INDUSTRIAL' ? parseInt(formEqTorneiras, 10) : null,
          capacidadeLitros: formEqTipo === 'BEBEDOURO_INDUSTRIAL' ? parseInt(formEqCapacidadeLitros, 10) : null,
          modeloGelagua: formEqTipo === 'GELAGUA' ? formEqModeloGelagua : null,
        }),
      });

      const data = await res.json();
      if (res.ok) {
        alert(data.mensagem || 'Máquina salva com sucesso no inventário!');
        setModalEquipamentoOpen(false);
        carregarEquipamentos();
        carregarAmbientes();
      } else {
        alert(data.error || 'Erro ao salvar máquina.');
      }
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleExcluirEquipamento = async (id: string, tombo: string) => {
    if (!confirm(`Atenção: Deseja realmente excluir a máquina com tombo "${tombo}" do inventário?`)) {
      return;
    }

    try {
      const res = await fetch(`/api/equipamentos/${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (res.ok) {
        alert(data.mensagem || 'Máquina excluída com sucesso!');
        carregarEquipamentos();
        carregarAmbientes();
      } else {
        alert(data.error || 'Erro ao excluir máquina.');
      }
    } catch (err: any) {
      alert(err.message);
    }
  };

  // Handlers para Gestão de Ambientes / Espaços
  const handleAbrirNovoAmbiente = (unidadeIdPre?: string) => {
    setAmbienteEmEdicao(null);
    setFormAmbUnidadeId(unidadeIdPre || currentUser?.unidadeId || (unidadesList.length > 0 ? unidadesList[0].id : ''));
    setFormAmbTipo('SALA_DE_AULA');
    setFormAmbDetalhe('');
    setFormAmbBloco('');
    setModalAmbienteOpen(true);
  };

  const handleAbrirEditarAmbiente = (amb: any) => {
    setAmbienteEmEdicao(amb);
    setFormAmbUnidadeId(amb.unidadeId);
    setFormAmbTipo(amb.tipo);
    setFormAmbDetalhe(amb.descricaoDetalhe);
    setFormAmbBloco(amb.bloco || '');
    setModalAmbienteOpen(true);
  };

  const handleSalvarAmbiente = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formAmbDetalhe.trim() || !formAmbUnidadeId) {
      alert('Unidade e Nome do Ambiente são obrigatórios.');
      return;
    }

    setSalvandoAmbiente(true);
    try {
      const url = ambienteEmEdicao ? `/api/ambientes/${ambienteEmEdicao.id}` : '/api/ambientes';
      const method = ambienteEmEdicao ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          unidadeId: formAmbUnidadeId,
          tipo: formAmbTipo,
          descricaoDetalhe: formAmbDetalhe.trim(),
          bloco: formAmbBloco.trim() || null,
        }),
      });

      const data = await res.json();
      if (res.ok) {
        alert(data.mensagem || 'Espaço/Ambiente salvo com sucesso!');
        setModalAmbienteOpen(false);
        await carregarAmbientes();
        await carregarUnidades();
      } else {
        alert(data.error || 'Erro ao salvar ambiente.');
      }
    } catch (err: any) {
      alert(err.message);
    } finally {
      setSalvandoAmbiente(false);
    }
  };

  const handleExcluirAmbiente = async (amb: any) => {
    if (!confirm(`Deseja realmente excluir o ambiente "${amb.descricaoDetalhe}"?\n\nCertifique-se de que não haja máquinas instaladas nele.`)) {
      return;
    }

    try {
      const res = await fetch(`/api/ambientes/${amb.id}`, { method: 'DELETE' });
      const data = await res.json();
      if (res.ok) {
        alert(data.mensagem || 'Ambiente excluído com sucesso!');
        await carregarAmbientes();
        await carregarUnidades();
      } else {
        alert(data.error || 'Erro ao excluir ambiente.');
      }
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleAbrirNovaMaquinaNoAmbiente = (amb: any) => {
    handleAbrirCriarEquipamento();
    setFormEqUnidadeId(amb.unidadeId);
    setFormEqAmbienteId(amb.id);
    setFormEqLocalizacao(amb.descricaoDetalhe);
  };

  const handleAbrirChamadoParaMaquina = (eq: any, amb?: any) => {
    setActiveTab('novo');
    setTipoFluxo('SIMPLES');
    setEquipamentoSelecionadoId(eq.id);
    if (amb?.id || eq.ambienteId) {
      setAmbienteSelecionadoId(amb?.id || eq.ambienteId);
      setModoAmbiente('EXISTENTE');
    }
    setTituloNovoChamado(`Manutenção no ${eq.tipo?.replace('_', ' ')} (Tombo: ${eq.tombo})`);
  };

  const handleAlterarStatusDireto = async (novoStatus: string) => {
    if (!chamadoDetalhe) return;
    if (!confirm(`Deseja alterar o status do chamado para "${novoStatus}"?`)) return;

    try {
      const res = await fetch(`/api/chamados/${chamadoDetalhe.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: novoStatus,
          autorNome: currentUser?.nome || 'Admin PROAD',
          justificativaEdicao: 'Alteração rápida de status pelo Administrador.',
        }),
      });

      const data = await res.json();
      if (res.ok) {
        alert('Status alterado com sucesso!');
        abrirDetalheChamado(chamadoDetalhe.id);
        carregarChamados();
        carregarEquipamentos();
      } else {
        alert(data.error || 'Erro ao alterar status.');
      }
    } catch (err: any) {
      alert(err.message);
    }
  };

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

  // Salvar Parâmetro de Limite de Aprovação Automática pelo Admin
  const handleSalvarLimiteAprovacao = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const valorNum = parseFloat(limiteAprovacao);
    if (isNaN(valorNum) || valorNum < 0) {
      alert('Por favor informe um valor numérico válido para o limite de aprovação (ex: 1000.00).');
      return;
    }
    if (!contratoData?.contrato?.id) {
      alert('Contrato ativo não identificado.');
      return;
    }

    setSalvandoLimite(true);
    try {
      const res = await fetch('/api/contrato', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contratoId: contratoData.contrato.id,
          limiteAprovacaoAutomatica: valorNum,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        setMsgSucessoLimite(`Parâmetro salvo com sucesso! Orçamentos até R$ ${valorNum.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} terão aprovação automática.`);
        setTimeout(() => setMsgSucessoLimite(null), 6000);
        await carregarContrato();
      } else {
        alert(data.error || 'Erro ao atualizar parâmetro.');
      }
    } catch (err: any) {
      alert(err.message);
    } finally {
      setSalvandoLimite(false);
    }
  };

  // Salvar Todos os Parâmetros Operacionais do Contrato Vigente pelo Admin
  const handleSalvarParametrosContrato = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!contratoData?.contrato?.id) {
      alert('Contrato ativo não identificado.');
      return;
    }

    const reg = parseInt(paramPrazoRegular, 10);
    const urg = parseInt(paramPrazoUrgente, 10);
    const gar = parseInt(paramDiasGarantia, 10);
    const ateste = parseInt(paramDiasAteste, 10);
    const limite = parseFloat(limiteAprovacao);

    if (isNaN(reg) || reg <= 0) {
      alert('Informe um prazo regular de atendimento válido em horas úteis (ex: 72).');
      return;
    }
    if (isNaN(urg) || urg <= 0) {
      alert('Informe um prazo urgente de atendimento válido em horas úteis (ex: 24).');
      return;
    }
    if (isNaN(gar) || gar <= 0) {
      alert('Informe um prazo de garantia válido em dias corridos (ex: 90).');
      return;
    }
    if (isNaN(ateste) || ateste <= 0) {
      alert('Informe um prazo de ateste válido em dias úteis (ex: 5).');
      return;
    }
    if (isNaN(limite) || limite < 0) {
      alert('Informe um valor válido para o limite de aprovação automática (ex: 1000.00).');
      return;
    }

    setSalvandoParametros(true);
    setMsgSucessoParametros(null);
    try {
      const res = await fetch('/api/contrato', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contratoId: contratoData.contrato.id,
          prazoAtendimentoHorasRegular: reg,
          prazoAtendimentoHorasUrgente: urg,
          diasGarantiaPadrao: gar,
          diasPrazoAtesteDemandante: ateste,
          limiteAprovacaoAutomatica: limite,
        }),
      });

      const data = await res.json();
      if (res.ok) {
        setMsgSucessoParametros('Parâmetros operacionais do contrato vigente atualizados com sucesso!');
        setTimeout(() => setMsgSucessoParametros(null), 6000);
        await carregarContrato();
      } else {
        alert(data.error || 'Erro ao atualizar parâmetros.');
      }
    } catch (err: any) {
      alert(err.message);
    } finally {
      setSalvandoParametros(false);
    }
  };

  // Zerar ou Estornar Chamados Demonstrativos do Seed (R$ 740,00)
  const handleZerarSaldoDemonstrativo = async () => {
    if (
      !confirm(
        'Atenção: Deseja realmente excluir os chamados demonstrativos do seed (CLIMA-2026-00001 e CLIMA-2026-00002) para restaurar o saldo contratual integral para R$ 1.166.605,42 (R$ 0,00 consumido)?\n\nAs máquinas vinculadas voltarão ao status ATIVO imediatamente.'
      )
    ) {
      return;
    }

    setZerandoSaldo(true);
    try {
      const res = await fetch('/api/contrato/zerar-saldo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ acao: 'EXCLUIR_DEMONSTRATIVOS' }),
      });

      const data = await res.json();
      if (res.ok) {
        alert(data.mensagem || 'Saldo integral restaurado com sucesso!');
        setModalExtratoConsumoOpen(false);
        await carregarContrato(true);
        await carregarChamados();
        await carregarEquipamentos();
      } else {
        alert(data.error || 'Erro ao restaurar saldo.');
      }
    } catch (err: any) {
      alert(err.message);
    } finally {
      setZerandoSaldo(false);
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

      const data = await res.json();
      if (res.ok) {
        alert(data.mensagem || 'Orçamento processado com sucesso!');
        setModalOrcamento(false);
        abrirDetalheChamado(chamadoDetalhe.id);
        carregarChamados();
      } else {
        alert(data.error || 'Erro ao anexar orçamento.');
      }
    } catch (e: any) {
      alert(e.message);
    }
  };

  // Abertura do Modal de Condenação Técnica
  const handleAbrirModalCondenar = (chamado: any, intervencaoAlvo?: any) => {
    const inter = intervencaoAlvo || chamado?.intervencoes?.[0];
    setCondenarChamado(chamado);
    setCondenarIntervencao(inter);

    // Pré-carrega dados do técnico da empresa cadastrado
    const tecPadrao = usuariosData?.usuarios?.find((u: any) => u.role === 'EMPRESA') || currentUser;
    if (tecPadrao) {
      setCondenarTecnicoNome(tecPadrao.nome || '');
      setCondenarTecnicoCpf(tecPadrao.cpf || '');
      setCondenarTecnicoId(tecPadrao.id || '');
    }

    setCondenarMotivo('Inviabilidade técnica de conserto (perda total de compressor/serpentina)');
    setCondenarLaudo(
      `Realizada vistoria técnica in loco no equipamento Tombo ${inter?.equipamento?.tombo || 'S/N'} (${inter?.equipamento?.marca || 'Equipamento'} ${inter?.equipamento?.modelo || ''}). Constatou-se perda total da função operativa decorrente de queima interna do motor-compressor e oxidação severa irrecuperável das serpentinas com vazamento múltiplo de fluido refrigerante. O custo estimado para eventual reparo e substituição de blocos vitais ultrapassa 75% do valor de um equipamento novo com eficiência Procel A. Declara-se a total inservibilidade e condenação técnica do bem, sendo recomendada a baixa patrimonial e descarte para instrução de processo de compra na PROAD/SEI.`
    );
    setModalCondenarOpen(true);
  };

  // Submissão da Condenação com Laudo Circunstanciado
  const handleConfirmarCondenacao = async () => {
    if (!condenarChamado || !condenarIntervencao) return;

    if (!condenarLaudo.trim() || condenarLaudo.trim().length < 20) {
      alert('Por favor, informe um Laudo Técnico circunstanciado com pelo menos 20 caracteres descrevendo os motivos da inviabilidade.');
      return;
    }

    if (!condenarTecnicoNome.trim()) {
      alert('Informe o nome do técnico responsável pela perícia.');
      return;
    }

    if (!condenarTecnicoCpf.trim()) {
      alert('Informe o CPF do técnico responsável pela perícia.');
      return;
    }

    setSalvandoCondenacao(true);
    try {
      const res = await fetch(`/api/chamados/${condenarChamado.id}/condenar`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          intervencaoId: condenarIntervencao.id,
          laudoTecnico: condenarLaudo.trim(),
          tecnicoNome: condenarTecnicoNome.trim(),
          tecnicoCpf: condenarTecnicoCpf.trim(),
          tecnicoId: condenarTecnicoId || undefined,
          motivoInviabilidade: condenarMotivo,
        }),
      });

      const data = await res.json();
      if (res.ok) {
        alert(data.mensagem || 'Máquina condenada com sucesso! O laudo oficial em PDF está disponível para o demandante.');
        setModalCondenarOpen(false);
        setModalOrcamento(false);
        await abrirDetalheChamado(condenarChamado.id);
        await carregarChamados();
        await carregarEquipamentos();
      } else {
        alert(data.error || 'Erro ao processar condenação do equipamento.');
      }
    } catch (err: any) {
      alert(err.message);
    } finally {
      setSalvandoCondenacao(false);
    }
  };

  // Gerador de PDF Oficial do Laudo de Condenação e Inservibilidade (jsPDF + autoTable)
  const handleGerarPdfLaudoCondenacao = (chamado: any, intervencaoAlvo?: any) => {
    if (!chamado) return;
    const inter = intervencaoAlvo || chamado.intervencoes?.find((i: any) => i.maquinaCondenada) || chamado.intervencoes?.[0];
    const eq = inter?.equipamento;

    const doc = new jsPDF('portrait', 'mm', 'a4');
    const pageWidth = doc.internal.pageSize.getWidth(); // 210mm
    const margin = 14;

    // Cabeçalho Institucional UERN / PROAD
    doc.setFillColor(0, 34, 68); // Azul UERN Oficial
    doc.rect(margin, 12, pageWidth - margin * 2, 2.5, 'F');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.setTextColor(0, 34, 68);
    doc.text('UNIVERSIDADE DO ESTADO DO RIO GRANDE DO NORTE - UERN', margin, 20);

    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(60, 60, 60);
    doc.text('PRÓ-REITORIA DE ADMINISTRAÇÃO - PROAD • DIRETORIA DE INFRAESTRUTURA E CONTRATOS', margin, 25);
    doc.text('SIG-CLIMA • SISTEMA INTEGRADO DE GESTÃO DA CLIMATIZAÇÃO E REFRIGERAÇÃO', margin, 29);

    doc.setDrawColor(200, 200, 200);
    doc.line(margin, 32, pageWidth - margin, 32);

    // Faixa de Título do Laudo Pericial (Destaque em Vermelho/Vinho Técnico de Condenação)
    doc.setFillColor(153, 27, 27); // Vermelho escuro/bordeaux
    doc.roundedRect(margin, 35, pageWidth - margin * 2, 14, 2, 2, 'F');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.setTextColor(255, 255, 255);
    doc.text('LAUDO TÉCNICO PERICIAL DE CONDENAÇÃO E INSERVIBILIDADE', pageWidth / 2, 41, { align: 'center' });
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.text('ATESTADO DE INVIABILIDADE TÉCNICO-ECONÔMICA DE RECUPERAÇÃO DO BEM PATRIMONIAL', pageWidth / 2, 46, { align: 'center' });

    // Tabela 1: Metadados do Atendimento e Contrato
    autoTable(doc, {
      startY: 52,
      margin: { left: margin, right: margin },
      theme: 'grid',
      headStyles: { fillColor: [0, 34, 68], textColor: 255, fontSize: 8, fontStyle: 'bold' },
      bodyStyles: { fontSize: 8, textColor: 30 },
      head: [['DADOS DO CHAMADO E CONTRATO ADMINISTRATIVO', 'VALORES / IDENTIFICAÇÃO']],
      body: [
        ['Protocolo do Chamado:', chamado.numeroProtocolo || 'N/A'],
        ['Contrato Administrativo:', `${contratoData?.contrato?.numeroContrato || 'Contrato nº 11/2026'} (Processo SEI Mãe: ${contratoData?.contrato?.processoSeiMae || '23077.014298/2025-11'})`],
        ['Empresa Prestadora Credenciada:', `${contratoData?.contrato?.empresa?.razaoSocial || 'L O DOS SANTOS ECOMSER'} (CNPJ: ${contratoData?.contrato?.empresa?.cnpj || '34.802.730/0001-08'})`],
        ['Unidade Solicitante / Campus:', `${chamado.unidade?.sigla || 'UERN'} - Campus ${chamado.unidade?.campus || 'Central'}`],
        ['Servidor Demandante:', `${chamado.demandante?.nome || 'Servidor Demandante'} (Matrícula: ${chamado.demandante?.matricula || '-'})`],
        ['Local de Instalação Física:', eq?.localizacao || 'Setor da Unidade'],
        ['Data da Vistoria / Perícia:', new Date(chamado.atualizadoEm || chamado.criadoEm).toLocaleDateString('pt-BR')],
      ],
      columnStyles: {
        0: { cellWidth: 65, fontStyle: 'bold', fillColor: [245, 247, 250] },
        1: { cellWidth: 'auto' },
      },
    });

    // Tabela 2: Especificações Técnicas do Equipamento Periciado
    let currentY = (doc as any).lastAutoTable.finalY + 4;
    autoTable(doc, {
      startY: currentY,
      margin: { left: margin, right: margin },
      theme: 'grid',
      headStyles: { fillColor: [0, 34, 68], textColor: 255, fontSize: 8, fontStyle: 'bold' },
      bodyStyles: { fontSize: 8, textColor: 30 },
      head: [['ESPECIFICAÇÃO DO BEM PATRIMONIAL AVALIADO', 'DADOS TÉCNICOS CADASTRADOS']],
      body: [
        ['Patrimônio / Tombo UERN:', eq?.tombo ? `${eq.tombo}` : 'N/A'],
        ['Tipo de Equipamento:', eq?.tipo?.replace(/_/g, ' ') || 'AR CONDICIONADO'],
        ['Marca / Fabricante:', eq?.marca || 'N/A'],
        ['Modelo Comercial / Chassi:', eq?.modelo || 'Não especificado'],
        ['Capacidade Térmica / Volumétrica:', eq?.btus ? `${eq.btus.toLocaleString('pt-BR')} BTUs/h` : (eq?.capacidadeLitros ? `${eq.capacidadeLitros} Litros` : (eq?.litragem ? `${eq.litragem} L` : 'N/A'))],
        ['Fluido Refrigerante:', eq?.gasRefrigerante || 'R-410A'],
        ['Classificação no Inventário:', 'BAIXADO_INSERVIVEL (CONDENADO PARA DESCARTE/SUBSTITUIÇÃO)'],
      ],
      columnStyles: {
        0: { cellWidth: 65, fontStyle: 'bold', fillColor: [245, 247, 250] },
        1: { cellWidth: 'auto' },
      },
    });

    // Seção 3: Diagnóstico Técnico Circunstanciado
    currentY = (doc as any).lastAutoTable.finalY + 6;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.setTextColor(0, 34, 68);
    doc.text('1. DIAGNÓSTICO TÉCNICO CIRCUNSTANCIADO DA INVIABILIDADE:', margin, currentY);

    doc.setFillColor(250, 250, 250);
    doc.setDrawColor(210, 210, 210);

    const laudoTexto = inter?.laudoTecnico ||
      'Durante vistoria in loco realizada pela equipe técnica, constatou-se que o equipamento supramencionado apresenta danos estruturais e mecânicos irreparáveis. O compressor hermético sofreu colapso elétrico interno com curto-circuito na massa estatórica e oxidação avançada por ação de agentes climáticos/salinos, associada a vazamentos irreversíveis nas serpentinas evaporadora e condensadora. O custo acumulado das peças de reposição e da mão de obra necessária para recuperação funcional supera 70% do custo de aquisição de um equipamento novo com tecnologia Inverter e selo Procel A de eficiência energética.';

    const splitLaudo = doc.splitTextToSize(laudoTexto, pageWidth - margin * 2 - 8);
    const boxHeight = Math.max(24, splitLaudo.length * 4.2 + 8);
    doc.roundedRect(margin, currentY + 2, pageWidth - margin * 2, boxHeight, 1.5, 1.5, 'FD');

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(40, 40, 40);
    doc.text(splitLaudo, margin + 4, currentY + 7);

    // Seção 4: Conclusão Pericial
    currentY = currentY + boxHeight + 8;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.setTextColor(0, 34, 68);
    doc.text('2. PARECER CONCLUSIVO E ENQUADRAMENTO TÉCNICO:', margin, currentY);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(50, 50, 50);
    const textoConclusao = 
      'Em observância aos critérios técnicos de engenharia de manutenção e ao Princípio da Economicidade (Art. 140 da Lei Federal nº 14.133/2021), atesta-se a perda funcional e inservibilidade definitiva do equipamento patrimoniado sob o tombo acima qualificado. Declara-se o bem como IRRECUPERÁVEL, sendo expressamente desaconselhada qualquer tentativa de intervenção corretiva ou aporte de recursos públicos, recomendando-se sua baixa patrimonial definitiva e desativação operacional.';
    const splitConclusao = doc.splitTextToSize(textoConclusao, pageWidth - margin * 2);
    doc.text(splitConclusao, margin, currentY + 4.5);

    // Seção 5: Finalidade Exclusiva para Processo SEI / PROAD
    currentY = currentY + 4.5 + splitConclusao.length * 3.8 + 4;
    doc.setFillColor(254, 243, 199); // Amarelo/âmbar claro de aviso
    doc.setDrawColor(245, 158, 11);
    doc.roundedRect(margin, currentY, pageWidth - margin * 2, 14, 1.5, 1.5, 'FD');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.5);
    doc.setTextColor(146, 64, 14);
    doc.text('FINALIDADE EXCLUSIVA PARA INSTRUÇÃO DE PROCESSO SEI / PROAD:', margin + 4, currentY + 4.5);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(120, 53, 15);
    const textoSei = 'O presente documento oficial destina-se a subsidiar o processo administrativo instruído pelo demandante junto à Pró-Reitoria de Administração (PROAD/UERN) via Sistema Eletrônico de Informações (SEI), comprovando a inservibilidade do bem para fundamentar a aquisição e fornecimento de novo aparelho substituto.';
    doc.text(doc.splitTextToSize(textoSei, pageWidth - margin * 2 - 8), margin + 4, currentY + 8.5);

    // Seção 6: Identificação e Assinatura do Responsável Técnico
    currentY = currentY + 22;
    const colW = (pageWidth - margin * 2 - 10) / 2;

    // Assinatura Técnico Empresa
    doc.setDrawColor(180, 180, 180);
    doc.line(margin, currentY + 12, margin + colW, currentY + 12);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(0, 34, 68);
    const tecNome = inter?.nomeTecnicoEmpresa || currentUser?.nome || 'Técnico Especialista em Refrigeração';
    const tecCpf = inter?.cpfTecnicoEmpresa || currentUser?.cpf || '000.000.000-00';
    doc.text(tecNome, margin, currentY + 16);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    doc.setTextColor(80, 80, 80);
    doc.text(`Técnico Responsável • CPF: ${tecCpf}`, margin, currentY + 20);
    doc.text(`Empresa Contratada: ${contratoData?.contrato?.empresa?.razaoSocial || 'L O DOS SANTOS ECOMSER'}`, margin, currentY + 23.5);
    doc.text('Assinatura Eletrônica Certificada via SIG-CLIMA UERN', margin, currentY + 27);

    // Assinatura Fiscal Técnico UERN
    doc.line(margin + colW + 10, currentY + 12, pageWidth - margin, currentY + 12);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(0, 34, 68);
    const fiscalNome = usuariosData?.equipeSgc?.find((r: any) => r.tipoAtuacao === 'FISCAL_TECNICO')?.nome || 'José Luiz de Melo Júnior';
    const fiscalMat = usuariosData?.equipeSgc?.find((r: any) => r.tipoAtuacao === 'FISCAL_TECNICO')?.matricula || '13944-7';
    doc.text(fiscalNome, margin + colW + 10, currentY + 16);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    doc.setTextColor(80, 80, 80);
    doc.text(`Fiscal Técnico do Contrato • Matrícula UERN: ${fiscalMat}`, margin + colW + 10, currentY + 20);
    doc.text('Divisão de Engenharia e Manutenção Predial / PROAD', margin + colW + 10, currentY + 23.5);
    doc.text('Visto de Ciência Administrativa e Homologação', margin + colW + 10, currentY + 27);

    // Rodapé de Autenticidade Digital
    doc.setDrawColor(220, 220, 220);
    doc.line(margin, 280, pageWidth - margin, 280);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    doc.setTextColor(120, 120, 120);
    const hashAutenticidade = `SHA256-${chamado.id.replace(/-/g, '').slice(0, 16).toUpperCase()}-${new Date().getFullYear()}`;
    doc.text(`Documento emitido eletronicamente em ${new Date().toLocaleString('pt-BR')} pelo SIG-CLIMA UERN • Código de Autenticidade: ${hashAutenticidade}`, margin, 284);
    doc.text(`Protocolo: ${chamado.numeroProtocolo} • Tombo Avaliado: ${eq?.tombo || 'S/N'} • Página 1 de 1`, margin, 288);

    doc.save(`Laudo_Tecnico_Condenacao_Tombo_${eq?.tombo || 'MAQUINA'}_${chamado.numeroProtocolo}.pdf`);
  };

  // ==============================================================
  // ROTINAS DO FLUXO OFICIAL: AUTORIZAÇÃO, LAUDO E PARECER DA SOBE
  // ==============================================================

  // Passo 2: Fiscal Autoriza Chamado para a Contratada
  const handleAutorizarChamado = async (chId: string) => {
    try {
      setSalvandoLaudoAcao(true);
      const res = await fetch(`/api/chamados/${chId}/laudo`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          acao: 'AUTORIZAR_CHAMADO',
          fiscalNome: currentUser?.nome || 'Fiscal Técnico UERN',
        }),
      });

      if (res.ok) {
        alert('Chamado autorizado com sucesso pela Fiscalização e encaminhado para a Contratada!');
        if (chamadoDetalhe?.id === chId) abrirDetalheChamado(chId);
        carregarChamados();
      } else {
        const err = await res.json();
        alert(err.error || 'Erro ao autorizar chamado.');
      }
    } catch (e: any) {
      alert(e.message);
    } finally {
      setSalvandoLaudoAcao(false);
    }
  };

  // Passo 4: Contratada Inicia Execução Direta (Sem necessidade de aprovação)
  const handleExecutarDireto = async (chId: string) => {
    try {
      setSalvandoLaudoAcao(true);
      const res = await fetch(`/api/chamados/${chId}/laudo`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          acao: 'EXECUTAR_DIRETO',
          tecnicoNome: currentUser?.nome || 'Empresa Prestadora',
        }),
      });

      if (res.ok) {
        alert('Execução direta iniciada com sucesso pela Contratada!');
        if (chamadoDetalhe?.id === chId) abrirDetalheChamado(chId);
        carregarChamados();
      } else {
        const err = await res.json();
        alert(err.error || 'Erro ao iniciar execução direta.');
      }
    } catch (e: any) {
      alert(e.message);
    } finally {
      setSalvandoLaudoAcao(false);
    }
  };

  // Passos 4 e 6: Contratada Elabora e Submete Laudo Técnico Preliminar
  const handleSubmeterLaudoEmpresa = async () => {
    if (!chamadoDetalhe) return;
    if (!laudoEmpresaTexto.trim()) {
      alert('Informe o laudo técnico preliminar com o diagnóstico do equipamento.');
      return;
    }

    try {
      setSalvandoLaudoAcao(true);
      const res = await fetch(`/api/chamados/${chamadoDetalhe.id}/laudo`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          acao: 'SUBMETER_LAUDO',
          motivoRequerAprovacao: laudoEmpresaMotivo,
          laudoTexto: laudoEmpresaTexto,
          custoEstimado: laudoEmpresaCusto,
          tecnicoNome: laudoEmpresaTecnico || currentUser?.nome || 'Técnico da Contratada',
        }),
      });

      if (res.ok) {
        alert('Laudo técnico enviado com sucesso para análise da Fiscalização Técnica!');
        setModalLaudoEmpresa(false);
        setLaudoEmpresaTexto('');
        setLaudoEmpresaCusto('');
        abrirDetalheChamado(chamadoDetalhe.id);
        carregarChamados();
      } else {
        const err = await res.json();
        alert(err.error || 'Erro ao submeter laudo técnico.');
      }
    } catch (e: any) {
      alert(e.message);
    } finally {
      setSalvandoLaudoAcao(false);
    }
  };

  // Passo 8 (Sim): Fiscal Aprova Laudo e Libera Execução (Passo 5)
  const handleAprovarLaudoFiscal = async () => {
    if (!chamadoDetalhe) return;
    if (!confirm('Deseja aprovar o laudo técnico e autorizar a execução do serviço pela contratada?')) return;

    try {
      setSalvandoLaudoAcao(true);
      const res = await fetch(`/api/chamados/${chamadoDetalhe.id}/laudo`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          acao: 'APROVAR_LAUDO',
          fiscalNome: currentUser?.nome || 'Fiscal Técnico UERN',
        }),
      });

      if (res.ok) {
        alert('Laudo técnico aprovado com sucesso! Execução liberada para a Contratada.');
        abrirDetalheChamado(chamadoDetalhe.id);
        carregarChamados();
      } else {
        const err = await res.json();
        alert(err.error || 'Erro ao aprovar laudo.');
      }
    } catch (e: any) {
      alert(e.message);
    } finally {
      setSalvandoLaudoAcao(false);
    }
  };

  // Passo 8 (Não): Fiscal Reprova Laudo e Encerra Chamado (Passo 10)
  const handleReprovarLaudoFiscal = async () => {
    if (!chamadoDetalhe) return;
    if (!reprovarLaudoMotivo.trim()) {
      alert('Informe a justificativa técnica para a reprovação do laudo.');
      return;
    }

    try {
      setSalvandoLaudoAcao(true);
      const res = await fetch(`/api/chamados/${chamadoDetalhe.id}/laudo`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          acao: 'REJEITAR_LAUDO',
          fiscalNome: currentUser?.nome || 'Fiscal Técnico UERN',
          motivoRejeicao: reprovarLaudoMotivo,
        }),
      });

      if (res.ok) {
        alert('Laudo reprovado e chamado encerrado pela fiscalização com sucesso.');
        setModalReprovarLaudo(false);
        setReprovarLaudoMotivo('');
        abrirDetalheChamado(chamadoDetalhe.id);
        carregarChamados();
      } else {
        const err = await res.json();
        alert(err.error || 'Erro ao reprovar laudo.');
      }
    } catch (e: any) {
      alert(e.message);
    } finally {
      setSalvandoLaudoAcao(false);
    }
  };

  // Passo 8 (Dúvida -> Passo 9): Fiscal Despacha para Engenharia (SOBE)
  const handleDespacharSobe = async () => {
    if (!chamadoDetalhe) return;
    if (!despachoSobeDuvida.trim()) {
      alert('Informe os quesitos ou a dúvida técnica para a Superintendência de Obras e Engenharia.');
      return;
    }

    try {
      setSalvandoLaudoAcao(true);
      const res = await fetch(`/api/chamados/${chamadoDetalhe.id}/laudo`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          acao: 'DESPACHAR_SOBE',
          fiscalNome: currentUser?.nome || 'Fiscal Técnico UERN',
          duvidaEngenharia: despachoSobeDuvida,
        }),
      });

      if (res.ok) {
        alert('Chamado despachado com sucesso para parecer da Superintendência de Obras e Engenharia (SOBE)!');
        setModalDespachoSobe(false);
        setDespachoSobeDuvida('');
        abrirDetalheChamado(chamadoDetalhe.id);
        carregarChamados();
      } else {
        const err = await res.json();
        alert(err.error || 'Erro ao despachar para a Engenharia.');
      }
    } catch (e: any) {
      alert(e.message);
    } finally {
      setSalvandoLaudoAcao(false);
    }
  };

  // Passos 11 e 12: Engenharia SOBE Elabora e Encaminha Parecer de Volta ao Fiscal
  const handleEmitirParecerSobe = async () => {
    if (!chamadoDetalhe) return;
    if (!parecerSobeTexto.trim()) {
      alert('Informe a fundamentação técnica e o teor do parecer da SOBE.');
      return;
    }

    try {
      setSalvandoLaudoAcao(true);
      const res = await fetch(`/api/chamados/${chamadoDetalhe.id}/laudo`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          acao: 'EMITIR_PARECER_SOBE',
          parecerTexto: parecerSobeTexto,
          parecerFavoravel: parecerSobeFavoravel,
          engenheiroNome: parecerSobeEngenheiro || currentUser?.nome || 'Engenheiro SOBE',
          engenheiroMatricula: parecerSobeMatricula || currentUser?.matricula || '',
        }),
      });

      if (res.ok) {
        alert('Parecer da SOBE emitido e encaminhado com sucesso de volta para a Fiscalização Técnica!');
        setModalParecerSobe(false);
        setParecerSobeTexto('');
        abrirDetalheChamado(chamadoDetalhe.id);
        carregarChamados();
      } else {
        const err = await res.json();
        alert(err.error || 'Erro ao emitir parecer da SOBE.');
      }
    } catch (e: any) {
      alert(e.message);
    } finally {
      setSalvandoLaudoAcao(false);
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
          tecnicoNome: execucaoTecnicoNome || currentUser?.nome || 'Técnico Autorizado',
          tecnicoCpf: execucaoTecnicoCpf || currentUser?.cpf || '000.000.000-00',
          tecnicoId: execucaoTecnicoId || currentUser?.id,
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

      // Ambiente da Unidade (Existente ou On-the-Fly)
      if (modoAmbiente === 'EXISTENTE' && ambienteSelecionadoId) {
        payload.ambienteId = ambienteSelecionadoId;
      } else if (modoAmbiente === 'NOVO_ON_THE_FLY' && novoAmbienteDetalhe.trim()) {
        payload.novoAmbienteTipo = novoAmbienteTipo;
        payload.novoAmbienteDetalhe = novoAmbienteDetalhe.trim();
        payload.novoAmbienteBloco = novoAmbienteBloco.trim() || undefined;
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
      setNovoAmbienteDetalhe('');
      setNovoAmbienteBloco('');
      setNovoAmbienteTipo('SALA_DE_AULA');
      setActiveTab('chamados');
      carregarChamados();
      carregarEquipamentos();
      if (currentUser?.unidadeId) carregarAmbientes(currentUser.unidadeId);
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
    const cidadesTexto = faturamentoData.cidadesDisponiveis?.length > 0
      ? ` • Cidades: ${faturamentoData.cidadesDisponiveis.join(', ')}`
      : '';
    doc.text(`Resumo do Faturamento: ${faturamentoData.resumo?.totalChamados} Chamados • ${faturamentoData.resumo?.totalMaquinas} Máquinas Atendidas • Valor Total Medido: R$ ${faturamentoData.resumo?.valorTotalMedido?.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}${cidadesTexto}`, 14, 46);

    // Tabela Máquina por Máquina
    const rows = faturamentoData.listaMaquinas.map((item: any, idx: number) => [
      String(idx + 1).padStart(2, '0'),
      item.tombo,
      `${item.cidade || 'Mossoró'} • ${item.unidadeSigla}\n${item.ambienteNome || item.localizacao}${item.isPrioritario ? ' [PRIORITÁRIO]' : ''}`,
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
          'Cidade / Unidade / Ambiente',
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
      {/* Banner de Ambiente de Treinamento e Capacitação (Condicional via Env/URL/Contrato) */}
      <BannerTreinamento
        currentUser={currentUser}
        contratoNumero={contratoData?.contrato?.numeroContrato}
        onUsuarioAlterado={carregarUsuario}
      />

      {/* Top Navbar */}
      <Navbar currentUser={currentUser} onRoleSwitched={carregarUsuario} />

      <main className="flex-1 max-w-7xl mx-auto w-full px-6 py-6 space-y-6">
        {/* Banner de Topo com Saldo Contratual e Auto-Discovery SGC */}
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-blue-950 via-[#002244] to-slate-900 border border-blue-500/30 p-6 shadow-xl">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative z-10">
            <div>
              <div className="flex flex-wrap items-center gap-2 mb-2">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-cyan-500/15 border border-cyan-400/30 text-cyan-300 text-xs font-semibold">
                  <Sparkles className="w-3.5 h-3.5 text-cyan-400" /> Sincronizado com SGC • Contrato Ativo
                </span>
                <button
                  type="button"
                  onClick={handleSincronizarSgc}
                  disabled={sincronizandoSgc}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-800/90 hover:bg-slate-800 border border-white/20 text-[11px] text-slate-200 transition shadow-sm"
                  title="Puxar dados atualizados do contrato e itens do SGC"
                >
                  <RefreshCw className={`w-3 h-3 ${sincronizandoSgc ? 'animate-spin text-cyan-400' : 'text-slate-400'}`} />
                  <span>{sincronizandoSgc ? 'Sincronizando com SGC...' : 'Sincronizar com SGC'}</span>
                </button>
              </div>

              {mensagemSgc && (
                <div className="mb-2 p-2 rounded-xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-xs flex items-center gap-2 animate-in fade-in">
                  <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
                  <span>{mensagemSgc}</span>
                </div>
              )}

              <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight flex items-center gap-2">
                <span>
                  {contratoData?.contrato?.numeroContrato
                    ? (contratoData.contrato.numeroContrato.startsWith('Contrato') ? contratoData.contrato.numeroContrato : `Contrato nº ${contratoData.contrato.numeroContrato}`)
                    : 'Contrato nº 11/2026'}
                </span>
                {contratoData?.contrato?.vigenciaFim && (
                  <span className="text-xs bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-2 py-0.5 rounded font-normal">
                    Vigente até {new Date(contratoData.contrato.vigenciaFim).toLocaleDateString('pt-BR')}
                  </span>
                )}
              </h2>
              <p className="text-xs text-slate-300 mt-1">
                Empresa Contratada:{' '}
                <strong className="text-amber-300">
                  {contratoData?.contrato?.empresa?.razaoSocial || 'L O DOS SANTOS ECOMSER'}
                </strong>{' '}
                {contratoData?.contrato?.empresa?.cnpj && (
                  <span className="text-slate-400 font-mono text-[11px] ml-1">
                    (CNPJ: {contratoData.contrato.empresa.cnpj})
                  </span>
                )}
                {contratoData?.contrato?.processoSeiMae && (
                  <span> • Processo SEI: <strong className="text-slate-200">{contratoData.contrato.processoSeiMae}</strong></span>
                )}
                {contratoData?.contrato?.itensPreco?.length > 0 && (
                  <span className="ml-2 text-cyan-300 font-medium">({contratoData.contrato.itensPreco.length} itens da planilha oficial)</span>
                )}
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
              <div className="flex justify-between items-center text-[11px] text-slate-400">
                <button
                  type="button"
                  onClick={() => setModalExtratoConsumoOpen(true)}
                  className="hover:text-cyan-300 transition text-left flex items-center gap-1.5 group bg-slate-950/60 hover:bg-slate-800 px-2 py-0.5 rounded-lg border border-white/10"
                  title="Clique para ver o extrato detalhado de todos os chamados que compõem este valor"
                >
                  <span>Consumido: <strong className="text-white group-hover:underline">R$ {contratoData?.contrato?.totalConsumido?.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</strong></span>
                  <span className="text-[10px] bg-cyan-500/20 text-cyan-300 px-1.5 py-0.2 rounded font-bold border border-cyan-500/30">
                    Ver Extrato
                  </span>
                </button>
                <span>Global: R$ {contratoData?.contrato?.valorGlobal?.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
              </div>

              <div className="flex items-center justify-between text-[11px] text-slate-400 mt-2.5 pt-2 border-t border-white/10">
                <div className="flex items-center gap-1.5">
                  <Zap className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                  <span>Auto-Aprovação:</span>
                  <strong className="text-amber-300 font-mono font-bold">
                    Até R$ {Number(contratoData?.contrato?.limiteAprovacaoAutomatica || 1000).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </strong>
                </div>
                {currentUser?.role === 'ADMIN' && (
                  <button
                    type="button"
                    onClick={() => setActiveTab('usuarios')}
                    className="text-cyan-400 hover:text-cyan-300 text-[10px] font-bold flex items-center gap-0.5 ml-2 hover:underline"
                    title="Configurar teto de aprovação automática"
                  >
                    <span>Alterar</span>
                    <ChevronRight className="w-3 h-3" />
                  </button>
                )}
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
              onClick={() => setActiveTab('ambientes')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
                activeTab === 'ambientes'
                  ? 'bg-blue-500 text-white shadow-md'
                  : 'bg-slate-900 hover:bg-slate-800 text-slate-300 border border-white/10'
              }`}
            >
              <Building2 className="w-4 h-4" />
              <span>Ambientes & Espaços ({ambientes.length})</span>
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

            {currentUser?.role === 'ADMIN' && (
              <>
                <button
                  type="button"
                  onClick={() => setActiveTab('usuarios')}
                  className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
                    activeTab === 'usuarios'
                      ? 'bg-purple-500 text-white shadow-md'
                      : 'bg-slate-900 hover:bg-slate-800 text-slate-300 border border-white/10'
                  }`}
                >
                  <Users className="w-4 h-4" />
                  <span>Gestão de Usuários</span>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveTab('parametros')}
                  className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
                    activeTab === 'parametros'
                      ? 'bg-amber-500 text-slate-950 shadow-md font-black'
                      : 'bg-slate-900 hover:bg-slate-800 text-slate-300 border border-white/10'
                  }`}
                >
                  <Sliders className="w-4 h-4" />
                  <span>Parâmetros do Contrato</span>
                </button>
              </>
            )}
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

              <div className="flex flex-wrap items-center gap-2">
                <span className="text-xs text-slate-400">Filtrar:</span>
                <select
                  value={statusFiltro}
                  onChange={(e) => setStatusFiltro(e.target.value)}
                  className="bg-slate-950 border border-white/10 rounded-lg px-2.5 py-1.5 text-xs text-white outline-none cursor-pointer"
                >
                  <option value="TODOS">Todos os Status</option>
                  <option value="ABERTO">Aberto / Em Triagem</option>
                  <option value="AGUARDANDO_ANALISE_LAUDO">Laudo em Análise (Fiscal Técnico)</option>
                  <option value="ENCAMINHADO_ENGENHARIA">Encaminhado para Engenharia (SOBE)</option>
                  <option value="PARECER_ENGENHARIA_EMITIDO">Parecer SOBE Emitido</option>
                  <option value="APROVADO_EM_EXECUCAO">Em Execução</option>
                  <option value="AGUARDANDO_CONFIRMACAO">Aguardando Ateste do Demandante</option>
                  <option value="ORCAMENTO_ANEXADO">Aguardando Aprovação Orçamento SGC</option>
                  <option value="FINALIZADO">Finalizado</option>
                </select>

                <select
                  value={cidadeFiltroChamados}
                  onChange={(e) => setCidadeFiltroChamados(e.target.value)}
                  className="bg-slate-950 border border-white/10 rounded-lg px-2.5 py-1.5 text-xs text-white outline-none cursor-pointer"
                >
                  <option value="TODOS">Todas as Cidades</option>
                  {cidadesList.map((cid) => (
                    <option key={cid} value={cid}>
                      {cid}
                    </option>
                  ))}
                </select>

                <button
                  type="button"
                  onClick={() => setApenasPrioritariosFiltro(!apenasPrioritariosFiltro)}
                  className={`text-xs px-2.5 py-1.5 rounded-lg font-bold border transition flex items-center gap-1.5 ${
                    apenasPrioritariosFiltro
                      ? 'bg-amber-500 text-slate-950 border-amber-400 shadow font-black'
                      : 'bg-slate-950 text-slate-300 border-white/10 hover:text-white'
                  }`}
                  title="Filtra apenas chamados em Salas de Aula, Labs Ininterruptos e Salas de Estudos"
                >
                  <Zap className="w-3.5 h-3.5" />
                  <span>⭐ Prioritários ({chamados.filter(c => c.isAmbientePrioritario).length})</span>
                </button>
              </div>
            </div>

            {/* Cards dos Chamados */}
            <div className="grid grid-cols-1 gap-4">
              {chamados.map((ch) => (
                <div
                  key={ch.id}
                  className={`rounded-2xl p-5 transition shadow-lg space-y-4 border ${
                    ch.isAmbientePrioritario
                      ? 'bg-gradient-to-r from-amber-950/20 via-slate-900/90 to-slate-900 border-amber-500/40 hover:border-amber-400'
                      : 'bg-slate-900/80 border-white/10 hover:border-cyan-500/40'
                  }`}
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-white/10 pb-3">
                    <div className="flex items-center gap-2.5 flex-wrap">
                      <span className="text-sm font-black text-white">{ch.numeroProtocolo}</span>
                      <span className="text-xs px-2.5 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-white/10">
                        {ch.unidade?.sigla} • {ch.unidade?.cidade || ch.unidade?.campus}
                      </span>
                      {ch.ambiente && (
                        <span className="text-xs px-2.5 py-0.5 rounded-full bg-cyan-950/60 text-cyan-300 border border-cyan-500/30 flex items-center gap-1">
                          <Building2 className="w-3 h-3 text-cyan-400" />
                          <span>{ch.ambiente.descricaoDetalhe}</span>
                        </span>
                      )}
                      {ch.isAmbientePrioritario && (
                        <span className="text-[10px] px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40 font-black tracking-wide flex items-center gap-1">
                          <Zap className="w-3 h-3 text-amber-400" /> PRIORIDADE CONTRATUAL ({formatTipoAmbiente(ch.tipoAmbiente || ch.ambiente?.tipo)})
                        </span>
                      )}
                      {ch.intervencoes?.some((i: any) => i.emGarantia) && (
                        <span className="text-[11px] px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 font-bold flex items-center gap-1">
                          <ShieldCheck className="w-3 h-3" /> Em Garantia (R$ 0,00)
                        </span>
                      )}
                      {ch.intervencoes?.some((i: any) => i.maquinaCondenada) && (
                        <span className="text-[11px] px-2.5 py-0.5 rounded bg-red-500/20 text-red-300 border border-red-500/50 font-bold flex items-center gap-1">
                          <AlertTriangle className="w-3 h-3 text-red-400" /> Máquina Condenada (Inservível)
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
                      <span>2. Triagem / Laudo</span>
                      <span>3. Parecer SOBE / Aprovação</span>
                      <span>4. Execução</span>
                      <span>5. Ateste / Fechamento</span>
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
                  <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-white/10">
                    <div className="text-xs text-slate-400">
                      Demandante: <span className="text-slate-200">{ch.demandante?.nome}</span>
                    </div>

                    <div className="flex items-center gap-2">
                      {currentUser?.role === 'ADMIN' && (
                        <>
                          <button
                            type="button"
                            onClick={() => handleAbrirEdicaoChamado(ch)}
                            className="px-2.5 py-1.5 rounded-xl bg-purple-500/20 hover:bg-purple-500/30 border border-purple-500/40 text-purple-300 font-bold text-xs flex items-center gap-1 transition shadow-sm"
                            title="Editar este chamado (Admin)"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                            <span>Editar</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => handleExcluirChamado(ch.id, ch.numeroProtocolo)}
                            className="px-2.5 py-1.5 rounded-xl bg-red-500/20 hover:bg-red-500/30 border border-red-500/40 text-red-300 font-bold text-xs flex items-center gap-1 transition shadow-sm"
                            title="Excluir este chamado (Admin)"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                            <span>Excluir</span>
                          </button>
                        </>
                      )}

                      {ch.intervencoes?.some((i: any) => i.maquinaCondenada) && (
                        <button
                          type="button"
                          onClick={() => handleGerarPdfLaudoCondenacao(ch, ch.intervencoes.find((i: any) => i.maquinaCondenada))}
                          className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-red-600/30 to-amber-600/30 hover:from-red-600/40 hover:to-amber-600/40 border border-red-500/50 text-red-200 font-bold text-xs flex items-center gap-1.5 transition shadow-sm"
                          title="Baixar Laudo Técnico Oficial de Condenação em PDF para processo na PROAD/SEI"
                        >
                          <FileText className="w-3.5 h-3.5 text-red-400" />
                          <span>Baixar Laudo (PDF)</span>
                        </button>
                      )}

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
                        onChange={(e) => {
                          const id = e.target.value;
                          setEquipamentoSelecionadoId(id);
                          const eq = equipamentos.find((item) => item.id === id);
                          if (eq?.ambienteId) {
                            setAmbienteSelecionadoId(eq.ambienteId);
                            setModoAmbiente('EXISTENTE');
                          }
                        }}
                        className="w-full bg-slate-900 border border-white/15 rounded-xl px-3.5 py-2.5 text-xs text-white outline-none cursor-pointer"
                      >
                        <option value="">Selecione o equipamento da sua unidade...</option>
                        {equipamentos.map((eq) => (
                          <option key={eq.id} value={eq.id} disabled={eq.possuiChamadoAtivo}>
                            Tombo {eq.tombo} • {eq.marca} {eq.modelo || ''} ({eq.ambiente?.descricaoDetalhe || eq.localizacao}){' '}
                            {eq.possuiChamadoAtivo ? '[CHAMADO ATIVO]' : ''}{' '}
                            {eq.emGarantia ? '[GARANTIA ATIVA]' : ''}
                          </option>
                        ))}
                      </select>

                      {equipamentoSelecionadoId && (() => {
                        const eq = equipamentos.find((item) => item.id === equipamentoSelecionadoId);
                        if (eq?.ambiente) {
                          const isPrioritario = ['SALA_DE_AULA', 'LABORATORIO_PESQUISA_ININTERRUPTO', 'SALA_ESTUDOS_BIBLIOTECA'].includes(eq.ambiente.tipo);
                          return (
                            <div className="mt-2.5 p-3 rounded-xl bg-cyan-950/70 border border-cyan-500/40 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-2 animate-in fade-in">
                              <span className="text-cyan-300 font-semibold flex items-center gap-1.5">
                                <Building2 className="w-4 h-4 text-cyan-400 shrink-0" />
                                <span>Espaço Vinculado: <strong>{eq.ambiente.descricaoDetalhe}</strong> ({formatTipoAmbiente(eq.ambiente.tipo)})</span>
                              </span>
                              <div className="flex items-center gap-1.5">
                                {isPrioritario && (
                                  <span className="text-[10px] text-red-300 bg-red-600/30 border border-red-500/50 px-2 py-0.5 rounded-full font-black uppercase">
                                    🚨 Prioridade Contratual
                                  </span>
                                )}
                                <span className="text-[10px] text-emerald-400 font-bold bg-emerald-500/20 px-2 py-0.5 rounded-full">
                                  ✓ Vinculado Automaticamente
                                </span>
                              </div>
                            </div>
                          );
                        }
                        return null;
                      })()}
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

              {/* SELEÇÃO OU CADASTRO DE AMBIENTE DA UNIDADE (COM PRIORIZAÇÃO CONTRATUAL) */}
              <div className="space-y-3 p-4 rounded-xl bg-slate-950/80 border border-white/10">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <span className="text-xs font-bold text-white flex items-center gap-1.5">
                      <Building2 className="w-3.5 h-3.5 text-cyan-400" />
                      <span>Local / Ambiente da Instalação (Priorização Contratual):</span>
                    </span>
                    <span className="text-[11px] text-slate-400 block mt-0.5">
                      Salas de aula, laboratórios ininterruptos e salas de estudos recebem prioridade máxima da contratada.
                    </span>
                  </div>

                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setModoAmbiente('EXISTENTE')}
                      className={`text-[11px] px-2.5 py-1 rounded-lg font-bold border transition ${
                        modoAmbiente === 'EXISTENTE'
                          ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40'
                          : 'text-slate-400 border-white/10'
                      }`}
                    >
                      Ambiente já cadastrado
                    </button>
                    <button
                      type="button"
                      onClick={() => setModoAmbiente('NOVO_ON_THE_FLY')}
                      className={`text-[11px] px-2.5 py-1 rounded-lg font-bold border transition ${
                        modoAmbiente === 'NOVO_ON_THE_FLY'
                          ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                          : 'text-slate-400 border-white/10'
                      }`}
                    >
                      + Cadastrar Novo Ambiente
                    </button>
                  </div>
                </div>

                {modoAmbiente === 'EXISTENTE' ? (
                  <div>
                    <select
                      value={ambienteSelecionadoId}
                      onChange={(e) => setAmbienteSelecionadoId(e.target.value)}
                      className="w-full bg-slate-900 border border-white/15 rounded-xl px-3.5 py-2.5 text-xs text-white outline-none cursor-pointer"
                    >
                      <option value="">Selecione o ambiente da sua unidade...</option>
                      {ambientes.map((amb) => (
                        <option key={amb.id} value={amb.id}>
                          {amb.descricaoDetalhe} ({formatTipoAmbiente(amb.tipo)}){' '}
                          {amb.isPrioritario ? '⭐ [PRIORITÁRIO]' : ''}
                        </option>
                      ))}
                    </select>
                    {ambientes.length === 0 && (
                      <span className="text-[11px] text-slate-400 mt-1 block">
                        Nenhum ambiente cadastrado nesta unidade ainda. Selecione "+ Cadastrar Novo Ambiente" ao lado para cadastrar o primeiro.
                      </span>
                    )}
                  </div>
                ) : (
                  <div className="space-y-3 pt-2 border-t border-white/10">
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div>
                        <label className="block text-[11px] text-slate-400 mb-1">
                          Tipo de Local / Ambiente <span className="text-red-400">*</span>
                        </label>
                        <select
                          value={novoAmbienteTipo}
                          onChange={(e) => setNovoAmbienteTipo(e.target.value)}
                          className="w-full bg-slate-900 border border-white/15 rounded-lg px-2.5 py-2 text-xs text-white outline-none"
                        >
                          <option value="SALA_DE_AULA">Sala de Aula ⭐ (Prioritário)</option>
                          <option value="LABORATORIO_PESQUISA_ININTERRUPTO">Lab. de Pesquisa Ininterrupto ⭐ (Prioritário)</option>
                          <option value="SALA_ESTUDOS_BIBLIOTECA">Sala de Estudos de Biblioteca ⭐ (Prioritário)</option>
                          <option value="LABORATORIOS_DIVERSOS">Laboratórios Diversos</option>
                          <option value="OUTRAS_SALAS_USO_ACADEMICO">Outras Salas de Uso Acadêmico</option>
                          <option value="AUDITORIO">Auditório</option>
                          <option value="SALA_ADMINISTRATIVA">Sala Administrativa</option>
                          <option value="CORREDOR_PATIO">Corredor / Pátio</option>
                        </select>
                      </div>

                      <div className="sm:col-span-2">
                        <label className="block text-[11px] text-slate-400 mb-1">
                          Identificação / Nome da Sala <span className="text-red-400">*</span>
                        </label>
                        <input
                          type="text"
                          placeholder="Ex: Sala de aula 02, Bloco e1 / Lab de Informática 01"
                          value={novoAmbienteDetalhe}
                          onChange={(e) => setNovoAmbienteDetalhe(e.target.value)}
                          className="w-full bg-slate-900 border border-white/15 rounded-lg px-2.5 py-2 text-xs text-white outline-none"
                        />
                      </div>
                    </div>

                    {['SALA_DE_AULA', 'LABORATORIO_PESQUISA_ININTERRUPTO', 'SALA_ESTUDOS_BIBLIOTECA'].includes(novoAmbienteTipo) && (
                      <div className="p-2.5 rounded-xl bg-amber-500/15 border border-amber-500/30 text-amber-300 text-[11px] flex items-center gap-2">
                        <Zap className="w-4 h-4 text-amber-400 shrink-0" />
                        <span>
                          <strong>Ambiente Prioritário Contratual:</strong> A empresa prestadora receberá aviso destacado para priorizar a vistoria e reparo deste ambiente, visando evitar prejuízo acadêmico ou científico.
                        </span>
                      </div>
                    )}
                  </div>
                )}
              </div>

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
        {/* TAB 2.5: AMBIENTES & ESPAÇOS FÍSICOS (GESTÃO UNIDADE & ADMIN)  */}
        {/* ------------------------------------------------------------- */}
        {activeTab === 'ambientes' && (
          <div className="space-y-5 animate-in fade-in">
            {/* Header com Ações Rápidas */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-gradient-to-r from-blue-950 via-slate-900 to-indigo-950 p-6 rounded-2xl border border-blue-500/30 shadow-xl">
              <div>
                <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                  <span className="px-2.5 py-0.5 rounded-full bg-blue-500/20 text-blue-300 border border-blue-500/40 text-xs font-bold flex items-center gap-1">
                    <Building2 className="w-3.5 h-3.5 text-cyan-400" />
                    Catálogo de Ambientes & Máquinas Vinculadas
                  </span>
                  <span className="text-xs text-slate-400 font-medium">
                    {currentUser?.role === 'ADMIN' ? 'Acesso Global de Administrador' : `Unidade: ${currentUser?.unidade?.sigla || 'Minha Unidade'}`}
                  </span>
                </div>
                <h3 className="text-xl font-black text-white">Gestão de Ambientes e Espaços Físicos</h3>
                <p className="text-xs text-slate-300 mt-1 max-w-3xl leading-relaxed">
                  Cadastre as salas de aula, laboratórios ininterruptos, salas de estudo, auditórios e gabinetes da unidade. As máquinas ficam <strong>necessariamente vinculadas ao seu respectivo ambiente</strong>, permitindo que novos chamados herdem automaticamente o local e a prioridade contratual.
                </p>
              </div>

              <div className="flex items-center gap-2.5 shrink-0 flex-wrap">
                <button
                  type="button"
                  onClick={() => handleAbrirNovoAmbiente()}
                  className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-500 hover:to-cyan-400 text-slate-950 font-black text-xs shadow-lg transition flex items-center gap-2"
                >
                  <PlusCircle className="w-4 h-4" />
                  <span>+ Cadastrar Novo Espaço</span>
                </button>

                <button
                  type="button"
                  onClick={handleAbrirCriarEquipamento}
                  className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs border border-white/10 transition flex items-center gap-2"
                >
                  <Snowflake className="w-4 h-4 text-cyan-400" />
                  <span>+ Cadastrar Máquina</span>
                </button>
              </div>
            </div>

            {/* CARDS DE RESUMO DE ESPAÇOS E MÁQUINAS */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
              <div className="bg-slate-900 border border-white/10 p-4 rounded-2xl shadow-md">
                <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Espaços Cadastrados</span>
                <div className="text-2xl font-black text-white mt-1 font-mono">{ambientes.length}</div>
                <span className="text-[11px] text-slate-400 mt-0.5 block">Ambientes na unidade</span>
              </div>

              <div className="bg-slate-900 border border-red-500/30 p-4 rounded-2xl shadow-md">
                <span className="text-[10px] uppercase font-bold text-red-400 tracking-wider flex items-center gap-1">
                  <AlertTriangle className="w-3.5 h-3.5" /> Prioridade Contratual
                </span>
                <div className="text-2xl font-black text-red-300 mt-1 font-mono">
                  {ambientes.filter((a) => a.isPrioritario).length}
                </div>
                <span className="text-[11px] text-slate-400 mt-0.5 block">Salas de aula, labs e estudos</span>
              </div>

              <div className="bg-slate-900 border border-emerald-500/30 p-4 rounded-2xl shadow-md">
                <span className="text-[10px] uppercase font-bold text-emerald-400 tracking-wider">Máquinas Instaladas</span>
                <div className="text-2xl font-black text-emerald-300 mt-1 font-mono">
                  {equipamentos.filter((e) => e.ambienteId).length}
                </div>
                <span className="text-[11px] text-slate-400 mt-0.5 block">Vinculadas a um espaço</span>
              </div>

              <div className="bg-slate-900 border border-amber-500/30 p-4 rounded-2xl shadow-md">
                <span className="text-[10px] uppercase font-bold text-amber-400 tracking-wider">Máquinas em Depósito</span>
                <div className="text-2xl font-black text-amber-300 mt-1 font-mono">
                  {equipamentos.filter((e) => !e.ambienteId || e.status === 'DESINSTALADO_DEPOSITO').length}
                </div>
                <span className="text-[11px] text-slate-400 mt-0.5 block">Desinstaladas / Sem ambiente</span>
              </div>
            </div>

            {/* BARRA DE FILTROS E PESQUISA */}
            <div className="flex flex-col sm:flex-row gap-3 bg-slate-900 p-3.5 rounded-2xl border border-white/10 text-xs shadow-md">
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  placeholder="Pesquisar por nome do espaço, bloco ou sala..."
                  value={buscaAmbiente}
                  onChange={(e) => setBuscaAmbiente(e.target.value)}
                  className="w-full bg-slate-950 border border-white/15 rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400 font-medium"
                />
              </div>

              <div className="flex items-center gap-2 flex-wrap">
                <select
                  value={tipoFiltroAmbiente}
                  onChange={(e) => setTipoFiltroAmbiente(e.target.value)}
                  className="bg-slate-950 border border-white/15 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-400 font-semibold cursor-pointer"
                >
                  <option value="TODOS">Todos os Tipos de Espaço</option>
                  <option value="SALA_DE_AULA">Sala de Aula (🚨 Prioritário)</option>
                  <option value="LABORATORIO_PESQUISA_ININTERRUPTO">Lab. Pesquisa Ininterrupto (🚨 Prioritário)</option>
                  <option value="SALA_ESTUDOS_BIBLIOTECA">Sala de Estudos Biblioteca (🚨 Prioritário)</option>
                  <option value="LABORATORIOS_DIVERSOS">Laboratórios Diversos</option>
                  <option value="OUTRAS_SALAS_USO_ACADEMICO">Outras Salas Uso Acadêmico</option>
                  <option value="AUDITORIO">Auditório</option>
                  <option value="SALA_ADMINISTRATIVA">Sala Administrativa</option>
                  <option value="CORREDOR_PATIO">Corredor / Pátio</option>
                </select>

                {currentUser?.role === 'ADMIN' && (
                  <select
                    value={unidadeFiltroAmbientes}
                    onChange={(e) => {
                      const uId = e.target.value;
                      setUnidadeFiltroAmbientes(uId);
                      carregarAmbientes(uId);
                    }}
                    className="bg-slate-950 border border-white/15 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-400 font-semibold cursor-pointer"
                  >
                    <option value="TODAS">Todas as Unidades da UERN ({unidadesList.length})</option>
                    {unidadesList.map((u: any) => (
                      <option key={u.id} value={u.id}>
                        {u.sigla} • {u.nome} ({u.cidade})
                      </option>
                    ))}
                  </select>
                )}
              </div>
            </div>

            {/* GRID DE AMBIENTES CADASTRADOS */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {ambientes
                .filter((amb) => {
                  const matchBusca =
                    !buscaAmbiente ||
                    amb.descricaoDetalhe.toLowerCase().includes(buscaAmbiente.toLowerCase()) ||
                    (amb.bloco && amb.bloco.toLowerCase().includes(buscaAmbiente.toLowerCase()));
                  const matchTipo = tipoFiltroAmbiente === 'TODOS' || amb.tipo === tipoFiltroAmbiente;
                  const matchUnidade =
                    unidadeFiltroAmbientes === 'TODAS' || amb.unidadeId === unidadeFiltroAmbientes;
                  return matchBusca && matchTipo && matchUnidade;
                })
                .map((amb) => {
                  const maquinasDoAmbiente = equipamentos.filter((eq) => eq.ambienteId === amb.id);
                  return (
                    <div
                      key={amb.id}
                      className={`rounded-2xl bg-slate-900 border p-5 shadow-lg flex flex-col justify-between space-y-4 hover:border-cyan-500/40 transition relative overflow-hidden ${
                        amb.isPrioritario ? 'border-red-500/30 bg-gradient-to-b from-slate-900 to-red-950/20' : 'border-white/10'
                      }`}
                    >
                      <div className="space-y-3">
                        {/* Header do Card */}
                        <div className="flex items-start justify-between gap-2">
                          <span
                            className={`text-[10px] px-2.5 py-1 rounded-full font-black uppercase tracking-wide border flex items-center gap-1 ${
                              amb.isPrioritario
                                ? 'bg-red-500/20 text-red-300 border-red-500/40'
                                : 'bg-blue-500/20 text-blue-300 border-blue-500/30'
                            }`}
                          >
                            {amb.isPrioritario && <AlertTriangle className="w-3 h-3 text-red-400" />}
                            <span>{formatTipoAmbiente(amb.tipo)}</span>
                          </span>

                          <span className="text-[11px] font-mono font-bold text-slate-400 bg-slate-950 px-2 py-0.5 rounded-lg border border-white/5">
                            {amb.unidade?.sigla || 'UERN'} ({amb.unidade?.cidade || 'Mossoró'})
                          </span>
                        </div>

                        {/* Nome do Espaço */}
                        <div>
                          <h4 className="text-base font-black text-white leading-snug">
                            {amb.descricaoDetalhe}
                          </h4>
                          <div className="text-xs text-slate-400 mt-0.5 flex items-center gap-1">
                            <span>{amb.bloco ? `Prédio / Bloco: ${amb.bloco}` : 'Prédio Principal'}</span>
                          </div>
                        </div>

                        {amb.isPrioritario && (
                          <div className="p-2 rounded-xl bg-red-950/40 border border-red-500/30 text-[11px] text-red-300 flex items-center gap-1.5 font-medium">
                            <Zap className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                            <span><strong>Prioridade Operacional:</strong> Chamados deste espaço são priorizados pela empresa.</span>
                          </div>
                        )}

                        {/* Lista de Máquinas Instaladas neste Ambiente */}
                        <div className="space-y-2 pt-2 border-t border-white/5">
                          <div className="flex justify-between items-center text-xs">
                            <span className="font-bold text-slate-300 flex items-center gap-1">
                              <Snowflake className="w-3.5 h-3.5 text-cyan-400" />
                              <span>Aparelhos Instalados ({maquinasDoAmbiente.length})</span>
                            </span>
                            <button
                              type="button"
                              onClick={() => handleAbrirNovaMaquinaNoAmbiente(amb)}
                              className="text-[11px] text-cyan-400 hover:text-cyan-300 font-bold hover:underline"
                            >
                              + Instalar Máquina
                            </button>
                          </div>

                          {maquinasDoAmbiente.length > 0 ? (
                            <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                              {maquinasDoAmbiente.map((m: any) => (
                                <div
                                  key={m.id}
                                  className="p-2.5 rounded-xl bg-slate-950 border border-white/10 text-xs flex flex-col justify-between gap-1.5 hover:border-white/20 transition"
                                >
                                  <div className="flex justify-between items-start gap-1">
                                    <div>
                                      <span className="font-bold font-mono text-cyan-300">
                                        Tombo {m.tombo}
                                      </span>
                                      <span className="text-slate-300 font-medium ml-1.5">
                                        {m.marca} {m.modelo || ''}
                                      </span>
                                    </div>
                                    <span
                                      className={`text-[9px] px-1.5 py-0.2 rounded font-bold ${
                                        m.status === 'ATIVO'
                                          ? 'bg-emerald-500/20 text-emerald-300'
                                          : 'bg-amber-500/20 text-amber-300'
                                      }`}
                                    >
                                      {m.status === 'ATIVO' ? 'Operando' : 'Em Manutenção'}
                                    </span>
                                  </div>

                                  <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1 border-t border-white/5">
                                    <span>
                                      {m.btus ? `${m.btus.toLocaleString('pt-BR')} BTUs` : m.tipo?.replace('_', ' ')}
                                      {m.emGarantia ? ' • 🛡️ Garantia Ativa' : ''}
                                    </span>
                                    <div className="flex items-center gap-1.5">
                                      <button
                                        type="button"
                                        onClick={() => handleAbrirChamadoParaMaquina(m, amb)}
                                        className="text-[10px] px-2 py-0.5 rounded bg-cyan-500/20 text-cyan-300 hover:bg-cyan-500 hover:text-slate-950 font-bold transition flex items-center gap-1"
                                        title="Abrir chamado de manutenção para esta máquina neste ambiente"
                                      >
                                        <Wrench className="w-2.5 h-2.5" />
                                        <span>Chamado</span>
                                      </button>
                                      <button
                                        type="button"
                                        onClick={() => handleAbrirEditarEquipamento(m)}
                                        className="text-[10px] p-1 rounded bg-slate-800 text-slate-300 hover:text-white"
                                        title="Editar máquina"
                                      >
                                        <Edit3 className="w-3 h-3" />
                                      </button>
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <div className="p-3 rounded-xl bg-slate-950/60 border border-dashed border-white/10 text-center text-xs text-slate-500">
                              Nenhuma máquina instalada neste ambiente ainda.
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Footer do Card com Ações do Ambiente */}
                      <div className="flex items-center justify-between gap-2 pt-3 border-t border-white/10">
                        <button
                          type="button"
                          onClick={() => handleAbrirNovaMaquinaNoAmbiente(amb)}
                          className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-cyan-300 hover:text-white text-xs font-semibold transition flex items-center gap-1.5"
                        >
                          <PlusCircle className="w-3.5 h-3.5" />
                          <span>Instalar Máquina</span>
                        </button>

                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => handleAbrirEditarAmbiente(amb)}
                            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white"
                            title="Editar espaço"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleExcluirAmbiente(amb)}
                            className="p-1.5 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400"
                            title="Excluir espaço"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
            </div>

            {/* SEÇÃO DE MÁQUINAS DESINSTALADAS / NO DEPÓSITO */}
            {equipamentos.some((e) => !e.ambienteId || e.status === 'DESINSTALADO_DEPOSITO') && (
              <div className="bg-slate-900 border border-amber-500/30 rounded-2xl p-5 shadow-xl space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-white/10 pb-3">
                  <div>
                    <h4 className="text-sm font-bold text-amber-300 flex items-center gap-2">
                      <Snowflake className="w-4 h-4 text-amber-400" />
                      <span>Máquinas Desinstaladas / Em Depósito (Aguardando Alocação em Ambiente)</span>
                    </h4>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Aparelhos que foram desinstalados ou substituídos e estão desvinculados de espaço físico. Você pode instalá-los em qualquer ambiente da unidade.
                    </p>
                  </div>
                  <span className="text-xs font-mono font-bold text-amber-300 px-2.5 py-1 rounded-lg bg-amber-500/20 border border-amber-500/40">
                    {equipamentos.filter((e) => !e.ambienteId || e.status === 'DESINSTALADO_DEPOSITO').length} Máquinas em Depósito
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 pt-1">
                  {equipamentos
                    .filter((e) => !e.ambienteId || e.status === 'DESINSTALADO_DEPOSITO')
                    .map((m: any) => (
                      <div
                        key={m.id}
                        className="p-3 rounded-xl bg-slate-950 border border-white/10 text-xs flex flex-col justify-between space-y-2 hover:border-amber-500/40 transition"
                      >
                        <div>
                          <div className="flex justify-between font-bold">
                            <span className="font-mono text-amber-300">Tombo {m.tombo}</span>
                            <span className="text-[10px] text-slate-400">{m.unidade?.sigla}</span>
                          </div>
                          <div className="text-white font-medium mt-1">
                            {m.marca} {m.modelo || ''}
                          </div>
                          <div className="text-[11px] text-slate-400">
                            {m.btus ? `${m.btus.toLocaleString('pt-BR')} BTUs` : m.tipo?.replace('_', ' ')}
                          </div>
                        </div>

                        <div className="pt-2 border-t border-white/5 flex justify-end">
                          <button
                            type="button"
                            onClick={() => handleAbrirEditarEquipamento(m)}
                            className="px-3 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs transition flex items-center gap-1.5"
                          >
                            <Building2 className="w-3.5 h-3.5" />
                            <span>Instalar / Vincular a Espaço</span>
                          </button>
                        </div>
                      </div>
                    ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* ------------------------------------------------------------- */}
        {/* TAB 3: INVENTÁRIO DE MÁQUINAS (GESTÃO COMPLETA PELO ADMIN)    */}
        {/* ------------------------------------------------------------- */}
        {activeTab === 'inventario' && (
          <div className="space-y-4">
            {/* Header com Ação de Cadastro */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900/80 p-5 rounded-2xl border border-white/10 shadow-lg">
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <Snowflake className="w-5 h-5 text-cyan-400" />
                  <span>Inventário Patrimonial de Climatização & Refrigeração ({equipamentos.length} Máquinas)</span>
                </h3>
                <p className="text-xs text-slate-300 mt-1 max-w-2xl">
                  Parque patrimonial de aparelhos de ar-condicionado, geladeiras, bebedouros e geláguas de todos os campi da UERN.
                  O Administrador possui permissão total para <strong>incluir novas máquinas</strong>, <strong>editar especificações técnicas</strong>, <strong>alterar tombos/status</strong> e <strong>excluir equipamentos</strong>.
                </p>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={handleAbrirCriarEquipamento}
                  className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-black text-xs shadow-lg transition flex items-center gap-2"
                >
                  <PlusCircle className="w-4 h-4" />
                  <span>+ Cadastrar Nova Máquina</span>
                </button>
              </div>
            </div>

            {/* Barra de Filtros e Pesquisa */}
            <div className="flex flex-col sm:flex-row gap-3 bg-slate-950/70 p-3.5 rounded-xl border border-white/10 text-xs">
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  placeholder="Pesquisar por tombo, marca, modelo ou sala/bloco..."
                  value={buscaInventario}
                  onChange={(e) => setBuscaInventario(e.target.value)}
                  className="w-full bg-slate-900 border border-white/15 rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500/50"
                />
              </div>

              <div className="flex items-center gap-2">
                <select
                  value={tipoFiltroInventario}
                  onChange={(e) => setTipoFiltroInventario(e.target.value)}
                  className="bg-slate-900 border border-white/15 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-500 cursor-pointer"
                >
                  <option value="TODOS">Todos os Tipos de Máquina</option>
                  <option value="AR_CONDICIONADO">Ar-Condicionado</option>
                  <option value="BEBEDOURO_INDUSTRIAL">Bebedouro Industrial</option>
                  <option value="GELAGUA">Gelágua / Purificador</option>
                  <option value="REFRIGERADOR_FREEZER">Refrigerador / Freezer</option>
                </select>

                <select
                  value={unidadeFiltroInventario}
                  onChange={(e) => setUnidadeFiltroInventario(e.target.value)}
                  className="bg-slate-900 border border-white/15 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-500 cursor-pointer"
                >
                  <option value="TODOS">Todas as Unidades</option>
                  {usuariosData?.unidades?.map((u: any) => (
                    <option key={u.id} value={u.id}>
                      {u.sigla} ({u.campus})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Grid de Máquinas */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {equipamentos
                .filter((eq) => {
                  const matchBusca = !buscaInventario ||
                    eq.tombo.toLowerCase().includes(buscaInventario.toLowerCase()) ||
                    eq.marca.toLowerCase().includes(buscaInventario.toLowerCase()) ||
                    (eq.modelo && eq.modelo.toLowerCase().includes(buscaInventario.toLowerCase())) ||
                    eq.localizacao.toLowerCase().includes(buscaInventario.toLowerCase());
                  const matchTipo = tipoFiltroInventario === 'TODOS' || eq.tipo === tipoFiltroInventario;
                  const matchUnidade = unidadeFiltroInventario === 'TODOS' || eq.unidade?.id === unidadeFiltroInventario || eq.unidade?.sigla === unidadeFiltroInventario;
                  return matchBusca && matchTipo && matchUnidade;
                })
                .map((eq) => (
                  <div
                    key={eq.id}
                    className="rounded-2xl bg-slate-900/90 border border-white/10 p-5 space-y-3.5 shadow-md relative hover:border-white/20 transition flex flex-col justify-between"
                  >
                    <div className="space-y-3">
                      <div className="flex justify-between items-start gap-2">
                        <span className="text-xs px-2.5 py-1 rounded-lg bg-slate-950 text-cyan-300 font-mono font-bold border border-cyan-500/30">
                          Tombo: {eq.tombo}
                        </span>

                        <span className={`text-[10px] px-2.5 py-0.5 rounded-full font-bold border ${
                          eq.status === 'ATIVO' ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40' :
                          eq.status === 'EM_MANUTENCAO' ? 'bg-amber-500/20 text-amber-300 border-amber-500/40' :
                          eq.status === 'DESINSTALADO_DEPOSITO' ? 'bg-blue-500/20 text-blue-300 border-blue-500/40' :
                          'bg-red-500/20 text-red-300 border-red-500/40'
                        }`}>
                          {eq.status === 'ATIVO' ? '● Em Operação' :
                           eq.status === 'EM_MANUTENCAO' ? '▲ Em Manutenção' :
                           eq.status === 'DESINSTALADO_DEPOSITO' ? '■ No Depósito' :
                           '✕ Inservível / Baixado'}
                        </span>
                      </div>

                      <div>
                        <div className="text-[11px] uppercase tracking-wider text-slate-400 font-semibold mb-0.5">
                          {eq.tipo.replace('_', ' ')}
                        </div>
                        <h4 className="text-sm font-black text-white leading-snug">
                          {eq.marca} {eq.modelo || ''}
                        </h4>

                        <div className="flex flex-wrap gap-1 mt-1.5 text-[11px]">
                          {eq.btus && (
                            <span className="px-2 py-0.5 rounded bg-slate-800 text-cyan-300 font-mono font-bold">
                              {eq.btus.toLocaleString('pt-BR')} BTUs
                            </span>
                          )}
                          {eq.tipoAc && (
                            <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-300">
                              {eq.tipoAc}
                            </span>
                          )}
                          {eq.gasRefrigerante && (
                            <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-400">
                              Gás {eq.gasRefrigerante}
                            </span>
                          )}
                          {eq.litragem && (
                            <span className="px-2 py-0.5 rounded bg-slate-800 text-cyan-300 font-mono">
                              {eq.litragem} Litros
                            </span>
                          )}
                          {eq.qtdTorneiras && (
                            <span className="px-2 py-0.5 rounded bg-slate-800 text-cyan-300">
                              {eq.qtdTorneiras} Torneiras
                            </span>
                          )}
                          {eq.modeloGelagua && (
                            <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-300">
                              {eq.modeloGelagua}
                            </span>
                          )}
                        </div>

                        {/* Identificação de Unidade e Ambiente Físico */}
                        <div className="space-y-1.5 mt-2.5">
                          <div className="text-xs text-slate-300 flex items-center gap-1.5 bg-slate-950/60 p-2 rounded-xl border border-white/5">
                            <Building2 className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                            <span className="font-semibold text-white">{eq.unidade?.sigla || 'PROAD'}</span>
                            <span className="text-slate-500">•</span>
                            <span className="text-slate-400 text-[11px] truncate">{eq.unidade?.campus || eq.unidade?.cidade || 'Campus UERN'}</span>
                          </div>

                          {eq.ambiente ? (
                            <div className="text-xs flex items-center justify-between gap-1.5 bg-teal-950/40 p-2 rounded-xl border border-teal-500/30">
                              <div className="flex items-center gap-1.5 min-w-0">
                                <MapPin className="w-3.5 h-3.5 text-teal-400 shrink-0" />
                                <span className="font-bold text-teal-200 truncate">{eq.ambiente.descricaoDetalhe}</span>
                                {eq.ambiente.bloco && (
                                  <span className="text-[10px] text-teal-400/80 shrink-0">({eq.ambiente.bloco})</span>
                                )}
                              </div>
                              {['SALA_DE_AULA', 'LABORATORIO_PESQUISA_ININTERRUPTO', 'SALA_ESTUDOS_BIBLIOTECA'].includes(eq.ambiente.tipo) ? (
                                <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40 shrink-0 flex items-center gap-0.5">
                                  ⭐ Prioritário
                                </span>
                              ) : (
                                <span className="text-[10px] text-slate-400 shrink-0">
                                  {formatTipoAmbiente(eq.ambiente.tipo)}
                                </span>
                              )}
                            </div>
                          ) : eq.status === 'DESINSTALADO_DEPOSITO' ? (
                            <div className="text-xs flex items-center gap-1.5 bg-blue-950/30 p-2 rounded-xl border border-blue-500/20 text-blue-300">
                              <span>📦</span>
                              <span className="font-medium text-[11px]">No Depósito / Sem ambiente vinculado</span>
                            </div>
                          ) : (
                            <div className="text-xs flex items-center gap-1.5 bg-slate-950/60 p-2 rounded-xl border border-white/5 text-slate-400">
                              <MapPin className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                              <span className="truncate">{eq.localizacao || 'Ambiente não informado'}</span>
                            </div>
                          )}
                        </div>
                      </div>

                      {eq.emGarantia && (
                        <div className="text-[10px] px-2.5 py-1 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 flex items-center gap-1.5 font-medium">
                          <ShieldCheck className="w-3 h-3 text-emerald-400" />
                          <span>Garantia ativa: restam <strong>{eq.diasGarantiaRestantes} dias</strong></span>
                        </div>
                      )}

                      {eq.possuiChamadoAtivo && eq.chamadoAtivo && (
                        <div className="text-[10px] px-2.5 py-1 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-300 flex items-center justify-between">
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            <span>Chamado aberto: <strong>{eq.chamadoAtivo.numeroProtocolo}</strong></span>
                          </span>
                          <span className="uppercase text-[9px] font-bold">({eq.chamadoAtivo.status})</span>
                        </div>
                      )}
                    </div>

                    {/* Ações do Admin e Unidade */}
                    <div className="flex items-center justify-between pt-3 border-t border-white/10 text-xs">
                      <span className="text-[11px] text-slate-400">
                        {eq.retificadoPelaEmpresa ? '✓ Especificação validada' : 'Cadastrada no inventário'}
                      </span>

                      <div className="flex items-center gap-1.5">
                        {eq.status !== 'BAIXADO_INSERVIVEL' && (
                          <button
                            type="button"
                            onClick={() => handleAbrirChamadoParaMaquina(eq, eq.ambiente)}
                            className="px-2 py-1 rounded-lg bg-cyan-500/15 hover:bg-cyan-500/25 text-cyan-300 font-semibold text-[11px] flex items-center gap-1 border border-cyan-500/30 transition"
                            title="Abrir chamado para este equipamento"
                          >
                            <Wrench className="w-3 h-3 text-cyan-400" />
                            <span>Chamado</span>
                          </button>
                        )}

                        <button
                          type="button"
                          onClick={() => handleAbrirEditarEquipamento(eq)}
                          className="px-2 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white font-semibold text-[11px] flex items-center gap-1 border border-white/10 transition"
                          title="Editar / Alterar Máquina"
                        >
                          <Edit3 className="w-3 h-3 text-cyan-400" />
                          <span>Editar</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => handleExcluirEquipamento(eq.id, eq.tombo)}
                          className="p-1 rounded-lg bg-red-500/10 hover:bg-red-500/25 text-red-400 border border-red-500/20 transition"
                          title="Excluir máquina do inventário"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
            </div>

            {equipamentos.length === 0 && (
              <div className="p-8 text-center bg-slate-900 rounded-2xl border border-white/10 text-slate-400">
                Nenhuma máquina cadastrada no inventário. Clique em "+ Cadastrar Nova Máquina" para adicionar.
              </div>
            )}
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

            {/* BARRA DE FILTRO POR CIDADE / MUNICÍPIO */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-900 border border-white/10 p-4 rounded-2xl shadow-lg">
              <div className="flex items-center gap-3 flex-wrap">
                <div className="flex items-center gap-1.5 text-xs font-bold text-white">
                  <MapPin className="w-4 h-4 text-cyan-400" />
                  <span>Filtrar Fechamento por Município:</span>
                </div>
                <select
                  value={cidadeFiltroFaturamento}
                  onChange={(e) => {
                    const cid = e.target.value;
                    setCidadeFiltroFaturamento(cid);
                    carregarFaturamento(cid);
                  }}
                  className="bg-slate-950 border border-white/20 rounded-xl px-3 py-1.5 text-xs text-white outline-none focus:border-cyan-400 font-semibold"
                >
                  <option value="">Todas as Cidades ({cidadesList.length})</option>
                  {cidadesList.map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
                {cidadeFiltroFaturamento && (
                  <button
                    type="button"
                    onClick={() => {
                      setCidadeFiltroFaturamento('');
                      carregarFaturamento('');
                    }}
                    className="text-[11px] text-cyan-400 hover:underline"
                  >
                    Limpar filtro
                  </button>
                )}
              </div>

              <div className="text-xs text-slate-300 font-mono bg-slate-950/70 px-3 py-1.5 rounded-xl border border-white/5">
                Total auditado no mês: <strong className="text-amber-300">R$ {faturamentoData?.totalMes?.toLocaleString('pt-BR', { minimumFractionDigits: 2 }) || '0,00'}</strong> ({faturamentoData?.totalMaquinas || 0} intervenções)
              </div>
            </div>

            {/* CARDS COM DEMONSTRATIVO DE CONSUMO POR MUNICÍPIO */}
            {faturamentoData?.faturamentoPorCidade && Object.keys(faturamentoData.faturamentoPorCidade).length > 0 && (
              <div className="space-y-2">
                <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Distribuição por Município / Campus no Período</span>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
                  {Object.entries(faturamentoData.faturamentoPorCidade).map(([cid, info]: [string, any]) => {
                    const isSelected = cidadeFiltroFaturamento === cid;
                    return (
                      <button
                        key={cid}
                        type="button"
                        onClick={() => {
                          const prox = isSelected ? '' : cid;
                          setCidadeFiltroFaturamento(prox);
                          carregarFaturamento(prox);
                        }}
                        className={`p-3 rounded-xl border text-left transition ${
                          isSelected
                            ? 'bg-cyan-950/80 border-cyan-400 shadow-md ring-1 ring-cyan-400'
                            : 'bg-slate-900 hover:bg-slate-800/80 border-white/10'
                        }`}
                      >
                        <div className="text-xs font-bold text-white truncate flex items-center gap-1">
                          <MapPin className="w-3 h-3 text-cyan-400 shrink-0" />
                          <span>{cid}</span>
                        </div>
                        <div className="text-sm font-black text-amber-300 font-mono mt-1">
                          R$ {info.total?.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        </div>
                        <div className="text-[10px] text-slate-400 mt-0.5">
                          {info.quantidade} {info.quantidade === 1 ? 'máquina' : 'máquinas'}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Tabela Máquina por Máquina */}
            <div className="rounded-2xl bg-slate-900 border border-white/10 overflow-hidden shadow-xl">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs text-slate-300">
                  <thead className="bg-slate-950 text-slate-400 uppercase text-[10px] font-bold border-b border-white/10">
                    <tr>
                      <th className="py-3 px-4">Item / Tombo</th>
                      <th className="py-3 px-4">Cidade & Unidade</th>
                      <th className="py-3 px-4">Ambiente / Local</th>
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
                          <div className="flex items-center gap-1 text-cyan-300 font-semibold text-xs">
                            <MapPin className="w-3 h-3 shrink-0 text-cyan-400" />
                            <span>{it.cidade || 'Mossoró'}</span>
                          </div>
                          <div className="text-white font-bold">{it.unidadeSigla}</div>
                        </td>
                        <td className="py-3 px-4">
                          <div className="text-slate-200 font-medium">
                            {it.ambienteDetalhe || it.localizacao}
                          </div>
                          {it.ambienteTipo && (
                            <div className="text-[10px] text-slate-400">{formatTipoAmbiente(it.ambienteTipo)}</div>
                          )}
                          {it.isAmbientePrioritario && (
                            <span className="inline-block mt-1 px-1.5 py-0.5 rounded bg-red-500/20 text-red-300 border border-red-500/40 text-[9px] font-black uppercase">
                              Prioritário
                            </span>
                          )}
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

        {/* ------------------------------------------------------------- */}
        {/* TAB 5: GESTÃO DE USUÁRIOS, TÉCNICOS & ACESSOS DA EMPRESA      */}
        {/* ------------------------------------------------------------- */}
        {activeTab === 'usuarios' && (
          <div className="space-y-6 animate-in fade-in">
            {/* Header com Informações da Empresa & SGC */}
            <div className="bg-gradient-to-r from-purple-950 via-slate-900 to-blue-950 border border-purple-500/30 rounded-2xl p-6 shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <span className="px-2.5 py-0.5 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/40 text-xs font-bold flex items-center gap-1">
                    <ShieldCheck className="w-3.5 h-3.5 text-purple-400" /> Painel de Controle de Acessos & Equipe
                  </span>
                  <span className="text-xs text-slate-400">Contrato Ativo: <strong>{contratoData?.contrato?.numeroContrato || '11/2026'}</strong></span>
                </div>
                <h3 className="text-xl font-black text-white">Gestão de Usuários, Equipe de Fiscalização e Técnicos</h3>
                <p className="text-xs text-slate-300 mt-1 max-w-2xl">
                  Cadastre os técnicos autorizados da empresa prestadora no sistema de climatização e consulte a equipe de fiscalização e prepostos sincronizados diretamente do SGC.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleAbrirCriarTecnico}
                  className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-black text-xs shadow-lg transition flex items-center gap-2"
                >
                  <UserPlus className="w-4 h-4" />
                  <span>+ Cadastrar Técnico da Empresa</span>
                </button>
              </div>
            </div>

            {/* SEÇÃO 0: PARÂMETRO CONFIGURÁVEL DE APROVAÇÃO AUTOMÁTICA DE ORÇAMENTOS */}
            <div className="bg-slate-900 border border-amber-500/30 rounded-2xl p-6 shadow-xl space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/10 pb-4">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40 text-[10px] font-bold uppercase tracking-wider flex items-center gap-1">
                      <Zap className="w-3 h-3 text-amber-400" /> Parâmetro Configurável de Manutenção Cara / Complexa
                    </span>
                    <span className="text-xs text-slate-400">Configuração Oficial da Fiscalização / Gestor PROAD</span>
                  </div>
                  <h4 className="text-base font-black text-white flex items-center gap-2">
                    <Sliders className="w-5 h-5 text-amber-400" />
                    <span>Teto de Manutenção Simples / Limite para Execução Direta (sem Laudo Prévio)</span>
                  </h4>
                  <p className="text-xs text-slate-300 mt-1 max-w-2xl">
                    Define o teto de corte para execução direta sem laudo. Quando o custo estimado da manutenção for superior a este valor (ou apresentar alta complexidade técnica), a empresa prestadora deve obrigatoriamente submeter <strong>Laudo Técnico Preliminar</strong> para análise da <strong>Fiscalização Técnica</strong>, que pode autorizar, reprovar ou solicitar parecer técnico à <strong>Superintendência de Obras e Engenharia (SOBE)</strong>.
                  </p>
                </div>

                <div className="text-left sm:text-right bg-slate-950/60 p-3 rounded-xl border border-white/10 sm:border-none sm:bg-transparent sm:p-0">
                  <div className="text-[11px] text-slate-400 uppercase font-semibold">Teto Atual em Vigor</div>
                  <div className="text-2xl font-black text-emerald-400 font-mono">
                    R$ {Number(contratoData?.contrato?.limiteAprovacaoAutomatica || 1000).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </div>
                </div>
              </div>

              {msgSucessoLimite && (
                <div className="p-3 rounded-xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-xs flex items-center gap-2 animate-in fade-in">
                  <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
                  <span>{msgSucessoLimite}</span>
                </div>
              )}

              <form onSubmit={handleSalvarLimiteAprovacao} className="flex flex-col sm:flex-row sm:items-end gap-4 bg-slate-950/70 p-4 rounded-xl border border-white/10">
                <div className="flex-1 max-w-xs">
                  <label className="block text-xs font-bold text-slate-300 mb-1.5 flex items-center gap-1.5">
                    <DollarSign className="w-4 h-4 text-emerald-400" />
                    <span>Teto para Aprovação Automática (R$)</span>
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-2.5 text-xs text-slate-500 font-bold">R$</span>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={limiteAprovacao}
                      onChange={(e) => setLimiteAprovacao(e.target.value)}
                      placeholder="1000.00"
                      className="w-full bg-slate-900 border border-white/20 rounded-xl pl-9 pr-3 py-2 text-sm text-white font-mono font-bold focus:outline-none focus:border-amber-400 transition"
                    />
                  </div>
                  <span className="text-[10px] text-slate-500 mt-1 block">Padrão do contrato da UERN: R$ 1.000,00</span>
                </div>

                <div className="flex-1 text-xs text-slate-300 space-y-1.5 py-1">
                  <div className="flex items-center gap-1.5 text-emerald-400 font-medium">
                    <Check className="w-3.5 h-3.5 shrink-0" />
                    <span><strong>Até R$ {parseFloat(limiteAprovacao || '0').toLocaleString('pt-BR', { minimumFractionDigits: 2 })}:</strong> Aprovação automática (vai direto para "Em Execução").</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-amber-300 font-medium">
                    <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                    <span><strong>Acima de R$ {parseFloat(limiteAprovacao || '0').toLocaleString('pt-BR', { minimumFractionDigits: 2 })}:</strong> Requer aprovação da Fiscalização Adm ou Gestor do Contrato.</span>
                  </div>
                </div>

                <div>
                  <button
                    type="submit"
                    disabled={salvandoLimite}
                    className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black text-xs shadow-lg transition flex items-center gap-2 disabled:opacity-50"
                  >
                    <CheckCircle2 className={`w-4 h-4 ${salvandoLimite ? 'animate-spin' : ''}`} />
                    <span>{salvandoLimite ? 'Salvando Parâmetro...' : 'Salvar Novo Parâmetro'}</span>
                  </button>
                </div>
              </form>
            </div>

            {/* SEÇÃO 1: TÉCNICOS DA EMPRESA CADASTRADOS NO SISTEMA */}
            <div className="bg-slate-900 border border-white/10 rounded-2xl p-5 shadow-lg space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-white/10 pb-3">
                <div>
                  <h4 className="text-sm font-bold text-white flex items-center gap-2">
                    <Wrench className="w-4 h-4 text-cyan-400" />
                    <span>Técnicos de Campo da Empresa Prestadora ({usuariosData?.usuarios?.filter((u: any) => u.role === 'EMPRESA' && !u.nome.toLowerCase().includes('preposto')).length || 0})</span>
                  </h4>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Técnicos autorizados a executar serviços, anexar fotos e laudos térmicos no sistema. Cadastrados e gerenciados pelo Administrador.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={handleAbrirCriarTecnico}
                  className="px-3 py-1.5 rounded-lg bg-cyan-500/15 hover:bg-cyan-500/25 border border-cyan-500/40 text-cyan-300 text-xs font-bold flex items-center gap-1.5"
                >
                  <UserPlus className="w-3.5 h-3.5" />
                  <span>Novo Técnico</span>
                </button>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs text-slate-300">
                  <thead className="bg-slate-950 text-slate-400 uppercase text-[10px] font-bold border-b border-white/10">
                    <tr>
                      <th className="py-2.5 px-3">Nome do Técnico</th>
                      <th className="py-2.5 px-3">CPF</th>
                      <th className="py-2.5 px-3">E-mail de Acesso</th>
                      <th className="py-2.5 px-3">Empresa Vinculada</th>
                      <th className="py-2.5 px-3">Status</th>
                      <th className="py-2.5 px-3 text-right">Ações</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {usuariosData?.usuarios?.filter((u: any) => u.role === 'EMPRESA' && !u.nome.toLowerCase().includes('preposto')).length === 0 ? (
                      <tr>
                        <td colSpan={6} className="py-6 text-center text-slate-500">
                          Nenhum técnico cadastrado ainda. Clique em "+ Cadastrar Técnico da Empresa" para adicionar.
                        </td>
                      </tr>
                    ) : (
                      usuariosData?.usuarios
                        ?.filter((u: any) => u.role === 'EMPRESA' && !u.nome.toLowerCase().includes('preposto'))
                        .map((u: any) => (
                          <tr key={u.id} className="hover:bg-slate-800/40">
                            <td className="py-3 px-3">
                              <div className="font-bold text-white flex items-center gap-1.5">
                                <Wrench className="w-3.5 h-3.5 text-cyan-400" />
                                <span>{u.nome}</span>
                              </div>
                            </td>
                            <td className="py-3 px-3 font-mono text-slate-300">{u.cpf}</td>
                            <td className="py-3 px-3 text-slate-400">{u.email}</td>
                            <td className="py-3 px-3 text-slate-300">
                              {u.empresa?.razaoSocial || contratoData?.contrato?.empresa?.razaoSocial || 'L O DOS SANTOS ECOMSER'}
                            </td>
                            <td className="py-3 px-3">
                              <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${u.ativo ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40' : 'bg-red-500/20 text-red-300 border border-red-500/40'}`}>
                                {u.ativo ? 'Ativo' : 'Inativo'}
                              </span>
                            </td>
                            <td className="py-3 px-3 text-right">
                              <div className="flex items-center justify-end gap-1.5">
                                <button
                                  type="button"
                                  onClick={() => handleAbrirEditarUsuario(u)}
                                  className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white"
                                  title="Editar Técnico"
                                >
                                  <Edit3 className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleExcluirUsuario(u.id, u.nome)}
                                  className="p-1.5 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400"
                                  title="Excluir Técnico"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* SEÇÃO 2: FISCAIS TÉCNICOS & PREPOSTO SINCRONIZADOS DO SGC */}
            <div className="bg-slate-900 border border-white/10 rounded-2xl p-5 shadow-lg space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-white/10 pb-3">
                <div>
                  <h4 className="text-sm font-bold text-white flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-emerald-400" />
                    <span>Equipe de Fiscalização & Preposto (Sincronizados Oficialmente do SGC)</span>
                  </h4>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Estes dados são alimentados e geridos pelo Sistema de Gestão de Contratos (SGC), respeitando as portarias e atos de designação vigentes.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={handleSincronizarSgc}
                  disabled={sincronizandoSgc}
                  className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 border border-white/15 text-xs text-slate-200 flex items-center gap-1.5"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${sincronizandoSgc ? 'animate-spin text-cyan-400' : 'text-slate-400'}`} />
                  <span>Resincronizar com SGC</span>
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Fiscal Técnico */}
                <div className="rounded-xl bg-slate-950 border border-emerald-500/30 p-4 space-y-2 relative overflow-hidden">
                  <div className="absolute top-0 right-0 px-2 py-0.5 bg-emerald-500/20 text-emerald-300 border-b border-l border-emerald-500/30 text-[9px] font-bold uppercase tracking-wider rounded-bl">
                    SGC • Fiscal Técnico
                  </div>
                  <div className="text-xs font-bold text-white flex items-center gap-1.5 pt-1">
                    <ShieldCheck className="w-4 h-4 text-emerald-400" />
                    <span>Fiscal Técnico Oficial</span>
                  </div>
                  <div className="text-sm font-black text-emerald-300">
                    {usuariosData?.equipeSgc?.find((r: any) => r.tipoAtuacao === 'FISCAL_TECNICO')?.nome || 'José Luiz de Melo Júnior'}
                  </div>
                  <div className="text-[11px] text-slate-400 space-y-0.5">
                    <div>Matrícula: <strong className="text-slate-200">{usuariosData?.equipeSgc?.find((r: any) => r.tipoAtuacao === 'FISCAL_TECNICO')?.matricula || '13944-7'}</strong></div>
                    <div>E-mail: <span className="text-slate-300">{usuariosData?.equipeSgc?.find((r: any) => r.tipoAtuacao === 'FISCAL_TECNICO')?.email || 'joseluiz@uern.br'}</span></div>
                    <div>Campus/Setor: <span className="text-slate-300">{usuariosData?.equipeSgc?.find((r: any) => r.tipoAtuacao === 'FISCAL_TECNICO')?.campusSetor || 'Mossoró'}</span></div>
                    <div className="text-[10px] text-emerald-400/80 pt-1 font-semibold">✓ Responsável pelo Recebimento Provisório</div>
                  </div>
                </div>

                {/* Preposto da Empresa */}
                <div className="rounded-xl bg-slate-950 border border-amber-500/30 p-4 space-y-2 relative overflow-hidden">
                  <div className="absolute top-0 right-0 px-2 py-0.5 bg-amber-500/20 text-amber-300 border-b border-l border-amber-500/30 text-[9px] font-bold uppercase tracking-wider rounded-bl">
                    SGC • Fornecedor
                  </div>
                  <div className="text-xs font-bold text-white flex items-center gap-1.5 pt-1">
                    <Building2 className="w-4 h-4 text-amber-400" />
                    <span>Preposto da Empresa</span>
                  </div>
                  <div className="text-sm font-black text-amber-300">
                    Josemildo
                  </div>
                  <div className="text-[11px] text-slate-400 space-y-0.5">
                    <div>Empresa: <strong className="text-slate-200">L O DOS SANTOS ECOMSER</strong></div>
                    <div>Telefone: <span className="text-slate-300">(84) 921685387</span></div>
                    <div>E-mail: <span className="text-slate-300">ebenezerecomser@gmail.com</span></div>
                    <div className="text-[10px] text-amber-400/80 pt-1 font-semibold">✓ Representante Legal perante o SGC</div>
                  </div>
                </div>

                {/* Gestor do Contrato */}
                <div className="rounded-xl bg-slate-950 border border-purple-500/30 p-4 space-y-2 relative overflow-hidden">
                  <div className="absolute top-0 right-0 px-2 py-0.5 bg-purple-500/20 text-purple-300 border-b border-l border-purple-500/30 text-[9px] font-bold uppercase tracking-wider rounded-bl">
                    SGC • Gestor
                  </div>
                  <div className="text-xs font-bold text-white flex items-center gap-1.5 pt-1">
                    <Star className="w-4 h-4 text-purple-400" />
                    <span>Gestor do Contrato</span>
                  </div>
                  <div className="text-sm font-black text-purple-300">
                    {usuariosData?.equipeSgc?.find((r: any) => r.tipoAtuacao === 'GESTOR')?.nome || 'Pedro Eloy de Paiva Farias'}
                  </div>
                  <div className="text-[11px] text-slate-400 space-y-0.5">
                    <div>Matrícula: <strong className="text-slate-200">{usuariosData?.equipeSgc?.find((r: any) => r.tipoAtuacao === 'GESTOR')?.matricula || '12757-4'}</strong></div>
                    <div>E-mail: <span className="text-slate-300">{usuariosData?.equipeSgc?.find((r: any) => r.tipoAtuacao === 'GESTOR')?.email || 'pedroeloy@uern.br'}</span></div>
                    <div>Ato Designação: <span className="text-slate-300">Portaria 11/2026 (SEI: 44599917)</span></div>
                    <div className="text-[10px] text-purple-400/80 pt-1 font-semibold">✓ Recebimento Definitivo da Despesa</div>
                  </div>
                </div>

                {/* Fiscal Administrativo */}
                <div className="rounded-xl bg-slate-950 border border-blue-500/30 p-4 space-y-2 relative overflow-hidden">
                  <div className="absolute top-0 right-0 px-2 py-0.5 bg-blue-500/20 text-blue-300 border-b border-l border-blue-500/30 text-[9px] font-bold uppercase tracking-wider rounded-bl">
                    SGC • Fiscal Adm
                  </div>
                  <div className="text-xs font-bold text-white flex items-center gap-1.5 pt-1">
                    <FileText className="w-4 h-4 text-blue-400" />
                    <span>Fiscal Administrativo</span>
                  </div>
                  <div className="text-sm font-black text-blue-300">
                    {usuariosData?.equipeSgc?.find((r: any) => r.tipoAtuacao === 'FISCAL_ADMINISTRATIVO')?.nome || 'Mario Sérgio Leite'}
                  </div>
                  <div className="text-[11px] text-slate-400 space-y-0.5">
                    <div>Matrícula: <strong className="text-slate-200">{usuariosData?.equipeSgc?.find((r: any) => r.tipoAtuacao === 'FISCAL_ADMINISTRATIVO')?.matricula || '8977-0'}</strong></div>
                    <div>E-mail: <span className="text-slate-300">{usuariosData?.equipeSgc?.find((r: any) => r.tipoAtuacao === 'FISCAL_ADMINISTRATIVO')?.email || 'mariosergio@uern.br'}</span></div>
                    <div>Ato Designação: <span className="text-slate-300">Portaria 11/2026 (SEI: 44599917)</span></div>
                    <div className="text-[10px] text-blue-400/80 pt-1 font-semibold">✓ Conformidade Trabalhista e Previdenciária</div>
                  </div>
                </div>
              </div>
            </div>

            {/* SEÇÃO 3: TODOS OS USUÁRIOS E DEMANDANTES DO SISTEMA */}
            <div className="bg-slate-900 border border-white/10 rounded-2xl p-5 shadow-lg space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-white/10 pb-3">
                <div>
                  <h4 className="text-sm font-bold text-white flex items-center gap-2">
                    <Users className="w-4 h-4 text-purple-400" />
                    <span>Todos os Usuários Cadastrados ({usuariosData?.usuarios?.length || 0})</span>
                  </h4>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Administradores, fiscais técnicos, prepostos e demandantes das unidades. O Admin tem permissão para editar perfis e excluir usuários fictícios.
                  </p>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs text-slate-300">
                  <thead className="bg-slate-950 text-slate-400 uppercase text-[10px] font-bold border-b border-white/10">
                    <tr>
                      <th className="py-2.5 px-3">Nome</th>
                      <th className="py-2.5 px-3">E-mail</th>
                      <th className="py-2.5 px-3">CPF</th>
                      <th className="py-2.5 px-3">Matrícula</th>
                      <th className="py-2.5 px-3">Perfil (Role)</th>
                      <th className="py-2.5 px-3">Unidade / Setor</th>
                      <th className="py-2.5 px-3">Status</th>
                      <th className="py-2.5 px-3 text-right">Ações</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {usuariosData?.usuarios?.map((u: any) => (
                      <tr key={u.id} className="hover:bg-slate-800/40">
                        <td className="py-3 px-3 font-bold text-white">{u.nome}</td>
                        <td className="py-3 px-3 text-slate-400">{u.email}</td>
                        <td className="py-3 px-3 font-mono text-slate-300">{u.cpf}</td>
                        <td className="py-3 px-3 text-slate-400">{u.matricula || '-'}</td>
                        <td className="py-3 px-3">
                          <span className={`text-[10px] px-2 py-0.5 rounded font-bold ${
                            u.role === 'ADMIN' ? 'bg-purple-500/20 text-purple-300 border border-purple-500/40' :
                            u.role === 'FISCAL_TECNICO' ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40' :
                            u.role === 'EMPRESA' ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40' :
                            'bg-blue-500/20 text-blue-300 border border-blue-500/40'
                          }`}>
                            {u.role}
                          </span>
                        </td>
                        <td className="py-3 px-3 text-slate-300">
                          {u.unidade?.sigla ? `${u.unidade.sigla} (${u.unidade.campus})` : (u.empresa?.razaoSocial || '-')}
                        </td>
                        <td className="py-3 px-3">
                          <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${u.ativo ? 'bg-emerald-500/20 text-emerald-300' : 'bg-red-500/20 text-red-300'}`}>
                            {u.ativo ? 'Ativo' : 'Inativo'}
                          </span>
                        </td>
                        <td className="py-3 px-3 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              type="button"
                              onClick={() => handleAbrirEditarUsuario(u)}
                              className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white"
                              title="Editar Usuário"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleExcluirUsuario(u.id, u.nome)}
                              className="p-1.5 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400"
                              title="Excluir Usuário"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* SEÇÃO 4: UNIDADES DA UERN & MUNICÍPIOS DE VÍNCULO */}
            <div className="bg-slate-900 border border-white/10 rounded-2xl p-5 shadow-lg space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/10 pb-3">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="px-2 py-0.5 rounded bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 text-[10px] font-bold uppercase tracking-wider flex items-center gap-1">
                      <MapPin className="w-3 h-3 text-cyan-400" /> Vínculo Territorial & Municipal
                    </span>
                    <span className="text-xs text-slate-400">Total: <strong>{unidadesList.length} Unidades</strong></span>
                  </div>
                  <h4 className="text-sm font-bold text-white flex items-center gap-2">
                    <Building2 className="w-4 h-4 text-cyan-400" />
                    <span>Unidades da UERN e Municípios de Vínculo</span>
                  </h4>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Defina o município de vínculo de cada unidade cadastrada no Portal PROAD. Essa parametrização é utilizada pelo sistema para separar os relatórios mensais, calcular fechamentos e permitir controle operacional por cidade.
                  </p>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs text-slate-300">
                  <thead className="bg-slate-950 text-slate-400 uppercase text-[10px] font-bold border-b border-white/10">
                    <tr>
                      <th className="py-2.5 px-3">Sigla & Nome da Unidade</th>
                      <th className="py-2.5 px-3">Campus</th>
                      <th className="py-2.5 px-3">Município / Cidade</th>
                      <th className="py-2.5 px-3 text-center">Ambientes</th>
                      <th className="py-2.5 px-3 text-center">Máquinas</th>
                      <th className="py-2.5 px-3 text-center">Chamados</th>
                      <th className="py-2.5 px-3 text-right">Ação</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {unidadesList.map((u: any) => (
                      <tr key={u.id} className="hover:bg-slate-800/40">
                        <td className="py-3 px-3">
                          <span className="font-bold text-white">{u.sigla}</span>
                          <span className="text-slate-400 ml-2">{u.nome}</span>
                        </td>
                        <td className="py-3 px-3 text-slate-400">{u.campus}</td>
                        <td className="py-3 px-3">
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-cyan-950/80 text-cyan-300 border border-cyan-500/40 font-bold text-xs font-mono">
                            <MapPin className="w-3 h-3 text-cyan-400" />
                            {u.cidade || 'Mossoró'}
                          </span>
                        </td>
                        <td className="py-3 px-3 text-center">
                          <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-300 font-mono text-[11px]">
                            {u.ambientesCount || 0}
                          </span>
                        </td>
                        <td className="py-3 px-3 text-center">
                          <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-300 font-mono text-[11px]">
                            {u.equipamentosCount || 0}
                          </span>
                        </td>
                        <td className="py-3 px-3 text-center">
                          <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-300 font-mono text-[11px]">
                            {u.chamadosCount || 0}
                          </span>
                        </td>
                        <td className="py-3 px-3 text-right">
                          <button
                            type="button"
                            onClick={() => handleAbrirEditarCidade(u)}
                            className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-cyan-300 hover:text-white border border-white/10 text-xs font-semibold transition inline-flex items-center gap-1.5"
                            title="Alterar município de vínculo"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                            <span>Alterar Cidade</span>
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ------------------------------------------------------------- */}
        {/* TAB 6: PARÂMETROS OPERACIONAIS DO CONTRATO VIGENTE (SLAs & GARANTIA) */}
        {/* ------------------------------------------------------------- */}
        {activeTab === 'parametros' && (
          <div className="space-y-6 animate-in fade-in">
            {/* Header com Dados do Contrato Vigente */}
            <div className="bg-gradient-to-r from-amber-950 via-slate-900 to-slate-950 border border-amber-500/30 rounded-2xl p-6 shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <span className="px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40 text-xs font-bold flex items-center gap-1">
                    <Sliders className="w-3.5 h-3.5 text-amber-400" /> Parâmetros do Contrato Vigente
                  </span>
                  <span className="text-xs text-slate-400">
                    Contrato nº <strong>{contratoData?.contrato?.numeroContrato || '11/2026'}</strong> • Empresa: <strong>{contratoData?.contrato?.empresa?.razaoSocial || 'L O DOS SANTOS ECOMSER'}</strong>
                  </span>
                </div>
                <h3 className="text-xl font-black text-white">Configuração de SLAs, Prazos de Atendimento e Garantia</h3>
                <p className="text-xs text-slate-300 mt-1 max-w-3xl">
                  Estes parâmetros definem as regras operacionais deste contrato de climatização. Como esses prazos variam entre contratos e <strong>não constam no SGC</strong>, a parametrização e fiscalização do cumprimento ocorrem diretamente neste sistema.
                </p>
              </div>

              <div className="flex flex-col items-end gap-1 bg-slate-950/70 px-4 py-3 rounded-xl border border-white/10 shrink-0">
                <span className="text-[10px] text-slate-400 uppercase font-bold">Vigência Contratual</span>
                <span className="text-xs font-black text-white font-mono">
                  {contratoData?.contrato?.dataInicio ? new Date(contratoData.contrato.dataInicio).toLocaleDateString('pt-BR') : '10/02/2026'} até {contratoData?.contrato?.dataFim ? new Date(contratoData.contrato.dataFim).toLocaleDateString('pt-BR') : '10/02/2027'}
                </span>
                <span className="text-[10px] text-emerald-400 font-medium">Contrato Ativo & Em Execução</span>
              </div>
            </div>

            {/* Mensagem de Feedback de Sucesso */}
            {msgSucessoParametros && (
              <div className="p-4 rounded-xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-xs flex items-center gap-2 animate-in fade-in">
                <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
                <span className="font-semibold">{msgSucessoParametros}</span>
              </div>
            )}

            {/* Formulário Principal de Parametrização */}
            <form onSubmit={handleSalvarParametrosContrato} className="space-y-6">
              {/* Grid com os 5 Parâmetros */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {/* 1. Prazo de Atendimento Regular */}
                <div className="bg-slate-900 border border-white/10 rounded-2xl p-5 shadow-lg space-y-3 relative overflow-hidden flex flex-col justify-between hover:border-cyan-500/30 transition">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="px-2 py-0.5 rounded bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 text-[10px] font-bold uppercase tracking-wider flex items-center gap-1">
                        <Clock className="w-3 h-3 text-cyan-400" /> SLA Regular
                      </span>
                      <span className="text-[11px] text-slate-400 font-mono">Em vigor: <strong>{contratoData?.contrato?.prazoAtendimentoHorasRegular ?? 72}h úteis</strong></span>
                    </div>

                    <h4 className="text-sm font-bold text-white">Prazo de Atendimento Regular</h4>
                    <p className="text-xs text-slate-400 leading-relaxed">
                      Tempo limite para a empresa comparecer à unidade da UERN para vistoria e elaboração da proposta orçamentária em demandas regulares.
                    </p>
                  </div>

                  <div className="pt-2 border-t border-white/5 space-y-1">
                    <label className="block text-[11px] font-bold text-slate-300">Prazo em Horas Úteis</label>
                    <div className="relative">
                      <input
                        type="number"
                        min="1"
                        max="720"
                        value={paramPrazoRegular}
                        onChange={(e) => setParamPrazoRegular(e.target.value)}
                        className="w-full bg-slate-950 border border-white/20 rounded-xl px-3 py-2 text-white font-mono font-bold text-sm outline-none focus:border-cyan-400 transition"
                      />
                      <span className="absolute right-3 top-2.5 text-xs text-slate-400 font-bold">horas úteis</span>
                    </div>
                    <span className="text-[10px] text-slate-500 block">Exemplo padrão: 72 horas úteis (3 dias úteis)</span>
                  </div>
                </div>

                {/* 2. Prazo de Atendimento Urgente */}
                <div className="bg-slate-900 border border-white/10 rounded-2xl p-5 shadow-lg space-y-3 relative overflow-hidden flex flex-col justify-between hover:border-amber-500/30 transition">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30 text-[10px] font-bold uppercase tracking-wider flex items-center gap-1">
                        <Zap className="w-3 h-3 text-amber-400" /> SLA Urgente
                      </span>
                      <span className="text-[11px] text-slate-400 font-mono">Em vigor: <strong>{contratoData?.contrato?.prazoAtendimentoHorasUrgente ?? 24}h úteis</strong></span>
                    </div>

                    <h4 className="text-sm font-bold text-white">Prazo de Atendimento Urgente / Crítico</h4>
                    <p className="text-xs text-slate-400 leading-relaxed">
                      Prazo prioritário reduzido para atendimento emergencial em setores críticos (datacenters, clínicas, biotérios, gabinetes).
                    </p>
                  </div>

                  <div className="pt-2 border-t border-white/5 space-y-1">
                    <label className="block text-[11px] font-bold text-slate-300">Prazo em Horas Úteis</label>
                    <div className="relative">
                      <input
                        type="number"
                        min="1"
                        max="168"
                        value={paramPrazoUrgente}
                        onChange={(e) => setParamPrazoUrgente(e.target.value)}
                        className="w-full bg-slate-950 border border-white/20 rounded-xl px-3 py-2 text-white font-mono font-bold text-sm outline-none focus:border-amber-400 transition"
                      />
                      <span className="absolute right-3 top-2.5 text-xs text-slate-400 font-bold">horas úteis</span>
                    </div>
                    <span className="text-[10px] text-slate-500 block">Exemplo padrão: 24 horas úteis (1 dia útil)</span>
                  </div>
                </div>

                {/* 3. Prazo de Garantia Padrão */}
                <div className="bg-slate-900 border border-white/10 rounded-2xl p-5 shadow-lg space-y-3 relative overflow-hidden flex flex-col justify-between hover:border-emerald-500/30 transition">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[10px] font-bold uppercase tracking-wider flex items-center gap-1">
                        <ShieldCheck className="w-3 h-3 text-emerald-400" /> Garantia Legal
                      </span>
                      <span className="text-[11px] text-slate-400 font-mono">Em vigor: <strong>{contratoData?.contrato?.diasGarantiaPadrao ?? 90} dias</strong></span>
                    </div>

                    <h4 className="text-sm font-bold text-white">Prazo de Garantia das Intervenções</h4>
                    <p className="text-xs text-slate-400 leading-relaxed">
                      Período de garantia contratual obrigatória sobre serviços e peças. Se o aparelho reincidir no mesmo defeito neste prazo, o reparo tem custo R$ 0,00.
                    </p>
                  </div>

                  <div className="pt-2 border-t border-white/5 space-y-1">
                    <label className="block text-[11px] font-bold text-slate-300">Prazo em Dias Corridos</label>
                    <div className="relative">
                      <input
                        type="number"
                        min="1"
                        max="730"
                        value={paramDiasGarantia}
                        onChange={(e) => setParamDiasGarantia(e.target.value)}
                        className="w-full bg-slate-950 border border-white/20 rounded-xl px-3 py-2 text-white font-mono font-bold text-sm outline-none focus:border-emerald-400 transition"
                      />
                      <span className="absolute right-3 top-2.5 text-xs text-slate-400 font-bold">dias corridos</span>
                    </div>
                    <span className="text-[10px] text-slate-500 block">Exemplo padrão: 90 dias corridos</span>
                  </div>
                </div>

                {/* 4. Prazo para Ateste do Demandante */}
                <div className="bg-slate-900 border border-white/10 rounded-2xl p-5 shadow-lg space-y-3 relative overflow-hidden flex flex-col justify-between hover:border-blue-500/30 transition">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="px-2 py-0.5 rounded bg-blue-500/20 text-blue-300 border border-blue-500/30 text-[10px] font-bold uppercase tracking-wider flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3 text-blue-400" /> Ateste & Homologação
                      </span>
                      <span className="text-[11px] text-slate-400 font-mono">Em vigor: <strong>{contratoData?.contrato?.diasPrazoAtesteDemandante ?? 5} dias úteis</strong></span>
                    </div>

                    <h4 className="text-sm font-bold text-white">Prazo para Ateste do Demandante</h4>
                    <p className="text-xs text-slate-400 leading-relaxed">
                      Tempo concedido ao demandante da unidade para homologar a conclusão do serviço. Decorrido sem manifestação, o sistema opera o aceite tácito.
                    </p>
                  </div>

                  <div className="pt-2 border-t border-white/5 space-y-1">
                    <label className="block text-[11px] font-bold text-slate-300">Prazo em Dias Úteis</label>
                    <div className="relative">
                      <input
                        type="number"
                        min="1"
                        max="60"
                        value={paramDiasAteste}
                        onChange={(e) => setParamDiasAteste(e.target.value)}
                        className="w-full bg-slate-950 border border-white/20 rounded-xl px-3 py-2 text-white font-mono font-bold text-sm outline-none focus:border-blue-400 transition"
                      />
                      <span className="absolute right-3 top-2.5 text-xs text-slate-400 font-bold">dias úteis</span>
                    </div>
                    <span className="text-[10px] text-slate-500 block">Exemplo padrão: 5 dias úteis para aceite tácito</span>
                  </div>
                </div>

                {/* 5. Alçada para Aprovação Automática de Orçamentos */}
                <div className="bg-slate-900 border border-white/10 rounded-2xl p-5 shadow-lg space-y-3 relative overflow-hidden flex flex-col justify-between hover:border-purple-500/30 transition md:col-span-2">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="px-2 py-0.5 rounded bg-purple-500/20 text-purple-300 border border-purple-500/30 text-[10px] font-bold uppercase tracking-wider flex items-center gap-1">
                        <DollarSign className="w-3 h-3 text-purple-400" /> Regra de Alçada
                      </span>
                      <span className="text-[11px] text-slate-400 font-mono">
                        Em vigor: <strong>R$ {Number(contratoData?.contrato?.limiteAprovacaoAutomatica || 1000).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</strong>
                      </span>
                    </div>

                    <h4 className="text-sm font-bold text-white">Limite de Aprovação Automática de Orçamentos</h4>
                    <p className="text-xs text-slate-400 leading-relaxed">
                      Orçamentos cadastrados pela empresa até este teto seguem automaticamente para execução. Acima deste montante, o chamado é retido exigindo despacho expresso da <strong>Fiscalização Administrativa</strong> ou do <strong>Gestor do Contrato</strong>.
                    </p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-white/5">
                    <div>
                      <label className="block text-[11px] font-bold text-slate-300 mb-1">Teto Máximo Automático (R$)</label>
                      <div className="relative">
                        <span className="absolute left-3 top-2.5 text-xs text-slate-500 font-bold">R$</span>
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          value={limiteAprovacao}
                          onChange={(e) => setLimiteAprovacao(e.target.value)}
                          className="w-full bg-slate-950 border border-white/20 rounded-xl pl-9 pr-3 py-2 text-white font-mono font-bold text-sm outline-none focus:border-purple-400 transition"
                        />
                      </div>
                      <span className="text-[10px] text-slate-500 mt-0.5 block">Padrão UERN: R$ 1.000,00</span>
                    </div>

                    <div className="text-[11px] text-slate-300 flex flex-col justify-center space-y-1 bg-slate-950/60 p-2.5 rounded-xl border border-white/5">
                      <span className="text-emerald-400 font-semibold flex items-center gap-1">
                        <Check className="w-3.5 h-3.5" /> Até R$ {parseFloat(limiteAprovacao || '0').toLocaleString('pt-BR', { minimumFractionDigits: 2 })}: Aprovação Direta
                      </span>
                      <span className="text-amber-300 font-semibold flex items-center gap-1">
                        <AlertCircle className="w-3.5 h-3.5" /> Acima deste valor: Exige Fiscalização / Gestor
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Botão de Gravação de Todos os Parâmetros */}
              <div className="flex flex-col sm:flex-row justify-between items-center gap-3 bg-slate-900 border border-white/10 rounded-2xl p-4 shadow-xl">
                <span className="text-xs text-slate-400 text-center sm:text-left">
                  Alterações aplicam-se imediatamente a todos os novos chamados e cotações deste contrato.
                </span>
                <button
                  type="submit"
                  disabled={salvandoParametros}
                  className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black text-xs shadow-lg transition flex items-center gap-2 disabled:opacity-50"
                >
                  <CheckCircle2 className={`w-4 h-4 ${salvandoParametros ? 'animate-spin' : ''}`} />
                  <span>{salvandoParametros ? 'Salvando Parâmetros...' : 'Salvar Todos os Parâmetros'}</span>
                </button>
              </div>
            </form>

            {/* SEÇÃO DE AUDITORIA FINANCEIRA & RESTAURAÇÃO DE SALDO (R$ 740,00) */}
            <div className="bg-slate-900 border border-white/10 rounded-2xl p-6 shadow-xl space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/10 pb-4">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="px-2.5 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 text-[10px] font-bold uppercase tracking-wider flex items-center gap-1">
                      <DollarSign className="w-3 h-3 text-cyan-400" /> Auditoria & Controle de Dotação
                    </span>
                    <span className="text-xs text-slate-400">Origem do Saldo Consumido</span>
                  </div>
                  <h4 className="text-base font-black text-white flex items-center gap-2">
                    <ShieldCheck className="w-5 h-5 text-cyan-400" />
                    <span>Auditoria do Consumo Contratual & Chamados Vinculados</span>
                  </h4>
                  <p className="text-xs text-slate-300 mt-1 max-w-3xl">
                    Verificação e rastreabilidade total do valor consumido de <strong>R$ {contratoData?.contrato?.totalConsumido?.toLocaleString('pt-BR', { minimumFractionDigits: 2 }) || '740,00'}</strong> no saldo deste contrato.
                  </p>
                </div>

                <div className="text-left sm:text-right bg-slate-950/60 p-3 rounded-xl border border-white/10 sm:border-none sm:bg-transparent sm:p-0">
                  <div className="text-[11px] text-slate-400 uppercase font-semibold">Saldo Atual Disponível</div>
                  <div className="text-xl font-black text-emerald-400 font-mono">
                    R$ {contratoData?.contrato?.saldoDisponivel?.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </div>
                </div>
              </div>

              {/* Caixa Explicativa dos R$ 740,00 */}
              <div className="p-4 rounded-xl bg-slate-950 border border-cyan-500/30 text-xs text-slate-300 space-y-2.5">
                <div className="font-bold text-white flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-cyan-400" />
                  <span>Esclarecimento Técnico sobre o valor de R$ 740,00:</span>
                </div>
                <p className="leading-relaxed">
                  Não existe nenhum lançamento órfão ou serviço sem chamado no banco de dados. O valor consumido de <strong>R$ 740,00</strong> decorre exatamente dos dois chamados de demonstração cadastrados no povoamento inicial (seed) do sistema:
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                  <div className="p-3 rounded-lg bg-slate-900 border border-white/5 space-y-1">
                    <div className="flex justify-between font-bold">
                      <span className="text-cyan-300 font-mono">CLIMA-2026-00001</span>
                      <span className="text-amber-300 font-mono">R$ 240,00</span>
                    </div>
                    <div className="text-[11px] text-slate-400">FAFIC • Sala 04 (Aguardando Confirmação)</div>
                  </div>
                  <div className="p-3 rounded-lg bg-slate-900 border border-white/5 space-y-1">
                    <div className="flex justify-between font-bold">
                      <span className="text-cyan-300 font-mono">CLIMA-2026-00002</span>
                      <span className="text-amber-300 font-mono">R$ 500,00</span>
                    </div>
                    <div className="text-[11px] text-slate-400">PROAD • Gabinete (Aprovado em Execução)</div>
                  </div>
                </div>
                <p className="text-[11px] text-slate-400 pt-1">
                  Caso queira iniciar o sistema com <strong>100% do saldo íntegro (R$ 0,00 consumido)</strong>, você pode excluir esses chamados de teste com um clique no botão abaixo:
                </p>
              </div>

              {/* Botões de Ação de Auditoria */}
              <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setModalExtratoConsumoOpen(true)}
                  className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs border border-white/10 transition flex items-center gap-2"
                >
                  <FileText className="w-4 h-4 text-cyan-400" />
                  <span>Ver Extrato Completo de Chamados</span>
                </button>

                <button
                  type="button"
                  onClick={handleZerarSaldoDemonstrativo}
                  disabled={zerandoSaldo}
                  className="px-5 py-2.5 rounded-xl bg-red-600/20 hover:bg-red-600/30 text-red-300 border border-red-500/40 font-bold text-xs transition flex items-center gap-2 disabled:opacity-50"
                  title="Remove os chamados de teste do seed, liberando as máquinas de volta para ATIVO e restaurando o saldo para R$ 1.166.605,42"
                >
                  <RefreshCw className={`w-4 h-4 text-red-400 ${zerandoSaldo ? 'animate-spin' : ''}`} />
                  <span>{zerandoSaldo ? 'Restaurando Saldo...' : 'Zerar Consumo Demonstrativo (Restaurar Saldo Integral)'}</span>
                </button>
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
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-xs font-black text-cyan-400 font-mono">{chamadoDetalhe.numeroProtocolo}</span>
                  <span className="text-xs px-2.5 py-0.5 rounded-lg bg-slate-800 text-slate-300 font-semibold flex items-center gap-1">
                    <MapPin className="w-3 h-3 text-cyan-400" />
                    <span>{chamadoDetalhe.unidade?.sigla} ({chamadoDetalhe.unidade?.cidade || 'Mossoró'})</span>
                  </span>
                  {(chamadoDetalhe.ambiente || chamadoDetalhe.tipoAmbiente) && (
                    <span className="text-xs px-2.5 py-0.5 rounded-lg bg-blue-950/80 text-blue-300 border border-blue-500/30 flex items-center gap-1 font-medium">
                      <Building2 className="w-3 h-3 text-cyan-400" />
                      <span>{chamadoDetalhe.ambiente?.descricaoDetalhe || formatTipoAmbiente(chamadoDetalhe.tipoAmbiente)}</span>
                    </span>
                  )}
                  {chamadoDetalhe.isAmbientePrioritario && (
                    <span className="text-[10px] px-2.5 py-0.5 rounded-full bg-red-600/30 text-red-300 border border-red-500/50 font-black uppercase flex items-center gap-1 animate-pulse">
                      <AlertTriangle className="w-3 h-3 text-red-400" />
                      Prioridade Operacional
                    </span>
                  )}
                </div>
                <h3 className="text-lg font-bold text-white mt-1.5">{chamadoDetalhe.tituloDemanda}</h3>
              </div>

              <button
                type="button"
                onClick={() => setChamadoDetalhe(null)}
                className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            {/* Banner de Prioridade Operacional Contratual */}
            {chamadoDetalhe.isAmbientePrioritario && (
              <div className="p-3.5 rounded-xl bg-gradient-to-r from-red-950/80 via-amber-950/40 to-slate-900 border border-red-500/50 flex items-start gap-3">
                <div className="p-2 rounded-lg bg-red-500/20 text-red-400 border border-red-500/40 shrink-0 mt-0.5">
                  <AlertTriangle className="w-4 h-4" />
                </div>
                <div className="flex-1 text-xs space-y-0.5">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-black text-red-400 uppercase tracking-wide">
                      Demanda com Prioridade Operacional Contratual
                    </span>
                    <span className="text-[11px] px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30 font-semibold">
                      {formatTipoAmbiente(chamadoDetalhe.ambiente?.tipo || chamadoDetalhe.tipoAmbiente)}
                    </span>
                  </div>
                  <p className="text-slate-300 leading-relaxed">
                    Local: <strong>{chamadoDetalhe.ambiente?.descricaoDetalhe || chamadoDetalhe.tituloDemanda}</strong> ({chamadoDetalhe.unidade?.sigla} • Município: <strong>{chamadoDetalhe.unidade?.cidade || 'Mossoró'}</strong>). Conforme diretriz contratual, a empresa prestadora deve dar prioridade imediata ao atendimento desta demanda para evitar interrupção de aulas ou prejuízo a experimentos de pesquisa ininterruptos.
                  </p>
                </div>
              </div>
            )}

            {/* Banner Oficial de Máquina Condenada / Laudo de Inservibilidade */}
            {chamadoDetalhe.intervencoes?.some((it: any) => it.maquinaCondenada) && (
              <div className="p-4 rounded-xl bg-gradient-to-r from-red-950/90 via-amber-950/50 to-slate-900 border-2 border-red-500/60 shadow-xl space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                  <div className="flex items-start gap-3">
                    <div className="p-2.5 rounded-xl bg-red-500/20 text-red-400 border border-red-500/40 shrink-0">
                      <AlertTriangle className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="px-2 py-0.5 rounded bg-red-600 text-white font-black text-[10px] tracking-wide uppercase">
                          Equipamento Condenado / Inservível
                        </span>
                        <span className="text-xs text-slate-300">
                          Periciado por: <strong className="text-white">{chamadoDetalhe.intervencoes?.find((i: any) => i.maquinaCondenada)?.nomeTecnicoEmpresa || 'Técnico Autorizado'}</strong>
                        </span>
                        {chamadoDetalhe.intervencoes?.find((i: any) => i.maquinaCondenada)?.cpfTecnicoEmpresa && (
                          <span className="text-xs text-slate-400">
                            (CPF: {chamadoDetalhe.intervencoes?.find((i: any) => i.maquinaCondenada)?.cpfTecnicoEmpresa})
                          </span>
                        )}
                      </div>
                      <h4 className="text-sm font-bold text-white mt-1">
                        Aparelho declarado tecnicamente inservível (sem viabilidade econômica/funcional de conserto)
                      </h4>
                      <p className="text-xs text-slate-200 mt-1 leading-relaxed bg-black/40 p-2.5 rounded-lg border border-white/10 font-mono">
                        "{chamadoDetalhe.intervencoes?.find((i: any) => i.maquinaCondenada)?.laudoTecnico}"
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleGerarPdfLaudoCondenacao(chamadoDetalhe, chamadoDetalhe.intervencoes?.find((i: any) => i.maquinaCondenada))}
                    className="shrink-0 px-4 py-2.5 rounded-xl bg-gradient-to-r from-red-500 to-amber-500 hover:from-red-400 hover:to-amber-400 text-slate-950 font-black text-xs shadow-lg transition flex items-center gap-2 self-start sm:self-center"
                  >
                    <Download className="w-4 h-4" />
                    <span>Baixar Laudo Técnico Oficial (PDF)</span>
                  </button>
                </div>

                <div className="flex flex-col sm:flex-row sm:items-center justify-between text-[11px] text-slate-400 pt-2 border-t border-white/10 gap-1">
                  <span>Instrução PROAD: <strong className="text-amber-300">Anexar este PDF ao processo no SEI para abertura de pedido de máquina substituta</strong></span>
                  <span className="text-slate-400">Status no Inventário: <span className="text-red-400 font-bold">BAIXADO_INSERVIVEL</span></span>
                </div>
              </div>
            )}

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
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-white">
                          Tombo {it.equipamento?.tombo} • {it.equipamento?.marca} ({it.categoriaServico})
                        </span>
                        {it.maquinaCondenada && (
                          <span className="text-[10px] px-2 py-0.5 rounded bg-red-500/20 text-red-300 border border-red-500/40 font-bold">
                            ⚠️ Inservível / Condenado
                          </span>
                        )}
                      </div>
                      {it.valorTotalIntervencao > 0 ? (
                        <span className="text-amber-300 font-bold">R$ {it.valorTotalIntervencao.toFixed(2)}</span>
                      ) : it.maquinaCondenada ? (
                        <button
                          type="button"
                          onClick={() => handleGerarPdfLaudoCondenacao(chamadoDetalhe, it)}
                          className="px-2.5 py-1 rounded-lg bg-red-500/20 hover:bg-red-500/30 text-red-300 border border-red-500/40 font-bold text-[11px] flex items-center gap-1"
                        >
                          <FileText className="w-3 h-3 text-red-400" />
                          <span>PDF do Laudo</span>
                        </button>
                      ) : null}
                    </div>
                    <div className="text-slate-400">Localização: {it.equipamento?.localizacao}</div>
                    {it.laudoTecnico && (
                      <div className="text-cyan-300 pt-1 text-[11px] leading-relaxed">
                        <strong className="text-slate-300">Laudo Técnico:</strong> {it.laudoTecnico}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* PAINEL DE LAUDO TÉCNICO INICIAL & PARECER DA ENGENHARIA (SOBE) */}
            {(chamadoDetalhe.requerAprovacaoPrevia ||
              chamadoDetalhe.laudoInicialEmpresa ||
              chamadoDetalhe.despachoSobeMotivo ||
              chamadoDetalhe.parecerSobeTexto ||
              ['AGUARDANDO_ANALISE_LAUDO', 'ENCAMINHADO_ENGENHARIA', 'PARECER_ENGENHARIA_EMITIDO'].includes(chamadoDetalhe.status)) && (
              <div className="p-4 rounded-xl bg-slate-900/90 border border-amber-500/30 space-y-3.5 shadow-md">
                <div className="flex items-center justify-between border-b border-white/10 pb-2">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-amber-400 flex items-center gap-1.5">
                    <FileText className="w-4 h-4 text-amber-400" />
                    <span>Processo de Análise Técnica: Laudo Preliminar & Parecer SOBE</span>
                  </h4>
                  {chamadoDetalhe.status === 'AGUARDANDO_ANALISE_LAUDO' && (
                    <span className="text-[10px] px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40 font-bold">
                      Aguardando Decisão do Fiscal
                    </span>
                  )}
                  {chamadoDetalhe.status === 'ENCAMINHADO_ENGENHARIA' && (
                    <span className="text-[10px] px-2.5 py-0.5 rounded-full bg-blue-500/20 text-blue-300 border border-blue-500/40 font-bold animate-pulse">
                      Em Análise na Engenharia (SOBE)
                    </span>
                  )}
                  {chamadoDetalhe.status === 'PARECER_ENGENHARIA_EMITIDO' && (
                    <span className="text-[10px] px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 font-bold">
                      Parecer SOBE Emitido
                    </span>
                  )}
                </div>

                {/* 1. Laudo da Empresa */}
                {chamadoDetalhe.laudoInicialEmpresa && (
                  <div className="p-3 rounded-lg bg-slate-950 border border-white/10 text-xs space-y-1.5">
                    <div className="flex justify-between items-center text-slate-300">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-white">📋 Laudo Técnico da Contratada</span>
                        <span className="text-[10px] px-2 py-0.5 rounded bg-amber-500/10 text-amber-300 border border-amber-500/30 font-semibold">
                          {chamadoDetalhe.motivoRequerAprovacao === 'CUSTO_ELEVADO'
                            ? '💰 Custo Elevado (> Limite Contratual)'
                            : chamadoDetalhe.motivoRequerAprovacao === 'ALTA_COMPLEXIDADE'
                            ? '⚙️ Alta Complexidade Técnica'
                            : chamadoDetalhe.motivoRequerAprovacao === 'INFRAESTRUTURA'
                            ? '🏗️ Intervenção Estrutural/Elétrica'
                            : '⚠️ Requer Autorização Prévia'}
                        </span>
                      </div>
                      {chamadoDetalhe.laudoInicialCustoEstimado && (
                        <span className="text-amber-400 font-bold font-mono">
                          Estimativa: R$ {Number(chamadoDetalhe.laudoInicialCustoEstimado).toFixed(2)}
                        </span>
                      )}
                    </div>
                    <p className="text-slate-300 leading-relaxed bg-slate-900/60 p-2.5 rounded-lg border border-white/5 whitespace-pre-wrap">
                      {chamadoDetalhe.laudoInicialEmpresa}
                    </p>
                    <div className="text-[10px] text-slate-500 flex items-center justify-between">
                      <span>Responsável: {chamadoDetalhe.laudoEnviadoPor || 'Empresa Prestadora'}</span>
                      {chamadoDetalhe.laudoEnviadoEm && (
                        <span>Enviado em: {new Date(chamadoDetalhe.laudoEnviadoEm).toLocaleString('pt-BR')}</span>
                      )}
                    </div>
                  </div>
                )}

                {/* 2. Despacho para SOBE */}
                {chamadoDetalhe.despachoSobeMotivo && (
                  <div className="p-3 rounded-lg bg-blue-950/40 border border-blue-500/30 text-xs space-y-1.5">
                    <div className="flex justify-between items-center text-blue-300">
                      <span className="font-bold flex items-center gap-1.5">
                        <Share2 className="w-3.5 h-3.5 text-blue-400" />
                        <span>Despacho da Fiscalização Técnica para a Engenharia (SOBE)</span>
                      </span>
                      {chamadoDetalhe.despachadoParaSobeEm && (
                        <span className="text-[10px] text-slate-400">
                          {new Date(chamadoDetalhe.despachadoParaSobeEm).toLocaleString('pt-BR')}
                        </span>
                      )}
                    </div>
                    <p className="text-slate-200 leading-relaxed bg-slate-900/80 p-2.5 rounded-lg border border-blue-500/20 whitespace-pre-wrap">
                      {chamadoDetalhe.despachoSobeMotivo}
                    </p>
                    <div className="text-[10px] text-slate-400">
                      Despachado por: {chamadoDetalhe.despachadoPorFiscal || 'Fiscal Técnico UERN'}
                    </div>
                  </div>
                )}

                {/* 3. Parecer da SOBE */}
                {chamadoDetalhe.parecerSobeTexto && (
                  <div className="p-3 rounded-lg bg-purple-950/40 border border-purple-500/30 text-xs space-y-1.5">
                    <div className="flex justify-between items-center">
                      <span className="font-bold text-purple-300 flex items-center gap-1.5">
                        <CheckCircle2 className="w-3.5 h-3.5 text-purple-400" />
                        <span>Parecer Técnico da Superintendência de Obras e Engenharia (SOBE)</span>
                      </span>
                      <span
                        className={`text-[10px] px-2 py-0.5 rounded-full font-bold border ${
                          chamadoDetalhe.parecerSobeFavoravel
                            ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                            : 'bg-red-500/20 text-red-300 border-red-500/40'
                        }`}
                      >
                        {chamadoDetalhe.parecerSobeFavoravel ? 'Favorável à Execução' : 'Desfavorável / Com Ressalvas'}
                      </span>
                    </div>
                    <p className="text-slate-200 leading-relaxed bg-slate-900/80 p-2.5 rounded-lg border border-purple-500/20 whitespace-pre-wrap">
                      {chamadoDetalhe.parecerSobeTexto}
                    </p>
                    <div className="text-[10px] text-slate-400 flex items-center justify-between">
                      <span>Engenheiro: {chamadoDetalhe.parecerSobeResponsavel || 'Engenharia SOBE'}</span>
                      {chamadoDetalhe.parecerSobeEm && (
                        <span>Emitido em: {new Date(chamadoDetalhe.parecerSobeEm).toLocaleString('pt-BR')}</span>
                      )}
                    </div>
                  </div>
                )}

                {/* 4. Decisão da Fiscalização */}
                {chamadoDetalhe.decisaoLaudoFiscal && (
                  <div className="p-2.5 rounded-lg bg-slate-950 border border-white/10 text-xs flex items-center justify-between">
                    <div>
                      <span className="text-slate-400">Decisão da Fiscalização Técnica: </span>
                      <strong className={chamadoDetalhe.decisaoLaudoFiscal === 'APROVADO' ? 'text-emerald-400' : 'text-red-400'}>
                        {chamadoDetalhe.decisaoLaudoFiscal === 'APROVADO' ? 'Laudo Aprovado (Execução Autorizada)' : 'Laudo Reprovado (Chamado Encerrado)'}
                      </strong>
                      {chamadoDetalhe.decisaoLaudoMotivo && (
                        <p className="text-slate-300 text-[11px] mt-0.5">{chamadoDetalhe.decisaoLaudoMotivo}</p>
                      )}
                    </div>
                    {chamadoDetalhe.decisaoLaudoEm && (
                      <span className="text-[10px] text-slate-500">
                        {new Date(chamadoDetalhe.decisaoLaudoEm).toLocaleDateString('pt-BR')}
                      </span>
                    )}
                  </div>
                )}
              </div>
            )}

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

            {/* PAINEL DE AÇÕES CONTEXTUAIS POR PAPEL (CONFORME FLUXOGRAMA OFICIAL) */}
            <div className="p-4 rounded-xl bg-slate-950 border border-cyan-500/30 flex flex-wrap items-center justify-between gap-3">
              <div className="text-xs text-slate-300">
                Ações disponíveis para seu perfil ({currentUser?.role}):
              </div>

              <div className="flex flex-wrap gap-2">
                {/* 1. FISCAL TÉCNICO & ADMIN: Autorização Inicial, Análise de Laudo e Decisão com SOBE */}
                {(['FISCAL_TECNICO', 'ADMIN'].includes(currentUser?.role)) && (
                  <>
                    {/* Passo 2: Autorizar chamado para a contratada */}
                    {['ABERTO', 'AGUARDANDO_AUTORIZACAO_FISCAL'].includes(chamadoDetalhe.status) && (
                      <button
                        type="button"
                        onClick={() => handleAutorizarChamado(chamadoDetalhe.id)}
                        disabled={salvandoLaudoAcao}
                        className="px-3.5 py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs flex items-center gap-1.5 shadow-md transition"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Autorizar Chamado para Contratada</span>
                      </button>
                    )}

                    {/* Passos 7 e 8: Analisar Laudo (Aprovar / Despachar SOBE / Reprovar) */}
                    {['AGUARDANDO_ANALISE_LAUDO', 'PARECER_ENGENHARIA_EMITIDO'].includes(chamadoDetalhe.status) && (
                      <>
                        <button
                          type="button"
                          onClick={handleAprovarLaudoFiscal}
                          disabled={salvandoLaudoAcao}
                          className="px-3.5 py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs flex items-center gap-1.5 shadow-md transition"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Aprovar Laudo e Liberar Execução</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => setModalDespachoSobe(true)}
                          disabled={salvandoLaudoAcao}
                          className="px-3.5 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-md transition"
                        >
                          <Share2 className="w-3.5 h-3.5" />
                          <span>Despachar para Engenharia (SOBE)</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => setModalReprovarLaudo(true)}
                          disabled={salvandoLaudoAcao}
                          className="px-3 py-1.5 rounded-lg bg-red-600/20 hover:bg-red-600/30 text-red-300 border border-red-500/40 font-bold text-xs flex items-center gap-1.5 transition"
                        >
                          <XCircle className="w-3.5 h-3.5" />
                          <span>Reprovar Laudo / Encerrar</span>
                        </button>
                      </>
                    )}

                    {/* Passos 17, 19 e 20: Analisar Orçamento pós-ateste e Fazer Ateste Final */}
                    {chamadoDetalhe.status === 'ORCAMENTO_ANEXADO' && (
                      <>
                        <button
                          type="button"
                          onClick={() => handleAprovarOrcamento('APROVAR')}
                          className="px-3.5 py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs flex items-center gap-1.5 shadow-md"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Aprovar Orçamento e Fazer Ateste (R$ {chamadoDetalhe.orcamentoValorTotal?.toFixed(2)})</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => handleAprovarOrcamento('REJEITAR')}
                          className="px-3 py-1.5 rounded-lg bg-red-500/20 text-red-300 border border-red-500/40 text-xs font-bold"
                        >
                          Rejeitar Orçamento
                        </button>
                      </>
                    )}
                  </>
                )}

                {/* 2. SUPERINTENDÊNCIA DE OBRAS E ENGENHARIA (SOBE) & ADMIN: Parecer Técnico */}
                {(['ENGENHARIA_SOBE', 'ADMIN'].includes(currentUser?.role)) &&
                  chamadoDetalhe.status === 'ENCAMINHADO_ENGENHARIA' && (
                    <button
                      type="button"
                      onClick={() => setModalParecerSobe(true)}
                      className="px-3.5 py-1.5 rounded-lg bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-black text-xs flex items-center gap-1.5 shadow-lg transition"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Emitir Parecer Técnico da SOBE</span>
                    </button>
                )}

                {/* 3. EMPRESA (CONTRATADA) & ADMIN: Triagem de Complexidade, Laudo, Execução e Orçamento */}
                {(['EMPRESA', 'ADMIN'].includes(currentUser?.role)) && (
                  <>
                    {/* Passos 3 e 4: Analisar chamado -> Precisa de aprovação? */}
                    {['EM_TRIAGEM', 'ABERTO'].includes(chamadoDetalhe.status) && (
                      <>
                        <button
                          type="button"
                          onClick={() => handleExecutarDireto(chamadoDetalhe.id)}
                          disabled={salvandoLaudoAcao}
                          className="px-3 py-1.5 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs flex items-center gap-1.5 shadow-md transition"
                          title="Iniciar execução imediata quando não necessitar de aprovação prévia (manutenção simples dentro do teto)"
                        >
                          <Wrench className="w-3.5 h-3.5" />
                          <span>Executar Serviço Direto (Manutenção Simples)</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => setModalLaudoEmpresa(true)}
                          disabled={salvandoLaudoAcao}
                          className="px-3 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs flex items-center gap-1.5 shadow-md transition"
                          title="Quando envolver alta complexidade técnica ou manutenção estimada cara acima do teto"
                        >
                          <FileText className="w-3.5 h-3.5" />
                          <span>Elaborar Laudo Técnico (Requer Aprovação)</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => handleAbrirModalCondenar(chamadoDetalhe)}
                          className="px-3 py-1.5 rounded-lg bg-red-600/90 hover:bg-red-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-md transition"
                        >
                          <AlertTriangle className="w-3.5 h-3.5" />
                          <span>Declarar Máquina Condenada (Laudo)</span>
                        </button>
                      </>
                    )}

                    {/* Passo 5: Concluir Execução */}
                    {chamadoDetalhe.status === 'APROVADO_EM_EXECUCAO' && (
                      <button
                        type="button"
                        onClick={() => setModalExecucao(true)}
                        className="px-3.5 py-1.5 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs flex items-center gap-1.5 shadow-md"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Concluir Execução & Anexar Fotos</span>
                      </button>
                    )}

                    {/* Passo 16: Elaborar Orçamento pós-aprovação da solução pelo demandante */}
                    {['CONFIRMADO_PELO_DEMANDANTE', 'CONFIRMADO_TACITAMENTE', 'AGUARDANDO_ORCAMENTO', 'ORCAMENTO_REJEITADO'].includes(chamadoDetalhe.status) && (
                      <button
                        type="button"
                        onClick={() => setModalOrcamento(true)}
                        className="px-3.5 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs flex items-center gap-1.5 shadow-md transition"
                      >
                        <DollarSign className="w-3.5 h-3.5" />
                        <span>Montar Orçamento com Itens SGC</span>
                      </button>
                    )}
                  </>
                )}

                {/* 4. DEMANDANTE & ADMIN: Analisar Solução e Atestar */}
                {(['DEMANDANTE', 'ADMIN'].includes(currentUser?.role)) &&
                  chamadoDetalhe.status === 'AGUARDANDO_CONFIRMACAO' && (
                    <>
                      <button
                        type="button"
                        onClick={() => setModalAteste(true)}
                        className="px-3.5 py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs flex items-center gap-1.5 shadow-md"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Atestar Digitalmente (Solução Aprovada)</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setModalRejeicao(true)}
                        className="px-3 py-1.5 rounded-lg bg-red-500/20 hover:bg-red-500/30 text-red-300 border border-red-500/40 text-xs font-bold flex items-center gap-1"
                      >
                        <XCircle className="w-3.5 h-3.5" />
                        <span>Rejeitar Solução (Reenviar Serviço)</span>
                      </button>
                    </>
                )}

                {/* Botão permanente de baixar laudo oficial de condenação se máquina condenada */}
                {chamadoDetalhe.intervencoes?.some((i: any) => i.maquinaCondenada) && (
                  <button
                    type="button"
                    onClick={() => handleGerarPdfLaudoCondenacao(chamadoDetalhe, chamadoDetalhe.intervencoes?.find((i: any) => i.maquinaCondenada))}
                    className="px-3.5 py-1.5 rounded-lg bg-gradient-to-r from-red-600 to-amber-600 hover:from-red-500 hover:to-amber-500 text-white font-black text-xs flex items-center gap-1.5 shadow-md transition"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Baixar Laudo Técnico Oficial (PDF)</span>
                  </button>
                )}

                {/* 5. Ações Administrativas Gerais do ADMIN */}
                {currentUser?.role === 'ADMIN' && (
                  <div className="flex flex-wrap items-center gap-2 pl-2 border-l border-white/10">
                    <button
                      type="button"
                      onClick={() => handleAbrirEdicaoChamado(chamadoDetalhe)}
                      className="px-3 py-1.5 rounded-lg bg-purple-500/20 hover:bg-purple-500/30 border border-purple-500/40 text-purple-300 font-bold text-xs flex items-center gap-1.5"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                      <span>Editar</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleExcluirChamado(chamadoDetalhe.id, chamadoDetalhe.numeroProtocolo)}
                      className="px-3 py-1.5 rounded-lg bg-red-500/20 hover:bg-red-500/30 border border-red-500/40 text-red-300 font-bold text-xs flex items-center gap-1.5"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Excluir</span>
                    </button>

                    {/* Seletor rápido de Status pelo Admin */}
                    <div className="flex items-center gap-1.5 bg-slate-900 border border-white/15 px-2 py-1 rounded-lg">
                      <span className="text-[11px] text-slate-400">Status:</span>
                      <select
                        value={chamadoDetalhe.status}
                        onChange={(e) => handleAlterarStatusDireto(e.target.value)}
                        className="bg-transparent text-cyan-300 text-xs font-bold outline-none cursor-pointer"
                      >
                        <option value="ABERTO" className="bg-slate-900 text-white">Aberto</option>
                        <option value="EM_TRIAGEM" className="bg-slate-900 text-white">Em Triagem</option>
                        <option value="AGUARDANDO_ANALISE_LAUDO" className="bg-slate-900 text-white">Aguardando Análise Laudo</option>
                        <option value="ENCAMINHADO_ENGENHARIA" className="bg-slate-900 text-white">Encaminhado Engenharia (SOBE)</option>
                        <option value="PARECER_ENGENHARIA_EMITIDO" className="bg-slate-900 text-white">Parecer SOBE Emitido</option>
                        <option value="APROVADO_EM_EXECUCAO" className="bg-slate-900 text-white">Aprovado em Execução</option>
                        <option value="AGUARDANDO_CONFIRMACAO" className="bg-slate-900 text-white">Aguardando Confirmação</option>
                        <option value="ORCAMENTO_ANEXADO" className="bg-slate-900 text-white">Orçamento Anexado</option>
                        <option value="FINALIZADO" className="bg-slate-900 text-white">Finalizado</option>
                        <option value="CANCELADO" className="bg-slate-900 text-white">Cancelado</option>
                      </select>
                    </div>
                  </div>
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

            <div className="flex justify-between items-center text-xs text-slate-300">
              <span>Selecione as quantidades aplicadas da planilha oficial do SGC:</span>
              <span className="text-cyan-300 font-semibold">{contratoData?.contrato?.itensPreco?.length || 0} itens disponíveis</span>
            </div>

            {/* Atalho para Declaração de Condenação Técnica */}
            <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/30 flex items-center justify-between text-xs gap-2">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-red-400 shrink-0" />
                <span className="text-slate-300">
                  O aparelho não possui conserto ou não compensa consertar?
                </span>
              </div>
              <button
                type="button"
                onClick={() => {
                  setModalOrcamento(false);
                  handleAbrirModalCondenar(chamadoDetalhe);
                }}
                className="px-2.5 py-1.5 rounded-lg bg-red-600/90 hover:bg-red-500 text-white font-bold text-[11px] shrink-0 flex items-center gap-1 shadow transition"
              >
                <AlertTriangle className="w-3 h-3" />
                <span>Declarar Condenada com Laudo</span>
              </button>
            </div>

            {/* Barra de Busca de Itens & Chips de Cidade/Campus */}
            <div className="space-y-2">
              <div className="relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  placeholder="Pesquisar item, serviço ou cidade na planilha..."
                  value={buscaItemOrcamento}
                  onChange={(e) => setBuscaItemOrcamento(e.target.value)}
                  className="w-full bg-slate-950 border border-white/15 rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500/50"
                />
              </div>

              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-[11px] scrollbar-thin">
                {['TODOS', 'Mossoró', 'Assu', 'Pau dos Ferros', 'Patu', 'Natal', 'Caicó', 'Split', 'Preventiva'].map((chip) => (
                  <button
                    key={chip}
                    type="button"
                    onClick={() => setCidadeFiltroOrcamento(chip)}
                    className={`px-2.5 py-0.5 rounded-full border transition whitespace-nowrap ${
                      cidadeFiltroOrcamento === chip
                        ? 'bg-amber-500/20 text-amber-300 border-amber-500/40 font-bold'
                        : 'bg-slate-800/60 text-slate-400 border-white/10 hover:text-white'
                    }`}
                  >
                    {chip}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
              {contratoData?.contrato?.itensPreco
                ?.filter((item: any) => {
                  const matchBusca = !buscaItemOrcamento ||
                    item.descricao.toLowerCase().includes(buscaItemOrcamento.toLowerCase()) ||
                    String(item.numeroItem).includes(buscaItemOrcamento);
                  const matchCampus = cidadeFiltroOrcamento === 'TODOS' ||
                    (item.descricao && item.descricao.toLowerCase().includes(cidadeFiltroOrcamento.toLowerCase())) ||
                    (item.codigo && item.codigo.toLowerCase().includes(cidadeFiltroOrcamento.toLowerCase()));
                  return matchBusca && matchCampus;
                })
                .map((item: any) => (
                  <div
                    key={item.id}
                    className="flex items-center justify-between p-2.5 rounded-xl bg-slate-950 border border-white/10 text-xs hover:border-white/20 transition"
                  >
                    <div className="flex-1 pr-3">
                      <div className="flex items-center gap-1.5 mb-0.5">
                        <span className="text-[10px] font-mono font-bold bg-slate-800 text-cyan-300 px-1.5 py-0.5 rounded border border-white/10">
                          Item {item.numeroItem}
                        </span>
                        {item.codigo && item.codigo !== `ITEM-${item.numeroItem}` && (
                          <span className="text-[10px] text-slate-400">({item.codigo})</span>
                        )}
                      </div>
                      <span className="font-semibold text-white leading-snug block">{item.descricao}</span>
                      <div className="text-[11px] text-amber-300 font-bold mt-0.5">
                        R$ {Number(item.valorUnitario).toFixed(2)} / {item.unidadeMedida}
                        {item.saldoQuantidade > 0 && (
                          <span className="text-slate-400 font-normal ml-2 text-[10px]">
                            • Saldo: {item.saldoQuantidade} {item.unidadeMedida}
                          </span>
                        )}
                      </div>
                    </div>

                    <input
                      type="number"
                      min="0"
                      placeholder="Qtd"
                      value={itensOrcados[item.id] || ''}
                      onChange={(e) =>
                        setItensOrcados({ ...itensOrcados, [item.id]: parseFloat(e.target.value) || 0 })
                      }
                      className="w-16 bg-slate-900 border border-white/15 rounded-lg px-2 py-1 text-center text-xs text-white focus:outline-none focus:border-amber-400"
                    />
                  </div>
                ))}
            </div>

            {/* Totalizador em Tempo Real & Indicador da Regra de Alçada */}
            {(() => {
              const totalOrcamento = Object.entries(itensOrcados).reduce((acc, [itemId, qtd]) => {
                const it = contratoData?.contrato?.itensPreco?.find((i: any) => i.id === itemId);
                return acc + (it ? Number(it.valorUnitario) * Number(qtd) : 0);
              }, 0);
              const limiteAtual = Number(contratoData?.contrato?.limiteAprovacaoAutomatica || 1000);
              const isAuto = totalOrcamento > 0 && totalOrcamento <= limiteAtual;

              return (
                <div className="space-y-2">
                  <div className="flex justify-between items-center p-3 rounded-xl bg-slate-950 border border-amber-500/30">
                    <span className="text-xs text-slate-400">Total Previsto da Demanda:</span>
                    <span className="text-sm font-extrabold text-amber-300">
                      R$ {totalOrcamento.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </span>
                  </div>

                  {totalOrcamento > 0 && (
                    <div className={`p-2.5 rounded-xl text-xs flex items-start gap-2 border animate-in fade-in ${
                      isAuto
                        ? 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30'
                        : 'bg-amber-500/10 text-amber-300 border-amber-500/30'
                    }`}>
                      {isAuto ? (
                        <>
                          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                          <div>
                            <strong className="text-emerald-400 font-bold">Aprovação Automática:</strong>
                            <p className="text-[11px] text-slate-300 mt-0.5 leading-relaxed">
                              O valor está dentro do limite configurado de até <strong>R$ {limiteAtual.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</strong>. Ao enviar, o chamado será <strong>aprovado automaticamente</strong> pelo sistema e passará de imediato para a fase de execução.
                            </p>
                          </div>
                        </>
                      ) : (
                        <>
                          <AlertCircle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                          <div>
                            <strong className="text-amber-400 font-bold">Requer Deliberação da Fiscalização:</strong>
                            <p className="text-[11px] text-slate-300 mt-0.5 leading-relaxed">
                              O orçamento ultrapassa o teto automático de <strong>R$ {limiteAtual.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</strong>. Ele será encaminhado para validação formal da <strong>Fiscalização Administrativa</strong> ou do <strong>Gestor do Contrato da UERN</strong>.
                            </p>
                          </div>
                        </>
                      )}
                    </div>
                  )}
                </div>
              );
            })()}

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
                className="px-4 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs shadow-md transition"
              >
                Enviar Orçamento
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
                <label className="block text-xs text-slate-300 mb-1">Técnico da Empresa Responsável</label>
                {usuariosData?.usuarios?.filter((u: any) => u.role === 'EMPRESA' && u.ativo).length > 0 ? (
                  <select
                    value={execucaoTecnicoId}
                    onChange={(e) => {
                      const id = e.target.value;
                      setExecucaoTecnicoId(id);
                      const tec = usuariosData?.usuarios?.find((u: any) => u.id === id);
                      if (tec) {
                        setExecucaoTecnicoNome(tec.nome);
                        setExecucaoTecnicoCpf(tec.cpf);
                      }
                    }}
                    className="w-full bg-slate-950 border border-white/15 rounded-xl p-2 text-xs text-white outline-none cursor-pointer"
                  >
                    <option value="">Selecione o técnico cadastrado...</option>
                    {usuariosData?.usuarios
                      ?.filter((u: any) => u.role === 'EMPRESA' && u.ativo)
                      .map((u: any) => (
                        <option key={u.id} value={u.id}>
                          {u.nome} (CPF: {u.cpf})
                        </option>
                      ))}
                  </select>
                ) : (
                  <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs">
                    Nenhum técnico cadastrado ainda no sistema. O administrador pode cadastrar técnicos na aba <strong>Gestão de Usuários</strong>.
                  </div>
                )}
              </div>

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

      {/* MODAL 1: EMPRESA ELABORA LAUDO TÉCNICO PRELIMINAR (PASSOS 4 E 6) */}
      {modalLaudoEmpresa && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-white/15 rounded-2xl max-w-xl w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <FileText className="w-5 h-5 text-amber-400" />
                <span>Elaborar Laudo Técnico Preliminar (Requer Aprovação)</span>
              </h3>
              <button
                type="button"
                onClick={() => setModalLaudoEmpresa(false)}
                className="text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-slate-300">
              Conforme o fluxograma oficial, quando o serviço envolver <strong>alta complexidade</strong> ou <strong>manutenção cara</strong> (acima do teto de R$ {Number(contratoData?.contrato?.limiteAprovacaoAutomatica || 1000).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}), a empresa deve submeter este Laudo Preliminar para análise da Fiscalização Técnica antes de executar.
            </p>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-300 font-semibold mb-1">Motivo da Necessidade de Aprovação</label>
                <select
                  value={laudoEmpresaMotivo}
                  onChange={(e) => setLaudoEmpresaMotivo(e.target.value)}
                  className="w-full bg-slate-950 border border-white/15 rounded-xl px-3 py-2 text-white outline-none focus:border-amber-400"
                >
                  <option value="ALTA_COMPLEXIDADE">⚙️ Alta Complexidade Técnica / Diagnóstico Crítico</option>
                  <option value="CUSTO_ELEVADO">💰 Manutenção Cara / Custo Estimado Acima do Limite Contratual</option>
                  <option value="INFRAESTRUTURA">🏗️ Demanda Intervenção Estrutural / Civil / Elétrica Predial</option>
                  <option value="OUTRO">⚠️ Outra Particularidade Técnica Relevante</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Estimativa Preliminar de Custo (R$)</label>
                <div className="relative">
                  <span className="absolute left-3 top-2 text-slate-500 font-bold">R$</span>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="Ex: 1450.00"
                    value={laudoEmpresaCusto}
                    onChange={(e) => setLaudoEmpresaCusto(e.target.value)}
                    className="w-full bg-slate-950 border border-white/15 rounded-xl pl-9 pr-3 py-2 text-white font-mono focus:border-amber-400 outline-none"
                  />
                </div>
                <span className="text-[10px] text-slate-500 mt-0.5 block">
                  Teto para execução direta sem autorização: R$ {Number(contratoData?.contrato?.limiteAprovacaoAutomatica || 1000).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </span>
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Diagnóstico e Justificativa Circunstanciada do Laudo *</label>
                <textarea
                  rows={4}
                  placeholder="Descreva o estado do equipamento, testes realizados, defeitos detectados, peças ou serviços necessários e justificativa técnica..."
                  value={laudoEmpresaTexto}
                  onChange={(e) => setLaudoEmpresaTexto(e.target.value)}
                  className="w-full bg-slate-950 border border-white/15 rounded-xl p-3 text-white outline-none focus:border-amber-400"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Técnico da Contratada Responsável pelo Laudo</label>
                <input
                  type="text"
                  placeholder="Nome do técnico responsável"
                  value={laudoEmpresaTecnico}
                  onChange={(e) => setLaudoEmpresaTecnico(e.target.value)}
                  className="w-full bg-slate-950 border border-white/15 rounded-xl px-3 py-2 text-white focus:border-amber-400 outline-none"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-white/10">
              <button
                type="button"
                onClick={() => setModalLaudoEmpresa(false)}
                className="px-4 py-2 rounded-xl border border-white/10 text-xs text-slate-300 hover:text-white"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleSubmeterLaudoEmpresa}
                disabled={salvandoLaudoAcao}
                className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs flex items-center gap-1.5 shadow-md"
              >
                <Send className="w-4 h-4" />
                <span>Submeter Laudo à Fiscalização</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 2: FISCAL DESPACHA PARA ENGENHARIA (SOBE) (PASSOS 8 E 9) */}
      {modalDespachoSobe && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-white/15 rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Share2 className="w-5 h-5 text-blue-400" />
                <span>Despachar para a Engenharia (SOBE)</span>
              </h3>
              <button
                type="button"
                onClick={() => setModalDespachoSobe(false)}
                className="text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-slate-300">
              Caso a Fiscalização Técnica tenha dúvidas sobre a viabilidade, custos ou impacto estrutural do serviço laudo pela empresa, despache este chamado para a <strong>Superintendência de Obras e Engenharia (SOBE)</strong> emitir parecer técnico.
            </p>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-300 font-semibold mb-1">Quesitos / Dúvidas Técnicas para a SOBE *</label>
                <textarea
                  rows={4}
                  placeholder="Ex: Solicita-se à SOBE parecer técnico quanto à viabilidade de recuperação deste compressor vs. substituição integral do aparelho, bem como se a carga elétrica do circuito predial suporta a nova máquina..."
                  value={despachoSobeDuvida}
                  onChange={(e) => setDespachoSobeDuvida(e.target.value)}
                  className="w-full bg-slate-950 border border-white/15 rounded-xl p-3 text-white outline-none focus:border-blue-400"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-white/10">
              <button
                type="button"
                onClick={() => setModalDespachoSobe(false)}
                className="px-4 py-2 rounded-xl border border-white/10 text-xs text-slate-300 hover:text-white"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleDespacharSobe}
                disabled={salvandoLaudoAcao}
                className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-md"
              >
                <Send className="w-4 h-4" />
                <span>Confirmar Despacho para SOBE</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 3: ENGENHARIA (SOBE) ELABORA PARECER TÉCNICO (PASSOS 11 E 12) */}
      {modalParecerSobe && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-white/15 rounded-2xl max-w-xl w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-purple-400" />
                <span>Emitir Parecer Técnico da SOBE</span>
              </h3>
              <button
                type="button"
                onClick={() => setModalParecerSobe(false)}
                className="text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-slate-300">
              Manifestação técnica conclusiva da <strong>Superintendência de Obras e Engenharia (SOBE)</strong> em resposta à consulta da Fiscalização Técnica. O parecer será encaminhado de volta para a decisão final do Fiscal Técnico.
            </p>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-300 font-semibold mb-1">Recomendação Técnica Conclusiva</label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setParecerSobeFavoravel(true)}
                    className={`p-3 rounded-xl border text-left flex items-center gap-2 transition ${
                      parecerSobeFavoravel
                        ? 'bg-emerald-500/20 border-emerald-500/50 text-emerald-300'
                        : 'bg-slate-950 border-white/10 text-slate-400 hover:text-white'
                    }`}
                  >
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    <div>
                      <div className="font-bold text-white">Favorável</div>
                      <div className="text-[10px] text-slate-400">Autoriza execução do serviço</div>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setParecerSobeFavoravel(false)}
                    className={`p-3 rounded-xl border text-left flex items-center gap-2 transition ${
                      !parecerSobeFavoravel
                        ? 'bg-red-500/20 border-red-500/50 text-red-300'
                        : 'bg-slate-950 border-white/10 text-slate-400 hover:text-white'
                    }`}
                  >
                    <XCircle className="w-4 h-4 text-red-400 shrink-0" />
                    <div>
                      <div className="font-bold text-white">Desfavorável / Com Ressalvas</div>
                      <div className="text-[10px] text-slate-400">Indica inviabilidade ou restrições</div>
                    </div>
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Fundamentação Técnica e Parecer *</label>
                <textarea
                  rows={5}
                  placeholder="Insira a fundamentação técnica do parecer, análise das normas técnicas (ABNT/ASHRAE), viabilidade econômica e recomendações para a fiscalização..."
                  value={parecerSobeTexto}
                  onChange={(e) => setParecerSobeTexto(e.target.value)}
                  className="w-full bg-slate-950 border border-white/15 rounded-xl p-3 text-white outline-none focus:border-purple-400"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Engenheiro Responsável</label>
                  <input
                    type="text"
                    placeholder="Nome do Engenheiro da SOBE"
                    value={parecerSobeEngenheiro}
                    onChange={(e) => setParecerSobeEngenheiro(e.target.value)}
                    className="w-full bg-slate-950 border border-white/15 rounded-xl px-3 py-2 text-white focus:border-purple-400 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Matrícula / Registro CREA</label>
                  <input
                    type="text"
                    placeholder="Ex: 56789-0 / CREA-RN"
                    value={parecerSobeMatricula}
                    onChange={(e) => setParecerSobeMatricula(e.target.value)}
                    className="w-full bg-slate-950 border border-white/15 rounded-xl px-3 py-2 text-white focus:border-purple-400 outline-none"
                  />
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-white/10">
              <button
                type="button"
                onClick={() => setModalParecerSobe(false)}
                className="px-4 py-2 rounded-xl border border-white/10 text-xs text-slate-300 hover:text-white"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleEmitirParecerSobe}
                disabled={salvandoLaudoAcao}
                className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-md"
              >
                <Send className="w-4 h-4" />
                <span>Encaminhar Parecer para a Fiscalização</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 4: FISCAL REPROVA LAUDO E ENCERRA CHAMADO (PASSOS 8 E 10) */}
      {modalReprovarLaudo && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-white/15 rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <XCircle className="w-5 h-5 text-red-400" />
                <span>Reprovar Laudo Técnico / Encerrar Chamado</span>
              </h3>
              <button
                type="button"
                onClick={() => setModalReprovarLaudo(false)}
                className="text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-slate-300">
              Ao reprovar o laudo, o chamado será encerrado e finalizado sem execução de serviço, ficando a justificativa registrada oficialmente para o demandante e órgãos de controle.
            </p>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-300 font-semibold mb-1">Justificativa da Não Aprovação *</label>
                <textarea
                  rows={4}
                  placeholder="Ex: Intervenção técnica inviável devido à obsolescência do equipamento; custo de reparo desproporcional ao valor residual do bem, recomendando-se processo de aquisição de nova máquina pela PROAD..."
                  value={reprovarLaudoMotivo}
                  onChange={(e) => setReprovarLaudoMotivo(e.target.value)}
                  className="w-full bg-slate-950 border border-white/15 rounded-xl p-3 text-white outline-none focus:border-red-400"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-white/10">
              <button
                type="button"
                onClick={() => setModalReprovarLaudo(false)}
                className="px-4 py-2 rounded-xl border border-white/10 text-xs text-slate-300 hover:text-white"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleReprovarLaudoFiscal}
                disabled={salvandoLaudoAcao}
                className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-md"
              >
                <XCircle className="w-4 h-4" />
                <span>Confirmar Encerramento</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL DE EDIÇÃO DE CHAMADO PELO ADMINISTRADOR */}
      {modalEditarChamadoOpen && chamadoEmEdicao && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-slate-900 border border-purple-500/40 rounded-2xl max-w-xl w-full p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center border-b border-white/10 pb-3">
              <div className="flex items-center gap-2">
                <Edit3 className="w-5 h-5 text-purple-400" />
                <h3 className="text-base font-bold text-white">
                  Editar Chamado {chamadoEmEdicao.numeroProtocolo}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setModalEditarChamadoOpen(false)}
                className="text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSalvarEdicaoChamado} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-300 font-semibold mb-1">Título da Demanda</label>
                <input
                  type="text"
                  value={editChamadoTitulo}
                  onChange={(e) => setEditChamadoTitulo(e.target.value)}
                  className="w-full bg-slate-950 border border-white/15 rounded-xl px-3 py-2 text-white outline-none focus:border-purple-500"
                  required
                />
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Descrição Geral / Problema</label>
                <textarea
                  rows={3}
                  value={editChamadoDescricao}
                  onChange={(e) => setEditChamadoDescricao(e.target.value)}
                  className="w-full bg-slate-950 border border-white/15 rounded-xl px-3 py-2 text-white outline-none focus:border-purple-500"
                  required
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Status do Chamado</label>
                  <select
                    value={editChamadoStatus}
                    onChange={(e) => setEditChamadoStatus(e.target.value)}
                    className="w-full bg-slate-950 border border-white/15 rounded-xl px-3 py-2 text-white outline-none focus:border-purple-500 cursor-pointer"
                  >
                    <option value="ABERTO">ABERTO (Aguardando Triagem)</option>
                    <option value="EM_TRIAGEM">EM TRIAGEM (Encaminhado à Empresa)</option>
                    <option value="AGUARDANDO_ORCAMENTO">AGUARDANDO ORÇAMENTO (Vistoria In Loco)</option>
                    <option value="ORCAMENTO_ANEXADO">ORÇAMENTO ANEXADO (Aguardando Aprovação)</option>
                    <option value="APROVADO_EM_EXECUCAO">APROVADO EM EXECUÇÃO</option>
                    <option value="AGUARDANDO_CONFIRMACAO">AGUARDANDO CONFIRMAÇÃO (Prazo de Ateste)</option>
                    <option value="CONFIRMADO_PELO_DEMANDANTE">CONFIRMADO PELO DEMANDANTE</option>
                    <option value="CONFIRMADO_TACITAMENTE">CONFIRMADO TACITAMENTE</option>
                    <option value="FINALIZADO">FINALIZADO (Apto a Pagamento)</option>
                    <option value="CANCELADO">CANCELADO</option>
                    <option value="REJEITADO_SOLUCAO">REJEITADO SOLUÇÃO (Retorno à Empresa)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Unidade Demandante</label>
                  <select
                    value={editChamadoUnidadeId}
                    onChange={(e) => setEditChamadoUnidadeId(e.target.value)}
                    className="w-full bg-slate-950 border border-white/15 rounded-xl px-3 py-2 text-white outline-none focus:border-purple-500 cursor-pointer"
                  >
                    <option value="">Selecione a Unidade...</option>
                    {usuariosData?.unidades?.map((u: any) => (
                      <option key={u.id} value={u.id}>
                        {u.sigla} • {u.nome} ({u.campus})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Valor do Orçamento Total (R$)</label>
                <input
                  type="number"
                  step="0.01"
                  placeholder="Ex: 450.00"
                  value={editChamadoValor}
                  onChange={(e) => setEditChamadoValor(e.target.value)}
                  className="w-full bg-slate-950 border border-white/15 rounded-xl px-3 py-2 text-white outline-none focus:border-purple-500"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Justificativa da Alteração (Auditoria)</label>
                <input
                  type="text"
                  placeholder="Motivo da edição realizada pelo administrador..."
                  value={editChamadoJustificativa}
                  onChange={(e) => setEditChamadoJustificativa(e.target.value)}
                  className="w-full bg-slate-950 border border-white/15 rounded-xl px-3 py-2 text-white outline-none focus:border-purple-500"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => setModalEditarChamadoOpen(false)}
                  className="px-4 py-2 rounded-xl border border-white/10 text-slate-300 hover:bg-slate-800"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold shadow-lg transition"
                >
                  Salvar Alterações
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL DE CADASTRO / EDIÇÃO DE USUÁRIO & TÉCNICO */}
      {modalUsuarioOpen && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-slate-900 border border-cyan-500/40 rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center border-b border-white/10 pb-3">
              <div className="flex items-center gap-2">
                <UserPlus className="w-5 h-5 text-cyan-400" />
                <h3 className="text-base font-bold text-white">
                  {usuarioEmEdicao ? `Editar Usuário: ${usuarioEmEdicao.nome}` : 'Cadastrar Novo Técnico da Empresa'}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setModalUsuarioOpen(false)}
                className="text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSalvarUsuario} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-300 font-semibold mb-1">Nome Completo *</label>
                <input
                  type="text"
                  placeholder="Ex: João Silva de Souza"
                  value={formUsuarioNome}
                  onChange={(e) => setFormUsuarioNome(e.target.value)}
                  className="w-full bg-slate-950 border border-white/15 rounded-xl px-3 py-2 text-white outline-none focus:border-cyan-500"
                  required
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">CPF *</label>
                  <input
                    type="text"
                    placeholder="Ex: 000.000.000-00"
                    value={formUsuarioCpf}
                    onChange={(e) => setFormUsuarioCpf(e.target.value)}
                    className="w-full bg-slate-950 border border-white/15 rounded-xl px-3 py-2 text-white outline-none focus:border-cyan-500 font-mono"
                    required
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Perfil (Role)</label>
                  <select
                    value={formUsuarioRole}
                    onChange={(e) => setFormUsuarioRole(e.target.value)}
                    className="w-full bg-slate-950 border border-white/15 rounded-xl px-3 py-2 text-white outline-none focus:border-cyan-500 cursor-pointer"
                  >
                    <option value="EMPRESA">Técnico da Empresa Prestadora</option>
                    <option value="DEMANDANTE">Demandante da Unidade UERN</option>
                    <option value="ADMIN">Administrador PROAD</option>
                    <option value="FISCAL_TECNICO">Fiscal Técnico</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">E-mail (opcional para técnico)</label>
                <input
                  type="email"
                  placeholder="Ex: joao.tecnico@ecomser.com.br (gerado automaticamente se vazio)"
                  value={formUsuarioEmail}
                  onChange={(e) => setFormUsuarioEmail(e.target.value)}
                  className="w-full bg-slate-950 border border-white/15 rounded-xl px-3 py-2 text-white outline-none focus:border-cyan-500"
                />
              </div>

              {formUsuarioRole === 'DEMANDANTE' && (
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Unidade UERN</label>
                  <select
                    value={formUsuarioUnidadeId}
                    onChange={(e) => setFormUsuarioUnidadeId(e.target.value)}
                    className="w-full bg-slate-950 border border-white/15 rounded-xl px-3 py-2 text-white outline-none focus:border-cyan-500 cursor-pointer"
                  >
                    <option value="">Selecione a Unidade...</option>
                    {usuariosData?.unidades?.map((u: any) => (
                      <option key={u.id} value={u.id}>
                        {u.sigla} • {u.nome} ({u.campus})
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {formUsuarioRole !== 'EMPRESA' && (
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Matrícula UERN (se servidor)</label>
                  <input
                    type="text"
                    placeholder="Ex: 12345-6"
                    value={formUsuarioMatricula}
                    onChange={(e) => setFormUsuarioMatricula(e.target.value)}
                    className="w-full bg-slate-950 border border-white/15 rounded-xl px-3 py-2 text-white outline-none focus:border-cyan-500"
                  />
                </div>
              )}

              <div className="flex justify-end gap-2 pt-3 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => setModalUsuarioOpen(false)}
                  className="px-4 py-2 rounded-xl border border-white/10 text-slate-300 hover:bg-slate-800"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold shadow-lg transition"
                >
                  {usuarioEmEdicao ? 'Salvar Alterações' : 'Concluir Cadastro do Técnico'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL DE CADASTRO / EDIÇÃO DE MÁQUINA (INVENTÁRIO) */}
      {modalEquipamentoOpen && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-slate-900 border border-cyan-500/40 rounded-2xl max-w-xl w-full p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center border-b border-white/10 pb-3">
              <div className="flex items-center gap-2">
                <Snowflake className="w-5 h-5 text-cyan-400" />
                <h3 className="text-base font-bold text-white">
                  {equipamentoEmEdicao ? `Editar Máquina (Tombo: ${equipamentoEmEdicao.tombo})` : 'Cadastrar Nova Máquina no Inventário'}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setModalEquipamentoOpen(false)}
                className="text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSalvarEquipamento} className="space-y-3.5 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Unidade / Campus *</label>
                  <select
                    value={formEqUnidadeId}
                    onChange={(e) => setFormEqUnidadeId(e.target.value)}
                    className="w-full bg-slate-950 border border-white/15 rounded-xl px-3 py-2 text-white outline-none focus:border-cyan-500 cursor-pointer"
                    required
                  >
                    <option value="">Selecione a Unidade...</option>
                    {usuariosData?.unidades?.map((u: any) => (
                      <option key={u.id} value={u.id}>
                        {u.sigla} • {u.nome} ({u.campus})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Tombo Patrimonial *</label>
                  <input
                    type="text"
                    placeholder="Ex: 104521"
                    value={formEqTombo}
                    onChange={(e) => setFormEqTombo(e.target.value)}
                    className="w-full bg-slate-950 border border-white/15 rounded-xl px-3 py-2 text-white outline-none focus:border-cyan-500 font-mono font-bold"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Tipo de Equipamento *</label>
                  <select
                    value={formEqTipo}
                    onChange={(e) => setFormEqTipo(e.target.value)}
                    className="w-full bg-slate-950 border border-white/15 rounded-xl px-3 py-2 text-white outline-none focus:border-cyan-500 cursor-pointer"
                  >
                    <option value="AR_CONDICIONADO">Ar-Condicionado</option>
                    <option value="BEBEDOURO_INDUSTRIAL">Bebedouro Industrial</option>
                    <option value="GELAGUA">Gelágua / Purificador</option>
                    <option value="REFRIGERADOR_FREEZER">Refrigerador / Freezer</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Status Operacional *</label>
                  <select
                    value={formEqStatus}
                    onChange={(e) => setFormEqStatus(e.target.value)}
                    className="w-full bg-slate-950 border border-white/15 rounded-xl px-3 py-2 text-white outline-none focus:border-cyan-500 cursor-pointer"
                  >
                    <option value="ATIVO">ATIVO (Em Operação)</option>
                    <option value="EM_MANUTENCAO">EM MANUTENÇÃO (Ordem de Serviço Aberta)</option>
                    <option value="DESINSTALADO_DEPOSITO">DESINSTALADO (No Depósito / Reserva)</option>
                    <option value="BAIXADO_INSERVIVEL">BAIXADO / INSERVÍVEL (Condenado)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Marca *</label>
                  <input
                    type="text"
                    placeholder="Ex: Springer Midea, Daikin, Consul"
                    value={formEqMarca}
                    onChange={(e) => setFormEqMarca(e.target.value)}
                    className="w-full bg-slate-950 border border-white/15 rounded-xl px-3 py-2 text-white outline-none focus:border-cyan-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Modelo (opcional)</label>
                  <input
                    type="text"
                    placeholder="Ex: AirVolution Inverter"
                    value={formEqModelo}
                    onChange={(e) => setFormEqModelo(e.target.value)}
                    className="w-full bg-slate-950 border border-white/15 rounded-xl px-3 py-2 text-white outline-none focus:border-cyan-500"
                  />
                </div>
              </div>

              {/* Vínculo Obrigatório a um Ambiente / Espaço Físico */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-slate-300 font-semibold text-xs flex items-center gap-1.5">
                    Ambiente / Espaço Físico Vinculado {formEqStatus !== 'DESINSTALADO_DEPOSITO' && <span className="text-cyan-400">*</span>}
                    <span className="text-[10px] text-cyan-400 font-normal">
                      (Aparelhos em operação devem estar vinculados a uma sala)
                    </span>
                  </label>
                  <button
                    type="button"
                    onClick={() => handleAbrirNovoAmbiente(formEqUnidadeId)}
                    className="text-[11px] text-cyan-400 hover:text-cyan-300 underline font-medium cursor-pointer"
                  >
                    + Criar Novo Espaço
                  </button>
                </div>
                <select
                  value={formEqAmbienteId}
                  onChange={(e) => {
                    const selId = e.target.value;
                    setFormEqAmbienteId(selId);
                    const amb = ambientes.find((a: any) => a.id === selId);
                    if (amb) {
                      setFormEqLocalizacao(amb.descricaoDetalhe);
                    } else if (!selId) {
                      setFormEqLocalizacao('');
                    }
                  }}
                  disabled={formEqStatus === 'DESINSTALADO_DEPOSITO'}
                  className={`w-full bg-slate-950 border ${
                    !formEqAmbienteId && formEqStatus !== 'DESINSTALADO_DEPOSITO' ? 'border-amber-500/60' : 'border-white/15'
                  } rounded-xl px-3 py-2 text-white outline-none focus:border-cyan-500 cursor-pointer`}
                  required={formEqStatus !== 'DESINSTALADO_DEPOSITO'}
                >
                  <option value="">
                    {formEqStatus === 'DESINSTALADO_DEPOSITO'
                      ? 'Nenhum ambiente vinculado (Aparelho no Depósito)'
                      : '-- Selecione o Ambiente onde a máquina está instalada --'}
                  </option>
                  {ambientes
                    .filter((a: any) => !formEqUnidadeId || a.unidadeId === formEqUnidadeId)
                    .map((a: any) => (
                      <option key={a.id} value={a.id}>
                        {a.descricaoDetalhe} {a.bloco ? `(${a.bloco})` : ''} • {formatTipoAmbiente(a.tipo)} {['SALA_DE_AULA', 'LABORATORIO_PESQUISA_ININTERRUPTO', 'SALA_ESTUDOS_BIBLIOTECA'].includes(a.tipo) ? '⭐ (Prioritário)' : ''}
                      </option>
                    ))}
                </select>
                {formEqStatus === 'DESINSTALADO_DEPOSITO' ? (
                  <p className="text-[11px] text-slate-400 mt-1">
                    ℹ️ Máquinas desinstaladas / no depósito ficam desvinculadas de salas até sua reinstalação.
                  </p>
                ) : !formEqAmbienteId ? (
                  <p className="text-[11px] text-amber-400 mt-1">
                    ⚠️ Selecione a sala de instalação. Novos chamados para esta máquina herdarão este ambiente e a prioridade correspondente.
                  </p>
                ) : null}
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Complemento de Localização (opcional)</label>
                <input
                  type="text"
                  placeholder="Ex: Parede leste, ao lado da lousa"
                  value={formEqLocalizacao}
                  onChange={(e) => setFormEqLocalizacao(e.target.value)}
                  className="w-full bg-slate-950 border border-white/15 rounded-xl px-3 py-2 text-white outline-none focus:border-cyan-500"
                />
              </div>

              {/* Campos Dinâmicos por Tipo */}
              {formEqTipo === 'AR_CONDICIONADO' && (
                <div className="p-3.5 bg-slate-950/70 border border-white/10 rounded-xl space-y-3">
                  <div className="text-[11px] font-bold text-cyan-300 uppercase tracking-wider">
                    Especificações do Ar-Condicionado
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="block text-slate-400 font-semibold mb-1">Capacidade (BTUs)</label>
                      <select
                        value={formEqBtus}
                        onChange={(e) => setFormEqBtus(e.target.value)}
                        className="w-full bg-slate-900 border border-white/15 rounded-xl px-3 py-2 text-white outline-none focus:border-cyan-500"
                      >
                        <option value="9000">9.000 BTUs</option>
                        <option value="12000">12.000 BTUs</option>
                        <option value="18000">18.000 BTUs</option>
                        <option value="24000">24.000 BTUs</option>
                        <option value="30000">30.000 BTUs</option>
                        <option value="36000">36.000 BTUs</option>
                        <option value="48000">48.000 BTUs</option>
                        <option value="60000">60.000 BTUs</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-slate-400 font-semibold mb-1">Tipo de Split</label>
                      <select
                        value={formEqTipoAc}
                        onChange={(e) => setFormEqTipoAc(e.target.value)}
                        className="w-full bg-slate-900 border border-white/15 rounded-xl px-3 py-2 text-white outline-none focus:border-cyan-500"
                      >
                        <option value="Split Hi-Wall">Split Hi-Wall</option>
                        <option value="Cassete">Cassete</option>
                        <option value="Piso Teto">Piso Teto</option>
                        <option value="Janela">Janela</option>
                        <option value="Multi-Split">Multi-Split</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-slate-400 font-semibold mb-1">Gás Refrigerante</label>
                      <select
                        value={formEqGas}
                        onChange={(e) => setFormEqGas(e.target.value)}
                        className="w-full bg-slate-900 border border-white/15 rounded-xl px-3 py-2 text-white outline-none focus:border-cyan-500"
                      >
                        <option value="R410A">R410A (Ecológico)</option>
                        <option value="R32">R32 (Nova Geração)</option>
                        <option value="R22">R22 (Convencional antigo)</option>
                        <option value="R134a">R134a</option>
                      </select>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 pt-1">
                    <input
                      type="checkbox"
                      id="eqInverter"
                      checked={formEqInverter}
                      onChange={(e) => setFormEqInverter(e.target.checked)}
                      className="rounded border-white/20 bg-slate-900 text-cyan-500 w-4 h-4"
                    />
                    <label htmlFor="eqInverter" className="text-xs text-slate-300 font-medium cursor-pointer">
                      Aparelho com Tecnologia <strong>Inverter</strong> (alta eficiência energética)
                    </label>
                  </div>
                </div>
              )}

              {formEqTipo === 'BEBEDOURO_INDUSTRIAL' && (
                <div className="p-3.5 bg-slate-950/70 border border-white/10 rounded-xl space-y-3">
                  <div className="text-[11px] font-bold text-cyan-300 uppercase tracking-wider">
                    Especificações do Bebedouro Industrial
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-slate-400 font-semibold mb-1">Qtd de Torneiras</label>
                      <input
                        type="number"
                        min="1"
                        max="8"
                        value={formEqTorneiras}
                        onChange={(e) => setFormEqTorneiras(e.target.value)}
                        className="w-full bg-slate-900 border border-white/15 rounded-xl px-3 py-2 text-white outline-none focus:border-cyan-500"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-400 font-semibold mb-1">Capacidade do Reservatório (Litros)</label>
                      <input
                        type="number"
                        min="20"
                        max="500"
                        value={formEqCapacidadeLitros}
                        onChange={(e) => setFormEqCapacidadeLitros(e.target.value)}
                        className="w-full bg-slate-900 border border-white/15 rounded-xl px-3 py-2 text-white outline-none focus:border-cyan-500"
                      />
                    </div>
                  </div>
                </div>
              )}

              {formEqTipo === 'GELAGUA' && (
                <div className="p-3.5 bg-slate-950/70 border border-white/10 rounded-xl space-y-3">
                  <div className="text-[11px] font-bold text-cyan-300 uppercase tracking-wider">
                    Especificações do Gelágua
                  </div>
                  <div>
                    <label className="block text-slate-400 font-semibold mb-1">Formato / Modelo</label>
                    <select
                      value={formEqModeloGelagua}
                      onChange={(e) => setFormEqModeloGelagua(e.target.value)}
                      className="w-full bg-slate-900 border border-white/15 rounded-xl px-3 py-2 text-white outline-none focus:border-cyan-500"
                    >
                      <option value="COLUNA">Gelágua de Coluna (Piso)</option>
                      <option value="BANCADA">Gelágua de Bancada (Mesa)</option>
                    </select>
                  </div>
                </div>
              )}

              {formEqTipo === 'REFRIGERADOR_FREEZER' && (
                <div className="p-3.5 bg-slate-950/70 border border-white/10 rounded-xl space-y-3">
                  <div className="text-[11px] font-bold text-cyan-300 uppercase tracking-wider">
                    Especificações do Refrigerador / Freezer
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-slate-400 font-semibold mb-1">Litragem (L)</label>
                      <input
                        type="number"
                        min="50"
                        max="800"
                        value={formEqLitragem}
                        onChange={(e) => setFormEqLitragem(e.target.value)}
                        className="w-full bg-slate-900 border border-white/15 rounded-xl px-3 py-2 text-white outline-none focus:border-cyan-500"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-400 font-semibold mb-1">Tipo</label>
                      <select
                        value={formEqTipoRefrigerador}
                        onChange={(e) => setFormEqTipoRefrigerador(e.target.value)}
                        className="w-full bg-slate-900 border border-white/15 rounded-xl px-3 py-2 text-white outline-none focus:border-cyan-500"
                      >
                        <option value="REFRIGERADOR_DUPLEX">Geladeira Duplex</option>
                        <option value="REFRIGERADOR_1_PORTA">Geladeira 1 Porta</option>
                        <option value="FREEZER_VERTICAL">Freezer Vertical</option>
                        <option value="FREEZER_HORIZONTAL">Freezer Horizontal</option>
                      </select>
                    </div>
                  </div>
                </div>
              )}

              <div className="flex justify-end gap-2 pt-3 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => setModalEquipamentoOpen(false)}
                  className="px-4 py-2 rounded-xl border border-white/10 text-slate-300 hover:bg-slate-800"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-bold shadow-lg transition"
                >
                  {equipamentoEmEdicao ? 'Salvar Alterações da Máquina' : 'Cadastrar Máquina no Inventário'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL DE CADASTRO / EDIÇÃO DE AMBIENTE / ESPAÇO FÍSICO */}
      {modalAmbienteOpen && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-slate-900 border border-teal-500/40 rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center border-b border-white/10 pb-3">
              <div className="flex items-center gap-2">
                <MapPin className="w-5 h-5 text-teal-400" />
                <div>
                  <h3 className="text-base font-bold text-white">
                    {ambienteEmEdicao ? 'Editar Espaço Físico / Sala' : 'Cadastrar Espaço Físico / Sala'}
                  </h3>
                  <p className="text-[11px] text-slate-400">
                    Ambiente físico da unidade para alocação de equipamentos e parametrização de prioridades.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setModalAmbienteOpen(false)}
                className="text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSalvarAmbiente} className="space-y-3.5 text-xs">
              {/* Unidade */}
              <div>
                <label className="block text-slate-300 font-semibold mb-1">Unidade / Setor Responsável *</label>
                {currentUser?.role === 'ADMIN' ? (
                  <select
                    value={formAmbUnidadeId}
                    onChange={(e) => setFormAmbUnidadeId(e.target.value)}
                    className="w-full bg-slate-950 border border-white/15 rounded-xl px-3 py-2 text-white outline-none focus:border-teal-500 cursor-pointer"
                    required
                  >
                    <option value="">Selecione a Unidade...</option>
                    {usuariosData?.unidades?.map((u: any) => (
                      <option key={u.id} value={u.id}>
                        {u.sigla} • {u.nome} ({u.campus || u.cidade})
                      </option>
                    ))}
                  </select>
                ) : (
                  <div className="p-2.5 bg-slate-950 border border-white/10 rounded-xl text-slate-300 font-semibold">
                    {currentUser?.unidade?.sigla || 'Sua Unidade'} - {currentUser?.unidade?.nome || 'Unidade Atual'}
                  </div>
                )}
              </div>

              {/* Tipo de Espaço Físico */}
              <div>
                <label className="block text-slate-300 font-semibold mb-1">Classificação do Tipo de Local *</label>
                <select
                  value={formAmbTipo}
                  onChange={(e) => setFormAmbTipo(e.target.value)}
                  className="w-full bg-slate-950 border border-white/15 rounded-xl px-3 py-2 text-white outline-none focus:border-teal-500 cursor-pointer"
                  required
                >
                  <option value="SALA_DE_AULA">Sala de Aula (⭐ Prioridade Contratual)</option>
                  <option value="LABORATORIO_PESQUISA_ININTERRUPTO">Laboratório de Pesquisa de Funcionamento Ininterrupto (⭐ Prioridade Contratual)</option>
                  <option value="SALA_ESTUDOS_BIBLIOTECA">Sala de Estudos da Biblioteca (⭐ Prioridade Contratual)</option>
                  <option value="LABORATORIOS_DIVERSOS">Laboratórios Diversos</option>
                  <option value="OUTRAS_SALAS_USO_ACADEMICO">Outras Salas de Uso Acadêmico</option>
                  <option value="AUDITORIO">Auditório</option>
                  <option value="SALA_ADMINISTRATIVA">Sala Administrativa</option>
                  <option value="CORREDOR_PATIO">Corredor / Pátio</option>
                </select>
              </div>

              {/* Destaque de Prioridade Dinâmico */}
              {['SALA_DE_AULA', 'LABORATORIO_PESQUISA_ININTERRUPTO', 'SALA_ESTUDOS_BIBLIOTECA'].includes(formAmbTipo) ? (
                <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-xl flex items-start gap-2">
                  <Star className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                  <div className="text-[11px] text-amber-200">
                    <strong>Espaço com Prioridade Contratual Alta:</strong> Chamados abertos para máquinas instaladas nesta sala serão sinalizados à empresa com máxima urgência para atendimento imediato.
                  </div>
                </div>
              ) : (
                <div className="p-2.5 bg-slate-950/70 border border-white/10 rounded-xl text-[11px] text-slate-400">
                  ℹ️ Prazo de atendimento padrão estipulado em contrato para espaços convencionais.
                </div>
              )}

              {/* Identificação / Detalhe */}
              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="text-slate-300 font-semibold">
                    Nome / Identificação do Espaço *
                  </label>
                  <span className="text-[10px] text-slate-400">Ex: Sala 02, Laboratório de Química</span>
                </div>
                <input
                  type="text"
                  placeholder="Ex: Sala de Aula 04, Lab de Informática 01, Coordenação"
                  value={formAmbDetalhe}
                  onChange={(e) => setFormAmbDetalhe(e.target.value)}
                  className="w-full bg-slate-950 border border-white/15 rounded-xl px-3 py-2 text-white outline-none focus:border-teal-500"
                  required
                />
                <p className="text-[10px] text-slate-400 mt-1">
                  Regra anti-duplicidade: Não são permitidos dois espaços com o mesmo nome na mesma unidade.
                </p>
              </div>

              {/* Bloco / Prédio */}
              <div>
                <label className="block text-slate-300 font-semibold mb-1">Prédio / Bloco / Pavimento (opcional)</label>
                <input
                  type="text"
                  placeholder="Ex: Bloco E1, 2º Andar, Setor Acadêmico"
                  value={formAmbBloco}
                  onChange={(e) => setFormAmbBloco(e.target.value)}
                  className="w-full bg-slate-950 border border-white/15 rounded-xl px-3 py-2 text-white outline-none focus:border-teal-500"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => setModalAmbienteOpen(false)}
                  className="px-4 py-2 rounded-xl border border-white/10 text-slate-300 hover:bg-slate-800"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={salvandoAmbiente}
                  className="px-5 py-2 rounded-xl bg-teal-600 hover:bg-teal-500 text-white font-bold shadow-lg transition flex items-center gap-1.5 disabled:opacity-50"
                >
                  {salvandoAmbiente ? (
                    'Salvando...'
                  ) : (
                    <>
                      <Check className="w-4 h-4" />
                      {ambienteEmEdicao ? 'Salvar Alterações' : 'Cadastrar Espaço'}
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL DE EXTRATO DETALHADO DO SALDO CONSUMIDO (R$ 740,00) */}
      {modalExtratoConsumoOpen && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-slate-900 border border-amber-500/40 rounded-2xl max-w-3xl w-full p-6 shadow-2xl space-y-5 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-start border-b border-white/10 pb-4">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40 text-[10px] font-bold uppercase tracking-wider flex items-center gap-1">
                    <DollarSign className="w-3 h-3 text-amber-400" /> Extrato Financeiro Contratual
                  </span>
                  <span className="text-xs text-slate-400">Contrato nº <strong>{contratoData?.contrato?.numeroContrato || '11/2026'}</strong></span>
                </div>
                <h3 className="text-lg font-black text-white">Detalhamento do Saldo Consumido</h3>
                <p className="text-xs text-slate-300 mt-1">
                  Transparência de todas as Ordens de Serviço e chamados que comprometeram recursos da dotação contratual.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setModalExtratoConsumoOpen(false)}
                className="text-slate-400 hover:text-white text-lg p-1"
              >
                ✕
              </button>
            </div>

            {/* Painel Resumo Financeiro */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 bg-slate-950/70 p-4 rounded-xl border border-white/10">
              <div className="p-3 bg-slate-900 rounded-lg border border-white/5">
                <div className="text-[10px] text-slate-400 uppercase font-bold">Valor Global do Contrato</div>
                <div className="text-base font-black text-white font-mono mt-0.5">
                  R$ {contratoData?.contrato?.valorGlobal?.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </div>
              </div>

              <div className="p-3 bg-amber-950/30 rounded-lg border border-amber-500/30">
                <div className="text-[10px] text-amber-400 uppercase font-bold">Total Consumido Atual</div>
                <div className="text-lg font-black text-amber-300 font-mono mt-0.5">
                  R$ {contratoData?.contrato?.totalConsumido?.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </div>
                <div className="text-[10px] text-slate-400 mt-0.5">
                  {contratoData?.contrato?.percentualConsumido}% do contrato
                </div>
              </div>

              <div className="p-3 bg-emerald-950/30 rounded-lg border border-emerald-500/30">
                <div className="text-[10px] text-emerald-400 uppercase font-bold">Saldo Disponível em Caixa</div>
                <div className="text-lg font-black text-emerald-300 font-mono mt-0.5">
                  R$ {contratoData?.contrato?.saldoDisponivel?.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </div>
              </div>
            </div>

            {/* Esclarecimento Técnico sobre os R$ 740,00 */}
            <div className="p-3.5 bg-amber-500/10 border border-amber-500/30 rounded-xl text-xs text-amber-200/90 leading-relaxed flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
              <div>
                <strong className="text-amber-300">Auditoria dos R$ 740,00 consumidos:</strong>
                <p className="mt-0.5 text-slate-300">
                  Não existe nenhum lançamento órfão ou serviço sem chamado. Este montante corresponde à soma de <strong>CLIMA-2026-00001 (R$ 240,00)</strong> e <strong>CLIMA-2026-00002 (R$ 500,00)</strong> criados na demonstração inicial (seed). Você pode editá-los individualmente na lista abaixo ou zerá-los no botão ao final.
                </p>
              </div>
            </div>

            {/* Lista dos Chamados que Compõem o Valor */}
            <div className="space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Ordens de Serviço / Chamados que compõem este consumo ({chamados.filter(c => c.status !== 'CANCELADO' && Number(c.orcamentoValorTotal || 0) > 0).length}):
              </h4>

              {chamados.filter(c => c.status !== 'CANCELADO' && Number(c.orcamentoValorTotal || 0) > 0).length === 0 ? (
                <div className="p-6 text-center bg-slate-950 rounded-xl border border-white/10 text-slate-400 text-xs">
                  Nenhum chamado ativo possui orçamento aprovado ou valor consumido. O saldo está 100% íntegro.
                </div>
              ) : (
                <div className="space-y-2.5">
                  {chamados
                    .filter((c) => c.status !== 'CANCELADO' && Number(c.orcamentoValorTotal || 0) > 0)
                    .map((ch) => (
                      <div
                        key={ch.id}
                        className="bg-slate-950 border border-white/10 hover:border-amber-500/30 rounded-xl p-4 transition space-y-2.5"
                      >
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-white/5 pb-2">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-mono font-black text-cyan-300 bg-slate-900 px-2 py-0.5 rounded border border-cyan-500/30">
                              {ch.numeroProtocolo}
                            </span>
                            <span className="text-xs font-bold text-white">
                              {ch.tituloDemanda}
                            </span>
                          </div>

                          <div className="flex items-center gap-2">
                            <span className={`text-[10px] px-2 py-0.5 rounded font-bold ${
                              ch.status === 'APROVADO_EM_EXECUCAO' ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40' :
                              ch.status === 'AGUARDANDO_CONFIRMACAO' ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40' :
                              ch.status === 'FINALIZADO' ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40' :
                              'bg-slate-800 text-slate-300'
                            }`}>
                              {ch.status}
                            </span>
                            <span className="text-sm font-black text-amber-300 font-mono">
                              R$ {Number(ch.orcamentoValorTotal || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                            </span>
                          </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs text-slate-300">
                          <div>
                            <span className="text-slate-500">Unidade: </span>
                            <strong>{ch.unidade?.sigla} ({ch.unidade?.campus})</strong>
                          </div>
                          <div>
                            <span className="text-slate-500">Aparelho: </span>
                            <span>{ch.intervencoes?.[0]?.equipamento?.marca} (Tombo {ch.intervencoes?.[0]?.equipamento?.tombo || 'N/A'})</span>
                          </div>
                          <div>
                            <span className="text-slate-500">Aprovado Por: </span>
                            <span className="text-slate-400">{ch.orcamentoAprovadoPor || 'Sistema'}</span>
                          </div>
                        </div>

                        <p className="text-[11px] text-slate-400 bg-slate-900/60 p-2 rounded-lg border border-white/5">
                          {ch.descricaoGeral}
                        </p>

                        {/* Botões de Ação para o Admin */}
                        <div className="flex flex-wrap items-center justify-between gap-2 pt-1 border-t border-white/5 text-xs">
                          <span className="text-[10px] text-slate-500">
                            Aberto em: {new Date(ch.criadoEm).toLocaleDateString('pt-BR')}
                          </span>

                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => {
                                setModalExtratoConsumoOpen(false);
                                handleAbrirEdicaoChamado(ch);
                              }}
                              className="px-2.5 py-1 rounded-lg bg-purple-500/15 hover:bg-purple-500/25 text-purple-300 border border-purple-500/30 font-bold flex items-center gap-1 transition"
                              title="Editar orçamento, valores e informações deste chamado"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                              <span>Editar Valor / Dados</span>
                            </button>

                            <button
                              type="button"
                              onClick={() => {
                                setModalExtratoConsumoOpen(false);
                                handleExcluirChamado(ch.id, ch.numeroProtocolo);
                              }}
                              className="px-2.5 py-1 rounded-lg bg-red-500/15 hover:bg-red-500/25 text-red-300 border border-red-500/30 font-bold flex items-center gap-1 transition"
                              title="Excluir chamado (o valor retorna imediatamente para o saldo)"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                              <span>Excluir do Sistema</span>
                            </button>

                            <button
                              type="button"
                              onClick={() => {
                                setModalExtratoConsumoOpen(false);
                                abrirDetalheChamado(ch.id);
                              }}
                              className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-white/10 font-medium transition"
                            >
                              Ver Timeline
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                </div>
              )}
            </div>

            {/* Informação / Explicação da Gestão */}
            <div className="p-3 bg-blue-950/30 border border-blue-500/20 rounded-xl text-xs text-blue-200/90 leading-relaxed space-y-1">
              <div className="font-bold text-white flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-cyan-400" />
                <span>Gestão Financeira & Restauração de Saldo:</span>
              </div>
              <p>
                O valor de <strong>R$ {contratoData?.contrato?.totalConsumido?.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</strong> é composto exatamente pela soma dos chamados listados acima.
                Caso o Administrador queira <strong>zerar o consumo</strong> ou <strong>reduzir o valor</strong>, basta clicar em <strong>"Excluir do Sistema"</strong> para cancelar a despesa ou <strong>"Editar Valor"</strong> para diminuir o orçamento. O saldo contratual disponível é recalculado automaticamente em tempo real.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row justify-between items-center gap-3 pt-2 border-t border-white/10">
              <button
                type="button"
                onClick={handleZerarSaldoDemonstrativo}
                disabled={zerandoSaldo}
                className="w-full sm:w-auto px-4 py-2 rounded-xl bg-red-600/20 hover:bg-red-600/30 text-red-300 border border-red-500/40 font-bold text-xs transition flex items-center justify-center gap-1.5 disabled:opacity-50"
              >
                <RefreshCw className={`w-3.5 h-3.5 text-red-400 ${zerandoSaldo ? 'animate-spin' : ''}`} />
                <span>{zerandoSaldo ? 'Restaurando Saldo...' : 'Zerar Consumo Demonstrativo (R$ 0,00)'}</span>
              </button>

              <button
                type="button"
                onClick={() => setModalExtratoConsumoOpen(false)}
                className="w-full sm:w-auto px-5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs transition"
              >
                Fechar Extrato
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL DE DECLARAÇÃO DE MÁQUINA CONDENADA & EMISSÃO DE LAUDO TÉCNICO */}
      {modalCondenarOpen && condenarChamado && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-slate-900 border border-red-500/50 rounded-2xl max-w-2xl w-full p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            {/* Header */}
            <div className="flex justify-between items-start border-b border-white/10 pb-3">
              <div className="flex items-start gap-3">
                <div className="p-2.5 rounded-xl bg-red-500/20 text-red-400 border border-red-500/30">
                  <AlertTriangle className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono font-bold text-red-400">{condenarChamado.numeroProtocolo}</span>
                    <span className="text-[10px] px-2 py-0.5 rounded bg-slate-800 text-slate-300">
                      {condenarChamado.unidade?.sigla}
                    </span>
                  </div>
                  <h3 className="text-base font-bold text-white mt-0.5">
                    Declaração de Condenação Técnica e Inservibilidade
                  </h3>
                  <p className="text-xs text-slate-400">
                    Emissão de Laudo Pericial Oficial para instrução de processo de substituição na PROAD/UERN
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setModalCondenarOpen(false)}
                className="text-slate-400 hover:text-white p-1"
              >
                ✕
              </button>
            </div>

            {/* Dados do Aparelho */}
            <div className="p-3.5 rounded-xl bg-slate-950 border border-white/10 text-xs space-y-2">
              <div className="flex justify-between items-center">
                <span className="font-bold text-white">
                  Aparelho Tombo: <span className="text-cyan-400">{condenarIntervencao?.equipamento?.tombo || 'S/N'}</span> • {condenarIntervencao?.equipamento?.marca} ({condenarIntervencao?.equipamento?.modelo || 'Sem modelo'})
                </span>
                <span className="px-2 py-0.5 rounded bg-red-500/20 text-red-300 border border-red-500/40 text-[10px] font-bold">
                  Status no Inventário: BAIXADO_INSERVIVEL
                </span>
              </div>
              <div className="text-slate-400 flex flex-wrap gap-x-4 gap-y-1 text-[11px]">
                <span>Tipo: <strong className="text-slate-300">{condenarIntervencao?.equipamento?.tipo}</strong></span>
                <span>Localização: <strong className="text-slate-300">{condenarIntervencao?.equipamento?.localizacao}</strong></span>
                <span>Capacidade: <strong className="text-slate-300">{condenarIntervencao?.equipamento?.btus ? `${condenarIntervencao?.equipamento?.btus} BTUs` : 'N/A'}</strong></span>
                <span>Unidade: <strong className="text-slate-300">{condenarChamado.unidade?.nome}</strong></span>
              </div>
            </div>

            {/* Formulário do Laudo */}
            <div className="space-y-3.5 text-xs">
              {/* Seleção do Técnico Responsável */}
              <div className="space-y-1.5">
                <label className="block text-slate-300 font-semibold">
                  Técnico Responsável pela Perícia (Empresa Credenciada) <span className="text-red-400">*</span>
                </label>
                {usuariosData?.usuarios?.filter((u: any) => u.role === 'EMPRESA')?.length > 0 && (
                  <div className="mb-2">
                    <span className="text-[11px] text-slate-400 block mb-1">Selecionar técnico cadastrado da empresa:</span>
                    <select
                      value={condenarTecnicoId}
                      onChange={(e) => {
                        const selId = e.target.value;
                        setCondenarTecnicoId(selId);
                        const tec = usuariosData?.usuarios?.find((u: any) => u.id === selId);
                        if (tec) {
                          setCondenarTecnicoNome(tec.nome || '');
                          setCondenarTecnicoCpf(tec.cpf || '');
                        }
                      }}
                      className="w-full bg-slate-950 border border-white/15 rounded-xl px-3 py-2 text-white outline-none focus:border-red-500"
                    >
                      <option value="">-- Selecione ou digite manualmente abaixo --</option>
                      {usuariosData?.usuarios
                        ?.filter((u: any) => u.role === 'EMPRESA')
                        ?.map((t: any) => (
                          <option key={t.id} value={t.id}>
                            {t.nome} (CPF: {t.cpf})
                          </option>
                        ))}
                    </select>
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-400 text-[11px] mb-1">Nome Completo do Técnico</label>
                    <input
                      type="text"
                      placeholder="Ex: Francisco José da Silva"
                      value={condenarTecnicoNome}
                      onChange={(e) => setCondenarTecnicoNome(e.target.value)}
                      className="w-full bg-slate-950 border border-white/15 rounded-xl px-3 py-2 text-white outline-none focus:border-red-500"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-400 text-[11px] mb-1">CPF do Técnico Responsável</label>
                    <input
                      type="text"
                      placeholder="000.000.000-00"
                      value={condenarTecnicoCpf}
                      onChange={(e) => setCondenarTecnicoCpf(e.target.value)}
                      className="w-full bg-slate-950 border border-white/15 rounded-xl px-3 py-2 text-white outline-none focus:border-red-500 font-mono"
                    />
                  </div>
                </div>
              </div>

              {/* Botões rápidos de diagnóstico técnico */}
              <div className="space-y-1.5">
                <label className="block text-slate-300 font-semibold">
                  Motivo da Inviabilidade / Inservibilidade
                </label>
                <div className="flex flex-wrap gap-1.5">
                  {[
                    'Compressor queimado com massa em curto e oxidação severa',
                    'Vazamento múltiplo estrutural e serpentina irrecuperável',
                    'Custo de reparo superior a 75% do valor de equipamento novo',
                    'Modelo obsoleto com inexistência de peças originais no mercado',
                    'Dano catastrófico no bloco mecânico por sobretensão de rede',
                  ].map((preset) => (
                    <button
                      key={preset}
                      type="button"
                      onClick={() => {
                        setCondenarMotivo(preset);
                        setCondenarLaudo((prev) =>
                          prev.includes(preset) ? prev : `${prev} Constatado adicionalmente: ${preset}.`
                        );
                      }}
                      className="px-2.5 py-1 rounded-lg bg-slate-800/80 hover:bg-slate-700 border border-white/10 text-[11px] text-slate-300 hover:text-white transition"
                    >
                      + {preset.slice(0, 42)}...
                    </button>
                  ))}
                </div>
              </div>

              {/* Laudo Técnico Circunstanciado */}
              <div className="space-y-1">
                <label className="block text-slate-300 font-semibold">
                  Laudo Técnico Circunstanciado (Obrigatório para instrução SEI/PROAD) <span className="text-red-400">*</span>
                </label>
                <textarea
                  rows={5}
                  placeholder="Descreva minuciosamente o diagnóstico técnico que comprova que o aparelho não tem conserto viável..."
                  value={condenarLaudo}
                  onChange={(e) => setCondenarLaudo(e.target.value)}
                  className="w-full bg-slate-950 border border-white/15 rounded-xl p-3 text-white outline-none focus:border-red-500 leading-relaxed font-sans text-xs"
                />
                <span className="text-[10px] text-slate-500">
                  Este texto constará integralmente no documento oficial em PDF que o demandante baixará para anexar ao processo de pedido de nova máquina na PROAD.
                </span>
              </div>

              {/* Aviso Legal */}
              <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-[11px] text-amber-300 flex items-start gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-amber-400" />
                <div>
                  <strong>Consequências da Condenação Técnica:</strong>
                  <p className="text-slate-300 mt-0.5">
                    O orçamento do chamado será zerado (R$ 0,00), o chamado será concluído por condenação e a máquina no inventário será baixada como <strong>BAIXADO_INSERVIVEL</strong>. O laudo em PDF fica disponibilizado imediatamente para o demandante.
                  </p>
                </div>
              </div>
            </div>

            {/* Footer Buttons */}
            <div className="flex justify-end gap-3 pt-3 border-t border-white/10">
              <button
                type="button"
                onClick={() => setModalCondenarOpen(false)}
                disabled={salvandoCondenacao}
                className="px-4 py-2 rounded-xl border border-white/10 text-slate-300 hover:bg-slate-800 text-xs transition"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleConfirmarCondenacao}
                disabled={salvandoCondenacao}
                className="px-5 py-2 rounded-xl bg-gradient-to-r from-red-600 to-amber-600 hover:from-red-500 hover:to-amber-500 text-white font-bold text-xs shadow-lg transition flex items-center gap-1.5"
              >
                {salvandoCondenacao ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Emitindo Laudo...</span>
                  </>
                ) : (
                  <>
                    <AlertTriangle className="w-3.5 h-3.5" />
                    <span>Confirmar Condenação & Emitir Laudo PDF</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL DE EDIÇÃO DE CIDADE DA UNIDADE */}
      {modalEditarCidadeOpen && unidadeParaEditarCidade && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-white/15 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-5 animate-in fade-in">
            <div className="flex justify-between items-start border-b border-white/10 pb-3">
              <div>
                <span className="text-xs px-2 py-0.5 rounded bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 font-bold uppercase tracking-wider">
                  Vínculo Territorial
                </span>
                <h3 className="text-base font-bold text-white mt-1">Alterar Município da Unidade</h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  {unidadeParaEditarCidade.sigla} • {unidadeParaEditarCidade.nome} ({unidadeParaEditarCidade.campus})
                </p>
              </div>
              <button
                type="button"
                onClick={() => setModalEditarCidadeOpen(false)}
                className="p-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSalvarCidadeUnidade} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-300 font-semibold mb-1">
                  Município / Cidade Sede <span className="text-cyan-400">*</span>
                </label>
                <div className="relative">
                  <input
                    type="text"
                    list="cidades-sugestoes"
                    value={editUnidadeCidade}
                    onChange={(e) => setEditUnidadeCidade(e.target.value)}
                    placeholder="Ex: Mossoró, Assú, Pau dos Ferros, Caicó, Patu, Natal..."
                    className="w-full bg-slate-950 border border-white/20 rounded-xl px-3 py-2.5 text-white outline-none focus:border-cyan-400 font-medium"
                    required
                  />
                  <datalist id="cidades-sugestoes">
                    <option value="Mossoró" />
                    <option value="Assú" />
                    <option value="Pau dos Ferros" />
                    <option value="Caicó" />
                    <option value="Patu" />
                    <option value="Natal" />
                  </datalist>
                </div>
                <span className="text-[10px] text-slate-500 mt-1 block">
                  Escolha uma cidade existente ou digite o nome de um novo município sede.
                </span>
              </div>

              <div className="p-3 rounded-xl bg-blue-500/10 border border-blue-500/30 text-[11px] text-blue-300 space-y-1">
                <div className="font-bold flex items-center gap-1.5 text-blue-200">
                  <ShieldCheck className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Impacto Operacional & Relatórios:</span>
                </div>
                <p className="text-slate-300 leading-relaxed">
                  Todos os chamados e fechamentos de despesa vinculados a esta unidade serão filtrados e totalizados por esta cidade nos relatórios mensais e no painel da empresa contratada.
                </p>
              </div>

              <div className="flex justify-end gap-2.5 pt-2 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => setModalEditarCidadeOpen(false)}
                  className="px-4 py-2 rounded-xl border border-white/10 text-slate-300 hover:bg-slate-800 transition"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 text-slate-950 font-bold transition flex items-center gap-1.5"
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>Salvar Cidade</span>
                </button>
              </div>
            </form>
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
