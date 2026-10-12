import Image from "next/image";
import Link from "next/link";

export function Logo({ size = "header" }: { size?: "header" | "hero" }) {
  const className = size === "hero" ? "h-28 w-28" : "h-14 w-14";
  return (
    <Link href="/" aria-label="পথিক" className="inline-flex shrink-0 items-center">
      <Image
        src="/pothik-logo.png"
        alt="পথিক"
        width={500}
        height={500}
        priority
        className={className}
      />
    </Link>
  );
}
