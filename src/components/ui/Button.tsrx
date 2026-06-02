import { track, type Children } from "ripple";

interface ButtonProps {
  variant?: "primary" | "secondary";
  class?: string;
  children?: Children | Children[];
  [key: string]: unknown;
}

export function Button(&{
  variant,
  class: className,
  children,
  ...rest
}: ButtonProps) {
  let &[baseClass] = track(
    () => variant === "primary"
      ? "inline-flex w-full items-center justify-center border-3 border-black px-5 py-4 text-base font-bold uppercase tracking-wider neo-shadow-hover cursor-pointer"
      : "inline-flex w-full items-center justify-center border-2 border-black px-4 py-2.5 text-xs font-bold uppercase tracking-wide neo-shadow-hover cursor-pointer",
  );

  return <button class={[baseClass, className]} {...rest}>
    {children}
  </button>;
}
