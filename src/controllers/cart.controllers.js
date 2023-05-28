const AppError = require('../utils/appError');
const catchAsync = require('../utils/catchAsync');

const Cart = require('../models/cart.models');

exports.addToCart = catchAsync(async (req, res, next) => {
    const { productId } = req.params;
    const user = req.user;
    const { quantity } = req.body;
    const cart = await Cart.findOne({ userId: user._id });
    if (!cart) {
        return next(new AppError('You are not logged in', 404));
    }
    const index = cart.products?.findIndex(product =>
        product.productId.equals(productId)
    );
    if (index === undefined || index === -1) {
        cart.products.push({
            productId,
            quantity: quantity ?? 1,
        });
    } else {
        cart.products[index].quantity += quantity ?? 1;
    }

    await cart.save();

    res.status(201).json({ message: 'Product was successfully added to cart' });
});

exports.decreaseProductsInCart = catchAsync(async (req, res, next) => {
    const { productId } = req.params;
    const { quantityToDelete } = req.body;
    const user = req.user;
    const cart = await Cart.findOne({ userId: user._id });
    if (!cart) {
        return next(new AppError('You are not logged in', 404));
    }
    const index = cart.products?.findIndex(product =>
        product.productId.equals(productId)
    );
    if (index === undefined || index === -1) {
        return next(new AppError('There is no such product in your cart', 404));
    } else {
        const quantity = cart.products[index].quantity;
        if (quantity === 1 || quantity <= quantityToDelete) {
            cart.products.splice(index, 1);
        } else {
            cart.products[index].quantity -= 1;
        }
    }
    await cart.save();
    res.status(204).send();
});

exports.clearCart = catchAsync(async (req, res, next) => {
    const user = req.user;
    const cart = await Cart.findOne({ userId: user._id });
    if (!cart) {
        return next(new AppError('You are not logged in', 404));
    }
    cart.products = [];

    await cart.save();

    res.status(204).send();
});
