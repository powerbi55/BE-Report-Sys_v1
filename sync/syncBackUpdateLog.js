const pool = require("../config/mysql");
const ExternalUpdateLog = require("../models/mongo/UpdateLog");

module.exports = async function syncBackUpdateLog() {
  try {
    // ดึงเฉพาะรายการที่ยังไม่ sync
    const logs = await ExternalUpdateLog.find({ synced: { $ne: true } }).lean();

    if (!logs.length) {
      console.log("🔄 No logs to sync back.");
      return;
    }

    console.log(`🔄 Syncing ${logs.length} logs back to MySQL...`);

    for (const log of logs) {
      try {
        // INSERT พร้อม mongo_id เป็น _id ของ MongoDB
        const [result] = await pool.query(
          `
          INSERT INTO UpdateLog 
          (JOB_ID, User_ID, Action_type, Action_detail, Timestamp, mongo_id)
          VALUES (?, ?, ?, ?, ?, ?)
        `,
          [
            log.JOB_ID,
            log.User_ID,
            log.Action_type,
            log.Action_detail,
            log.Timestamp,
            log._id.toString() // ใช้ _id เป็น unique key
          ]
        );

        const mysqlId = result.insertId;

        // Mark ว่าส่งแล้ว
        await ExternalUpdateLog.updateOne(
          { _id: log._id },
          { $set: { synced: true, mysql_log_id: mysqlId } }
        );

        console.log(`✔ Sync OK → MongoID ${log._id} → MySQL LOG_ID ${mysqlId}`);

      } catch (err) {
        // ถ้าเคยส่งแล้วจะไม่ error
        if (err.code === "ER_DUP_ENTRY") {
          console.log(`⚠ Already synced (duplicate), marking synced: ${log._id}`);

          await ExternalUpdateLog.updateOne(
            { _id: log._id },
            { $set: { synced: true } }
          );

          continue;
        }

        console.error("❌ syncBackUpdateLog ERROR:", err);
      }
    }

    console.log("✔ Sync-back completed!");

  } catch (err) {
    console.error("❌ syncBackUpdateLog FAILED:", err);
  }
};
