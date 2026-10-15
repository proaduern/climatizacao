'use client';

import React, { useState, useEffect } from 'react';
import { AlertTriangle, RefreshCw, Users, ChevronDown, ChevronUp, CheckCircle2, X } from 'lucide-react';

interface BannerTreinamentoProps {
  currentUser?: any;
  contratoNumero?: string;
  onUsuarioAlterado?: () => void;
}

export default function BannerTreinamento({ currentUser, contratoNumero, onUsuarioAlterado }: BannerTreinamentoProps) {
  const [isTreinamento, setIsTreinamento] = useState(false);
  const [resetando, setResetando] = useState(false);
  const [expandido, setExpandido] = useState(true);
  const [mensagem, setMensagem] = useState<string | null>(null);

  useEffect(() => {
    const isEnvTreino = process.env.NEXT_PUBLIC_IS_TREINAMENTO === 'true';
    const isHostTreino =
      typeof window !== 'undefined' &&
      (window.location.hostname.includes('treino') ||
        window.location.hostname.includes('treinamento') ||
        window.location.search.includes('treinamento') ||
        window.location.search.includes('treino') ||
        localStorage.getItem('uern_modo_treinamento') === 'true');
    const isContratoTreino = Boolean(contratoNumero && contratoNumero.includes('TREINO'));

    if (isEnvTreino || isHostTreino || isContratoTreino) {
      setIsTreinamento(true);
      if (typeof window !== 'undefined' && (window.location.search.includes('treinamento') || window.location.search.includes('treino'))) {
        localStorage.setItem('uern_modo_treinamento', 'true');
      }
    }
  }, [contratoNumero]);

  if (!isTreinamento) {
    return null;
  }

  const perfisDidaticos = [
    {
      label: 'Demandante (Unidade)',
      nome: 'Profª Fátima Souza',
      email: 'aluno.demandante@uern.br',
      role: 'DEMANDANTE',
      icone: '🎓',
      desc: 'Praticar abertura de chamados e ateste digital de 5 dias',
    },
    {
      label: 'Fiscal Técnico',
      nome: 'Eng. Carlos Eduardo',
      email: 'aluno.fiscal.tec@uern.br',
      role: 'FISCAL_TECNICO',
      icone: '🔍',
      desc: 'Análise técnica de orçamentos e vistorias in loco',
    },
    {
      label: 'Fiscal Administrativo / Gestor',
      nome: 'Dra. Renata Medeiros',
      email: 'aluno.fiscal.adm@uern.br',
      role: 'FISCAL_ADM',
      icone: '📋',
      desc: 'Aprovação de orçamentos > R$ 1.000,00 e controle de saldo',
    },
    {
      label: 'Técnico da Contratada',
      nome: 'Roberto Silva (ECOCLIMA)',
      email: 'aluno.empresa@prestadora.com',
      role: 'EMPRESA',
      icone: '🛠️',
      desc: 'Orçamento, laudo de condenação e conclusão de OS',
    },
    {
      label: 'Administrador Geral',
      nome: 'Instrutor PROAD',
      email: 'aluno.admin@uern.br',
      role: 'ADMIN',
      icone: '🏛️',
      desc: 'Gestão completa, parametrização e auditoria',
    },
  ];

  const handleTrocarPerfil = async (p: any) => {
    try {
      const res = await fetch('/api/auth/role-switch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ targetEmail: p.email }),
      });

      if (res.ok) {
        if (onUsuarioAlterado) {
          onUsuarioAlterado();
        } else {
          window.location.reload();
        }
      } else {
        window.location.reload();
      }
    } catch {
      window.location.reload();
    }
  };

  const handleResetarTurma = async () => {
    if (
      !confirm(
        'Atenção Instrutor:\n\nDeseja restaurar a base de treinamento para o padrão limpo?\nTodos os chamados criados pela turma atual serão reinicializados.'
      )
    ) {
      return;
    }

    setResetando(true);
    setMensagem(null);
    try {
      const res = await fetch('/api/treinamento/reset', { method: 'POST' });
      const data = await res.json();
      if (res.ok) {
        setMensagem('Base de treinamento restaurada com sucesso!');
        setTimeout(() => {
          window.location.reload();
        }, 1200);
      } else {
        alert(data.error || 'Erro ao resetar dados de treinamento.');
      }
    } catch (err: any) {
      alert(err.message || 'Erro ao comunicar com o servidor.');
    } finally {
      setResetando(false);
    }
  };

  const handleDesativarModoTreinoLocal = () => {
    localStorage.removeItem('uern_modo_treinamento');
    setIsTreinamento(false);
  };

  return (
    <div className="bg-gradient-to-r from-amber-600 via-yellow-600 to-amber-700 text-slate-950 shadow-xl border-b border-amber-400/50 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 py-2">
        <div className="flex items-center justify-between gap-3 text-xs">
          {/* Alerta de Modo Treinamento */}
          <div className="flex items-center gap-2 font-black tracking-wide">
            <span className="p-1 rounded-lg bg-black/20 text-white animate-pulse">
              <AlertTriangle className="w-4 h-4 text-yellow-200" />
            </span>
            <div className="flex flex-col sm:flex-row sm:items-center sm:gap-2">
              <span className="uppercase text-[11px] bg-black/25 px-2 py-0.5 rounded text-yellow-100 font-extrabold">
                Ambiente de Treinamento e Capacitação
              </span>
              <span className="text-[11px] text-amber-950 font-semibold hidden md:inline">
                Dados didáticos temporários isolados no Neon (Sem efeito jurídico/contratual).
              </span>
            </div>
          </div>

          {/* Ações Rápidas do Banner */}
          <div className="flex items-center gap-2 shrink-0">
            {/* Botão de Reset da Turma */}
            <button
              type="button"
              onClick={handleResetarTurma}
              disabled={resetando}
              className="px-2.5 py-1 rounded-lg bg-slate-950 text-amber-300 hover:bg-slate-900 font-bold text-[11px] flex items-center gap-1.5 shadow transition disabled:opacity-50 cursor-pointer"
              title="Restaurar dados limpos de treinamento para uma nova turma"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${resetando ? 'animate-spin text-white' : 'text-amber-400'}`} />
              <span className="hidden sm:inline">{resetando ? 'Resetando...' : 'Resetar Turma'}</span>
            </button>

            {/* Toggle de Perfis */}
            <button
              type="button"
              onClick={() => setExpandido(!expandido)}
              className="p-1 rounded-lg bg-black/15 hover:bg-black/25 text-slate-950 transition cursor-pointer"
              title={expandido ? 'Recolher alternador de perfis' : 'Expandir perfis de alunos'}
            >
              {expandido ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>

            {/* Fechar Modo Local se foi ativado via search/localStorage */}
            {!process.env.NEXT_PUBLIC_IS_TREINAMENTO && (
              <button
                type="button"
                onClick={handleDesativarModoTreinoLocal}
                className="p-1 rounded-lg bg-black/10 hover:bg-black/25 text-amber-950 transition cursor-pointer text-[10px]"
                title="Sair do modo treinamento local"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        {mensagem && (
          <div className="mt-1.5 p-1.5 rounded-lg bg-emerald-900/90 text-emerald-100 font-bold text-center text-xs flex items-center justify-center gap-1.5 animate-fadeIn">
            <CheckCircle2 className="w-4 h-4 text-emerald-300" />
            <span>{mensagem}</span>
          </div>
        )}

        {/* Barra de Troca Rápida de Papel Didático (Visível se expandido) */}
        {expandido && (
          <div className="mt-2 pt-2 border-t border-black/10 flex flex-wrap items-center gap-1.5">
            <span className="text-[10px] uppercase font-black text-amber-950 flex items-center gap-1 mr-1">
              <Users className="w-3 h-3" /> Papel do Aluno:
            </span>

            {perfisDidaticos.map((p) => {
              const ativo = currentUser?.role === p.role;
              return (
                <button
                  key={p.role}
                  type="button"
                  onClick={() => handleTrocarPerfil(p)}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition flex items-center gap-1 cursor-pointer ${
                    ativo
                      ? 'bg-slate-950 text-white shadow-md ring-2 ring-amber-300'
                      : 'bg-black/15 hover:bg-black/30 text-slate-950'
                  }`}
                  title={`${p.nome} - ${p.desc}`}
                >
                  <span>{p.icone}</span>
                  <span>{p.label}</span>
                  {ativo && <span className="text-[9px] text-amber-300 ml-0.5">●</span>}
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
