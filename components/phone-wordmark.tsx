import Image from "next/image";

export function PhoneWordmark() {
  return (
    <div className="px-4 pt-6 md:hidden">
      <Image
        src="/wilderness-farms-wordmark.jpg"
        alt="Wilderness Farms, Ponte Vedra Beach, Florida"
        width={2172}
        height={724}
        priority
        className="mx-auto h-auto w-full"
      />
    </div>
  );
}
