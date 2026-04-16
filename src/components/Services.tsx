import { SERVICES } from "@/lib/barber";
import fadeImg from "@/assets/cut-fade.jpg";
import socialImg from "@/assets/cut-social.jpg";
import eventImg from "@/assets/cut-event.jpg";
import toolsImg from "@/assets/tools.jpg";

const images: Record<string, string> = {
  social: socialImg,
  fade: fadeImg,
  evento: eventImg,
  manutencao: toolsImg,
  personalizado: fadeImg,
};

const Services = () => {
  return (
    <section id="servicos" className="py-24 md:py-32 bg-gradient-dark">
      <div className="container">
        <div className="max-w-2xl mb-16">
          <p className="text-primary uppercase tracking-[0.3em] text-xs mb-4">Serviços</p>
          <h2 className="font-serif text-4xl md:text-5xl mb-5">Cortes que contam uma história</h2>
          <p className="text-muted-foreground text-lg">
            Cada estilo é pensado para o seu rosto, sua rotina e sua personalidade.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {SERVICES.map((s, i) => (
            <article
              key={s.id}
              className="group relative overflow-hidden rounded-lg border border-border bg-card shadow-elegant transition-all duration-500 hover:border-primary/40 hover:-translate-y-1"
              style={{ animationDelay: `${i * 80}ms` }}
            >
              <div className="aspect-[4/5] overflow-hidden">
                <img
                  src={images[s.id]}
                  alt={s.title}
                  loading="lazy"
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-card via-card/40 to-transparent" />
              </div>
              <div className="absolute bottom-0 inset-x-0 p-6">
                <h3 className="font-serif text-2xl mb-2">{s.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{s.desc}</p>
              </div>
            </article>
          ))}
        </div>

        <p className="text-center text-sm text-muted-foreground mt-12 italic">
          Valores a combinar no momento do agendamento.
        </p>
      </div>
    </section>
  );
};

export default Services;
