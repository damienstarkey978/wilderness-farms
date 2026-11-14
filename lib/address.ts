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
      note: "Regular Ponte Vedra is not on the first route. You can still sign up, and we'll alert you when we serve your area.",
    };
  }

  return {
    flag: "outside",
    note: "You can still sign up. We'll alert you when we serve your area.",
  };
}
