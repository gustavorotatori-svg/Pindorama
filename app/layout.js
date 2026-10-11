import './globals.css';

export const metadata = {
  title: 'Pindorama — Dashboard de Prospecção',
  description: 'Dashboard vivo da prospecção Pindorama',
};

export default function RootLayout({ children }) {
  return (
    <html lang="pt-BR">
      <body>{children}</body>
    </html>
  );
}
