import React, { useState, useEffect } from 'react';
import { 
  Users, 
  Plus, 
  Clock, 
  Scissors, 
  User, 
  Phone, 
  CheckCircle2, 
  Trash2, 
  Play, 
  Check, 
  Tv, 
  Volume2, 
  Share2, 
  X, 
  MessageSquare, 
  Sparkles,
  ExternalLink,
  ChevronRight,
  HelpCircle,
  Info,
  Calendar as CalendarIcon
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Barber, Service, QueueItem } from '../types';

interface QueueManagerProps {
  merchantUid: string;
  barbers: Barber[];
  services: Service[];
  queue: QueueItem[];
  onAddToQueue: (item: Omit<QueueItem, 'id' | 'status' | 'joinedAt'>) => void;
  onStartService: (itemId: string, barberId?: string) => void;
  onFinishService: (itemId: string) => void;
  onRemoveQueueItem: (itemId: string) => void;
}

export default function QueueManager({
  merchantUid,
  barbers,
  services,
  queue,
  onAddToQueue,
  onStartService,
  onFinishService,
  onRemoveQueueItem,
}: QueueManagerProps) {
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isTvModeOpen, setIsTvModeOpen] = useState(false);
  const [showInfoModal, setShowInfoModal] = useState(false);
  const [calledClient, setCalledClient] = useState<{ name: string; barberName?: string; serviceName?: string } | null>(null);
  
  // Add item form state
  const [clientName, setClientName] = useState('');
  const [clientPhone, setClientPhone] = useState('');
  const [serviceId, setServiceId] = useState(services[0]?.id || '');
  const [barberId, setBarberId] = useState('');
  const [notes, setNotes] = useState('');

  // Selected barber filter
  const [filterBarberId, setFilterBarberId] = useState<string>('all');
  const [queueTab, setQueueTab] = useState<'waiting' | 'in_progress' | 'completed'>('waiting');

  // Copy queue link toast
  const [copiedLink, setCopiedLink] = useState(false);

  // Time state for TV mode
  const [currentTime, setCurrentTime] = useState(new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }));

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Filtered queue items
  const filteredQueue = queue.filter(item => {
    if (filterBarberId !== 'all' && item.barberId && item.barberId !== filterBarberId) {
      return false;
    }
    return true;
  });

  const waitingItems = filteredQueue.filter(item => item.status === 'waiting');
  const inProgressItems = filteredQueue.filter(item => item.status === 'in_progress');
  const completedItems = filteredQueue.filter(item => item.status === 'completed');

  // Calculate estimated wait time (average ~25 mins per person waiting ahead)
  const averageServiceDuration = 25;
  const estimatedWaitMinutes = waitingItems.length * (barbers.length > 0 ? Math.ceil(averageServiceDuration / Math.max(barbers.length, 1)) : averageServiceDuration);

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!clientName.trim()) return;

    onAddToQueue({
      ownerId: merchantUid,
      clientName: clientName.trim(),
      clientPhone: clientPhone.trim(),
      serviceId: serviceId || (services[0]?.id || ''),
      barberId: barberId || undefined,
      notes: notes.trim() || undefined
    });

    setClientName('');
    setClientPhone('');
    setNotes('');
    setIsAddModalOpen(false);
  };

  const handleCallClient = (item: QueueItem) => {
    const barber = barbers.find(b => b.id === item.barberId);
    const service = services.find(s => s.id === item.serviceId);
    
    setCalledClient({
      name: item.clientName,
      barberName: barber?.name,
      serviceName: service?.name
    });

    // Voice announcement (SpeechSynthesis)
    if ('speechSynthesis' in window) {
      try {
        const text = `Atenção: Cliente ${item.clientName}, favor dirigir-se à cadeira ${barber ? 'do barbeiro ' + barber.name : 'de atendimento'}.`;
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = 'pt-BR';
        utterance.rate = 0.95;
        window.speechSynthesis.speak(utterance);
      } catch (err) {
        console.warn('Síntese de voz não suportada ou bloqueada no navegador:', err);
      }
    }
  };

  const handleShareQueueLink = () => {
    const url = `${window.location.origin}/?b=${merchantUid}&mode=fila`;
    navigator.clipboard.writeText(url);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 3000);
  };

  const handleSendWhatsAppNotification = (item: QueueItem, positionIndex: number) => {
    const phoneClean = item.clientPhone.replace(/\D/g, '');
    if (!phoneClean) {
      alert('Este cliente não possui número de telefone cadastrado.');
      return;
    }

    const pos = positionIndex + 1;
    const msg = `Olá *${item.clientName}*! Passando para avisar que sua vez está chegando na barbearia! Você é o número *#${pos}* da fila de espera. Por favor, esteja próximo! 💈✂️`;
    window.open(`https://wa.me/55${phoneClean}?text=${encodeURIComponent(msg)}`, '_blank');
  };

  return (
    <div className="space-y-6 text-left">
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] bg-amber-100 text-amber-900 border border-amber-200 font-extrabold px-2.5 py-0.5 rounded-full uppercase tracking-wider flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-ping" />
              Ao Vivo
            </span>
            <h2 className="font-display font-extrabold text-2xl text-brand-dark">
              Fila de Atendimento
            </h2>
          </div>
          <p className="text-xs text-gray-500 mt-0.5">
            Gerenciamento por ordem de chegada com chamada de voz e painel de TV
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setShowInfoModal(true)}
            className="bg-blue-50 hover:bg-blue-100 text-brand-blue font-extrabold text-xs py-2.5 px-3.5 rounded-xl flex items-center gap-1.5 transition-colors cursor-pointer border border-blue-200"
            title="Como funciona a Fila e o Pop-up?"
          >
            <HelpCircle className="w-4 h-4 text-brand-blue" />
            <span className="hidden sm:inline">Como funciona?</span>
          </button>

          <button
            onClick={() => setIsTvModeOpen(true)}
            className="bg-gray-900 hover:bg-black text-white font-extrabold text-xs py-2.5 px-3.5 rounded-xl flex items-center gap-1.5 transition-colors cursor-pointer shadow-sm"
            title="Abrir Painel de TV / Chamada em Tela Cheia"
          >
            <Tv className="w-4 h-4 text-amber-400" />
            <span className="hidden sm:inline">Modo TV / Painel</span>
          </button>

          <button
            onClick={handleShareQueueLink}
            className="bg-gray-100 hover:bg-gray-200 text-gray-800 font-extrabold text-xs py-2.5 px-3.5 rounded-xl flex items-center gap-1.5 transition-colors cursor-pointer"
            title="Copiar link para os clientes acompanharem a fila"
          >
            <Share2 className="w-4 h-4 text-brand-blue" />
            <span>{copiedLink ? 'Link Copiado! ✓' : 'Link da Fila'}</span>
          </button>

          <button
            onClick={() => setIsAddModalOpen(true)}
            className="bg-brand-blue hover:bg-brand-blue-light text-white font-extrabold text-xs py-2.5 px-4 rounded-xl flex items-center gap-1.5 transition-colors shadow-sm cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Adicionar Cliente</span>
          </button>
        </div>
      </div>

      {/* METRICS ROW */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className="bg-amber-50 border border-amber-100 p-4 rounded-3xl text-left">
          <div className="flex items-center justify-between text-amber-800 text-xs font-bold">
            <span>Aguardando na Fila</span>
            <Users className="w-4 h-4 text-amber-600" />
          </div>
          <p className="font-display font-black text-3xl text-amber-900 mt-2">
            {waitingItems.length}
          </p>
          <p className="text-[10px] text-amber-700 mt-0.5">
            {waitingItems.length === 1 ? '1 pessoa na vez' : `${waitingItems.length} pessoas na vez`}
          </p>
        </div>

        <div className="bg-blue-50 border border-blue-100 p-4 rounded-3xl text-left">
          <div className="flex items-center justify-between text-blue-800 text-xs font-bold">
            <span>Na Cadeira</span>
            <Scissors className="w-4 h-4 text-blue-600" />
          </div>
          <p className="font-display font-black text-3xl text-brand-blue mt-2">
            {inProgressItems.length}
          </p>
          <p className="text-[10px] text-blue-700 mt-0.5">
            Em atendimento agora
          </p>
        </div>

        <div className="bg-emerald-50 border border-emerald-100 p-4 rounded-3xl text-left">
          <div className="flex items-center justify-between text-emerald-800 text-xs font-bold">
            <span>Atendidos Hoje</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          </div>
          <p className="font-display font-black text-3xl text-emerald-900 mt-2">
            {completedItems.length}
          </p>
          <p className="text-[10px] text-emerald-700 mt-0.5">
            Finalizados com sucesso
          </p>
        </div>

        <div className="bg-purple-50 border border-purple-100 p-4 rounded-3xl text-left">
          <div className="flex items-center justify-between text-purple-800 text-xs font-bold">
            <span>Tempo Estimado</span>
            <Clock className="w-4 h-4 text-purple-600" />
          </div>
          <p className="font-display font-black text-3xl text-purple-900 mt-2">
            ~{estimatedWaitMinutes} <span className="text-base font-bold">min</span>
          </p>
          <p className="text-[10px] text-purple-700 mt-0.5">
            Tempo para o último da fila
          </p>
        </div>
      </div>

      {/* FILTER & TAB SELECTOR */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-gray-100 pb-3">
        {/* Status Sub-tabs */}
        <div className="flex gap-2">
          <button
            onClick={() => setQueueTab('waiting')}
            className={`px-4 py-2 rounded-xl text-xs font-extrabold transition-all cursor-pointer flex items-center gap-2 ${
              queueTab === 'waiting'
                ? 'bg-amber-500 text-white shadow-xs'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            <span>Aguardando</span>
            <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${queueTab === 'waiting' ? 'bg-white/30 text-white' : 'bg-gray-200 text-gray-700'}`}>
              {waitingItems.length}
            </span>
          </button>

          <button
            onClick={() => setQueueTab('in_progress')}
            className={`px-4 py-2 rounded-xl text-xs font-extrabold transition-all cursor-pointer flex items-center gap-2 ${
              queueTab === 'in_progress'
                ? 'bg-brand-blue text-white shadow-xs'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            <span>Na Cadeira</span>
            <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${queueTab === 'in_progress' ? 'bg-white/30 text-white' : 'bg-gray-200 text-gray-700'}`}>
              {inProgressItems.length}
            </span>
          </button>

          <button
            onClick={() => setQueueTab('completed')}
            className={`px-4 py-2 rounded-xl text-xs font-extrabold transition-all cursor-pointer flex items-center gap-2 ${
              queueTab === 'completed'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            <span>Concluídos</span>
            <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${queueTab === 'completed' ? 'bg-white/30 text-white' : 'bg-gray-200 text-gray-700'}`}>
              {completedItems.length}
            </span>
          </button>
        </div>

        {/* Barber Filter dropdown */}
        <div className="flex items-center gap-2 text-xs">
          <span className="text-gray-400 font-bold hidden sm:inline">Filtrar Barbeiro:</span>
          <select
            value={filterBarberId}
            onChange={e => setFilterBarberId(e.target.value)}
            className="p-2 rounded-xl border border-gray-200 bg-white text-xs font-bold text-gray-700 focus:outline-none focus:border-brand-blue cursor-pointer"
          >
            <option value="all">Todos os Barbeiros</option>
            {barbers.map(b => (
              <option key={b.id} value={b.id}>{b.name}</option>
            ))}
          </select>
        </div>
      </div>

      {/* QUEUE ITEMS LIST */}
      <div className="space-y-3">
        {queueTab === 'waiting' && (
          <>
            {waitingItems.length === 0 ? (
              <div className="bg-white p-12 rounded-3xl border border-dashed border-gray-200 text-center space-y-3">
                <div className="w-14 h-14 bg-amber-50 text-amber-600 rounded-full flex items-center justify-center mx-auto">
                  <Users className="w-7 h-7" />
                </div>
                <h4 className="font-extrabold text-brand-dark text-base">Fila de Espera Vazia</h4>
                <p className="text-xs text-gray-400 max-w-sm mx-auto">
                  Nenhum cliente aguardando na fila no momento. Clique em "Adicionar Cliente" ou envie o link da sua barbearia para os clientes entrarem na fila.
                </p>
                <button
                  onClick={() => setIsAddModalOpen(true)}
                  className="bg-brand-blue text-white text-xs font-extrabold py-2.5 px-4 rounded-xl shadow-xs hover:bg-brand-blue-light transition-all cursor-pointer inline-flex items-center gap-1.5"
                >
                  <Plus className="w-4 h-4" />
                  <span>Inserir Primeiro Cliente</span>
                </button>
              </div>
            ) : (
              waitingItems.map((item, index) => {
                const service = services.find(s => s.id === item.serviceId);
                const barber = barbers.find(b => b.id === item.barberId);
                const isNext = index === 0;

                const joinedTime = item.joinedAt 
                  ? new Date(item.joinedAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
                  : '--:--';

                return (
                  <motion.div
                    key={item.id}
                    layout
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    className={`bg-white rounded-3xl border p-4 sm:p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 transition-all shadow-xs ${
                      isNext ? 'border-amber-400 ring-2 ring-amber-400/20 bg-amber-50/20' : 'border-gray-100 hover:border-gray-200'
                    }`}
                  >
                    <div className="flex items-start sm:items-center gap-4 min-w-0">
                      {/* Position Tag */}
                      <div className={`w-12 h-12 rounded-2xl flex flex-col items-center justify-center shrink-0 font-black ${
                        isNext ? 'bg-amber-500 text-white shadow-md' : 'bg-gray-100 text-gray-700'
                      }`}>
                        <span className="text-[10px] uppercase font-bold leading-none">Fila</span>
                        <span className="text-lg leading-tight">#{index + 1}</span>
                      </div>

                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h4 className="font-extrabold text-base text-brand-dark truncate">
                            {item.clientName}
                          </h4>
                          {isNext && (
                            <span className="text-[9px] bg-amber-100 text-amber-900 border border-amber-300 font-black px-2 py-0.5 rounded-full uppercase">
                              Próximo da Vez 🔥
                            </span>
                          )}
                        </div>

                        <div className="flex flex-wrap items-center gap-3 text-xs text-gray-500 mt-1">
                          <span className="flex items-center gap-1 font-semibold text-brand-dark">
                            <Scissors className="w-3.5 h-3.5 text-brand-blue" />
                            <span>{service?.name || 'Corte Padrão'}</span>
                            <span className="text-gray-400 font-normal">(R$ {service?.price.toFixed(2).replace('.', ',')})</span>
                          </span>

                          <span className="flex items-center gap-1 text-gray-600">
                            <User className="w-3.5 h-3.5 text-gray-400" />
                            <span>{barber ? barber.name : 'Qualquer barbeiro'}</span>
                          </span>

                          <span className="flex items-center gap-1 text-gray-400 text-[11px]">
                            <Clock className="w-3 h-3" />
                            <span>Entrou às {joinedTime}</span>
                          </span>
                        </div>

                        {item.notes && (
                          <p className="text-[11px] text-gray-500 italic mt-1 bg-gray-50 p-1.5 rounded-lg border border-gray-100">
                            Obs: {item.notes}
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Action buttons */}
                    <div className="flex items-center gap-2 flex-wrap sm:justify-end pt-2 md:pt-0 border-t md:border-t-0 border-gray-100">
                      {/* Chamar por Voz / Painel */}
                      <button
                        onClick={() => handleCallClient(item)}
                        className="bg-amber-500 hover:bg-amber-600 text-white text-xs font-extrabold py-2.5 px-3 rounded-xl flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs"
                        title="Chamar cliente no painel e som de voz"
                      >
                        <Volume2 className="w-4 h-4" />
                        <span>Chamar</span>
                      </button>

                      {/* Notificar por WhatsApp */}
                      {item.clientPhone && (
                        <button
                          onClick={() => handleSendWhatsAppNotification(item, index)}
                          className="bg-emerald-50 hover:bg-emerald-100 text-emerald-700 text-xs font-extrabold py-2.5 px-3 rounded-xl flex items-center gap-1.5 transition-colors cursor-pointer border border-emerald-200"
                          title="Avisar cliente pelo WhatsApp que a vez está chegando"
                        >
                          <MessageSquare className="w-4 h-4 text-emerald-600" />
                          <span className="hidden sm:inline">WhatsApp</span>
                        </button>
                      )}

                      {/* Iniciar Atendimento */}
                      <button
                        onClick={() => onStartService(item.id, item.barberId || barbers[0]?.id)}
                        className="bg-brand-blue hover:bg-brand-blue-light text-white text-xs font-extrabold py-2.5 px-3.5 rounded-xl flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs"
                        title="Colocar cliente na cadeira de atendimento"
                      >
                        <Play className="w-3.5 h-3.5 fill-white" />
                        <span>Atender</span>
                      </button>

                      {/* Excluir da Fila */}
                      <button
                        onClick={() => {
                          if (confirm(`Remover ${item.clientName} da fila?`)) {
                            onRemoveQueueItem(item.id);
                          }
                        }}
                        className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-colors cursor-pointer"
                        title="Remover cliente da fila"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </motion.div>
                );
              })
            )}
          </>
        )}

        {queueTab === 'in_progress' && (
          <>
            {inProgressItems.length === 0 ? (
              <div className="bg-white p-12 rounded-3xl border border-dashed border-gray-200 text-center space-y-2">
                <Scissors className="w-8 h-8 text-gray-300 mx-auto" />
                <h4 className="font-extrabold text-brand-dark text-base">Nenhum atendimento na cadeira no momento</h4>
                <p className="text-xs text-gray-400">
                  Clique em "Atender" em qualquer cliente na fila para iniciar o corte.
                </p>
              </div>
            ) : (
              inProgressItems.map(item => {
                const service = services.find(s => s.id === item.serviceId);
                const barber = barbers.find(b => b.id === item.barberId);

                return (
                  <div
                    key={item.id}
                    className="bg-blue-50/40 border border-blue-200 rounded-3xl p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-xs"
                  >
                    <div className="flex items-center gap-3.5">
                      <div className="w-12 h-12 rounded-2xl bg-brand-blue text-white flex items-center justify-center font-bold shrink-0">
                        <Scissors className="w-6 h-6 animate-pulse" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] bg-brand-blue text-white font-extrabold px-2 py-0.5 rounded-full uppercase">
                            Na Cadeira Agora
                          </span>
                          <h4 className="font-extrabold text-base text-brand-dark">{item.clientName}</h4>
                        </div>
                        <p className="text-xs text-gray-600 mt-0.5">
                          <strong>{service?.name || 'Corte'}</strong> • Barbeiro: <strong>{barber?.name || 'Principal'}</strong>
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => onFinishService(item.id)}
                        className="w-full sm:w-auto bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs py-2.5 px-4 rounded-xl flex items-center justify-center gap-1.5 transition-colors cursor-pointer shadow-sm"
                      >
                        <Check className="w-4 h-4 stroke-[3]" />
                        <span>Concluir Corte</span>
                      </button>

                      <button
                        onClick={() => {
                          if (confirm(`Remover atendimento de ${item.clientName}?`)) {
                            onRemoveQueueItem(item.id);
                          }
                        }}
                        className="p-2 text-gray-400 hover:text-red-600 rounded-xl transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </>
        )}

        {queueTab === 'completed' && (
          <>
            {completedItems.length === 0 ? (
              <div className="bg-white p-12 rounded-3xl border border-dashed border-gray-200 text-center space-y-2">
                <CheckCircle2 className="w-8 h-8 text-gray-300 mx-auto" />
                <h4 className="font-extrabold text-brand-dark text-base">Nenhum atendimento concluído hoje</h4>
                <p className="text-xs text-gray-400">
                  Os cortes finalizados na fila aparecerão listados aqui com horários e valores.
                </p>
              </div>
            ) : (
              <div className="bg-white rounded-3xl border border-gray-100 divide-y divide-gray-100 overflow-hidden shadow-xs">
                {completedItems.map(item => {
                  const service = services.find(s => s.id === item.serviceId);
                  const barber = barbers.find(b => b.id === item.barberId);

                  return (
                    <div key={item.id} className="p-4 flex items-center justify-between gap-4 text-xs">
                      <div>
                        <p className="font-extrabold text-brand-dark">{item.clientName}</p>
                        <p className="text-[11px] text-gray-500">
                          {service?.name || 'Serviço'} • {barber?.name || 'Barbeiro'}
                        </p>
                      </div>
                      <div className="text-right">
                        <span className="font-mono font-bold text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-100">
                          R$ {service?.price.toFixed(2).replace('.', ',') || '0,00'}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </>
        )}
      </div>

      {/* MODAL: ADICIONAR CLIENTE NA FILA */}
      <AnimatePresence>
        {isAddModalOpen && (
          <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-3xl max-w-md w-full p-6 text-left space-y-4 shadow-2xl relative"
            >
              <div className="flex justify-between items-center border-b border-gray-100 pb-3">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-brand-blue/10 text-brand-blue flex items-center justify-center font-bold">
                    <Plus className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="font-extrabold text-sm text-brand-dark">Inserir Cliente na Fila</h3>
                    <p className="text-[10px] text-gray-400">Adicione um cliente por ordem de chegada</p>
                  </div>
                </div>
                <button
                  onClick={() => setIsAddModalOpen(false)}
                  className="p-1 text-gray-400 hover:text-gray-600 rounded-lg"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleFormSubmit} className="space-y-3.5 text-xs">
                <div>
                  <label className="block font-bold text-gray-700 mb-1">Nome do Cliente *</label>
                  <input
                    type="text"
                    value={clientName}
                    onChange={e => setClientName(e.target.value)}
                    placeholder="Ex: Carlos Silva"
                    required
                    className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:border-brand-blue"
                  />
                </div>

                <div>
                  <label className="block font-bold text-gray-700 mb-1">WhatsApp / Telefone (Opcional)</label>
                  <input
                    type="tel"
                    value={clientPhone}
                    onChange={e => setClientPhone(e.target.value)}
                    placeholder="(82) 99999-9999"
                    className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:border-brand-blue"
                  />
                  <p className="text-[10px] text-gray-400 mt-1">Usado para enviar o aviso automático quando a vez estiver chegando.</p>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-bold text-gray-700 mb-1">Serviço *</label>
                    <select
                      value={serviceId}
                      onChange={e => setServiceId(e.target.value)}
                      className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:border-brand-blue font-semibold"
                    >
                      {services.map(s => (
                        <option key={s.id} value={s.id}>
                          {s.name} - R$ {s.price.toFixed(2)}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block font-bold text-gray-700 mb-1">Barbeiro Preferido</label>
                    <select
                      value={barberId}
                      onChange={e => setBarberId(e.target.value)}
                      className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:border-brand-blue font-semibold"
                    >
                      <option value="">Qualquer Barbeiro</option>
                      {barbers.map(b => (
                        <option key={b.id} value={b.id}>{b.name}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block font-bold text-gray-700 mb-1">Observações (Opcional)</label>
                  <input
                    type="text"
                    value={notes}
                    onChange={e => setNotes(e.target.value)}
                    placeholder="Ex: Barba desenhada, degradê navalhado..."
                    className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:border-brand-blue"
                  />
                </div>

                <div className="flex gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setIsAddModalOpen(false)}
                    className="w-1/3 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold py-3 rounded-xl transition-colors cursor-pointer"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="w-2/3 bg-brand-blue hover:bg-brand-blue-light text-white font-extrabold py-3 rounded-xl transition-colors cursor-pointer uppercase tracking-wider"
                  >
                    Inserir na Fila
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* POPUP: CLIENTE SENDO CHAMADO */}
      <AnimatePresence>
        {calledClient && (
          <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-3xl max-w-sm w-full p-6 text-center space-y-4 shadow-2xl relative border-4 border-amber-400"
            >
              <div className="w-16 h-16 rounded-full bg-amber-100 text-amber-600 flex items-center justify-center mx-auto animate-bounce">
                <Volume2 className="w-8 h-8" />
              </div>

              <div>
                <span className="text-[10px] bg-amber-100 text-amber-900 font-extrabold px-3 py-1 rounded-full uppercase tracking-wider">
                  Chamada Realizada
                </span>
                <h3 className="font-display font-black text-2xl text-brand-dark mt-2">
                  {calledClient.name}
                </h3>
                <p className="text-xs text-gray-500 mt-1">
                  Favor dirigir-se à cadeira de atendimento {calledClient.barberName ? `do barbeiro ${calledClient.barberName}` : ''}
                </p>
              </div>

              <button
                onClick={() => setCalledClient(null)}
                className="w-full bg-brand-dark hover:bg-black text-white font-extrabold text-xs py-3 rounded-xl uppercase tracking-wider transition-colors cursor-pointer"
              >
                Fechar Aviso
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* FULLSCREEN TV / TOTEM MODE */}
      <AnimatePresence>
        {isTvModeOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-[#051b42] text-white p-6 sm:p-10 flex flex-col justify-between overflow-y-auto"
          >
            {/* Top Bar of TV Mode */}
            <div className="flex items-center justify-between border-b border-white/10 pb-6">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-amber-500 text-white rounded-2xl flex items-center justify-center font-bold text-xl shadow-lg">
                  ✂️
                </div>
                <div>
                  <h1 className="font-display font-black text-2xl sm:text-3xl text-white tracking-tight">
                    Painel de Atendimento
                  </h1>
                  <p className="text-xs text-amber-300 font-bold uppercase tracking-wider">
                    Ordem de Chegada em Tempo Real
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-6">
                <div className="text-right font-mono">
                  <p className="text-3xl sm:text-4xl font-black text-brand-lime">{currentTime}</p>
                  <p className="text-[11px] text-gray-400 uppercase tracking-widest">Horário de Brasília</p>
                </div>

                <button
                  onClick={() => setIsTvModeOpen(false)}
                  className="p-3 bg-white/10 hover:bg-white/20 rounded-2xl transition-colors cursor-pointer text-white"
                  title="Sair do Modo TV"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
            </div>

            {/* Main Stage of TV Mode */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 my-auto py-8">
              {/* Left Giant Column: Next or Current Call */}
              <div className="lg:col-span-7 bg-white/5 border border-white/10 rounded-3xl p-8 flex flex-col justify-center text-center space-y-6">
                <span className="text-xs sm:text-sm bg-amber-500 text-white font-black px-4 py-1.5 rounded-full uppercase tracking-widest mx-auto shadow-md animate-pulse">
                  {waitingItems[0] ? 'Próximo a ser Atendido' : 'Todos Atendidos'}
                </span>

                {waitingItems[0] ? (
                  <>
                    <h2 className="font-display font-black text-5xl sm:text-6xl md:text-7xl text-white tracking-tight">
                      {waitingItems[0].clientName}
                    </h2>

                    <div className="flex flex-wrap justify-center items-center gap-4 text-sm sm:text-base text-gray-300">
                      <span className="bg-white/10 px-4 py-2 rounded-2xl font-bold">
                        💈 {services.find(s => s.id === waitingItems[0].serviceId)?.name || 'Corte'}
                      </span>
                      {waitingItems[0].barberId && (
                        <span className="bg-white/10 px-4 py-2 rounded-2xl font-bold">
                          👤 Barbeiro: {barbers.find(b => b.id === waitingItems[0].barberId)?.name}
                        </span>
                      )}
                    </div>
                  </>
                ) : (
                  <p className="text-xl text-gray-400 font-bold">
                    Nenhum cliente aguardando na fila.
                  </p>
                )}
              </div>

              {/* Right Column: Next 4 in Line */}
              <div className="lg:col-span-5 bg-white/5 border border-white/10 rounded-3xl p-6 sm:p-8 space-y-4 text-left">
                <h3 className="font-display font-extrabold text-lg text-white border-b border-white/10 pb-3 flex items-center justify-between">
                  <span>Próximos na Fila</span>
                  <span className="text-xs text-amber-400 font-mono">
                    {waitingItems.length} aguardando
                  </span>
                </h3>

                <div className="space-y-2.5">
                  {waitingItems.slice(1, 5).map((item, idx) => (
                    <div
                      key={item.id}
                      className="bg-white/10 p-3.5 rounded-2xl flex items-center justify-between text-sm"
                    >
                      <div className="flex items-center gap-3">
                        <span className="w-8 h-8 rounded-xl bg-amber-500/30 text-amber-300 font-bold flex items-center justify-center text-xs">
                          #{idx + 2}
                        </span>
                        <span className="font-extrabold text-white">{item.clientName}</span>
                      </div>
                      <span className="text-xs text-gray-400">
                        {services.find(s => s.id === item.serviceId)?.name || 'Corte'}
                      </span>
                    </div>
                  ))}

                  {waitingItems.length <= 1 && (
                    <p className="text-xs text-gray-400 py-6 text-center">
                      Nenhum outro cliente aguardando.
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Bottom Footer of TV Mode */}
            <div className="border-t border-white/10 pt-4 flex flex-col sm:flex-row items-center justify-between text-xs text-gray-400 gap-2">
              <p>
                Entre na fila pelo smartphone acessando a vitrine da barbearia.
              </p>
              <p className="font-bold text-white flex items-center gap-1.5">
                <span>Powered by</span>
                <span className="text-brand-lime font-black">Cortestime</span>
              </p>
            </div>
          </motion.div>
        )}

        {/* MODAL INFORMATIVO DA FILA / POP-UP EXPLICATIVO */}
        {showInfoModal && (
          <div className="fixed inset-0 z-50 bg-[#051b42]/80 backdrop-blur-md flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className="bg-white rounded-[32px] p-6 sm:p-8 max-w-lg w-full shadow-2xl relative border border-gray-100 my-auto text-left space-y-5"
            >
              <button
                type="button"
                onClick={() => setShowInfoModal(false)}
                className="absolute top-5 right-5 p-2 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100 transition-colors z-20 cursor-pointer"
                title="Fechar"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="flex items-center gap-3 border-b border-gray-100 pb-4">
                <div className="w-11 h-11 rounded-2xl bg-amber-500/10 text-amber-600 flex items-center justify-center font-bold">
                  <Users className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-black text-brand-dark">Como funciona a Fila Virtual?</h3>
                  <p className="text-xs text-gray-500">Tudo o que você precisa saber sobre o sistema de ordem de chegada</p>
                </div>
              </div>

              <div className="space-y-3.5 text-xs text-gray-600 leading-relaxed max-h-[60vh] overflow-y-auto pr-1">
                <div className="p-3.5 bg-amber-50/70 border border-amber-200/80 rounded-2xl space-y-1">
                  <p className="font-extrabold text-amber-900 flex items-center gap-1.5 text-xs">
                    <Users className="w-4 h-4 text-amber-700" />
                    <span>O que é a Fila Virtual?</span>
                  </p>
                  <p className="text-[11px] text-amber-800">
                    A Fila Virtual permite atender clientes por ordem de chegada sem aglomeração na recepção. O cliente pode entrar na fila presencialmente ou pelo celular ao acessar o link da sua Vitrine.
                  </p>
                </div>

                <div className="p-3.5 bg-blue-50/70 border border-blue-100 rounded-2xl space-y-1">
                  <p className="font-extrabold text-brand-blue flex items-center gap-1.5 text-xs">
                    <Sparkles className="w-4 h-4 text-brand-blue" />
                    <span>Como o cliente acompanha a vez?</span>
                  </p>
                  <p className="text-[11px] text-gray-600">
                    Ao entrar na fila, o cliente recebe um pop-up com o número da sua posição (ex: #3 da fila), o tempo estimado de espera calculado automaticamente e a opção de acompanhar em tempo real.
                  </p>
                </div>

                <div className="p-3.5 bg-purple-50/70 border border-purple-100 rounded-2xl space-y-1">
                  <p className="font-extrabold text-purple-900 flex items-center gap-1.5 text-xs">
                    <CalendarIcon className="w-4 h-4 text-purple-700" />
                    <span>E se eu escolher "Somente Agendamento"?</span>
                  </p>
                  <p className="text-[11px] text-purple-800">
                    Caso você defina seu modo de atendimento como <strong>"Somente Horário Marcado"</strong> em Configurações, a Fila Virtual é desativada da sua Vitrine e do fluxo dos clientes. Eles só verão a agenda para marcar data e hora.
                  </p>
                </div>
              </div>

              <div className="pt-2 flex justify-end">
                <button
                  type="button"
                  onClick={() => setShowInfoModal(false)}
                  className="w-full sm:w-auto px-6 py-2.5 bg-brand-blue hover:bg-blue-700 text-white text-xs font-bold rounded-xl transition-colors cursor-pointer"
                >
                  Entendi
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
