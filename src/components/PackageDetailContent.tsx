"use client";

import { useLanguage } from "@/lib/LanguageContext";
import { localized, localizedArray } from "@/lib/i18n";
import TicketOption from "@/components/TicketOption";
import HotelOption from "@/components/HotelOption";
import ActivityOption from "@/components/ActivityOption";
import LocalTips from "@/components/LocalTips";
import LeadCaptureForm from "@/components/LeadCaptureForm";
import { TicketOption as TTicket, HotelOption as THotel, ActivityOption as TActivity } from "@/types";

interface PackageDetailContentProps {
  slug: string;
  description: string;
  descriptionEs?: string | null;
  tickets: TTicket[];
  hotels: THotel[];
  activities: TActivity[];
  tips: string[];
  tipsEs?: string[];
  meetupInfo?: string;
  meetupInfoEs?: string | null;
}

export default function PackageDetailContent({
  slug,
  description: descriptionEn,
  descriptionEs,
  tickets,
  hotels,
  activities,
  tips: tipsEn,
  tipsEs,
  meetupInfo: meetupInfoEn,
  meetupInfoEs,
}: PackageDetailContentProps) {
  const { t, locale } = useLanguage();
  const description = localized(locale, descriptionEn, descriptionEs);
  const tips = localizedArray(locale, tipsEn, tipsEs);
  const meetupInfo = meetupInfoEn ? localized(locale, meetupInfoEn, meetupInfoEs) : undefined;

  return (
    <div className="section-padding">
      <div className="container-custom">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
          <div className="lg:col-span-2 space-y-12">
            <div>
              <h2 className="text-2xl font-heading font-bold text-[#1A1A2E] mb-4">{t("pkg.about")}</h2>
              <p className="text-gray-600 leading-relaxed">{description}</p>
            </div>

            {tickets.length > 0 && (
              <div>
                <h2 className="text-2xl font-heading font-bold text-[#1A1A2E] mb-4">🎫 {t("pkg.tickets")}</h2>
                <div className="space-y-4">
                  {tickets.map((t, i) => <TicketOption key={i} {...t} />)}
                </div>
              </div>
            )}

            {hotels.length > 0 && (
              <div>
                <h2 className="text-2xl font-heading font-bold text-[#1A1A2E] mb-4">🏨 {t("pkg.hotels")}</h2>
                <div className="space-y-4">
                  {hotels.map((h, i) => <HotelOption key={i} {...h} />)}
                </div>
              </div>
            )}

            {activities.length > 0 && (
              <div>
                <h2 className="text-2xl font-heading font-bold text-[#1A1A2E] mb-4">🎯 {t("pkg.activities")}</h2>
                <div className="space-y-4">
                  {activities.map((a, i) => <ActivityOption key={i} {...a} />)}
                </div>
              </div>
            )}

            {tips.length > 0 && (
              <LocalTips tips={tips} meetupInfo={meetupInfo} />
            )}
          </div>

          <div className="lg:col-span-1">
            <div className="sticky top-24">
              <LeadCaptureForm matchSlug={slug} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
