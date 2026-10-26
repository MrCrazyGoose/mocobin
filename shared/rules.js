// Montgomery County, MD rules engine.
//
// Every item resolves to a disposal "stream". The streams mirror how the
// Montgomery County Department of Environmental Protection (DEP), Recycling
// and Resource Management Division, separates material: commingled
// containers go in the blue bin, paper goes in the mixed-paper cart, and
// hazardous, electronic and bulky material goes to the Shady Grove
// Processing Facility and Transfer Station.
//
// Rules change. Always confirm edge cases with the county:
// https://www.montgomerycountymd.gov/sws/

export const SHADY_GROVE = {
  name: 'Shady Grove Processing Facility and Transfer Station',
  address: '16101 Frederick Road, Derwood, MD 20855',
  mapsUrl:
    'https://www.google.com/maps/search/?api=1&query=16101+Frederick+Road+Derwood+MD+20855',
  infoUrl: 'https://www.montgomerycountymd.gov/sws/facilities/ts/',
};

export const COUNTY_INFO_URL = 'https://www.montgomerycountymd.gov/sws/';

// `short` is the text printed on the bin-label style badge. `color` is a
// signage color key (see src/lib/streamStyles.js).
export const STREAMS = {
  BLUE_BIN: {
    id: 'BLUE_BIN',
    label: 'Blue Bin',
    short: 'Blue bin',
    sublabel: 'Bottles, cans, jars, cartons, tubs',
    color: 'bin',
    description:
      'Curbside blue bin for empty, rinsed bottles, jars, cans, cartons and rigid plastic containers. Put them in loose, never in a bag.',
  },
  PAPER: {
    id: 'PAPER',
    label: 'Paper Cart',
    short: 'Paper',
    sublabel: 'Paper and cardboard',
    color: 'kraft',
    description: 'Curbside mixed-paper cart (or paper bin) for clean, dry paper and flattened cardboard.',
  },
  TRASH: {
    id: 'TRASH',
    label: 'Trash',
    short: 'Trash',
    sublabel: 'Not recyclable curbside',
    color: 'ink',
    description:
      'Regular trash. Montgomery County burns trash for energy at the Resource Recovery Facility, which is far better than spoiling a recycling load.',
  },
  STORE_DROPOFF: {
    id: 'STORE_DROPOFF',
    label: 'Store Drop-off',
    short: 'Store drop-off',
    sublabel: 'Plastic bags and film',
    color: 'hazard',
    description:
      'Many grocery stores have a plastic bag and film collection bin near the entrance. If you cannot get to one, use the trash. Never the blue bin.',
  },
  SHADY_GROVE_HHW: {
    id: 'SHADY_GROVE_HHW',
    label: 'Shady Grove: Hazardous Waste',
    short: 'Hazardous',
    sublabel: 'Household hazardous waste drop-off',
    color: 'stop',
    description: `Free household hazardous waste drop-off at the ${SHADY_GROVE.name}, ${SHADY_GROVE.address}.`,
  },
  SHADY_GROVE_ELECTRONICS: {
    id: 'SHADY_GROVE_ELECTRONICS',
    label: 'Shady Grove: Electronics',
    short: 'Electronics',
    sublabel: 'Electronics recycling',
    color: 'plum',
    description: `Electronics recycling at the ${SHADY_GROVE.name}, ${SHADY_GROVE.address}.`,
  },
  SHADY_GROVE_METAL: {
    id: 'SHADY_GROVE_METAL',
    label: 'Shady Grove: Scrap Metal',
    short: 'Scrap metal',
    sublabel: 'Scrap metal, tires and large items',
    color: 'rust',
    description: `Scrap metal, tires and bulky recyclables are accepted at the ${SHADY_GROVE.name}, ${SHADY_GROVE.address}.`,
  },
  YARD_TRIM: {
    id: 'YARD_TRIM',
    label: 'Yard Trim',
    short: 'Yard trim',
    sublabel: 'Leaves, grass, brush',
    color: 'leaf',
    description: 'Curbside yard trim collection in paper yard bags or reusable open containers. No plastic bags.',
  },
  FOOD_SCRAPS: {
    id: 'FOOD_SCRAPS',
    label: 'Food Scraps',
    short: 'Food scraps',
    sublabel: 'County program or compost, otherwise trash',
    color: 'leaf',
    description:
      'Use your county food scraps bin if your household is signed up, or a backyard compost pile. Otherwise, trash.',
  },
  DONATE: {
    id: 'DONATE',
    label: 'Donate',
    short: 'Donate',
    sublabel: 'Give it a second life',
    color: 'ash',
    description:
      'Usable items can be donated, including at the "Don\'t Dump, Donate" area at Shady Grove. Worn-out textiles go in textile drop-off bins.',
  },
  TAKE_BACK: {
    id: 'TAKE_BACK',
    label: 'Take-back Program',
    short: 'Take-back',
    sublabel: 'Special collection',
    color: 'stop',
    description: 'Use a take-back location, such as a police station drug drop box or a pharmacy kiosk.',
  },
};

// contaminationCheck:
//   'grease'  : scan the item for grease/food stains (cardboard, pizza boxes)
//   'residue' : container must be empty, rinsed and clean
//   null      : no visual check needed
//
// whenContaminated: where the item (or the contaminated part) goes when the
// check fails.
export const ITEMS = [
  // ---------- Mixed paper & cardboard ----------
  {
    id: 'pizza-box',
    name: 'Pizza box',
    keywords: ['pizza', 'pizza box', 'pizza pie'],
    material: 'cardboard',
    stream: 'PAPER',
    contaminationCheck: 'grease',
    whenContaminated: 'TRASH',
    prep: [
      'Remove all leftover food, crusts, wax paper and the plastic "pizza saver" table.',
      'Tear off grease-soaked sections and put them in the trash.',
      'Put the clean cardboard (usually the lid) in the mixed-paper cart.',
    ],
    tip: 'Grease soaks into paper fibers and cannot be washed out at the mill. A few spots can spoil a whole bale.',
  },
  {
    id: 'cardboard-box',
    name: 'Cardboard box (shipping / moving)',
    keywords: ['cardboard', 'box', 'shipping box', 'corrugated', 'amazon box', 'moving box', 'carton box', 'crate'],
    material: 'cardboard',
    stream: 'PAPER',
    contaminationCheck: 'grease',
    whenContaminated: 'TRASH',
    prep: [
      'Remove packing foam, bubble wrap and plastic air pillows.',
      'Flatten the box. Tape and shipping labels are OK.',
      'Keep it dry. Wet or food-stained cardboard goes in the trash.',
    ],
  },
  {
    id: 'paperboard',
    name: 'Cereal / cracker box (paperboard)',
    keywords: ['cereal box', 'cracker box', 'paperboard', 'tissue box', 'shoe box', 'packet'],
    material: 'cardboard',
    stream: 'PAPER',
    contaminationCheck: 'grease',
    whenContaminated: 'TRASH',
    prep: ['Remove and trash the plastic inner bag.', 'Flatten the box.'],
  },
  {
    id: 'newspaper',
    name: 'Newspaper, magazines & catalogs',
    keywords: ['newspaper', 'magazine', 'catalog', 'flyer', 'comic book', 'menu', 'paperback', 'book jacket'],
    material: 'paper',
    stream: 'PAPER',
    contaminationCheck: null,
    prep: ['Keep dry. Remove plastic sleeves and wrap.'],
  },
  {
    id: 'office-paper',
    name: 'Office paper, homework & mail',
    keywords: ['paper', 'printer paper', 'notebook paper', 'homework', 'mail', 'junk mail', 'envelope', 'letter', 'binder paper'],
    material: 'paper',
    stream: 'PAPER',
    contaminationCheck: null,
    prep: ['Envelopes with windows are fine.', 'Remove metal binder clips and plastic covers.'],
  },
  {
    id: 'shredded-paper',
    name: 'Shredded paper',
    keywords: ['shredded paper', 'shreds', 'confetti'],
    material: 'paper',
    stream: 'PAPER',
    contaminationCheck: null,
    prep: ['Put shredded paper in a closed paper bag (not plastic) so it does not blow away.'],
  },
  {
    id: 'paper-bag',
    name: 'Paper bag',
    keywords: ['paper bag', 'grocery paper bag', 'lunch bag'],
    material: 'paper',
    stream: 'PAPER',
    contaminationCheck: 'grease',
    whenContaminated: 'TRASH',
    prep: ['Empty, flat and dry.'],
  },
  {
    id: 'paper-towel',
    name: 'Used paper towels, napkins & tissues',
    keywords: ['paper towel', 'napkin', 'tissue', 'kleenex', 'toilet tissue', 'toilet paper'],
    material: 'soiled paper',
    stream: 'TRASH',
    contaminationCheck: null,
    prep: ['Used paper towels and napkins carry food or germs, so they go in the trash (or the food scraps bin if you are signed up).'],
    tip: 'Clean cardboard toilet-paper tubes can go in the mixed-paper cart.',
  },
  {
    id: 'paper-cup',
    name: 'Paper coffee cup',
    keywords: ['coffee cup', 'paper cup', 'to-go cup', 'starbucks cup', 'cup'],
    material: 'lined paper',
    stream: 'TRASH',
    contaminationCheck: null,
    prep: ['Paper cups have a plastic lining. When in doubt, throw it out.', 'A rigid plastic lid can be rinsed and put in the blue bin.'],
    tip: 'Bring a reusable cup. Many cafes give a discount for it.',
  },

  // ---------- Blue bin: commingled containers ----------
  {
    id: 'plastic-bottle',
    name: 'Plastic bottle (water, soda, juice)',
    keywords: ['plastic bottle', 'water bottle', 'soda bottle', 'pop bottle', 'juice bottle', 'gatorade', 'bottle'],
    material: 'plastic',
    stream: 'BLUE_BIN',
    contaminationCheck: 'residue',
    whenContaminated: 'TRASH',
    prep: ['Empty it completely.', 'Give it a quick rinse.', 'Put it in the blue bin loose, never in a bag.'],
  },
  {
    id: 'plastic-container',
    name: 'Plastic food container / tub (yogurt, takeout, berries)',
    keywords: ['plastic container', 'tub', 'yogurt', 'takeout container', 'clamshell', 'tupperware', 'deli container', 'berry container', 'tray'],
    material: 'plastic',
    stream: 'BLUE_BIN',
    contaminationCheck: 'residue',
    whenContaminated: 'TRASH',
    prep: [
      'Scrape out all the food.',
      'Give it a quick rinse to get sauce and grease off.',
      'It should be clean before it goes in the blue bin.',
    ],
    tip: 'One dirty container can contaminate an entire bin of otherwise good recyclables.',
  },
  {
    id: 'plastic-jug',
    name: 'Plastic jug (milk, detergent)',
    keywords: ['jug', 'milk jug', 'detergent', 'laundry jug', 'water jug', 'shampoo', 'lotion', 'soap', 'pill bottle'],
    material: 'plastic',
    stream: 'BLUE_BIN',
    contaminationCheck: 'residue',
    whenContaminated: 'TRASH',
    prep: ['Empty and rinse.', 'Pumps and sprayers go in the trash.'],
  },
  {
    id: 'aluminum-can',
    name: 'Aluminum can (soda, sparkling water)',
    keywords: ['aluminum can', 'soda can', 'can', 'beer can', 'seltzer'],
    material: 'metal',
    stream: 'BLUE_BIN',
    contaminationCheck: 'residue',
    whenContaminated: 'TRASH',
    prep: ['Empty and rinse.'],
  },
  {
    id: 'steel-can',
    name: 'Steel / tin food can',
    keywords: ['tin can', 'steel can', 'soup can', 'food can', 'canned', 'milk can'],
    material: 'metal',
    stream: 'BLUE_BIN',
    contaminationCheck: 'residue',
    whenContaminated: 'TRASH',
    prep: ['Empty and rinse.', 'Place the lid inside the can and pinch it closed for safety.'],
  },
  {
    id: 'aluminum-foil',
    name: 'Aluminum foil & foil trays',
    keywords: ['foil', 'aluminum foil', 'pie tin', 'foil tray'],
    material: 'metal',
    stream: 'BLUE_BIN',
    contaminationCheck: 'residue',
    whenContaminated: 'TRASH',
    prep: ['Wipe off food and grease first.', 'Ball up small pieces of foil so they do not get lost.'],
  },
  {
    id: 'aerosol-can',
    name: 'Aerosol can (empty)',
    keywords: ['aerosol', 'spray can', 'hair spray', 'whipped cream', 'deodorant spray', 'sunscreen spray'],
    material: 'metal',
    stream: 'BLUE_BIN',
    contaminationCheck: null,
    prep: ['Only when completely empty.', 'Never puncture or crush.', 'Partly full cans of paint or chemicals → Shady Grove hazardous waste.'],
  },
  {
    id: 'glass-bottle',
    name: 'Glass bottle or jar',
    keywords: ['glass bottle', 'glass jar', 'jar', 'beer bottle', 'wine bottle', 'sauce jar', 'pickle jar', 'whiskey jug', 'perfume'],
    material: 'glass',
    stream: 'BLUE_BIN',
    contaminationCheck: 'residue',
    whenContaminated: 'TRASH',
    prep: ['Empty and rinse.', 'Only bottles and jars. Drinking glasses, window glass and ceramics go in the trash.'],
  },
  {
    id: 'carton',
    name: 'Milk, juice & broth carton',
    keywords: ['carton', 'milk carton', 'juice box', 'broth', 'tetra pak', 'aseptic'],
    material: 'carton',
    stream: 'BLUE_BIN',
    contaminationCheck: 'residue',
    whenContaminated: 'TRASH',
    prep: ['Empty and rinse.', 'Cartons go in the blue bin with containers, not with paper.'],
  },

  // ---------- Plastic bags & film (never in blue bin) ----------
  {
    id: 'plastic-bag',
    name: 'Plastic grocery bag',
    keywords: ['plastic bag', 'grocery bag', 'shopping bag', 'bag', 'produce bag', 'bread bag', 'newspaper sleeve'],
    material: 'plastic film',
    stream: 'STORE_DROPOFF',
    alternateStream: 'TRASH',
    contaminationCheck: null,
    alert:
      'Montgomery County does not accept plastic bags in curbside recycling! Please bring this to a local grocery store drop-off or place it in the trash.',
    prep: [
      'Plastic bags wrap around the sorting machines and shut the line down.',
      'Never bag your recyclables. Empty them loose into the bin.',
      'Clean, dry bags can go to a grocery store bag drop-off.',
    ],
  },
  {
    id: 'plastic-film',
    name: 'Plastic wrap, film & bubble wrap',
    keywords: ['plastic wrap', 'cling wrap', 'saran', 'bubble wrap', 'shrink wrap', 'air pillow', 'film', 'ziploc', 'zipper bag'],
    material: 'plastic film',
    stream: 'STORE_DROPOFF',
    alternateStream: 'TRASH',
    contaminationCheck: null,
    alert:
      'Plastic film is not accepted in Montgomery County curbside recycling. Clean, dry film can go to a store drop-off; otherwise, trash.',
    prep: ['Clean and dry film → store drop-off.', 'Food-covered wrap → trash.'],
  },
  {
    id: 'chip-bag',
    name: 'Chip bag, candy wrapper & snack pouch',
    keywords: ['chip bag', 'chips', 'candy wrapper', 'wrapper', 'snack bag', 'pouch', 'juice pouch', 'capri sun'],
    material: 'multi-layer plastic',
    stream: 'TRASH',
    contaminationCheck: null,
    prep: ['Multi-layer foil/plastic packaging cannot be recycled curbside.'],
  },

  // ---------- Common trash items ("wish-recycling" traps) ----------
  {
    id: 'foam',
    name: 'Foam cup, tray or packing foam (polystyrene)',
    keywords: ['styrofoam', 'foam', 'polystyrene', 'packing peanuts', 'foam cup', 'foam tray', 'meat tray'],
    material: 'foam',
    stream: 'TRASH',
    contaminationCheck: null,
    prep: ['Foam is not accepted in the blue bin.', 'Packing peanuts can often be reused by local shipping stores.'],
  },
  {
    id: 'plastic-utensils',
    name: 'Plastic utensils & straws',
    keywords: ['fork', 'spoon', 'knife', 'utensil', 'straw', 'cutlery', 'spatula'],
    material: 'plastic',
    stream: 'TRASH',
    contaminationCheck: null,
    prep: ['Too small and light to sort. They fall through the machines.'],
  },
  {
    id: 'drinking-glass',
    name: 'Drinking glass, mug, ceramics & dishes',
    keywords: ['drinking glass', 'mug', 'coffee mug', 'ceramic', 'plate', 'bowl', 'dish', 'beer glass', 'goblet', 'pyrex', 'measuring cup', 'mixing bowl', 'soup bowl'],
    material: 'ceramic/glass',
    stream: 'TRASH',
    alternateStream: 'DONATE',
    contaminationCheck: null,
    prep: [
      'Only glass bottles and jars go in the blue bin. Drinking glasses and ceramics melt at different temperatures.',
      'Wrap broken pieces before putting them in the trash. Donate usable dishes.',
    ],
  },
  {
    id: 'food-scraps',
    name: 'Food scraps',
    keywords: ['food', 'banana', 'apple', 'orange', 'leftovers', 'peel', 'scraps', 'bagel', 'pretzel', 'burger', 'cheeseburger', 'hotdog', 'broccoli', 'cucumber', 'lemon', 'strawberry', 'pineapple', 'bread', 'mashed potato', 'burrito', 'granny smith', 'cabbage'],
    material: 'organic',
    stream: 'FOOD_SCRAPS',
    alternateStream: 'TRASH',
    contaminationCheck: null,
    prep: ['Never in the blue bin or paper cart.', 'County food scraps bin if enrolled, backyard compost, or trash.'],
  },
  {
    id: 'diaper',
    name: 'Diapers & wipes',
    keywords: ['diaper', 'wipes', 'baby wipes'],
    material: 'mixed',
    stream: 'TRASH',
    contaminationCheck: null,
    prep: ['Trash only. "Flushable" wipes should not be flushed either.'],
  },
  {
    id: 'garden-hose',
    name: 'Hoses, cords, string lights ("tanglers")',
    keywords: ['hose', 'garden hose', 'rope', 'string lights', 'christmas lights', 'extension cord', 'chain', 'cable', 'cord'],
    material: 'tangler',
    stream: 'SHADY_GROVE_METAL',
    alternateStream: 'TRASH',
    contaminationCheck: null,
    alert: 'Tanglers wrap around recycling equipment. Never put hoses, cords or string lights in the blue bin.',
    prep: ['Cords and string lights can go to Shady Grove scrap metal / electronics.', 'Garden hoses go in the trash.'],
  },

  // ---------- Shady Grove: hazardous waste ----------
  {
    id: 'car-battery',
    name: 'Car battery (lead-acid)',
    keywords: ['car battery', 'lead acid', 'auto battery', 'vehicle battery'],
    material: 'hazardous',
    stream: 'SHADY_GROVE_HHW',
    contaminationCheck: null,
    alert: 'Car batteries are hazardous. They never go in trash or recycling. Take them to Shady Grove.',
    prep: ['Keep upright and transport in a sturdy box.', 'Do not tape over or drain the battery.'],
  },
  {
    id: 'household-battery',
    name: 'Household batteries (AA, AAA, rechargeable, lithium)',
    keywords: ['battery', 'batteries', 'aa', 'aaa', 'lithium', 'rechargeable', 'button battery', '9v'],
    material: 'hazardous',
    stream: 'SHADY_GROVE_HHW',
    contaminationCheck: null,
    alert: 'Batteries cause fires in recycling trucks and facilities. NEVER put any battery in the blue bin.',
    prep: [
      'Tape the terminals of lithium, rechargeable and 9-volt batteries.',
      'Bring rechargeable, lithium and button batteries to Shady Grove household hazardous waste.',
    ],
  },
  {
    id: 'paint',
    name: 'Paint, solvents & chemicals',
    keywords: ['paint', 'oil-based paint', 'stain', 'solvent', 'pesticide', 'bleach', 'cleaner', 'chemical', 'pool chemicals'],
    material: 'hazardous',
    stream: 'SHADY_GROVE_HHW',
    contaminationCheck: null,
    prep: ['Keep in original, sealed containers.', 'Fully dried-out latex paint cans can go in the trash with lids off.'],
  },
  {
    id: 'motor-oil',
    name: 'Motor oil, antifreeze & gasoline',
    keywords: ['motor oil', 'oil', 'antifreeze', 'gasoline', 'gas can', 'fuel'],
    material: 'hazardous',
    stream: 'SHADY_GROVE_HHW',
    contaminationCheck: null,
    prep: ['Bring in sealed, leak-proof containers.'],
  },
  {
    id: 'propane-tank',
    name: 'Propane tank & gas cylinders',
    keywords: ['propane', 'propane tank', 'gas cylinder', 'helium tank', 'camping fuel'],
    material: 'hazardous',
    stream: 'SHADY_GROVE_HHW',
    contaminationCheck: null,
    alert: 'Pressurized cylinders can explode in trucks. Take them to Shady Grove.',
    prep: ['Close the valve. Never put in trash or recycling.'],
  },
  {
    id: 'cfl-bulb',
    name: 'Fluorescent bulbs (CFL & tubes)',
    keywords: ['cfl', 'fluorescent', 'light bulb', 'tube light', 'bulb'],
    material: 'hazardous',
    stream: 'SHADY_GROVE_HHW',
    contaminationCheck: null,
    prep: ['Contains mercury, so keep it in one piece.', 'Standard incandescent and LED bulbs go in the trash.'],
  },
  {
    id: 'sharps',
    name: 'Needles & sharps',
    keywords: ['needle', 'syringe', 'sharps', 'lancet', 'epipen'],
    material: 'medical',
    stream: 'TRASH',
    contaminationCheck: null,
    alert: 'Never put needles in recycling. Sorting workers handle material by hand.',
    prep: ['Place in a hard plastic container (like a detergent jug), seal the lid with tape, label it "SHARPS, DO NOT RECYCLE", and put it in the trash.'],
  },
  {
    id: 'medication',
    name: 'Medications',
    keywords: ['medicine', 'medication', 'pills', 'prescription', 'drugs'],
    material: 'medical',
    stream: 'TAKE_BACK',
    contaminationCheck: null,
    prep: ['Use a drug take-back drop box (many police stations and pharmacies have one).', 'Do not flush.'],
  },

  // ---------- Shady Grove: electronics ----------
  {
    id: 'phone',
    name: 'Cell phone / tablet',
    keywords: ['phone', 'cell phone', 'cellphone', 'smartphone', 'iphone', 'ipad', 'tablet', 'ipod', 'hand-held computer', 'cellular telephone'],
    material: 'electronics',
    stream: 'SHADY_GROVE_ELECTRONICS',
    contaminationCheck: null,
    alert: 'Phones and tablets contain lithium batteries that can start fires. Never put them in the blue bin or trash.',
    prep: ['Back up and factory-reset your device.', 'Working devices can be donated.'],
  },
  {
    id: 'computer',
    name: 'Computers, laptops & accessories',
    keywords: ['laptop', 'computer', 'notebook computer', 'desktop computer', 'keyboard', 'computer keyboard', 'mouse', 'computer mouse', 'printer', 'modem', 'router', 'monitor', 'chromebook'],
    material: 'electronics',
    stream: 'SHADY_GROVE_ELECTRONICS',
    contaminationCheck: null,
    prep: ['Wipe personal data.', 'School-issued Chromebooks go back to your school, not to recycling!'],
  },
  {
    id: 'tv',
    name: 'TVs & screens',
    keywords: ['tv', 'television', 'screen', 'crt screen', 'flat screen'],
    material: 'electronics',
    stream: 'SHADY_GROVE_ELECTRONICS',
    contaminationCheck: null,
    prep: ['Transport carefully to avoid breaking the screen.'],
  },
  {
    id: 'small-electronics',
    name: 'Small electronics & appliances (remotes, chargers, fans, headphones)',
    keywords: ['remote control', 'remote', 'charger', 'headphones', 'earbuds', 'electric fan', 'fan', 'toaster', 'hair dryer', 'speaker', 'game controller', 'joystick', 'electronic'],
    material: 'electronics',
    stream: 'SHADY_GROVE_ELECTRONICS',
    contaminationCheck: null,
    prep: ['Remove loose batteries and take them to hazardous waste.'],
  },

  // ---------- Shady Grove: scrap metal & bulky ----------
  {
    id: 'pots-pans',
    name: 'Pots, pans & scrap metal',
    keywords: ['pot', 'pan', 'frying pan', 'wok', 'dutch oven', 'caldron', 'scrap metal', 'metal pipe', 'bike', 'bicycle'],
    material: 'scrap metal',
    stream: 'SHADY_GROVE_METAL',
    alternateStream: 'DONATE',
    contaminationCheck: null,
    prep: ['Only cans and foil go in the blue bin. Other metal goes to Shady Grove scrap metal.', 'Usable cookware can be donated.'],
  },
  {
    id: 'tire',
    name: 'Tires',
    keywords: ['tire', 'tyre', 'car tire'],
    material: 'rubber',
    stream: 'SHADY_GROVE_METAL',
    contaminationCheck: null,
    prep: ['Accepted at Shady Grove (limits and fees may apply).'],
  },

  // ---------- Other ----------
  {
    id: 'clothing',
    name: 'Clothing, shoes & textiles',
    keywords: ['clothes', 'clothing', 'shirt', 't-shirt', 'jersey', 'sweatshirt', 'jeans', 'jean', 'shoes', 'running shoe', 'sock', 'textile', 'towel', 'blanket'],
    material: 'textile',
    stream: 'DONATE',
    contaminationCheck: null,
    prep: ['Never in the blue bin.', 'Donate wearable items; worn-out textiles → textile drop-off bin.'],
  },
  {
    id: 'yard-trim',
    name: 'Leaves, grass & branches',
    keywords: ['leaves', 'grass', 'branches', 'yard waste', 'yard trim', 'brush', 'sticks', 'pumpkin', "jack-o'-lantern"],
    material: 'organic',
    stream: 'YARD_TRIM',
    contaminationCheck: null,
    prep: ['Use paper yard-waste bags or a reusable open container, not plastic bags.', 'Bundle branches no longer than 4 feet.'],
  },
  {
    id: 'books',
    name: 'Hardcover books',
    keywords: ['hardcover', 'book', 'textbook', 'binder'],
    material: 'paper',
    stream: 'DONATE',
    alternateStream: 'PAPER',
    contaminationCheck: null,
    prep: ['Donate usable books.', 'For worn-out hardcovers, remove the hard cover (trash) and recycle the pages in the mixed-paper cart.'],
  },
];

const ITEM_INDEX = new Map(ITEMS.map((item) => [item.id, item]));

export function getItem(id) {
  return ITEM_INDEX.get(id) || null;
}

export function getStream(id) {
  return STREAMS[id] || null;
}

function normalize(s) {
  return String(s || '')
    .toLowerCase()
    .replace(/[^a-z0-9'\s-]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

// Simple ranked search across names and keywords.
export function searchItems(query, limit = 12) {
  const q = normalize(query);
  if (!q) return ITEMS.slice(0, limit);
  const terms = q.split(' ');
  const scored = [];
  for (const item of ITEMS) {
    const name = normalize(item.name);
    const keywords = item.keywords.map(normalize);
    let score = 0;
    if (name === q || keywords.includes(q)) score += 100;
    if (name.startsWith(q)) score += 40;
    if (name.includes(q)) score += 25;
    if (keywords.some((k) => k.startsWith(q))) score += 30;
    for (const t of terms) {
      if (t.length < 2) continue;
      if (name.includes(t)) score += 8;
      if (keywords.some((k) => k.includes(t))) score += 6;
    }
    if (score > 0) scored.push({ item, score });
  }
  scored.sort((a, b) => b.score - a.score || a.item.name.localeCompare(b.item.name));
  return scored.slice(0, limit).map((s) => s.item);
}

// Combine an item with a contamination analysis result into a final verdict
// the UI can render. `contamination` is the output of analyzeImage() (or a
// manual override), shaped like { level: 'clean' | 'light' | 'heavy' | 'unknown' }.
export function decide(itemId, contamination = null) {
  const item = getItem(itemId);
  if (!item) return null;

  const verdict = {
    item,
    stream: getStream(item.stream),
    alternateStream: item.alternateStream ? getStream(item.alternateStream) : null,
    alert: item.alert || null,
    steps: [...item.prep],
    contaminated: false,
    split: false,
    reminder: null,
  };

  if (item.contaminationCheck === 'residue') {
    verdict.reminder =
      'Montgomery County blue bin rule: containers must be EMPTY, RINSED and CLEAN. Food residue contaminates the whole load.';
  }

  const level = contamination?.level;
  if (item.contaminationCheck && (level === 'light' || level === 'heavy')) {
    verdict.contaminated = true;
    if (item.contaminationCheck === 'grease') {
      if (level === 'light') {
        // Some sections are stained, so split the item.
        verdict.split = true;
        verdict.steps = [
          'Tear off the greasy or stained sections and put them in the trash.',
          `Put the clean cardboard in the ${getStream(item.stream).label.toLowerCase()}.`,
          ...item.prep.filter((p) => !/grease|clean cardboard/i.test(p)),
        ];
      } else {
        verdict.stream = getStream(item.whenContaminated);
        verdict.steps = [
          'This one is soaked with grease or food, so the whole thing goes in the trash.',
          'Greasy paper cannot be recycled. It ruins the paper bale.',
        ];
      }
    } else if (item.contaminationCheck === 'residue') {
      verdict.steps = [
        'There looks to be food or liquid left inside.',
        'Empty it and rinse it, then put it in the blue bin.',
        'If it will not come clean (baked-on food, for example), put it in the trash.',
      ];
    }
  }

  return verdict;
}
