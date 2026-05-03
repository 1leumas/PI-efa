import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Sidebar } from "@/components/Sidebar";
import { Header } from "@/components/Header";
import { ThemeProvider } from "@/components/theme-provider";
import { Toaster } from "@/components/ui/sonner";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Gerador de Horários",
  description: "Gerador automatizado de horários escolares",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
	<html
	  lang="pt-BR"
	  className={`${inter.className} h-full antialiased`}
	  suppressHydrationWarning
	>
	  <body className="min-h-full flex flex-row">
		<ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
		  <Sidebar />
		  <div className="flex flex-1 flex-col overflow-hidden">
			<Header />
			<main className="flex-1 overflow-y-auto bg-muted/20 p-6 md:p-8">
			  {children}
			</main>
		  </div>
		  <Toaster />
		</ThemeProvider>
	  </body>
	</html>
  );
}
