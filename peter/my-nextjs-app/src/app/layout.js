import { FullScreenLayoutNoHandle } from '@/components/full-screen-layout-no-handle'
import "./globals.css";

export const metadata = {
  title: "My Next.js App",
  description: "A full-screen layout application",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className="h-full">
      <body className="h-full">
        <FullScreenLayoutNoHandle>
          {children}
        </FullScreenLayoutNoHandle>
      </body>
    </html>
  );
}
