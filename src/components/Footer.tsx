import { Scissors } from "lucide-react";

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
      </div>
    </footer>
  );
};

export default Footer;
