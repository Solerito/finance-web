import type { Metadata } from 'next';
import './globals.css';
import { Sidebar } from '@/components/layout/Sidebar';
import { ToastProvider } from '@/components/ui/ToastProvider';
import { GlobalShortcuts } from '@/components/ui/GlobalShortcuts';

export const metadata: Metadata = {
  title: 'Gestor Financiero',
  description:
    'Aplicación de gestión financiera personal. Controla tus ingresos, gastos y beneficio neto con gráficas interactivas.',
  keywords: ['finanzas personales', 'gestor financiero', 'presupuesto', 'ingresos', 'gastos'],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" className="h-full antialiased">
      <body className="bg-paper min-h-full flex flex-col lg:flex-row">
        <ToastProvider>
          <GlobalShortcuts />
          <Sidebar />
          <div className="flex-1 flex flex-col min-w-0 overflow-x-hidden">
            {children}
          </div>
        </ToastProvider>
      </body>
    </html>
  );
}
