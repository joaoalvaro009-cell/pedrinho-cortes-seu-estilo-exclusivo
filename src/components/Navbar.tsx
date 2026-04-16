import { Scissors } from "lucide-react";
import { Button } from "@/components/ui/button";

const Navbar = () => {
  return (
    <header className="fixed top-0 inset-x-0 z-50 bg-background/70 backdrop-blur-md border-b border-border/50">
      <div className="container flex items-center justify-between h-16">
        <a href="#home" className="flex items-center gap-2 group">
          <Scissors className="h-5 w-5 text-primary transition-transform group-hover:rotate-12" />
          <span className="font-serif text-lg tracking-wide">Pedrinho <span className="text-gold">Cortes</span></span>
        </a>
        <nav className="hidden md:flex items-center gap-8 text-sm text-muted-foreground">
          <a href="#servicos" className="hover:text-foreground transition-colors">Serviços</a>
          <a href="#sobre" className="hover:text-foreground transition-colors">Sobre</a>
          <a href="#agendar" className="hover:text-foreground transition-colors">Agendar</a>
        </nav>
        <Button asChild size="sm" variant="default" className="bg-gradient-gold text-primary-foreground hover:opacity-90 shadow-gold">
          <a href="#agendar">Agendar</a>
        </Button>
      </div>
    </header>
  );
};

export default Navbar;
