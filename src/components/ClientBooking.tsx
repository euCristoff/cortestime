import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Calendar, 
  User, 
  Scissors, 
  Clock, 
  CheckCircle2, 
  ArrowLeft, 
  Smartphone, 
  Mail, 
  Info,
  ChevronRight,
  Sparkles
} from 'lucide-react';
import { Service, Barber, Appointment } from '../types';

interface ClientBookingProps {
  businessName: string;
  services: Service[];
  barbers: Barber[];
  onBookAppointment: (appointment: Omit<Appointment, 'id' | 'status'>) => void;
  onClose: () => void;
}

export default function ClientBooking({ 
  businessName, 
  services, 
  barbers, 
  onBookAppointment, 
  onClose 
}: ClientBookingProps) {
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [selectedBarber, setSelectedBarber] = useState<Barber | null>(null);
  
  // Date selection
  const today = new Date();
  const getDates = () => {
    const dates = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date();
      d.setDate(today.getDate() + i);
      dates.push(d);
    }
    return dates;
  };
  const weekDates = getDates();
  const [selectedDate, setSelectedDate] = useState<Date>(weekDates[0]);

  // Hours slots
  const timeSlots = [
    '09:00', '09:30', '10:00', '10:30', '11:00', '11:30', 
    '13:00', '13:30', '14:00', '14:30', '15:00', '15:30', 
    '16:00', '16:30', '17:00', '17:30', '18:00', '18:30'
  ];
  const [selectedTime, setSelectedTime] = useState<string>('09:00');

  // Client info
  const [clientName, setClientName] = useState('');
  const [clientPhone, setClientPhone] = useState('');
  const [clientEmail, setClientEmail] = useState('');

  const [bookingConfirmed, setBookingConfirmed] = useState(false);

  const handleSelectService = (service: Service) => {
    setSelectedService(service);
    setStep(2);
  };

  const handleSelectBarber = (barber: Barber) => {
    setSelectedBarber(barber);
  };

  const handleSubmitBooking = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedService || !selectedBarber) {
      alert('Por favor, selecione um serviço e um profissional.');
      return;
    }
    if (!clientName || !clientPhone) {
      alert('Por favor, preencha seu nome e celular.');
      return;
    }

    // Format Date to YYYY-MM-DD
    const yyyy = selectedDate.getFullYear();
    const mm = String(selectedDate.getMonth() + 1).padStart(2, '0');
    const dd = String(selectedDate.getDate()).padStart(2, '0');
    const dateStr = `${yyyy}-${mm}-${dd}`;

    onBookAppointment({
      clientName,
      clientPhone,
      serviceId: selectedService.id,
      barberId: selectedBarber.id,
      date: dateStr,
      time: selectedTime,
    });

    setBookingConfirmed(true);
  };

  const formatDayOfWeek = (d: Date) => {
    const days = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
    if (d.getDate() === today.getDate()) return 'Hoje';
    return days[d.getDay()];
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* HEADER */}
      <header className="sticky top-0 z-40 bg-white border-b border-gray-100 px-4 py-4 flex justify-between items-center shadow-sm">
        <button 
          onClick={bookingConfirmed ? onClose : () => {
            if (step > 1) setStep(prev => (prev - 1) as any);
            else onClose();
          }}
          className="flex items-center gap-1.5 text-xs font-bold text-gray-500 hover:text-brand-dark"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Voltar</span>
        </button>
        <div>
          <h2 className="text-sm font-extrabold text-brand-dark uppercase tracking-wide">
            {businessName || 'Barbearia Premium'}
          </h2>
          <p className="text-[10px] text-gray-400 text-center">Agendamento Online de Clientes</p>
        </div>
        <div className="w-12"></div> {/* Spacer for symmetry */}
      </header>

      {/* CONTENT BODY */}
      <main className="flex-1 max-w-xl w-full mx-auto p-4 flex flex-col justify-center">
        
        <AnimatePresence mode="wait">
          {bookingConfirmed ? (
            <motion.div 
              key="confirmed"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-[#1e1f22] rounded-3xl overflow-hidden shadow-2xl text-center border border-gray-800"
            >
              {/* GREEN TOP BAR */}
              <div className="bg-gradient-to-b from-[#1E5D3C] to-[#123E25] py-8 text-white flex flex-col items-center justify-center space-y-2">
                <div className="w-12 h-12 bg-white/10 rounded-full flex items-center justify-center border-2 border-white/40">
                  <CheckCircle2 className="w-7 h-7 text-white stroke-[2.5]" />
                </div>
                <span className="text-[10px] tracking-wider uppercase font-bold text-gray-200">Agendamento realizado</span>
              </div>

              {/* TICKET DETAILS IN DARK SLATE */}
              <div className="p-6 space-y-6 bg-[#18191b] text-left">
                <div className="space-y-4">
                  {/* Date */}
                  <div className="text-center">
                    <p className="text-sm font-semibold text-white tracking-wide">
                      {(() => {
                        const capitalized = (str: string) => str.charAt(0).toUpperCase() + str.slice(1);
                        return capitalized(selectedDate.toLocaleDateString('pt-BR', { 
                          weekday: 'long', 
                          day: 'numeric', 
                          month: 'long', 
                          year: 'numeric' 
                        }));
                      })()}
                    </p>
                  </div>

                  {/* Time separator */}
                  <div className="flex items-center justify-between text-xs font-mono text-gray-400">
                    <span className="text-sm font-bold text-white bg-white/5 px-2.5 py-1 rounded-lg">{selectedTime}</span>
                    <span className="text-gray-600 tracking-widest flex-1 text-center px-4">------------------</span>
                    <span className="text-sm font-bold text-white bg-white/5 px-2.5 py-1 rounded-lg">
                      {(() => {
                        const [hours, minutes] = selectedTime.split(':').map(Number);
                        const duration = selectedService?.durationMin || 30;
                        const endMinutes = (hours * 60 + minutes + duration);
                        const endHours = Math.floor(endMinutes / 60) % 24;
                        const endMins = endMinutes % 60;
                        return `${String(endHours).padStart(2, '0')}:${String(endMins).padStart(2, '0')}`;
                      })()}
                    </span>
                  </div>

                  {/* Client name */}
                  <div className="text-center py-2">
                    <h4 className="text-2xl font-display font-extrabold text-[#D59B6C] tracking-wide uppercase">
                      {clientName}
                    </h4>
                    <p className="text-[10px] text-gray-500 font-bold uppercase mt-1">Cliente</p>
                  </div>

                  {/* Service details and price */}
                  <div className="bg-white/5 p-4 rounded-2xl flex justify-between items-center border border-white/5">
                    <div>
                      <p className="text-xs font-extrabold text-white uppercase tracking-wider">{selectedService?.name}</p>
                      <p className="text-[10px] text-gray-400 mt-0.5">Profissional: {selectedBarber?.name}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-extrabold text-[#D59B6C]">R$ {selectedService?.price.toFixed(2)}</p>
                    </div>
                  </div>
                </div>

                {/* Buttons */}
                <div className="space-y-3 pt-2">
                  <button 
                    onClick={onClose}
                    className="w-full bg-[#B36B42] hover:bg-[#995832] active:bg-[#B36B42] text-white font-extrabold py-3.5 px-4 rounded-2xl shadow-lg uppercase text-xs tracking-wider transition-all"
                  >
                    OK
                  </button>

                  <button 
                    onClick={() => {
                      const weekdays = [
                        'domingo',
                        'segunda-feira',
                        'terça-feira',
                        'quarta-feira',
                        'quinta-feira',
                        'sexta-feira',
                        'sábado'
                      ];
                      const weekday = weekdays[selectedDate.getDay()];
                      const formattedMsgDate = `${weekday}, ${selectedDate.getDate()}/${selectedDate.getMonth() + 1}/${selectedDate.getFullYear()}`;
                      
                      const text = `Agendamento realizado com sucesso pelo estabelecimento!\n\nOlá ${clientName}, tudo bem?\n\nSeu horário ${formattedMsgDate} às ${selectedTime} está confirmado!\n\nEm caso de dúvidas, responda a essa mensagem!`;
                      
                      let cleanedPhone = clientPhone.replace(/\D/g, '');
                      if (cleanedPhone.length <= 11 && !cleanedPhone.startsWith('55')) {
                        cleanedPhone = '55' + cleanedPhone;
                      }
                      window.open(`https://wa.me/${cleanedPhone}?text=${encodeURIComponent(text)}`, '_blank');
                    }}
                    className="w-full border border-green-600 hover:bg-green-950/20 active:border-green-500 text-green-500 hover:text-green-400 font-extrabold py-3.5 px-4 rounded-2xl flex items-center justify-center gap-2 uppercase text-xs tracking-wider transition-all cursor-pointer"
                  >
                    <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                      <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946C.06 5.348 5.397.01 12.008.01c3.202.001 6.212 1.246 8.477 3.514 2.266 2.268 3.507 5.28 3.505 8.484-.004 6.657-5.34 11.997-11.953 11.997-2.005-.001-3.973-.502-5.724-1.457L0 24zm6.59-4.846c1.6.95 3.188 1.449 4.825 1.451 5.436 0 9.86-4.42 9.864-9.858.002-2.634-1.019-5.11-2.875-6.97C16.59 1.905 14.12 1.88 11.99 1.88 6.562 1.88 2.135 6.298 2.13 11.734c-.001 1.687.447 3.328 1.3 4.773l-1.094 4.00 4.103-1.077c1.47.8 3.102 1.22 4.718 1.222zM17.66 14.25c-.312-.156-1.848-.91-2.127-1.012-.279-.102-.483-.153-.686.153-.203.306-.787 1.013-.965 1.217-.178.204-.355.23-.667.073-.313-.155-1.317-.486-2.51-1.549-.928-.827-1.554-1.85-1.737-2.157-.183-.306-.02-.472.136-.627.14-.14.313-.365.47-.55.156-.182.208-.312.312-.52.105-.208.052-.39-.026-.547-.078-.156-.686-1.65-.94-2.261-.247-.594-.5-.513-.686-.523-.178-.008-.38-.01-.583-.01-.203 0-.533.076-.812.38-.28.305-1.066 1.042-1.066 2.54 0 1.498 1.09 2.946 1.242 3.15.152.203 2.146 3.277 5.198 4.593.726.313 1.293.5 1.736.64.73.232 1.393.199 1.918.12.585-.087 1.848-.755 2.11-1.448.263-.693.263-1.286.183-1.411-.078-.125-.285-.203-.597-.36z"/>
                    </svg>
                    <span>Enviar alerta para cliente</span>
                  </button>
                </div>
              </div>
            </motion.div>
          ) : (
            <div className="space-y-4">
              
              {/* STEP PROGRESS INDICATOR */}
              <div className="flex items-center gap-1.5 text-xs text-gray-400 pb-2">
                <span className={step >= 1 ? 'font-bold text-brand-blue' : ''}>1. Serviço</span>
                <ChevronRight className="w-3 h-3" />
                <span className={step >= 2 ? 'font-bold text-brand-blue' : ''}>2. Profissional & Horário</span>
                <ChevronRight className="w-3 h-3" />
                <span className={step >= 3 ? 'font-bold text-brand-blue' : ''}>3. Seus Dados</span>
              </div>

              {/* STEP 1: SERVICE SELECT */}
              {step === 1 && (
                <motion.div 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="space-y-3 text-left"
                >
                  <h3 className="font-display font-bold text-lg text-brand-dark">Selecione o Serviço</h3>
                  <div className="grid grid-cols-1 gap-2.5">
                    {services.map((service) => (
                      <div 
                        key={service.id}
                        onClick={() => handleSelectService(service)}
                        className="bg-white hover:border-brand-blue border border-gray-200 rounded-2xl p-4 flex justify-between items-center cursor-pointer transition-all hover:shadow-sm"
                      >
                        <div className="flex items-start gap-3">
                          <div className="p-2.5 bg-brand-blue/10 text-brand-blue rounded-xl">
                            <Scissors className="w-5 h-5" />
                          </div>
                          <div>
                            <h4 className="font-bold text-sm sm:text-base text-brand-dark">{service.name}</h4>
                            <p className="text-xs text-gray-500 mt-0.5">{service.durationMin} min</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-display font-bold text-sm sm:text-base text-brand-blue">R$ {service.price.toFixed(2)}</p>
                          <span className="text-[10px] text-gray-400 font-semibold block mt-1">Reservar &gt;</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </motion.div>
              )}

              {/* STEP 2: PROFESSIONAL AND TIME */}
              {step === 2 && (
                <motion.div 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="space-y-4 text-left"
                >
                  <h3 className="font-display font-bold text-lg text-brand-dark">Escolha o Profissional</h3>
                  <div className="grid grid-cols-3 gap-2">
                    {barbers.map((barber) => (
                      <div 
                        key={barber.id}
                        onClick={() => handleSelectBarber(barber)}
                        className={`rounded-2xl p-3 border-2 text-center cursor-pointer transition-all ${
                          selectedBarber?.id === barber.id 
                            ? 'border-brand-blue bg-[#f0f7ff]' 
                            : 'border-gray-200 bg-white hover:border-gray-300'
                        }`}
                      >
                        <img 
                          src={barber.avatar} 
                          alt={barber.name} 
                          referrerPolicy="no-referrer"
                          className="w-12 h-12 rounded-full mx-auto object-cover border-2 border-white shadow-sm"
                        />
                        <p className="font-bold text-xs text-brand-dark mt-2 truncate">{barber.name}</p>
                        <p className="text-[9px] text-gray-400">{barber.specialty}</p>
                        <p className="text-[10px] text-yellow-500 font-bold mt-0.5">★ {barber.rating}</p>
                      </div>
                    ))}
                  </div>

                  {selectedBarber && (
                    <motion.div 
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      className="space-y-4 pt-2"
                    >
                      <h3 className="font-display font-bold text-lg text-brand-dark">Selecione o Dia</h3>
                      
                      {/* Dates horizontal scroll */}
                      <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-none">
                        {weekDates.map((date, idx) => {
                          const isSelected = selectedDate.getDate() === date.getDate();
                          return (
                            <button 
                              key={idx}
                              type="button"
                              onClick={() => setSelectedDate(date)}
                              className={`flex flex-col items-center justify-center p-2.5 rounded-xl border shrink-0 w-14 transition-all ${
                                isSelected 
                                  ? 'bg-brand-blue text-white border-brand-blue shadow-md shadow-brand-blue/15' 
                                  : 'bg-white text-gray-600 border-gray-200 hover:border-gray-300'
                              }`}
                            >
                              <span className="text-[10px] font-bold uppercase">{formatDayOfWeek(date)}</span>
                              <span className="text-sm font-extrabold mt-0.5">{date.getDate()}</span>
                            </button>
                          );
                        })}
                      </div>

                      <h3 className="font-display font-bold text-lg text-brand-dark">Horários Disponíveis</h3>
                      
                      {/* Grid of slots */}
                      <div className="grid grid-cols-4 gap-2">
                        {timeSlots.map((time, idx) => {
                          const isSelected = selectedTime === time;
                          return (
                            <button 
                              key={idx}
                              type="button"
                              onClick={() => setSelectedTime(time)}
                              className={`py-2 text-xs font-bold rounded-xl border transition-all ${
                                isSelected 
                                  ? 'bg-brand-dark text-white border-brand-dark' 
                                  : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-100'
                              }`}
                            >
                               {time}
                            </button>
                          );
                        })}
                      </div>

                      <div className="pt-4">
                        <button 
                          onClick={() => setStep(3)}
                          className="w-full bg-brand-blue hover:bg-brand-blue-light text-white font-bold py-3 rounded-xl shadow-lg transition-colors"
                        >
                          Confirmar Data & Horário
                        </button>
                      </div>
                    </motion.div>
                  )}
                </motion.div>
              )}

              {/* STEP 3: CLIENT DETAILS */}
              {step === 3 && (
                <motion.div 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="space-y-4 text-left"
                >
                  <h3 className="font-display font-bold text-lg text-brand-dark">Seus Dados de Contato</h3>
                  
                  <div className="bg-brand-blue/5 p-4 rounded-2xl border border-brand-blue/10 mb-4 text-xs space-y-1.5 text-gray-600">
                    <div className="flex justify-between">
                      <span className="font-semibold">Serviço:</span>
                      <span className="font-bold text-brand-dark">{selectedService?.name} (R$ {selectedService?.price.toFixed(2)})</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="font-semibold">Profissional:</span>
                      <span className="font-bold text-brand-dark">{selectedBarber?.name}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="font-semibold">Data e Hora:</span>
                      <span className="font-bold text-brand-dark">
                        {selectedDate.toLocaleDateString('pt-BR', { day: 'numeric', month: 'numeric' })} às {selectedTime}
                      </span>
                    </div>
                  </div>

                  <form onSubmit={handleSubmitBooking} className="space-y-4">
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-gray-600 flex items-center gap-1">
                        <User className="w-3.5 h-3.5 text-gray-400" />
                        <span>Seu Nome Completo</span>
                      </label>
                      <input 
                        type="text" 
                        required
                        value={clientName}
                        onChange={e => setClientName(e.target.value)}
                        placeholder="Ex: Roberto Silva"
                        className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-brand-blue focus:outline-none transition-colors text-sm bg-white"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-xs font-bold text-gray-600 flex items-center gap-1">
                        <Smartphone className="w-3.5 h-3.5 text-gray-400" />
                        <span>Seu WhatsApp (Celular)</span>
                      </label>
                      <input 
                        type="tel" 
                        required
                        value={clientPhone}
                        onChange={e => setClientPhone(e.target.value)}
                        placeholder="Ex: (82) 99999-9999"
                        className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-brand-blue focus:outline-none transition-colors text-sm bg-white"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-xs font-bold text-gray-600 flex items-center gap-1">
                        <Mail className="w-3.5 h-3.5 text-gray-400" />
                        <span>Seu E-mail (Opcional)</span>
                      </label>
                      <input 
                        type="email" 
                        value={clientEmail}
                        onChange={e => setClientEmail(e.target.value)}
                        placeholder="Ex: roberto@gmail.com"
                        className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-brand-blue focus:outline-none transition-colors text-sm bg-white"
                      />
                    </div>

                    <div className="pt-2">
                      <button 
                        type="submit"
                        className="w-full bg-brand-blue hover:bg-brand-blue-light text-white font-bold py-3.5 rounded-xl shadow-lg transition-colors uppercase text-xs tracking-wider"
                      >
                        Finalizar Agendamento
                      </button>
                    </div>
                  </form>
                </motion.div>
              )}

            </div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}
