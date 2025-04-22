import './globals.css';
import { Roboto_Mono, Inter } from 'next/font/google';
import Image from 'next/image';
import { Github, LogOut } from 'lucide-react';

import { ActiveLink } from '@/components/Navbar';
import { Button } from '@/components/ui/button';
import { Toaster } from '@/components/ui/sonner';
import { auth0 } from '@/lib/auth0';

const robotoMono = Roboto_Mono({ weight: '400', subsets: ['latin'] });
const publicSans = Inter({ weight: '400', subsets: ['latin'] });

const TITLE = 'Simple Stack';
const DESCRIPTION = 'A clean and simple stack for building AI-powered applications.';

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const session = await auth0.getSession();

  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <title>{TITLE}</title>
        <link rel="shortcut icon" type="image/svg+xml" href="/images/favicon.png" />
        <meta name="description" content={DESCRIPTION} />
        <meta property="og:title" content={TITLE} />
        <meta property="og:description" content={DESCRIPTION} />
        <meta property="og:image" content="/images/og-image.png" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={TITLE} />
        <meta name="twitter:description" content={DESCRIPTION} />
        <meta name="twitter:image" content="/images/og-image.png" />
      </head>
      <body className={publicSans.className}>
        <div className="grid grid-rows-[auto,1fr] h-[100dvh] bg-background">
          <div className="grid grid-cols-[1fr,auto] gap-2 p-4 border-b">
            <div className="flex gap-4 flex-col md:flex-row md:items-center">
              <span className={`${robotoMono.className} text-2xl`}>Simple Stack</span>
              <nav className="flex gap-1 flex-col md:flex-row">
                <ActiveLink href="/">Chat</ActiveLink>
              </nav>
            </div>
            <div className="flex justify-center">
              {session && (
                <>
                  <div className="flex items-center gap-2 px-4">Welcome, {session?.user?.name}!</div>
                  <Button asChild variant="destructive" size="default" className="mx-2">
                    <a href="/auth/logout" className="flex items-center gap-2">
                      <LogOut />
                      <span>Logout</span>
                    </a>
                  </Button>
                </>
              )}
              <Button asChild variant="outline" size="default">
                <a href="https://github.com/oktadev/auth0-assistant0" target="_blank">
                  <Github className="size-3" />
                  <span>Open in GitHub</span>
                </a>
              </Button>
            </div>
          </div>
          <div className="relative grid">
            <div className="absolute inset-0">{children}</div>
          </div>
        </div>
        <Toaster />
      </body>
    </html>
  );
}
