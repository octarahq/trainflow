"use client";

import { useTranslations } from "next-intl";
import { Link } from "@/i18n/routing";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer";
import { Menu } from "lucide-react";

export default function Navbar() {
  const t = useTranslations("navigation");

  return (
    <header className="sticky top-0 z-50 w-full bg-[rgba(2,6,23,0.36)] backdrop-blur-lg border-b border-white/8 shadow-sm">
      <div className="container mx-auto flex h-20 items-center justify-between px-4 md:px-8">
        <Link className="flex items-center gap-2" href="/">
          <Image
            src={"/banner/trainflow_transparent_banner.png"}
            alt="TrainFlow Banner"
            width={180}
            height={80}
          />
        </Link>

        <nav className="hidden md:flex items-center gap-8 text-sm font-semibold text-zinc-300">
          <Link href="/" className="hover:text-primary transition-colors">
            {t("search")}
          </Link>
          <Link
            href="/network/status"
            className="hover:text-primary transition-colors"
          >
            {t("network")}
          </Link>
          <Link
            href="https://octara.xyz"
            target="_blank"
            className="hover:text-primary transition-colors"
          >
            Octara
          </Link>
          <Button
            asChild
            className="rounded-full px-5 py-2.5 text-sm font-bold hover:bg-primary/90"
          >
            <Link href="/connexion">{t("connexion")}</Link>
          </Button>
        </nav>

        <div className="md:hidden">
          <Drawer direction="right">
            <DrawerTrigger asChild>
              <button className="p-2 rounded-md text-zinc-300 hover:text-white transition-colors">
                <Menu className="w-6 h-6" />
              </button>
            </DrawerTrigger>
            <DrawerContent className="h-full w-[80vw] bg-zinc-950 border-l border-white/10 p-6 flex flex-col gap-8">
              <DrawerHeader className="p-0 mb-4 border-b border-white/5 pb-6">
                <DrawerTitle className="text-left">
                  <Image
                    src={"/banner/trainflow_transparent_banner.png"}
                    alt="TrainFlow Banner"
                    width={140}
                    height={60}
                  />
                </DrawerTitle>
              </DrawerHeader>

              <nav className="flex flex-col gap-6 text-lg font-medium text-zinc-400">
                <Link
                  href="/"
                  className="hover:text-primary py-2 transition-colors border-b border-white/5 w-full flex items-center justify-between"
                >
                  {t("search")}
                  <span className="material-symbols-rounded text-sm opacity-50">
                    chevron_right
                  </span>
                </Link>
                <Link
                  href="/network/status"
                  className="hover:text-primary py-2 transition-colors border-b border-white/5 w-full flex items-center justify-between"
                >
                  {t("network")}
                  <span className="material-symbols-rounded text-sm opacity-50">
                    chevron_right
                  </span>
                </Link>
                <Link
                  href="https://octara.xyz"
                  target="_blank"
                  className="hover:text-primary py-2 transition-colors border-b border-white/5 w-full flex items-center justify-between"
                >
                  Octara
                  <span className="material-symbols-rounded text-sm opacity-50">
                    open_in_new
                  </span>
                </Link>
              </nav>

              <div className="mt-auto">
                <Button asChild className="w-full rounded-xl py-6 font-bold">
                  <Link href="/connexion">{t("connexion")}</Link>
                </Button>
              </div>
            </DrawerContent>
          </Drawer>
        </div>
      </div>
    </header>
  );
}
