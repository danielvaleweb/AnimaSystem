import { Coins, CheckCircle, ArrowRight, ShieldCheck, Zap } from 'lucide-react';
import { motion } from 'motion/react';

interface KoinsPricingBannerProps {
  onOpenDemoModal: () => void;
}

export function KoinsPricingBanner({ onOpenDemoModal }: KoinsPricingBannerProps) {
  return (
    <section className="py-16 sm:py-20 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        <div className="rounded-3xl bg-gradient-to-r from-emerald-700 via-emerald-600 to-teal-700 text-white p-8 sm:p-12 lg:p-14 shadow-2xl relative overflow-hidden">
          {/* Subtle Ambient Shapes */}
          <div className="absolute top-0 right-0 w-96 h-96 bg-white/10 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute bottom-0 left-0 w-96 h-96 bg-emerald-950/40 rounded-full blur-2xl pointer-events-none" />

          <div className="relative z-10 max-w-4xl">
            
            <div className="inline-flex items-center gap-2 bg-white/15 backdrop-blur-md border border-white/20 px-3.5 py-1 rounded-full text-xs font-semibold text-white uppercase tracking-wider mb-6">
              <Coins className="w-3.5 h-3.5" />
              <span>TRANSPARÊNCIA E CONTROLE TOTAL</span>
            </div>

            <h2 className="text-3xl sm:text-4xl md:text-5xl font-black tracking-tight leading-tight">
              A IA da plataforma com uso simples, flexível e transparente.
            </h2>

            <p className="mt-4 text-base sm:text-lg text-emerald-100 max-w-2xl leading-relaxed">
              Esqueça assinaturas individuais para cada ferramenta de IA. Você abastece um saldo unificado de Koins e consome conforme a demanda real do seu negócio.
            </p>

            {/* 3 Translucent White Pills Grid */}
            <div className="mt-10 grid grid-cols-1 md:grid-cols-3 gap-4">
              
              <div className="bg-white/10 backdrop-blur-md border border-white/15 rounded-2xl p-5 hover:bg-white/15 transition-all">
                <div className="text-lg font-bold text-white mb-1 flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-emerald-300 shrink-0" />
                  <span>Saldo Unificado</span>
                </div>
                <p className="text-xs text-emerald-100 leading-relaxed">
                  Os créditos funcionam tanto para o WhatsApp 24/7 quanto para redação de anúncios e edição de imagens.
                </p>
              </div>

              <div className="bg-white/10 backdrop-blur-md border border-white/15 rounded-2xl p-5 hover:bg-white/15 transition-all">
                <div className="text-lg font-bold text-white mb-1 flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-emerald-300 shrink-0" />
                  <span>Consumo Claro</span>
                </div>
                <p className="text-xs text-emerald-100 leading-relaxed">
                  Extrato detalhado em tempo real: você acompanha exatamente onde cada Koin foi investido na sua operação.
                </p>
              </div>

              <div className="bg-white/10 backdrop-blur-md border border-white/15 rounded-2xl p-5 hover:bg-white/15 transition-all">
                <div className="text-lg font-bold text-white mb-1 flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-emerald-300 shrink-0" />
                  <span>Previsibilidade</span>
                </div>
                <p className="text-xs text-emerald-100 leading-relaxed">
                  Sem faturas surpresa no cartão de crédito. Você define o teto e tem 100% de controle sobre os custos.
                </p>
              </div>

            </div>

            {/* CTA Button */}
            <div className="mt-10">
              <button
                onClick={onOpenDemoModal}
                className="inline-flex items-center gap-2 px-7 py-3.5 rounded-full text-xs sm:text-sm font-bold uppercase tracking-wider bg-white text-emerald-950 hover:bg-emerald-50 shadow-lg hover:shadow-xl transition-all cursor-pointer group"
              >
                <span>Entender como funcionam as Koins</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </button>
            </div>

          </div>
        </div>

      </div>
    </section>
  );
}
