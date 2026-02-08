"use client";
import { useState, useEffect } from "react";

export default function CookieBanner() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (!localStorage.getItem("cookie-consent")) setShow(true);
  }, []);

  const handle = (choice: string) => {
    localStorage.setItem("cookie-consent", choice);
    setShow(false);
  };

  if (!show) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t shadow-lg transition-transform duration-300">
      <div className="max-w-7xl mx-auto px-4 py-4 flex flex-col sm:flex-row items-center justify-between gap-4">
        <p className="text-sm text-gray-600">
          We use cookies to improve your experience. By continuing, you agree to our{" "}
          <a href="/cookies" className="text-[#004D98] underline">Cookie Policy</a>.
        </p>
        <div className="flex gap-3 shrink-0">
          <button onClick={() => handle("declined")} className="px-4 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50">Decline</button>
          <button onClick={() => handle("accepted")} className="px-4 py-2 text-sm bg-[#004D98] text-white rounded-lg hover:bg-blue-900 font-medium">Accept</button>
        </div>
      </div>
    </div>
  );
}
