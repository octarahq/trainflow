import React from "react";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { useTranslations } from "next-intl";

export default function CommingSoonPage() {
  const t = useTranslations("commingSoon");

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground">
      <Navbar />

      <main className="flex-1 flex items-center justify-center px-4 py-24">
        <section className="relative mb-24 text-center max-w-3xl">
          <h1 className="font-headline text-5xl md:text-7xl font-bold tracking-tighter text-on-surface mb-6 max-w-4xl mx-auto leading-none">
            {t("title")}{" "}
            <span className="bg-primary bg-clip-text text-transparent">
              {t("titleAccent")}
            </span>
            .
          </h1>

          <p className="text-on-surface-variant text-lg md:text-xl max-w-2xl mx-auto mb-12 font-light">
            {t("description")}
          </p>
        </section>
      </main>

      <Footer />
    </div>
  );
}
