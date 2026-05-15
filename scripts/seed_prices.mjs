/**
 * Seedet die price_eur Spalte mit aktuellen DE-Marktpreisen (UVP/Straßenpreis-Mittelwert).
 * Quellen: TT-Shop.com, Tischtennis.biz, Contra Sport — Stand Mai 2026.
 *
 * Strategie: Substring-Match auf Produktname, case-insensitive. Mehrere Varianten
 * (z.B. "Tenergy 05", "Tenergy 05 FX") werden separat gepflegt.
 */
import postgres from "postgres";

const BLADE_PRICES = {
  // Butterfly
  "Viscaria": 150,
  "Viscaria Super ALC": 230,
  "Viscaria Golden": 200,
  "Timo Boll ALC": 140,
  "Timo Boll ZLC": 250,
  "Timo Boll ZLF": 150,
  "Timo Boll Spirit": 130,
  "Timo Boll Forte": 75,
  "Timo Boll Allround": 50,
  "Timo Boll Off": 80,
  "Petr Korbel": 75,
  "Michael Maze": 150,
  "Primorac": 65,
  "Primorac Carbon": 130,
  "Zhang Jike": 150,
  "Zhang Jike ALC": 220,
  "Zhang Jike ZLC": 280,
  "Zhang Jike Super ZLC": 290,
  "Innerforce Layer ZLC": 200,
  "Innerforce Layer ALC": 140,
  "Innerforce Layer ALC.S": 160,
  "Innerforce ALC": 130,
  "Innerforce AL": 100,
  "Innerforce Layer ZLF": 130,
  "Sardius": 200,
  "Amultart ZL Carbon": 200,
  "Balsa Carbo X5": 100,
  "Schlager Carbon": 130,
  "Liu Shiwen": 130,
  "Freitas ALC": 150,
  "Revoldia CNF": 200,
  "Harimoto Innerforce ALC": 165,
  "Harimoto Innerforce Super ALC": 220,
  "Maze Advance": 70,
  "Maze Performance": 90,
  "Falcima": 60,
  "Korbel SK7": 70,
  "Grubba Pro": 75,
  "Tackiness Chop": 30, // Belag, falls verwechselt
  // DHS
  "Power-G PG7": 50,
  "Hurricane 301": 50,
  "Hurricane Long 5": 60,
  "Hurricane Long 3": 55,
  "Hurricane Long 2": 50,
  // Tibhar
  "Stratus Power Wood": 55,
  "Samsonov Force Pro Black Edition": 80,
  "Samsonov Force Pro": 70,
  "IV-L Black Edition": 130,
  "IV-L": 90,
  "Texo ALL": 30,
  "COS 3 Defensive": 55,
  "COS 4 Defensive": 60,
  "Zodiac Libra ZAC": 110,
  // Nittaku
  "Acoustic": 145,
  "Barwell Fleet": 80,
  "Violin": 80,
  "Septear": 100,
  "Septear OFF": 110,
  // Yasaka
  "Ma Lin Extra Offensive": 70,
  "Ma Lin Carbon": 100,
  "Sweden Extra": 55,
  "Sweden Allround": 50,
  // Donic
  "Waldner Senso Carbon": 130,
  "Waldner Ultra Senso Carbon": 130,
  "Waldner OFF World Champion 89": 70,
  "Persson Powerplay": 70,
  "Persson Powerallround": 65,
  "Defplay Senso": 90,
  "Defplay Classic Senso": 80,
  "Ovtcharov Carbospeed": 110,
  "Ovtcharov Innerforce ALC": 150,
  // Yinhe / Andro / Stiga / Xiom / Sanwei / OSP / Joola / Victas / Friendship
  "T-11+": 35,
  "T-11": 25,
  "Venus V-14 PRO": 70,
  "N-9": 25,
  "Hybrid Wood NCT": 110,
  "Allround Classic": 25,
  "Allround Classic CR": 35,
  "Offensive Classic (OC)": 50,
  "Offensive Classic Carbon": 80,
  "Clipper Wood": 50,
  "Stradivarius": 110,
  "FEXTRA 7": 30,
  "Virtuoso OFF-": 90,
  "Virtuoso OFF": 95,
  "Virtuoso AR": 100,
  "Rossi Emotion": 65,
  "Rosskopf Carbon": 65,
  "Energon Super PBO-c": 130,
  "Energon Power": 100,
  "Koki Niwa Wood": 100,
  "Koji Matsushita": 60,
  "Bomb": 30,
  "ZEUS Z+ALC": 50,
  "Black Balsa 7.0": 60,
  "Swat Power": 35,
  "X Star": 30,
  "XStar": 30,
  "Hayabusa ZL Pro": 200,
  "Hayabusa ZL": 180,
  "Celero": 70,
  "Celero Wood": 70,
  "Kinetic Speed": 100,
  "Kinetic Powerball": 90,
  "Treiber": 100,
  "Wanokiwami": 70,
  "Defplay": 70,
  "Tube Defensive WRB": 70,
  "Tube Defensive": 65,
  "PP ZEUS": 55,
};

const RUBBER_PRICES = {
  // Butterfly
  "Tenergy 05": 65,
  "Tenergy 05 FX": 65,
  "Tenergy 05 Hard": 75,
  "Tenergy 64": 65,
  "Tenergy 64 FX": 65,
  "Tenergy 80": 65,
  "Tenergy 80 FX": 65,
  "Tenergy 25": 65,
  "Tenergy 25 FX": 65,
  "Tenergy 19": 65,
  "Dignics 05": 75,
  "Dignics 09C": 75,
  "Dignics 64": 75,
  "Dignics 80": 80,
  "Sriver": 30,
  "Sriver FX": 30,
  "Sriver EL": 30,
  "Rozena": 35,
  "Flextra": 30,
  "Tackiness Chop": 30,
  "Tackiness Chop II": 32,
  "Tackiness Chop 2": 32,
  // Yasaka
  "Rakza 7": 38,
  "Rakza 7 Soft": 38,
  "Rakza X": 45,
  "Rakza X Soft": 45,
  "Rakza Z": 50,
  "Rakza Z Extra Hard": 55,
  "Mark V": 28,
  "Mark V HPS": 32,
  "Mark V GPS": 35,
  "Mark V XS": 30,
  "Mark V M2": 28,
  "Rising Dragon": 35,
  "Anti Power": 35,
  // Donic
  "Baracuda": 35,
  "Baracuda Big Slam": 38,
  "Bluefire M1": 40,
  "Bluefire M2": 40,
  "Bluefire M3": 40,
  "Acuda S1": 45,
  "Acuda S2": 42,
  "Acuda S3": 38,
  "Acuda P1 Turbo": 45,
  "Vario Big Slam": 22,
  "Vario": 22,
  "Slice 40": 22,
  "Slice 33": 22,
  "Akkadi Taichi": 22,
  // Xiom
  "Vega Europe": 30,
  "Vega Pro": 38,
  "Vega Tour": 45,
  "Vega Asia": 30,
  "Omega V Tour": 50,
  "Omega VII Tour": 55,
  "Omega VII Pro": 55,
  // Tibhar
  "Evolution MX-P": 45,
  "Evolution MX-S": 45,
  "Evolution EL-P": 38,
  "Evolution EL-S": 38,
  "Evolution FX-P": 38,
  "Hybrid K3": 48,
  "K3": 48,
  "Aurus Prime": 38,
  "Aurus Soft": 35,
  "Aurus Sound": 38,
  "Genius Sound": 35,
  "Genius Optimum": 38,
  "Quantum X Pro": 45,
  "Quantum S": 38,
  "Phantom X-Press": 30,
  "Phantom XPress": 30,
  // Andro
  "Rasant": 35,
  "Rasant PowerGrip": 38,
  "Rasanter R47": 50,
  "Rasanter R45": 50,
  "Rasanter R42": 50,
  "Rasanter R50": 55,
  "Rasanter R53": 55,
  "Hexer Powergrip": 38,
  "Hexer Grip": 38,
  "Hexer HD": 38,
  "Hexer Pips+": 40,
  "Hexer Duro": 38,
  // Nittaku
  "Fastarc G-1": 45,
  "Fastarc S-1": 45,
  "Fastarc C-1": 45,
  "Fastarc P-1": 45,
  "Hammond Z2": 38,
  "Hammond Speed FA": 35,
  "Hammond X": 35,
  "Moristo DF": 35,
  "Moristo SP": 35,
  "Ludeack": 65,
  // Stiga
  "Calibra LT": 35,
  "Calibra LT Sound": 35,
  "Calibra Tour M": 38,
  "Mantra M": 30,
  "Mantra H": 32,
  "DNA Pro M": 50,
  "DNA Pro H": 50,
  // DHS
  "Hurricane 3 (H3)": 25,
  "Hurricane 2 (H2)": 25,
  "Hurricane 8": 30,
  "Hurricane 9": 38,
  "Hurricane 3 National": 50,
  "Hurricane 3 Provincial": 35,
  "NEO Skyline 2 TG2": 25,
  "NEO Skyline 3 TG3": 25,
  "Gold Arc 8": 38,
  "Gold Arc 5": 35,
  // Friendship / Yinhe / Palio / Sanwei
  "729 Super FX": 18,
  "729 FX": 18,
  "729 Higher": 18,
  "729 Battle 2": 22,
  "729 Cross 729": 18,
  "729 OEM": 15,
  "Big Dipper": 28,
  "Moon": 18,
  "Sun": 18,
  "Big Dipper Pro": 32,
  "Pro 13": 30,
  "AK 47 Red": 18,
  "AK 47 Blue": 18,
  "AK 47 Yellow": 18,
  "Hidden Dragon Biotech": 22,
  "Gears": 22,
  "Sanwei Gears": 22,
  // Sauer & Troger / SpinLord (Material)
  "Secret Flow Chop": 32,
  "Marder II": 28,
  "Marder III": 30,
  "Marder": 25,
  // JOOLA
  "Energon Power Air": 38,
  "Rhyzer 48": 38,
  "Rhyzer 50": 38,
  "Rhyzer Pro 50": 50,
  "Dynaryz AGR": 50,
  "Dynaryz CMD": 50,
  "Maxxx-P": 38,
  "Express Two": 22,
  // Misc
  "Submarine": 28,
  "Superveloce V12 FX": 28,
};

const sql = postgres(process.env.DATABASE_URL, { ssl: "require" });

async function seedTable(table, priceMap) {
  let updated = 0;
  let skipped = 0;
  // Längere Namen zuerst, damit z.B. "Rakza Z Extra Hard" vor "Rakza Z" matched
  const sortedKeys = Object.keys(priceMap).sort((a, b) => b.length - a.length);
  const taken = new Set(); // ID-Set: jeder Eintrag bekommt nur EINEN Preis
  for (const key of sortedKeys) {
    const price = priceMap[key];
    // ILIKE mit Wildcards ergänzen, damit "Tenergy 05" auch "Butterfly Tenergy 05" etc. fängt
    const rows =
      table === "blades"
        ? await sql`SELECT id FROM blades WHERE name ILIKE ${"%" + key + "%"} AND price_eur IS NULL AND is_active = true`
        : await sql`SELECT id FROM rubbers WHERE name ILIKE ${"%" + key + "%"} AND price_eur IS NULL AND is_active = true`;
    for (const r of rows) {
      if (taken.has(r.id)) continue;
      taken.add(r.id);
      if (table === "blades") {
        await sql`UPDATE blades SET price_eur = ${price} WHERE id = ${r.id}`;
      } else {
        await sql`UPDATE rubbers SET price_eur = ${price} WHERE id = ${r.id}`;
      }
      updated++;
    }
  }
  console.log(`${table}: ${updated} updated`);
}

await seedTable("blades", BLADE_PRICES);
await seedTable("rubbers", RUBBER_PRICES);

const [bWith] = await sql`SELECT COUNT(*) FROM blades WHERE price_eur IS NOT NULL AND is_active = true`;
const [bAll] = await sql`SELECT COUNT(*) FROM blades WHERE is_active = true`;
const [rWith] = await sql`SELECT COUNT(*) FROM rubbers WHERE price_eur IS NOT NULL AND is_active = true`;
const [rAll] = await sql`SELECT COUNT(*) FROM rubbers WHERE is_active = true`;
console.log(`\nBlades mit Preis: ${bWith.count}/${bAll.count}`);
console.log(`Rubbers mit Preis: ${rWith.count}/${rAll.count}`);

await sql.end();
