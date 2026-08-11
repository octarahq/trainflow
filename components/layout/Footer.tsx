import Image from "next/image";
import { Link } from "@/i18n/routing";
import { useTranslations } from "next-intl";
import PreserveHostLink from "./PreserveHostLink";

export default function Footer() {
  const t = useTranslations("navigation.footer");

  return (
    <footer
      className="bg-background border-t border-white/5 py-16"
      data-purpose="site-footer"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-12">
          <div className="col-span-1 md:col-span-1">
            <Link className="flex items-center space-x-2 mb-6" href="/">
              <Image
                src="/banner/trainflow_transparent_banner.png"
                alt="TrainFlow Logo"
                width={200}
                height={110}
                className="rounded-full"
              />
            </Link>
            <p className="text-sm text-zinc-400">{t("description")}</p>
          </div>
          <div>
            <h4 className="font-bold text-white mb-6">{t("platform")}</h4>
            <ul className="space-y-4 text-sm text-zinc-400">
              <li>
                <Link className="hover:text-primary" href="/map">
                  {t("interactiveMap")}
                </Link>
              </li>
              <li>
                <Link className="hover:text-primary" href="/network/status">
                  {t("networkStatus")}
                </Link>
              </li>
              <li>
                <Link className="hover:text-primary" href="/developers">
                  {t("devApi")}
                </Link>
              </li>
              <li>
                <Link
                  className="hover:text-primary flex items-center gap-1.5"
                  href="/download"
                >
                  <span>Application Android</span>
                </Link>
              </li>
            </ul>
          </div>
          <div>
            <h4 className="font-bold text-white mb-6">{t("support")}</h4>
            <ul className="space-y-4 text-sm text-zinc-400">
              <li>
                <PreserveHostLink
                  href="/api/discord"
                  className="hover:text-primary"
                >
                  {t("contact")}
                </PreserveHostLink>
              </li>
              <li>
                <PreserveHostLink href="/status" className="hover:text-primary">
                  {t("serviceStatus")}
                </PreserveHostLink>
              </li>
            </ul>
          </div>
          <div>
            <h4 className="font-bold text-white mb-6">{t("legal")}</h4>
            <ul className="space-y-4 text-sm text-zinc-400">
              <li>
                <PreserveHostLink
                  href="/privacy"
                  className="hover:text-primary"
                >
                  {t("privacy")}
                </PreserveHostLink>
              </li>
              <li>
                <PreserveHostLink href="/terms" className="hover:text-primary ">
                  {t("terms")}
                </PreserveHostLink>
              </li>
            </ul>
          </div>
        </div>
        <div className="pt-8 border-t border-white/5 flex flex-col md:row-reverse md:flex-row justify-between items-center text-xs text-zinc-500">
          <p>
            © {new Date().getFullYear()} TrainFlow. {t("rights")}
          </p>
          <div className="flex space-x-6 mt-4 md:mt-0">
            <Link
              className="hover:text-white transition-colors"
              href="https://github.com/octarahq/trainflow"
            >
              GitHub
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
