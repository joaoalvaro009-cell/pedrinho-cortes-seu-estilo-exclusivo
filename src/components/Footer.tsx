import { Scissors, Lock } from "lucide-react";
import { Link } from "react-router-dom";

const Footer = () => {
  return (
    <footer className="border-t border-border py-10">
      <div className="container flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <Scissors className="h-4 w-4 text-primary" />
          <span className="font-serif">Pedrinho <span className="text-gold">Cortes</span></span>
        </div>
        <p className="text-xs text-muted-foreground">
          © {new Date().getFullYear()} Pedrinho Cortes — Atendimento personalizado.
        </p>
        <Link
          to="/admin/login"
          className="inline-flex items-center gap-1.5 text-xs text-muted-foreground/70 hover:text-primary transition-colors"
          aria-label="Área do barbeiro"
        >
          <Lock className="h-3 w-3" />
          Área do barbeiro
        </Link>
      </div>
    </footer>
  );
};

export default Footer;
