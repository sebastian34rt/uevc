import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { MessageSquare, X, Send, Bot, User } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useSiteContent } from '../context/SiteContentContext';

interface Message {
  id: string;
  text: string;
  sender: 'bot' | 'user';
}

export default function Chatbot() {
  const { t, i18n } = useTranslation();
  const { content } = useSiteContent();
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      text: t('chatbot.welcome'),
      sender: 'bot',
    }
  ]);
  const [inputValue, setInputValue] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Update initial message when language changes if no conversation happened
  useEffect(() => {
    setMessages(prev => {
      if (prev.length === 1 && prev[0].sender === 'bot') {
        return [{ id: '1', text: t('chatbot.welcome'), sender: 'bot' }];
      }
      return prev;
    });
  }, [i18n.language, t]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isOpen]);

  const getBotResponse = (input: string) => {
    const isEn = i18n.language === 'en';
    const lowerInput = input.toLowerCase();
    
    if (lowerInput.match(/(admision|admission|enroll|inscripcion|matricular|requisito)/)) {
      return isEn
        ? `For admissions information, please visit our Admissions section to fill out the enrollment form, or visit our office from ${content.contactSchedule || '8:00 AM to 5:00 PM'}.`
        : `Para información sobre admisiones, por favor visita la sección de Contacto y llena el formulario de inscripción, o acércate a nuestra secretaría en el horario de ${content.contactSchedule || '8:00 AM a 5:00 PM'}.`;
    }
    if (lowerInput.match(/(horario|schedule|hora|hours)/)) {
      return isEn
        ? `Our administrative office hours are ${content.contactSchedule || 'Monday through Friday, 8:00 AM to 5:00 PM'}.`
        : `Nuestro horario de atención en secretaría es ${content.contactSchedule || 'de Lunes a Viernes de 8:00 AM a 5:00 PM'}.`;
    }
    if (lowerInput.match(/(costo|tuition|pension|mensualidad|precio|valor|fee)/)) {
      return isEn
        ? 'Tuition fees vary by educational stage. We recommend contacting us or filling out the inquiry form so our admissions team can provide details.'
        : 'Los costos varían según el nivel educativo. Te recomendamos llenar el formulario de contacto para que nuestro equipo te brinde la información detallada.';
    }
    if (lowerInput.match(/(ubicacion|direccion|location|address|donde|llegar)/)) {
      return isEn
        ? `We are located at: ${content.contactAddress || 'Cantón Salinas, Santa Elena Province, Ecuador'}.`
        : `Nos encontramos en: ${content.contactAddress || 'Cantón Salinas, Provincia de Santa Elena, Ecuador'}.`;
    }
    if (lowerInput.match(/(telefono|phone|contacto|whatsapp|celular|llamar|contact)/)) {
      return isEn
        ? `You can reach our office directly via phone or WhatsApp at: ${content.contactPhone || '0981179375'}.`
        : `Puedes comunicarte con nosotros directamente al teléfono / WhatsApp: ${content.contactPhone || '0981179375'}.`;
    }
    if (lowerInput.match(/(hola|hello|hi|buenos|buenas|saludos|greeting)/)) {
      return isEn
        ? `Hello! Welcome to ${content.institutionName || 'Unidad Educativa Virgen del Cisne'}. How can we assist you today?`
        : `¡Hola! Bienvenido a la ${content.institutionName || 'Unidad Educativa Virgen del Cisne'}. ¿En qué podemos ayudarte hoy?`;
    }

    return isEn
      ? `Thank you for your message. For personalized support, please leave your inquiry in our Contact section or call us at ${content.contactPhone || '0981179375'}.`
      : 'Gracias por tu mensaje. Para brindarte una mejor atención personalizada, por favor déjanos tus datos en la sección de Contacto o comunícate al ' + (content.contactPhone || '0981179375') + '.';
  };

  const sendQuestion = (question: string) => {
    const newUserMsg: Message = {
      id: Date.now().toString(),
      text: question,
      sender: 'user',
    };

    setMessages(prev => [...prev, newUserMsg]);

    setTimeout(() => {
      const newBotMsg: Message = {
        id: (Date.now() + 1).toString(),
        text: getBotResponse(question),
        sender: 'bot',
      };
      setMessages(prev => [...prev, newBotMsg]);
    }, 600);
  };

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim()) return;
    const text = inputValue.trim();
    setInputValue('');
    sendQuestion(text);
  };

  const quickQuestions = i18n.language === 'en'
    ? [
        { label: 'Admissions', query: 'What are the admission requirements?' },
        { label: 'Schedule', query: 'What are the office hours?' },
        { label: 'Location', query: 'Where is the school located?' },
        { label: 'WhatsApp', query: 'What is the WhatsApp number?' },
      ]
    : [
        { label: '¿Admisiones?', query: '¿Cuáles son los requisitos de admisión?' },
        { label: '¿Horarios?', query: '¿Cuál es el horario de atención?' },
        { label: '¿Ubicación?', query: '¿Dónde está ubicada la institución?' },
        { label: '¿WhatsApp?', query: '¿Cuál es el número de WhatsApp?' },
      ];

  return (
    <>
      {/* Botón flotante */}
      <motion.button
        onClick={() => setIsOpen(true)}
        className={`fixed bottom-6 right-6 z-50 bg-primario text-white p-4 rounded-full shadow-lg hover:shadow-xl hover:scale-110 transition-all flex items-center justify-center group ${isOpen ? 'hidden' : 'flex'}`}
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: "spring", stiffness: 260, damping: 20, delay: 1 }}
        aria-label={t('chatbot.botName')}
      >
        <MessageSquare className="w-7 h-7" />
        <div className="absolute right-full mr-4 bg-white text-texto px-4 py-2 rounded-xl text-sm font-medium shadow-md opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
          {t('chatbot.botName')}
        </div>
      </motion.button>

      {/* Ventana de Chat */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 50, scale: 0.9 }}
            transition={{ type: "spring", stiffness: 300, damping: 25 }}
            className="fixed bottom-6 right-6 z-50 w-[350px] sm:w-[400px] h-[500px] max-h-[80vh] bg-white rounded-2xl shadow-2xl border border-primario/10 flex flex-col overflow-hidden"
          >
            <div className="bg-primario text-white p-4 flex items-center justify-between shadow-md z-10">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
                  <Bot className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-bold text-sm">{t('chatbot.botName')}</h3>
                  <p className="text-[11px] text-white/80 flex items-center gap-1">
                    <span className="w-2 h-2 bg-green-400 rounded-full inline-block"></span> {t('chatbot.botStatus')}
                  </p>
                </div>
              </div>
              <button 
                onClick={() => setIsOpen(false)}
                title={t('chatbot.close')}
                className="text-white/80 hover:text-white hover:bg-white/10 p-2 rounded-full transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 bg-primario/5 space-y-4">
              {messages.map((msg) => (
                <motion.div 
                  key={msg.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`flex items-end gap-2 ${msg.sender === 'user' ? 'flex-row-reverse' : 'flex-row'}`}
                >
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${msg.sender === 'user' ? 'bg-alerta/20 text-alerta' : 'bg-primario/20 text-primario'}`}>
                    {msg.sender === 'user' ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
                  </div>
                  <div 
                    className={`max-w-[75%] px-4 py-3 text-sm shadow-sm ${
                      msg.sender === 'user' 
                        ? 'bg-alerta text-white rounded-2xl rounded-br-sm' 
                        : 'bg-white text-texto rounded-2xl rounded-bl-sm border border-primario/10'
                    }`}
                  >
                    {msg.text}
                  </div>
                </motion.div>
              ))}
              <div ref={messagesEndRef} />
            </div>

            <div className="px-3 py-2 bg-neutral-50/80 border-t border-primario/10 overflow-x-auto flex gap-2 hide-scrollbar">
              {quickQuestions.map((q) => (
                <button
                  key={q.label}
                  type="button"
                  onClick={() => sendQuestion(q.query)}
                  className="px-3 py-1 rounded-full bg-white hover:bg-primario hover:text-white text-primario text-xs font-semibold border border-primario/20 transition-all shrink-0 shadow-2xs cursor-pointer"
                >
                  {q.label}
                </button>
              ))}
            </div>

            <form onSubmit={handleSendMessage} className="p-3 bg-white border-t border-primario/10 flex items-center gap-2">
              <input
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                placeholder={t('chatbot.placeholder')}
                className="flex-1 px-4 py-2.5 bg-neutral-50 border border-primario/20 rounded-full text-sm outline-none focus:ring-2 focus:ring-primario/20 focus:border-primario transition-all"
              />
              <button
                type="submit"
                disabled={!inputValue.trim()}
                title={t('chatbot.send')}
                className="w-10 h-10 bg-primario text-white rounded-full flex items-center justify-center shrink-0 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-primario/90 transition-colors shadow-sm cursor-pointer"
              >
                <Send className="w-4 h-4 ml-0.5" />
              </button>
            </form>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
