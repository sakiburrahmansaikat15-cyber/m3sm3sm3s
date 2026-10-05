import type { Metadata } from "next";
import ShopClient from "./ShopClient";

export const metadata: Metadata = {
  title: "Shop all tees",
  description: "Every M3S drop in one place — heavyweight graphic, minimal and oversized tees.",
};

export default function ShopPage() {
  return <ShopClient />;
}
