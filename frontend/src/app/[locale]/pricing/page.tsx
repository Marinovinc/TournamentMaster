/**
 * =============================================================================
 * FILE INFO
 * =============================================================================
 * Percorso: src/app/[locale]/pricing/page.tsx
 * Creato: 2026-01-02
 * Descrizione: Pricing - Pagina piani e prezzi per organizzatori
 * =============================================================================
 */

import Link from "next/link";
import {
  Home,
  CreditCard,
  Check,
  X,
  Zap,
  Building2,
  Crown,
  HelpCircle,
  BookOpen,
  ArrowRight,
} from "lucide-react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

const plans = [
  {
    name: "Starter",
    description: "Per piccoli tornei locali",
    price: "Gratis",
    priceDetail: "per sempre",
    icon: Zap,
    highlighted: false,
    features: [
      { text: "Fino a 3 tornei/anno", included: true },
      { text: "Max 30 partecipanti/torneo", included: true },
      { text: "Classifiche in tempo reale", included: true },
      { text: "Validazione GPS base", included: true },
      { text: "Supporto email", included: true },
      { text: "Statistiche avanzate", included: false },
      { text: "Personalizzazione brand", included: false },
      { text: "API access", included: false },
    ],
    cta: "Inizia Gratis",
    ctaVariant: "outline" as const,
  },
  {
    name: "Pro",
    description: "Per associazioni e circoli",
    price: "29",
    priceDetail: "/mese",
    icon: Building2,
    highlighted: true,
    badge: "Piu popolare",
    features: [
      { text: "Tornei illimitati", included: true },
      { text: "Max 200 partecipanti/torneo", included: true },
      { text: "Classifiche in tempo reale", included: true },
      { text: "Validazione GPS avanzata", included: true },
      { text: "Supporto prioritario", included: true },
      { text: "Statistiche avanzate", included: true },
      { text: "Personalizzazione brand", included: true },
      { text: "API access", included: false },
    ],
    cta: "Prova 14 giorni gratis",
    ctaVariant: "default" as const,
  },
  {
    name: "Enterprise",
    description: "Per federazioni e grandi eventi",
    price: "Personalizzato",
    priceDetail: "contattaci",
    icon: Crown,
    highlighted: false,
    features: [
      { text: "Tornei illimitati", included: true },
      { text: "Partecipanti illimitati", included: true },
      { text: "Classifiche in tempo reale", included: true },
      { text: "Validazione multi-livello", included: true },
      { text: "Account manager dedicato", included: true },
      { text: "Statistiche avanzate", included: true },
      { text: "White-label completo", included: true },
      { text: "API access completo", included: true },
    ],
    cta: "Contattaci",
    ctaVariant: "outline" as const,
  },
];

interface FAQ {
  question: string;
  answer: string;
  link?: string;
  linkText?: string;
}

const faqs: FAQ[] = [
  {
    question: "Posso cambiare piano in qualsiasi momento?",
    answer: "Si, puoi fare upgrade o downgrade del tuo piano in qualsiasi momento. Le modifiche saranno effettive dal ciclo di fatturazione successivo.",
  },
  {
    question: "C'e un periodo di prova?",
    answer: "Il piano Pro include 14 giorni di prova gratuita. Non e richiesta carta di credito per iniziare.",
  },
  {
    question: "Come funziona il pagamento?",
    answer: "Accettiamo carte di credito, Apple Pay, Google Pay e bonifico bancario (solo per piani annuali). La fatturazione e mensile o annuale con 2 mesi gratis.",
    link: "/payments/guide",
    linkText: "Vedi Guida Tariffe Completa",
  },
  {
    question: "Cosa succede se supero i limiti del piano?",
    answer: "Ti avviseremo quando ti avvicini ai limiti. Potrai fare upgrade o completare il torneo corrente prima di dover cambiare piano.",
  },
  {
    question: "Quanto guadagna la mia associazione dalle iscrizioni?",
    answer: "La tua associazione trattiene tutto tranne EUR5 fissi per iscrizione (es. quota EUR20 = EUR15 per te). Le commissioni Stripe sono ripartite proporzionalmente.",
    link: "/payments/guide",
    linkText: "Vedi Simulazione Guadagni",
  },
];

export default async function PricingPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;

  return (
    <main className="container mx-auto px-4 py-8">
      {/* Back to Home */}
      <Link
        href={`/${locale}`}
        className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground mb-6"
      >
        <Home className="h-4 w-4" />
        Torna alla Home
      </Link>

      {/* Header */}
      <div className="text-center mb-12">
        <Badge className="mb-4 px-4 py-1.5">
          <CreditCard className="h-4 w-4 mr-2" />
          Prezzi Trasparenti
        </Badge>
        <h1 className="text-3xl md:text-5xl font-bold mb-4">
          Scegli il piano <span className="text-primary">giusto per te</span>
        </h1>
        <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
          Piani flessibili per ogni esigenza. Inizia gratis e scala quando cresci.
          Nessun costo nascosto.
        </p>
      </div>

      {/* Link alla Guida Tariffe */}
      <div className="flex justify-center mb-8">
        <Link
          href={`/${locale}/payments/guide`}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-50 border border-blue-200 text-blue-700 hover:bg-blue-100 transition-colors"
        >
          <BookOpen className="h-4 w-4" />
          <span>Vuoi sapere come funzionano tariffe, split e commissioni?</span>
          <ArrowRight className="h-4 w-4" />
        </Link>
      </div>

      {/* Pricing Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-16">
        {plans.map((plan, index) => {
          const Icon = plan.icon;
          return (
            <Card
              key={index}
              className={`relative ${
                plan.highlighted
                  ? "border-primary shadow-xl scale-105"
                  : "hover:shadow-lg"
              } transition-all`}
            >
              {plan.badge && (
                <Badge className="absolute -top-3 left-1/2 -translate-x-1/2 bg-primary">
                  {plan.badge}
                </Badge>
              )}
              <CardHeader className="text-center pt-8">
                <div className="mx-auto mb-4 p-3 rounded-full bg-primary/10 text-primary w-fit">
                  <Icon className="h-6 w-6" />
                </div>
                <CardTitle className="text-xl">{plan.name}</CardTitle>
                <CardDescription>{plan.description}</CardDescription>
                <div className="mt-4">
                  <span className="text-4xl font-bold">
                    {plan.price === "Gratis" || plan.price === "Personalizzato"
                      ? plan.price
                      : `€${plan.price}`}
                  </span>
                  <span className="text-muted-foreground ml-1">
                    {plan.priceDetail}
                  </span>
                </div>
              </CardHeader>
              <CardContent>
                <ul className="space-y-3">
                  {plan.features.map((feature, featureIndex) => (
                    <li key={featureIndex} className="flex items-center gap-2">
                      {feature.included ? (
                        <Check className="h-4 w-4 text-green-500 shrink-0" />
                      ) : (
                        <X className="h-4 w-4 text-muted-foreground shrink-0" />
                      )}
                      <span
                        className={
                          feature.included ? "" : "text-muted-foreground"
                        }
                      >
                        {feature.text}
                      </span>
                    </li>
                  ))}
                </ul>
              </CardContent>
              <CardFooter>
                <Button
                  asChild
                  className="w-full"
                  variant={plan.ctaVariant}
                  size="lg"
                >
                  <Link href={plan.name === "Enterprise"
                    ? "mailto:sales@tournamentmaster.it"
                    : `/${locale}/payments?plan=${plan.name.toLowerCase()}`
                  }>
                    {plan.cta}
                  </Link>
                </Button>
              </CardFooter>
            </Card>
          );
        })}
      </div>

      {/* FAQ Section */}
      <div className="max-w-3xl mx-auto">
        <div className="text-center mb-8">
          <h2 className="text-2xl font-bold flex items-center justify-center gap-2">
            <HelpCircle className="h-6 w-6 text-primary" />
            Domande Frequenti
          </h2>
        </div>
        <div className="space-y-4">
          {faqs.map((faq, index) => (
            <Card key={index}>
              <CardHeader className="pb-2">
                <CardTitle className="text-base font-medium">
                  {faq.question}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground text-sm">{faq.answer}</p>
                {faq.link && faq.linkText && (
                  <Link
                    href={`/${locale}${faq.link}`}
                    className="inline-flex items-center gap-1 mt-2 text-sm text-primary hover:underline font-medium"
                  >
                    {faq.linkText}
                    <ArrowRight className="h-3 w-3" />
                  </Link>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Contact CTA */}
      <div className="text-center mt-12 py-8 px-6 rounded-2xl bg-muted/50 border">
        <h2 className="text-xl font-bold mb-2">Hai altre domande?</h2>
        <p className="text-muted-foreground mb-4">
          Il nostro team e a disposizione per aiutarti a scegliere il piano migliore.
        </p>
        <Button asChild variant="outline">
          <a href="mailto:sales@tournamentmaster.it">
            Contatta il team vendite
          </a>
        </Button>
      </div>
    </main>
  );
}
