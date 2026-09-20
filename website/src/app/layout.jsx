import { LanguageProvider } from '../context/LanguageContext';
import './globals.css';

export const metadata = {
  title: 'FileFly — Fast Local File Transfer Without Internet',
  description: 'Transfer large files, folders, and text directly over local Wi-Fi between PC, Android, iPhone, and Mac without internet at maximum speed.',
  icons: {
    icon: '/icon.svg',
    shortcut: '/icon-192.png',
    apple: '/icon-192.png',
  },
};

export const viewport = {
  themeColor: '#020617',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" dir="ltr" className="dark scroll-smooth">
      <body className="bg-slate-950 text-slate-100 antialiased selection:bg-brand-500 selection:text-white min-h-screen flex flex-col">
        <LanguageProvider>
          {children}
        </LanguageProvider>
      </body>
    </html>
  );
}
