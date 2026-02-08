import Link from "next/link";

export const metadata = {
  title: "Unsubscribe - Friends of Barça",
  robots: "noindex",
};

export default function UnsubscribePage({
  searchParams,
}: {
  searchParams: { status?: string; msg?: string };
}) {
  const isSuccess = searchParams.status === "success";
  const errorMsg = searchParams.msg;

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#1A1A2E] to-[#004D98] flex items-center justify-center px-4">
      <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-8 text-center">
        {isSuccess ? (
          <>
            <div className="text-5xl mb-4">👋</div>
            <h1 className="text-2xl font-heading font-bold text-[#1A1A2E] mb-3">
              You have been unsubscribed
            </h1>
            <p className="text-gray-600 mb-6">
              You will no longer receive our newsletter emails. We&apos;re sorry to see you go!
            </p>
          </>
        ) : (
          <>
            <div className="text-5xl mb-4">⚠️</div>
            <h1 className="text-2xl font-heading font-bold text-[#1A1A2E] mb-3">
              Something went wrong
            </h1>
            <p className="text-gray-600 mb-6">
              {errorMsg === "invalid-link"
                ? "The unsubscribe link is invalid or incomplete."
                : errorMsg === "invalid-token"
                ? "The unsubscribe link has expired or is invalid."
                : errorMsg === "not-found"
                ? "This subscriber was not found in our system."
                : "We couldn't process your unsubscribe request. Please try again or contact us."}
            </p>
          </>
        )}
        <Link
          href="/"
          className="inline-block px-6 py-3 bg-[#004D98] text-white rounded-lg font-medium hover:bg-[#003d7a] transition-colors"
        >
          Back to Friends of Barça
        </Link>
      </div>
    </div>
  );
}
