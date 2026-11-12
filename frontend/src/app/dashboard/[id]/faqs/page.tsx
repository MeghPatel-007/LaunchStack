import { FAQList } from "@/app/dashboard/[id]/faqs/components/faq-list"
import { FeaturesGrid } from "@/app/dashboard/[id]/faqs/components/features-grid"

// Import data
import categoriesData from "@/app/dashboard/[id]/faqs/data/categories.json"
import faqsData from "@/app/dashboard/[id]/faqs/data/faqs.json"
import { features as featuresData } from "@/app/dashboard/[id]/faqs/data/features"

export default function FAQsPage() {
  return (
    <div className="px-4 lg:px-6">
      <FAQList faqs={faqsData} categories={categoriesData} />
      <FeaturesGrid features={featuresData} />
    </div>
  )
}
