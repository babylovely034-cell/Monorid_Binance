import type {Metadata} from 'next';
import './globals.css'; // Global styles

export const metadata: Metadata = {
  title: 'Monorid | Binance Futures USDT-M Algo Trading Terminal',
  description: 'Autonomous 5-minute algorithmic trading terminal executing proprietary dual-engine quantitative strategies with dynamic category scanners and institutional risk management by Trading Lifestyle Quant.',
  openGraph: {
    title: 'Monorid | Binance Futures USDT-M Algo Trading Terminal',
    description: 'Autonomous 5-minute algorithmic trading terminal executing proprietary dual-engine quantitative strategies with dynamic category scanners and institutional risk management by Trading Lifestyle Quant.',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Monorid | Binance Futures USDT-M Algo Trading Terminal',
    description: 'Autonomous 5-minute algorithmic trading terminal executing proprietary dual-engine quantitative strategies with dynamic category scanners and institutional risk management by Trading Lifestyle Quant.',
  },
};

export default function RootLayout({children}: {children: React.ReactNode}) {
  return (
    <html lang="en">
      <body suppressHydrationWarning>{children}</body>
    </html>
  );
}
