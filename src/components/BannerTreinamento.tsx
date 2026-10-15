'use client';

import React, { useState, useEffect } from 'react';
import { AlertTriangle, RefreshCw, Users, ShieldCheck, CheckCircle2, X, Lock } from 'lucide-react';

interface BannerTreinamentoProps {
  currentUser?: any;
  contratoNumero?: string;
  onUsuarioAlterado?: () => void;
}

export default function BannerTreinamento({ currentUser, contratoNumero, onUsuarioAlterado }: BannerTreinamentoProps) {
  const [isTreinamento, setIsTreinamento] = useState(false);
  const [resetando, setResetando] = useState(false);
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

  // Verifica se o usuário real é Administrador da PROAD
  const isAdminReal =
    currentUser?.role === 'ADMIN' ||
    currentUser?.email === 'pedroreboucas@uern.br' ||
    currentUser?.email === 'adj.proad@uern.br';

  const handleResetarTurma = async () => {
    if (
      !confirm(
        'Atenção Administrador / Instrutor PROAD:\n\nDeseja restaurar a base de treinamento para o padrão limpo?\nTodos os chamados criados pela turma atual serão reinicializados.'
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
        setMensagem('Base de dados de treinamento restaurada com sucesso!');
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
    window.location.href = window.location.pathname;
  };

  // Papel formatado para exibição
  const formatRole = (role?: string) => {
    switch (role) {
      case 'ADMIN':
        return 'Administrador Geral PROAD';
      case 'FISCAL_TECNICO':
        return 'Fiscal Técnico (Engenharia/Clima)';
      case 'FISCAL_ADM':
        return 'Fiscal Administrativo / Gestor';
      case 'DEMANDANTE':
        return 'Demandante da Unidade';
      case 'EMPRESA':
        return 'Técnico da Empresa Prestadora';
      default:
        return role || 'Usuário';
    }
  };

  return (
    <div className="bg-gradient-to-r from-amber-600 via-yellow-600 to-amber-700 text-slate-950 shadow-xl border-b border-amber-400/50 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 py-2.5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
          {/* Identificação de Treinamento e Usuário Real */}
          <div className="flex items-center gap-2.5 font-bold">
            <span className="p-1 rounded-lg bg-black/20 text-white animate-pulse">
              <AlertTriangle className="w-4 h-4 text-yellow-200" />
            </span>
            <div>
              <div className="flex items-center gap-2">
                <span className="uppercase text-[10px] bg-black/30 px-2 py-0.5 rounded text-yellow-100 font-extrabold tracking-wider">
                  Ambiente de Treinamento & Capacitação
                </span>
                <span className="text-[11px] text-amber-950 font-semibold hidden md:inline">
                  (Dados didáticos isolados • Sem efeito jurídico/financeiro)
                </span>
              </div>
              <div className="text-[11px] text-slate-950 mt-0.5 flex flex-wrap items-center gap-1.5 font-semibold">
                <span>Usuário Conectado:</span>
                <strong className="text-black bg-white/40 px-1.5 py-0.2 rounded font-extrabold">
                  {currentUser?.nome || 'Usuário Real'}
                </strong>
                {currentUser?.email && (
                  <span className="text-amber-950 text-[10px]">({currentUser.email})</span>
                )}
                <span className="mx-1">•</span>
                <span>Perfil Autorizado pelo Admin:</span>
                <span className="bg-black text-amber-300 px-2 py-0.5 rounded-full text-[10px] font-extrabold shadow-sm">
                  {formatRole(currentUser?.role)}
                </span>
                {currentUser?.unidadeSigla && (
                  <span className="text-amber-950 text-[10px]">
                    • Unidade: <strong>{currentUser.unidadeSigla}</strong>
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Ações do Banner */}
          <div className="flex items-center gap-2 shrink-0">
            {/* Botão de Reset da Turma exclusivo para Administrador / Instrutor */}
            {isAdminReal && (
              <button
                type="button"
                onClick={handleResetarTurma}
                disabled={resetando}
                className="px-3 py-1 rounded-lg bg-slate-950 text-amber-300 hover:bg-slate-900 font-bold text-[11px] flex items-center gap-1.5 shadow transition disabled:opacity-50 cursor-pointer"
                title="Ação de Administrador: Reinicializar os dados da turma para um novo treinamento"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${resetando ? 'animate-spin text-white' : 'text-amber-400'}`} />
                <span>{resetando ? 'Resetando...' : 'Resetar Base Didática'}</span>
              </button>
            )}

            {/* Aviso de perfil fixo para usuários não administradores */}
            {!isAdminReal && (
              <span className="text-[10px] bg-black/15 text-amber-950 px-2 py-1 rounded-md font-semibold flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>Perfil Delimitado pelo Admin</span>
              </span>
            )}

            {/* Sair do Modo Treinamento */}
            <button
              type="button"
              onClick={handleDesativarModoTreinoLocal}
              className="p-1.5 rounded-lg bg-black/10 hover:bg-black/25 text-amber-950 transition cursor-pointer text-[10px] flex items-center gap-1 font-bold"
              title="Voltar para a Produção Oficial"
            >
              <X className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Sair do Treino</span>
            </button>
          </div>
        </div>

        {mensagem && (
          <div className="mt-2 p-1.5 rounded-lg bg-emerald-900/90 text-emerald-100 font-bold text-center text-xs flex items-center justify-center gap-1.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-300" />
            <span>{mensagem}</span>
          </div>
        )}
      </div>
    </div>
  );
}
