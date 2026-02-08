interface Props {
  label: string;
  priceFrom: number;
  currency: string;
  affiliateUrl: string;
  provider: string;
}

export default function TicketOption({ label, priceFrom, currency, affiliateUrl, provider }: Props) {
  return (
    <div className="card p-5 flex flex-col justify-between">
      <div>
        <h4 className="font-heading font-bold text-[#1A1A2E] mb-1">{label}</h4>
        <p className="text-xs text-gray-500 mb-3">via {provider}</p>
      </div>
      <div className="flex items-center justify-between">
        <span className="text-lg font-bold text-[#A50044]">From {currency}{priceFrom}</span>
        <a
          href={affiliateUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="btn-primary text-sm py-2 px-4"
          data-affiliate="ticket"
          data-provider={provider}
        >
          Get Tickets
        </a>
      </div>
    </div>
  );
}
