
import type { Metadata } from 'next';
import { Inter } from 'next/font/google'; // Using Inter for a clean, modern look
import './globals.css';
import { Toaster } from '@/components/ui/toaster'; // Import Toaster
import { cn } from '@/lib/utils';
import { AuthProvider } from '@/context/AuthContext'; // Import AuthProvider

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-sans', // Changed variable name for clarity
});

export const metadata: Metadata = {
  title: 'TraiHVail', // Updated title
  description: 'Interactive AI Learning Assistant', // Updated description
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    // Removed whitespace and comments inside <html> tag
    <html lang="en" className="dark" suppressHydrationWarning>
       {/* No direct whitespace or comments here */}
      <head>
         {/* Default Next.js head elements will be injected here */}
      </head>
      <body
        className={cn(
          'min-h-screen bg-background font-sans antialiased',
          inter.variable
        )}
      >
        <AuthProvider> {/* Wrap with AuthProvider */}
          {/* Background effects container */}
          <div className="fixed inset-0 z-[-1] overflow-hidden pointer-events-none">
              <div className="absolute inset-0 opacity-20 bg-grid-pattern animate-grid-scroll"></div>
              {/* Add more background elements here if needed, like stars */}
               <div className="absolute inset-0 stars"></div>
               <div className="absolute inset-0 stars2"></div>
               <div className="absolute inset-0 stars3"></div>
               {/* Floating elements */}
               <div className="floating-element element-1 animate-float" style={{ animationDuration: '20s' }}></div>
               <div className="floating-element element-2 animate-float-delay" style={{ animationDuration: '14s' }}></div>
               <div className="floating-element element-3 animate-float" style={{ animationDuration: '22s', animationDelay: '-12s' }}></div>
               <div className="floating-element element-4 animate-float-delay" style={{ animationDuration: '16s', animationDelay: '-3s' }}></div> {/* Added fourth element */}
          </div>
          {children}
          <Toaster /> {/* Add Toaster */}
        </AuthProvider>
      </body>
    </html>
  );
}
