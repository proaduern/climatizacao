'use client';

import React, { useState, useEffect } from 'react';
import {
  Snowflake,
  ShieldCheck,
  Building2,
  Wrench,
  UserCheck,
  ExternalLink,
  ChevronDown,
  RefreshCw,
  LogOut,
  Sparkles,
  Users,
} from 'lucide-react';

interface NavbarProps {
  currentUser: any;
  onRoleSwitched: () => void;
  activeTab?: string;
  onTabChange?: (tab: any) => void;
}

export default function Navbar({ currentUser, onRoleSwitched, activeTab, onTabChange }: NavbarProps) {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [switching, setSwitching] = useState(false);
  const [tecnicosCadastrados, setTecnicosCadastrados] = useState<any[]>([]);

  // Carrega técnicos da empresa cadastrados pelo Admin
  useEffect(() => {
    fetch('/api/usuarios?role=EMPRESA')
      .then((res) => res.json())
      .then((data) => {
        if (data.usuarios) {
          // Filtra técnicos excluindo o preposto
          const tecs = data.usuarios.filter((u: any) => !u.nome.toLowerCase().includes('preposto'));
          setTecnicosCadastrados(tecs);
        }
      })
      .catch(() => {});
  }, [dropdownOpen]);

  // Personas Oficiais com dados reais sincronizados do SGC
  const basePersonas = [
    {
      role: 'ADMIN',
      nome: 'Pedro Eloy de Paiva Farias',
      email: 'pedroeloy@uern.br',
      cargo: 'Gestor do Contrato • PROAD / SGC',
      badgeColor: 'bg-purple-500/20 text-purple-300 border-purple-500/30',
    },
    {
      role: 'ADMIN',
      nome: 'PROAD Infraestrutura',
      email: 'fernando.admin@uern.br',
      cargo: 'Administrador do Sistema',
      badgeColor: 'bg-purple-500/20 text-purple-300 border-purple-500/30',
    },
    {
      role: 'FISCAL_TECNICO',
      nome: 'José Luiz de Melo Júnior',
      email: 'joseluiz@uern.br',
      cargo: 'Fiscal Técnico (Contrato 11/2026 • SGC)',
      badgeColor: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
    },
    {
      role: 'ENGENHARIA_SOBE',
      nome: 'Eng. Roberto Alves',
      email: 'sobe.engenharia@uern.br',
      cargo: 'Superintendência de Obras e Engenharia • SOBE',
      badgeColor: 'bg-orange-500/20 text-orange-300 border-orange-500/30',
    },
    {
      role: 'EMPRESA',
      nome: 'Josemildo (Preposto)',
      email: 'ebenezerecomser@gmail.com',
      cargo: 'Preposto SGC • L O DOS SANTOS ECOMSER',
      badgeColor: 'bg-amber-500/20 text-amber-300 border-amber-500/30',
    },
    {
      role: 'DEMANDANTE',
      nome: 'Maria Souza Silva',
      email: 'maria.fafic@uern.br',
      cargo: 'Demandante • FAFIC',
      badgeColor: 'bg-blue-500/20 text-blue-300 border-blue-500/30',
    },
    {
      role: 'DEMANDANTE',
      nome: 'João Paulo Medeiros',
      email: 'joao.proad@uern.br',
      cargo: 'Demandante • Gabinete PROAD',
      badgeColor: 'bg-blue-500/20 text-blue-300 border-blue-500/30',
    },
  ];

  // Adiciona técnicos da empresa cadastrados pelo admin
  const dynamicPersonas = [
    ...basePersonas,
    ...tecnicosCadastrados.map((tec) => ({
      role: 'EMPRESA',
      nome: `${tec.nome} (Técnico)`,
      email: tec.email,
      cargo: `Técnico de Campo (CPF: ${tec.cpf || 'Cadastrado'})`,
      badgeColor: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/30',
    })),
  ];

  const handleSwitchPersona = async (email: string) => {
    setSwitching(true);
    try {
      const res = await fetch('/api/auth/role-switch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ targetEmail: email }),
      });
      if (res.ok) {
        setDropdownOpen(false);
        onRoleSwitched();
      }
    } finally {
      setSwitching(false);
    }
  };

  const portalUrl = process.env.NEXT_PUBLIC_PORTAL_URL || 'http://localhost:3001';

  return (
    <header className="border-b border-white/10 bg-slate-900/90 backdrop-blur-md sticky top-0 z-40 px-6 py-3.5 shadow-xl">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        {/* Identidade SIG-CLIMA */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-400 to-blue-600 flex items-center justify-center font-bold text-slate-950 shadow-lg shadow-cyan-500/10">
            <Snowflake className="w-6 h-6 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-wider text-amber-400">UERN • PROAD</span>
              <span className="text-[10px] bg-cyan-500/10 text-cyan-300 px-2 py-0.5 rounded-full border border-cyan-500/30 font-semibold flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-cyan-400" /> SIG-CLIMA
              </span>
            </div>
            <h1 className="text-sm font-bold text-white tracking-tight flex items-center gap-1.5">
              <span>Gestão de Climatização e Refrigeração</span>
            </h1>
          </div>
        </div>

        {/* User Info & Persona Switcher */}
        <div className="flex items-center gap-4">
          {/* Seletor de Persona para Testes Rápidos */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setDropdownOpen(!dropdownOpen)}
              className="flex items-center gap-2.5 px-3 py-1.5 rounded-xl bg-slate-800/80 hover:bg-slate-800 border border-white/15 text-xs text-slate-200 transition shadow-sm"
              title="Trocar perfil de acesso"
            >
              <div className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
              <div className="text-left hidden sm:block">
                <div className="font-semibold text-white leading-tight">{currentUser?.nome}</div>
                <div className="text-[10px] text-slate-400">
                  {currentUser?.role === 'ADMIN' && '👑 Admin PROAD'}
                  {currentUser?.role === 'DEMANDANTE' && `🏛️ ${currentUser?.unidadeSigla || 'Unidade'}`}
                  {currentUser?.role === 'EMPRESA' && (currentUser?.empresaRazaoSocial ? `🛠️ ${currentUser.empresaRazaoSocial}` : '🛠️ L O DOS SANTOS')}
                  {currentUser?.role === 'FISCAL_TECNICO' && '📐 Fiscal Técnico (SGC)'}
                  {currentUser?.role === 'ENGENHARIA_SOBE' && '🏗️ Engenharia SOBE'}
                  {currentUser?.role === 'FISCAL_ADM' && '📋 Fiscal Adm (SGC)'}
                  {currentUser?.role === 'GESTOR_CONTRATO' && '🏛️ Gestor Contrato (SGC)'}
                </div>
              </div>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
            </button>

            {dropdownOpen && (
              <div className="absolute right-0 mt-2 w-80 max-h-[80vh] overflow-y-auto rounded-2xl bg-slate-900 border border-white/15 shadow-2xl p-2 z-50 text-xs animate-in fade-in zoom-in-95">
                <div className="px-3 py-2 text-[11px] font-bold uppercase tracking-wider text-slate-400 border-b border-white/10 mb-1 flex items-center justify-between">
                  <span>Simular Perfil de Acesso</span>
                  {switching && <RefreshCw className="w-3 h-3 animate-spin text-cyan-400" />}
                </div>

                <div className="space-y-1">
                  {dynamicPersonas.map((p) => {
                    const isSelected = currentUser?.email === p.email;
                    return (
                      <button
                        key={p.email}
                        type="button"
                        onClick={() => handleSwitchPersona(p.email)}
                        disabled={switching}
                        className={`w-full text-left p-2.5 rounded-xl transition flex flex-col gap-0.5 ${
                          isSelected
                            ? 'bg-cyan-500/20 border border-cyan-500/40 text-cyan-200'
                            : 'hover:bg-slate-800/80 text-slate-300'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-white truncate max-w-[180px]">{p.nome}</span>
                          <span className={`text-[9px] px-1.5 py-0.5 rounded border font-semibold ${p.badgeColor}`}>
                            {p.role}
                          </span>
                        </div>
                        <span className="text-[11px] text-slate-400 truncate">{p.cargo}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Botão Retornar ao Hub PROAD */}
          <a
            href={`${portalUrl}/hub`}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/15 text-xs text-slate-300 hover:text-white transition shadow-sm border border-white/10"
            title="Voltar ao Portal Central da PROAD"
          >
            <Building2 className="w-3.5 h-3.5 text-amber-400" />
            <span className="hidden md:inline">Portal PROAD</span>
            <ExternalLink className="w-3 h-3 text-slate-400" />
          </a>
        </div>
      </div>
    </header>
  );
}
