import Link from "next/link";

export default function NotFound() {
  return (
    <section className="grid min-h-svh place-items-center bg-accent px-4 text-center">
      <div>
        <p className="display text-[40vw] leading-none md:text-[24vw]">404</p>
        <p className="text-lg font-semibold">This drop doesn&apos;t exist (yet).</p>
        <Link href="/shop" className="btn btn-ink mt-6">
          Back to the shop
        </Link>
      </div>
    </section>
  );
}
