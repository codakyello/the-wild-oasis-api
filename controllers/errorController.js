const AppError = require("../utils/appError");

// Invalid mondoDB Id
const handleCastErrorDB = (err) => {
  const message = `Invalid ${err.path}: ${err.value}`;
  return new AppError(message, 400);
};

// Duplicate field values
const handleDuplicateFieldsDB = (err) => {
  console.log(errors);
  const value = err.errmsg.match(/(["'])(?:(?=(\\?))\2.)*?\1/)[0];
  const message = `Duplicate field value: ${value}. Please use another value!.`;

  return new AppError(message, 400);
};

// Validation Errors
const handleValidationErrorDB = (err) => {
  const errors = Object.values(err.errors).map((el) => el.message);
  console.log(errors);
  const message = `Invalid input data ${errors.join(". ")}`;

  return new AppError(message, 400);
};

const sendErrDev = (err, res) => {
  res.status(err.statusCode).json({
    status: err.status,
    message: err.message,
    error: err,
    stack: err.stack,
  });
};

const sendErrProd = (err, res) => {
  console.log("here");
  console.log(err.message);
  // Operational, trusted error and message to client
  if (err.isOperational) {
    res.status(err.statusCode).json({
      status: err.status,
      message: err.message,
    });

    // Programming or other unknown error: don't leak error details
  } else {
    // 1) Log error
    console.log("Error 💣");

    // 2) Send generic message
    res
      .status(err.statusCode)
      .json({ status: err.status, message: "Something went very wrong" });
  }
};

module.exports = (err, req, res, next) => {
  err.statusCode = err.statusCode || 500;
  err.status = err.status || "error";

  if (process.env.NODE_ENV === "development") {
    console.log("here in dev");
    sendErrDev(err, res);
  } else if (process.env.NODE_ENV === "production") {
    let error = { ...err };

    if (err.name === "CastError") error = handleCastErrorDB(err);

    if (err.code === 11000) error = handleDuplicateFieldsDB(err);

    if (err.name === "ValidationError") error = handleValidationErrorDB(err);
    // if(err.code)

    sendErrProd(error, res);
  }
};
