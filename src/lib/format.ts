export const taka = (n: number) => `৳${n.toLocaleString("en-US")}`;

export const cx = (...c: (string | false | null | undefined)[]) => c.filter(Boolean).join(" ");
