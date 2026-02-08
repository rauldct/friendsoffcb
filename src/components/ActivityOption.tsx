interface Props {
  label: string;
  priceFrom: number;
  affiliateUrl: string;
}

export default function ActivityOption({ label, priceFrom, affiliateUrl }: Props) {
  return (
    <div className="card p-5 flex items-center justify-between">
      <div>
        <h4 className="font-heading font-bold text-[#1A1A2E]">{label}</h4>
        <span className="text-lg font-bold text-[#004D98]">From €{priceFrom}</span>
      </div>
      <a href={affiliateUrl} target="_blank" rel="noopener noreferrer" className="btn-gold text-sm py-2 px-4" data-affiliate="activity">
        Book Activity
      </a>
    </div>
  );
}
