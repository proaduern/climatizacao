import type { Metadata } from 'next';
import './globals.css';
import PdfAutenticacaoInit from '@/components/PdfAutenticacaoInit';

export const metadata: Metadata = {
  title: 'SIG-CLIMA • Gestão de Climatização e Refrigeração | PROAD - UERN',
  description: 'Sistema integrado de gestão patrimonial térmica, ordens de serviço, orçamentos e fiscalização de contratos de climatização e refrigeração da UERN.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-BR">
      <body className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
        <PdfAutenticacaoInit modulo="CLIMATIZACAO_DOCUMENTO" />
        {children}
      </body>
    </html>
  );
}
