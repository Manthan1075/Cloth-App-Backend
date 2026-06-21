import mongoose from "mongoose";
import { ProductVariant } from "../models/productVariant.model.js";
import { InventoryTransaction } from "../models/inventoryTransaction.model.js";


const sendServerError = (res, error, label) => {
    console.error(`${label}:`, error);

    return res.status(500).json({
        success: false,
        message:
            "Something went wrong on our side. Please try again later.",
    });
};

const isValidObjectId = (id) =>
    mongoose.Types.ObjectId.isValid(id);

const TRANSACTION_TYPES = [
    "PURCHASE",
    "SALE",
    "RETURN",
    "ADJUSTMENT",
    "DAMAGED",
    "CANCEL",
];

const validateQuantity = (qty) =>
    Number(qty) > 0;

/* ======================================================
   INTERNAL CREATE TRANSACTION
====================================================== */

const createInventoryTransaction =
    async ({
        variant,
        type,
        quantity,
        previousStock,
        newStock,
        referenceId = null,
        note = "",
        createdBy,
    }) => {
        return InventoryTransaction.create({
            variant,
            type,
            quantity,
            previousStock,
            newStock,
            referenceId,
            note,
            createdBy,
        });
    };


const updateStock = async ({
    variantId,
    quantity,
    type,
    referenceId,
    note,
    createdBy,
}) => {
    if (!TRANSACTION_TYPES.includes(type)) {
        throw new Error(
            "Invalid transaction type"
        );
    }

    const variant =
        await ProductVariant.findById(
            variantId
        );

    if (!variant) {
        throw new Error(
            "Variant not found"
        );
    }

    const previousStock =
        variant.currentStock;

    let newStock =
        previousStock;

    switch (type) {
        case "PURCHASE":
        case "RETURN":
        case "CANCEL":
            newStock += quantity;
            break;

        case "SALE":
        case "DAMAGED":
            newStock -= quantity;
            break;

        default:
            break;
    }

    if (newStock < 0) {
        throw new Error(
            "Insufficient stock"
        );
    }

    variant.currentStock =
        newStock;

    await variant.save();

    const transaction =
        await createInventoryTransaction({
            variant:
                variant._id,
            type,
            quantity,
            previousStock,
            newStock,
            referenceId,
            note,
            createdBy,
        });

    return {
        variant,
        transaction,
    };
};

export const purchaseStock = async (req, res) => {
    try {
        const {
            variantId,
            quantity,
            note,
        } = req.body;

        if (
            !variantId ||
            !validateQuantity(
                quantity
            )
        ) {
            return res.status(400).json({
                success: false,
                message:
                    "Valid variant and quantity are required.",
            });
        }

        if (
            !isValidObjectId(
                variantId
            )
        ) {
            return res.status(400).json({
                success: false,
                message:
                    "Invalid variant id.",
            });
        }

        const result =
            await updateStock({
                variantId,
                quantity:
                    Number(
                        quantity
                    ),
                type:
                    "PURCHASE",
                note,
                createdBy:
                    req.user
                        ._id,
            });

        return res.status(200).json({
            success: true,
            message:
                "Stock purchased successfully.",

            currentStock:
                result.variant
                    .currentStock,

            transaction:
                result.transaction,
        });
    } catch (error) {
        return sendServerError(
            res,
            error,
            "Purchase Stock Error"
        );
    }
};

export const saleStock = async (req, res) => {
    try {
        const {
            variantId,
            quantity,
            orderId,
            note,
        } = req.body;

        if (
            !variantId ||
            !validateQuantity(
                quantity
            )
        ) {
            return res.status(400).json({
                success: false,
                message:
                    "Valid variant and quantity are required.",
            });
        }

        if (
            !isValidObjectId(
                variantId
            )
        ) {
            return res.status(400).json({
                success: false,
                message:
                    "Invalid variant id.",
            });
        }

        const result =
            await updateStock({
                variantId,
                quantity:
                    Number(
                        quantity
                    ),

                type:
                    "SALE",

                referenceId:
                    orderId,

                note,

                createdBy:
                    req.user
                        ._id,
            });

        return res.status(200).json({
            success: true,
            message:
                "Stock updated successfully.",

            currentStock:
                result.variant
                    .currentStock,

            transaction:
                result.transaction,
        });
    } catch (error) {
        return sendServerError(
            res,
            error,
            "Sale Stock Error"
        );
    }
};

export const returnStock = async (req, res) => {
    try {
        const {
            variantId,
            quantity,
            orderId,
            note,
        } = req.body;

        if (
            !variantId ||
            !validateQuantity(
                quantity
            )
        ) {
            return res.status(400).json({
                success: false,
                message:
                    "Valid variant and quantity are required.",
            });
        }

        if (
            !isValidObjectId(
                variantId
            )
        ) {
            return res.status(400).json({
                success: false,
                message:
                    "Invalid variant id.",
            });
        }

        const result =
            await updateStock({
                variantId,

                quantity:
                    Number(
                        quantity
                    ),

                type:
                    "RETURN",

                referenceId:
                    orderId,

                note,

                createdBy:
                    req.user
                        ._id,
            });

        return res.status(200).json({
            success: true,
            message:
                "Returned stock added successfully.",

            currentStock:
                result.variant
                    .currentStock,

            transaction:
                result.transaction,
        });
    } catch (error) {
        return sendServerError(
            res,
            error,
            "Return Stock Error"
        );
    }
};