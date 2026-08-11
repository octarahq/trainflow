import Image from "next/image";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import Link from "next/link";
import PreserveHostLink from "@/components/layout/PreserveHostLink";
import HeroSearch from "./_components/HeroSearch";
import { useTranslations } from "next-intl";

export default function LandingPage() {
  const t = useTranslations("home");
  const tDownload = useTranslations("download");

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground">
      <Navbar />

      <main className="flex-1">
        <section className="relative pt-16 pb-32 overflow-hidden bg-hero-gradient">
          <div className="absolute top-0 right-0 -mr-20 -mt-20 w-96 h-96 bg-white/5 rounded-full blur-3xl" />
          <div className="absolute bottom-0 left-0 -ml-20 -mb-20 w-96 h-96 bg-black/20 rounded-full blur-3xl" />

          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
            <div className="text-center max-w-3xl mx-auto mb-12">
              <h1 className="text-5xl md:text-7xl font-extrabold text-white mb-6 leading-tight">
                {t("hero.title")}
                <span className="text-primary italic">
                  {" "}
                  {t("hero.titleAccent")}
                </span>
              </h1>
              <p className="text-xl text-zinc-400 leading-relaxed">
                {t("hero.description")}
              </p>
            </div>

            <HeroSearch />
          </div>
        </section>

        <section
          className="py-24 bg-background"
          data-purpose="features-overview"
        >
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="bg-background/70 p-10 rounded-3xl shadow-sm border border-white/5 hover:border-white/20 transition-all group">
                <div className="w-14 h-14 bg-primary/10 text-primary rounded-2xl flex items-center justify-center mb-6 group-hover:bg-primary group-hover:text-white transition-colors">
                  <svg
                    className="w-8 h-8"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                    />
                  </svg>
                </div>
                <h3 className="text-2xl font-bold mb-4 text-white">
                  {t("features.realtime.title")}
                </h3>
                <p className="text-zinc-400 leading-relaxed">
                  {t("features.realtime.description")}
                </p>
              </div>

              <div className="bg-background/70 p-10 rounded-3xl shadow-sm border border-white/5 hover:border-white/20 transition-all group">
                <div className="w-14 h-14 bg-primary/10 text-primary rounded-2xl flex items-center justify-center mb-6 group-hover:bg-primary group-hover:text-white transition-colors">
                  <svg
                    className="w-8 h-8"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                    />
                  </svg>
                </div>
                <h3 className="text-2xl font-bold mb-4 text-white">
                  {t("features.stats.title")}
                </h3>
                <p className="text-zinc-400 leading-relaxed">
                  {t("features.stats.description")}
                </p>
              </div>

              <div className="bg-background/70 p-10 rounded-3xl shadow-sm border border-white/5 hover:border-white/20 transition-all group">
                <div className="w-14 h-14 bg-primary/10 text-primary rounded-2xl flex items-center justify-center mb-6 group-hover:bg-primary group-hover:text-white transition-colors">
                  <svg
                    className="w-8 h-8"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                    />
                  </svg>
                </div>
                <h3 className="text-2xl font-bold mb-4 text-white">
                  {t("features.alerts.title")}
                </h3>
                <p className="text-zinc-400 leading-relaxed">
                  {t("features.alerts.description")}
                </p>
              </div>
            </div>
          </div>
        </section>

        <section className="py-20 bg-background border-t border-white/5 relative overflow-hidden">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="bg-gradient-to-r from-primary/20 via-background/90 to-blue-600/20 border border-primary/30 rounded-3xl p-8 sm:p-14 relative overflow-hidden flex flex-col md:flex-row items-center justify-between gap-10">
              <div className="max-w-xl text-left">
                <h2 className="text-3xl sm:text-5xl font-extrabold text-white mb-6 leading-tight">
                  {tDownload("banner.title")}
                </h2>
                <p className="text-zinc-300 text-lg mb-8 leading-relaxed">
                  {tDownload("banner.description")}
                </p>
                <div className="flex flex-wrap gap-4">
                  <Link
                    href="/download"
                    className="px-8 py-4 bg-primary hover:bg-white hover:text-primary text-white font-bold text-base rounded-2xl transition-all shadow-xl shadow-primary/25 flex items-center gap-3"
                  >
                    <span>{tDownload("banner.button")}</span>
                  </Link>
                </div>
              </div>

              <div className="w-full md:w-auto flex justify-center">
                <div className="relative w-[240px] sm:w-[260px] rounded-[40px] p-2.5 bg-gradient-to-b from-zinc-700 via-zinc-800 to-zinc-950 shadow-2xl border border-white/20">
                  <div className="relative overflow-hidden rounded-[32px] aspect-[9/19] bg-zinc-950 border border-white/10 shadow-inner">
                    <Image
                      src="/app_demo.jpg"
                      alt="Trainflow App Demo"
                      fill
                      className="object-cover object-top"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section
          className="py-20 bg-background text-white overflow-hidden relative"
          data-purpose="primary-cta"
        >
          <div className="absolute inset-0 opacity-10 flex space-x-12 justify-center pointer-events-none">
            <div className="w-px h-full bg-white transform rotate-12" />
            <div className="w-px h-full bg-white transform rotate-12" />
            <div className="w-px h-full bg-white transform rotate-12" />
            <div className="w-px h-full bg-white transform rotate-12" />
          </div>
          <div className="max-w-5xl mx-auto px-4 text-center relative z-10">
            <h2 className="text-4xl md:text-5xl font-extrabold mb-8 leading-tight">
              {t("cta.title")}
            </h2>
            <p className="text-xl text-white/70 mb-10 max-w-2xl mx-auto">
              {t("cta.description")}
            </p>
            <div className="flex flex-col sm:flex-row justify-center gap-4">
              <Link
                href={"/map"}
                className="px-10 py-5 bg-primary hover:bg-white hover:text-primary transition-all rounded-full font-bold text-lg shadow-xl shadow-primary/20"
              >
                {t("cta.discover")}
              </Link>
              <PreserveHostLink
                href={"/status"}
                className="px-10 py-5 bg-transparent border-2 border-white hover:bg-white hover:text-background transition-all rounded-full font-bold text-lg"
              >
                {t("cta.status")}
              </PreserveHostLink>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
