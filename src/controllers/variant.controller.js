import mongoose from "mongoose";
import { Product } from "../models/product.model.js";
import { ProductVariant } from "../models/productVariant.model.js";
import {
    uploadImage,
    deleteImage,
    getCloudinaryPublicIdFromUrl,
} from "../utils/imageUpload.js";

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

const generateSKU = (
    productName,
    color,
    size
) => {
    const productCode = productName
        .replace(/\s+/g, "")
        .slice(0, 4)
        .toUpperCase();

    const colorCode = color
        .slice(0, 3)
        .toUpperCase();

    const sizeCode = size.toUpperCase();

    return `${productCode}-${colorCode}-${sizeCode}-${Date.now()}`;
};

export const createVariant = async (req, res) => {
    try {
        const {
            product,
            color,
            size,
            mrp,
            sellingPrice,
            currentStock = 0,
        } = req.body;

        if (
            !product ||
            !color ||
            !size ||
            !mrp ||
            !sellingPrice
        ) {
            return res.status(400).json({
                success: false,
                message:
                    "Product, color, size, MRP and selling price are required.",
            });
        }

        const productExists =
            await Product.findById(product);

        if (!productExists) {
            return res.status(404).json({
                success: false,
                message: "Product not found.",
            });
        }

        const existingVariant =
            await ProductVariant.findOne({
                product,
                color: color.trim(),
                size: size.trim(),
            });

        if (existingVariant) {
            return res.status(409).json({
                success: false,
                message:
                    "Variant already exists.",
            });
        }

        const uploadedImages = [];

        if (req.files?.length) {
            const uploadResults =
                await Promise.all(
                    req.files.map((file) =>
                        uploadImage(
                            file,
                            "variants"
                        )
                    )
                );

            uploadedImages.push(
                ...uploadResults.map(
                    (item) => item.url
                )
            );
        }

        const sku = generateSKU(
            productExists.name,
            color,
            size
        );

        const variant =
            await ProductVariant.create({
                product,
                sku,
                color: color.trim(),
                size: size.trim(),
                mrp: Number(mrp),
                sellingPrice:
                    Number(sellingPrice),
                currentStock:
                    Number(currentStock),
                coverImage:
                    uploadedImages[0] ||
                    null,
                images: uploadedImages,
            });

        return res.status(201).json({
            success: true,
            message:
                "Variant created successfully.",
            variant,
        });
    } catch (error) {
        return sendServerError(
            res,
            error,
            "Create Variant Error"
        );
    }
};

export const updateVariant = async (
    req,
    res
) => {
    try {
        const { id } = req.params;
        const {
            color,
            size,
            mrp,
            sellingPrice,
            currentStock,
        } = req.body;

        const variant =
            await ProductVariant.findById(id);

        if (!variant) {
            return res.status(404).json({
                success: false,
                message:
                    "Variant not found.",
            });
        }


        if (color)
            variant.color =
                color.trim();

        if (size)
            variant.size =
                size.trim();

        if (mrp !== undefined)
            variant.mrp =
                Number(mrp);

        if (
            sellingPrice !==
            undefined
        ) {
            variant.sellingPrice =
                Number(
                    sellingPrice
                );
        }

        if (
            currentStock !==
            undefined
        ) {
            variant.currentStock =
                Number(
                    currentStock
                );
        }

        /*
          Replace Images
        */

        if (req.files?.length) {
            for (const imageUrl of variant.images) {
                const publicId =
                    getCloudinaryPublicIdFromUrl(
                        imageUrl
                    );

                if (publicId) {
                    await deleteImage(
                        publicId
                    ).catch(
                        console.error
                    );
                }
            }

            const uploadResults =
                await Promise.all(
                    req.files.map((file) =>
                        uploadImage(
                            file,
                            "variants"
                        )
                    )
                );

            variant.images =
                uploadResults.map(
                    (item) => item.url
                );

            variant.coverImage =
                variant.images[0];
        }

        await variant.save();

        return res.status(200).json({
            success: true,
            message:
                "Variant updated successfully.",
            variant,
        });
    } catch (error) {
        return sendServerError(
            res,
            error,
            "Update Variant Error"
        );
    }
};

export const deleteVariant = async (
    req,
    res
) => {
    try {
        const { id } = req.params;

        const variant =
            await ProductVariant.findById(id);

        if (!variant) {
            return res.status(404).json({
                success: false,
                message:
                    "Variant not found.",
            });
        }

        for (const imageUrl of variant.images) {
            const publicId =
                getCloudinaryPublicIdFromUrl(
                    imageUrl
                );

            if (publicId) {
                await deleteImage(
                    publicId
                ).catch(
                    console.error
                );
            }
        }

        await ProductVariant.findByIdAndDelete(
            id
        );

        return res.status(200).json({
            success: true,
            message:
                "Variant deleted successfully.",
        });
    } catch (error) {
        return sendServerError(
            res,
            error,
            "Delete Variant Error"
        );
    }
};

export const getVariantsByProduct = async (req, res) => {
    try {
        const { productId } =
            req.params;

        const variants =
            await ProductVariant.find({
                product: productId,
                isActive: true,
            }).sort({
                color: 1,
                size: 1,
            });

        if (!variants) {
            return res.status(404).json({
                success: false,
                message:
                    "Variants not found.",
            });
        }

        return res.status(200).json({
            success: true,
            variants,
        });
    } catch (error) {
        return sendServerError(
            res,
            error,
            "Get Variants Error"
        );
    }
};

export const getVariantById = async (req, res) => {
    try {
        const variant =
            await ProductVariant.findById(
                req.params.id
            ).populate(
                "product",
                "name slug"
            );

        if (!variant) {
            return res.status(404).json({
                success: false,
                message:
                    "Variant not found.",
            });
        }

        return res.status(200).json({
            success: true,
            variant,
        });
    } catch (error) {
        return sendServerError(
            res,
            error,
            "Get Variant By Id Error"
        );
    }
};

export const toggleVariantStatus = async (req, res) => {
    try {
        const variant =
            await ProductVariant.findById(
                req.params.id
            );

        if (!variant) {
            return res.status(404).json({
                success: false,
                message:
                    "Variant not found.",
            });
        }

        variant.isActive =
            !variant.isActive;

        await variant.save();

        return res.status(200).json({
            success: true,
            message:
                "Variant status updated successfully.",
            variant,
        });
    } catch (error) {
        return sendServerError(
            res,
            error,
            "Toggle Variant Status Error"
        );
    }
};

