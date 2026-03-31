"use client";

import { useState, useEffect, useMemo } from "react";

interface Programme {
  id: number;
  name: string;
  status: string;
  primarySector: string;
  currencyCode: string;
  displayUrl: string;
  logoUrl: string;
  clickThroughUrl: string;
  commissionGroups: Array<{
    groupId: number;
    groupName: string;
    groupCode: string;
    type: string;
    percentage?: number;
    amount?: number;
    currency?: string;
  }>;
}

interface Transaction {
  id: number;
  advertiserId: number;
  publisherId: number;
  transactionDate: string;
  clickDate: string;
  url: string;
  commissionStatus: string;
  commissionAmount: { amount: number; currency: string };
  saleAmount: { amount: number; currency: string };
  commissionGroups: Array<{ id: number; name: string; code: string; amount: number; currency: string }>;
}

interface Partner {
  name: string;
  type: string;
  configured: boolean;
  affiliateId: string;
  trackingParam: string;
  baseUrl: string;
  logo: string;
}

interface ReferralData {
  configured: boolean;
  publisherId: string;
  account: { userId: number; accounts: Array<{ accountId: number; accountName: string; accountType: string }> } | null;
  programmes: Programme[];
  transactions: Transaction[];
  partners: Partner[];
  error?: string;
}

export default function ReferralsAdminPage() {
  const [data, setData] = useState<ReferralData | null>(null);
  const [loading, setLoading] = useState(true);
  const [sortBy, setSortBy] = useState<string>("transactionDate");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");

  const handleSort = (field: string) => {
    if (sortBy === field) {
      setSortOrder(prev => prev === "asc" ? "desc" : "asc");
    } else {
      setSortBy(field);
      setSortOrder("desc");
    }
  };

  const sortedTransactions = useMemo(() => {
    return [...(data?.transactions || [])].sort((a, b) => {
      const dir = sortOrder === "asc" ? 1 : -1;
      if (sortBy === "transactionDate") return (new Date(a.transactionDate).getTime() - new Date(b.transactionDate).getTime()) * dir;
      if (sortBy === "saleAmount") return ((a.saleAmount?.amount || 0) - (b.saleAmount?.amount || 0)) * dir;
      if (sortBy === "commissionAmount") return ((a.commissionAmount?.amount || 0) - (b.commissionAmount?.amount || 0)) * dir;
      if (sortBy === "commissionStatus") return (a.commissionStatus || "").localeCompare(b.commissionStatus || "") * dir;
      return 0;
    });
  }, [data?.transactions, sortBy, sortOrder]);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const res = await fetch("/api/admin/referrals");
      if (res.ok) {
        const json = await res.json();
        setData(json);
      }
    } catch { /* ignore */ }
    setLoading(false);
  };

  if (loading) {
    return <div className="text-center py-12 text-gray-500">Loading referral data...</div>;
  }

  if (!data) {
    return (
      <div className="bg-white rounded-xl shadow-sm p-8 text-center">
        <h2 className="text-xl font-bold text-gray-800 mb-2">Failed to load</h2>
        <p className="text-gray-500">Could not fetch referral data.</p>
      </div>
    );
  }

  const partners = data.partners || [];
  const configuredCount = partners.filter(p => p.configured).length;
  const totalCommission = (data.transactions || []).reduce((sum, t) => sum + (t.commissionAmount?.amount || 0), 0);
  const totalSales = (data.transactions || []).reduce((sum, t) => sum + (t.saleAmount?.amount || 0), 0);
  const pendingTx = (data.transactions || []).filter(t => t.commissionStatus === "pending");
  const approvedTx = (data.transactions || []).filter(t => t.commissionStatus === "approved");

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Referrals & Affiliates</h1>
        <p className="text-sm text-gray-500 mt-1">{configuredCount} of {partners.length} partners configured</p>
      </div>

      {/* All Affiliate Partners */}
      <div className="bg-white rounded-xl shadow-sm p-5">
        <h3 className="font-semibold text-gray-800 mb-4">Affiliate Partners</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {partners.map(p => (
            <div key={p.name} className={`border rounded-lg p-4 ${p.configured ? "border-green-200 bg-green-50/30" : "border-gray-200 bg-gray-50/50"}`}>
              <div className="flex items-center gap-2 mb-2">
                <span className="text-2xl">{p.logo}</span>
                <div>
                  <h4 className="font-medium text-gray-800 text-sm">{p.name}</h4>
                  <p className="text-xs text-gray-500">{p.type}</p>
                </div>
              </div>
              <div className="space-y-1 text-xs">
                <div className="flex items-center gap-1.5">
                  <span className={`w-1.5 h-1.5 rounded-full ${p.configured ? "bg-green-500" : "bg-gray-300"}`} />
                  <span className={p.configured ? "text-green-700" : "text-gray-400"}>
                    {p.configured ? "Active" : "Not configured"}
                  </span>
                </div>
                {p.configured && (
                  <>
                    <p className="text-gray-500 truncate" title={p.affiliateId}>ID: <span className="font-mono">{p.affiliateId}</span></p>
                    <p className="text-gray-400">Tracking: <span className="font-mono">{p.trackingParam}</span></p>
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Awin Stats */}
      {!data.configured && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 text-sm text-yellow-800">
          Awin not configured. Add AWIN_API_TOKEN and AWIN_PUBLISHER_ID in Settings to see transactions and programmes.
        </div>
      )}

      {data.configured && <>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-green-50 text-green-700 rounded-xl p-4">
          <p className="text-xs font-medium opacity-80">Total Sales (90d)</p>
          <p className="text-2xl font-bold">${totalSales.toFixed(2)}</p>
        </div>
        <div className="bg-blue-50 text-blue-700 rounded-xl p-4">
          <p className="text-xs font-medium opacity-80">Total Commission (90d)</p>
          <p className="text-2xl font-bold">${totalCommission.toFixed(2)}</p>
        </div>
        <div className="bg-orange-50 text-orange-700 rounded-xl p-4">
          <p className="text-xs font-medium opacity-80">Transactions</p>
          <p className="text-2xl font-bold">{data.transactions.length}</p>
        </div>
        <div className="bg-purple-50 text-purple-700 rounded-xl p-4">
          <p className="text-xs font-medium opacity-80">Programmes</p>
          <p className="text-2xl font-bold">{data.programmes.length}</p>
        </div>
      </div>

      {/* Programmes */}
      <div className="bg-white rounded-xl shadow-sm p-5">
        <h3 className="font-semibold text-gray-800 mb-4">Active Programmes</h3>
        {data.programmes.length === 0 ? (
          <p className="text-gray-500 text-sm">No programmes joined yet.</p>
        ) : (
          <div className="space-y-4">
            {data.programmes.map(prog => (
              <div key={prog.id} className="border border-gray-100 rounded-lg p-4">
                <div className="flex items-center gap-3 mb-3">
                  {prog.logoUrl && (
                    <img src={prog.logoUrl} alt={prog.name} className="w-10 h-10 rounded object-contain bg-gray-50" />
                  )}
                  <div>
                    <h4 className="font-medium text-gray-800">{prog.name}</h4>
                    <p className="text-xs text-gray-500">{prog.primarySector} | {prog.status} | ID: {prog.id}</p>
                  </div>
                  <a
                    href={prog.clickThroughUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="ml-auto text-xs text-blue-600 hover:underline"
                  >
                    Test Link
                  </a>
                </div>

                {/* Commission Groups */}
                {prog.commissionGroups.length > 0 && (
                  <div className="bg-gray-50 rounded-lg p-3">
                    <p className="text-xs font-medium text-gray-600 mb-2">Commission Groups</p>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                      {prog.commissionGroups.map((cg) => (
                        <div key={cg.groupId || cg.groupCode} className="text-sm">
                          <span className="text-gray-700 font-medium">{cg.groupName}</span>
                          <span className="text-gray-500 ml-1">
                            {cg.type === "percentage" ? `${cg.percentage}%` : `$${cg.amount}`}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Transactions */}
      <div className="bg-white rounded-xl shadow-sm p-5">
        <h3 className="font-semibold text-gray-800 mb-4">
          Transactions (Last 90 Days)
          {data.transactions.length > 0 && (
            <span className="text-sm font-normal text-gray-500 ml-2">
              {approvedTx.length} approved, {pendingTx.length} pending
            </span>
          )}
        </h3>
        {data.transactions.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-gray-500 text-sm">No transactions yet.</p>
            <p className="text-gray-400 text-xs mt-1">Transactions will appear here when users book through your affiliate links.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-gray-500 border-b">
                  <th className="pb-2 font-medium cursor-pointer select-none hover:text-gray-700" onClick={() => handleSort("transactionDate")}>
                    <div className="flex items-center gap-1">
                      Date
                      {sortBy === "transactionDate" ? <span className="text-[#004D98]">{sortOrder === "asc" ? "\u25B2" : "\u25BC"}</span> : <span className="text-gray-300">{"\u25B2\u25BC"}</span>}
                    </div>
                  </th>
                  <th className="pb-2 font-medium cursor-pointer select-none hover:text-gray-700" onClick={() => handleSort("saleAmount")}>
                    <div className="flex items-center gap-1">
                      Sale
                      {sortBy === "saleAmount" ? <span className="text-[#004D98]">{sortOrder === "asc" ? "\u25B2" : "\u25BC"}</span> : <span className="text-gray-300">{"\u25B2\u25BC"}</span>}
                    </div>
                  </th>
                  <th className="pb-2 font-medium cursor-pointer select-none hover:text-gray-700" onClick={() => handleSort("commissionAmount")}>
                    <div className="flex items-center gap-1">
                      Commission
                      {sortBy === "commissionAmount" ? <span className="text-[#004D98]">{sortOrder === "asc" ? "\u25B2" : "\u25BC"}</span> : <span className="text-gray-300">{"\u25B2\u25BC"}</span>}
                    </div>
                  </th>
                  <th className="pb-2 font-medium cursor-pointer select-none hover:text-gray-700" onClick={() => handleSort("commissionStatus")}>
                    <div className="flex items-center gap-1">
                      Status
                      {sortBy === "commissionStatus" ? <span className="text-[#004D98]">{sortOrder === "asc" ? "\u25B2" : "\u25BC"}</span> : <span className="text-gray-300">{"\u25B2\u25BC"}</span>}
                    </div>
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {sortedTransactions.map(tx => (
                  <tr key={tx.id}>
                    <td className="py-2 text-gray-700">{new Date(tx.transactionDate).toLocaleDateString()}</td>
                    <td className="py-2 font-medium">{tx.saleAmount?.currency} {tx.saleAmount?.amount?.toFixed(2)}</td>
                    <td className="py-2 text-green-600 font-medium">{tx.commissionAmount?.currency} {tx.commissionAmount?.amount?.toFixed(2)}</td>
                    <td className="py-2">
                      <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${
                        tx.commissionStatus === "approved" ? "bg-green-100 text-green-700" :
                        tx.commissionStatus === "pending" ? "bg-yellow-100 text-yellow-700" :
                        "bg-gray-100 text-gray-600"
                      }`}>
                        {tx.commissionStatus}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Integration Info */}
      <div className="bg-white rounded-xl shadow-sm p-5">
        <h3 className="font-semibold text-gray-800 mb-3">Integration Details</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-600">
          <div>
            <h4 className="font-medium text-gray-700 mb-2">Awin Configuration</h4>
            <ul className="space-y-1">
              <li><strong>Publisher ID:</strong> {data.publisherId}</li>
              <li><strong>User ID:</strong> {data.account?.userId}</li>
              <li><strong>Account:</strong> {data.account?.accounts?.[0]?.accountName}</li>
              <li><strong>API:</strong> api.awin.com</li>
            </ul>
          </div>
          <div>
            <h4 className="font-medium text-gray-700 mb-2">Active Tracking</h4>
            <ul className="space-y-1">
              <li><strong>Booking.com:</strong> Awin tracking links (4% commission)</li>
              <li><strong>StubHub:</strong> Direct affiliate (gcid param)</li>
              <li><strong>GetYourGuide:</strong> Direct affiliate (partner_id param)</li>
              <li><strong>Link format:</strong> awin1.com/cread.php?awinmid=...&awinaffid=...&ued=...</li>
            </ul>
          </div>
        </div>
      </div>
      </>}
    </div>
  );
}
