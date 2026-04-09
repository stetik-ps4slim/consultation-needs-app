import type { AnchorHTMLAttributes, ButtonHTMLAttributes, ReactNode } from "react";

type SharedProps = {
  children: ReactNode;
  className?: string;
};

type ButtonProps = SharedProps & ButtonHTMLAttributes<HTMLButtonElement> & { href?: never };
type LinkProps = SharedProps & AnchorHTMLAttributes<HTMLAnchorElement> & { href: string };

const baseClassName =
  "inline-flex items-center justify-center rounded-full border border-accent bg-accent px-6 py-3 text-sm font-semibold uppercase tracking-[0.18em] text-canvas transition hover:-translate-y-0.5 hover:bg-[#e0b780] disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:translate-y-0 disabled:hover:bg-accent";

export function Button(props: ButtonProps | LinkProps) {
  if ("href" in props) {
    const { children, className = "", href, ...rest } = props as LinkProps;

    return (
      <a href={href} className={`${baseClassName} ${className}`.trim()} {...rest}>
        {children}
      </a>
    );
  }

  const { children, className = "", type = "button", ...rest } = props as ButtonProps;

  return (
    <button type={type} className={`${baseClassName} ${className}`.trim()} {...rest}>
      {children}
    </button>
  );
}
