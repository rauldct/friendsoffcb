interface Props {
  label: string;
  priceFrom: number;
  affiliateUrl: string;
  nights: number;
}

export default function HotelOption({ label, priceFrom, affiliateUrl, nights }: Props) {
  return (
    <div className="card p-5 flex flex-col justify-between">
      <div>
        <h4 className="font-heading font-bold text-[#1A1A2E] mb-1">{label}</h4>
        <p className="text-xs text-gray-500 mb-3">{nights} night{nights > 1 ? "s" : ""} · via Booking.com</p>
      </div>
      <div className="flex items-center justify-between">
        <span className="text-lg font-bold text-[#004D98]">From €{priceFrom}<span className="text-xs font-normal text-gray-500">/night</span></span>
        <a href={affiliateUrl} target="_blank" rel="noopener noreferrer" className="btn-secondary text-sm py-2 px-4" data-affiliate="hotel">
          Book Hotel
        </a>
      </div>
    </div>
  );
}
