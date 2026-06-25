require("dotenv").config();

const axios = require("axios");
const bcrypt = require("bcryptjs");
const cors = require("cors");
const express = require("express");
const jwt = require("jsonwebtoken");
const swaggerJsdoc = require("swagger-jsdoc");
const swaggerUi = require("swagger-ui-express");

const app = express();
const port = process.env.PORT || process.env.AUTH_PORT || 3001;
const jwtSecret = process.env.JWT_SECRET || "troque-esta-chave";
const userServiceUrl = process.env.USER_SERVICE_URL || "http://localhost:3002";

app.use(cors({ origin: "*", methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"] }));
app.use(express.json());

const swaggerSpec = swaggerJsdoc({
  definition: {
    openapi: "3.0.0",
    info: {
      title: "Auth Service API",
      version: "1.0.0",
      description: "API responsavel por login e validacao de token."
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
 *     summary: Verifica se o Auth Service esta online.
 *     responses:
 *       200:
 *         description: Servico online.
 */
app.get("/health", (_req, res) => {
  res.json({ status: "ok", service: "auth-service" });
});

/**
 * @openapi
 * /auth/login:
 *   post:
 *     summary: Realiza login do usuario.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email, password]
 *             properties:
 *               email:
 *                 type: string
 *                 example: admin@email.com
 *               password:
 *                 type: string
 *                 example: "123456"
 *     responses:
 *       200:
 *         description: Login realizado com sucesso.
 *       401:
 *         description: Credenciais invalidas.
 */
app.post("/auth/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: "Email e senha sao obrigatorios." });
    }

    const response = await axios.get(userServiceUrl + "/internal/users/email/" + encodeURIComponent(email));
    const user = response.data;
    const passwordIsValid = await bcrypt.compare(password, user.passwordHash);

    if (!passwordIsValid) {
      return res.status(401).json({ message: "Credenciais invalidas." });
    }

    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      jwtSecret,
      { expiresIn: "2h" }
    );

    res.json({
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role
      }
    });
  } catch (error) {
    if (error.response && error.response.status === 404) {
      return res.status(401).json({ message: "Credenciais invalidas." });
    }

    res.status(500).json({ message: "Erro ao realizar login." });
  }
});

/**
 * @openapi
 * /auth/validate:
 *   get:
 *     summary: Valida um token JWT.
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Token valido.
 *       401:
 *         description: Token invalido.
 */
app.get("/auth/validate", (req, res) => {
  const authHeader = req.headers.authorization || "";
  const token = authHeader.replace("Bearer ", "");

  if (!token) {
    return res.status(401).json({ valid: false, message: "Token nao informado." });
  }

  try {
    const user = jwt.verify(token, jwtSecret);
    res.json({ valid: true, user });
  } catch (_error) {
    res.status(401).json({ valid: false, message: "Token invalido." });
  }
});

app.listen(port, () => {
  console.log("Auth Service rodando na porta " + port);
});
