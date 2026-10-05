import { getSiteData } from "@/server/content";
import type { SectionId } from "@/lib/types";
import Loader from "@/components/home/Loader";
import Backdrop from "@/components/home/Backdrop";
import StageCanvas from "@/components/home/StageCanvas";
import Choreography from "@/components/home/Choreography";
import {
  ArgumentSection,
  BenefitSections,
  CarouselSection,
  FAQSection,
  IconNav,
  JoinSection,
  LastSection,
  ProfileSection,
  RangeSection,
} from "@/components/home/Sections";

const SECTION_COMPONENTS: Record<SectionId, () => React.ReactNode> = {
  carousel: CarouselSection,
  profile: ProfileSection,
  benefits: BenefitSections,
  argument: ArgumentSection,
  range: RangeSection,
  faq: FAQSection,
  last: LastSection,
  join: JoinSection,
};

/**
 * Homepage — one fixed 3D stage + fixed backdrop, with scroll sections on top.
 * Order and visibility come from Admin → Sections.
 */
export default async function HomePage() {
  const { settings, products } = await getSiteData();
  const sections = settings.sections.filter((s) => s.enabled && SECTION_COMPONENTS[s.id]);

  if (!products.length) {
    return (
      <section className="grid min-h-svh place-items-center px-6 text-center">
        <div>
          <h1 className="display text-5xl">Coming soon</h1>
          <p className="mt-4 text-white/60">Add your first product in the admin panel.</p>
        </div>
      </section>
    );
  }

  return (
    <div className="home text-white">
      <Loader />
      <Backdrop />
      <StageCanvas />
      {sections.some((s) => s.id === "benefits") && <IconNav />}
      {sections.map((s) => {
        const C = SECTION_COMPONENTS[s.id];
        return <C key={s.id} />;
      })}
      <Choreography />
    </div>
  );
}
