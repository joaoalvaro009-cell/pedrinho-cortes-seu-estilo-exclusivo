// Configuração editável do barbeiro — altere aqui horários, dias e telefone.
export const BARBER = {
  name: "Pedrinho Cortes",
  whatsapp: "75991793513", // formato internacional sem +, ex: 55 11 99999 9999
  // Dias da semana indisponíveis (0 = domingo ... 6 = sábado)
  unavailableWeekdays: [0, 1], // domingo e segunda
  // Datas específicas bloqueadas (formato YYYY-MM-DD)
  blockedDates: [] as string[],
  // Horários disponíveis padrão
  timeSlots: [
    "09:00", "10:00", "11:00",
    "14:00", "15:00", "16:00",
    "17:00", "18:00", "19:00", "20:00",
  ],
};

export const SERVICES = [
  { id: "social", title: "Corte Social", desc: "Clássico, alinhado e atemporal — para o homem que valoriza a elegância." },
  { id: "fade", title: "Degradê", desc: "Transição perfeita, contornos precisos e acabamento impecável." },
  { id: "evento", title: "Corte para Eventos", desc: "Casamentos, formaturas e ocasiões especiais com atendimento dedicado." },
  { id: "manutencao", title: "Manutenção", desc: "Aparada e ajustes para manter seu visual sempre afiado." },
  { id: "personalizado", title: "Atendimento Personalizado", desc: "Estilo único, criado junto com você de acordo com sua personalidade." },
];
