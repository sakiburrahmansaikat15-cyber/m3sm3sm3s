import { Suspense } from "react";
import { loadSettings } from "@/server/content";
import PageHeader from "@/components/admin/PageHeader";
import Tabs from "@/components/admin/Tabs";
import {
  ArgumentEditor,
  BenefitsEditor,
  CarouselEditor,
  FaqEditor,
  JoinEditor,
  PosesEditor,
  ProfileEditor,
  RangeEditor,
  SectionsEditor,
} from "@/components/admin/editors";

export const metadata = { title: "Homepage" };

const TABS = [
  { id: "layout", label: "Layout & order" },
  { id: "carousel", label: "Carousel" },
  { id: "profile", label: "Close-up" },
  { id: "benefits", label: "Benefits" },
  { id: "argument", label: "Slogan" },
  { id: "range", label: "Range" },
  { id: "faq", label: "FAQ" },
  { id: "join", label: "Newsletter" },
  { id: "poses", label: "3D poses" },
];

export default async function HomepageAdmin({ searchParams }: { searchParams: Promise<{ tab?: string }> }) {
  const { tab = "layout" } = await searchParams;
  const s = await loadSettings();
  return (
    <>
      <PageHeader title="Homepage" desc="Every section of the 3D homepage. Products, colours and prints are edited under Products." />
      <Suspense>
        <Tabs tabs={TABS} base="/admin/homepage" />
      </Suspense>
      {tab === "layout" && <SectionsEditor key="sections" initial={s.sections} />}
      {tab === "carousel" && <CarouselEditor key="carousel" initial={s.carousel} />}
      {tab === "profile" && <ProfileEditor key="profile" initial={s.profile} />}
      {tab === "benefits" && <BenefitsEditor key="benefits" initial={s.benefits} />}
      {tab === "argument" && <ArgumentEditor key="argument" initial={s.argument} />}
      {tab === "range" && <RangeEditor key="range" initial={s.range} />}
      {tab === "faq" && <FaqEditor key="faq" initial={s.faq} />}
      {tab === "join" && <JoinEditor key="join" initial={s.join} />}
      {tab === "poses" && <PosesEditor key="poses" initial={s.poses} />}
    </>
  );
}
