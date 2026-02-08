export type Locale = "en" | "es";

export const translations: Record<Locale, Record<string, string>> = {
  en: {
    // Navbar
    "nav.home": "Home",
    "nav.packages": "Packages",
    "nav.blog": "Blog",
    "nav.guides": "Guides",
    "nav.about": "About",
    "nav.calendar": "Calendar",
    "nav.competitions": "Competitions",
    "nav.news": "News",
    "nav.planTrip": "Plan Your Trip",

    // Hero
    "hero.badge": "#1 Fan Experience Platform",
    "hero.title": "Experience FC Barcelona",
    "hero.titleHighlight": "Like a Local",
    "hero.subtitle": "Match tickets, hotels, tours & insider tips — your complete Barça matchday package curated by local fans.",
    "hero.cta1": "Explore Packages",
    "hero.cta2": "Read Our Guides",
    "hero.fans": "Happy Fans",
    "hero.packages": "Packages",
    "hero.rating": "Rating",

    // Sections
    "section.upcoming": "Upcoming Matches",
    "section.featured": "Featured Experiences",
    "section.featuredDesc": "Hand-picked matchday packages with the best tickets, hotels, and activities for an unforgettable Camp Nou experience.",
    "section.latestNews": "Latest News",
    "section.latestNewsDesc": "Stay up to date with everything FC Barcelona.",
    "section.newsletter": "Never Miss a Match",
    "section.newsletterDesc": "Get exclusive deals, matchday tips, and the latest Barça news straight to your inbox.",

    // Packages
    "packages.title": "Match Packages",
    "packages.desc": "Complete matchday experiences including tickets, hotels, and tours. Everything you need to enjoy FC Barcelona at the Spotify Camp Nou.",
    "packages.empty": "New Packages Coming Soon",
    "packages.emptyDesc": "We're preparing exciting new matchday packages. Check back soon!",
    "packages.viewAll": "View All Packages",
    "packages.viewPackage": "View Package →",
    "packages.from": "From",

    // Blog
    "blog.title": "News & Blog",
    "blog.desc": "Stay up to date with the latest FC Barcelona news, match analysis, and transfer updates.",
    "blog.empty": "Coming Soon",
    "blog.emptyDesc": "Our first articles are on the way. Stay tuned!",
    "blog.readMore": "Read More News",
    "blog.back": "← Back to Blog",

    // Guides
    "guides.title": "Travel Guides",
    "guides.desc": "Everything you need to know before visiting the Spotify Camp Nou. Written by locals, for fans.",
    "guides.empty": "Guides Coming Soon",
    "guides.emptyDesc": "We're writing comprehensive guides for your Camp Nou visit.",
    "guides.back": "← Back to Guides",
    "guides.toc": "Table of Contents",

    // Calendar
    "calendar.title": "Match Calendar",
    "calendar.desc": "All upcoming FC Barcelona matches. Click on a home match to see the full matchday package.",
    "calendar.home": "Home",
    "calendar.away": "Away",
    "calendar.viewPackage": "View Package",
    "calendar.awayMatch": "Away Match",
    "calendar.noMatches": "No upcoming matches scheduled.",

    // Contact
    "contact.title": "Contact Us",
    "contact.desc": "Have a question about visiting Camp Nou? Want to collaborate? Drop us a line!",
    "contact.name": "Name",
    "contact.email": "Email",
    "contact.message": "Message",
    "contact.send": "Send Message",
    "contact.sending": "Sending...",
    "contact.success": "Message Sent!",
    "contact.successDesc": "We'll get back to you as soon as possible.",

    // About
    "about.title": "About Friends of Barça",
    "about.subtitle": "We're a group of passionate culés from Barcelona helping international fans experience the magic of FC Barcelona like locals.",
    "about.mission": "Our Mission",

    // Forms
    "form.subscribe": "Subscribe",
    "form.subscribed": "You're subscribed! Welcome to the family.",
    "form.error": "Something went wrong. Please try again.",
    "form.yourEmail": "Enter your email",
    "form.groupSize": "Group Size",
    "form.country": "Country",
    "form.yourName": "Your Name",

    // Lead form
    "lead.title": "Want Us to Plan Everything?",
    "lead.desc": "Leave your details and our team will create a custom package for you.",
    "lead.submit": "Get My Custom Package",
    "lead.success": "Thank You!",
    "lead.successDesc": "We'll get back to you within 24 hours with a custom package.",

    // Package detail
    "pkg.about": "About This Match",
    "pkg.tickets": "Tickets",
    "pkg.hotels": "Hotels",
    "pkg.activities": "Activities & Tours",
    "pkg.getTickets": "Get Tickets",
    "pkg.bookHotel": "Book Hotel",
    "pkg.bookActivity": "Book Activity",
    "pkg.bookNow": "Book Now",
    "pkg.goingMatch": "Going to this match?",
    "pkg.goingMatchDesc": "Check out our complete matchday package with tickets, hotels, and tours.",

    // Footer
    "footer.quickLinks": "Quick Links",
    "footer.popularGuides": "Popular Guides",
    "footer.newsletter": "Newsletter",
    "footer.newsletterDesc": "Get exclusive deals & matchday tips.",
    "footer.rights": "© 2026 Friends of Barça. All rights reserved.",
    "footer.disclaimer": "Friends of Barça is not affiliated with FC Barcelona. All trademarks belong to their respective owners.",
    "footer.affiliate": "This site contains affiliate links. We may earn a commission at no extra cost to you.",

    // Cookie
    "cookie.text": "We use cookies to improve your experience. By continuing, you agree to our",
    "cookie.policy": "Cookie Policy",
    "cookie.accept": "Accept",
    "cookie.decline": "Decline",

    // Gallery
    "nav.gallery": "Gallery",
    "gallery.title": "Fan Gallery",
    "gallery.desc": "Photos from Barça fans around the world",
    "gallery.upload": "Upload Photo",
    "gallery.uploading": "Uploading...",
    "gallery.uploadTitle": "Upload Your Photo",
    "gallery.uploadDesc": "Share your best FC Barcelona moments with fans around the world. Photos are reviewed to ensure they're related to football and Barça.",
    "gallery.dragDrop": "Drag and drop your photo here",
    "gallery.browse": "Browse Files",
    "gallery.fileTypes": "JPG, PNG or WebP — max 10MB",
    "gallery.invalidType": "Only JPG, PNG, and WebP images are allowed.",
    "gallery.tooLarge": "Image must be under 10MB.",
    "gallery.approved": "Photo uploaded and approved! It will appear in the gallery shortly.",
    "gallery.pending": "Photo uploaded! It will appear after review.",
    "gallery.rejected": "Photo was not accepted. Please upload a football/Barça related image.",
    "gallery.empty": "No Photos Yet",
    "gallery.emptyDesc": "Be the first to share your Barça moments!",
    "gallery.loadMore": "Load More",
    "gallery.loading": "Loading...",
    "gallery.photosCount": "photos",
    "gallery.taken": "Taken",
    "gallery.uploadNote": "Photos are moderated to ensure quality and relevance to FC Barcelona.",
    "gallery.back": "← Back to Gallery",

    // Misc
    "misc.home": "Home",
    "misc.matchPackages": "Match Packages",
    "misc.newsBlog": "News & Blog",
    "misc.travelGuides": "Travel Guides",
    "misc.aboutUs": "About Us",
    "misc.contact": "Contact",
    "misc.days": "Days",
    "misc.hours": "Hours",
    "misc.min": "Min",
    "misc.campNou": "Spotify Camp Nou, Barcelona",
    "misc.featured": "Featured",
    "misc.comingSoon": "Coming Soon",
    "misc.by": "By",
  },

  es: {
    // Navbar
    "nav.home": "Inicio",
    "nav.packages": "Paquetes",
    "nav.blog": "Blog",
    "nav.guides": "Guías",
    "nav.about": "Nosotros",
    "nav.calendar": "Calendario",
    "nav.competitions": "Competiciones",
    "nav.news": "Noticias",
    "nav.planTrip": "Planifica tu Viaje",

    // Hero
    "hero.badge": "#1 Plataforma de Experiencias",
    "hero.title": "Vive el FC Barcelona",
    "hero.titleHighlight": "Como un Local",
    "hero.subtitle": "Entradas, hoteles, tours y consejos locales — tu paquete completo para el día del partido.",
    "hero.cta1": "Ver Paquetes",
    "hero.cta2": "Leer Guías",
    "hero.fans": "Fans Felices",
    "hero.packages": "Paquetes",
    "hero.rating": "Valoración",

    // Sections
    "section.upcoming": "Próximos Partidos",
    "section.featured": "Experiencias Destacadas",
    "section.featuredDesc": "Paquetes seleccionados con las mejores entradas, hoteles y actividades para una experiencia inolvidable en el Camp Nou.",
    "section.latestNews": "Últimas Noticias",
    "section.latestNewsDesc": "Mantente al día con todo sobre el FC Barcelona.",
    "section.newsletter": "No te Pierdas Ningún Partido",
    "section.newsletterDesc": "Recibe ofertas exclusivas, consejos para el día del partido y las últimas noticias del Barça.",

    // Packages
    "packages.title": "Paquetes de Partidos",
    "packages.desc": "Experiencias completas para el día del partido: entradas, hoteles y tours. Todo lo que necesitas para disfrutar del FC Barcelona en el Spotify Camp Nou.",
    "packages.empty": "Nuevos Paquetes Próximamente",
    "packages.emptyDesc": "Estamos preparando nuevos paquetes emocionantes. ¡Vuelve pronto!",
    "packages.viewAll": "Ver Todos los Paquetes",
    "packages.viewPackage": "Ver Paquete →",
    "packages.from": "Desde",

    // Blog
    "blog.title": "Noticias y Blog",
    "blog.desc": "Mantente al día con las últimas noticias del FC Barcelona, análisis de partidos y fichajes.",
    "blog.empty": "Próximamente",
    "blog.emptyDesc": "Nuestros primeros artículos están en camino. ¡Mantente atento!",
    "blog.readMore": "Leer Más Noticias",
    "blog.back": "← Volver al Blog",

    // Guides
    "guides.title": "Guías de Viaje",
    "guides.desc": "Todo lo que necesitas saber antes de visitar el Spotify Camp Nou. Escrito por locales, para fans.",
    "guides.empty": "Guías Próximamente",
    "guides.emptyDesc": "Estamos escribiendo guías completas para tu visita al Camp Nou.",
    "guides.back": "← Volver a Guías",
    "guides.toc": "Índice",

    // Calendar
    "calendar.title": "Calendario de Partidos",
    "calendar.desc": "Todos los próximos partidos del FC Barcelona. Haz clic en un partido en casa para ver el paquete completo.",
    "calendar.home": "Local",
    "calendar.away": "Visitante",
    "calendar.viewPackage": "Ver Paquete",
    "calendar.awayMatch": "Fuera de Casa",
    "calendar.noMatches": "No hay partidos programados.",

    // Contact
    "contact.title": "Contacto",
    "contact.desc": "¿Tienes alguna pregunta sobre visitar el Camp Nou? ¿Quieres colaborar? ¡Escríbenos!",
    "contact.name": "Nombre",
    "contact.email": "Email",
    "contact.message": "Mensaje",
    "contact.send": "Enviar Mensaje",
    "contact.sending": "Enviando...",
    "contact.success": "¡Mensaje Enviado!",
    "contact.successDesc": "Te responderemos lo antes posible.",

    // About
    "about.title": "Sobre Friends of Barça",
    "about.subtitle": "Somos un grupo de culés apasionados de Barcelona que ayudamos a fans internacionales a vivir la magia del FC Barcelona como locales.",
    "about.mission": "Nuestra Misión",

    // Forms
    "form.subscribe": "Suscribirse",
    "form.subscribed": "¡Te has suscrito! Bienvenido a la familia.",
    "form.error": "Algo salió mal. Inténtalo de nuevo.",
    "form.yourEmail": "Tu email",
    "form.groupSize": "Tamaño del Grupo",
    "form.country": "País",
    "form.yourName": "Tu Nombre",

    // Lead form
    "lead.title": "¿Quieres que lo Planifiquemos Todo?",
    "lead.desc": "Déjanos tus datos y nuestro equipo creará un paquete personalizado para ti.",
    "lead.submit": "Obtener mi Paquete",
    "lead.success": "¡Gracias!",
    "lead.successDesc": "Te responderemos en 24 horas con un paquete personalizado.",

    // Package detail
    "pkg.about": "Sobre Este Partido",
    "pkg.tickets": "Entradas",
    "pkg.hotels": "Hoteles",
    "pkg.activities": "Actividades y Tours",
    "pkg.getTickets": "Comprar Entradas",
    "pkg.bookHotel": "Reservar Hotel",
    "pkg.bookActivity": "Reservar Actividad",
    "pkg.bookNow": "Reservar Ahora",
    "pkg.goingMatch": "¿Vas a este partido?",
    "pkg.goingMatchDesc": "Mira nuestro paquete completo con entradas, hoteles y tours.",

    // Footer
    "footer.quickLinks": "Enlaces Rápidos",
    "footer.popularGuides": "Guías Populares",
    "footer.newsletter": "Newsletter",
    "footer.newsletterDesc": "Recibe ofertas exclusivas y consejos.",
    "footer.rights": "© 2026 Friends of Barça. Todos los derechos reservados.",
    "footer.disclaimer": "Friends of Barça no está afiliado con el FC Barcelona. Todas las marcas pertenecen a sus respectivos propietarios.",
    "footer.affiliate": "Este sitio contiene enlaces de afiliado. Podemos ganar una comisión sin coste adicional para ti.",

    // Cookie
    "cookie.text": "Usamos cookies para mejorar tu experiencia. Al continuar, aceptas nuestra",
    "cookie.policy": "Política de Cookies",
    "cookie.accept": "Aceptar",
    "cookie.decline": "Rechazar",

    // Gallery
    "nav.gallery": "Galería",
    "gallery.title": "Galería de Fans",
    "gallery.desc": "Fotos de fans del Barça de todo el mundo",
    "gallery.upload": "Subir Foto",
    "gallery.uploading": "Subiendo...",
    "gallery.uploadTitle": "Sube tu Foto",
    "gallery.uploadDesc": "Comparte tus mejores momentos del FC Barcelona con fans de todo el mundo. Las fotos se revisan para asegurar que estén relacionadas con el fútbol y el Barça.",
    "gallery.dragDrop": "Arrastra y suelta tu foto aquí",
    "gallery.browse": "Explorar Archivos",
    "gallery.fileTypes": "JPG, PNG o WebP — máx 10MB",
    "gallery.invalidType": "Solo se permiten imágenes JPG, PNG y WebP.",
    "gallery.tooLarge": "La imagen debe pesar menos de 10MB.",
    "gallery.approved": "¡Foto subida y aprobada! Aparecerá en la galería en breve.",
    "gallery.pending": "¡Foto subida! Aparecerá tras la revisión.",
    "gallery.rejected": "La foto no fue aceptada. Sube una imagen relacionada con fútbol/Barça.",
    "gallery.empty": "Aún No Hay Fotos",
    "gallery.emptyDesc": "¡Sé el primero en compartir tus momentos culés!",
    "gallery.loadMore": "Cargar Más",
    "gallery.loading": "Cargando...",
    "gallery.photosCount": "fotos",
    "gallery.taken": "Tomada",
    "gallery.uploadNote": "Las fotos son moderadas para asegurar calidad y relevancia con el FC Barcelona.",
    "gallery.back": "← Volver a la Galería",

    // Misc
    "misc.home": "Inicio",
    "misc.matchPackages": "Paquetes de Partidos",
    "misc.newsBlog": "Noticias y Blog",
    "misc.travelGuides": "Guías de Viaje",
    "misc.aboutUs": "Sobre Nosotros",
    "misc.contact": "Contacto",
    "misc.days": "Días",
    "misc.hours": "Horas",
    "misc.min": "Min",
    "misc.campNou": "Spotify Camp Nou, Barcelona",
    "misc.featured": "Destacado",
    "misc.comingSoon": "Próximamente",
    "misc.by": "Por",
  },
};

export function t(locale: Locale, key: string): string {
  return translations[locale]?.[key] || translations.en[key] || key;
}
