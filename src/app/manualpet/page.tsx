"use client";

import { useState, useEffect } from "react";
import Image from "next/image";

/* ───────── SECTIONS INDEX ───────── */
const sections = [
  { id: "introduccion", num: "1", title: "Introduccion" },
  { id: "inicio-sesion", num: "2", title: "Inicio de Sesion" },
  { id: "dashboard", num: "3", title: "Dashboard Principal" },
  { id: "mis-mascotas", num: "4", title: "Mis Mascotas" },
  { id: "anadir-mascota", num: "5", title: "Anadir Nueva Mascota" },
  { id: "live-tracking", num: "6", title: "Live Tracking (GPS)" },
  { id: "led-control", num: "7", title: "Control LED del Collar" },
  { id: "zonas-seguras", num: "8", title: "Zonas Seguras" },
  { id: "actividad", num: "9", title: "Monitor de Actividad" },
  { id: "salud", num: "10", title: "Salud y Veterinario" },
  { id: "registros-salud", num: "11", title: "Registros de Salud" },
  { id: "alertas", num: "12", title: "Sistema de Alertas" },
  { id: "vista-movil", num: "13", title: "Vista Movil" },
  { id: "pendientes", num: "14", title: "Funcionalidades Pendientes" },
  { id: "mejoras", num: "15", title: "Mejoras Sugeridas" },
];

/* ───────── COMPONENTS ───────── */
function Img({ src, alt, caption }: { src: string; alt: string; caption?: string }) {
  return (
    <figure className="my-8">
      <div className="rounded-xl overflow-hidden border border-gray-200 shadow-lg hover:shadow-xl transition-shadow">
        <Image src={src} alt={alt} width={1440} height={900} className="w-full h-auto" quality={90} />
      </div>
      {caption && <figcaption className="text-center text-sm text-gray-500 mt-3 italic">{caption}</figcaption>}
    </figure>
  );
}

function Img2({ left, right }: { left: { src: string; alt: string; cap?: string }; right: { src: string; alt: string; cap?: string } }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 my-8">
      <Img src={left.src} alt={left.alt} caption={left.cap} />
      <Img src={right.src} alt={right.alt} caption={right.cap} />
    </div>
  );
}

function Feat({ icon, title, desc }: { icon: string; title: string; desc: string }) {
  return (
    <div className="flex gap-3 items-start py-2">
      <span className="text-lg flex-shrink-0 mt-0.5 w-6 text-center">{icon}</span>
      <div><span className="font-semibold text-gray-900">{title}</span>{" "}<span className="text-gray-600">— {desc}</span></div>
    </div>
  );
}

function Box({ type, children }: { type: "tip" | "warn" | "info" | "bug"; children: React.ReactNode }) {
  const s: Record<string, string> = {
    tip: "bg-emerald-50 border-emerald-400 text-emerald-900",
    warn: "bg-amber-50 border-amber-400 text-amber-900",
    info: "bg-blue-50 border-blue-400 text-blue-900",
    bug: "bg-red-50 border-red-400 text-red-900",
  };
  const ic: Record<string, string> = { tip: "💡", warn: "⚠️", info: "ℹ️", bug: "🐛" };
  return <div className={`rounded-lg border-l-4 p-4 my-6 text-sm ${s[type]}`}><span className="mr-2">{ic[type]}</span>{children}</div>;
}

function SNum({ n }: { n: string }) {
  return <span className="flex-shrink-0 w-10 h-10 rounded-xl bg-purple-100 text-purple-600 flex items-center justify-center font-bold text-lg">{n}</span>;
}

function H2({ id, num, title }: { id: string; num: string; title: string }) {
  return (
    <div id={id} className="flex items-center gap-3 mb-6 scroll-mt-24">
      <SNum n={num} />
      <h2 className="text-3xl font-bold text-gray-900">{title}</h2>
    </div>
  );
}

function FieldRow({ name, required, children }: { name: string; required?: boolean; children: React.ReactNode }) {
  return (
    <div className="p-4">
      <span className="font-semibold text-gray-900">{name}</span>
      {required && <span className="ml-2 text-[10px] bg-red-100 text-red-600 px-2 py-0.5 rounded-full font-medium">Obligatorio</span>}
      {!required && <span className="ml-2 text-[10px] bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full font-medium">Opcional</span>}
      <div className="text-sm text-gray-600 mt-1">{children}</div>
    </div>
  );
}

function StatusBadge({ color, label }: { color: string; label: string }) {
  return <span className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-semibold ${color}`}>{label}</span>;
}

function PriorityBadge({ level }: { level: "critical" | "high" | "medium" | "low" }) {
  const c: Record<string, string> = {
    critical: "bg-red-100 text-red-700",
    high: "bg-orange-100 text-orange-700",
    medium: "bg-yellow-100 text-yellow-700",
    low: "bg-blue-100 text-blue-700",
  };
  return <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase ${c[level]}`}>{level}</span>;
}

/* ───────── MAIN PAGE ───────── */
export default function ManualPetPage() {
  const [active, setActive] = useState("introduccion");
  const [sidebar, setSidebar] = useState(false);

  useEffect(() => {
    const onScroll = () => {
      const y = window.scrollY + 130;
      for (let i = sections.length - 1; i >= 0; i--) {
        const el = document.getElementById(sections[i].id);
        if (el && el.offsetTop <= y) { setActive(sections[i].id); break; }
      }
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const go = (id: string) => {
    const el = document.getElementById(id);
    if (el) { window.scrollTo({ top: el.offsetTop - 90, behavior: "smooth" }); setActive(id); setSidebar(false); }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* ── HEADER ── */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-sm border-b border-gray-200 shadow-sm">
        <div className="max-w-[1400px] mx-auto flex items-center justify-between px-4 h-16">
          <div className="flex items-center gap-3">
            <button className="lg:hidden p-2 rounded-lg hover:bg-gray-100" onClick={() => setSidebar(!sidebar)}>
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" /></svg>
            </button>
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-purple-600 to-indigo-600 flex items-center justify-center shadow-md"><span className="text-white text-base">🐾</span></div>
              <div><h1 className="text-lg font-bold text-gray-900 leading-tight">PawTrack</h1><p className="text-[10px] text-gray-500 leading-tight -mt-0.5">Manual de Usuario Completo</p></div>
            </div>
          </div>
          <div className="hidden sm:flex items-center gap-2 text-xs text-gray-400"><span className="bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full font-medium">v1.0</span><span>Febrero 2026</span></div>
        </div>
      </header>

      <div className="flex max-w-[1400px] mx-auto pt-16">
        {/* ── SIDEBAR ── */}
        <aside className={`fixed lg:sticky top-16 left-0 z-40 w-72 h-[calc(100vh-4rem)] bg-white border-r border-gray-200 overflow-y-auto transition-transform lg:translate-x-0 ${sidebar ? "translate-x-0" : "-translate-x-full"}`}>
          <nav className="p-4">
            <h2 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-4 px-3">Indice del manual</h2>
            <ul className="space-y-0.5">
              {sections.map(s => {
                const isPending = s.id === "pendientes" || s.id === "mejoras";
                return (
                  <li key={s.id}>
                    <button onClick={() => go(s.id)} className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-all ${active === s.id ? "bg-purple-50 text-purple-700 font-semibold" : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"}`}>
                      <span className={`inline-block w-7 text-xs font-mono ${active === s.id ? "text-purple-500" : "text-gray-400"}`}>{s.num}.</span>
                      {s.title}
                      {isPending && <span className="ml-1 text-[9px] bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded-full font-bold">NUEVO</span>}
                    </button>
                  </li>
                );
              })}
            </ul>
          </nav>
          <div className="p-4 border-t border-gray-100 mt-2">
            <p className="text-[11px] text-gray-400">PawTrack — Smart Pet Monitoring</p>
            <p className="text-[11px] text-gray-400 mt-0.5">15 secciones · 43 capturas</p>
            <p className="text-[11px] text-gray-400 mt-0.5">Ultima actualizacion: Febrero 2026</p>
          </div>
        </aside>

        {sidebar && <div className="fixed inset-0 bg-black/30 z-30 lg:hidden" onClick={() => setSidebar(false)} />}

        {/* ── MAIN CONTENT ── */}
        <main className="flex-1 min-w-0 px-6 lg:px-12 py-10 max-w-4xl">

          {/* ═══════════════════════ 1. INTRODUCCION ═══════════════════════ */}
          <section className="mb-20">
            <H2 id="introduccion" num="1" title="Introduccion" />
            <p className="text-lg text-gray-600 leading-relaxed mb-6">
              <strong className="text-gray-900">PawTrack</strong> es una plataforma inteligente de monitoreo de mascotas que permite hacer seguimiento en tiempo real de la ubicacion, actividad fisica, salud y bienestar de tus companeros. Combina tecnologia GPS, sensores de actividad, registros veterinarios y un sistema de alertas para ofrecer una solucion integral de cuidado animal.
            </p>
            <p className="text-gray-600 mb-8">
              La aplicacion esta construida sobre <strong>Base44</strong> y funciona como una web app accesible desde cualquier navegador, tanto en escritorio como en movil. No requiere instalar aplicaciones nativas.
            </p>

            <h3 className="text-xl font-semibold text-gray-900 mb-4">Modulos Principales</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
              {[
                { icon: "📍", t: "Live Tracking GPS", d: "Ubicacion en tiempo real con mapa Google Maps, coordenadas, nivel de bateria del dispositivo y hora de ultima actualizacion." },
                { icon: "💡", t: "Control LED del Collar", d: "Control remoto del LED del collar GPS: color, modo (solido/parpadeo/pulso), brillo, modo Find Pet y modo nocturno." },
                { icon: "🏃", t: "Monitor de Actividad", d: "Metricas diarias (pasos, calorias, minutos activos, descanso) con metas configurables y graficas de 7 dias con tendencias." },
                { icon: "❤️", t: "Salud y Veterinario", d: "Registro de peso, visitas veterinarias, vacunaciones y medicamentos. Estadisticas rapidas y recordatorios futuros." },
                { icon: "🛡️", t: "Zonas Seguras", d: "Definicion de areas geograficas con radio configurable. Alertas automaticas cuando la mascota sale del perimetro." },
                { icon: "🔔", t: "Sistema de Alertas", d: "Centro de notificaciones con alertas de zona, bateria baja y recordatorios de salud." },
              ].map(c => (
                <div key={c.t} className="bg-white rounded-xl p-5 border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
                  <div className="text-2xl mb-2">{c.icon}</div>
                  <h4 className="font-semibold text-gray-900 mb-1">{c.t}</h4>
                  <p className="text-sm text-gray-600">{c.d}</p>
                </div>
              ))}
            </div>

            <h3 className="text-xl font-semibold text-gray-900 mb-4">Requisitos del Sistema</h3>
            <div className="bg-white rounded-xl border border-gray-200 p-5">
              <ul className="space-y-2 text-gray-600 text-sm">
                <li className="flex items-center gap-2"><span className="text-green-500 font-bold">✓</span> Navegador web moderno (Chrome, Firefox, Safari, Edge)</li>
                <li className="flex items-center gap-2"><span className="text-green-500 font-bold">✓</span> Cuenta de usuario registrada (email o Google)</li>
                <li className="flex items-center gap-2"><span className="text-green-500 font-bold">✓</span> Dispositivo GPS PawTrack compatible (para tracking y actividad en vivo)</li>
                <li className="flex items-center gap-2"><span className="text-green-500 font-bold">✓</span> Conexion a internet estable</li>
              </ul>
            </div>

            <h3 className="text-xl font-semibold text-gray-900 mt-8 mb-4">Estructura de la Aplicacion</h3>
            <div className="bg-white rounded-xl border border-gray-200 p-5">
              <div className="text-sm text-gray-600 font-mono space-y-1">
                <p>/ .............. Dashboard (pantalla principal)</p>
                <p>/LiveTracking .. Seguimiento GPS en tiempo real</p>
                <p>/Activity ...... Monitor de actividad y ejercicio</p>
                <p>/Health ........ Registros de salud y veterinario</p>
                <p>/Alerts ........ Centro de alertas y notificaciones</p>
                <p>/login ......... Inicio de sesion</p>
              </div>
            </div>
          </section>

          {/* ═══════════════════════ 2. INICIO DE SESION ═══════════════════════ */}
          <section className="mb-20">
            <H2 id="inicio-sesion" num="2" title="Inicio de Sesion" />
            <p className="text-gray-600 mb-4">Al acceder a PawTrack por primera vez o sin sesion activa, se redirige automaticamente a la pagina de login. La autenticacion soporta dos metodos: Google OAuth y email/contrasena.</p>

            <Img2
              left={{ src: "/images/manualpet/01-login-empty.png", alt: "Login vacio", cap: "Pantalla de login — formulario vacio" }}
              right={{ src: "/images/manualpet/02-login-filled.png", alt: "Login rellenado", cap: "Login con credenciales introducidas" }}
            />

            <h3 className="text-xl font-semibold text-gray-900 mt-8 mb-4">Elementos de la Pantalla</h3>
            <div className="bg-white rounded-xl border border-gray-200 divide-y">
              <FieldRow name="Logo y titulo" required={false}>Icono de PawTrack con el texto <strong>&quot;Welcome to PawTrack&quot;</strong> y subtitulo <em>&quot;Sign in to continue&quot;</em>.</FieldRow>
              <FieldRow name="Continue with Google" required={false}>Boton con icono de Google para inicio de sesion OAuth. Redirige a la pantalla de seleccion de cuenta de Google. Es la forma mas rapida.</FieldRow>
              <FieldRow name="Email" required>Campo de correo electronico. Placeholder: <code className="bg-gray-100 px-1.5 py-0.5 rounded text-xs">you@example.com</code>. Validacion de formato email.</FieldRow>
              <FieldRow name="Password" required>Campo de contrasena. Se muestra enmascarado con puntos (<code className="bg-gray-100 px-1.5 py-0.5 rounded text-xs">••••••••</code>).</FieldRow>
              <FieldRow name="Sign in" required={false}>Boton principal con fondo oscuro. Envia las credenciales y, si son correctas, redirige al Dashboard.</FieldRow>
              <FieldRow name="Forgot password?" required={false}>Enlace para restablecer la contrasena. Envia un email de recuperacion a la direccion registrada.</FieldRow>
              <FieldRow name="Need an account? Sign up" required={false}>Enlace para crear una cuenta nueva. Lleva al formulario de registro.</FieldRow>
            </div>

            <Box type="tip"><strong>Consejo:</strong> Si usas Google OAuth, el inicio de sesion es instantaneo y no necesitas gestionar contrasenas adicionales. Se recomienda para mayor comodidad y seguridad.</Box>
            <Box type="info"><strong>Seguridad:</strong> La sesion se mantiene activa mediante cookies. Si cierras el navegador, es posible que necesites iniciar sesion de nuevo.</Box>
          </section>

          {/* ═══════════════════════ 3. DASHBOARD ═══════════════════════ */}
          <section className="mb-20">
            <H2 id="dashboard" num="3" title="Dashboard Principal" />
            <p className="text-gray-600 mb-4">El Dashboard es la pantalla central de PawTrack. Tras el login exitoso, es la primera vista que aparece. Concentra toda la informacion relevante y ofrece accesos directos a cada modulo.</p>

            <Img src="/images/manualpet/03-dashboard.png" alt="Dashboard principal" caption="Dashboard principal — Vista general con estadisticas, mascotas y acciones rapidas" />

            <h3 className="text-xl font-semibold text-gray-900 mt-8 mb-4">Barra Superior (Header)</h3>
            <Feat icon="🐾" title="Logo PetTrack" desc="Nombre de la aplicacion con subtitulo 'Smart Pet Monitoring'. Funciona como boton Home: clic para volver siempre al dashboard desde cualquier pantalla." />
            <Feat icon="🔔" title="Icono de campana" desc="Icono de notificaciones en la esquina superior derecha. Muestra un indicador numerico si hay alertas sin leer." />

            <h3 className="text-xl font-semibold text-gray-900 mt-8 mb-4">Panel de Estadisticas (4 tarjetas)</h3>
            <p className="text-gray-600 mb-4">Fila horizontal de cuatro tarjetas con metricas globales actualizadas en tiempo real:</p>
            <div className="bg-white rounded-xl border border-gray-200 divide-y">
              <div className="p-4 flex items-center gap-4">
                <span className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center text-xl">🐾</span>
                <div className="flex-1"><span className="font-semibold">Total Pets</span><p className="text-sm text-gray-500 mt-0.5">Numero total de mascotas registradas. Subtexto: &quot;Registered in system&quot;. En este caso: <strong>2</strong> mascotas.</p></div>
              </div>
              <div className="p-4 flex items-center gap-4">
                <span className="w-10 h-10 rounded-lg bg-green-50 flex items-center justify-center text-xl">📡</span>
                <div className="flex-1"><span className="font-semibold">Active Trackers</span><p className="text-sm text-gray-500 mt-0.5">Dispositivos GPS activos y conectados. Muestra <StatusBadge color="bg-green-100 text-green-700" label="GPS connected" />. En este caso: <strong>2</strong> trackers.</p></div>
              </div>
              <div className="p-4 flex items-center gap-4">
                <span className="w-10 h-10 rounded-lg bg-amber-50 flex items-center justify-center text-xl">⚠️</span>
                <div className="flex-1"><span className="font-semibold">Active Alerts</span><p className="text-sm text-gray-500 mt-0.5">Alertas pendientes de revision. Subtexto: &quot;Pending review&quot;. En este caso: <strong>0</strong> alertas.</p></div>
              </div>
              <div className="p-4 flex items-center gap-4">
                <span className="w-10 h-10 rounded-lg bg-emerald-50 flex items-center justify-center text-xl">✅</span>
                <div className="flex-1"><span className="font-semibold">LIVE STATUS</span><p className="text-sm text-gray-500 mt-0.5">Panel con fondo verde que muestra el estado global en tiempo real. <StatusBadge color="bg-green-100 text-green-700" label="All Safe" /> cuando ninguna mascota ha salido de sus zonas seguras. Subtexto: &quot;No zone breaches detected&quot;.</p></div>
              </div>
            </div>

            <Img src="/images/manualpet/04-dashboard-scroll.png" alt="Dashboard scroll" caption="Dashboard — Seccion Quick Actions y tarjetas de mascotas (scroll)" />

            <h3 className="text-xl font-semibold text-gray-900 mt-8 mb-4">Seccion &quot;My Pets&quot;</h3>
            <p className="text-gray-600 mb-4">Subtitulo: <em>&quot;Manage and monitor your companions&quot;</em>. Muestra una tarjeta por cada mascota con:</p>
            <Feat icon="🖼️" title="Avatar" desc="Emoji/icono representativo de la especie (perro o gato)." />
            <Feat icon="📛" title="Nombre y raza" desc="Nombre destacado con la raza debajo en texto secundario." />
            <Feat icon="🟢" title="Badge 'Active'" desc="Etiqueta verde que confirma que el tracker GPS esta conectado y transmitiendo datos." />
            <Feat icon="🔋" title="Indicador de bateria" desc="Barra de progreso coloreada + porcentaje. Verde (&gt;50%), amarillo (20-50%), rojo (&lt;20%)." />
            <Feat icon="📡" title="Indicador LIVE" desc="Punto verde parpadeante con texto 'LIVE' que confirma tracking en tiempo real activo." />
            <Feat icon="🔗" title="Click para ir a Live Tracking" desc="Toda la tarjeta es clickable. Lleva directamente a la vista de Live Tracking de esa mascota." />

            <h3 className="text-xl font-semibold text-gray-900 mt-8 mb-4">Quick Actions (Acciones Rapidas)</h3>
            <p className="text-gray-600 mb-4">Subtitulo: <em>&quot;Access key features instantly&quot;</em>. Cuatro tarjetas con enlace directo a cada modulo principal:</p>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {[
                { icon: "📍", t: "Live Tracking", d: "Real-time GPS location", dest: "/LiveTracking" },
                { icon: "🏃", t: "Activity", d: "Steps, distance & more", dest: "/Activity" },
                { icon: "❤️", t: "Health", d: "Vet records & wellness", dest: "/Health" },
                { icon: "🔔", t: "Alerts", d: "Notifications & warnings", dest: "/Alerts" },
              ].map(c => (
                <div key={c.t} className="bg-white rounded-xl border border-gray-100 p-4 text-center shadow-sm">
                  <div className="text-2xl mb-2">{c.icon}</div>
                  <div className="font-semibold text-sm text-gray-900">{c.t}</div>
                  <div className="text-[11px] text-gray-500">{c.d}</div>
                  <div className="text-[10px] text-purple-500 font-mono mt-1">{c.dest}</div>
                </div>
              ))}
            </div>
            <p className="text-sm text-gray-500 mt-3">Cada Quick Action incluye un boton <strong>&quot;Open&quot;</strong> y enlaza a la mascota seleccionada por defecto (Jagger).</p>
          </section>

          {/* ═══════════════════════ 4. MIS MASCOTAS ═══════════════════════ */}
          <section className="mb-20">
            <H2 id="mis-mascotas" num="4" title="Mis Mascotas" />
            <p className="text-gray-600 mb-6">El sistema soporta multiples mascotas. Cada una tiene su propio perfil con datos independientes de tracking, actividad y salud. Actualmente hay 2 mascotas registradas:</p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-8">
              <div className="bg-white rounded-xl border-2 border-purple-100 p-6 shadow-sm">
                <div className="flex items-center gap-3 mb-4">
                  <span className="text-4xl">🐕</span>
                  <div>
                    <h4 className="font-bold text-lg text-gray-900">Jagger</h4>
                    <p className="text-sm text-gray-500">Rhodesian Ridgeback</p>
                  </div>
                  <StatusBadge color="bg-green-100 text-green-700" label="Active" />
                </div>
                <div className="space-y-2.5 text-sm border-t border-gray-100 pt-4">
                  <div className="flex justify-between"><span className="text-gray-500">Peso actual:</span><span className="font-semibold">38 kg</span></div>
                  <div className="flex justify-between"><span className="text-gray-500">Nacimiento:</span><span className="font-medium">Febrero 2021</span></div>
                  <div className="flex justify-between"><span className="text-gray-500">Bateria GPS:</span><span className="font-semibold text-green-600">85%</span></div>
                  <div className="flex justify-between"><span className="text-gray-500">Device ID:</span><span className="font-mono text-xs text-gray-400">123456789</span></div>
                  <div className="flex justify-between"><span className="text-gray-500">Registros salud:</span><span className="font-medium">2 (1 vacuna + 1 visita vet)</span></div>
                  <div className="flex justify-between"><span className="text-gray-500">Coordenadas:</span><span className="font-mono text-xs">40.712 / -74.006</span></div>
                </div>
              </div>
              <div className="bg-white rounded-xl border-2 border-purple-100 p-6 shadow-sm">
                <div className="flex items-center gap-3 mb-4">
                  <span className="text-4xl">🐈</span>
                  <div>
                    <h4 className="font-bold text-lg text-gray-900">Luna</h4>
                    <p className="text-sm text-gray-500">Maine Coon</p>
                  </div>
                  <StatusBadge color="bg-green-100 text-green-700" label="Active" />
                </div>
                <div className="space-y-2.5 text-sm border-t border-gray-100 pt-4">
                  <div className="flex justify-between"><span className="text-gray-500">Peso actual:</span><span className="font-semibold">5.2 kg</span></div>
                  <div className="flex justify-between"><span className="text-gray-500">Nacimiento:</span><span className="font-medium">Julio 2022</span></div>
                  <div className="flex justify-between"><span className="text-gray-500">Bateria GPS:</span><span className="font-semibold text-green-600">92%</span></div>
                  <div className="flex justify-between"><span className="text-gray-500">Device ID:</span><span className="font-mono text-xs text-gray-400">—</span></div>
                  <div className="flex justify-between"><span className="text-gray-500">Registros salud:</span><span className="font-medium text-amber-600">0 registros</span></div>
                  <div className="flex justify-between"><span className="text-gray-500">Coordenadas:</span><span className="font-mono text-xs">40.712 / -74.006</span></div>
                </div>
              </div>
            </div>

            <Box type="info">En todas las secciones (Live Tracking, Activity, Health) hay un <strong>selector desplegable</strong> en la esquina superior derecha que permite cambiar entre mascotas sin volver al dashboard.</Box>
          </section>

          {/* ═══════════════════════ 5. ANADIR MASCOTA ═══════════════════════ */}
          <section className="mb-20">
            <H2 id="anadir-mascota" num="5" title="Anadir Nueva Mascota" />
            <p className="text-gray-600 mb-4">Para registrar una nueva mascota, pulsa el boton <strong className="text-purple-700">+ Add Pet</strong> en la seccion &quot;My Pets&quot; del dashboard. Se abre un dialogo modal superpuesto sobre el dashboard.</p>

            <Img2
              left={{ src: "/images/manualpet/05-add-pet-modal.png", alt: "Modal Add Pet - parte superior", cap: "Modal 'Add New Pet' — campos principales" }}
              right={{ src: "/images/manualpet/06-add-pet-modal-scroll.png", alt: "Modal Add Pet - scroll", cap: "Modal 'Add New Pet' — campos adicionales (scroll)" }}
            />

            <h3 className="text-xl font-semibold text-gray-900 mt-8 mb-4">Campos del Formulario</h3>
            <div className="bg-white rounded-xl border border-gray-200 divide-y">
              <FieldRow name="Pet Name" required>Nombre de tu mascota. Campo de texto. Placeholder: <code className="bg-gray-100 px-1.5 py-0.5 rounded text-xs">e.g., Max</code>.</FieldRow>
              <FieldRow name="Species" required>
                Selector visual con <strong>tres botones con icono</strong>: <StatusBadge color="bg-purple-100 text-purple-700" label="🐕 Dog" />{" "}
                <StatusBadge color="bg-gray-100 text-gray-700" label="🐈 Cat" />{" "}
                <StatusBadge color="bg-gray-100 text-gray-700" label="🐾 Other" />. Solo se puede seleccionar uno. El seleccionado se resalta con borde morado.
              </FieldRow>
              <FieldRow name="Breed" required={false}>Raza del animal. Campo de texto libre. Placeholder: <code className="bg-gray-100 px-1.5 py-0.5 rounded text-xs">e.g., Labrador</code>.</FieldRow>
              <FieldRow name="Weight (kg)" required={false}>Peso en kilogramos. Campo numerico. Placeholder: <code className="bg-gray-100 px-1.5 py-0.5 rounded text-xs">e.g., 25</code>.</FieldRow>
              <FieldRow name="Birth Date" required={false}>Fecha de nacimiento. Selector de fecha nativo del navegador (formato <code className="bg-gray-100 px-1.5 py-0.5 rounded text-xs">mm/dd/yyyy</code>).</FieldRow>
              <FieldRow name="Device ID" required={false}>Identificador unico del dispositivo GPS PawTrack. Placeholder: <code className="bg-gray-100 px-1.5 py-0.5 rounded text-xs">Enter tracking device ID</code>. Se puede configurar despues.</FieldRow>
            </div>

            <h3 className="text-xl font-semibold text-gray-900 mt-8 mb-4">Acciones</h3>
            <Feat icon="🟣" title="Boton 'Add Pet'" desc="Boton morado/gradiente al final del formulario. Guarda la mascota y la anade al dashboard." />
            <Feat icon="✕" title="Cerrar modal" desc="Icono X en la esquina superior derecha del modal, o tecla Escape, o clic fuera del modal." />

            <Box type="warn"><strong>Nota:</strong> Actualmente no existe funcionalidad para <strong>editar</strong> ni <strong>eliminar</strong> una mascota una vez creada. Ver seccion 14 (Funcionalidades Pendientes).</Box>
          </section>

          {/* ═══════════════════════ 6. LIVE TRACKING ═══════════════════════ */}
          <section className="mb-20">
            <H2 id="live-tracking" num="6" title="Live Tracking (GPS)" />
            <p className="text-gray-600 mb-4">La pantalla de <strong>Live Tracking</strong> muestra la ubicacion en tiempo real de tu mascota en un mapa interactivo de Google Maps. Incluye datos de coordenadas, bateria, hora de actualizacion y controles del dispositivo.</p>

            <Img src="/images/manualpet/07-live-tracking-jagger.png" alt="Live Tracking Jagger" caption="Live Tracking — Jagger: mapa GPS, datos de ubicacion y panel lateral" />

            <h3 className="text-xl font-semibold text-gray-900 mt-8 mb-4">Barra Superior</h3>
            <Feat icon="⬅️" title="Flecha atras" desc="Vuelve al Dashboard principal." />
            <Feat icon="📋" title="Titulo 'Live Tracking'" desc="Titulo de la seccion en negrita." />
            <Feat icon="🔽" title="Selector de mascota" desc="Desplegable en la esquina superior derecha. Permite cambiar entre Jagger y Luna sin salir de la pantalla." />

            <h3 className="text-xl font-semibold text-gray-900 mt-8 mb-4">Cabecera de Mascota</h3>
            <Feat icon="🐕" title="Avatar + Nombre" desc="Icono de la mascota con nombre grande y raza/info debajo." />
            <Feat icon="🟢" title="Estado 'Live tracking active'" desc="Punto verde + texto que confirma tracking GPS en tiempo real." />
            <Feat icon="🔋" title="Nivel de bateria" desc="Porcentaje con icono coloreado (85% para Jagger, 92% para Luna)." />
            <Feat icon="🔄" title="Boton 'Refresh'" desc="Actualiza manualmente la posicion GPS del dispositivo." />

            <h3 className="text-xl font-semibold text-gray-900 mt-8 mb-4">Mapa GPS</h3>
            <p className="text-gray-600 mb-4">Area principal que muestra un mapa de Google Maps con la posicion actual marcada. El mapa es interactivo: permite zoom, desplazamiento y cambio de vista.</p>

            <Img src="/images/manualpet/08-live-tracking-jagger-data.png" alt="Datos GPS" caption="Live Tracking — Barra de datos GPS con coordenadas, hora y Device ID" />

            <h3 className="text-xl font-semibold text-gray-900 mt-8 mb-4">Barra de Datos GPS</h3>
            <p className="text-gray-600 mb-4">Debajo del mapa, una barra horizontal muestra 4 datos tecnicos:</p>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {[
                { l: "LATITUDE", v: "40.712329" },
                { l: "LONGITUDE", v: "-74.006295" },
                { l: "LAST UPDATE", v: "9:56 PM" },
                { l: "DEVICE ID", v: "123456789" },
              ].map(d => (
                <div key={d.l} className="bg-white rounded-lg border border-gray-100 p-3 text-center">
                  <div className="text-[9px] font-bold text-gray-400 tracking-wider">{d.l}</div>
                  <div className="font-mono font-semibold text-gray-900 text-sm mt-1">{d.v}</div>
                </div>
              ))}
            </div>

            <h3 className="text-xl font-semibold text-gray-900 mt-8 mb-4">Live Tracking — Luna</h3>
            <Img2
              left={{ src: "/images/manualpet/11-live-tracking-luna.png", alt: "Live Tracking Luna", cap: "Live Tracking — Luna: vista principal" }}
              right={{ src: "/images/manualpet/12-live-tracking-luna-data.png", alt: "Live Tracking Luna datos", cap: "Luna — Datos GPS y panel lateral" }}
            />

            <Box type="bug"><strong>Error detectado:</strong> El mapa de Google Maps no carga correctamente. Muestra el error <em>&quot;Oops! Something went wrong. This page didn&apos;t load Google Maps correctly.&quot;</em> Esto indica un problema con la API Key de Google Maps. Ver seccion 14.</Box>
          </section>

          {/* ═══════════════════════ 7. LED CONTROL ═══════════════════════ */}
          <section className="mb-20">
            <H2 id="led-control" num="7" title="Control LED del Collar" />
            <p className="text-gray-600 mb-4">El panel lateral derecho de Live Tracking incluye un completo <strong>control remoto del LED del collar GPS</strong>. Permite encender, configurar y personalizar la luz del collar para localizar a la mascota o mejorar su visibilidad.</p>

            <Img src="/images/manualpet/09-led-control-on.png" alt="LED Control panel completo" caption="LED Control activado — Selector de color, modo, brillo, Find Pet y Night Mode" />

            <h3 className="text-xl font-semibold text-gray-900 mt-8 mb-4">Panel LED (cuando esta activado)</h3>
            <div className="bg-white rounded-xl border border-gray-200 divide-y">
              <FieldRow name="Toggle ON/OFF" required={false}>Interruptor principal para encender o apagar el LED del collar. Texto: <em>&quot;Light up your pet&apos;s collar&quot;</em>.</FieldRow>
              <FieldRow name="COLOR" required={false}>
                Paleta de <strong>9 colores</strong> seleccionables visualmente: rojo, verde oscuro, verde claro, azul, cian, naranja, amarillo, rosa, y azul oscuro. Clic en un color para aplicarlo al LED.
              </FieldRow>
              <FieldRow name="MODE" required={false}>
                Tres modos de iluminacion:{" "}
                <StatusBadge color="bg-purple-100 text-purple-700" label="☀️ Solid" />{" "}
                <StatusBadge color="bg-gray-100 text-gray-600" label="💫 Blink" />{" "}
                <StatusBadge color="bg-gray-100 text-gray-600" label="✨ Pulse" />
                <p className="mt-1">Solid = luz fija continua. Blink = parpadeo intermitente. Pulse = pulsacion gradual (fade in/out).</p>
              </FieldRow>
              <FieldRow name="BRIGHTNESS" required={false}>Deslizador (slider) para ajustar la intensidad de la luz de 0% a 100%. Valor por defecto: 75%.</FieldRow>
              <FieldRow name="Find Pet" required={false}>Boton con icono de radar. Activa una senal luminosa/sonora especial en el collar para localizar a la mascota.</FieldRow>
              <FieldRow name="Night Mode" required={false}>Boton con icono de luna. Activa un modo de luz tenue optimizado para visibilidad nocturna sin molestar.</FieldRow>
            </div>
          </section>

          {/* ═══════════════════════ 8. ZONAS SEGURAS ═══════════════════════ */}
          <section className="mb-20">
            <H2 id="zonas-seguras" num="8" title="Zonas Seguras" />
            <p className="text-gray-600 mb-4">Las <strong>Safe Zones</strong> permiten definir perimetros geograficos donde tu mascota deberia permanecer. Si el GPS detecta que la mascota ha salido de una zona segura, el sistema genera automaticamente una alerta.</p>
            <p className="text-gray-600 mb-4">El panel de Zonas Seguras se encuentra en la parte lateral derecha de la pantalla Live Tracking, debajo del control LED.</p>

            <Img src="/images/manualpet/10-add-zone-modal.png" alt="Crear zona segura" caption="Modal 'Create Safe Zone' — Formulario completo con nombre, coordenadas, radio y color" />

            <h3 className="text-xl font-semibold text-gray-900 mt-8 mb-4">Como Crear una Zona Segura</h3>
            <ol className="list-decimal list-inside space-y-3 text-gray-600 mb-6">
              <li>Haz clic en el boton <strong className="text-purple-700">+ Add Zone</strong> en el panel lateral.</li>
              <li>Introduce un <strong>nombre descriptivo</strong> (ej: Home, Park, Office).</li>
              <li>Configura las <strong>coordenadas</strong> manualmente o usa el boton &quot;Use Current Location&quot;.</li>
              <li>Ajusta el <strong>radio</strong> con el deslizador (por defecto 100m).</li>
              <li>Selecciona un <strong>color</strong> para identificar la zona en el mapa.</li>
              <li>Pulsa <strong>&quot;Create Zone&quot;</strong> para guardar.</li>
            </ol>

            <h3 className="text-xl font-semibold text-gray-900 mt-8 mb-4">Campos del Formulario</h3>
            <div className="bg-white rounded-xl border border-gray-200 divide-y">
              <FieldRow name="Zone Name" required>Nombre descriptivo. Placeholder: <code className="bg-gray-100 px-1.5 py-0.5 rounded text-xs">e.g., Home, Park</code>.</FieldRow>
              <FieldRow name="Latitude / Longitude" required>Coordenadas del centro de la zona. Valores por defecto: 40.7128 / -74.0060. Campos numericos editables.</FieldRow>
              <FieldRow name="Use Current Location" required={false}>Boton con icono GPS. Usa la geolocalizacion del navegador para rellenar automaticamente las coordenadas.</FieldRow>
              <FieldRow name="Radius" required>Radio del perimetro en metros. Deslizador visual. Rango: 50m — 1000m. Por defecto: 100m. El valor se muestra en texto encima del slider.</FieldRow>
              <FieldRow name="Color" required={false}>Paleta de 8 colores: morado, rosa, fucsia, rojo, naranja, amarillo, verde, cian. Sirve para diferenciar zonas en el mapa.</FieldRow>
            </div>

            <Box type="warn"><strong>Importante:</strong> Para que las alertas de zona funcionen, el dispositivo GPS debe estar activo y la mascota dentro del rango de cobertura. Si la bateria esta baja o sin senal, las alertas podrian retrasarse o no generarse.</Box>
          </section>

          {/* ═══════════════════════ 9. ACTIVIDAD ═══════════════════════ */}
          <section className="mb-20">
            <H2 id="actividad" num="9" title="Monitor de Actividad" />
            <p className="text-gray-600 mb-4">El modulo de <strong>Activity</strong> muestra metricas detalladas sobre el movimiento y ejercicio fisico de cada mascota. Los datos provienen del sensor de actividad del dispositivo GPS.</p>

            <h3 className="text-xl font-semibold text-gray-900 mt-6 mb-4">Actividad de Jagger</h3>
            <Img src="/images/manualpet/13-activity-jagger-top.png" alt="Actividad Jagger top" caption="Activity — Jagger: cabecera con perfil, actividad del dia y metas" />

            <h4 className="text-lg font-semibold text-gray-900 mt-8 mb-3">Cabecera</h4>
            <Feat icon="🐕" title="Perfil" desc="Avatar, nombre, raza y peso actual (Jagger — Rhodesian ridgeback — 38 kg)." />
            <Feat icon="🔽" title="Selector" desc="Desplegable para cambiar a otra mascota." />

            <h4 className="text-lg font-semibold text-gray-900 mt-8 mb-3">Today&apos;s Activity (4 tarjetas circulares)</h4>
            <p className="text-gray-600 mb-4">Cada tarjeta muestra un indicador circular de progreso con el valor actual, un icono de color, y la meta debajo:</p>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
              {[
                { icon: "👣", l: "Steps", v: "0", g: "Goal: 8,000", c: "text-purple-600" },
                { icon: "🔥", l: "Calories", v: "0 kcal", g: "Goal: 300 kcal", c: "text-red-500" },
                { icon: "⚡", l: "Active", v: "0 min", g: "Goal: 60 min", c: "text-green-500" },
                { icon: "😴", l: "Rest", v: "0 min", g: "Goal: 480 min", c: "text-blue-500" },
              ].map(m => (
                <div key={m.l} className="bg-white rounded-xl border border-gray-100 p-4 text-center shadow-sm">
                  <div className="text-xl mb-1">{m.icon}</div>
                  <div className="font-semibold text-sm">{m.l}</div>
                  <div className={`text-lg font-bold ${m.c}`}>{m.v}</div>
                  <div className="text-[10px] text-gray-400 mt-1">{m.g}</div>
                </div>
              ))}
            </div>

            <Img src="/images/manualpet/14-activity-jagger-charts.png" alt="Graficas actividad Jagger" caption="Activity — Jagger: 4 graficas de barras con tendencia semanal (Last 7 Days)" />

            <h4 className="text-lg font-semibold text-gray-900 mt-8 mb-3">Graficas Semanales (Last 7 Days)</h4>
            <p className="text-gray-600 mb-4">Cuatro graficas de barras verticales, una por metrica. Cada grafica muestra:</p>
            <Feat icon="📊" title="Steps (Last 7 Days)" desc="Pasos diarios. Media diaria: 4,915. Tendencia: -24% respecto a semana anterior (baja, en rojo)." />
            <Feat icon="📊" title="Active Minutes (Last 7 Days)" desc="Minutos activos por dia. Media diaria: 70 min. Tendencia: +86% (sube, en verde)." />
            <Feat icon="📊" title="Distance in km (Last 7 Days)" desc="Kilometros recorridos. Media diaria: 4 km. Tendencia: -9%." />
            <Feat icon="📊" title="Calories (Last 7 Days)" desc="Calorias quemadas. Media diaria: 261 kcal. Tendencia: -16%." />

            <Img src="/images/manualpet/15-activity-jagger-weekly.png" alt="Resumen semanal Jagger" caption="Activity — Jagger: resumen semanal con totales" />

            <h4 className="text-lg font-semibold text-gray-900 mt-8 mb-3">Weekly Summary</h4>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-8">
              {[
                { v: "29,492", l: "Total Steps", c: "text-purple-600" },
                { v: "22.5 km", l: "Total Distance", c: "text-blue-600" },
                { v: "1,563", l: "Calories Burned", c: "text-orange-600" },
                { v: "6h 58m", l: "Active Time", c: "text-green-600" },
              ].map(s => (
                <div key={s.l} className="bg-white rounded-lg border border-gray-100 p-4">
                  <div className={`text-xl font-bold ${s.c}`}>{s.v}</div>
                  <div className="text-xs text-gray-500 mt-1">{s.l}</div>
                </div>
              ))}
            </div>

            <h3 className="text-xl font-semibold text-gray-900 mt-10 mb-4">Actividad de Luna</h3>
            <Img2
              left={{ src: "/images/manualpet/16-activity-luna-top.png", alt: "Actividad Luna top", cap: "Activity — Luna: metricas del dia y metas" }}
              right={{ src: "/images/manualpet/17-activity-luna-charts.png", alt: "Graficas Luna", cap: "Luna: graficas de tendencia semanal" }}
            />
            <Img src="/images/manualpet/18-activity-luna-weekly.png" alt="Resumen semanal Luna" caption="Activity — Luna: Weekly Summary con totales acumulados" />
          </section>

          {/* ═══════════════════════ 10. SALUD ═══════════════════════ */}
          <section className="mb-20">
            <H2 id="salud" num="10" title="Salud y Veterinario" />
            <p className="text-gray-600 mb-4">El modulo de <strong>Health</strong> centraliza toda la informacion medica y de bienestar. Permite registrar y consultar el historial de peso, visitas veterinarias, vacunaciones y medicamentos.</p>

            <h3 className="text-xl font-semibold text-gray-900 mt-6 mb-4">Salud de Jagger</h3>
            <Img src="/images/manualpet/19-health-jagger-all.png" alt="Health Jagger" caption="Health — Jagger: registros de salud, estadisticas rapidas y recordatorios" />

            <h4 className="text-lg font-semibold text-gray-900 mt-8 mb-3">Cabecera</h4>
            <Feat icon="🐕" title="Perfil completo" desc="Avatar, nombre (Jagger), raza (Rhodesian ridgeback), fecha nacimiento (Born Feb 2021) y peso actual destacado: 38 kg - Current Weight." />
            <Feat icon="🔽" title="Selector mascota" desc="Desplegable para cambiar entre Jagger y Luna." />
            <Feat icon="➕" title="+ Add Record" desc="Boton morado en esquina superior derecha. Abre el formulario modal para nuevo registro." />

            <h4 className="text-lg font-semibold text-gray-900 mt-8 mb-3">Health Records (Panel principal)</h4>
            <p className="text-gray-600 mb-3">Lista cronologica de registros con <strong>5 pestanas de filtro</strong>:</p>
            <div className="flex flex-wrap gap-2 mb-4">
              {["All", "Weight", "Vet", "Vaccines", "Meds"].map((t, i) => (
                <span key={t} className={`px-3 py-1.5 rounded-full text-sm font-medium ${i === 0 ? "bg-purple-100 text-purple-700 ring-2 ring-purple-300" : "bg-gray-100 text-gray-600"}`}>{t}</span>
              ))}
            </div>
            <p className="text-gray-600 mb-2">Registros actuales de Jagger:</p>
            <div className="bg-white rounded-xl border border-gray-200 divide-y">
              <div className="p-4 flex items-center gap-4">
                <span className="w-10 h-10 rounded-full bg-green-50 flex items-center justify-center text-lg">💉</span>
                <div className="flex-1">
                  <div className="font-semibold text-gray-900">Vaccination — Rabia</div>
                  <div className="text-sm text-gray-500">Feb 15, 2026</div>
                </div>
                <span className="text-xs text-red-500 font-medium">Due: Feb 15</span>
              </div>
              <div className="p-4 flex items-center gap-4">
                <span className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center text-lg">🩺</span>
                <div className="flex-1">
                  <div className="font-semibold text-gray-900">Vet Visit — Pulgas</div>
                  <div className="text-sm text-gray-500">Feb 15, 2026</div>
                </div>
              </div>
            </div>

            <h4 className="text-lg font-semibold text-gray-900 mt-8 mb-3">Filtros por Pestana</h4>
            <Img2
              left={{ src: "/images/manualpet/20-health-jagger-weight.png", alt: "Filtro Weight", cap: "Filtro: Weight — registros de peso" }}
              right={{ src: "/images/manualpet/20-health-jagger-vaccines.png", alt: "Filtro Vaccines", cap: "Filtro: Vaccines — vacunaciones" }}
            />

            <h4 className="text-lg font-semibold text-gray-900 mt-8 mb-3">Quick Stats (Panel lateral derecho)</h4>
            <div className="bg-white rounded-xl border border-gray-200 divide-y max-w-sm">
              {[
                { icon: "⚖️", l: "Weight Records", v: "0", c: "text-blue-600" },
                { icon: "🩺", l: "Vet Visits", v: "1", c: "text-blue-600" },
                { icon: "💉", l: "Vaccinations", v: "1", c: "text-green-600" },
                { icon: "💊", l: "Medications", v: "0", c: "text-orange-600" },
              ].map(s => (
                <div key={s.l} className="p-3 flex justify-between items-center">
                  <span className="text-sm text-gray-600">{s.icon} {s.l}</span>
                  <span className={`font-bold ${s.c}`}>{s.v}</span>
                </div>
              ))}
            </div>

            <h4 className="text-lg font-semibold text-gray-900 mt-8 mb-3">Upcoming Reminders</h4>
            <p className="text-gray-600 mb-4">Panel con fondo amarillo que muestra recordatorios futuros. Ejemplo:</p>
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-center gap-3 max-w-sm">
              <span className="text-xl">💉</span>
              <div>
                <div className="font-semibold text-amber-900">Rabia</div>
                <div className="text-sm text-amber-700">Due: Feb 15, 2027</div>
              </div>
            </div>

            <h3 className="text-xl font-semibold text-gray-900 mt-10 mb-4">Salud de Luna</h3>
            <Img src="/images/manualpet/25-health-luna-all.png" alt="Health Luna" caption="Health — Luna: sin registros de salud aun. Mensaje: 'No health records yet'" />
            <p className="text-gray-600">Luna no tiene registros de salud creados. Las Quick Stats muestran todo en 0. No hay recordatorios futuros.</p>
          </section>

          {/* ═══════════════════════ 11. REGISTROS DE SALUD ═══════════════════════ */}
          <section className="mb-20">
            <H2 id="registros-salud" num="11" title="Registros de Salud" />
            <p className="text-gray-600 mb-4">El formulario <strong>Add Health Record</strong> se abre al pulsar <strong className="text-purple-700">+ Add Record</strong> en la pantalla Health. Es un dialogo modal con campos dinamicos que cambian segun el tipo seleccionado.</p>

            <Img2
              left={{ src: "/images/manualpet/21-add-health-record-weight.png", alt: "Add record - Weight", cap: "Tipo: Weight — campo Value (kg)" }}
              right={{ src: "/images/manualpet/22-add-health-record-vet.png", alt: "Add record - Vet", cap: "Tipo: Vet Visit — campo Notes" }}
            />
            <Img2
              left={{ src: "/images/manualpet/23-add-health-record-vaccine.png", alt: "Add record - Vaccine", cap: "Tipo: Vaccination — campo Notes" }}
              right={{ src: "/images/manualpet/24-add-health-record-medication.png", alt: "Add record - Medication", cap: "Tipo: Medication — campo Notes" }}
            />

            <h3 className="text-xl font-semibold text-gray-900 mt-8 mb-4">Campos del Formulario</h3>
            <div className="bg-white rounded-xl border border-gray-200 divide-y">
              <FieldRow name="Type" required>
                Selector desplegable con 5 opciones:
                <div className="flex flex-wrap gap-2 mt-2">
                  {["Weight", "Vet Visit", "Vaccination", "Medication", "Note"].map(t => (
                    <span key={t} className="bg-gray-50 text-gray-700 text-xs px-2.5 py-1 rounded border font-medium">{t}</span>
                  ))}
                </div>
                <p className="mt-2 text-xs text-gray-500">El formulario se adapta segun el tipo seleccionado (ej: Weight muestra campo Value en kg).</p>
              </FieldRow>
              <FieldRow name="Date" required>Fecha del registro. Se rellena automaticamente con la fecha actual. Selector de fecha nativo.</FieldRow>
              <FieldRow name="Value (kg)" required={false}>Campo numerico que aparece cuando el tipo es &quot;Weight&quot;. Placeholder: <code className="bg-gray-100 px-1.5 py-0.5 rounded text-xs">e.g., 25.5</code>.</FieldRow>
              <FieldRow name="Notes" required={false}>Area de texto libre para notas adicionales. Placeholder: <code className="bg-gray-100 px-1.5 py-0.5 rounded text-xs">Add any notes...</code>. Disponible para todos los tipos.</FieldRow>
            </div>

            <h3 className="text-xl font-semibold text-gray-900 mt-8 mb-3">Accion</h3>
            <Feat icon="🟣" title="Save Record" desc="Boton morado/gradiente. Guarda el registro y actualiza automaticamente Quick Stats, lista de records y Upcoming Reminders." />

            <Box type="warn"><strong>Nota:</strong> No existe opcion para <strong>editar</strong> ni <strong>eliminar</strong> registros de salud una vez creados. Ver seccion 14.</Box>
          </section>

          {/* ═══════════════════════ 12. ALERTAS ═══════════════════════ */}
          <section className="mb-20">
            <H2 id="alertas" num="12" title="Sistema de Alertas" />
            <p className="text-gray-600 mb-4">La seccion <strong>Alerts</strong> es el centro de notificaciones de PawTrack. Accesible desde Quick Actions en el dashboard o desde el icono de campana en la barra superior.</p>

            <Img src="/images/manualpet/26-alerts.png" alt="Alertas" caption="Alerts — Vista con estado vacio: 'No alerts - You're all caught up!'" />

            <h3 className="text-xl font-semibold text-gray-900 mt-8 mb-4">Estado Vacio</h3>
            <p className="text-gray-600 mb-6">Cuando no hay alertas activas, se muestra un icono de campana gris con el mensaje:</p>
            <div className="bg-gray-50 rounded-xl p-6 text-center mb-6">
              <div className="text-4xl mb-3">🔔</div>
              <p className="font-semibold text-gray-700">No alerts</p>
              <p className="text-sm text-gray-500 mt-1">You&apos;re all caught up! Alerts will appear here when something needs your attention.</p>
            </div>

            <h3 className="text-xl font-semibold text-gray-900 mt-8 mb-4">Tipos de Alertas Soportados</h3>
            <div className="space-y-3">
              {[
                { icon: "🚨", t: "Zone Breach", d: "Se activa cuando una mascota sale del perimetro de una Zona Segura. Muestra nombre de la zona, hora y ubicacion.", bg: "bg-red-50 border-red-200 text-red-900" },
                { icon: "🔋", t: "Low Battery", d: "Aviso cuando la bateria del dispositivo GPS cae por debajo del 20%. Indica mascota afectada y porcentaje.", bg: "bg-amber-50 border-amber-200 text-amber-900" },
                { icon: "💉", t: "Health Reminder", d: "Recordatorio de vacunas, citas veterinarias o medicamentos proximos a su fecha de vencimiento.", bg: "bg-blue-50 border-blue-200 text-blue-900" },
                { icon: "📡", t: "Connection Lost", d: "Alerta cuando el dispositivo GPS pierde conexion y deja de transmitir datos.", bg: "bg-gray-100 border-gray-300 text-gray-800" },
              ].map(a => (
                <div key={a.t} className={`flex gap-3 items-start rounded-xl p-4 border ${a.bg}`}>
                  <span className="text-xl flex-shrink-0">{a.icon}</span>
                  <div><span className="font-semibold">{a.t}</span><p className="text-sm mt-0.5">{a.d}</p></div>
                </div>
              ))}
            </div>
          </section>

          {/* ═══════════════════════ 13. VISTA MOVIL ═══════════════════════ */}
          <section className="mb-20">
            <H2 id="vista-movil" num="13" title="Vista Movil" />
            <p className="text-gray-600 mb-4">PawTrack es completamente <strong>responsive</strong> y se adapta a dispositivos moviles (390px+). Todas las funcionalidades estan disponibles con interfaz optimizada para pantalla tactil.</p>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
              {[
                { src: "/images/manualpet/30-mobile-dashboard.png", alt: "Mobile dashboard", cap: "Dashboard" },
                { src: "/images/manualpet/32-mobile-live-tracking.png", alt: "Mobile tracking", cap: "Live Tracking" },
                { src: "/images/manualpet/34-mobile-activity.png", alt: "Mobile activity", cap: "Activity" },
                { src: "/images/manualpet/36-mobile-health.png", alt: "Mobile health", cap: "Health" },
              ].map(m => (
                <div key={m.cap}><Img src={m.src} alt={m.alt} caption={m.cap} /></div>
              ))}
            </div>

            <h3 className="text-xl font-semibold text-gray-900 mb-4">Capturas con Scroll</h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
              {[
                { src: "/images/manualpet/31-mobile-dashboard-scroll.png", alt: "Mobile dash scroll", cap: "Dashboard (scroll)" },
                { src: "/images/manualpet/33-mobile-live-tracking-scroll.png", alt: "Mobile tracking scroll", cap: "Tracking (scroll)" },
                { src: "/images/manualpet/35-mobile-activity-scroll.png", alt: "Mobile activity scroll", cap: "Activity (scroll)" },
                { src: "/images/manualpet/38-mobile-add-pet.png", alt: "Mobile add pet", cap: "Add Pet modal" },
              ].map(m => (
                <div key={m.cap}><Img src={m.src} alt={m.alt} caption={m.cap} /></div>
              ))}
            </div>

            <h3 className="text-xl font-semibold text-gray-900 mt-4 mb-4">Adaptaciones Moviles</h3>
            <Feat icon="📱" title="Layout de 1 columna" desc="Las tarjetas del dashboard, graficas y paneles se reorganizan en una sola columna vertical. Los paneles laterales (Quick Stats, LED Control) pasan debajo del contenido principal." />
            <Feat icon="📊" title="Graficas responsivas" desc="Las graficas de barras de Activity se redimensionan automaticamente al ancho de pantalla, manteniendo la legibilidad de los datos." />
            <Feat icon="🗺️" title="Mapa a ancho completo" desc="El mapa de Google Maps en Live Tracking ocupa el 100% del ancho disponible en movil." />
            <Feat icon="👆" title="Touch-friendly" desc="Todos los botones, selectores y controles tienen areas de toque generosas para uso con dedos." />
            <Feat icon="📝" title="Modales adaptados" desc="Los formularios modales (Add Pet, Add Record, Add Zone) se muestran a pantalla casi completa en movil." />
          </section>

          {/* ═══════════════════════ 14. FUNCIONALIDADES PENDIENTES ═══════════════════════ */}
          <section className="mb-20">
            <H2 id="pendientes" num="14" title="Funcionalidades Pendientes" />
            <p className="text-gray-600 mb-6">Tras el analisis exhaustivo de la aplicacion, se han identificado las siguientes funcionalidades que <strong>parecen incompletas, no implementadas o con errores</strong>. Se clasifican por prioridad.</p>

            <h3 className="text-xl font-semibold text-gray-900 mt-6 mb-4 flex items-center gap-2">Errores Criticos <PriorityBadge level="critical" /></h3>
            <div className="space-y-4 mb-8">
              <div className="bg-white rounded-xl border-l-4 border-red-400 p-5 shadow-sm">
                <div className="flex items-start gap-3">
                  <span className="text-2xl">🗺️</span>
                  <div>
                    <h4 className="font-bold text-gray-900">Google Maps no carga</h4>
                    <p className="text-sm text-gray-600 mt-1">El mapa en Live Tracking muestra el error <em>&quot;Oops! Something went wrong. This page didn&apos;t load Google Maps correctly.&quot;</em> Esto indica que la <strong>API Key de Google Maps</strong> no esta configurada, ha expirado o tiene restricciones incorrectas. Sin mapa funcional, la caracteristica principal de la app (tracking GPS) pierde su valor visual.</p>
                    <p className="text-xs text-red-600 font-medium mt-2">Impacto: La funcionalidad central de la aplicacion no funciona visualmente.</p>
                  </div>
                </div>
              </div>
            </div>

            <h3 className="text-xl font-semibold text-gray-900 mt-8 mb-4 flex items-center gap-2">Paginas No Implementadas <PriorityBadge level="high" /></h3>
            <div className="bg-white rounded-xl border border-gray-200 divide-y mb-8">
              {[
                { route: "/Settings", desc: "Pagina de configuracion. Devuelve 404. No hay forma de cambiar preferencias, unidades, idioma o configuracion de notificaciones." },
                { route: "/Profile", desc: "Pagina de perfil de usuario. Devuelve 404. No hay forma de ver o editar datos de la cuenta, cambiar contrasena o gestionar la suscripcion." },
                { route: "/Account", desc: "Pagina de cuenta. Devuelve 404. No hay gestion de cuenta." },
                { route: "/Pets", desc: "Pagina de listado/gestion de mascotas. Devuelve 404. La unica forma de ver mascotas es el dashboard." },
              ].map(p => (
                <div key={p.route} className="p-4 flex items-start gap-3">
                  <code className="bg-red-50 text-red-700 px-2 py-1 rounded text-xs font-mono flex-shrink-0">{p.route} → 404</code>
                  <p className="text-sm text-gray-600">{p.desc}</p>
                </div>
              ))}
            </div>

            <h3 className="text-xl font-semibold text-gray-900 mt-8 mb-4 flex items-center gap-2">Funcionalidades CRUD Faltantes <PriorityBadge level="high" /></h3>
            <div className="space-y-3 mb-8">
              {[
                { icon: "🐾", t: "Editar mascota", d: "No existe funcionalidad para editar nombre, raza, peso, fecha de nacimiento o Device ID de una mascota ya creada." },
                { icon: "🗑️", t: "Eliminar mascota", d: "No se puede eliminar una mascota del sistema. Si se registra por error, no hay forma de borrarla." },
                { icon: "📝", t: "Editar registros de salud", d: "Los registros de Health no se pueden modificar una vez creados. Si hay un error en una vacuna o visita, no se puede corregir." },
                { icon: "🗑️", t: "Eliminar registros de salud", d: "No se pueden borrar registros incorrectos o duplicados del historial medico." },
                { icon: "🗑️", t: "Eliminar zonas seguras", d: "Una vez creada una Safe Zone, no hay opcion visible para editarla o eliminarla." },
                { icon: "📷", t: "Foto de mascota", d: "No se puede subir una foto real de la mascota. Solo se usan emojis genericos (🐕 / 🐈)." },
              ].map(f => (
                <div key={f.t} className="bg-white rounded-xl border border-gray-200 p-4 flex items-start gap-3">
                  <span className="text-xl flex-shrink-0">{f.icon}</span>
                  <div><span className="font-semibold text-gray-900">{f.t}</span><p className="text-sm text-gray-600 mt-0.5">{f.d}</p></div>
                </div>
              ))}
            </div>

            <h3 className="text-xl font-semibold text-gray-900 mt-8 mb-4 flex items-center gap-2">Navegacion y UX <PriorityBadge level="medium" /></h3>
            <div className="space-y-3 mb-8">
              {[
                { icon: "🧭", t: "Sin barra de navegacion lateral/superior", d: "No existe menu de navegacion persistente. La unica forma de moverse entre secciones es volver al dashboard y usar Quick Actions, o el boton 'atras'. Esto dificulta la navegacion." },
                { icon: "🚪", t: "Sin boton de Logout visible", d: "No se ha encontrado un boton o enlace para cerrar sesion en ninguna pantalla de la aplicacion." },
                { icon: "🔍", t: "Sin busqueda", d: "No hay funcionalidad de busqueda en ninguna seccion (ni mascotas, ni registros, ni alertas)." },
                { icon: "🌐", t: "Solo en ingles", d: "La interfaz esta unicamente en ingles. No hay selector de idioma ni soporte i18n." },
              ].map(f => (
                <div key={f.t} className="bg-white rounded-xl border border-gray-200 p-4 flex items-start gap-3">
                  <span className="text-xl flex-shrink-0">{f.icon}</span>
                  <div><span className="font-semibold text-gray-900">{f.t}</span><p className="text-sm text-gray-600 mt-0.5">{f.d}</p></div>
                </div>
              ))}
            </div>

            <h3 className="text-xl font-semibold text-gray-900 mt-8 mb-4 flex items-center gap-2">Datos y Contenido <PriorityBadge level="low" /></h3>
            <div className="space-y-3">
              {[
                { icon: "📊", t: "Today's Activity en ceros", d: "La seccion 'Today's Activity' muestra Steps: 0, Calories: 0, Active: 0, Rest: 0 para ambas mascotas. Podria indicar que no hay integracion real con el dispositivo o que los datos del dia no se actualizan." },
                { icon: "🐈", t: "Luna sin registros de salud", d: "La mascota Luna tiene 0 registros en Health (Weight: 0, Vet: 0, Vaccines: 0, Meds: 0). No tiene datos de ejemplo." },
                { icon: "📍", t: "Coordenadas identicas", d: "Jagger y Luna muestran exactamente las mismas coordenadas GPS (40.712329, -74.006295). Podria ser datos de demo o que ambos dispositivos no estan diferenciados." },
              ].map(f => (
                <div key={f.t} className="bg-white rounded-xl border border-gray-200 p-4 flex items-start gap-3">
                  <span className="text-xl flex-shrink-0">{f.icon}</span>
                  <div><span className="font-semibold text-gray-900">{f.t}</span><p className="text-sm text-gray-600 mt-0.5">{f.d}</p></div>
                </div>
              ))}
            </div>
          </section>

          {/* ═══════════════════════ 15. MEJORAS SUGERIDAS ═══════════════════════ */}
          <section className="mb-20">
            <H2 id="mejoras" num="15" title="Mejoras Sugeridas" />
            <p className="text-gray-600 mb-6">Propuestas de mejora para llevar PawTrack al siguiente nivel, organizadas por area y prioridad.</p>

            <h3 className="text-xl font-semibold text-gray-900 mt-6 mb-4">🧭 Navegacion y Estructura</h3>
            <div className="bg-white rounded-xl border border-gray-200 divide-y mb-8">
              {[
                { t: "Sidebar o bottom tab bar", d: "Implementar una barra de navegacion persistente. En desktop: sidebar lateral colapsable con iconos (Dashboard, Tracking, Activity, Health, Alerts, Settings). En movil: bottom tab bar fija con 5 iconos principales como en apps nativas.", p: "high" as const },
                { t: "Breadcrumbs", d: "Anadir una linea de breadcrumbs debajo del header para orientar al usuario: Dashboard > Jagger > Live Tracking.", p: "medium" as const },
                { t: "Pagina de perfil de mascota dedicada", d: "Crear una pagina /Pets/:id con toda la informacion de la mascota en un solo lugar: datos, foto, historial, graficas de peso, timeline de eventos.", p: "high" as const },
              ].map(m => (
                <div key={m.t} className="p-4">
                  <div className="flex items-center gap-2 mb-1"><span className="font-semibold text-gray-900">{m.t}</span><PriorityBadge level={m.p} /></div>
                  <p className="text-sm text-gray-600">{m.d}</p>
                </div>
              ))}
            </div>

            <h3 className="text-xl font-semibold text-gray-900 mt-8 mb-4">📍 Tracking y Mapa</h3>
            <div className="bg-white rounded-xl border border-gray-200 divide-y mb-8">
              {[
                { t: "Historial de rutas (Route History)", d: "Almacenar y mostrar las rutas recorridas en un periodo. Permitir ver en el mapa el trayecto del dia, semana o mes con timeline. Muy util para paseos.", p: "high" as const },
                { t: "Heatmap de ubicacion", d: "Mapa de calor que muestre las zonas mas frecuentadas por la mascota. Util para entender habitos.", p: "low" as const },
                { t: "Geocoding inverso", d: "Mostrar la direccion legible (calle, ciudad) ademas de las coordenadas numericas. Usar Google Geocoding API.", p: "medium" as const },
                { t: "Tracking de velocidad", d: "Mostrar la velocidad actual y media del movimiento. Util para detectar si la mascota esta corriendo, caminando o quieta.", p: "medium" as const },
              ].map(m => (
                <div key={m.t} className="p-4">
                  <div className="flex items-center gap-2 mb-1"><span className="font-semibold text-gray-900">{m.t}</span><PriorityBadge level={m.p} /></div>
                  <p className="text-sm text-gray-600">{m.d}</p>
                </div>
              ))}
            </div>

            <h3 className="text-xl font-semibold text-gray-900 mt-8 mb-4">❤️ Salud y Bienestar</h3>
            <div className="bg-white rounded-xl border border-gray-200 divide-y mb-8">
              {[
                { t: "Grafica de evolucion de peso", d: "Mostrar un grafico de linea con la evolucion del peso a lo largo del tiempo. Muy importante para el control veterinario.", p: "high" as const },
                { t: "Recordatorios con push notifications", d: "Enviar notificaciones push reales al navegador/movil cuando una vacuna o medicamento esta proximo a vencer.", p: "high" as const },
                { t: "Adjuntar documentos", d: "Permitir subir PDFs o fotos de informes veterinarios, recetas y resultados de analisis en cada registro de salud.", p: "medium" as const },
                { t: "Recomendaciones por raza", d: "Mostrar consejos de salud especificos segun la raza: vacunas recomendadas, problemas comunes, peso ideal por edad.", p: "low" as const },
                { t: "Tracking de alimentacion", d: "Nuevo modulo para registrar tipo de comida, cantidad, horarios y controlar la dieta.", p: "medium" as const },
              ].map(m => (
                <div key={m.t} className="p-4">
                  <div className="flex items-center gap-2 mb-1"><span className="font-semibold text-gray-900">{m.t}</span><PriorityBadge level={m.p} /></div>
                  <p className="text-sm text-gray-600">{m.d}</p>
                </div>
              ))}
            </div>

            <h3 className="text-xl font-semibold text-gray-900 mt-8 mb-4">🏃 Actividad</h3>
            <div className="bg-white rounded-xl border border-gray-200 divide-y mb-8">
              {[
                { t: "Metas personalizables", d: "Permitir al usuario ajustar las metas diarias (pasos, calorias, minutos activos) segun recomendaciones veterinarias.", p: "high" as const },
                { t: "Comparativa entre periodos", d: "Grafica que compare la actividad de esta semana vs la anterior, o este mes vs el anterior.", p: "medium" as const },
                { t: "Programar paseos/ejercicio", d: "Calendario para programar paseos con recordatorios. Registrar duración real vs planificada.", p: "low" as const },
              ].map(m => (
                <div key={m.t} className="p-4">
                  <div className="flex items-center gap-2 mb-1"><span className="font-semibold text-gray-900">{m.t}</span><PriorityBadge level={m.p} /></div>
                  <p className="text-sm text-gray-600">{m.d}</p>
                </div>
              ))}
            </div>

            <h3 className="text-xl font-semibold text-gray-900 mt-8 mb-4">👥 Usuario y Social</h3>
            <div className="bg-white rounded-xl border border-gray-200 divide-y mb-8">
              {[
                { t: "Compartir con familia", d: "Sistema multi-usuario para que varios miembros de la familia puedan ver y gestionar las mascotas desde sus propias cuentas.", p: "high" as const },
                { t: "Compartir con veterinario", d: "Generar un link o PDF del historial de salud para compartir con el veterinario antes de una cita.", p: "medium" as const },
                { t: "Exportar datos (PDF/CSV)", d: "Permitir descargar informes en PDF o exportar datos de actividad/salud en CSV para analisis externo.", p: "medium" as const },
                { t: "Dark mode", d: "Tema oscuro para uso nocturno. Importante para una app que puede consultarse de madrugada si hay alertas.", p: "low" as const },
              ].map(m => (
                <div key={m.t} className="p-4">
                  <div className="flex items-center gap-2 mb-1"><span className="font-semibold text-gray-900">{m.t}</span><PriorityBadge level={m.p} /></div>
                  <p className="text-sm text-gray-600">{m.d}</p>
                </div>
              ))}
            </div>

            <h3 className="text-xl font-semibold text-gray-900 mt-8 mb-4">⚙️ Tecnicas</h3>
            <div className="bg-white rounded-xl border border-gray-200 divide-y">
              {[
                { t: "PWA (Progressive Web App)", d: "Convertir la app en PWA instalable con offline support, push notifications nativas y acceso desde la pantalla de inicio del movil.", p: "high" as const },
                { t: "i18n (Internacionalizacion)", d: "Soporte multiidioma, al menos ingles y espanol. Deteccion automatica del idioma del navegador.", p: "medium" as const },
                { t: "Onboarding / Tutorial", d: "Guia interactiva para nuevos usuarios que explique los pasos basicos: crear mascota, vincular dispositivo, configurar zonas.", p: "medium" as const },
                { t: "API publica / Webhooks", d: "Exponer una API REST documentada para integraciones con otros servicios (veterinarios, seguros, etc.).", p: "low" as const },
              ].map(m => (
                <div key={m.t} className="p-4">
                  <div className="flex items-center gap-2 mb-1"><span className="font-semibold text-gray-900">{m.t}</span><PriorityBadge level={m.p} /></div>
                  <p className="text-sm text-gray-600">{m.d}</p>
                </div>
              ))}
            </div>
          </section>

          {/* ── FOOTER ── */}
          <div className="border-t border-gray-200 pt-8 mt-16">
            <div className="text-center text-sm text-gray-400 space-y-1">
              <p className="font-semibold text-gray-500">PawTrack v1.0 — Manual de Usuario Completo</p>
              <p>15 secciones · 43 capturas de pantalla</p>
              <p>Ultima actualizacion: Febrero 2026</p>
              <p className="pt-3">
                <a href="https://slim-paw-track-go.base44.app" target="_blank" rel="noopener noreferrer" className="text-purple-500 hover:text-purple-700 transition-colors font-medium">
                  Acceder a PawTrack →
                </a>
              </p>
            </div>
          </div>

        </main>
      </div>
    </div>
  );
}
