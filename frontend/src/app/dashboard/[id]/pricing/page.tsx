import { PricingPlans } from "@/components/pricing-plans"
import { FeaturesGrid } from "@/app/dashboard/[id]/pricing/components/features-grid"
import { FAQSection } from "@/app/dashboard/[id]/pricing/components/faq-section"

// Import data
import { features as featuresData } from "@/app/dashboard/[id]/pricing/data/features"
import faqsData from "@/app/dashboard/[id]/pricing/data/faqs.json"

export default function PricingPage() {
  return (
    <div className="px-4 lg:px-6">
      {/* Pricing Cards */}
      <section className="pb-12" id="pricing">
        <PricingPlans mode="pricing" />
      </section>

      {/* Features Section */}
      <FeaturesGrid features={featuresData} />

      {/* FAQ Section */}
      <FAQSection faqs={faqsData} />
    </div>
  )
}
