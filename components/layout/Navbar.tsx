import { useTranslations } from "next-intl";
import { Link } from "@/i18n/routing";
import Image from "next/image";
import { Button } from "@/components/ui/button";

export default function Navbar() {
  const t = useTranslations("navigation");
  const tc = useTranslations("common");

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
          <button className="p-2 rounded-md text-zinc-300 hover:text-white">
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M4 6h16M4 12h16m-7 6h7"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
              />
            </svg>
          </button>
        </div>
      </div>
    </header>
  );
}
