import './globals.css';

export const metadata = {
  title: 'ARY & MAZ Developments — Smart Calculator',
  description: 'Internal sales tool for pricing, payment schedules, and inventory management.',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
