export const metadata = {
  title: 'Beach Tennis Platform',
  description: 'Gestão de torneios de Beach Tennis'
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-BR">
      <body>{children}</body>
    </html>
  );
}
