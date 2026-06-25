require("dotenv").config();

const bcrypt = require("bcryptjs");
const cors = require("cors");
const express = require("express");
const jwt = require("jsonwebtoken");
const swaggerJsdoc = require("swagger-jsdoc");
const swaggerUi = require("swagger-ui-express");
const { v4: uuid } = require("uuid");

const app = express();
const port = process.env.PORT || process.env.USER_PORT || 3002;
const jwtSecret = process.env.JWT_SECRET || "troque-esta-chave";

app.use(cors({ origin: "*", methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"] }));
app.use(express.json());

const users = [
  {
    id: "1",
    name: "Administrador",
    email: "admin@email.com",
    passwordHash: bcrypt.hashSync("123456", 10),
    role: "admin",
    createdAt: new Date().toISOString()
  }
];

function sanitizeUser(user) {
  const { passwordHash, ...safeUser } = user;
  return safeUser;
}

function authenticate(req, res, next) {
  const authHeader = req.headers.authorization || "";
  const token = authHeader.replace("Bearer ", "");

  if (!token) {
    return res.status(401).json({ message: "Token nao informado." });
  }

  try {
    req.user = jwt.verify(token, jwtSecret);
    return next();
  } catch (_error) {
    return res.status(401).json({ message: "Token invalido." });
  }
}

const swaggerSpec = swaggerJsdoc({
  definition: {
    openapi: "3.0.0",
    info: {
      title: "User Service API",
      version: "1.0.0",
      description: "API responsavel por criacao e consulta de usuarios."
    },
    servers: [{ url: "http://localhost:" + port }],
    components: {
      securitySchemes: {
        bearerAuth: { type: "http", scheme: "bearer", bearerFormat: "JWT" }
      }
    }
  },
  apis: [__filename]
});

app.use("/docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));

/**
 * @openapi
 * /health:
 *   get:
 *     summary: Verifica se o User Service esta online.
 *     responses:
 *       200:
 *         description: Servico online.
 */
app.get("/health", (_req, res) => {
  res.json({ status: "ok", service: "user-service" });
});

/**
 * @openapi
 * /users:
 *   post:
 *     summary: Cria um usuario.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name, email, password]
 *             properties:
 *               name:
 *                 type: string
 *                 example: Thiago
 *               email:
 *                 type: string
 *                 example: thiago@email.com
 *               password:
 *                 type: string
 *                 example: "123456"
 *               role:
 *                 type: string
 *                 example: student
 *     responses:
 *       201:
 *         description: Usuario criado.
 *       409:
 *         description: Email ja cadastrado.
 */
app.post("/users", async (req, res) => {
  const { name, email, password, role = "student" } = req.body;

  if (!name || !email || !password) {
    return res.status(400).json({ message: "Nome, email e senha sao obrigatorios." });
  }

  const emailAlreadyExists = users.some((user) => user.email.toLowerCase() === email.toLowerCase());

  if (emailAlreadyExists) {
    return res.status(409).json({ message: "Email ja cadastrado." });
  }

  const user = {
    id: uuid(),
    name,
    email,
    passwordHash: await bcrypt.hash(password, 10),
    role,
    createdAt: new Date().toISOString()
  };

  users.push(user);
  res.status(201).json(sanitizeUser(user));
});

/**
 * @openapi
 * /users:
 *   get:
 *     summary: Lista usuarios cadastrados.
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Lista de usuarios.
 *       401:
 *         description: Token ausente ou invalido.
 */
app.get("/users", authenticate, (_req, res) => {
  res.json(users.map(sanitizeUser));
});

/**
 * @openapi
 * /users/{id}:
 *   get:
 *     summary: Consulta usuario por ID.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Usuario encontrado.
 *       404:
 *         description: Usuario nao encontrado.
 */
app.get("/users/:id", authenticate, (req, res) => {
  const user = users.find((item) => item.id === req.params.id);

  if (!user) {
    return res.status(404).json({ message: "Usuario nao encontrado." });
  }

  res.json(sanitizeUser(user));
});

/**
 * @openapi
 * /internal/users/email/{email}:
 *   get:
 *     summary: Busca usuario por email para comunicacao interna entre microsservicos.
 *     parameters:
 *       - in: path
 *         name: email
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Usuario encontrado com hash da senha.
 *       404:
 *         description: Usuario nao encontrado.
 */
app.get("/internal/users/email/:email", (req, res) => {
  const email = decodeURIComponent(req.params.email).toLowerCase();
  const user = users.find((item) => item.email.toLowerCase() === email);

  if (!user) {
    return res.status(404).json({ message: "Usuario nao encontrado." });
  }

  res.json(user);
});

app.listen(port, () => {
  console.log("User Service rodando na porta " + port);
});
