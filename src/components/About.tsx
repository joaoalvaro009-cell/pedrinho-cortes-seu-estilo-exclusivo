import toolsImg from "@/assets/tools.jpg";
import { Award, Clock, MapPin, Sparkles } from "lucide-react";

const features = [
  { icon: Sparkles, title: "Atendimento exclusivo", desc: "Um cliente por vez. Sem fila, sem pressa." },
  { icon: Clock, title: "Horário flexível", desc: "Agenda adaptada à sua rotina." },
  { icon: MapPin, title: "Fora da barbearia", desc: "Ambiente reservado e personalizado." },
  { icon: Award, title: "Qualidade premium", desc: "Acabamento impecável em cada detalhe." },
];

const About = () => {
  return (
    <section id="sobre" className="py-24 md:py-32">
      <div className="container grid md:grid-cols-2 gap-16 items-center">
        <div className="relative">
          <div className="aspect-[4/5] overflow-hidden rounded-lg shadow-elegant">
            <img src={toolsImg} alt="Ferramentas profissionais de barbeiro" loading="lazy" className="w-full h-full object-cover" />
          </div>
          <div className="absolute -bottom-6 -right-6 hidden md:block bg-gradient-gold text-primary-foreground p-6 rounded-lg shadow-gold max-w-[180px]">
            <p className="font-serif text-3xl leading-none">+10</p>
            <p className="text-xs uppercase tracking-widest mt-1">anos de experiência</p>
          </div>
        </div>

        <div>
          <p className="text-primary uppercase tracking-[0.3em] text-xs mb-4">Sobre</p>
          <h2 className="font-serif text-4xl md:text-5xl mb-6">Mais que um corte. Uma experiência.</h2>
          <p className="text-muted-foreground text-lg leading-relaxed mb-4">
            Sou Pedrinho — barbeiro dedicado a um estilo de atendimento diferente. Trabalho com horário marcado, individualmente, fora do ambiente da barbearia tradicional.
          </p>
          <p className="text-muted-foreground leading-relaxed mb-10">
            Meu foco é entregar cortes personalizados, com atenção total ao cliente. Sem pressa, sem distração — apenas você, sua identidade e o resultado que merece.
          </p>

          <div className="grid sm:grid-cols-2 gap-6">
            {features.map((f) => (
              <div key={f.title} className="flex gap-4">
                <div className="shrink-0 h-10 w-10 rounded-md bg-primary/10 border border-primary/20 flex items-center justify-center">
                  <f.icon className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <h3 className="font-medium mb-1">{f.title}</h3>
                  <p className="text-sm text-muted-foreground">{f.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default About;
