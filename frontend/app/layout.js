// app/layout.js
import './globals.css';
import { Poppins } from 'next/font/google';
import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from '@vercel/speed-insights/next';
import NextAuthSessionProvider from './provider';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const poppins = Poppins({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
});

export const metadata = {
  title: 'BlinkBasket - Online Grocery Delivery',
  description:
    'BlinkBasket lets you shop groceries instantly with smart recommendations, fast delivery, and seamless cart management.',
  keywords: [
    'BlinkBasket',
    'Online Grocery',
    'Quick Delivery',
    'Ecommerce',
    'Groceries',
  ],
  robots: 'index, follow',
  authors: [{ name: 'BlinkBasket' }],
  creator: 'BlinkBasket',
  openGraph: {
    title: 'BlinkBasket - Smart Grocery Shopping',
    description:
      'Order groceries online with lightning-fast delivery and a seamless shopping experience.',
    url: 'https://blink-basket.vercel.app', // 🔥 replace later
    siteName: 'BlinkBasket',
    images: [
      {
        url: '/Blinkbasketlogo.JPEG',
        width: 512,
        height: 512,
        alt: 'BlinkBasket Logo',
      },
    ],
    locale: 'en_US',
    type: 'website',
  },
  metadataBase: new URL('https://blink-basket.vercel.app'), // 🔥 replace later
  themeColor: '#0ea5e9',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        {/* PWA Setup */}
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#0ea5e9" />

        {/* iOS Support */}
        <link rel="apple-touch-icon" href="/Blinkbasketlogo.JPEG" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta
          name="apple-mobile-web-app-status-bar-style"
          content="black-translucent"
        />
        <meta name="apple-mobile-web-app-title" content="BlinkBasket" />
      </head>

      <body className={`${poppins.className} bg-white`}>
        <NextAuthSessionProvider>
          {children}
        </NextAuthSessionProvider>

        {/* Toast Notifications */}
        <ToastContainer
          position="top-right"
          autoClose={3000}
          hideProgressBar={false}
          newestOnTop={false}
          closeOnClick
          pauseOnFocusLoss
          draggable
          pauseOnHover
          theme="light"
          toastClassName="custom-toast"
          progressClassName="custom-progress"
          style={{ zIndex: 1000 }}
        />

        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}