import express from 'express';
import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || 'mediconnect-secret-key';

const auth = (req, res, next) => {
  const token = req.headers['authorization']?.split(' ')[1];
  if (!token) return res.sendStatus(401);
  jwt.verify(token, JWT_SECRET, (err, decoded) => {
    if (err) return res.sendStatus(403);
    req.user = decoded;
    next();
  });
};

// These routes are already handled in server.js
// This file exists just to satisfy the import
// All actual logic is in server.js

export default router;