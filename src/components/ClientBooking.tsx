import React, { useState } from 'react';
import { 
  X, 
  ChevronLeft, 
  ChevronRight, 
  User, 
  Check, 
  Calendar as CalendarIcon
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
  // Step 1: Service, 2: Professional, 3: Date & Time, 4: Client Info, 5: Confirmation
  const [step, setStep] = useState<1 | 2 | 3 | 4 | 5>(1);

  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [selectedBarber, setSelectedBarber] = useState<Barber | null>(null);

  // Date & Time selection state
  const today = new Date();
  const [currentMonthDate, setCurrentMonthDate] = useState<Date>(new Date(today.getFullYear(), today.getMonth(), 1));
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedTime, setSelectedTime] = useState<string>('');

  // 30-minute interval time slots as requested
  const timeSlots = [
    '08:00', '08:30', '09:00', '09:30',
    '10:00', '10:30', '11:00', '11:30',
    '12:00', '12:30', '13:00', '13:30',
    '14:00', '14:30', '15:00', '15:30',
    '16:00', '16:30', '17:00', '17:30',
    '18:00', '18:30'
  ];

  // User details state
  const [authTab, setAuthTab] = useState<'cadastrar' | 'login'>('cadastrar');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [phone, setPhone] = useState('');
  const [bookingError, setBookingError] = useState<string | null>(null);
  const [addedToCalendar, setAddedToCalendar] = useState(false);

  // Confirmation state
  const [bookingId] = useState(() => `#${Math.floor(Math.random() * 900 + 100)}`);

  // Ensure there are barbers available to pick from
  const availableBarbers = barbers && barbers.length > 0 ? barbers : [
    {
      id: 'b-default-1',
      name: 'Henrique Souza',
      avatar: 'https://images.unsplash.com/photo-1503951914875-452162b0f3f1?w=200&auto=format&fit=crop&q=60',
      rating: 5.0,
      specialty: 'Cortes & Degradê'
    },
    {
      id: 'b-default-2',
      name: businessName || 'Crhfi',
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&auto=format&fit=crop&q=60',
      rating: 4.9,
      specialty: 'Cortes & Barba'
    }
  ];

  // Handle phone input formatting: (99) 99999-9999
  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let val = e.target.value.replace(/\D/g, '');
    if (val.length > 11) val = val.slice(0, 11);
    if (val.length > 6) {
      val = `(${val.slice(0, 2)}) ${val.slice(2, 7)}-${val.slice(7)}`;
    } else if (val.length > 2) {
      val = `(${val.slice(0, 2)}) ${val.slice(2)}`;
    } else if (val.length > 0) {
      val = `(${val}`;
    }
    setPhone(val);
  };

  // Calendar generation
  const getDaysInMonth = (year: number, month: number) => {
    return new Date(year, month + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (year: number, month: number) => {
    // 0 = Sunday, 1 = Monday... We want Monday = 0
    const day = new Date(year, month, 1).getDay();
    return day === 0 ? 6 : day - 1;
  };

  const renderCalendar = () => {
    const year = currentMonthDate.getFullYear();
    const month = currentMonthDate.getMonth();
    const daysInMonth = getDaysInMonth(year, month);
    const firstDayIndex = getFirstDayOfMonth(year, month);

    const monthNames = [
      'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
      'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
    ];

    const prevMonthDays = new Date(year, month, 0).getDate();

    const days = [];

    // Previous month padding
    for (let i = firstDayIndex - 1; i >= 0; i--) {
      days.push({
        day: prevMonthDays - i,
        isCurrentMonth: false,
        date: new Date(year, month - 1, prevMonthDays - i)
      });
    }

    // Current month days
    for (let i = 1; i <= daysInMonth; i++) {
      days.push({
        day: i,
        isCurrentMonth: true,
        date: new Date(year, month, i)
      });
    }

    // Next month padding to fill rows
    const remainingSlots = 35 - days.length > 0 ? 35 - days.length : (42 - days.length > 0 ? 42 - days.length : 0);
    for (let i = 1; i <= remainingSlots; i++) {
      days.push({
        day: i,
        isCurrentMonth: false,
        date: new Date(year, month + 1, i)
      });
    }

    const prevMonth = () => {
      setCurrentMonthDate(new Date(year, month - 1, 1));
    };

    const nextMonth = () => {
      setCurrentMonthDate(new Date(year, month + 1, 1));
    };

    return (
      <div className="space-y-3">
        {/* Month header with arrows */}
        <div className="flex items-center justify-between px-1">
          <span className="text-base font-normal text-gray-900">
            {monthNames[month]} <span className="text-gray-400 font-light">{year}</span>
          </span>
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={prevMonth}
              className="p-1.5 rounded-lg text-blue-600 hover:bg-blue-50 transition-colors cursor-pointer"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <button
              type="button"
              onClick={nextMonth}
              className="p-1.5 rounded-lg text-blue-600 hover:bg-blue-50 transition-colors cursor-pointer"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Days of week header */}
        <div className="grid grid-cols-7 text-center text-[10px] font-bold text-gray-400 uppercase tracking-wider py-1">
          <span>SEG</span>
          <span>TER</span>
          <span>QUA</span>
          <span>QUI</span>
          <span>SEX</span>
          <span className="text-blue-400">SÁB</span>
          <span className="text-blue-400">DOM</span>
        </div>

        {/* Days grid */}
        <div className="grid grid-cols-7 gap-y-1 text-center">
          {days.map((d, index) => {
            const isSelected = selectedDate !== null && selectedDate.toDateString() === d.date.toDateString();

            return (
              <button
                key={index}
                type="button"
                disabled={!d.isCurrentMonth}
                onClick={() => {
                  if (d.isCurrentMonth) {
                    setSelectedDate(d.date);
                    if (!selectedTime) setSelectedTime('15:00');
                  }
                }}
                className={`h-9 w-9 mx-auto flex items-center justify-center rounded-lg text-sm font-medium transition-all relative ${
                  !d.isCurrentMonth
                    ? 'text-gray-300 cursor-not-allowed'
                    : isSelected
                    ? 'bg-[#2563eb] text-white font-bold shadow-md shadow-blue-500/30'
                    : 'text-gray-700 hover:bg-gray-100 cursor-pointer'
                }`}
              >
                {d.day}
                {d.isCurrentMonth && (
                  <span
                    className={`absolute bottom-0.5 left-1/2 -translate-x-1/2 w-3 h-0.5 rounded-full ${
                      isSelected ? 'bg-white' : 'bg-emerald-400'
                    }`}
                  />
                )}
              </button>
            );
          })}
        </div>
      </div>
    );
  };

  const handleFinishBooking = () => {
    setBookingError(null);
    if (!firstName.trim()) {
      setBookingError('Por favor, informe seu nome.');
      return;
    }
    if (!phone.trim()) {
      setBookingError('Por favor, informe seu telefone.');
      return;
    }

    const targetDate = selectedDate || new Date();
    const yyyy = targetDate.getFullYear();
    const mm = String(targetDate.getMonth() + 1).padStart(2, '0');
    const dd = String(targetDate.getDate()).padStart(2, '0');
    const dateStr = `${yyyy}-${mm}-${dd}`;

    onBookAppointment({
      clientName: `${firstName.trim()} ${lastName.trim()}`.trim(),
      clientPhone: phone,
      serviceId: selectedService?.id || 'service-default',
      barberId: selectedBarber?.id || availableBarbers[0]?.id || 'barber-default',
      date: dateStr,
      time: selectedTime || '15:00',
    });

    setStep(5);
  };

  return (
    <div className="w-full max-w-md mx-auto bg-white rounded-3xl shadow-2xl p-6 sm:p-7 relative min-h-[520px] flex flex-col justify-between overflow-hidden border border-gray-100">
      
      {/* Top Header with Title and Close 'X' Button */}
      <div className="flex items-center justify-between pb-4 border-b border-gray-100">
        <h2 className="text-lg sm:text-xl font-normal tracking-tight text-gray-900">
          {step === 1 && 'Escolha um serviço'}
          {step === 2 && 'Escolha um profissional'}
          {step === 3 && 'Escolha uma data de horário'}
          {step === 4 && 'Coloque suas informações'}
          {step === 5 && 'Agendamento confirmado'}
        </h2>
        <button
          type="button"
          onClick={onClose}
          className="text-gray-400 hover:text-gray-600 p-1 rounded-full hover:bg-gray-100 transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* STEP 1: ESCOLHA UM SERVIÇO */}
      {step === 1 && (
        <div className="py-4 flex-1 flex flex-col justify-between space-y-4">
          <div className="space-y-3">
            {services.length === 0 ? (
              <p className="text-sm text-gray-400 text-center py-8">Nenhum serviço disponível.</p>
            ) : (
              services.map((s) => (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => {
                    setSelectedService(s);
                    setStep(2);
                  }}
                  className={`w-full text-left p-4 rounded-2xl border transition-all cursor-pointer flex items-center justify-between ${
                    selectedService?.id === s.id
                      ? 'border-blue-500 bg-blue-50/30 ring-2 ring-blue-500/20'
                      : 'border-gray-200 hover:border-blue-300 bg-white'
                  }`}
                >
                  <span className="text-base font-normal text-gray-900">{s.name}</span>
                  <span className="text-sm font-medium text-gray-500">R$ {s.price.toFixed(0)}</span>
                </button>
              ))
            )}
          </div>
        </div>
      )}

      {/* STEP 2: ESCOLHA UM PROFISSIONAL */}
      {step === 2 && (
        <div className="py-4 flex-1 flex flex-col justify-between space-y-6">
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {availableBarbers.map((b) => {
              const isSelected = selectedBarber?.id === b.id;
              return (
                <button
                  key={b.id}
                  type="button"
                  onClick={() => {
                    setSelectedBarber(b);
                    setStep(3);
                  }}
                  className={`flex flex-col items-center p-4 rounded-2xl border transition-all cursor-pointer ${
                    isSelected
                      ? 'border-blue-500 bg-blue-50/30 ring-2 ring-blue-500/20'
                      : 'border-gray-200 hover:border-gray-300 bg-white'
                  }`}
                >
                  <div className="w-16 h-16 rounded-2xl bg-gray-100 flex items-center justify-center overflow-hidden mb-2 text-gray-400 border border-gray-100 relative shadow-xs">
                    {b.avatar ? (
                      <img 
                        src={b.avatar} 
                        alt={b.name} 
                        className="w-full h-full object-cover relative z-10" 
                        onError={(e) => {
                          e.currentTarget.style.display = 'none';
                        }}
                      />
                    ) : null}
                    <User className="w-8 h-8 stroke-[1.5] text-gray-400 absolute" />
                  </div>
                  <span className="text-sm font-normal text-gray-900 text-center truncate w-full">
                    {b.name}
                  </span>
                  <span className="text-[10px] text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md mt-1 font-medium">
                    Disponível
                  </span>
                </button>
              );
            })}
          </div>

          <div className="flex justify-center pt-2">
            <button
              type="button"
              onClick={() => setStep(1)}
              className="px-8 py-2.5 rounded-full border border-gray-200 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <span>← Voltar</span>
            </button>
          </div>
        </div>
      )}

      {/* STEP 3: ESCOLHA UMA DATA DE HORÁRIO */}
      {step === 3 && (
        <div className="py-3 flex-1 flex flex-col justify-between space-y-4">
          <div className="space-y-4">
            {/* Calendar */}
            {renderCalendar()}

            {/* Time slots (ONLY APPEAR AFTER SELECTING A DAY IN THE CALENDAR) */}
            {selectedDate ? (
              <div className="pt-2 border-t border-gray-100 space-y-2.5 animate-fadeIn">
                <p className="text-xs text-gray-600 font-medium">
                  Escolha o horário para {selectedDate.getDate()}{' '}
                  {selectedDate.toLocaleDateString('pt-BR', { month: 'long' })}
                </p>

                <div className="grid grid-cols-4 gap-2 max-h-48 overflow-y-auto pr-1">
                  {timeSlots.map((time) => {
                    const isSelected = selectedTime === time;
                    return (
                      <button
                        key={time}
                        type="button"
                        onClick={() => setSelectedTime(time)}
                        className={`py-2 px-1 text-xs font-semibold rounded-xl transition-all relative cursor-pointer ${
                          isSelected
                            ? 'bg-[#2563eb] text-white shadow-md shadow-blue-500/20 ring-2 ring-blue-600'
                            : 'bg-emerald-50/90 text-emerald-700 border border-emerald-200/70 hover:bg-emerald-100'
                        }`}
                      >
                        {time}
                        {isSelected && (
                          <span className="absolute -top-1 -right-1 bg-white text-blue-600 rounded-full p-0.5 shadow-xs">
                            <Check className="w-2.5 h-2.5 stroke-[3]" />
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            ) : (
              <div className="pt-3 border-t border-gray-100 text-center py-2">
                <p className="text-xs text-gray-400 font-medium">
                  👆 Selecione um dia no calendário acima para ver os horários
                </p>
              </div>
            )}
          </div>

          {/* Bottom Nav */}
          <div className="flex items-center justify-between gap-3 pt-3 border-t border-gray-100">
            <button
              type="button"
              onClick={() => setStep(2)}
              className="px-6 py-2.5 rounded-full border border-gray-200 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors cursor-pointer"
            >
              ← Voltar
            </button>

            <button
              type="button"
              onClick={() => {
                if (!selectedDate || !selectedTime) return;
                setBookingError(null);
                setStep(4);
              }}
              disabled={!selectedDate || !selectedTime}
              className={`px-6 py-2.5 rounded-full text-sm font-medium shadow-md transition-all flex items-center gap-1 cursor-pointer ${
                selectedDate && selectedTime
                  ? 'bg-[#2563eb] hover:bg-[#1d4ed8] text-white shadow-blue-500/20'
                  : 'bg-gray-200 text-gray-400 cursor-not-allowed opacity-60'
              }`}
            >
              <span>Próximo passo</span>
              <span>→</span>
            </button>
          </div>
        </div>
      )}

      {/* STEP 4: COLOQUE SUAS INFORMAÇÕES */}
      {step === 4 && (
        <div className="py-4 flex-1 flex flex-col justify-between space-y-6">
          <div className="space-y-5">
            {/* Tab switcher matching video */}
            <div className="bg-gray-100 p-1 rounded-2xl flex items-center text-xs font-medium">
              <button
                type="button"
                onClick={() => setAuthTab('cadastrar')}
                className={`flex-1 py-2.5 rounded-xl transition-all cursor-pointer ${
                  authTab === 'cadastrar'
                    ? 'bg-white text-gray-900 shadow-sm font-semibold'
                    : 'text-gray-500 hover:text-gray-900'
                }`}
              >
                Cadastrar
              </button>
              <button
                type="button"
                onClick={() => setAuthTab('login')}
                className={`flex-1 py-2.5 rounded-xl transition-all cursor-pointer ${
                  authTab === 'login'
                    ? 'bg-white text-gray-900 shadow-sm font-semibold'
                    : 'text-gray-500 hover:text-gray-900'
                }`}
              >
                Já tenho uma conta
              </button>
            </div>

            {/* Inputs matching video */}
            <div className="space-y-3.5">
              <div>
                <input
                  type="text"
                  placeholder="Seu nome"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  className="w-full px-4 py-3.5 rounded-2xl border border-gray-200 text-sm bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent placeholder-gray-400"
                />
              </div>

              <div>
                <input
                  type="text"
                  placeholder="Seu sobrenome"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  className="w-full px-4 py-3.5 rounded-2xl border border-gray-200 text-sm bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent placeholder-gray-400"
                />
              </div>

              <div>
                <input
                  type="tel"
                  placeholder="Número de telefone"
                  value={phone}
                  onChange={handlePhoneChange}
                  className="w-full px-4 py-3.5 rounded-2xl border border-gray-200 text-sm bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent placeholder-gray-400"
                />
              </div>

              {bookingError && (
                <p className="text-xs text-red-500 text-center font-medium bg-red-50 p-2.5 rounded-xl border border-red-100">
                  {bookingError}
                </p>
              )}
            </div>
          </div>

          {/* Bottom Nav */}
          <div className="flex items-center justify-between gap-3 pt-3 border-t border-gray-100">
            <button
              type="button"
              onClick={() => {
                setBookingError(null);
                setStep(3);
              }}
              className="px-6 py-2.5 rounded-full border border-gray-200 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors cursor-pointer"
            >
              ← Voltar
            </button>

            <button
              type="button"
              onClick={handleFinishBooking}
              className="px-6 py-2.5 rounded-full bg-[#2563eb] hover:bg-[#1d4ed8] text-white text-sm font-medium shadow-md shadow-blue-500/20 transition-all flex items-center gap-1 cursor-pointer"
            >
              <span>Confirmar</span>
              <span>→</span>
            </button>
          </div>
        </div>
      )}

      {/* STEP 5: AGENDAMENTO CONFIRMADO */}
      {step === 5 && (
        <div className="py-4 flex-1 flex flex-col items-center justify-between text-center space-y-5">
          <div className="space-y-4 w-full">
            {/* Green Check Icon */}
            <div className="w-16 h-16 rounded-full bg-emerald-500 text-white flex items-center justify-center mx-auto shadow-lg shadow-emerald-500/20">
              <Check className="w-9 h-9 stroke-[3]" />
            </div>

            <div>
              <h3 className="text-xl font-bold text-gray-900">Agendamento confirmado</h3>
              <p className="text-xs text-gray-400 mt-0.5">{bookingId}</p>
            </div>

            {/* Calendar pill button */}
            <button
              type="button"
              onClick={() => setAddedToCalendar(true)}
              className={`inline-flex items-center gap-2 px-5 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                addedToCalendar 
                  ? 'bg-emerald-100 text-emerald-800 border border-emerald-300' 
                  : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
              }`}
            >
              {addedToCalendar ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Adicionado à sua agenda!</span>
                </>
              ) : (
                <>
                  <CalendarIcon className="w-3.5 h-3.5" />
                  <span>Adicionar à agenda</span>
                </>
              )}
            </button>

            {/* Details Table */}
            <div className="w-full text-left space-y-2.5 pt-3 border-t border-b border-gray-100 py-4 text-xs">
              <div className="flex justify-between">
                <span className="text-gray-400">Data:</span>
                <span className="text-gray-900 font-medium">
                  {selectedDate?.getDate() || today.getDate()} de{' '}
                  {(selectedDate || today).toLocaleDateString('pt-BR', { month: 'long' })} de{' '}
                  {(selectedDate || today).getFullYear()}
                </span>
              </div>

              <div className="flex justify-between">
                <span className="text-gray-400">Hora:</span>
                <span className="text-gray-900 font-medium">{selectedTime || '15:00'}</span>
              </div>

              <div className="flex justify-between">
                <span className="text-gray-400">Serviço:</span>
                <span className="text-gray-900 font-medium">
                  {selectedService?.name || 'Serviço Selecionado'}
                </span>
              </div>

              <div className="flex justify-between">
                <span className="text-gray-400">Nome:</span>
                <span className="text-gray-900 font-medium">
                  {firstName} {lastName}
                </span>
              </div>

              <div className="flex justify-between">
                <span className="text-gray-400">Telefone:</span>
                <span className="text-gray-900 font-medium">{phone || '(99) 99999-9999'}</span>
              </div>

              <div className="flex justify-between">
                <span className="text-gray-400">Email:</span>
                <span className="text-gray-900 font-medium">Seu email</span>
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-full py-3.5 rounded-full bg-[#2563eb] hover:bg-[#1d4ed8] text-white text-sm font-semibold shadow-md transition-colors cursor-pointer"
          >
            Concluir
          </button>
        </div>
      )}

    </div>
  );
}
