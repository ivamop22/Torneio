import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Beach Tennis Platform — Torneios ao Vivo',
  description: 'Plataforma SaaS de gestão de torneios de Beach Tennis com chaveamento automático',
  openGraph: {
    title: 'Beach Tennis Platform',
    description: 'Torneios de Beach Tennis com chaveamento automático',
    type: 'website',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="bg-slate-950 text-slate-100 min-h-screen antialiased">
        {children}
      </body>
    </html>
  );
}
