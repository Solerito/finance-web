import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import './globals.css';

const geistSans = Geist({ variable: '--font-geist-sans', subsets: ['latin'] });
const geistMono = Geist_Mono({ variable: '--font-geist-mono', subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Gestor Financiero | Dashboard',
  description:
    'Aplicación de gestión financiera personal. Controla tus ingresos, gastos y beneficio neto con gráficas interactivas.',
  keywords: ['finanzas personales', 'gestor financiero', 'presupuesto', 'ingresos', 'gastos'],
};

export default function RootLayout({ children }: LayoutProps<'/'>) {
  return (
    <html
      lang="es"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="bg-mesh min-h-full flex flex-col">{children}</body>
    </html>
  );
}
