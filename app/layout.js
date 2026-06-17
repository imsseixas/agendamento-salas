import "./globals.css";

export const metadata = {
  title: "Agendamento de Salas — Santa Izabel",
  description: "Sistema de reserva de salas da instituição Santa Izabel",
};

export default function RootLayout({ children }) {
  return (
    <html lang="pt-BR">
      <body>{children}</body>
    </html>
  );
}
