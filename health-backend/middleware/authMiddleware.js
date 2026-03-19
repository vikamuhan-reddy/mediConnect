import jwt from "jsonwebtoken";
console.log("🔥 AUTH MIDDLEWARE HIT");

export default function authMiddleware(req, res, next) {
  try {
    const authHeader = req.headers.authorization;
    console.log("AUTH HEADER:", authHeader);

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      console.log("❌ No token");
      return res.status(403).json({ message: "No token" });
    }

    const token = authHeader.split(" ")[1];
    console.log("TOKEN:", token);

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    console.log("DECODED:", decoded);

    req.user = decoded;
    next();

  } catch (err) {
    console.log("❌ JWT ERROR:", err.message);
    return res.status(403).json({ message: "Invalid token" });
  }
}