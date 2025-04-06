require("dotenv").config();
const express = require("express");
const passport = require("passport");
const GoogleStrategy = require("passport-google-oauth20").Strategy;
const session = require("express-session");
const jwt = require("jsonwebtoken");
const cookieParser = require("cookie-parser");
const { addUser, verifyUser } = require("./authentification");
const db = require("./db");

const app = express();
const port = process.env.PORT || 3001;

// Middleware
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(cookieParser());
app.set("view engine", "ejs");

// Config Passport.js pr Google OAuth 2.0
passport.serializeUser((user, done) => done(null, user));
passport.deserializeUser((obj, done) => done(null, obj));

passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: process.env.CALLBACK_URL,
    },
    (accessToken, refreshToken, profile, done) => {
      const userRole = profile.emails[0].value.includes("admin.com")
        ? "admin"
        : "user";
      return done(null, { username: profile.displayName, role: userRole });
    }
  )
);

app.use(
  session({ secret: "unsecret", resave: false, saveUninitialized: true })
);
app.use(passport.initialize());
app.use(passport.session());

// Middleware d'auth'
const authenticate = (req, res, next) => {
  const token = req.cookies.token;
  if (!token) return res.redirect("/signin");

  jwt.verify(token, process.env.JWT_SECRET_TOKEN, (err, decoded) => {
    if (err) return res.redirect("/signin");
    req.user = decoded;
    next();
  });
};

// Middleware pr les admin
const authorizeAdmin = (req, res, next) => {
  if (req.user.role !== "admin") {
    return res
      .status(403)
      .send("Accès refusé : réservé aux administrateurs ❌");
  }
  next();
};

// Middleware pr les intervenants ou admin
const authorizeIntervenantOrAdmin = (req, res, next) => {
  if (req.user.role !== "intervenant" && req.user.role !== "admin") {
    return res
      .status(403)
      .send("Accès refusé : réservé aux intervenants ou administrateurs ❌");
  }
  next();
};

// Middleware pr les étudiants
const authorizeStudents = (req, res, next) => {
  if (req.user.role !== "student") {
    return res.status(403).send("Accès refusé : réservé aux étudiants ❌");
  }
  next();
};

// Routes
app.get("/", authenticate, (req, res) => {
  const { username, role } = req.user;
  res.render("index", { nom: username, role });
});

app.get("/details", authenticate, authorizeStudents, (req, res) => {
  const { username } = req.user;
  res.render("details", { nom: username });
});

app.get("/etudiants", authenticate, authorizeIntervenantOrAdmin, (req, res) => {
  const sql = "SELECT * FROM users WHERE role = 'student'";

  db.query(sql, (err, results) => {
    if (err) {
      return res
        .status(500)
        .send("Erreur lors de la récupération des étudiants.");
    }
    res.render("etudiants", { students: results });
  });
});

app.get("/intervenants", authenticate, authorizeAdmin, (req, res) => {
  const sql = "SELECT * FROM users WHERE role = 'intervenant'";

  db.query(sql, (err, results) => {
    if (err) {
      return res
        .status(500)
        .send("Erreur lors de la récupération des intervenants.");
    }
    res.render("intervenants", { intervenants: results });
  });
});

app.get("/dashdmin", authenticate, authorizeAdmin, (req, res) => {
  const { username } = req.user;
  res.render("dashdmin", { nom: username });
});

app.get("/signin", (req, res) => {
  res.render("signin", { message: null });
});

app.get("/signup", (req, res) => {
  res.render("signup", { message: null });
});

app.get("/logout", (req, res) => {
  res.clearCookie("token");
  res.redirect("/signin");
});

// Login et Inscription avec JWT
app.post("/signin", (req, res) => {
  const { username, password } = req.body;
  verifyUser(username, password, (err, user) => {
    if (err) {
      return res.status(500).send("Erreur du serveur.");
    }
    if (!user) {
      return res.render("signin", {
        message: "Nom d'utilisateur ou mot de passe incorrect",
      });
    }

    const token = jwt.sign(
      { username: user.username, role: user.role },
      process.env.JWT_SECRET_TOKEN,
      { expiresIn: "1h" }
    );

    res.cookie("token", token, {
      httpOnly: true,
      secure: false,
      maxAge: 3600000,
    });

    res.redirect("/");
  });
});

app.post("/signup", (req, res) => {
  const { username, password } = req.body;
  const role = "student";

  addUser(username, password, role, (err, results) => {
    if (err) {
      return res.status(500).send("Erreur lors de l'inscription.");
    }

    const token = jwt.sign({ username, role }, process.env.JWT_SECRET_TOKEN, {
      expiresIn: "1h",
    });
    res.cookie("token", token, {
      httpOnly: true,
      secure: false,
      maxAge: 3600000,
    });

    res.redirect("/");
  });
});

app.listen(port, () => {
  console.log(`Serveur lancé sur le port ${port} 🚀`);
});
