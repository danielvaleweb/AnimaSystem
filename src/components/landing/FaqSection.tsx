import { useState } from 'react';
import { ChevronDown, HelpCircle, Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export function FaqSection() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  const faqs = [
    {
      question: 'O que é a plataforma e o que significa ser "AI First"?',
      answer: 'Significa que a Inteligência Artificial não é apenas um plugin isolado ou um chatbot genérico. Na nossa plataforma, a IA é uma camada viva sobre toda a operação: ela atende no WhatsApp 24/7, qualifica contatos, resume áudios, escreve cópias de vendas, melhora imagens e conecta tudo em tempo real ao CRM e ao ERP.',
    },
    {
      question: 'O que é a LYA e como ela atua no WhatsApp?',
      answer: 'A LYA é o ecossistema de agentes inteligentes da plataforma. O módulo LYA SDR atende clientes 24 horas por dia no WhatsApp, responde dúvidas sobre produtos ou imóveis, coleta informações de orçamento e urgência, e agenda reuniões ou visitas diretamente no calendário do seu time.',
    },
    {
      question: 'A IA substitui corretores ou o time de atendimento?',
      answer: 'Não. A IA atua como uma assistente de alta produtividade (SDR/BDR). Ela assume o primeiro contato em segundos, elimina tarefas repetitivas e entrega o lead pronto, qualificado e aquecido para que seus consultores foquem no relacionamento humano, na negociação e no fechamento do contrato.',
    },
    {
      question: 'O que é o LYA Omnichannel e como funciona a transcrição de áudios?',
      answer: 'O LYA Omnichannel centraliza todos os atendimentos do time em um único número oficial de WhatsApp. Áudios longos enviados pelos clientes são transcritos instantaneamente para texto e resumidos em tópicos no perfil do cliente no CRM, economizando tempo de toda a equipe.',
    },
    {
      question: 'O que é o LYA Editor e o LYA Studio?',
      answer: 'O LYA Editor gera descrições atraentes e ricas em técnicas de persuasão e SEO para seus produtos ou imóveis em 2 segundos. O LYA Studio aplica Virtual Staging em fotos (mobiliando espaços vazios digitalmente) e corrige iluminação e cores sem custo de produção fotográfica.',
    },
    {
      question: 'Como funciona a cobrança da IA (Koins)?',
      answer: 'A IA funciona através de um saldo unificado de Koins. Cada atendimento no WhatsApp, texto gerado ou imagem tratada consome uma quantidade específica de Koins. Você tem total controle do uso, sem custos ocultos ou faturas surpresa no final do mês.',
    },
    {
      question: 'Como é a segurança dos dados e a infraestrutura na nuvem?',
      answer: 'Operamos sobre o núcleo blindado do Google Cloud Platform (GCP) com criptografia ponta a ponta (SSL/TLS), isolamento absoluto de dados, backups diários automáticos e garantia de 99.9% de disponibilidade (SLA). Seus dados pertencem exclusivamente a você.',
    },
    {
      question: 'Posso migrar meus clientes e cadastros de outro sistema?',
      answer: 'Sim! Nosso processo de onboarding conta com especialistas e ferramentas de importação em lote para trazer sua carteira de clientes, produtos e histórico com facilidade e segurança.',
    },
  ];

  return (
    <section id="faq" className="py-20 sm:py-28 bg-[#F8F9FA] border-b border-zinc-200/80">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Header */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 bg-white border border-zinc-200 text-zinc-800 text-xs font-bold px-3.5 py-1.5 rounded-full uppercase tracking-wider mb-4 shadow-xs">
            <span className="w-2 h-2 rounded-full bg-[#D7FE03] ring-2 ring-zinc-300" />
            <span>DÚVIDAS FREQUENTES</span>
          </div>
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-black text-black tracking-tight">
            Respostas diretas para um movimento novo no mercado
          </h2>
          <p className="mt-3 text-base text-zinc-600">
            Tudo o que você precisa saber sobre a arquitetura AI First, ferramentas e segurança.
          </p>
        </div>

        {/* Accordion List */}
        <div className="space-y-3.5">
          {faqs.map((faq, idx) => {
            const isOpen = openIndex === idx;
            return (
              <div
                key={idx}
                className="bg-white rounded-3xl border border-zinc-200/90 shadow-2xs overflow-hidden transition-all"
              >
                <button
                  onClick={() => setOpenIndex(isOpen ? null : idx)}
                  className="w-full p-5 sm:p-6 text-left flex items-center justify-between gap-4 cursor-pointer hover:bg-zinc-50/70 transition-colors"
                >
                  <span className="text-sm sm:text-base font-black text-black leading-snug">
                    {faq.question}
                  </span>
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 transition-transform duration-200 ${
                    isOpen ? 'bg-black text-[#D7FE03] rotate-180' : 'bg-zinc-100 text-zinc-700'
                  }`}>
                    <ChevronDown className="w-4 h-4" />
                  </div>
                </button>

                <AnimatePresence>
                  {isOpen && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.25 }}
                    >
                      <div className="px-5 sm:px-6 pb-6 text-xs sm:text-sm text-zinc-600 leading-relaxed border-t border-zinc-100 pt-4">
                        {faq.answer}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}
        </div>

      </div>
    </section>
  );
}
