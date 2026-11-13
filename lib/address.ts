export type AddressFlag = "in_area" | "nearby_undecided" | "outside";

export function classifyAddress(address: string): { flag: AddressFlag; note: string } {
  const n = address
    .toLowerCase()
    .replace(/[.,#]/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  const beach =
    /\bponte\s+vedra\s+beach\b/.test(n) ||
    /\bponte\s+vedra\s+bch\b/.test(n) ||
    /\bpvb\b/.test(n) ||
    /\b32082\b/.test(n);

  if (beach) {
    return {
      flag: "in_area",
      note: "Ponte Vedra Beach is where we deliver.",
    };
  }

  const ponte = /\bponte\s+vedra\b/.test(n) || /\b32081\b/.test(n);
  if (ponte) {
    return {
      flag: "nearby_undecided",
      note: "Regular Ponte Vedra is not decided yet. We'll keep this address and flag it. Delivery there is not a yes, and it is not a no.",
    };
  }

  return {
    flag: "outside",
    note: "This address does not look like Ponte Vedra Beach. We'll keep it and flag it. We are not delivering there yet.",
  };
}
