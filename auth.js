import jwt from "jsonwebtoken";
import cookie from "cookie";

const JWT_SECRET = process.env.JWT_SECRET || "dev-jwt-secret-change-me";
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || "7d";
const AUTH_COOKIE_NAME = "auth";

export function signAuthToken(payload) {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
}

export function verifyAuthToken(token) {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (error) {
    return null;
  }
}

export function getTokenFromRequest(req) {
  const cookies = cookie.parse(req.headers.cookie || "");
  return cookies[AUTH_COOKIE_NAME] || null;
}

export function setAuthCookie(res, token) {
  const isProduction = process.env.NODE_ENV === "production";
  const serialized = cookie.serialize(AUTH_COOKIE_NAME, token, {
    httpOnly: true,
    secure: isProduction,
    sameSite: isProduction ? "none" : "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  });
  res.setHeader("Set-Cookie", serialized);
}

export function clearAuthCookie(res) {
  const isProduction = process.env.NODE_ENV === "production";
  const serialized = cookie.serialize(AUTH_COOKIE_NAME, "", {
    httpOnly: true,
    secure: isProduction,
    sameSite: isProduction ? "none" : "lax",
    path: "/",
    maxAge: 0,
  });
  res.setHeader("Set-Cookie", serialized);
}

export function authMiddleware(req, res, next) {
  const token = getTokenFromRequest(req);
  if (!token) {
    req.auth = null;
    return next();
  }

  const decoded = verifyAuthToken(token);
  if (!decoded) {
    req.auth = null;
    return next();
  }

  req.auth = decoded;
  next();
}

export function requireAuth(req, res, next) {
  if (!req.auth || !req.auth.userId) {
    return res.status(401).json({
      message: "Authentication required. Please log in.",
      error: "AUTHENTICATION_REQUIRED",
    });
  }
  next();
}
