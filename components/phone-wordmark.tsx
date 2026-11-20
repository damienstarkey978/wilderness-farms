import Image from "next/image";

export function PhoneWordmark() {
  return (
    <div className="w-full pt-2 md:hidden">
      <Image
        src="/wilderness-farms-wordmark.jpg"
        alt="Wilderness Farms, Ponte Vedra Beach, Florida"
        width={2172}
        height={724}
        priority
        unoptimized
        className="block h-auto w-full max-w-none object-contain"
      />
    </div>
  );
}
