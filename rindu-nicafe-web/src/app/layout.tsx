import type { Metadata } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";

const plusJakartaSans = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-plus-jakarta",
});

export const metadata: Metadata = {
  title: "Login - Rindu Nicafe",
  description: "Sistem Informasi Manajemen Operasional Rindu Nicafe",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id">
      <head>
        <link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap" rel="stylesheet" />
      </head>
      <body className={`${plusJakartaSans.variable} ${plusJakartaSans.className}`}>
        <script dangerouslySetInnerHTML={{ __html: `
          window.onerror = function(msg, url, lineNo, columnNo, error) {
            var el = document.createElement('div');
            el.style.color = 'red';
            el.style.padding = '20px';
            el.style.fontSize = '20px';
            el.style.zIndex = '9999';
            el.style.position = 'absolute';
            el.innerHTML = 'Client Error: ' + msg;
            document.body.prepend(el);
          };
        `}} />
        {children}
      </body>
    </html>
  );
}
