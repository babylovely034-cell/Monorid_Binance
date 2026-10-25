import type {Metadata} from 'next';
import './globals.css'; // Global styles

export const metadata: Metadata = {
  title: 'Monorid | Binance Futures USDT-M Algo Trading Terminal',
  description: 'Automated 5-minute algorithmic trading terminal executing PMax and Pro Scalper AI strategy with dynamic category scanners and risk management.',
  openGraph: {
    title: 'Monorid | Binance Futures USDT-M Algo Trading Terminal',
    description: 'Automated 5-minute algorithmic trading terminal executing PMax and Pro Scalper AI strategy with dynamic category scanners and risk management.',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Monorid | Binance Futures USDT-M Algo Trading Terminal',
    description: 'Automated 5-minute algorithmic trading terminal executing PMax and Pro Scalper AI strategy with dynamic category scanners and risk management.',
  },
};

export default function RootLayout({children}: {children: React.ReactNode}) {
  return (
    <html lang="en">
      <body suppressHydrationWarning>{children}</body>
    </html>
  );
}
