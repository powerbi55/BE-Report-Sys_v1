const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const mysql = require("../config/mysql");

exports.login = async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ message: "Username and password required" });
    }

    // 🔐 ใช้ MySQL เป็น source of truth
    const [rows] = await mysql.execute(
      "SELECT User_ID, Username, Password, Role, Dep_ID, Fullname FROM User WHERE Username = ? LIMIT 1",
      [username]
    );

    if (rows.length === 0) {
      return res.status(400).json({ message: "User not found" });
    }

    const user = rows[0];

    const passOK = await bcrypt.compare(password, user.Password);
    if (!passOK) {
      return res.status(400).json({ message: "Invalid password" });
    }

    const token = jwt.sign(
      {
        User_ID: user.User_ID,
        Username: user.Username,
        Role: user.Role,
        Dep_ID: user.Dep_ID,
      },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN }
    );

    res.json({
      token,
      user: {
        User_ID: user.User_ID,
        Username: user.Username,
        Role: user.Role,
        Dep_ID: user.Dep_ID,
        Fullname: user.Fullname,
      },
    });

  } catch (err) {
    console.error("Login error:", err);
    res.status(500).json({ message: "Server error" });
  }
};
