export type Hint = { title: string; steps: string[]; trap?: string };

type Rule = { test: RegExp; hint: Hint };

const r = (test: RegExp, title: string, steps: string[], trap?: string): Rule => ({ test, hint: { title, steps, trap } });

const PROBABILITY = r(
  /probab|at random|chance|dice|\bdie\b|marble|deck|socks/i,
  "Probability",
  [
    "Probability = number of ways you want ÷ total number of possible outcomes.",
    "For two events in a row, multiply their probabilities.",
    "Without replacement, the second draw has one fewer item in the total (and maybe one fewer of the kind you want).",
  ],
  "Two dice have 36 possible outcomes, not 12.",
);

const AVERAGE = r(
  /average|\bmean\b|median|\bmode\b/i,
  "Averages",
  [
    "Mean (average) = total ÷ number of items.",
    "To find a missing value, first find the total you need: target average × number of items, then subtract what you already have.",
    "Median: put the numbers in order and take the middle one (or the average of the two middle ones).",
  ],
  "Do not average the averages. Work with totals.",
);

const AR: Rule[] = [
  PROBABILITY,
  r(
    /years old|as old as|\bages?\b/i,
    "Age problems",
    [
      "Let x be one person's age now and write the other person's age in terms of x.",
      "\"In 5 years\" adds 5 to BOTH ages; \"5 years ago\" subtracts 5 from both.",
      "Turn the sentence into an equation and solve for x, then answer the question asked.",
    ],
    "Check which person's age the question actually wants.",
  ),
  r(
    /consecutive/i,
    "Consecutive numbers",
    [
      "Call the numbers x, x + 1, x + 2. For consecutive even or odd numbers use x, x + 2, x + 4.",
      "Add them and set the sum equal to the total, then solve for x.",
      "Read again: does the question want the smallest, the middle or the largest?",
    ],
  ),
  r(
    /nickel|dime|quarter|coins|mixture|\bmix\b|mixed|blend|peanuts|cashews/i,
    "Two-unknown problems (coins and mixtures)",
    [
      "Let one amount be x and the other be (total − x).",
      "Write a value equation: (value of each) × (how many) for both kinds, added together, equals the total value.",
      "Solve for x and check your answer against both facts in the question.",
    ],
    "Work in cents for coin problems to avoid decimal mistakes.",
  ),
  AVERAGE,
  r(
    /simple interest|interest/i,
    "Simple interest",
    [
      "Interest = principal × rate × time (I = P × R × T).",
      "Write the rate as a decimal (5% = 0.05) and the time in years (6 months = 0.5).",
      "If the question asks for the total in the account, add the interest to the principal.",
    ],
  ),
  r(
    /% off|percent off|discount|on sale|sale price|sales tax|\btax\b|\btip\b|commission/i,
    "Discounts and tax",
    [
      "Find the percent of the price: price × percent as a decimal.",
      "Subtract it for a discount; add it for tax or a tip.",
      "With a discount and tax, take the discount first, then figure tax on the sale price.",
    ],
    "Two discounts in a row do not simply add: 20% off and then 10% off is not 30% off.",
  ),
  r(
    /percent|%/i,
    "Percents",
    [
      "Translate: \"what is 20% of 50\" means 0.20 × 50.",
      "Percent change = (new − old) ÷ old × 100.",
      "To find the whole from a part: part ÷ (percent as a decimal).",
    ],
    "Percent change always divides by the ORIGINAL amount.",
  ),
  r(
    /together|working alone|alone in|fills? (a|the) tank|pipe [ab]|crew|can paint|can finish/i,
    "Work together",
    [
      "Each worker does 1 ÷ (their time) of the job per hour.",
      "Add the rates, then flip the result to get the time together.",
      "Shortcut for two workers: (A × B) ÷ (A + B).",
    ],
    "Working together must take LESS time than the faster worker alone.",
  ),
  r(
    /every \d+ (minutes|hours|days).*every \d+|both .*(again|same time)|sound together/i,
    "When things line up again",
    ["Find the least common multiple (LCM) of the two time intervals.", "List multiples of the larger number until one is also a multiple of the smaller.", "Add that many minutes or hours to the starting time."],
  ),
  r(
    /\b[0-2]\d[0-5]\d\b[\s\S]*\b[0-2]\d[0-5]\d\b|military time|24-hour|time will it be|how long (was|is|did)/i,
    "Elapsed time (military time)",
    [
      "Count whole hours first, then the extra minutes.",
      "60 minutes make an hour; after 2400 the clock starts again at 0000.",
      "Crossing midnight: time to 2400, plus time after 0000.",
    ],
  ),
  r(
    /ladder|leans? against|diagonal|how high up/i,
    "Right triangles (Pythagorean theorem)",
    ["Draw it: the wall and ground make a right angle, and the ladder is the hypotenuse.", "Use a² + b² = c², with c the longest side.", "Know the common triples: 3-4-5, 5-12-13, 8-15-17 and their multiples."],
  ),
  r(
    /shadow|similar triangle/i,
    "Similar triangles (shadows)",
    ["Objects and their shadows at the same time make similar triangles.", "Set up a proportion: height ÷ shadow = height ÷ shadow.", "Cross-multiply and solve."],
    "Keep heights on top and shadows on the bottom on both sides.",
  ),
  r(
    /circular|circle|diameter|radius|\blap\b/i,
    "Circles",
    ["Circumference (distance around) = π × diameter = 2 × π × radius.", "Area = π × radius².", "The radius is half the diameter."],
    "Check whether you were given the radius or the diameter.",
  ),
  r(
    /cubic|volume|holds? .*gallons? per|shaped like a box/i,
    "Volume",
    ["Volume of a box = length × width × height.", "Convert units if needed (for example, how many gallons one cubic foot holds), then multiply."],
  ),
  r(
    /square (feet|foot|yards?|meters?|inches)|carpet|\btile|area|by \d+ feet/i,
    "Area and unit conversion",
    ["Area of a rectangle = length × width.", "1 square yard = 9 square feet (3 ft × 3 ft).", "Find the area in the units the price uses, then multiply by the price."],
    "Convert square feet to square yards by dividing by 9, not 3.",
  ),
  r(
    /\bmph\b|miles per hour|speed|how far|travels|flies|drives|convoy|train|knots/i,
    "Distance, rate and time",
    [
      "Distance = rate × time; rate = distance ÷ time; time = distance ÷ rate.",
      "Moving apart or toward each other: add the speeds. Same direction: subtract them.",
      "Keep units the same: change minutes to hours before using miles per hour.",
    ],
  ),
  r(
    /at (this|that|the same) (rate|pace|speed)|per gallon|mileage|pages per|per minute|best buy|uses \d+ gallons?|cost \$|for \$/i,
    "Unit rates",
    [
      "Find the amount for ONE unit first (one item, one gallon, one minute).",
      "Then multiply by how many units you need, or divide the money you have by the price of one.",
      "To compare deals, compare the price per unit.",
    ],
  ),
  r(
    /plus \$?[\d.]+ per|per day plus|flat fee|fee of/i,
    "Fixed cost plus a rate",
    ["Total = fixed amount + (rate × number of units).", "Do the multiplication first, then add the fixed part."],
  ),
  r(
    /ratio|for every|proportion|scale|map|blueprint|represents/i,
    "Ratios and proportions",
    [
      "Set up two equal fractions with matching units in the same places.",
      "Cross-multiply and solve.",
      "To split a total in the ratio a:b, divide the total by (a + b) to get one part, then multiply.",
    ],
    "Keep the order of the ratio the same on both sides.",
  ),
  r(
    /per hour|per week|earns|hourly|paycheck|salary|overtime/i,
    "Pay and rates",
    ["Total pay = rate × number of hours (or weeks).", "Overtime is usually 1.5 × the hourly rate for the extra hours.", "Check whether the question wants the total or the difference."],
  ),
  r(
    /how many .* needed|boxes|containers|trips|buses|vans/i,
    "How many are needed",
    ["Divide the total by how much one holds.", "If there is a remainder, round UP: you cannot use part of a box."],
    "Rounding down leaves some items without a box.",
  ),
  r(
    /cut into|pieces|lengths? of/i,
    "Splitting into pieces",
    ["Number of pieces = total length ÷ length of one piece.", "Write both lengths in the same unit first (inches or feet)."],
  ),
  r(
    /temperature|below zero|°F|°C|degrees|elevation|sea level|−\d/i,
    "Positive and negative numbers",
    ["Rising or adding moves up the number line; falling or subtracting moves down.", "From −8 up 21: −8 + 21 = 13.", "Subtracting a negative is the same as adding."],
  ),
  r(
    /left|remain|spend|spent|rest of/i,
    "Multi-step totals",
    ["Do one step at a time and write down each result.", "\"Of what is left\" means take the fraction of the NEW amount.", "Re-read the last line: spent or left?"],
  ),
  r(
    /in all|altogether|in total|total of|combined/i,
    "Totals",
    ["Add all the parts.", "Line up decimal points when adding decimals.", "Check that every part is in the same unit."],
  ),
  r(
    /cup|batch|full\b|half|third|fourth|fraction/i,
    "Fractions of an amount",
    ["\"Of\" means multiply: 3/4 of 60 = 3/4 × 60.", "\"Each\" times \"how many\" gives the total: multiply.", "Change mixed numbers to improper fractions before multiplying."],
  ),
];

const MK: Rule[] = [
  r(/[<>≤≥]|&lt;|&gt;|inequalit|solutions of/i, "Inequalities", ["Solve it like an equation.", "If you multiply or divide both sides by a NEGATIVE number, flip the sign.", "Check by testing a number from your answer in the original."]),
  r(/distance between/i, "Distance between two points", ["Find the change in x and the change in y.", "Distance = √[(change in x)² + (change in y)²].", "This is the Pythagorean theorem on a grid."]),
  r(/midpoint/i, "Midpoint", ["Average the x-values and average the y-values.", "Midpoint = ((x₁ + x₂) ÷ 2, (y₁ + y₂) ÷ 2)."]),
  r(
    /slope|line through|y = .*x|intercept/i,
    "Slope and lines",
    ["Slope = (y₂ − y₁) ÷ (x₂ − x₁): rise over run.", "In y = mx + b, m is the slope and b is where the line crosses the y-axis."],
    "Subtract the coordinates in the same order on top and bottom.",
  ),
  PROBABILITY,
  AVERAGE,
  r(/solve .* for [a-z]\b|formula/i, "Solving a formula for one letter", ["Treat every other letter like a number.", "Undo addition and subtraction first, then multiplication and division.", "Whatever you do to one side, do to the other."]),
  r(/× 10|scientific notation|standard form/i, "Scientific notation", ["A positive power of 10 moves the decimal point right; a negative power moves it left.", "To multiply, multiply the front numbers and ADD the powers of 10.", "4.2 × 10³ = 4,200."]),
  r(/[a-z] ?\^2 = \d+\b(?! ?[a-z])/i, "Solving x² = a number", ["Take the square root of both sides.", "Remember there are two answers: if x² = 49, then x = 7 or x = −7."]),
  r(
    /\^2 [+−-][\s\S]*= ?0|\^2 = \d*[a-z]|solution of .*\^2/i,
    "Quadratic equations",
    ["Move everything to one side so the equation equals 0.", "Factor: find two numbers that multiply to the last term and add to the middle coefficient.", "Set each factor equal to 0 and solve both. You can also test each answer choice."],
  ),
  r(
    /factor|expand|multiply: \(|foil|\([a-z] [+−] \d+\)\(|\([a-z] ?\^2 [+−]/i,
    "Multiplying and factoring",
    ["FOIL: First, Outer, Inner, Last, then combine like terms.", "To factor x² + bx + c, find two numbers that multiply to c and add to b.", "Difference of squares: a² − b² = (a + b)(a − b). Take out any common factor first."],
  ),
  r(/f\s?\(x\)|value of .* when|when [a-z] =|if [a-z] = /i, "Substituting values", ["Replace each letter with its number, using parentheses: f(−3) means put −3 everywhere x appears.", "Follow the order of operations: exponents, multiply and divide, then add and subtract."], "(−3)² = 9, but −3² = −9."),
  r(
    /\^|exponent|power|squared|cubed/i,
    "Exponent rules",
    ["Multiplying same bases: add the exponents.", "Dividing same bases: subtract the exponents.", "Power of a power: multiply the exponents. Anything to the 0 power is 1; a negative exponent means 1 over the positive power."],
    "(−3)² = 9 but −3² = −9: the parentheses matter.",
  ),
  r(/simplify|like terms|expression/i, "Simplifying expressions", ["Distribute first: 3(2x − 4) = 6x − 12.", "Then combine like terms: x-terms with x-terms, numbers with numbers.", "A minus sign in front of parentheses changes every sign inside."]),
  r(/a number|twice|less than|more than|product of|sum of|difference of/i, "Turning words into an equation", ["Let x be the unknown number.", "\"Twice\" means 2x; \"3 less than\" means − 3 AFTER the other part.", "Write the equation, then solve it."], "\"3 less than twice a number\" is 2x − 3, not 3 − 2x."),
  r(/solve|what is x|= \d|\bx\b.*=/i, "Solving equations", ["Get the x-term alone: undo addition or subtraction on both sides.", "Then undo multiplication or division.", "Check by putting your answer back into the original equation."], "Whatever you do to one side, do to the other."),
  r(/hypotenuse|right triangle|legs/i, "Pythagorean theorem", ["a² + b² = c², where c is the longest side (the hypotenuse).", "Know the common triples: 3-4-5, 5-12-13, 8-15-17 and their multiples."]),
  r(/circle|radius|diameter|circumference/i, "Circles", ["Area = π × r².", "Circumference = 2 × π × r (or π × diameter).", "The radius is half the diameter."], "Check whether you were given the radius or the diameter."),
  r(/area|perimeter|volume|square|rectangle|triangle|box|cube/i, "Area, perimeter and volume", ["Rectangle: area = length × width; perimeter = add all four sides.", "Triangle area = ½ × base × height.", "Box volume = length × width × height."], "Area uses square units; volume uses cubic units."),
  r(/angle|°|supplementary|complementary|parallel|quadrilateral|polygon/i, "Angles", ["A triangle's angles add to 180°; a four-sided shape's add to 360°.", "Complementary angles add to 90°; supplementary angles add to 180°.", "A straight line is 180°."]),
  r(/square root|√/i, "Square roots", ["Ask which number times itself gives the value.", "Learn the perfect squares from 1² to 15²."]),
  r(/prime|multiple|factor of|common|divisible/i, "Factors and multiples", ["A prime number has exactly two factors: 1 and itself.", "Greatest common factor: the largest number that divides both.", "Least common multiple: the smallest number both divide into."]),
  r(/% of|percent/i, "Percents", ["Change the percent to a decimal and multiply: 20% of 500 = 0.2 × 500.", "For a percent of a percent, multiply both decimals together."]),
  r(/greatest|least|largest|smallest|order/i, "Comparing numbers", ["Change every choice to a decimal.", "Line up the decimal points and compare digit by digit."]),
  r(/fraction|reciprocal|decimal|\d \d|÷/i, "Fractions and decimals", ["To add or subtract fractions, get a common denominator first.", "To divide by a fraction, multiply by its reciprocal (flip it).", "Change mixed numbers to improper fractions before multiplying or dividing."]),
  r(/−|negative/i, "Positive and negative numbers", ["Same signs: add and keep the sign. Different signs: subtract and keep the sign of the larger.", "Multiplying or dividing two negatives gives a positive.", "Subtracting a negative is the same as adding."]),
];

const EI: Rule[] = [
  r(/color band|color code|bands are|bands brown|which color/i, "Resistor color code", ["Colors stand for digits: black 0, brown 1, red 2, orange 3, yellow 4, green 5, blue 6, violet 7, gray 8, white 9.", "The first two bands are digits; the third band is how many zeros to add.", "Brown-black-red = 1, 0, then 2 zeros = 1,000 ohms."]),
  r(/transformer|turns/i, "Transformers", ["Voltage changes by the turns ratio: output = input × (secondary turns ÷ primary turns).", "More turns on the secondary = step-up; fewer = step-down.", "Transformers only work with AC."]),
  r(
    /series|parallel|branch/i,
    "Series and parallel",
    ["Series: resistances add; there is one path, so one break stops everything.", "Parallel: each branch gets the full voltage; two equal resistors give half of one.", "Two in parallel: (R₁ × R₂) ÷ (R₁ + R₂). Adding branches LOWERS total resistance."],
  ),
  r(/unit of|measured in|instrument|meter\b|ammeter|voltmeter|ohmmeter|milli|kilo(?!watt)|is equal to/i, "Units and meters", ["Voltage: volts (voltmeter, connected in parallel). Current: amperes (ammeter, connected in series). Resistance: ohms.", "Power is in watts; capacitance in farads; inductance in henrys.", "Milli = 1/1,000; kilo = 1,000; mega = 1,000,000."]),
  r(
    /diode|capacitor|inductor|coil|transistor|fuse|circuit breaker|rectif|semiconductor|relay|stor(es|e|ing) (electric(al)? )?(energy|charge)|one direction|alternating current into|ac into dc|change alternating|amplif|melting/i,
    "Components and what they do",
    ["Resistor limits current. Capacitor stores charge and blocks DC. Inductor (coil) opposes changes in current.", "Diode lets current flow one way; diodes in a rectifier turn AC into DC. Transistor amplifies or switches.", "Fuses and circuit breakers protect a circuit by opening it when current is too high."],
  ),
  r(/alternating|direct current|\bac\b|\bdc\b|household|hertz|frequency|battery|batteries/i, "AC and DC", ["Batteries give direct current (DC) that flows one way.", "Wall outlets in the U.S. give alternating current (AC) at about 120 volts and 60 hertz.", "Batteries in series add their voltages."]),
  r(/watt|power|kilowatt|energy/i, "Power and energy", ["Power P = V × I (watts = volts × amps).", "Energy in kilowatt-hours = kilowatts × hours. 1 kW = 1,000 W.", "To find current from watts: I = P ÷ V."]),
  r(/\d[\d,.]*\s*-?(volts?|v\b|ohms?|Ω|amps?|amperes?|milliamp)|current will|resistance increases|voltage doubles/i, "Ohm's law", ["V = I × R (volts = amps × ohms).", "Cover the one you want: I = V ÷ R, R = V ÷ I.", "More resistance at the same voltage means LESS current."]),
  r(/conduct|insulat|material/i, "Conductors and insulators", ["Metals such as copper, silver and aluminum conduct well (low resistance).", "Rubber, glass, plastic and dry wood are insulators.", "Current flows most easily through low resistance."]),
  r(/ground|wire|prong|neutral|\bhot\b|shock|outlet/i, "Wiring and safety", ["In U.S. wiring, black or red is usually hot, white is neutral, and green or bare copper is ground.", "The ground path carries fault current safely away from you."]),
  r(/electromagnet|magnetic field|magnet/i, "Magnetism and electromagnets", ["Current flowing through a wire makes a magnetic field around it.", "An electromagnet is a coil of wire around an iron core; more turns or more current make it stronger.", "Like poles repel; opposite poles attract."]),
  r(/symbol|schematic|zigzag/i, "Schematic symbols",["Zigzag = resistor. Two parallel lines = capacitor. Long and short lines = battery.", "Triangle pointing at a bar = diode. Coil of loops = inductor. A broken line with a lever = switch."]),
];

const MC: Rule[] = [
  r(/knife|wedge|axe|ax\b|chisel blade/i, "Wedges", ["A wedge turns a push into sideways force that splits material.", "A longer, thinner wedge needs less force."]),
  r(/lever|fulcrum|seesaw|balance|wheelbarrow|crowbar|pliers/i, "Levers", ["Balance: weight × its distance = force × its distance from the fulcrum.", "Mechanical advantage = effort arm ÷ load arm.", "First class: fulcrum in the middle. Second class: load in the middle. Third class: effort in the middle."]),
  r(/gear|teeth/i, "Gears", ["Meshed gears turn in opposite directions; count the gears to find the last one's direction.", "Turns × teeth is the same for both gears.", "A bigger gear turns slower but with more force."]),
  r(/pulley|block|rope|strand|belt/i, "Pulleys and belts", ["Count the rope strands holding up the load: that is the mechanical advantage.", "Force = load ÷ number of supporting strands. A single fixed pulley only changes direction.", "A belt makes the bigger pulley turn slower; a crossed belt reverses direction."]),
  r(/ramp|incline|inclined plane/i, "Ramps", ["Mechanical advantage = ramp length ÷ height.", "Force = weight × height ÷ length. A longer, gentler ramp needs less force."]),
  r(/hydraulic|piston|pressure|fluid|pipe|water|tank|float|buoyan|sink|density/i, "Fluids and pressure", ["Pressure = force ÷ area, and it is the same everywhere in a closed system.", "Big piston force = small force × (big area ÷ small area).", "Water speeds up where a pipe narrows, and pressure grows with depth."]),
  r(/wheel and axle|axle|screw|jack|threads/i, "Wheel and axle, screws", ["Wheel and axle: mechanical advantage = wheel radius ÷ axle radius.", "Screws: threads closer together give more mechanical advantage."]),
  r(/heated|expand|bimetal|thermal|temperature/i, "Heat and expansion", ["Most materials expand when heated and shrink when cooled.", "A bimetal strip bends toward the metal that expands LESS."]),
  r(/friction|bearing|lubric|slide|ice|roll/i, "Friction", ["Friction opposes motion between surfaces.", "Rolling (bearings, wheels) has much less friction than sliding; lubricants and smooth surfaces reduce it."]),
  r(/cam\b|crank|reciprocat|rotary/i, "Cams and cranks", ["A cam turns rotating motion into up-and-down motion.", "A crank and connecting rod change back-and-forth motion into rotation (and the reverse)."]),
  r(/rim|points? on a wheel|rotat|spin|center of the wheel|wheel makes|complete turn/i, "Rotation", ["Every point on a turning wheel makes the same number of turns.", "Points farther from the center travel farther and faster."]),
  r(/whirl|string breaks|in a circle|centripetal|centrifugal/i, "Circular motion", ["An object moving in a circle needs a pull toward the center to stay on the circle.", "If that pull stops, it flies off in a straight line in the direction it was moving at that moment (inertia)."]),
  r(/pendulum/i, "Pendulums", ["A longer pendulum swings more slowly; a shorter one swings faster.", "The weight of the bob does not change how fast it swings."]),
  r(/wide|spread|sink into|snowshoe/i, "Pressure and area", ["Pressure = force ÷ area.", "Spreading the same weight over a bigger area lowers the pressure, so wide tires and snowshoes sink in less."]),
  r(/least effort|arrangement|mechanical advantage/i, "Comparing mechanical advantage", ["Work out the mechanical advantage of each choice: strands for pulleys, arm lengths for levers, length ÷ height for ramps.", "The highest mechanical advantage needs the least effort."]),
  r(/work|foot-pound/i, "Work", ["Work = force × distance moved in the direction of the force.", "No movement means no work, however hard you push."]),
  r(/spring/i, "Springs", ["Stretch is proportional to force: find the stretch per pound, then multiply."]),
  r(/stable|tip|center of gravity|support|beam|board|plank|bridge|truss|strongest|frame|rigid|triangle/i, "Stability and structures", ["A low center of gravity and a wide base are most stable.", "A load centered between two supports is shared equally; nearer one support puts more weight on that support.", "A board standing on its edge is much stiffer than one lying flat."]),
];

const PC: Rule[] = [
  r(/main (idea|point)|mostly about|best title|purpose|primarily/i, "Main idea questions", ["Ask: what is the whole passage about, in one sentence?", "The main idea is often in the first or last sentence.", "Reject answers that are true but cover only one detail."], "An answer can be true and still be too narrow or too broad."),
  r(/most nearly means|the word/i, "Word in context", ["Reread the sentence with the word.", "Try each answer in place of the word and keep the one that fits the meaning.", "Use the sentences around it as clues."]),
  r(/infer|implies|suggest|concluded|probably|likely|supported/i, "Inference questions", ["The answer is not stated directly, but the passage must support it.", "Pick the choice that has to be true based on the text, not one that might be true."], "Do not use outside knowledge. Stay with what the passage says."),
  r(/./, "Detail questions", ["Find the key word from the question in the passage.", "Read that sentence and the one after it.", "Choose the answer that matches what the passage actually says."], "Watch for answers that reuse the passage's words but change the meaning."),
];

const GS: Rule[] = [
  r(/variable|hypothesis|experiment|control group|measures how/i, "The scientific method", ["The independent variable is what the scientist changes on purpose.", "The dependent variable is what gets measured as a result.", "A control group gets no change, so it can be compared with the others."]),
  r(/gene|allele|dominant|recessive|heterozygous|homozygous|dna|chromosome|mitosis|meiosis|living things|structure and function/i, "Genetics and cells", ["DNA is in the nucleus; genes come in pairs called alleles.", "Dominant alleles (B) hide recessive ones (b). Bb is heterozygous; BB and bb are homozygous.", "Mitosis makes two identical body cells; meiosis makes sex cells with half the chromosomes."]),
  r(/food chain|producer|consumer|decomposer|ecosystem|photosynth|herbivore|carnivore|species|genus|kingdom|eats|plants?\b|own food|vertebrate|mammal|reptile|amphibian|warm-blooded|cold-blooded|body temperature/i, "Living things and ecosystems", ["Producers (plants) make food from sunlight; consumers eat other living things; decomposers break down dead matter.", "Photosynthesis uses carbon dioxide, water and light to make glucose and oxygen.", "Scientific names are genus then species."]),
  r(/blood|heart|lung|kidney|liver|brain|bone|muscle|vitamin|disease|virus|bacteria|organ|digest|nerv|insulin|tendon|ligament|skin|cell|alveoli|artery|vein|body/i, "The human body", ["Match each organ or part to its job: heart pumps, lungs exchange gases, kidneys filter blood, small intestine absorbs food.", "Arteries carry blood away from the heart; veins bring it back.", "Viruses cause flu and colds; bacteria cause strep and tetanus."]),
  r(/atmosphere|weather|front|earthquake|tsunami|rock|mineral|mohs|tide|season|layer|volcano|erosion|cloud|humidity|crust|mantle|rotation|axis/i, "Earth science", ["Weather happens in the troposphere, the lowest layer of the atmosphere.", "Rock types: igneous (cooled melted rock), sedimentary (layers), metamorphic (changed by heat and pressure).", "Seasons come from the tilt of Earth's axis; tides come mostly from the Moon's gravity."]),
  r(/planet|moon|\bsun\b|star|galaxy|solar|orbit|light-year|eclipse|comet/i, "Space science", ["Order of planets: Mercury, Venus, Earth, Mars, Jupiter, Saturn, Uranus, Neptune.", "Jupiter is the largest planet; light from the Sun takes about 8 minutes to reach Earth."]),
  r(/atom|proton|neutron|electron|element|compound|\bph\b|acid|base|chemical|reaction|molecule|rust|periodic|isotope|\bion\b|solution|h ?2 ?o|example of a\(n\)|matter|mass|density|solid|liquid|\bgas\b|sublimat/i, "Chemistry and matter", ["Atomic number = number of protons; isotopes differ in neutrons; ions have gained or lost electrons.", "Mass is the amount of matter; density = mass ÷ volume, and things less dense than water float.", "pH below 7 is acidic, 7 is neutral, above 7 is basic. A chemical change makes a new substance; a physical change (melting, sublimation) does not."]),
  r(/newton|force|energy|wave|sound|light|heat|conduction|convection|radiation|electromagnetic|gravity|speed|velocity|accelerat|momentum|watt|magnet|inertia|boil|freez|melt|motion|scientist|electrical|unit measures/i, "Physics", ["Newton's laws: inertia; force = mass × acceleration; every action has an equal and opposite reaction.", "Heat moves by conduction (touch), convection (moving fluid) and radiation (waves).", "Sound needs a medium and travels fastest in solids; light is fastest of all."]),
];

const AI: Rule[] = [
  r(/stroke|piston|crankshaft|camshaft|valve|combustion|spark plug|diesel|cylinder|compression/i, "How the engine works", ["Four strokes: intake, compression, power, exhaust.", "Pistons turn the crankshaft; the camshaft opens the valves.", "Gasoline engines use spark plugs; diesels ignite fuel with the heat of compression."]),
  r(/radiator|coolant|thermostat|overheat|antifreeze|water pump/i, "Cooling system", ["Coolant carries heat from the engine to the radiator.", "The thermostat stays closed until the engine warms up; stuck closed means overheating.", "Antifreeze lowers the freezing point and raises the boiling point."]),
  r(/will not start|won't start|cranks normally|no-start/i, "Diagnosing a no-start", ["Cranks but will not start: the engine is missing fuel or spark (check fuel delivery and ignition).", "Will not crank at all: battery, cables or the starter.", "A single click with no crank usually means a weak battery or a bad connection."]),
  r(/battery|alternator|starter|click|charging|ignition coil|headlight|fuse|electrical energy|start the engine/i, "Electrical system", ["The battery stores energy to start the car; the alternator recharges it while the engine runs.", "A click with no crank usually means a weak battery or a bad connection."]),
  r(/brak|rotor|caliper|master cylinder|\bpads?\b|drum|abs/i, "Brakes", ["Disc brakes squeeze pads against a rotor; drum brakes push shoes against a drum.", "A spongy pedal means air in the lines; squealing often means worn pads."]),
  r(/shock|strut|spring|alignment|tire|steering|rack|tie rod|tread|camber|bounc|vibrat|balance/i, "Steering, suspension and tires", ["Shocks and struts control bouncing; alignment keeps the wheels pointed right.", "Center tread wear = overinflated; edge wear on both sides = underinflated; one edge = alignment."]),
  r(/transmission|clutch|differential|driveshaft|u-joint|axle|torque converter|gear/i, "Drivetrain", ["Manual transmissions use a clutch; automatics use a torque converter.", "The driveshaft and U-joints carry power to the rear axle; the differential lets wheels turn at different speeds in a turn."]),
  r(/fuel|injector|carburetor|exhaust|muffler|catalytic|smoke|emission|oxygen sensor/i, "Fuel and exhaust", ["Injectors spray fuel; the catalytic converter cleans exhaust; the muffler quiets it.", "Smoke color: blue = burning oil, black = too much fuel, white = coolant or condensation."]),
  r(/\boil\b|lubric/i, "Lubrication", ["The oil pump sends oil to moving parts; low oil pressure can ruin an engine in minutes.", "Oil also cools and cleans the engine."]),
  r(/scan tool|obd|code|warning light|check engine|gauge/i, "Diagnostics", ["The OBD-II port lets a scan tool read trouble codes.", "Stop right away for low oil pressure or overheating warnings."]),
];

const SI: Rule[] = [
  r(/saw\b|saws|hacksaw|coping|rip|crosscut/i, "Saws", ["Rip saw: with the grain. Crosscut saw: across the grain.", "Hacksaw: metal. Coping saw: curves and detail. Hole saw: large round holes."]),
  r(/tap\b|die\b|thread/i, "Threads", ["A tap cuts threads INSIDE a hole.", "A die cuts threads on the OUTSIDE of a rod."]),
  r(/level|plumb|square|micrometer|caliper|measure|tape|ruler|gauge/i, "Measuring and layout", ["A level shows horizontal and vertical; a plumb bob shows true vertical.", "A framing square checks 90° angles; a micrometer measures very small distances precisely."]),
  r(/bolt|nut|washer|screw\b|rivet|nail|fastener|anchor|penny|\b\d+d\b/i, "Fasteners", ["Bolts go through parts and take a nut; screws thread into the material.", "Lock washers stop nuts from loosening; flat washers spread the load.", "Nail sizes use \"penny\" (d): a bigger number is a longer nail."]),
  r(/hammer|mallet|chisel|punch|nail set/i, "Striking tools", ["Claw hammer: drive and pull nails. Ball-peen: shape metal and set rivets.", "Mallet: strike without marring, such as on chisel handles. Nail set: sink finish nails."]),
  r(/wrench|ratchet|socket|pliers|vise|clamp|torque|screwdriver|phillips|torx|allen|hex/i, "Turning and gripping tools", ["Use the tool made for the fastener: sockets and wrenches for nuts and bolts, the matching screwdriver tip for screws.", "Torque wrench: tighten to an exact value. Locking pliers: clamp and hold."]),
  r(/drill|bit|countersink|file\b|rasp|plane\b|grinder|sander|router|lathe/i, "Shaping and drilling", ["Countersink: seat a flat-head screw flush. Plane: shave wood smooth.", "Files from coarse to fine: rasp, bastard, second-cut, smooth."]),
  r(/wood|plywood|hardwood|softwood|metal|weld|solder|flux|alloy|steel|concrete/i, "Materials and joining", ["Hardwoods come from broad-leaved trees (oak, maple); softwoods from conifers (pine, fir).", "Plywood has crossed layers for strength. Flux protects a weld or solder joint from air."]),
  r(/safe|safety|goggles|guard|glasses/i, "Shop safety", ["Wear eye protection; keep guards on; keep loose clothing and gloves away from spinning parts.", "Unplug power tools before changing blades or bits."]),
];

const WK_VOCAB: Hint = {
  title: "Vocabulary strategy",
  steps: [
    "Cover the choices and think of your own word for it.",
    "Look for word parts: pre- (before), re- (again), un-/in-/dis- (not), -less (without), bene- (good), mal- (bad).",
    "Decide if the word sounds positive or negative and cross off choices that do not match.",
  ],
  trap: "Pick the choice that means the SAME, not one that is just related.",
};

const WK_CONTEXT: Hint = {
  title: "Words in context",
  steps: [
    "Read the whole sentence and guess the meaning from what happens in it.",
    "Swap each choice into the sentence; the right one keeps the meaning.",
    "Look for clue words like but, because or although that show contrast or cause.",
  ],
};

const AO_CONNECT: Hint = {
  title: "Connection questions",
  steps: [
    "Say where each point is in words: \"A is at a corner of the triangle; B is at the center of the circle.\"",
    "Check one shape at a time and cross out every choice where the line touches the wrong spot.",
    "Shapes may be turned but not flipped.",
  ],
};

const AO_PUZZLE: Hint = {
  title: "Puzzle questions",
  steps: ["Count the pieces in the first box.", "Match each piece's shape and size in the choices.", "Pieces may be turned but not flipped over."],
};

const FALLBACK: Record<string, Hint> = {
  AR: { title: "Word problem method", steps: ["Find what the question asks for.", "List the numbers you are given and what each means.", "Write the math in steps, then check that the answer makes sense."] },
  MK: { title: "Math method", steps: ["Identify the topic: equation, exponents, geometry or number rules.", "Write each step; do not do it all in your head.", "Plug your answer back in to check it."] },
  EI: { title: "Electronics strategy", steps: ["Recall Ohm's law (V = I × R) and P = V × I.", "Match the part to its job: fuses protect, capacitors store charge, diodes allow one-way flow."] },
  MC: { title: "Mechanical strategy", steps: ["Identify the machine: lever, pulley, gear, ramp, wheel and axle or fluid.", "Use its mechanical advantage rule.", "Ask whether the answer should be bigger or smaller than the load."] },
  GS: { title: "Science strategy", steps: ["Find the key science term and recall its definition.", "Cross off answers from a different area of science.", "Watch for NOT and EXCEPT: you want the odd one out."] },
  AI: { title: "Auto strategy", steps: ["Identify the system: engine, cooling, fuel, electrical, brakes, steering, suspension or drivetrain.", "Think about what each part in that system does."] },
  SI: { title: "Shop strategy", steps: ["Picture the job, then pick the tool made for it.", "Think about what material is being cut, joined or measured."] },
  GENERIC: { title: "General strategy", steps: ["Read the question twice and find exactly what it asks for.", "Cross off answers you know are wrong.", "If you must guess, guess: a blank is always wrong."] },
};

const RULES: Record<string, Rule[]> = { AR, MF: [...AR, ...MK], MK, EI, MC, PC, GS, AI, SI };

export function plainText(html: string) {
  return html
    .replace(/<sup>/g, "^")
    .replace(/<[^>]+>/g, " ")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&amp;/g, "&")
    .replace(/&#39;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/\s+/g, " ")
    .trim();
}

export function hintFor(subtest: string, html: string): Hint {
  const text = plainText(html);
  if (subtest === "WK") return /^\S+ most nearly means/i.test(text) ? WK_VOCAB : WK_CONTEXT;
  if (subtest === "AO") return /connected|points A and B/i.test(text) ? AO_CONNECT : AO_PUZZLE;
  for (const rule of RULES[subtest] ?? []) if (rule.test.test(text)) return rule.hint;
  return FALLBACK[subtest === "MF" ? "MK" : subtest] ?? FALLBACK.GENERIC;
}

export function isFallback(hint: Hint) {
  return Object.values(FALLBACK).includes(hint);
}
