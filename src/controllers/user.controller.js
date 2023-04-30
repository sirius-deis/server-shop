const jwt = require("jsonwebtoken");

const AppError = require("../utils/appError");
const User = require("../models/user.model");
const Cart = require("../models/cart.model");

const catchAsync = require("../utils/catchAsync");

const signToken = (id) => {
    return jwt.sign({ id }, process.env.JWT_SECRET, {
        expiresIn: process.env.JWT_EXPIRES_IN,
    });
};

exports.signup = catchAsync(async (req, res, next) => {
    const { name, surname, email, password, passwordConfirm } = req.body;
    if (password !== passwordConfirm) {
        throw new AppError("Passwords are different", 400);
    }
    const user = await User.create({
        name,
        surname,
        email,
        password,
    });
    await Cart.create({ userId: user._id, products: [] });
    res.status(201).json({ message: "Account was successfully created" });
});

exports.login = catchAsync(async (req, res) => {
    const { email, password } = req.body;

    if (!email && !password) {
        throw new AppError("Email and password are required", 400);
    }
    const user = await User.findOne({ email }).select("+password -__v");
    if (!user || !(await user.checkPassword(password, user.password))) {
        throw new AppError("Incorrect email or password", 400);
    }
    user.password = undefined;
    res.cookie("token", signToken(user._id), {
        expires: new Date(Date.now() + parseInt(process.env.JWT_EXPIRES_IN) * 24 * 60 * 60 * 1000),
    });
    const cart = await Cart.findOne({ userId: user._id }).select("-__v");
    return res.status(200).json({ message: "You was sign in successfully", data: { user, cart } });
});

exports.logout = (req, res) => {
    res.clearCookie("token");
    res.status(202).json({ message: "Successfully" });
};

exports.delete = catchAsync(async (req, res) => {
    const { id } = req.params;
    if (!id) {
        throw new AppError("Unknown user id", 404);
    }
    res.clearCookie("token");
    await User.deleteOne({ _id: id });
    await Cart.deleteOne({ userId: id });
    res.status(204).end();
});

exports.grabData = catchAsync(async (req, res) => {
    const { id } = req.user;
    const user = await User.findById({ _id: id });
    if (!user) {
        throw new AppError("Unknown user id", 404);
    }
    const cart = await Cart.findOne({ userId: user._id }).populate("products.productId");

    return res.status(200).json({ message: "You was sign in successfully", data: { user, cart } });
});
