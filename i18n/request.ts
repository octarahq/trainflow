import { getRequestConfig } from "next-intl/server";
import { notFound } from "next/navigation";

const locales = ["fr", "en"];

export default getRequestConfig(
  async ({ locale: localeArg, requestLocale }: any) => {
    let locale = localeArg || (await requestLocale);

    if (!locale || !locales.includes(locale)) {
      locale = locale || "en";
      if (!locales.includes(locale)) notFound();
    }

    try {
      const commonMessages = (await import(`../locales/${locale}/common.json`))
        .default;
      const homeMessages = (await import(`../locales/${locale}/home.json`))
        .default;
      const mapMessages = (await import(`../locales/${locale}/map.json`))
        .default;
      const searchMessages = (await import(`../locales/${locale}/search.json`))
        .default;
      const networkMessages = (
        await import(`../locales/${locale}/network.json`)
      ).default;
      const trainMessages = (await import(`../locales/${locale}/train.json`))
        .default;
      const commingSoonMessages = (
        await import(`../locales/${locale}/commingSoon.json`)
      ).default;

      return {
        locale,
        messages: {
          ...commonMessages,
          home: homeMessages,
          map: mapMessages,
          search: searchMessages,
          network: networkMessages,
          train: trainMessages,
          commingSoon: commingSoonMessages,
        },
      };
    } catch (e) {
      notFound();
    }
  },
);
