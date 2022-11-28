const { v4: uuidv4 } = require("uuid");
const HttpError = require("../models/http-error");
const mongoose = require('mongoose');
const { validationResult } = require("express-validator");
const getCoordsForAddress = require("../util/location");
const Place = require("../models/place");
const User = require("../models/user");

const newId = uuidv4();


const getPlaceById = async (req, res, next) => {
  const placeId = req.params.pid;
  let place;
  try {
    place = await Place.findById(placeId);
  } catch (err) {
    const error = new HttpError("Não foi possível encontrar um lugar", 500);
    return next(error);
  }

  if (!place) {
    const error = HttpError(
      "Não foi possível encontrar um lugar com esse id",
      404
    );
    return next(error);
  }

  res.json({ place: place.toObject({ getters: true }) });
};

const getPlacesByUserId = async (req, res, next) => {
  const userId = req.params.uid;

  let places;
  try {
    places = await Place.find({ creator: userId });
  } catch (err) {
    const error = new HttpError(
      "Alguma coisa deu errado no momento de encontrar o usuário",
      500
    );
    return next(error);
  }

  if (!places || places.length === 0) {
    return next(
      new HttpError("Não foi possível encontrar um lugar com esse user id", 404)
    );
  }

  res.json({
    places: places.map((place) => place.toObject({ getters: true })),
  });
};

const createPlace = async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return next(new HttpError("Inputs inválido, por favor checar", 422));
  }

  const { title, description, address, creator } = req.body;

  let coordinates = getCoordsForAddress(address);

  const createdPlace = new Place({
    title,
    description,
    address,
    location: coordinates,
    image: "https://mapio.net/images-immo-detalhe/6201917/-img-0.jpeg",
    creator,
  });

  let user;
  try {
    user = await User.findById(creator);
  } catch (err) {
    const error = new HttpError(
      "Criação de lugar falhou, tente novamente",
      500
    );
    return next(error);
  }

  if (!user) {
    const error = new HttpError(
      "Não foi possível encontrar um usuário para o id provisionado",
      404
    );
    return next(error);
  }

  console.log(user);

  try {
    const sess = await mongoose.startSession();
    sess.startTransaction();
    await createdPlace.save({ session: sess });
    user.places.push(createdPlace);
    await user.save({ session: sess });
    sess.commitTransaction();

  } catch (err) {
    const error = new HttpError(
      "Criação de lugar falhou, tente novamente",
      500
    );
    console.log(err);
    return next(error);
  }

  res.status(201).json({ place: createdPlace });
};

const updatePlace = async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return next(new HttpError("Inputs inválido, por favor checar", 422));
  }

  const { title, description } = req.body;
  const placeId = req.params.pid;

  let place;
  try {
    place = await Place.findById(placeId);
  } catch (err) {
    const error = new HttpError(
      "Alguma coisa deu errado, não foi possível editar o lugar",
      500
    );
    return next(error);
  }

  place.title = title;
  place.description = description;

  try {
    await place.save();
  } catch (err) {
    const error = new HttpError(
      "Não foi possível salvar no banco de dados o lugar editado",
      500
    );
    return next(error);
  }

  res.status(200).json({ place: place.toObject({ getters: true }) });
};

const deletePlace = async (req, res, next) => {
  const placeId = req.params.pid;

  let place;
  try {
    place = await Place.findById(placeId).populate('creator');
  } catch (err) {
    const error = new HttpError(
      "Alguma coisa deu errado, não foi possível deletar",
      500
    );
    return next(error);
  }

  if(!place){
    const error = new HttpError("Não foi possível encontrar um lugar para esse id", 404);
    return next(error);
  }

  try {
    const sess = await mongoose.startSession();
    sess.startTransaction();
    await place.remove({ session: sess });
    place.creator.places.pull(place); //remove id
    await place.creator.save({ session: sess });
    await sess.commitTransaction();
  } catch (err) {
    const error = new HttpError(
      "Alguma coisa deu errado, não foi possível deletar",
      500
    )
    console.log(err);
    return next(error);
  }

  res.status(200).json({ message: "Lugar deletado." });
};

exports.getPlaceById = getPlaceById;
exports.getPlacesByUserId = getPlacesByUserId;
exports.createPlace = createPlace;
exports.updatePlace = updatePlace;
exports.deletePlace = deletePlace;
