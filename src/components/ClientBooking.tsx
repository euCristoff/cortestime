import React, { useState, useEffect } from 'react';
import { 
  X, 
  ChevronLeft, 
  ChevronRight, 
  User, 
  Check, 
  Calendar as CalendarIcon,
  Search,
  AlertTriangle,
  Clock,
  Scissors,
  Ban,
  RotateCcw
} from 'lucide-react';
import { Service, Barber, Appointment, AppNotification } from '../types';
import { firebaseService } from '../services/firebaseService';
import { notificationService } from '../services/notificationService';

interface ClientBookingProps {
  businessName: string;
  businessLogo?: string;
  services: Service[];
  barbers: Barber[];
  onBookAppointment: (appointment: Omit<Appointment, 'id' | 'status'>) => void;
  onClose: () => void;
  merchantUid?: string;
  merchantWhatsApp?: string;
  customWhatsAppMessage?: string;
  barberName?: string;
  singleBarberMode?: boolean;
}

import { safeEncodeURIComponent } from '../types';

export default function ClientBooking({ 
  businessName, 
  businessLogo,
  services, 
  barbers, 
  onBookAppointment, 
  onClose,
  merchantUid,
  merchantWhatsApp,
  customWhatsAppMessage,
  barberName,
  singleBarberMode = false
}: ClientBookingProps) {
  // Step 1: Service, 2: Professional, 3: Date & Time, 4: Client Info, 5: Confirmation, 6: Meus Agendamentos
  const [step, setStep] = useState<1 | 2 | 3 | 4 | 5 | 6>(1);

  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [selectedBarber, setSelectedBarber] = useState<Barber | null>(null);

  // Date & Time selection state
  const today = new Date();
  const [currentMonthDate, setCurrentMonthDate] = useState<Date>(new Date(today.getFullYear(), today.getMonth(), 1));
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedTime, setSelectedTime] = useState<string>('');

  // Meus Agendamentos State
  const [searchPhone, setSearchPhone] = useState<string>('');
  const [clientAppointments, setClientAppointments] = useState<Appointment[]>([]);
  const [isLoadingAppointments, setIsLoadingAppointments] = useState<boolean>(false);
  const [cancellingApp, setCancellingApp] = useState<Appointment | null>(null);
  const [cancelReason, setCancelReason] = useState<string>('');
  const [cancelSuccessMsg, setCancelSuccessMsg] = useState<string | null>(null);

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

  // Ensure there are barbers available to pick from (default 1 professional with the business name)
  const availableBarbers = barbers && barbers.length > 0 ? barbers : [
    {
      id: 'b-default-1',
      name: businessName || 'Barbearia',
      avatar: businessLogo || '',
      rating: 5.0,
      specialty: 'Atendimento & Cortes'
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

  const handleSearchClientAppointments = async (phoneToSearch?: string) => {
    const rawPhone = (phoneToSearch || searchPhone || phone || '').replace(/\D/g, '');
    if (!rawPhone || rawPhone.length < 8) {
      setBookingError('Por favor, informe seu telefone com DDD para consultar.');
      return;
    }
    setIsLoadingAppointments(true);
    setBookingError(null);
    setCancelSuccessMsg(null);

    try {
      let list: Appointment[] = [];
      if (merchantUid) {
        const merchantApps = await firebaseService.getAppointments(merchantUid);
        list = merchantApps.filter(a => a.clientPhone.replace(/\D/g, '') === rawPhone || a.clientPhone.includes(rawPhone));
      } else {
        // Search in local storage
        const localKeys = Object.keys(localStorage).filter(k => k.startsWith('cortestime_appointments_') || k === 'cortestime_guest_appointments');
        const all: Appointment[] = [];
        for (const k of localKeys) {
          try {
            const parsed = JSON.parse(localStorage.getItem(k) || '[]');
            all.push(...parsed);
          } catch (_) {}
        }
        list = all.filter(a => a.clientPhone.replace(/\D/g, '') === rawPhone || a.clientPhone.includes(rawPhone));
      }
      setClientAppointments(list);
    } catch (err) {
      console.error('Error fetching client appointments:', err);
    } finally {
      setIsLoadingAppointments(false);
    }
  };

  const handleConfirmCancelAppointment = async () => {
    if (!cancellingApp) return;

    const serv = services.find(s => s.id === cancellingApp.serviceId);
    const barber = barbers.find(b => b.id === cancellingApp.barberId);

    try {
      // 1. Update in Firebase / Local
      await firebaseService.updateAppointmentStatus(cancellingApp.id, 'cancelled', {
        cancelledBy: 'client',
        cancellationReason: cancelReason.trim() || 'Cancelado pelo cliente'
      });

      // 2. Trigger push notification for Barbershop
      notificationService.notifyCancellationToBarbershop(
        cancellingApp,
        serv?.name,
        cancelReason.trim()
      );

      // 3. Save notification in database
      const notif: AppNotification = {
        id: `notif-cancel-${cancellingApp.id}-${Date.now()}`,
        ownerId: merchantUid || cancellingApp.ownerId || '',
        clientPhone: cancellingApp.clientPhone,
        target: 'barbershop',
        type: 'cancellation_by_client',
        title: '🚫 Agendamento Cancelado pelo Cliente',
        body: `O cliente ${cancellingApp.clientName} cancelou o agendamento de ${serv?.name || 'Serviço'} (${cancellingApp.date} às ${cancellingApp.time}).${cancelReason.trim() ? ` Motivo: "${cancelReason.trim()}"` : ''}`,
        appointmentId: cancellingApp.id,
        clientName: cancellingApp.clientName,
        serviceName: serv?.name || '',
        barberName: barber?.name || '',
        date: cancellingApp.date,
        time: cancellingApp.time,
        reason: cancelReason.trim(),
        createdAt: new Date().toISOString(),
        read: false
      };
      await firebaseService.saveNotification(notif);

      // Update local state list
      setClientAppointments(prev => prev.map(a => a.id === cancellingApp.id ? {
        ...a,
        status: 'cancelled',
        cancelledBy: 'client',
        cancellationReason: cancelReason.trim(),
        cancelledAt: new Date().toISOString()
      } : a));

      setCancelSuccessMsg(`Horário do dia ${cancellingApp.date} às ${cancellingApp.time} cancelado com sucesso. A barbearia foi notificada!`);
      setCancellingApp(null);
      setCancelReason('');
    } catch (err) {
      console.error('Error cancelling appointment:', err);
      alert('Houve um erro ao cancelar o agendamento. Tente novamente.');
    }
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
        <div>
          <h2 className="text-lg sm:text-xl font-normal tracking-tight text-gray-900">
            {step === 1 && 'Escolha um serviço'}
            {step === 2 && 'Escolha um profissional'}
            {step === 3 && 'Escolha uma data de horário'}
            {step === 4 && 'Coloque suas informações'}
            {step === 5 && 'Agendamento confirmado'}
            {step === 6 && 'Meus Agendamentos'}
          </h2>
          {step === 1 && (
            <button
              type="button"
              onClick={() => {
                setStep(6);
                if (phone) handleSearchClientAppointments(phone);
              }}
              className="text-xs text-blue-600 hover:text-blue-700 font-semibold cursor-pointer flex items-center gap-1 mt-0.5"
            >
              <span>Já agendou? Consultar ou cancelar horário</span>
            </button>
          )}
        </div>
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
                    if (singleBarberMode || availableBarbers.length === 1) {
                      setSelectedBarber(availableBarbers[0] || {
                        id: 'b-default',
                        name: barberName || businessName || 'Barbeiro',
                        avatar: businessLogo || '',
                        rating: 5.0,
                        specialty: 'Atendimento Especializado'
                      });
                      setStep(3);
                    } else {
                      setStep(2);
                    }
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
              const displayAvatar = (b.avatar && b.avatar.trim() !== '' && !b.avatar.includes('unsplash.com'))
                ? b.avatar
                : (businessLogo || b.avatar);

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
                    {displayAvatar ? (
                      <img 
                        src={displayAvatar} 
                        alt={b.name} 
                        referrerPolicy="no-referrer"
                        className="w-full h-full object-cover relative z-10" 
                        onError={(e) => {
                          if (businessLogo && e.currentTarget.src !== businessLogo) {
                            e.currentTarget.src = businessLogo;
                          } else {
                            e.currentTarget.style.display = 'none';
                          }
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
              onClick={() => {
                if (singleBarberMode || availableBarbers.length === 1) {
                  setStep(1);
                } else {
                  setStep(2);
                }
              }}
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

            {/* WhatsApp Confirmation Notification Button */}
            {merchantWhatsApp && (
              <div className="pt-1">
                <button
                  type="button"
                  onClick={() => {
                    const hora = new Date().getHours();
                    const saudacao = hora >= 5 && hora < 12 ? 'Bom dia' : hora >= 12 && hora < 18 ? 'Boa tarde' : 'Boa noite';
                    const dataStr = selectedDate ? selectedDate.toLocaleDateString('pt-BR') : today.toLocaleDateString('pt-BR');
                    const rawMsg = customWhatsAppMessage || 'Olá {barbeiro}, {saudacao}! Meu agendamento para {servico} na {barbearia} foi solicitado para {data} às {horario}. Aguardo confirmação! ✂️';
                    const formattedMsg = rawMsg
                      .replace(/\{saudacao\}|\{saudação\}/gi, saudacao)
                      .replace(/\{barbeiro\}/gi, barberName || selectedBarber?.name || businessName || 'Barbeiro')
                      .replace(/\{barbearia\}/gi, businessName || 'Barbearia')
                      .replace(/\{servico\}|\{serviço\}/gi, selectedService?.name || 'Corte')
                      .replace(/\{data\}/gi, dataStr)
                      .replace(/\{horario\}|\{horário\}/gi, selectedTime || '15:00')
                      .replace(/\{cliente\}/gi, `${firstName} ${lastName}`.trim() || 'Cliente');
                    const cleanPhone = merchantWhatsApp.replace(/\D/g, '');
                    window.open(`https://wa.me/${cleanPhone}?text=${safeEncodeURIComponent(formattedMsg)}`, '_blank');
                  }}
                  className="w-full py-3 px-4 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-black flex items-center justify-center gap-2 shadow-md shadow-emerald-600/20 transition-all cursor-pointer active:scale-98"
                >
                  <span>💬 Enviar confirmação no WhatsApp</span>
                </button>
              </div>
            )}
          </div>

          <div className="w-full space-y-2 pt-2">
            <button
              type="button"
              onClick={() => {
                setStep(6);
                handleSearchClientAppointments(phone);
              }}
              className="w-full py-2.5 rounded-full bg-blue-50 hover:bg-blue-100 text-blue-700 text-xs font-semibold transition-colors cursor-pointer"
            >
              Ver meus agendamentos / Cancelar
            </button>

            <button
              type="button"
              onClick={onClose}
              className="w-full py-3.5 rounded-full bg-[#2563eb] hover:bg-[#1d4ed8] text-white text-sm font-semibold shadow-md transition-colors cursor-pointer"
            >
              Concluir
            </button>
          </div>
        </div>
      )}

      {/* STEP 6: MEUS AGENDAMENTOS (CONSULTA & CANCELAMENTO) */}
      {step === 6 && (
        <div className="py-2 flex-1 flex flex-col justify-between space-y-4">
          <div className="space-y-4">
            {/* Search Box */}
            <div className="bg-gray-50 p-3 rounded-2xl border border-gray-200/80 space-y-2">
              <label className="text-xs font-semibold text-gray-700 block">
                Consulte seus agendamentos pelo telefone:
              </label>
              <div className="flex gap-2">
                <input
                  type="tel"
                  placeholder="Ex: (11) 99999-9999"
                  value={searchPhone || phone}
                  onChange={(e) => setSearchPhone(e.target.value)}
                  className="flex-1 px-3.5 py-2.5 rounded-xl border border-gray-300 text-xs bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <button
                  type="button"
                  onClick={() => handleSearchClientAppointments()}
                  disabled={isLoadingAppointments}
                  className="px-4 py-2.5 bg-[#2563eb] hover:bg-[#1d4ed8] text-white rounded-xl text-xs font-bold transition-colors cursor-pointer flex items-center gap-1.5 shrink-0"
                >
                  <Search className="w-3.5 h-3.5" />
                  <span>{isLoadingAppointments ? 'Buscando...' : 'Buscar'}</span>
                </button>
              </div>
            </div>

            {cancelSuccessMsg && (
              <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 p-3 rounded-xl text-xs flex items-center gap-2">
                <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>{cancelSuccessMsg}</span>
              </div>
            )}

            {bookingError && (
              <div className="bg-red-50 border border-red-200 text-red-700 p-3 rounded-xl text-xs">
                {bookingError}
              </div>
            )}

            {/* List of Appointments */}
            <div className="space-y-3 max-h-[300px] overflow-y-auto pr-1">
              {clientAppointments.length === 0 ? (
                <div className="text-center py-8 text-gray-400 text-xs space-y-2">
                  <CalendarIcon className="w-8 h-8 mx-auto text-gray-300 stroke-[1.5]" />
                  <p>Digite seu telefone acima para visualizar seus agendamentos nesta barbearia.</p>
                </div>
              ) : (
                clientAppointments.map((app) => {
                  const serv = services.find(s => s.id === app.serviceId);
                  const barb = barbers.find(b => b.id === app.barberId);
                  const isCancelled = app.status === 'cancelled';
                  const isCancelledByBarbershop = isCancelled && app.cancelledBy === 'barbershop';
                  const isCancelledByClient = isCancelled && app.cancelledBy === 'client';

                  return (
                    <div 
                      key={app.id} 
                      className={`p-4 rounded-2xl border transition-all text-left space-y-3 ${
                        isCancelledByBarbershop
                          ? 'bg-red-50/60 border-red-200'
                          : isCancelled
                          ? 'bg-gray-50 border-gray-200 opacity-75'
                          : 'bg-white border-gray-200 hover:border-blue-300 shadow-xs'
                      }`}
                    >
                      <div className="flex justify-between items-start">
                        <div>
                          <h4 className="font-bold text-sm text-gray-900">{serv?.name || 'Serviço Agendado'}</h4>
                          <p className="text-xs text-gray-500 flex items-center gap-1 mt-0.5">
                            <User className="w-3 h-3 text-gray-400" />
                            <span>Profissional: <strong>{barb?.name || 'Profissional'}</strong></span>
                          </p>
                        </div>

                        {isCancelled ? (
                          <span className="bg-red-100 text-red-700 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase">
                            Cancelado
                          </span>
                        ) : app.status === 'completed' ? (
                          <span className="bg-emerald-100 text-emerald-800 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase">
                            Concluído
                          </span>
                        ) : (
                          <span className="bg-blue-100 text-blue-700 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase">
                            Confirmado
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-4 text-xs text-gray-700 font-medium pt-1 border-t border-gray-100">
                        <span className="flex items-center gap-1">
                          <CalendarIcon className="w-3.5 h-3.5 text-blue-600" />
                          {app.date}
                        </span>
                        <span className="flex items-center gap-1 font-mono">
                          <Clock className="w-3.5 h-3.5 text-blue-600" />
                          {app.time}
                        </span>
                      </div>

                      {/* Barbershop cancellation alert */}
                      {isCancelledByBarbershop && (
                        <div className="bg-red-100/80 border border-red-300 p-2.5 rounded-xl text-xs text-red-900 space-y-1">
                          <p className="font-bold flex items-center gap-1.5 text-red-800">
                            <AlertTriangle className="w-3.5 h-3.5 text-red-600" />
                            Aviso: Cancelado pela Barbearia
                          </p>
                          {app.cancellationReason && (
                            <p className="text-[11px] text-red-700 italic">
                              "{app.cancellationReason}"
                            </p>
                          )}
                          <div className="pt-1">
                            <button
                              type="button"
                              onClick={() => {
                                setSelectedService(serv || null);
                                setSelectedBarber(barb || null);
                                setStep(3);
                              }}
                              className="text-[11px] bg-red-600 hover:bg-red-700 text-white font-bold px-3 py-1 rounded-lg transition-colors cursor-pointer flex items-center gap-1"
                            >
                              <RotateCcw className="w-3 h-3" />
                              <span>Reagendar Novo Horário</span>
                            </button>
                          </div>
                        </div>
                      )}

                      {/* Cancelled by client message */}
                      {isCancelledByClient && (
                        <p className="text-[11px] text-gray-500 italic bg-gray-100/70 p-2 rounded-lg">
                          Cancelado por você{app.cancellationReason ? `: "${app.cancellationReason}"` : ''}.
                        </p>
                      )}

                      {/* Action to Cancel if active */}
                      {!isCancelled && app.status !== 'completed' && (
                        <div className="pt-2 flex justify-end">
                          <button
                            type="button"
                            onClick={() => {
                              setCancellingApp(app);
                              setCancelReason('');
                            }}
                            className="text-xs bg-red-50 hover:bg-red-100 text-red-600 hover:text-red-700 font-semibold px-3 py-1.5 rounded-xl border border-red-200 transition-colors flex items-center gap-1 cursor-pointer"
                          >
                            <Ban className="w-3.5 h-3.5" />
                            <span>Cancelar Horário</span>
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </div>

          <div className="flex items-center justify-between gap-3 pt-3 border-t border-gray-100">
            <button
              type="button"
              onClick={() => setStep(1)}
              className="px-5 py-2 rounded-full border border-gray-200 text-xs font-semibold text-gray-700 hover:bg-gray-50 transition-colors cursor-pointer"
            >
              ← Fazer Novo Agendamento
            </button>
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2 rounded-full bg-gray-900 hover:bg-black text-white text-xs font-semibold transition-colors cursor-pointer"
            >
              Fechar
            </button>
          </div>
        </div>
      )}

      {/* MODAL DE CONFIRMAÇÃO DE CANCELAMENTO PELO CLIENTE */}
      {cancellingApp && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-sm bg-white rounded-3xl p-6 shadow-2xl space-y-4 text-left border border-gray-100">
            <div className="w-12 h-12 rounded-full bg-red-100 text-red-600 flex items-center justify-center mx-auto">
              <Ban className="w-6 h-6" />
            </div>

            <div className="text-center space-y-1">
              <h3 className="text-base font-bold text-gray-900">Cancelar Agendamento?</h3>
              <p className="text-xs text-gray-500">
                Data: <strong>{cancellingApp.date} às {cancellingApp.time}</strong>
              </p>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-gray-700 block">
                Motivo do cancelamento (opcional):
              </label>
              <textarea
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                placeholder="Ex: Tive um imprevisto de trabalho..."
                rows={2}
                className="w-full px-3 py-2 text-xs border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500 bg-white"
              />
            </div>

            <p className="text-[11px] text-gray-500 leading-relaxed">
              Ao confirmar, o horário será liberado na barbearia e enviaremos um aviso automático para a equipe.
            </p>

            <div className="grid grid-cols-2 gap-3 pt-2">
              <button
                type="button"
                onClick={() => setCancellingApp(null)}
                className="py-2.5 rounded-xl border border-gray-200 text-xs font-bold text-gray-700 hover:bg-gray-50 transition-colors cursor-pointer"
              >
                Voltar
              </button>
              <button
                type="button"
                onClick={handleConfirmCancelAppointment}
                className="py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold transition-colors cursor-pointer shadow-md shadow-red-600/20"
              >
                Confirmar Cancelamento
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
