const pool = require("../config/mysql");
const ExternalJob = require("../models/mongo/JobCache");

async function syncBackJobs() {
  try {
    const jobs = await ExternalJob.find({
      updated_at: { $exists: true },
      synced_back: { $ne: true }
    }).lean();

    if (!jobs.length) {
      console.log("🔄 Sync-back: no updated jobs");
      return;
    }

    for (const job of jobs) {
      await pool.query(
        `UPDATE jobs SET 
          Title=?, 
          Location=?, 
          Description=?, 
          Status=?, 
          assigned_to=?, 
          Reporter_name=?, 
          Reporter_phone=?, 
          Reporter_ID=?, 
          DateEndReport=?,
          updated_at=?
         WHERE JOB_ID = ?`,
        [
          job.Title,
          job.Location,
          job.Description,
          job.Status,
          job.assigned_to,
          job.Reporter_name,
          job.Reporter_phone,
          job.Reporter_ID,
          job.DateEndReport,
          job.updated_at,
          job.JOB_ID
        ]
      );

      // mark as synced
      await ExternalJob.updateOne(
        { JOB_ID: job.JOB_ID },
        { $set: { synced_back: true } }
      );
    }

    console.log(`✔ Sync-back: updated ${jobs.length} jobs`);

  } catch (err) {
    console.error("Sync-back error:", err);
  }
}

module.exports = syncBackJobs;
