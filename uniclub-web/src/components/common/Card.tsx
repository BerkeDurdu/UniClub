import type { PropsWithChildren } from "react";

interface CardProps {
  className?: string;
}

function Card({ children, className = "" }: PropsWithChildren<CardProps>) {
  return (
    <article
      className={`rounded-2xl border border-slate/20 bg-white/90 p-5 shadow-sm backdrop-blur ${className}`}
    >
      {children}
    </article>
  );
}

export default Card;
