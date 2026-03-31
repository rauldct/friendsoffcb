"use client";

import { useState, useMemo } from "react";
import { useLanguage } from "@/lib/LanguageContext";
import {
  getBroadcasts,
  detectCountryFromTimezone,
  type BroadcastEntry,
} from "@/lib/broadcast-data";

interface WhereToWatchModalProps {
  onClose: () => void;
  competition: string;
  opponent: string;
  kickoffUtc: string;
}

export default function WhereToWatchModal({
  onClose,
  competition,
  opponent,
  kickoffUtc,
}: WhereToWatchModalProps) {
  const { t, locale } = useLanguage();
  const isEs = locale === "es";

  const broadcasts = useMemo(() => getBroadcasts(competition), [competition]);
  const [selectedCountry, setSelectedCountry] = useState(() =>
    detectCountryFromTimezone()
  );

  const selectedBroadcast: BroadcastEntry | undefined = useMemo(
    () => broadcasts.find((b) => b.countryCode === selectedCountry),
    [broadcasts, selectedCountry]
  );

  const localTime = useMemo(() => {
    const d = new Date(kickoffUtc);
    return d.toLocaleTimeString(isEs ? "es-ES" : "en-US", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: !isEs,
      timeZoneName: "short",
    });
  }, [kickoffUtc, isEs]);

  const localDate = useMemo(() => {
    const d = new Date(kickoffUtc);
    return d.toLocaleDateString(isEs ? "es-ES" : "en-US", {
      weekday: "long",
      day: "numeric",
      month: "long",
    });
  }, [kickoffUtc, isEs]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-[#A50044] to-[#004D98] p-5 rounded-t-2xl text-white">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-medium bg-white/20 px-2 py-0.5 rounded">
              {competition}
            </span>
            <button
              onClick={onClose}
              className="text-white/70 hover:text-white text-xl leading-none"
            >
              &times;
            </button>
          </div>
          <h3 className="font-bold text-lg">FC Barcelona vs {opponent}</h3>
          <p className="text-white/80 text-sm mt-1 capitalize">{localDate}</p>
        </div>

        <div className="p-5 space-y-5">
          {/* Local time */}
          <div className="flex items-center gap-3 bg-[#004D98]/5 rounded-xl p-4">
            <span className="text-2xl">🕐</span>
            <div>
              <p className="text-xs text-gray-500 uppercase tracking-wider">
                {t("countdown.localTime")}
              </p>
              <p className="text-xl font-bold text-[#1A1A2E]">{localTime}</p>
            </div>
          </div>

          {/* Country selector */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {t("countdown.selectCountry")}
            </label>
            <select
              value={selectedCountry}
              onChange={(e) => setSelectedCountry(e.target.value)}
              className="w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm focus:border-[#004D98] focus:ring-1 focus:ring-[#004D98] focus:outline-none"
            >
              {broadcasts.map((b) => (
                <option key={b.countryCode} value={b.countryCode}>
                  {b.flag}{" "}
                  {isEs ? b.countryName.es : b.countryName.en}
                </option>
              ))}
            </select>
          </div>

          {/* Channels list */}
          <div>
            <p className="text-sm font-medium text-gray-700 mb-2">
              {t("countdown.tvChannels")}
            </p>
            {selectedBroadcast && selectedBroadcast.channels.length > 0 ? (
              <div className="space-y-2">
                {selectedBroadcast.channels.map((channel) => (
                  <div
                    key={channel}
                    className="flex items-center gap-3 bg-gray-50 rounded-lg px-4 py-3"
                  >
                    <span className="text-lg">📺</span>
                    <span className="font-medium text-[#1A1A2E]">
                      {channel}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-6 text-gray-400">
                <p className="text-3xl mb-2">📡</p>
                <p className="text-sm">{t("countdown.noChannels")}</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
