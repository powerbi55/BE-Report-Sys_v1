const mongoose = require("mongoose");

const ExternalJobSchema = new mongoose.Schema({
  JOB_ID: Number,
  User_ID: Number,
  Dep_ID: Number,

  Reporter_name: String,
  Reporter_ID: String,
  Reporter_phone: String,

  Title: String,
  Location: String,
  Description: String,

  DateStartReport: Date,
  DateEndReport: Date,

  // 🌟 จำกัด Status ให้มีแค่ 3 ค่า
  Status: {
    type: String,
    enum: ["รับแจ้ง", "ดำเนินการ", "เสร็จสิ้น"],
    default: "รับแจ้ง"
  },

  assigned_to: Number,

  updated_at: Date,
  updated_by: Number,

  synced_back: { type: Boolean, default: false },

  syncedAt: { type: Date, default: Date.now }
});

// TTL cache 14 วัน
ExternalJobSchema.index(
  { syncedAt: 1 },
  { expireAfterSeconds: 14 * 24 * 60 * 60 }
);

module.exports = mongoose.model("ExternalJob", ExternalJobSchema);
