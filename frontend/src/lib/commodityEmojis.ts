export const commodityEmojis: Record<string, string> = {
  // Energy & Fuels
  crude_oil: "🛢️",
  refined_fuels: "⛽",
  natural_gas: "🔥",
  coal: "⚫",
  uranium: "☢️",
  biodiesel: "🌱",
  ethanol: "🧪",
  hydrogen: "💧",
  solar_panels: "☀️",
  wind_turbines: "💨",
  
  // Metals & Minerals
  steel: "🔩",
  iron_ore: "🪨",
  copper: "🔶",
  aluminum: "⚙️",
  gold: "🥇",
  silver: "🥈",
  platinum: "💍",
  palladium: "💎",
  titanium: "🛡️",
  zinc: "⚗️",
  nickel: "🪙",
  cobalt: "🔵",
  lithium: "🔋",
  rare_earths: "✨",
  manganese: "⚫",
  chromium: "🔘",
  tungsten: "⚙️",
  tin: "🥫",
  lead: "🔨",
  
  // Technology & Electronics
  semiconductors: "🔲",
  electronics: "📱",
  computers: "💻",
  smartphones: "📱",
  tablets: "📱",
  processors: "🖥️",
  memory_chips: "💾",
  displays: "🖥️",
  batteries: "🔋",
  circuit_boards: "🔌",
  fiber_optics: "💡",
  satellites: "🛰️",
  telecommunications: "📡",
  
  // Vehicles & Transportation
  automobiles: "🚗",
  trucks: "🚚",
  motorcycles: "🏍️",
  bicycles: "🚲",
  trains: "🚄",
  aircraft: "✈️",
  ships: "🚢",
  aerospace_components: "🚀",
  shipbuilding: "⚓",
  marine_equipment: "🛥️",
  tires: "⭕",
  auto_parts: "🔧",
  
  // Machinery & Equipment
  machinery: "⚙️",
  industrial_machinery: "🏭",
  construction_equipment: "🚜",
  agri_equipment: "🌾",
  mining_equipment: "⛏️",
  medical_devices: "🏥",
  robotics: "🤖",
  tools: "🔨",
  
  // Chemicals & Materials
  pharmaceuticals: "💊",
  vaccines: "💉",
  petrochemicals: "🧪",
  fertilizer: "🌱",
  pesticides: "🐛",
  plastics: "♻️",
  polymers: "🧬",
  chemicals: "⚗️",
  paint: "🎨",
  adhesives: "🔗",
  explosives: "💥",
  
  // Agriculture & Food
  wheat: "🌾",
  rice: "🍚",
  corn: "🌽",
  soybeans: "🫘",
  barley: "🌾",
  oats: "🥣",
  sugar: "🍬",
  coffee: "☕",
  tea: "🍵",
  cocoa: "🍫",
  spices: "🌶️",
  tobacco: "🚬",
  cotton: "☁️",
  vegetables: "🥬",
  fruits: "🍎",
  meat: "🥩",
  poultry: "🍗",
  seafood: "🐟",
  dairy: "🥛",
  cheese: "🧀",
  eggs: "🥚",
  
  // Oils & Fats
  palm_oil: "🌴",
  olive_oil: "🫒",
  sunflower_oil: "🌻",
  canola_oil: "🌼",
  soybean_oil: "🫘",
  
  // Beverages
  wine: "🍷",
  beer: "🍺",
  spirits: "🥃",
  soft_drinks: "🥤",
  bottled_water: "💧",
  
  // Textiles & Apparel
  textiles: "🧵",
  apparel: "👕",
  leather: "👢",
  footwear: "👟",
  silk: "🦋",
  wool: "🐑",
  
  // Wood & Paper
  timber: "🪵",
  lumber: "🌲",
  plywood: "📋",
  paper: "📄",
  cardboard: "📦",
  furniture: "🪑",
  
  // Construction Materials
  cement: "🏗️",
  concrete: "🧱",
  bricks: "🧱",
  glass: "🪟",
  ceramics: "🏺",
  marble: "🗿",
  granite: "🪨",
  
  // Minerals & Resources
  diamonds: "💎",
  gemstones: "💍",
  phosphate: "⚡",
  sulfur: "🟡",
  salt: "🧂",
  sand: "🏖️",
  gravel: "🪨",
  
  // Rubber & Polymers
  rubber: "⚫",
  synthetic_rubber: "🔴",
  latex: "💧",
  
  // Luxury & Consumer Goods
  luxury_goods: "💼",
  jewelry: "💍",
  watches: "⌚",
  cosmetics: "💄",
  perfumes: "🌸",
  toys: "🧸",
  sporting_goods: "⚽",
  musical_instruments: "🎸",
  
  // Services (represented symbolically)
  financial_services: "💰",
  insurance: "🛡️",
  consulting: "📊",
  software: "💻",
  cloud_services: "☁️",
  
  // Miscellaneous
  ammunition: "🔫",
  weapons: "⚔️",
  defense_systems: "🛡️",
};

export function getCommodityEmoji(commodityName: string): string {
  return commodityEmojis[commodityName.toLowerCase().replace(/\s+/g, "_")] || "📦";
}

export function formatCommodityName(commodityName: string): string {
  return commodityName
    .split("_")
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

export const allCommodities = Object.keys(commodityEmojis).sort();
