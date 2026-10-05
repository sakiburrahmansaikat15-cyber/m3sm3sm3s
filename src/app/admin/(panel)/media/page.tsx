import PageHeader from "@/components/admin/PageHeader";
import MediaLibrary from "@/components/admin/MediaLibrary";

export const metadata = { title: "Media library" };

export default function MediaPage() {
  return (
    <>
      <PageHeader title="Media library" desc="Upload .glb models, .svg prints and images. Click a file to copy its URL." />
      <MediaLibrary />
    </>
  );
}
