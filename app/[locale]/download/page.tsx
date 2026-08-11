"use client";

import { useEffect, useState } from "react";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import Image from "next/image";
import { useTranslations } from "next-intl";
import {
  Download,
  ShieldCheck,
  Smartphone,
  Zap,
  Bell,
  QrCode,
  MapPin,
} from "lucide-react";

interface GitHubReleaseAsset {
  name: string;
  browser_download_url: string;
  size: number;
}

interface GitHubRelease {
  tag_name: string;
  name: string;
  body: string;
  published_at: string;
  assets: GitHubReleaseAsset[];
}

export default function DownloadPage() {
  const t = useTranslations("download");
  const [release, setRelease] = useState<GitHubRelease | null>(null);

  useEffect(() => {
    async function fetchLatestRelease() {
      try {
        const res = await fetch(
          "https://api.github.com/repos/octarahq/Trainflow-App/releases/latest",
        );
        if (res.ok) {
          const data: GitHubRelease = await res.json();
          setRelease(data);
        }
      } catch (e) {
        console.error("Failed to fetch latest release from GitHub", e);
      }
    }
    fetchLatestRelease();
  }, []);

  const apkAsset = release?.assets?.find((a) => a.name.endsWith(".apk"));
  const downloadUrl =
    apkAsset?.browser_download_url ||
    "https://github.com/octarahq/Trainflow-App/releases";
  const versionTag = release?.tag_name || "v1.0.0";
  const formattedSize = apkAsset?.size
    ? `${(apkAsset.size / (1024 * 1024)).toFixed(1)} MB`
    : "~23 MB";

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground">
      <Navbar />

      <main className="flex-1">
        <section className="relative pt-16 pb-24 overflow-hidden bg-hero-gradient">
          <div className="absolute top-0 right-0 -mr-20 -mt-20 w-96 h-96 bg-primary/10 rounded-full blur-3xl" />
          <div className="absolute bottom-0 left-0 -ml-20 -mb-20 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl" />

          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
              <div className="lg:col-span-7 text-left">
                <h1 className="text-4xl sm:text-6xl font-extrabold text-white mb-6 leading-tight">
                  {t("title")}
                </h1>
                <p className="text-lg sm:text-xl text-zinc-400 max-w-2xl mb-10 leading-relaxed">
                  {t("description")}
                </p>

                <div className="bg-background/80 backdrop-blur-xl border border-white/10 p-8 rounded-3xl shadow-2xl">
                  <div className="flex flex-wrap items-center justify-between gap-4 mb-6 pb-6 border-b border-white/10">
                    <div className="text-left">
                      <div className="flex items-center gap-3">
                        <span className="text-2xl font-bold text-white">
                          {t("box.title")}
                        </span>
                        <span className="px-3 py-1 bg-primary/20 text-primary border border-primary/30 rounded-full text-xs font-bold">
                          {versionTag}
                        </span>
                      </div>
                      <p className="text-xs text-zinc-400 mt-1">
                        {t("box.subtitle")}
                      </p>
                    </div>
                  </div>

                  <a
                    href={downloadUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full py-5 px-8 bg-primary hover:bg-primary/90 text-white font-bold text-lg rounded-2xl flex items-center justify-center gap-3 transition-all shadow-xl shadow-primary/25 hover:scale-[1.01] active:scale-[0.99]"
                  >
                    <Download className="w-6 h-6" />
                    <span>{t("box.downloadButton")}</span>
                  </a>
                </div>
              </div>

              <div className="lg:col-span-5 flex justify-center">
                <div className="relative w-[280px] sm:w-[320px] rounded-[48px] p-3 bg-gradient-to-b from-zinc-700 via-zinc-800 to-zinc-950 shadow-2xl border border-white/20">
                  <div className="relative overflow-hidden rounded-[38px] aspect-[9/19.5] bg-zinc-950 border border-white/10 shadow-inner">
                    <Image
                      src="/app_demo.jpg"
                      alt="Trainflow Android App Demo Screenshot"
                      fill
                      priority
                      className="object-cover object-top"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="py-20 bg-background border-t border-white/5">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center max-w-3xl mx-auto mb-16">
              <h2 className="text-3xl sm:text-4xl font-extrabold text-white mb-4">
                {t("features.title")}
              </h2>
              <p className="text-zinc-400">{t("features.subtitle")}</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
              <div className="bg-background/60 p-8 rounded-3xl border border-white/5 hover:border-white/20 transition-all">
                <div className="w-12 h-12 bg-primary/10 text-primary rounded-2xl flex items-center justify-center mb-6">
                  <Zap className="w-6 h-6" />
                </div>
                <h3 className="text-xl font-bold text-white mb-2">
                  {t("features.speed.title")}
                </h3>
                <p className="text-sm text-zinc-400 leading-relaxed">
                  {t("features.speed.description")}
                </p>
              </div>

              <div className="bg-background/60 p-8 rounded-3xl border border-white/5 hover:border-white/20 transition-all">
                <div className="w-12 h-12 bg-primary/10 text-primary rounded-2xl flex items-center justify-center mb-6">
                  <Bell className="w-6 h-6" />
                </div>
                <h3 className="text-xl font-bold text-white mb-2">
                  {t("features.platform.title")}
                </h3>
                <p className="text-sm text-zinc-400 leading-relaxed">
                  {t("features.platform.description")}
                </p>
              </div>

              <div className="bg-background/60 p-8 rounded-3xl border border-white/5 hover:border-white/20 transition-all">
                <div className="w-12 h-12 bg-primary/10 text-primary rounded-2xl flex items-center justify-center mb-6">
                  <MapPin className="w-6 h-6" />
                </div>
                <h3 className="text-xl font-bold text-white mb-2">
                  {t("features.stopAlert.title")}
                </h3>
                <p className="text-sm text-zinc-400 leading-relaxed">
                  {t("features.stopAlert.description")}
                </p>
              </div>

              <div className="bg-background/60 p-8 rounded-3xl border border-white/5 hover:border-white/20 transition-all">
                <div className="w-12 h-12 bg-primary/10 text-primary rounded-2xl flex items-center justify-center mb-6">
                  <ShieldCheck className="w-6 h-6" />
                </div>
                <h3 className="text-xl font-bold text-white mb-2">
                  {t("features.delays.title")}
                </h3>
                <p className="text-sm text-zinc-400 leading-relaxed">
                  {t("features.delays.description")}
                </p>
              </div>
            </div>
          </div>
        </section>

        <section className="py-20 bg-background/50 border-t border-white/5">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            <h2 className="text-3xl font-extrabold text-white text-center mb-12">
              {t("steps.title")}
            </h2>

            <div className="space-y-6">
              <div className="flex items-start gap-5 p-6 bg-background/80 rounded-2xl border border-white/5">
                <div className="w-10 h-10 rounded-xl bg-primary/20 text-primary font-extrabold text-lg flex items-center justify-center shrink-0">
                  1
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white mb-1">
                    {t("steps.step1.title")}
                  </h3>
                  <p className="text-sm text-zinc-400">
                    {t("steps.step1.description")}
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-5 p-6 bg-background/80 rounded-2xl border border-white/5">
                <div className="w-10 h-10 rounded-xl bg-primary/20 text-primary font-extrabold text-lg flex items-center justify-center shrink-0">
                  2
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white mb-1">
                    {t("steps.step2.title")}
                  </h3>
                  <p className="text-sm text-zinc-400">
                    {t("steps.step2.description")}
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-5 p-6 bg-background/80 rounded-2xl border border-white/5">
                <div className="w-10 h-10 rounded-xl bg-primary/20 text-primary font-extrabold text-lg flex items-center justify-center shrink-0">
                  3
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white mb-1">
                    {t("steps.step3.title")}
                  </h3>
                  <p className="text-sm text-zinc-400">
                    {t("steps.step3.description")}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
