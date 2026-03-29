"use client";

import React from "react";
import { useRouter } from "next/navigation";

type Props = {
  href: string;
  children: React.ReactNode;
  className?: string;
};

export default function PreserveHostLink({ href, children, className }: Props) {
  const router = useRouter();

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    if (typeof window !== "undefined") {
      const origin = window.location.origin;
      const path = href.startsWith("/") ? href : `/${href}`;
      const url = `${origin}${path}`;
      router.push(url);
    } else {
      router.push(href);
    }
  };

  return (
    <a href={href} onClick={handleClick} className={className}>
      {children}
    </a>
  );
}
