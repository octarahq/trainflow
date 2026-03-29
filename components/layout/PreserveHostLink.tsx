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
      const { protocol, hostname, port } = window.location;
      const parts = hostname.split(".");

      const isIP = /^\d+(\.\d+){3}$/.test(hostname);
      const targetHost =
        !isIP && parts.length > 2 ? parts.slice(-2).join(".") : hostname;

      const origin = `${protocol}//${targetHost}${port ? `:${port}` : ""}`;
      const path = href.startsWith("/") ? href : `/${href}`;
      const url = `${origin}${path}`;

      if (targetHost !== hostname) {
        window.location.href = url;
      } else {
        router.push(url);
      }
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
