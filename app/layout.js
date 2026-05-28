import './globals.css';
import { ThemeProvider } from '../context/ThemeContext';
import ThemeSwitcher from '../components/ThemeSwitcher';

export const metadata = {
  title: 'ARY & MAZ Developments — Smart Calculator',
  description: 'Internal sales tool for pricing, payment schedules, and inventory management.',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body style={{ background: 'var(--bg)' }}>
        <ThemeProvider>
          <ThemeSwitcher />
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
