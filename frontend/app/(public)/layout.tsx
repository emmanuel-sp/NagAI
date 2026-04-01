import Footer from "@/components/Footer";
import { ThemeProvider } from "@/contexts/ThemeContext";

interface PublicLayoutProps {
  children: React.ReactNode;
}

export default function PublicLayout({ children }: PublicLayoutProps) {
  return (
    <ThemeProvider>
      {children}
      <Footer />
    </ThemeProvider>
  );
}
