const { MongoClient } = require("mongodb");

async function main() {
  const client = new MongoClient(process.env.DATABASE_URL || "mongodb://127.0.0.1:27017/trek_mng");
  await client.connect();
  const db = client.db();

  const resolveIds = async (collection) =>
    new Set(
      (await db.collection(collection).find({}, { projection: { _id: 1 } }).toArray()).map((x) =>
        x._id.toString()
      )
    );

  const userIds = await resolveIds("User");
  const trekIds = await resolveIds("Trek");
  const scheduleIds = await resolveIds("TrekSchedule");

  const bookings = await db.collection("Booking").find({}).toArray();
  const orphans = bookings.filter(
    (b) =>
      !userIds.has(b.userId?.toString()) ||
      !trekIds.has(b.trekId?.toString()) ||
      !scheduleIds.has(b.scheduleId?.toString())
  );

  if (orphans.length > 0) {
    const ids = orphans.map((b) => b._id);
    await db.collection("Booking").deleteMany({ _id: { $in: ids } });
    console.log("Deleted orphaned bookings:", orphans.map((b) => b.bookingId).join(", "));
  } else {
    console.log("No orphaned bookings found.");
  }

  await client.close();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});