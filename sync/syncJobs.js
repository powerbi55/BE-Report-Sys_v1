const pool = require('../config/mysql');
const ExternalJob = require('../models/mongo/JobCache');

async function syncJobs() {
  try {
    const [rows] = await pool.query(`
      SELECT JOB_ID, User_ID, Dep_ID, Reporter_name, Reporter_ID, Reporter_phone,
             Title, Location, Description, DateStartReport, DateEndReport, Status,
             assigned_to, updated_at
      FROM jobs
    `);

    if (!rows.length) {
      console.log("syncJobs: no rows");
      return;
    }

    const ops = rows.map(row => ({
      updateOne: {
        filter: { JOB_ID: row.JOB_ID },
        update: { $set: row },
        upsert: true
      }
    }));

    await ExternalJob.bulkWrite(ops);

    console.log(`✔ syncJobs: ${rows.length} rows`);

  } catch (err) {
    console.error("syncJobs error", err);
  }
}

module.exports = syncJobs;
