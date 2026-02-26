import React, { useEffect } from "react";
import { I18nextProvider } from "react-i18next";
import i18n from "@/shared/i18n/i18n";

export default function I18nProvider({ children }) {
    useEffect(() => {
        const onLangChanged = (lng) => {
            try {
                localStorage.setItem("language", lng);
            } catch { }
        };

        i18n.on("languageChanged", onLangChanged);
        return () => i18n.off("languageChanged", onLangChanged);
    }, []);

    return <I18nextProvider i18n={i18n}>{children}</I18nextProvider>;
}