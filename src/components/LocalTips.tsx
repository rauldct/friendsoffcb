"use client";
import { useLanguage } from "@/lib/LanguageContext";

interface Props {
  tips: string[];
  meetupInfo?: string;
}

export default function LocalTips({ tips, meetupInfo }: Props) {
  const { t } = useLanguage();
  return (
    <div className="bg-[#F5F5F5] rounded-2xl p-8">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-12 h-12 bg-[#EDBB00] rounded-full flex items-center justify-center text-2xl">🧑‍💼</div>
        <div>
          <h3 className="font-heading font-bold text-xl text-[#1A1A2E]">{t("pkg.localTips")}</h3>
          <p className="text-sm text-gray-500">{t("pkg.localTipsDesc")}</p>
        </div>
      </div>
      <ul className="space-y-3">
        {tips.map((tip, i) => (
          <li key={i} className="flex items-start gap-3">
            <span className="text-green-500 mt-0.5">✓</span>
            <span className="text-gray-700">{tip}</span>
          </li>
        ))}
      </ul>
      {meetupInfo && (
        <div className="mt-6 p-4 bg-white rounded-xl border-l-4 border-[#EDBB00]">
          <p className="font-medium text-[#1A1A2E] mb-1">{t("pkg.preMeetup")}</p>
          <p className="text-sm text-gray-600">{meetupInfo}</p>
        </div>
      )}
    </div>
  );
}
