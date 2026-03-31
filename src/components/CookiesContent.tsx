"use client";

import Link from "next/link";
import { useLanguage } from "@/lib/LanguageContext";

function ContactBlock() {
  return (
    <div className="bg-gray-50 rounded-xl p-4 mt-2">
      <p><strong>DCT BUSINESS CORP Inc.</strong></p>
      <p>1395 Brickell Ave</p>
      <p>Miami, FL 33131</p>
      <p>United States</p>
      <p className="mt-2">
        Email: <Link href="/contact" className="text-[#004D98] underline">Contact Form</Link>
      </p>
    </div>
  );
}

function CookieTable({ headers, rows }: { headers: string[]; rows: string[][] }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse text-sm">
        <thead>
          <tr className="bg-gray-50">
            {headers.map((h, i) => (
              <th key={i} className="border border-gray-200 px-3 py-2 text-left">{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr key={i}>
              {row.map((cell, j) => (
                <td key={j} className={`border border-gray-200 px-3 py-2 ${j === 0 ? "font-mono text-xs" : ""}`}>{cell}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function CookiesEn() {
  return (
    <>
      <section>
        <h2 className="font-heading text-lg font-bold text-[#1A1A2E] mt-8 mb-3">1. What Are Cookies</h2>
        <p>Cookies are small text files stored on your device when you visit a website. They help websites remember your preferences and improve your browsing experience.</p>
      </section>

      <section>
        <h2 className="font-heading text-lg font-bold text-[#1A1A2E] mt-8 mb-3">2. How We Use Cookies</h2>
        <p><strong>friendsofbarca.com</strong>, operated by <strong>DCT BUSINESS CORP Inc.</strong> (1395 Brickell Ave, Miami, FL 33131, United States), uses cookies for the following purposes:</p>

        <h3 className="font-bold text-[#1A1A2E] mt-4 mb-2">Essential Cookies</h3>
        <CookieTable
          headers={["Cookie", "Purpose", "Duration"]}
          rows={[
            ["cookie-consent", "Remembers your cookie consent preference", "Persistent (localStorage)"],
            ["admin_token", "Authentication for admin users (JWT)", "24 hours"],
            ["locale", "Stores your language preference", "1 year (cookie + localStorage)"],
          ]}
        />

        <h3 className="font-bold text-[#1A1A2E] mt-4 mb-2">Analytics Cookies</h3>
        <CookieTable
          headers={["Cookie", "Purpose", "Provider"]}
          rows={[
            ["_ga, _ga_*", "Track website usage and visitor behavior", "Google Analytics"],
          ]}
        />

        <h3 className="font-bold text-[#1A1A2E] mt-4 mb-2">Third-Party Cookies</h3>
        <p>When you click on affiliate links (StubHub, Booking.com, GetYourGuide), those websites may set their own cookies. We do not control these cookies. Please refer to each provider&apos;s cookie policy for details.</p>
      </section>

      <section>
        <h2 className="font-heading text-lg font-bold text-[#1A1A2E] mt-8 mb-3">3. Managing Cookies</h2>
        <p>You can manage cookies in several ways:</p>
        <ul className="list-disc ml-6 space-y-1">
          <li><strong>Cookie Banner:</strong> Use the cookie banner at the bottom of the page to accept or decline cookies on your first visit.</li>
          <li><strong>Browser Settings:</strong> Most browsers allow you to block or delete cookies through their settings. Note that blocking essential cookies may affect the functionality of the Website.</li>
          <li><strong>Google Analytics Opt-Out:</strong> You can install the <a href="https://tools.google.com/dlpage/gaoptout" target="_blank" rel="noopener" className="text-[#004D98] underline">Google Analytics Opt-out Browser Add-on</a>.</li>
        </ul>
      </section>

      <section>
        <h2 className="font-heading text-lg font-bold text-[#1A1A2E] mt-8 mb-3">4. Changes to This Policy</h2>
        <p>We may update this Cookie Policy from time to time. Any changes will be posted on this page with an updated &quot;Last updated&quot; date.</p>
      </section>

      <section>
        <h2 className="font-heading text-lg font-bold text-[#1A1A2E] mt-8 mb-3">5. Contact</h2>
        <p>For questions about our use of cookies, please contact us:</p>
        <ContactBlock />
      </section>
    </>
  );
}

function CookiesEs() {
  return (
    <>
      <section>
        <h2 className="font-heading text-lg font-bold text-[#1A1A2E] mt-8 mb-3">1. Qué Son las Cookies</h2>
        <p>Las cookies son pequeños archivos de texto que se almacenan en tu dispositivo cuando visitas un sitio web. Ayudan a los sitios web a recordar tus preferencias y mejorar tu experiencia de navegación.</p>
      </section>

      <section>
        <h2 className="font-heading text-lg font-bold text-[#1A1A2E] mt-8 mb-3">2. Cómo Usamos las Cookies</h2>
        <p><strong>friendsofbarca.com</strong>, operado por <strong>DCT BUSINESS CORP Inc.</strong> (1395 Brickell Ave, Miami, FL 33131, Estados Unidos), utiliza cookies para los siguientes propósitos:</p>

        <h3 className="font-bold text-[#1A1A2E] mt-4 mb-2">Cookies Esenciales</h3>
        <CookieTable
          headers={["Cookie", "Propósito", "Duración"]}
          rows={[
            ["cookie-consent", "Recuerda tu preferencia de consentimiento de cookies", "Persistente (localStorage)"],
            ["admin_token", "Autenticación para usuarios administradores (JWT)", "24 horas"],
            ["locale", "Almacena tu preferencia de idioma", "1 año (cookie + localStorage)"],
          ]}
        />

        <h3 className="font-bold text-[#1A1A2E] mt-4 mb-2">Cookies de Analítica</h3>
        <CookieTable
          headers={["Cookie", "Propósito", "Proveedor"]}
          rows={[
            ["_ga, _ga_*", "Rastrear el uso del sitio web y comportamiento de visitantes", "Google Analytics"],
          ]}
        />

        <h3 className="font-bold text-[#1A1A2E] mt-4 mb-2">Cookies de Terceros</h3>
        <p>Cuando haces clic en enlaces de afiliados (StubHub, Booking.com, GetYourGuide), esos sitios web pueden establecer sus propias cookies. No controlamos estas cookies. Consulta la política de cookies de cada proveedor para más detalles.</p>
      </section>

      <section>
        <h2 className="font-heading text-lg font-bold text-[#1A1A2E] mt-8 mb-3">3. Gestión de Cookies</h2>
        <p>Puedes gestionar las cookies de varias formas:</p>
        <ul className="list-disc ml-6 space-y-1">
          <li><strong>Banner de cookies:</strong> Usa el banner de cookies en la parte inferior de la página para aceptar o rechazar cookies en tu primera visita.</li>
          <li><strong>Configuración del navegador:</strong> La mayoría de navegadores te permiten bloquear o eliminar cookies a través de su configuración. Ten en cuenta que bloquear cookies esenciales puede afectar al funcionamiento del Sitio Web.</li>
          <li><strong>Exclusión de Google Analytics:</strong> Puedes instalar el <a href="https://tools.google.com/dlpage/gaoptout" target="_blank" rel="noopener" className="text-[#004D98] underline">complemento de exclusión de Google Analytics</a>.</li>
        </ul>
      </section>

      <section>
        <h2 className="font-heading text-lg font-bold text-[#1A1A2E] mt-8 mb-3">4. Cambios en esta Política</h2>
        <p>Podemos actualizar esta Política de Cookies periódicamente. Cualquier cambio se publicará en esta página con una fecha de &quot;Última actualización&quot; actualizada.</p>
      </section>

      <section>
        <h2 className="font-heading text-lg font-bold text-[#1A1A2E] mt-8 mb-3">5. Contacto</h2>
        <p>Para preguntas sobre nuestro uso de cookies, contacta con nosotros:</p>
        <ContactBlock />
      </section>
    </>
  );
}

export default function CookiesContent() {
  const { locale } = useLanguage();

  return (
    <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:px-8">
      <h1 className="font-heading text-3xl font-bold text-[#1A1A2E] mb-2">
        {locale === "es" ? "Política de Cookies" : "Cookie Policy"}
      </h1>
      <p className="text-sm text-gray-500 mb-8">
        {locale === "es" ? "Última actualización: 9 de febrero de 2026" : "Last updated: February 9, 2026"}
      </p>
      <div className="prose prose-gray max-w-none space-y-6 text-sm leading-relaxed text-gray-700">
        {locale === "es" ? <CookiesEs /> : <CookiesEn />}
      </div>
    </div>
  );
}
