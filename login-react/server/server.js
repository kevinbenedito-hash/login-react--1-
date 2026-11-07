

import http from "node:http";
import crypto from "node:crypto";

const PORT = Number(process.env.API_PORT ?? 3001);
const SECRET = process.env.JWT_SECRET ?? "troque-este-segredo-em-producao";
const EXPIRES_IN = 60 * 60; // 1 hora, em segundos

const USERS = [
  { id: 1, name: "Administrador", email: "admin@example.com", username: "admin", password: "123456" },
];

const b64url = (input) => Buffer.from(input).toString("base64url");

function signToken(payload) {
  const header = b64url(JSON.stringify({ alg: "HS256", typ: "JWT" }));
  const body = b64url(JSON.stringify(payload));
  const signature = crypto.createHmac("sha256", SECRET).update(`${header}.${body}`).digest("base64url");
  return `${header}.${body}.${signature}`;
}

function verifyToken(token) {
  const parts = token.split(".");
  if (parts.length !== 3) return null;

  const [header, body, signature] = parts;
  const expected = crypto.createHmac("sha256", SECRET).update(`${header}.${body}`).digest();
  const received = Buffer.from(signature, "base64url");
  if (received.length !== expected.length || !crypto.timingSafeEqual(received, expected)) return null;

  try {
    const payload = JSON.parse(Buffer.from(body, "base64url").toString());
    if (payload.exp && payload.exp * 1000 < Date.now()) return null;
    return payload;
  } catch {
    return null;
  }
}


function send(res, status, data) {
  res.writeHead(status, {
    "Content-Type": "application/json; charset=utf-8",
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  });
  res.end(JSON.stringify(data));
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    let raw = "";
    req.on("data", (chunk) => {
      raw += chunk;
      if (raw.length > 1e6) {
        reject(new Error("Corpo da requisição grande demais."));
        req.destroy();
      }
    });
    req.on("end", () => {
      if (!raw) return resolve({});
      const type = req.headers["content-type"] ?? "";
      try {
        if (type.includes("application/x-www-form-urlencoded")) {
          return resolve(Object.fromEntries(new URLSearchParams(raw)));
        }
        resolve(JSON.parse(raw));
      } catch {
        reject(new Error("Corpo da requisição inválido."));
      }
    });
    req.on("error", reject);
  });
}


async function handleLogin(req, res) {
  let body;
  try {
    body = await readBody(req);
  } catch (err) {
    return send(res, 400, { message: err.message });
  }

  
  const identifier = String(body.email ?? body.username ?? body.user ?? "").trim().toLowerCase();
  const password = String(body.password ?? "");

  if (!identifier || !password) {
    return send(res, 422, { message: "Informe usuário e senha." });
  }

  const user = USERS.find(
    (u) => u.email.toLowerCase() === identifier || u.username.toLowerCase() === identifier
  );

  
  const expected = Buffer.from(user?.password ?? "");
  const given = Buffer.from(password);
  const valid = user && expected.length === given.length && crypto.timingSafeEqual(expected, given);

  if (!valid) {
    return send(res, 401, { message: "Usuário ou senha inválidos." });
  }

  const now = Math.floor(Date.now() / 1000);
  const accessToken = signToken({ sub: String(user.id), name: user.name, email: user.email, iat: now, exp: now + EXPIRES_IN });

  send(res, 200, { access_token: accessToken, token_type: "Bearer", expires_in: EXPIRES_IN });
}

function handleMe(req, res) {
  const header = req.headers.authorization ?? "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : "";
  const payload = token ? verifyToken(token) : null;

  if (!payload) return send(res, 401, { message: "Token ausente, inválido ou expirado." });
  send(res, 200, { id: payload.sub, name: payload.name, email: payload.email });
}

const server = http.createServer(async (req, res) => {
  const { pathname } = new URL(req.url, `http://${req.headers.host}`);

  if (req.method === "OPTIONS") return send(res, 204, {});
  if (req.method === "POST" && pathname === "/auth/login") return handleLogin(req, res);
  if (req.method === "GET" && pathname === "/auth/me") return handleMe(req, res);
  if (req.method === "GET" && pathname === "/health") return send(res, 200, { status: "ok" });

  send(res, 404, { message: "Rota não encontrada." });
});

server.listen(PORT, () => {
  console.log(`API local rodando em http://localhost:${PORT}`);
  console.log("Login de teste: admin@example.com / 123456");
});
