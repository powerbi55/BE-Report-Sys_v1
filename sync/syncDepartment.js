const pool = require('../config/mysql');
const ExternalDepartment = require('../models/mongo/DepartmentCache');

async function syncDepartment() {
  try {
    // 1) ดึงข้อมูลจาก MySQL
    const [rows] = await pool.query(
      'SELECT Dep_ID, DepartmentName FROM department'
    );

    if (!rows || rows.length === 0) {
      console.log("❗ syncDepartment: No data found in MySQL");
      return;
    }

    // 2) เตรียมข้อมูลสำหรับ MongoDB (bulkWrite)
    const operations = rows.map(dep => ({
      updateOne: {
        filter: { Dep_ID: dep.Dep_ID },
        update: { $set: dep },
        upsert: true
      }
    }));

    // 3) Sync เข้า MongoDB
    await ExternalDepartment.bulkWrite(operations);

    console.log(`✔ syncDepartment: synced ${rows.length} departments`);
  } catch (err) {
    console.error("❌ syncDepartment error:", err);
  }
}

module.exports = syncDepartment;
