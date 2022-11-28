const HttpError = require("../models/http-error");
const User = require("../models/user");

const { validationResult } = require("express-validator");

const getUsers = async (req, res, next) => {
  let users;
  try {
    users = await User.find({}, "-password");
  } catch (err) {
    const error = new HttpError(
      "Busca de usuários falhou, tente novamente mais tarde",
      500
    );
    return next(error);
  }
  res.json({ users: users.map((user) => user.toObject({ getters: true })) });
};

const signup = async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    console.log(errors);
    return next(new HttpError("Inputs inválido, por favor checar", 422));
  }

  const { name, email, password } = req.body;

  let existingUser;
  try {
    existingUser = await User.findOne({ email: email });
  } catch (err) {
    const error = new HttpError("Cadastro falhou, tente  novamente", 500);
    return next(error);
  }

  if (existingUser) {
    const error = HttpError("Usuário já existe. Por favor faça o login", 422);
    return next(error);
  }

  const createdUser = new User({
    name,
    email,
    image:
      "https://st2.depositphotos.com/4881727/7380/i/600/depositphotos_73807295-stock-photo-swing-hang-from-coconut-tree.jpg",
    password,
    places: [],
  });

  try {
    await createdUser.save();
  } catch (err) {
    const error = new HttpError("Cadastro falhou, tente novamente", 500);
    console.log(err);
    return next(error);
  }

  res.status(201).json({ user: createdUser.toObject({ getters: true }) });
};

const login = async (req, res, next) => {
  const { email, password } = req.body;

  let existingUser;
  try {
    existingUser = await User.findOne({ email: email });
  } catch (err) {
    const error = new HttpError("Login falhou, tente  novamente", 500);
    return next(error);
  }

  if (!existingUser || existingUser.password !== password) {
    const error = new HttpError("Credenciais inválidas", 401);
    return next(error);
  }

  res.json({
    message: "logado",
    user: existingUser.toObject({ getters: true }),
  });
};

exports.getUsers = getUsers;
exports.signup = signup;
exports.login = login;
