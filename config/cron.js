const cron = require("node-cron");

// sync modules 
const syncJobs = require("../sync/syncJobs");
const syncUsers = require("../sync/syncUsers");
const syncDepartment = require("../sync/syncDepartment");

// sync-back modules
const syncBackUpdateLog = require("../sync/syncBackUpdateLog");
const syncBackJobs = require("../sync/syncBackJobs"); // ⭐ เพิ่มบรรทัดนี้

// clean MongoDB TTL
const deleteOldData = require("./deleteOldData");

// MySQL pool
const pool = require("../config/mysql");

function startCronJobs() {

  // ---------- Initial Sync ----------
  (async () => {
    console.log("⏳ Initial Sync Running...");
    try {
      await syncUsers();
      await syncDepartment();
      await syncJobs();
      console.log("✓ Initial Sync Completed");
    } catch (err) {
      console.error("Initial Sync Error:", err);
    }
  })();


  // ---------- Sync Every 5 Minutes ----------
  cron.schedule("*/5 * * * *", async () => {
    console.log(`⏰ Cron started at ${new Date().toLocaleString()}`);
    try {
      await syncUsers();
      await syncDepartment();
      await syncJobs();
      console.log(`✓ Cron completed at ${new Date().toLocaleString()}`);
    } catch (err) {
      console.error("Cron Sync Error:", err);
    }
  });


  // ---------- Sync-back Jobs (MongoDB → MySQL) ทุก 2 นาที ----------
  cron.schedule("*/2 * * * *", async () => {
    console.log(`🔄 Sync-back Jobs started at ${new Date().toLocaleString()}`);
    try {
      await syncBackJobs(); // ตอนนี้จะทำงานได้แล้ว!
      console.log("✓ Sync-back Jobs completed");
    } catch (err) {
      console.error("❌ Sync-back Jobs error:", err);
      console.error(err.stack);
    }
  });


  // ---------- Sync UpdateLog (MongoDB → MySQL) ทุก 5 นาที ----------
  cron.schedule("*/5 * * * *", async () => {
    console.log(`🔄 Sync-back UpdateLog started at ${new Date().toLocaleString()}`);
    try {
      await syncBackUpdateLog();
      console.log("✓ Sync-back UpdateLog completed");
    } catch (err) {
      console.error("Sync-back UpdateLog error:", err);
    }
  });


  // ---------- Cleanup MongoDB old data ----------
  cron.schedule("0 3 * * *", async () => {
    console.log("🧹 Clearing old MongoDB cache...");
    try {
      await deleteOldData();
      console.log("✓ MongoDB cache cleared");
    } catch (err) {
      console.error("Cache clear error:", err);
    }
  });


  // ---------- Cleanup MySQL UpdateLog older than 20 days ----------
  cron.schedule("0 2 * * *", async () => {
    console.log("🗑️ Auto clean MySQL UpdateLog (older than 20 days)...");
    try {
      const [result] = await pool.query(`
        DELETE FROM updatelog
        WHERE Timestamp < NOW() - INTERVAL 20 DAY
      `);

      console.log(`✓ MySQL UpdateLog cleaned: ${result.affectedRows} rows removed`);
    } catch (err) {
      console.error("❌ MySQL clean error:", err);
    }
  });

}

module.exports = startCronJobs;