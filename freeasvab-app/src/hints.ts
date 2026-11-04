export type Hint = { title: string; steps: string[]; trap?: string };

type Rule = { test: RegExp; hint: Hint };

const AR: Rule[] = [
  {
    test: /average|mean/i,
    hint: {
      title: "Averages",
      steps: ["Average = total ÷ number of items.", "To find a missing score, first find the total you need: target average × number of items.", "Subtract the scores you already have from that total."],
      trap: "Do not average the averages. Work with totals.",
    },
  },
  {
    test: /simple interest|interest/i,
    hint: {
      title: "Simple interest",
      steps: ["Use I = P × R × T.", "P is the starting amount, R is the yearly rate as a decimal (5% = 0.05), T is the time in years.", "If the question asks for the total, add the interest to P."],
      trap: "Change months to years first: 6 months = 0.5 year.",
    },
  },
  {
    test: /% off|percent off|discount|sale|tax|tip|commission/i,
    hint: {
      title: "Discounts and tax",
      steps: ["Find the percent of the price: price × percent as a decimal.", "Subtract it for a discount, add it for tax or a tip.", "With a discount and tax, do the discount first, then tax the sale price."],
      trap: "Two discounts in a row do not simply add: 20% off then 10% off is not 30% off.",
    },
  },
  {
    test: /percent|%/i,
    hint: {
      title: "Percents",
      steps: ["Write the sentence as math: \"what is 20% of 50\" → 0.20 × 50.", "Percent change = (new − old) ÷ old × 100.", "To find the whole from a part: part ÷ percent as a decimal."],
      trap: "Percent change always divides by the ORIGINAL amount.",
    },
  },
  {
    test: /together|working alone|fill.*tank|crew|can paint|can finish/i,
    hint: {
      title: "Work together",
      steps: ["Each worker does 1 ÷ (their time) of the job per hour.", "Add the rates, then flip the result to get the time.", "Shortcut for two workers: (A × B) ÷ (A + B)."],
      trap: "The answer must be LESS than the faster worker's time alone.",
    },
  },
  {
    test: /mph|miles per hour|speed|how far|travels|flies|drives|convoy|train/i,
    hint: {
      title: "Distance, rate and time",
      steps: ["Distance = rate × time.", "Rate = distance ÷ time; time = distance ÷ rate.", "Moving apart or toward each other: add the speeds. Same direction: subtract them."],
      trap: "Keep units the same: change minutes to hours before multiplying by miles per hour.",
    },
  },
  {
    test: /ratio|for every|proportion|scale|map/i,
    hint: {
      title: "Ratios and proportions",
      steps: ["Set up two equal fractions with matching units in the same places.", "Cross-multiply and solve.", "To split a total by a ratio a:b, divide the total by (a + b) to get one part, then multiply."],
      trap: "Keep the order of the ratio the same on both sides.",
    },
  },
  {
    test: /per hour|per week|earns|hourly|paycheck|salary/i,
    hint: {
      title: "Pay and rates",
      steps: ["Total = rate × number of units (hours, weeks).", "Overtime is usually 1.5 × the hourly rate for extra hours.", "Find the part asked for, then check whether the question wants a total or a difference."],
    },
  },
  {
    test: /how many .* needed|boxes|containers|trips|buses/i,
    hint: {
      title: "How many are needed",
      steps: ["Divide the total by how much one holds.", "If there is a remainder, round UP: you cannot use part of a box."],
      trap: "Rounding down leaves some items without a box.",
    },
  },
  {
    test: /left|remain|spend|spent/i,
    hint: {
      title: "Multi-step totals",
      steps: ["Do one step at a time and write down each result.", "When a fraction is \"of what is left\", take it of the new amount, not the starting amount.", "Re-read the last line: does it ask what was spent or what is left?"],
    },
  },
  {
    test: /\d{4} \(|24-hour|time will it be/i,
    hint: {
      title: "Military time",
      steps: ["Add hours to the first two digits and minutes to the last two.", "Every 60 minutes carries one hour; past 2400, start again at 0000."],
    },
  },
];

const MK: Rule[] = [
  {
    test: /solve for|solve:|what is \*?x\*?|if .*=/i,
    hint: {
      title: "Solving equations",
      steps: ["Get the x term alone: undo addition or subtraction on both sides.", "Then undo multiplication or division.", "Check by putting your answer back into the original equation."],
      trap: "Whatever you do to one side, do to the other.",
    },
  },
  {
    test: />|<|inequality/i,
    hint: {
      title: "Inequalities",
      steps: ["Solve it like an equation.", "If you multiply or divide both sides by a negative number, flip the inequality sign."],
    },
  },
  {
    test: /factor|multiply: \(|foil/i,
    hint: {
      title: "Multiplying and factoring",
      steps: ["FOIL: First, Outer, Inner, Last, then combine like terms.", "To factor x² + bx + c, find two numbers that multiply to c and add to b.", "Difference of squares: a² − b² = (a + b)(a − b)."],
    },
  },
  {
    test: /simplify:.*\^|exponent|\^|power/i,
    hint: {
      title: "Exponent rules",
      steps: ["Multiplying same bases: add the exponents.", "Dividing same bases: subtract the exponents.", "Power of a power: multiply the exponents. Anything to the 0 power is 1."],
    },
  },
  {
    test: /slope|line through|y = /i,
    hint: {
      title: "Slope and lines",
      steps: ["Slope = (y₂ − y₁) ÷ (x₂ − x₁): rise over run.", "In y = mx + b, m is the slope and b is where the line crosses the y-axis."],
      trap: "Subtract the coordinates in the same order on top and bottom.",
    },
  },
  {
    test: /hypotenuse|right triangle|legs/i,
    hint: {
      title: "Pythagorean theorem",
      steps: ["a² + b² = c², where c is the longest side (hypotenuse).", "Know the common triples: 3-4-5, 5-12-13, 8-15-17 and their multiples."],
    },
  },
  {
    test: /circle|radius|diameter|circumference/i,
    hint: {
      title: "Circles",
      steps: ["Area = π × r².", "Circumference = 2 × π × r (or π × diameter).", "The radius is half the diameter."],
      trap: "Check whether you were given the radius or the diameter.",
    },
  },
  {
    test: /area|perimeter|volume|square|rectangle|triangle|box/i,
    hint: {
      title: "Area, perimeter and volume",
      steps: ["Rectangle area = length × width; perimeter = add all sides.", "Triangle area = ½ × base × height.", "Box volume = length × width × height."],
      trap: "Area is in square units, volume in cubic units.",
    },
  },
  {
    test: /angle|°|supplementary|complementary/i,
    hint: {
      title: "Angles",
      steps: ["A triangle's angles add to 180°; a four-sided shape's add to 360°.", "Complementary angles add to 90°; supplementary angles add to 180°.", "A straight line is 180°."],
    },
  },
  {
    test: /square root|√/i,
    hint: { title: "Square roots", steps: ["Ask which number times itself gives the value.", "Learn the perfect squares from 1² to 15²."] },
  },
  {
    test: /prime|multiple|factor of|common/i,
    hint: {
      title: "Factors and multiples",
      steps: ["A prime number has only two factors: 1 and itself.", "Greatest common factor: the largest number that divides both.", "Least common multiple: the smallest number both divide into."],
    },
  },
  {
    test: /fraction|reciprocal|decimal|\/|\d\.\d/i,
    hint: {
      title: "Fractions and decimals",
      steps: ["To add fractions, get a common denominator first.", "To divide by a fraction, multiply by its reciprocal (flip it).", "Decimal to fraction: write it over 10, 100 or 1,000 and reduce."],
    },
  },
];

const EI: Rule[] = [
  {
    test: /ohm|volt|amper|current|resist/i,
    hint: {
      title: "Ohm's law",
      steps: ["V = I × R (volts = amps × ohms).", "Cover the one you want: I = V ÷ R, R = V ÷ I.", "Power: P = V × I (watts)."],
    },
  },
  {
    test: /series|parallel/i,
    hint: {
      title: "Series and parallel",
      steps: ["Series: resistances add; one path, so one break stops everything.", "Parallel: each branch gets the full voltage; two equal resistors give half of one.", "Parallel total: 1/R = 1/R₁ + 1/R₂ …, or (R₁ × R₂) ÷ (R₁ + R₂) for two."],
    },
  },
  {
    test: /watt|power|kilowatt/i,
    hint: { title: "Power", steps: ["P = V × I.", "Energy (kWh) = kilowatts × hours. 1 kW = 1,000 W."] },
  },
  {
    test: /transformer|turns/i,
    hint: { title: "Transformers", steps: ["Voltage changes by the turns ratio: output = input × (secondary turns ÷ primary turns).", "More secondary turns = step-up; fewer = step-down. Transformers need AC."] },
  },
];

const MC: Rule[] = [
  {
    test: /lever|fulcrum|seesaw|balance/i,
    hint: {
      title: "Levers",
      steps: ["Balance: weight × its distance = force × its distance from the fulcrum.", "Mechanical advantage = effort arm ÷ load arm.", "A longer handle means less force."],
    },
  },
  {
    test: /gear|teeth/i,
    hint: {
      title: "Gears",
      steps: ["Meshed gears turn in opposite directions; count the gears to find the last one's direction.", "Turns × teeth is the same for both gears.", "A bigger gear turns slower but with more force."],
    },
  },
  {
    test: /pulley|block|rope|strand|belt/i,
    hint: {
      title: "Pulleys and belts",
      steps: ["Count the rope strands holding up the load: that is the mechanical advantage.", "Force = load ÷ number of supporting strands.", "A belt makes the bigger pulley turn slower; a crossed belt reverses direction."],
    },
  },
  {
    test: /ramp|incline|slope|plane/i,
    hint: { title: "Ramps", steps: ["Mechanical advantage = ramp length ÷ height.", "Force = weight × height ÷ length. A longer, gentler ramp needs less force."] },
  },
  {
    test: /hydraulic|piston|pressure|fluid|pipe|water/i,
    hint: {
      title: "Fluids and pressure",
      steps: ["Pressure = force ÷ area, and it is the same everywhere in a closed system.", "Big piston force = small force × (big area ÷ small area).", "Water speeds up where a pipe narrows."],
    },
  },
  {
    test: /wheel|axle|screw|jack/i,
    hint: { title: "Wheel and axle, screws", steps: ["Wheel and axle: MA = wheel radius ÷ axle radius.", "Screws: threads closer together give more mechanical advantage."] },
  },
  {
    test: /work|foot-pound/i,
    hint: { title: "Work", steps: ["Work = force × distance moved in the direction of the force.", "No movement means no work, however hard you push."] },
  },
  {
    test: /spring/i,
    hint: { title: "Springs", steps: ["Stretch is proportional to force: find the stretch per pound, then multiply."] },
  },
  {
    test: /stable|tip|center of gravity|support/i,
    hint: { title: "Stability and supports", steps: ["Low center of gravity and wide base = most stable.", "A load in the middle of two supports is shared equally; closer to one support puts more on that support."] },
  },
];

const PC: Rule[] = [
  {
    test: /main (idea|point)|mostly about|best title|purpose/i,
    hint: {
      title: "Main idea questions",
      steps: ["Ask: what is the whole passage about, in one sentence?", "The main idea often appears in the first or last sentence.", "Reject answers that are true but cover only one detail."],
      trap: "An answer can be true and still be too narrow or too broad.",
    },
  },
  {
    test: /most nearly means|the word/i,
    hint: {
      title: "Word in context",
      steps: ["Reread the sentence with the word.", "Replace the word with each answer choice and see which keeps the meaning.", "Use the sentences around it as clues."],
    },
  },
  {
    test: /infer|implies|suggest|can be concluded|probably/i,
    hint: {
      title: "Inference questions",
      steps: ["The answer is not stated directly, but the passage must support it.", "Pick the choice that has to be true based on the text, not what might be true."],
      trap: "Do not use outside knowledge. Stay with what the passage says.",
    },
  },
  {
    test: /./,
    hint: {
      title: "Detail questions",
      steps: ["Find the key word from the question in the passage.", "Read the sentence where it appears and the one after.", "Choose the answer that matches what the passage actually says."],
      trap: "Watch for answers that use the passage's words but change the meaning.",
    },
  },
];

const SUBJECT: Record<string, Hint> = {
  WK: {
    title: "Vocabulary strategy",
    steps: [
      "Cover the choices and think of your own word that fits.",
      "Look for word parts: pre- (before), re- (again), un-/in-/dis- (not), -less (without), bene- (good), mal- (bad).",
      "If the word is in a sentence, use the sentence to guess the meaning.",
      "Decide if the word sounds positive or negative and cross off choices that do not match.",
    ],
    trap: "Pick the choice that means the SAME, not one that is just related.",
  },
  GS: {
    title: "Science strategy",
    steps: [
      "Find the key science term in the question and recall its definition.",
      "Cross off answers from a different area of science (a body part in a chemistry question, for example).",
      "Watch for NOT and EXCEPT questions: you are looking for the odd one out.",
    ],
  },
  AI: {
    title: "Auto strategy",
    steps: [
      "Identify which system the question is about: engine, cooling, fuel, electrical, brakes, steering, suspension or drivetrain.",
      "Think about what that system does and which part does each job.",
      "For symptoms, match the clue: smoke color, noise or warning light points to one system.",
    ],
  },
  SI: {
    title: "Shop strategy",
    steps: [
      "Picture the job being done, then pick the tool made for it.",
      "Saws: rip cuts with the grain, crosscut against it, hacksaw for metal, coping saw for curves.",
      "Fasteners: bolts take nuts, lock washers stop loosening, taps cut inside threads and dies cut outside threads.",
    ],
  },
  AO: {
    title: "Assembling Objects strategy",
    steps: [
      "Connection questions: note exactly where points A and B are on each shape, then find the choice where the line touches those same spots.",
      "Puzzle questions: count the pieces and match each one's shape and size.",
      "Pieces may be turned but not flipped over.",
    ],
  },
  GENERIC: {
    title: "General strategy",
    steps: ["Read the question twice and underline what it asks for.", "Cross off answers you know are wrong.", "If you must guess, guess: there is no penalty for a wrong answer, only for leaving it blank."],
  },
};

const RULES: Record<string, Rule[]> = { AR, MF: [...AR, ...MK], MK, EI, MC, PC };

export function hintFor(subtest: string, html: string): Hint {
  const text = html.replace(/<sup>/g, "^").replace(/<[^>]+>/g, " ").replace(/\s+/g, " ");
  for (const r of RULES[subtest] ?? []) if (r.test.test(text)) return r.hint;
  if (subtest === "AR") return { title: "Word problem method", steps: ["Find what the question asks for.", "List the numbers you are given and what they mean.", "Write the math in steps, then check that the answer makes sense."] };
  if (subtest === "MK" || subtest === "MF") return { title: "Math method", steps: ["Identify the topic: equation, exponents, geometry or number rules.", "Write each step; do not do it all in your head.", "Plug your answer back in to check it."] };
  if (subtest === "EI") return { title: "Electronics strategy", steps: ["Recall Ohm's law (V = I × R) and P = V × I.", "Know your symbols: zigzag = resistor, parallel lines = capacitor, arrow in a triangle = diode.", "Match the part to its job: fuses protect, capacitors store charge, diodes allow one-way flow."] };
  if (subtest === "MC") return { title: "Mechanical strategy", steps: ["Identify the machine: lever, pulley, gear, ramp, wheel and axle or fluid.", "Use its mechanical advantage rule.", "Ask whether the answer should be bigger or smaller than the load, and cross off the rest."] };
  return SUBJECT[subtest] ?? SUBJECT.GENERIC;
}
