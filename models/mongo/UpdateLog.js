const mongoose = require("mongoose");

const ExternalUpdateLogSchema = new mongoose.Schema(
  {
    JOB_ID: Number,
    User_ID: Number,
    Action_type: String,
    Action_detail: String,
    Timestamp: { type: Date, default: Date.now },

    // บอกว่าซิงค์เข้า MySQL แล้วหรือยัง
    synced: { type: Boolean, default: false },

    // LOG_ID ที่ MySQL สร้างให้หลังซิงค์
    mysql_log_id: { type: Number, default: null }
  },
  { timestamps: true }
);

// TTL: ลบ log ออกจาก MongoDB หลัง 20 วัน
ExternalUpdateLogSchema.index(
  { Timestamp: 1 },
  { expireAfterSeconds: 20 * 24 * 60 * 60 }
);

module.exports = mongoose.model("ExternalUpdateLog", ExternalUpdateLogSchema);
