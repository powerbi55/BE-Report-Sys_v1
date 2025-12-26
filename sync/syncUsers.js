const mysql = require("../config/mysql");
const ExternalUser = require("../models/mongo/UserCache");
const bcrypt = require("bcryptjs");

module.exports = async function syncUsers() {
  try {
    const [rows] = await mysql.execute("SELECT * FROM user");

    for (const row of rows) {
      // ตรวจว่ามีใน MongoDB ไหม
      const existing = await ExternalUser.findOne({ User_ID: row.User_ID });

      let hashedPassword = row.Password;

      // ตรวจว่ารหัสผ่านเป็น bcrypt hash อยู่แล้วหรือไม่
      const isBcrypt =
        typeof row.Password === "string" &&
        (row.Password.startsWith("$2a$") ||
         row.Password.startsWith("$2b$") ||
         row.Password.startsWith("$2y$"));

      // ⚡ ถ้าไม่ใช่ bcrypt → hash ด้วยค่า password ที่ได้จาก MySQL เช่น "hashed_pw_3"
      if (!isBcrypt) {
        hashedPassword = await bcrypt.hash(row.Password, 10);
      }

      if (!existing) {
        // สร้างใหม่ใน MongoDB
        await ExternalUser.create({
          User_ID: row.User_ID,
          Dep_ID: row.Dep_ID,
          Username: row.Username,
          Role: row.Role,
          Password: hashedPassword
        });
      } else {
        // อัปเดตใน MongoDB
        await ExternalUser.updateOne(
          { User_ID: row.User_ID },
          {
            $set: {
              Dep_ID: row.Dep_ID,
              Username: row.Username,
              Role: row.Role,
              Password: hashedPassword
            }
          }
        );
      }
    }

    console.log("Sync Users: Completed");

  } catch (err) {
    console.error("Sync Users Error:", err);
  }
};
