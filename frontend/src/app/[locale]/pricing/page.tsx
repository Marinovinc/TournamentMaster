/**
 * =============================================================================
 * FILE INFO
 * =============================================================================
 * Percorso: src/app/[locale]/pricing/page.tsx
 * Creato: 2026-01-02
 * Aggiornato: 2026-01-05 - Convertito a pagina dinamica con fetch da API CMS
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
  LucideIcon,
} from "lucide-react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

// Icon mapping from string to Lucide component
const iconMap: Record<string, LucideIcon> = {
  Zap,
  Building2,
  Crown,
};

// Types for API data
interface PlanFeature {
  id: string;
  text: string;
  included: boolean;
}

interface PricingPlan {
  id: string;
  name: string;
  description: string;
  price: string;
  priceDetail: string;
  icon: string;
  highlighted: boolean;
  badge: string | null;
  cta: string;
  ctaVariant: string;
  ctaLink: string | null;
  features: PlanFeature[];
}

interface FAQ {
  id: string;
  question: string;
  answer: string;
  link: string | null;
  linkText: string | null;
}

// Fetch pricing data from CMS API
async function getPricingData(locale: string): Promise<{ plans: PricingPlan[]; faqs: FAQ[] }> {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

  try {
    const [plansRes, faqsRes] = await Promise.all([
      fetch(`${apiUrl}/api/cms/pricing-plans?locale=${locale}`, {
        next: { revalidate: 60 },
      }),
      fetch(`${apiUrl}/api/cms/faqs?locale=${locale}&category=pricing`, {
        next: { revalidate: 60 },
      }),
    ]);

    const plansData = plansRes.ok ? await plansRes.json() : { success: false };
    const faqsData = faqsRes.ok ? await faqsRes.json() : { success: false };

    return {
      plans: plansData.success ? plansData.data : [],
      faqs: faqsData.success ? faqsData.data : [],
    };
  } catch (error) {
    console.error("Error fetching pricing data:", error);
    return { plans: [], faqs: [] };
  }
}

export default async function PricingPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const { plans, faqs } = await getPricingData(locale);

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
        {plans.map((plan) => {
          const Icon = iconMap[plan.icon] || Zap;
          const ctaVariant = plan.ctaVariant === "default" ? "default" : "outline";
          return (
            <Card
              key={plan.id}
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
                      : `\u20AC${plan.price}`}
                  </span>
                  <span className="text-muted-foreground ml-1">
                    {plan.priceDetail}
                  </span>
                </div>
              </CardHeader>
              <CardContent>
                <ul className="space-y-3">
                  {plan.features.map((feature) => (
                    <li key={feature.id} className="flex items-center gap-2">
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
                  variant={ctaVariant}
                  size="lg"
                >
                  <Link href={plan.ctaLink || (plan.name === "Enterprise"
                    ? "mailto:sales@tournamentmaster.it"
                    : `/${locale}/payments?plan=${plan.name.toLowerCase()}`
                  )}>
                    {plan.cta}
                  </Link>
                </Button>
              </CardFooter>
            </Card>
          );
        })}
      </div>

      {/* Empty state for plans */}
      {plans.length === 0 && (
        <div className="text-center py-12 text-muted-foreground mb-16">
          <p>Nessun piano disponibile al momento.</p>
        </div>
      )}

      {/* FAQ Section */}
      <div className="max-w-3xl mx-auto">
        <div className="text-center mb-8">
          <h2 className="text-2xl font-bold flex items-center justify-center gap-2">
            <HelpCircle className="h-6 w-6 text-primary" />
            Domande Frequenti
          </h2>
        </div>
        <div className="space-y-4">
          {faqs.map((faq) => (
            <Card key={faq.id}>
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
