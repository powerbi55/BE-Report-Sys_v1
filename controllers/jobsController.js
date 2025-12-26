const ExternalJob = require("../models/mongo/JobCache");
const ExternalUser = require("../models/mongo/UserCache");
const ExternalUpdateLog = require("../models/mongo/UpdateLog");


// =======================================
//  List Jobs
// =======================================
exports.listJobs = async (req, res) => {
  try {
    const { status, from, to, dep } = req.query;
    const filter = {};

    if (status) filter.Status = status;
    if (dep) filter.Dep_ID = Number(dep);

    if (from || to) filter.DateStartReport = {};
    if (from) filter.DateStartReport.$gte = new Date(from);
    if (to) filter.DateStartReport.$lte = new Date(to);

    const jobs = await ExternalJob.find(filter).lean();

    const userIds = [...new Set(jobs.map(j => j.User_ID).filter(Boolean))];
    const users = await ExternalUser.find({ User_ID: { $in: userIds } }).lean();
    const usersById = Object.fromEntries(users.map(u => [u.User_ID, u]));

    res.json(jobs.map(j => ({
      ...j,
      reporter_info: usersById[j.User_ID] || null,
    })));

  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};


// =======================================
//  Get Job
// =======================================
exports.getJob = async (req, res) => {
  try {
    const id = Number(req.params.id);

    const job = await ExternalJob.findOne({ JOB_ID: id }).lean();
    if (!job) return res.status(404).json({ message: "Job not found" });

    const reporter = job.User_ID
      ? await ExternalUser.findOne({ User_ID: job.User_ID }).lean()
      : null;

    res.json({ ...job, reporter_info: reporter });

  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};


// =======================================
//  Update Job (มี Auto DateEndReport)
// =======================================
exports.updateJob = async (req, res) => {
  try {
    const id = Number(req.params.id);
    const updates = req.body;

    // ดึงค่าก่อนอัปเดต
    const before = await ExternalJob.findOne({ JOB_ID: id }).lean();
    if (!before) return res.status(404).json({ message: "Job not found" });

    const allowed = [
      "Title",
      "Location",
      "Description",
      "Status",
      "assigned_to",
      "Reporter_name",
      "Reporter_phone",
      "Reporter_ID"
    ];

    const toUpdate = {};

    // ตรวจสอบ Status ให้ถูกต้อง
    const allowedStatus = ["รับแจ้ง", "ดำเนินการ", "เสร็จสิ้น"];
    if (updates.Status && !allowedStatus.includes(updates.Status)) {
      return res.status(400).json({
        message: "Invalid Status. Allowed: รับแจ้ง, ดำเนินการ, เสร็จสิ้น"
      });
    }

    // จัดการ fields ปกติ
    for (const key of allowed) {
      if (updates[key] !== undefined) {
        toUpdate[key] = updates[key];
      }
    }

    // =======================================
    // 🌟 Auto DateEndReport Logic
    // =======================================
    if (updates.Status === "เสร็จสิ้น") {
      // ใส่วันที่เสร็จสิ้นอัตโนมัติ
      toUpdate.DateEndReport = new Date();
    } else if (updates.Status && updates.Status !== "เสร็จสิ้น") {
      // ถ้ากลับสถานะ = เอาวันที่ออก
      toUpdate.DateEndReport = null;
    }

    // set updated timestamp & user
    toUpdate.updated_at = new Date();
    toUpdate.updated_by = req.user.User_ID;

    // mark ว่าต้อง sync back
    toUpdate.synced_back = false;

    // บันทึกลง MongoDB
    const updated = await ExternalJob.findOneAndUpdate(
      { JOB_ID: id },
      { $set: toUpdate },
      { new: true }
    );

    // =======================================
    // Save Update Log
    // =======================================
    await ExternalUpdateLog.create({
      JOB_ID: id,
      User_ID: req.user.User_ID,
      Action_type: "update",
      Action_detail: JSON.stringify({
        before,
        changes: toUpdate,
        by: req.user.Username,
      }),
      Timestamp: new Date(),
      synced: false,
    });

    res.json(updated);

  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
