import bcrypt from "bcryptjs";
import crypto from "crypto";
import { Pool } from "pg";
import { normalizePhoneNumber } from "../utils/phone";

const url = process.env.SEED_DATABASE_URL;
if (!url) {
  console.error("Set SEED_DATABASE_URL to the database connection string.");
  process.exit(1);
}
const pool = new Pool({ connectionString: url });

type Plug = "GB/T" | "TYPE_2" | "CCS2";

const HOSTS = [
  { name: "Tigist Hailu", phone: "+251900000101" },
  { name: "Henok Desta", phone: "+251900000102" },
  { name: "Rahel Abate", phone: "+251900000103" },
  { name: "Mulugeta Bekele", phone: "+251900000104" },
];

const DRIVERS: { name: string; phone: string; make: string; model: string; plug: Plug; kwh: number }[] = [
  { name: "Bereket Alemu", phone: "+251900000201", make: "BYD", model: "Atto 3", plug: "CCS2", kwh: 60.5 },
  { name: "Selam Getachew", phone: "+251900000202", make: "Volkswagen", model: "ID.4", plug: "CCS2", kwh: 77 },
  { name: "Yonas Kebede", phone: "+251900000203", make: "Geely", model: "Geometry C", plug: "GB/T", kwh: 70 },
  { name: "Hana Mulugeta", phone: "+251900000204", make: "Hyundai", model: "Kona Electric", plug: "CCS2", kwh: 64 },
  { name: "Kaleb Assefa", phone: "+251900000205", make: "BYD", model: "Dolphin", plug: "GB/T", kwh: 60 },
  { name: "Meron Tadesse", phone: "+251900000206", make: "MG", model: "ZS EV", plug: "CCS2", kwh: 51 },
  { name: "Samuel Girma", phone: "+251900000207", make: "Kia", model: "Niro EV", plug: "CCS2", kwh: 64.8 },
  { name: "Liya Worku", phone: "+251900000208", make: "Zeekr", model: "001", plug: "GB/T", kwh: 86 },
];

const ALL_DAY: [string, string] = ["00:00:00", "23:59:59"];
const DAYTIME: [string, string] = ["06:00:00", "22:00:00"];

interface ChargerSeed {
  title: string;
  address: string;
  powerKw: number;
  plug: Plug;
  price: number;
  lat: number;
  lng: number;
  host: number;
  open: [string, string];
  ratings: number[];
}

// Coordinates are approximate for each neighbourhood; adjust if you like.
const CHARGERS: ChargerSeed[] = [
  { title: "Bole Medhanialem Fast Charger", address: "Near Edna Mall, Bole, Addis Ababa", powerKw: 22, plug: "CCS2", price: 18, lat: 8.9984, lng: 38.7892, host: 0, open: ALL_DAY, ratings: [5, 5, 4, 5, 5] },
  { title: "Kazanchis Executive EV Hub", address: "Menelik II Ave, Kazanchis, Addis Ababa", powerKw: 50, plug: "CCS2", price: 24, lat: 9.0182, lng: 38.7636, host: 1, open: ALL_DAY, ratings: [5, 4, 5, 4] },
  { title: "Piassa Parking Charger", address: "Behind Piassa Post Office, Arada, Addis Ababa", powerKw: 11, plug: "TYPE_2", price: 14, lat: 9.0357, lng: 38.7513, host: 2, open: DAYTIME, ratings: [4, 3, 4, 5] },
  { title: "Megenagna Roundabout Charge Point", address: "Near Megenagna Square, Yeka, Addis Ababa", powerKw: 30, plug: "GB/T", price: 16, lat: 9.0204, lng: 38.8002, host: 3, open: ALL_DAY, ratings: [5, 5, 5] },
  { title: "CMC Residential Charger", address: "CMC Road, Bole Sub-city, Addis Ababa", powerKw: 7, plug: "TYPE_2", price: 12, lat: 9.0299, lng: 38.8236, host: 0, open: DAYTIME, ratings: [4, 4, 3, 5, 4] },
  { title: "Sarbet EV Station", address: "Near Sarbet Square, Kolfe Keranio, Addis Ababa", powerKw: 22, plug: "CCS2", price: 17, lat: 8.9899, lng: 38.7385, host: 1, open: DAYTIME, ratings: [5, 4, 4, 5, 5, 4] },
  { title: "Gerji Mebrat Hayl Charger", address: "Gerji, near Mebrat Hayl, Addis Ababa", powerKw: 11, plug: "TYPE_2", price: 13, lat: 9.0043, lng: 38.8208, host: 2, open: DAYTIME, ratings: [3, 4, 3, 4] },
  { title: "Summit Gate Fast Charger", address: "Summit Condominium Road, Addis Ababa", powerKw: 60, plug: "CCS2", price: 26, lat: 9.0083, lng: 38.8372, host: 3, open: ALL_DAY, ratings: [4, 5, 5, 4] },
  { title: "Meskel Square Charge Hub", address: "Near Meskel Square, Kirkos, Addis Ababa", powerKw: 22, plug: "GB/T", price: 15, lat: 9.0107, lng: 38.7613, host: 1, open: DAYTIME, ratings: [2, 3, 4, 3] },
  { title: "Ayat Zone 5 Home Charger", address: "Ayat, Zone 5, Addis Ababa", powerKw: 7, plug: "TYPE_2", price: 11, lat: 9.023, lng: 38.89, host: 0, open: DAYTIME, ratings: [] },
];

const COMMENTS: Record<number, string[]> = {
  5: [
    "Fast and easy. The host was very welcoming.",
    "Charged quickly and the entrance was easy to find.",
    "Clean, safe parking and a smooth session.",
    "Payment was instant. Exactly as described.",
    "Great spot, I will be back.",
  ],
  4: [
    "Good charger, but the entrance was a little hard to find.",
    "Worked well. A bit more shade would be nice.",
    "Reliable and fairly priced.",
    "Fine experience, the host replied quickly.",
  ],
  3: [
    "Works, but charging was slower than listed.",
    "Okay overall, parking was a bit tight.",
  ],
  2: ["I had to wait for the host to arrive."],
};

async function main() {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const passwordHash = await bcrypt.hash(crypto.randomUUID(), 10); // unusable, nobody logs in as these

    const upsertUser = async (name: string, rawPhone: string, role: "HOST" | "DRIVER") => {
      const phone = normalizePhoneNumber(rawPhone);
      const res = await client.query(
        `INSERT INTO users (full_name, phone_number, password_hash, phone_verified_at)
         VALUES ($1, $2, $3, NOW())
         ON CONFLICT (phone_number) DO UPDATE SET full_name = EXCLUDED.full_name
         RETURNING id`,
        [name, phone, passwordHash],
      );
      const id = res.rows[0].id as string;
      await client.query(
        `INSERT INTO user_roles (user_id, role) VALUES ($1, $2) ON CONFLICT (user_id, role) DO NOTHING`,
        [id, role],
      );
      return { id, phone };
    };

    const hosts = [];
    for (const h of HOSTS) hosts.push(await upsertUser(h.name, h.phone, "HOST"));

    const drivers = [];
    for (const d of DRIVERS) {
      const u = await upsertUser(d.name, d.phone, "DRIVER");
      const existing = await client.query(`SELECT id FROM vehicles WHERE driver_id = $1 LIMIT 1`, [u.id]);
      let vehicleId: string;
      if (existing.rowCount && existing.rowCount > 0) {
        vehicleId = existing.rows[0].id;
      } else {
        const v = await client.query(
          `INSERT INTO vehicles (driver_id, make, model, battery_capacity_kwh, plug_type)
           VALUES ($1, $2, $3, $4, $5) RETURNING id`,
          [u.id, d.make, d.model, d.kwh, d.plug],
        );
        vehicleId = v.rows[0].id;
      }
      drivers.push({ ...u, vehicleId });
    }

    // Re-running replaces the previous demo chargers of these demo hosts only.
    const hostIds = hosts.map((h) => h.id);
    const old = await client.query(`SELECT id FROM chargers WHERE host_id = ANY($1::uuid[])`, [hostIds]);
    const oldIds: string[] = old.rows.map((r) => r.id);
    if (oldIds.length > 0) {
      const b = `(SELECT id FROM bookings WHERE charger_id = ANY($1::uuid[]))`;
      await client.query(`DELETE FROM payments WHERE booking_id IN ${b}`, [oldIds]);
      await client.query(`DELETE FROM host_payouts WHERE booking_id IN ${b}`, [oldIds]);
      await client.query(`DELETE FROM charging_sessions WHERE booking_id IN ${b}`, [oldIds]);
      await client.query(`DELETE FROM bookings WHERE charger_id = ANY($1::uuid[])`, [oldIds]); // reviews cascade
      await client.query(`DELETE FROM charger_schedules WHERE charger_id = ANY($1::uuid[])`, [oldIds]);
      await client.query(`DELETE FROM chargers WHERE id = ANY($1::uuid[])`, [oldIds]);
    }

    for (let ci = 0; ci < CHARGERS.length; ci++) {
      const c = CHARGERS[ci];
      const ch = await client.query(
        `INSERT INTO chargers (host_id, title, address_description, power_kw, plug_type,
                               price_per_kwh, is_active, location)
         VALUES ($1, $2, $3, $4, $5, $6, TRUE, ST_SetSRID(ST_MakePoint($7, $8), 4326)::geography)
         RETURNING id`,
        [hosts[c.host].id, c.title, c.address, c.powerKw, c.plug, c.price, c.lng, c.lat],
      );
      const chargerId = ch.rows[0].id as string;

      for (let day = 0; day <= 6; day++) {
        await client.query(
          `INSERT INTO charger_schedules (charger_id, day_of_week, start_time, end_time)
           VALUES ($1, $2, $3, $4) ON CONFLICT DO NOTHING`,
          [chargerId, day, c.open[0], c.open[1]],
        );
      }

      for (let j = 0; j < c.ratings.length; j++) {
        const rating = c.ratings[j];
        const driver = drivers[(ci + j) % drivers.length];
        const daysAgo = 2 + ci + j * 6;
        const start = new Date(Date.now() - daysAgo * 86400000);
        start.setUTCHours(5 + ((j * 2) % 9), 0, 0, 0); // 08:00 to 16:00 Addis time
        const end = new Date(start.getTime() + (60 + ((ci + j) % 3) * 30) * 60000);
        const energy = 8 + ((ci * 3 + j * 5) % 18);
        const finalCost = Number((energy * c.price).toFixed(2));

        const bk = await client.query(
          `INSERT INTO bookings (driver_id, charger_id, vehicle_id, start_time, end_time, status,
                                 price_per_kwh_at_booking, estimated_energy_kwh, estimated_cost, final_cost)
           VALUES ($1, $2, $3, $4, $5, 'COMPLETED', $6, $7, $8, $8)
           RETURNING id`,
          [driver.id, chargerId, driver.vehicleId, start, end, c.price, energy, finalCost],
        );
        const bookingId = bk.rows[0].id as string;

        await client.query(
          `INSERT INTO charging_sessions (booking_id, started_at, ended_at, energy_delivered_kwh)
           VALUES ($1, $2, $3, $4)`,
          [bookingId, start, end, energy],
        );

        await client.query(
          `INSERT INTO payments (booking_id, provider, provider_reference, idempotency_key, amount,
                                 currency, status, customer_phone, provider_status, completed_at)
           VALUES ($1, 'TELEBIRR', $2, $3, $4, 'ETB', 'SUCCEEDED', $5, 'SUCCEEDED', $6)`,
          [bookingId, `MOCK-TLB-SEED-${ci}-${j}`, crypto.randomUUID(), finalCost, driver.phone, end],
        );

        const pool5 = COMMENTS[rating];
        await client.query(
          `INSERT INTO reviews (booking_id, charger_id, driver_id, rating, comment, created_at)
           VALUES ($1, $2, $3, $4, $5, $6)`,
          [bookingId, chargerId, driver.id, rating, pool5[(ci + j) % pool5.length], new Date(end.getTime() + (2 + j) * 3600000)],
        );
      }

      const avg = c.ratings.length ? (c.ratings.reduce((a, b) => a + b, 0) / c.ratings.length).toFixed(1) : "no reviews";
      console.log(`✓ ${c.title}: ${c.ratings.length} reviews, average ${avg}`);
    }

    await client.query("COMMIT");
    console.log("\nDone. Demo chargers and reviews are in the database.");
  } catch (err) {
    await client.query("ROLLBACK");
    console.error("Seed failed:", err);
    process.exitCode = 1;
  } finally {
    client.release();
    await pool.end();
  }
}

main();