export interface FederationSeed {
  name: string;
  abbreviation: string | null;
  regions: string[];
  website: string | null;
  email: string | null;
  phone: string | null;
  address: string | null;
  president: string | null;
  description: string | null;
  memberCount: number | null;
  zone: string | null;
}

export const FEDERATIONS: FederationSeed[] = [
  {
    name: "Confederació Mundial de Penyes Barcelonistes",
    abbreviation: "CMPB",
    regions: ["Mundial"],
    website: "https://confederaciopenyes.cat",
    email: "penyes@confederaciopenyes.cat",
    phone: null,
    address: "Barcelona, Catalunya",
    president: null,
    description:
      "Organismo que agrupa y coordina todas las federaciones territoriales de peñas barcelonistas del mundo. Máximo órgano representativo de los peñistas.",
    memberCount: null,
    zone: "Mundial",
  },
  {
    name: "Federación de Peñas Barcelonistas de Andalucía, Ceuta y Melilla",
    abbreviation: "FEPEBACM",
    regions: ["Andalucía", "Ceuta", "Melilla"],
    website: "https://fepebacm.com",
    email: null,
    phone: null,
    address: null,
    president: null,
    description:
      "Federación que agrupa las peñas barcelonistas de Andalucía, Ceuta y Melilla.",
    memberCount: null,
    zone: "Zona 20",
  },
  {
    name: "Federación de Peñas Barcelonistas de Castilla-La Mancha",
    abbreviation: "FPBCLM",
    regions: ["Castilla-La Mancha"],
    website: "https://federacionpbclm.es",
    email: null,
    phone: null,
    address: "C/ Ancha 45, Pedro Muñoz, Ciudad Real",
    president: null,
    description:
      "Federación que coordina las peñas barcelonistas en la comunidad de Castilla-La Mancha.",
    memberCount: null,
    zone: "Zona 21",
  },
  {
    name: "Federación de Peñas Barcelonistas de Aragón, La Rioja y Navarra",
    abbreviation: "FPBARLRNA",
    regions: ["Aragón", "La Rioja", "Navarra"],
    website: "https://federacionpbarlrna.com",
    email: null,
    phone: null,
    address: null,
    president: null,
    description:
      "Federación territorial que agrupa las peñas barcelonistas de Aragón, La Rioja y Navarra.",
    memberCount: null,
    zone: "Zona 25",
  },
  {
    name: "Federación de Peñas Barcelonistas de Madrid",
    abbreviation: "FPBM",
    regions: ["Madrid"],
    website: "https://fpbarcelonistasdemadrid.wordpress.com",
    email: null,
    phone: null,
    address: "Madrid",
    president: null,
    description:
      "Federación que agrupa las peñas barcelonistas en la Comunidad de Madrid.",
    memberCount: null,
    zone: "Zona 23",
  },
  {
    name: "Federación de Peñas Barcelonistas de la Región de Murcia",
    abbreviation: "FPBM-Murcia",
    regions: ["Murcia"],
    website: "https://fpbmurcia.com",
    email: null,
    phone: null,
    address: null,
    president: null,
    description:
      "Federación que coordina las peñas barcelonistas en la Región de Murcia.",
    memberCount: null,
    zone: "Zona 19",
  },
  {
    name: "Federación de Peñas Barcelonistas Galegas",
    abbreviation: "FPBG",
    regions: ["Galicia"],
    website: null,
    email: null,
    phone: null,
    address: null,
    president: null,
    description:
      "Federación que agrupa las peñas barcelonistas de Galicia.",
    memberCount: null,
    zone: "Zona 27",
  },
  {
    name: "Federación de Peñas Barcelonistas de Euskadi - Beti Barça",
    abbreviation: "Beti Barça",
    regions: ["País Vasco"],
    website: null,
    email: null,
    phone: null,
    address: null,
    president: null,
    description:
      "Federación de peñas barcelonistas del País Vasco, conocida como 'Beti Barça'.",
    memberCount: null,
    zone: "Zona 28",
  },
  {
    name: "Federación de Peñas Barcelonistas de Baleares",
    abbreviation: "FPBB",
    regions: ["Islas Baleares"],
    website: null,
    email: null,
    phone: null,
    address: null,
    president: null,
    description:
      "Federación que agrupa las peñas barcelonistas de las Islas Baleares.",
    memberCount: null,
    zone: "Zona 18",
  },
  {
    name: "Federación de Peñas Barcelonistas de Canarias",
    abbreviation: "FPBC",
    regions: ["Canarias"],
    website: null,
    email: null,
    phone: null,
    address: null,
    president: null,
    description:
      "Federación que coordina las peñas barcelonistas en las Islas Canarias.",
    memberCount: null,
    zone: "Zona 29",
  },
  {
    name: "Federación de Peñas Barcelonistas de Castilla y León",
    abbreviation: "FPBCyL",
    regions: ["Castilla y León"],
    website: null,
    email: null,
    phone: null,
    address: null,
    president: null,
    description:
      "Federación que agrupa las peñas barcelonistas de Castilla y León.",
    memberCount: null,
    zone: "Zona 24",
  },
  {
    name: "Federación de Peñas Barcelonistas de Extremadura",
    abbreviation: "FPBE",
    regions: ["Extremadura"],
    website: null,
    email: null,
    phone: null,
    address: null,
    president: null,
    description:
      "Federación que agrupa las peñas barcelonistas de Extremadura.",
    memberCount: null,
    zone: "Zona 22",
  },
  {
    name: "Federación de Peñas Barcelonistas de Asturias y Cantabria",
    abbreviation: "FPBAyC",
    regions: ["Asturias", "Cantabria"],
    website: null,
    email: null,
    phone: null,
    address: null,
    president: null,
    description:
      "Federación que agrupa las peñas barcelonistas de Asturias y Cantabria.",
    memberCount: null,
    zone: "Zona 26",
  },
  {
    name: "Federación de Peñas Barcelonistas de la Comunitat Valenciana",
    abbreviation: "FPBCV",
    regions: ["Comunitat Valenciana"],
    website: null,
    email: null,
    phone: null,
    address: null,
    president: null,
    description:
      "Federación que agrupa las peñas barcelonistas de la Comunitat Valenciana.",
    memberCount: null,
    zone: "Zona 17",
  },
  {
    name: "Agrupació de Penyes Barcelonistes de Catalunya",
    abbreviation: "APBC",
    regions: [
      "Catalunya",
      "Barcelona",
      "Girona",
      "Lleida",
      "Tarragona",
    ],
    website: null,
    email: null,
    phone: null,
    address: "Barcelona, Catalunya",
    president: null,
    description:
      "Organización que coordina las peñas barcelonistas dentro de Catalunya, compuesta por 13 zonas territoriales. Integrada en la Confederació Mundial.",
    memberCount: null,
    zone: "Zonas 1-13",
  },
];
