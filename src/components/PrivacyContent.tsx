"use client";

import Link from "next/link";
import { useLanguage } from "@/lib/LanguageContext";

function PrivacyEn() {
  return (
    <>
      <section>
        <h2 className="font-heading text-lg font-bold text-[#1A1A2E] mt-8 mb-3">1. Who We Are</h2>
        <p>
          This website, <strong>friendsofbarca.com</strong>, is operated by <strong>DCT BUSINESS CORP Inc.</strong>, a company registered at 1395 Brickell Ave, Miami, FL 33131, United States.
        </p>
        <p>
          Friends of Barça is an independent fan website for FC Barcelona supporters. We are not affiliated with, endorsed by, or connected to FC Barcelona or any of its subsidiaries.
        </p>
      </section>

      <section>
        <h2 className="font-heading text-lg font-bold text-[#1A1A2E] mt-8 mb-3">2. Information We Collect</h2>
        <p>We may collect the following types of information:</p>
        <ul className="list-disc ml-6 space-y-1">
          <li><strong>Contact Information:</strong> Name, email address, and country when you submit a contact form, subscribe to our newsletter, or upload a photo.</li>
          <li><strong>Usage Data:</strong> Pages visited, time spent on pages, referral source, browser type, and device information through Google Analytics.</li>
          <li><strong>Photo Data:</strong> Images uploaded to our fan gallery, including EXIF metadata (date taken, GPS location if present).</li>
          <li><strong>IP Address:</strong> Collected automatically for security, rate limiting, and fraud prevention purposes.</li>
          <li><strong>Cookie Data:</strong> See our <Link href="/cookies" className="text-[#004D98] underline">Cookie Policy</Link> for details.</li>
        </ul>
      </section>

      <section>
        <h2 className="font-heading text-lg font-bold text-[#1A1A2E] mt-8 mb-3">3. How We Use Your Information</h2>
        <ul className="list-disc ml-6 space-y-1">
          <li>To provide and maintain our services</li>
          <li>To send newsletters and match updates (only with your consent)</li>
          <li>To respond to your inquiries and feedback</li>
          <li>To moderate user-submitted content (fan gallery)</li>
          <li>To analyze website usage and improve our services</li>
          <li>To prevent abuse, fraud, and ensure website security</li>
          <li>To fulfill affiliate partnerships (ticket, hotel, and activity bookings)</li>
        </ul>
      </section>

      <section>
        <h2 className="font-heading text-lg font-bold text-[#1A1A2E] mt-8 mb-3">4. Third-Party Services</h2>
        <p>We use the following third-party services that may collect data:</p>
        <ul className="list-disc ml-6 space-y-1">
          <li><strong>Google Analytics:</strong> Website analytics and usage tracking</li>
          <li><strong>Resend:</strong> Email delivery for newsletters</li>
          <li><strong>StubHub:</strong> Ticket affiliate links</li>
          <li><strong>Booking.com:</strong> Hotel affiliate links</li>
          <li><strong>GetYourGuide:</strong> Activity affiliate links</li>
        </ul>
        <p>Each third-party service operates under its own privacy policy. We encourage you to review their respective policies.</p>
      </section>

      <section>
        <h2 className="font-heading text-lg font-bold text-[#1A1A2E] mt-8 mb-3">5. Data Retention</h2>
        <p>
          We retain personal data only for as long as necessary to fulfill the purposes described in this policy. Newsletter subscribers can unsubscribe at any time. Contact form submissions are retained for up to 12 months. Photos uploaded to the gallery are retained until removed by the user or an administrator.
        </p>
      </section>

      <section>
        <h2 className="font-heading text-lg font-bold text-[#1A1A2E] mt-8 mb-3">6. Your Rights</h2>
        <p>You have the right to:</p>
        <ul className="list-disc ml-6 space-y-1">
          <li>Access the personal data we hold about you</li>
          <li>Request correction of inaccurate data</li>
          <li>Request deletion of your data</li>
          <li>Withdraw consent for data processing (e.g., unsubscribe from newsletters)</li>
          <li>Object to processing of your data</li>
          <li>Request data portability</li>
        </ul>
        <p>To exercise any of these rights, please contact us at the address below.</p>
      </section>

      <section>
        <h2 className="font-heading text-lg font-bold text-[#1A1A2E] mt-8 mb-3">7. Data Security</h2>
        <p>
          We implement appropriate technical and organizational measures to protect your personal data against unauthorized access, alteration, disclosure, or destruction. This includes SSL/TLS encryption, secure password hashing, and access controls.
        </p>
      </section>

      <section>
        <h2 className="font-heading text-lg font-bold text-[#1A1A2E] mt-8 mb-3">8. Children&apos;s Privacy</h2>
        <p>
          Our services are not directed to individuals under the age of 13. We do not knowingly collect personal information from children under 13.
        </p>
      </section>

      <section>
        <h2 className="font-heading text-lg font-bold text-[#1A1A2E] mt-8 mb-3">9. Changes to This Policy</h2>
        <p>
          We may update this Privacy Policy from time to time. We will notify you of any material changes by posting the new policy on this page and updating the &quot;Last updated&quot; date.
        </p>
      </section>

      <section>
        <h2 className="font-heading text-lg font-bold text-[#1A1A2E] mt-8 mb-3">10. Contact Us</h2>
        <p>If you have any questions about this Privacy Policy, please contact us:</p>
        <ContactBlock />
      </section>
    </>
  );
}

function PrivacyEs() {
  return (
    <>
      <section>
        <h2 className="font-heading text-lg font-bold text-[#1A1A2E] mt-8 mb-3">1. Quiénes Somos</h2>
        <p>
          Este sitio web, <strong>friendsofbarca.com</strong>, es operado por <strong>DCT BUSINESS CORP Inc.</strong>, una empresa registrada en 1395 Brickell Ave, Miami, FL 33131, Estados Unidos.
        </p>
        <p>
          Friends of Barça es un sitio web independiente para aficionados del FC Barcelona. No estamos afiliados, respaldados ni vinculados al FC Barcelona ni a ninguna de sus filiales.
        </p>
      </section>

      <section>
        <h2 className="font-heading text-lg font-bold text-[#1A1A2E] mt-8 mb-3">2. Información que Recopilamos</h2>
        <p>Podemos recopilar los siguientes tipos de información:</p>
        <ul className="list-disc ml-6 space-y-1">
          <li><strong>Información de contacto:</strong> Nombre, dirección de correo electrónico y país cuando envías un formulario de contacto, te suscribes a nuestra newsletter o subes una foto.</li>
          <li><strong>Datos de uso:</strong> Páginas visitadas, tiempo en cada página, fuente de referencia, tipo de navegador e información del dispositivo a través de Google Analytics.</li>
          <li><strong>Datos de fotos:</strong> Imágenes subidas a nuestra galería de fans, incluidos metadatos EXIF (fecha, ubicación GPS si está presente).</li>
          <li><strong>Dirección IP:</strong> Recopilada automáticamente por seguridad, límite de solicitudes y prevención de fraude.</li>
          <li><strong>Datos de cookies:</strong> Consulta nuestra <Link href="/cookies" className="text-[#004D98] underline">Política de Cookies</Link> para más detalles.</li>
        </ul>
      </section>

      <section>
        <h2 className="font-heading text-lg font-bold text-[#1A1A2E] mt-8 mb-3">3. Cómo Usamos tu Información</h2>
        <ul className="list-disc ml-6 space-y-1">
          <li>Para proporcionar y mantener nuestros servicios</li>
          <li>Para enviar newsletters y actualizaciones de partidos (solo con tu consentimiento)</li>
          <li>Para responder a tus consultas y comentarios</li>
          <li>Para moderar contenido enviado por usuarios (galería de fans)</li>
          <li>Para analizar el uso del sitio web y mejorar nuestros servicios</li>
          <li>Para prevenir abusos, fraude y garantizar la seguridad del sitio</li>
          <li>Para cumplir con asociaciones de afiliados (reservas de entradas, hoteles y actividades)</li>
        </ul>
      </section>

      <section>
        <h2 className="font-heading text-lg font-bold text-[#1A1A2E] mt-8 mb-3">4. Servicios de Terceros</h2>
        <p>Utilizamos los siguientes servicios de terceros que pueden recopilar datos:</p>
        <ul className="list-disc ml-6 space-y-1">
          <li><strong>Google Analytics:</strong> Análisis web y seguimiento de uso</li>
          <li><strong>Resend:</strong> Envío de correos electrónicos para newsletters</li>
          <li><strong>StubHub:</strong> Enlaces de afiliados para entradas</li>
          <li><strong>Booking.com:</strong> Enlaces de afiliados para hoteles</li>
          <li><strong>GetYourGuide:</strong> Enlaces de afiliados para actividades</li>
        </ul>
        <p>Cada servicio de terceros opera bajo su propia política de privacidad. Te recomendamos revisar sus respectivas políticas.</p>
      </section>

      <section>
        <h2 className="font-heading text-lg font-bold text-[#1A1A2E] mt-8 mb-3">5. Retención de Datos</h2>
        <p>
          Conservamos los datos personales solo durante el tiempo necesario para cumplir los propósitos descritos en esta política. Los suscriptores de la newsletter pueden darse de baja en cualquier momento. Los envíos de formularios de contacto se conservan hasta 12 meses. Las fotos subidas a la galería se conservan hasta que sean eliminadas por el usuario o un administrador.
        </p>
      </section>

      <section>
        <h2 className="font-heading text-lg font-bold text-[#1A1A2E] mt-8 mb-3">6. Tus Derechos</h2>
        <p>Tienes derecho a:</p>
        <ul className="list-disc ml-6 space-y-1">
          <li>Acceder a los datos personales que tenemos sobre ti</li>
          <li>Solicitar la corrección de datos inexactos</li>
          <li>Solicitar la eliminación de tus datos</li>
          <li>Retirar el consentimiento para el tratamiento de datos (ej., darse de baja de newsletters)</li>
          <li>Oponerte al tratamiento de tus datos</li>
          <li>Solicitar la portabilidad de datos</li>
        </ul>
        <p>Para ejercer cualquiera de estos derechos, contacta con nosotros en la dirección indicada abajo.</p>
      </section>

      <section>
        <h2 className="font-heading text-lg font-bold text-[#1A1A2E] mt-8 mb-3">7. Seguridad de los Datos</h2>
        <p>
          Implementamos medidas técnicas y organizativas adecuadas para proteger tus datos personales contra acceso no autorizado, alteración, divulgación o destrucción. Esto incluye cifrado SSL/TLS, hash seguro de contraseñas y controles de acceso.
        </p>
      </section>

      <section>
        <h2 className="font-heading text-lg font-bold text-[#1A1A2E] mt-8 mb-3">8. Privacidad de Menores</h2>
        <p>
          Nuestros servicios no están dirigidos a menores de 13 años. No recopilamos intencionalmente información personal de menores de 13 años.
        </p>
      </section>

      <section>
        <h2 className="font-heading text-lg font-bold text-[#1A1A2E] mt-8 mb-3">9. Cambios en esta Política</h2>
        <p>
          Podemos actualizar esta Política de Privacidad periódicamente. Te notificaremos cualquier cambio importante publicando la nueva política en esta página y actualizando la fecha de &quot;Última actualización&quot;.
        </p>
      </section>

      <section>
        <h2 className="font-heading text-lg font-bold text-[#1A1A2E] mt-8 mb-3">10. Contacto</h2>
        <p>Si tienes alguna pregunta sobre esta Política de Privacidad, contacta con nosotros:</p>
        <ContactBlock />
      </section>
    </>
  );
}

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

export default function PrivacyContent() {
  const { locale } = useLanguage();

  return (
    <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:px-8">
      <h1 className="font-heading text-3xl font-bold text-[#1A1A2E] mb-2">
        {locale === "es" ? "Política de Privacidad" : "Privacy Policy"}
      </h1>
      <p className="text-sm text-gray-500 mb-8">
        {locale === "es" ? "Última actualización: 9 de febrero de 2026" : "Last updated: February 9, 2026"}
      </p>
      <div className="prose prose-gray max-w-none space-y-6 text-sm leading-relaxed text-gray-700">
        {locale === "es" ? <PrivacyEs /> : <PrivacyEn />}
      </div>
    </div>
  );
}
