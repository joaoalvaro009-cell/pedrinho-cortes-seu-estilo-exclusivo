import heroImg from "@/assets/hero-barber.jpg";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";

const Hero = () => {
  return (
    <section id="home" className="relative min-h-screen flex items-center overflow-hidden">
      <img
        src={heroImg}
        alt="Pedrinho Cortes — barbeiro premium segurando tesoura"
        width={1920}
        height={1080}
        className="absolute inset-0 w-full h-full object-cover object-center animate-fade-in-slow"
      />
      <div className="absolute inset-0 hero-overlay" />
      <div className="absolute inset-0 bg-background/40 md:bg-background/20" />

      <div className="container relative z-10 pt-24 pb-16">
        <div className="max-w-2xl animate-fade-in">
          <p className="text-primary uppercase tracking-[0.3em] text-xs mb-6">Barbeiro Premium</p>
          <h1 className="font-serif text-5xl md:text-7xl leading-[1.05] mb-6">
            Pedrinho <span className="text-gold">Cortes</span>
          </h1>
          <p className="text-lg md:text-xl text-muted-foreground max-w-xl mb-10 leading-relaxed">
            Cortes personalizados com horário marcado e atendimento exclusivo — fora do ambiente da barbearia tradicional.
          </p>
          <div className="flex flex-col sm:flex-row gap-4">
            <Button asChild size="lg" className="bg-gradient-gold text-primary-foreground hover:opacity-90 shadow-gold h-14 px-8 text-base">
              <a href="#agendar">
                Agendar horário <ArrowRight className="ml-2 h-4 w-4" />
              </a>
            </Button>
            <Button asChild size="lg" variant="outline" className="h-14 px-8 text-base border-border bg-background/40 backdrop-blur">
              <a href="#servicos">Ver serviços</a>
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Hero;
