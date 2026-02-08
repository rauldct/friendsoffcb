import prisma from "@/lib/prisma";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function AdminPackagesPage() {
  const packages = await prisma.matchPackage.findMany({
    orderBy: { matchDate: "asc" },
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-heading font-bold text-[#1A1A2E]">Match Packages ({packages.length})</h1>
      </div>

      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-left">
              <tr>
                <th className="px-4 py-3 font-medium text-gray-500">Match</th>
                <th className="px-4 py-3 font-medium text-gray-500">Competition</th>
                <th className="px-4 py-3 font-medium text-gray-500">Date</th>
                <th className="px-4 py-3 font-medium text-gray-500">Status</th>
                <th className="px-4 py-3 font-medium text-gray-500">Featured</th>
                <th className="px-4 py-3 font-medium text-gray-500">Tickets</th>
                <th className="px-4 py-3 font-medium text-gray-500">Hotels</th>
                <th className="px-4 py-3 font-medium text-gray-500">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {packages.map(pkg => {
                const tickets = pkg.tickets as any[];
                const hotels = pkg.hotels as any[];
                return (
                  <tr key={pkg.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <div className="font-medium text-[#1A1A2E]">{pkg.matchTitle}</div>
                      <div className="text-xs text-gray-400">{pkg.slug}</div>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`text-xs px-2 py-0.5 rounded font-medium ${
                        pkg.competition === "Champions League" ? "bg-yellow-100 text-yellow-800" :
                        pkg.competition === "La Liga" ? "bg-blue-100 text-blue-800" : "bg-red-100 text-red-800"
                      }`}>{pkg.competition}</span>
                    </td>
                    <td className="px-4 py-3 text-gray-600">{new Date(pkg.matchDate).toLocaleDateString()}</td>
                    <td className="px-4 py-3">
                      <span className={`text-xs px-2 py-0.5 rounded font-medium ${
                        pkg.status === "upcoming" ? "bg-green-100 text-green-700" :
                        pkg.status === "sold_out" ? "bg-red-100 text-red-700" : "bg-gray-100 text-gray-600"
                      }`}>{pkg.status}</span>
                    </td>
                    <td className="px-4 py-3">{pkg.featured ? "⭐" : "-"}</td>
                    <td className="px-4 py-3 text-gray-600">{tickets?.length || 0} options</td>
                    <td className="px-4 py-3 text-gray-600">{hotels?.length || 0} options</td>
                    <td className="px-4 py-3">
                      <Link href={`/packages/${pkg.slug}`} className="text-[#004D98] hover:underline text-xs" target="_blank">View →</Link>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
