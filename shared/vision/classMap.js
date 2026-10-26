// Maps MobileNet (ImageNet) class names to rule item ids.
//
// MobileNet returns labels such as "pop bottle, soda bottle" or
// "pizza, pizza pie". Each rule below is tested against the label; the first
// match wins, so put more specific patterns first.

const LABEL_RULES = [
  [/\bplastic bag\b/, 'plastic-bag'],
  [/\bpizza\b/, 'pizza-box'],
  [/\bcarton\b/, 'cardboard-box'],
  [/\bcrate\b/, 'cardboard-box'],
  [/\bpacket\b/, 'chip-bag'],
  [/\benvelope\b|\bmailbag\b/, 'office-paper'],
  [/\bcomic book\b|\bbook jacket\b|\bmenu\b|\bcrossword\b/, 'newspaper'],
  [/\bbinder\b/, 'books'],
  [/\bpaper towel\b|\btoilet tissue\b|\bhandkerchief\b/, 'paper-towel'],
  [/\bwater bottle\b|\bpop bottle\b/, 'plastic-bottle'],
  [/\bwater jug\b|\bpill bottle\b|\blotion\b|\bsoap dispenser\b|\bsunscreen\b/, 'plastic-jug'],
  [/\bbeer bottle\b|\bwine bottle\b|\bwhiskey jug\b|\bperfume\b/, 'glass-bottle'],
  [/\bhair spray\b/, 'aerosol-can'],
  [/\bmilk can\b/, 'steel-can'],
  [/\bbeer glass\b|\bgoblet\b|\bcoffee mug\b|\bmeasuring cup\b|\bmixing bowl\b|\bsoup bowl\b|\bplate\b(?! rack)/, 'drinking-glass'],
  [/\bcup\b/, 'paper-cup'],
  [/\btray\b/, 'plastic-container'],
  [/\bcellular telephone\b|\bipod\b|\bhand-held computer\b|\bdial telephone\b/, 'phone'],
  [/\blaptop\b|\bnotebook\b|\bdesktop computer\b|\bcomputer keyboard\b|\bmouse\b|\bprinter\b|\bmodem\b|\bmonitor\b/, 'computer'],
  [/\btelevision\b|\bscreen, crt screen\b/, 'tv'],
  [/\bremote control\b|\belectric fan\b|\bjoystick\b|\btoaster\b|\bhand blower\b|\bloudspeaker\b|\bmicrowave\b|\bvacuum\b|\biron, smoothing iron\b|\bcoffeemaker\b|\bespresso maker\b|\bwaffle iron\b|\bspace heater\b|\bcassette player\b|\bcd player\b|\btape player\b|\bradio, wireless\b|\bprojector\b|\bdigital clock\b|\bdigital watch\b|\breflex camera\b|\bpolaroid camera\b|\bcalculator\b|\bhair dryer\b/, 'small-electronics'],
  [/\bsyringe\b/, 'sharps'],
  [/\bfrying pan\b|\bwok\b|\bdutch oven\b|\bcaldron\b|\bcrock pot\b|\bbicycle\b/, 'pots-pans'],
  [/\bjersey\b|\bsweatshirt\b|\bjean\b|\brunning shoe\b|\bsock\b|\bcardigan\b|\bbath towel\b/, 'clothing'],
  [/\bdiaper\b/, 'diaper'],
  [/\bhose\b/, 'garden-hose'],
  [/\bjack-o'-lantern\b/, 'yard-trim'],
  [/\bhay\b|\bacorn\b(?! squash)|\bbuckeye\b|\bhip, rose hip\b|\bdaisy\b/, 'yard-trim'],
  // Every ImageNet fruit, vegetable, mushroom and prepared-food class.
  [
    /\bbanana\b|\borange\b|\bgranny smith\b|\blemon\b|\bpineapple\b|\bstrawberry\b|\bfig\b|\bpomegranate\b|\bjackfruit\b|\bcustard apple\b|\bsquash\b|\bzucchini\b|\bcucumber, cuke\b|\bhead cabbage\b|\bbroccoli\b|\bcauliflower\b|\bartichoke\b|\bbell pepper\b|\bcardoon\b|\bcorn\b|\bear, spike\b|\bmushroom\b|\bagaric\b|\bbolete\b|\bhen-of-the-woods\b|\bcoral fungus\b|\bgyromitra\b|\bbagel\b|\bpretzel\b|\bcheeseburger\b|\bhotdog\b|\bfrench loaf\b|\bmashed potato\b|\bburrito\b|\bguacamole\b|\bcarbonara\b|\bpotpie\b|\bmeat loaf\b|\btrifle\b|\bice cream\b|\bice lolly\b|\bdough\b|\bconsomme\b|\bhot pot\b|\bchocolate sauce\b/,
    'food-scraps',
  ],
];

export function mapLabelToItem(label) {
  const l = String(label || '').toLowerCase();
  for (const [re, id] of LABEL_RULES) {
    if (re.test(l)) return id;
  }
  return null;
}

// MobileNet is a general ImageNet model, not a waste classifier: some common
// items (soda cans, for example) have no class at all and come back as an
// unrelated low-confidence guess. Only auto-select an item above this
// confidence; below it, the UI asks the user to pick.
export const CONFIDENT = 0.3;

// Items most often scanned, offered as one-tap choices when unsure.
export const QUICK_PICKS = [
  'aluminum-can',
  'plastic-bottle',
  'plastic-container',
  'glass-bottle',
  'cardboard-box',
  'pizza-box',
  'plastic-bag',
  'paper-cup',
];

// predictions: [{ className, probability }] sorted by probability.
// Returns the best matching item id plus the prediction that produced it.
export function matchPredictions(predictions, minProbability = CONFIDENT) {
  for (const p of predictions || []) {
    if (p.probability < minProbability) continue;
    const itemId = mapLabelToItem(p.className);
    if (itemId) return { itemId, label: p.className, probability: p.probability };
  }
  return null;
}

// Candidate items for the "Is it one of these?" picker: the model's plausible
// low-confidence guesses first, then the common quick picks.
export function suggestItems(predictions, limit = 8, minProbability = 0.05) {
  const ids = [];
  for (const p of predictions || []) {
    if (p.probability < minProbability) continue;
    const id = mapLabelToItem(p.className);
    if (id && !ids.includes(id)) ids.push(id);
  }
  for (const id of QUICK_PICKS) if (!ids.includes(id)) ids.push(id);
  return ids.slice(0, limit);
}
