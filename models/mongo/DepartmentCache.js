const mongoose = require("mongoose");

const ExternalDeptSchema = new mongoose.Schema({
  Dep_ID: Number,
  DepartmentName: String,
  syncedAt: { type: Date, default: Date.now }
});

// TTL: ลบหลัง 14 วัน
ExternalDeptSchema.index(
  { syncedAt: 1 },
  { expireAfterSeconds: 14 * 24 * 60 * 60 }
);

module.exports = mongoose.model("ExternalDepartment", ExternalDeptSchema);
