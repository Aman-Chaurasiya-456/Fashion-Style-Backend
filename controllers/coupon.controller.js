import Coupon from "../models/coupon.model.js";
import CouponUsage from "../models/couponUsage.model.js";

export const getCoupon = async (req, res) => {
  try {
    const coupon = await Coupon.findOne({
      userId: req.user._id,
      isActive: true,
    });
    res.json(coupon || null);
  } catch (error) {
    console.log("Error in getCoupon controller", error.message);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

export const validateCoupon = async (req, res) => {
  try {
    const { code } = req.body;

    // Find the coupon
    const coupon = await Coupon.findOne({
      code: code,
      isActive: true, // Only check active coupons
    });

    // Check if the coupon exists
    if (!coupon) {
      return res.status(404).json({ message: "Coupon not found" });
    }

    // Check if the coupon is expired
    if (coupon.expirationDate < new Date()) {
      coupon.isActive = false; // Mark it as inactive if expired
      await coupon.save();
      return res.status(404).json({ message: "Coupon expired" });
    }

    // Check if the user has already used this coupon
    const couponUsage = await CouponUsage.findOne({
      userId: req.user._id,
      couponId: coupon._id,
    });

    if (couponUsage) {
      return res.status(400).json({ message: "Coupon already used" });
    }

    // If all checks pass, the coupon is valid
    res.json({
      message: "Coupon is valid",
      code: coupon.code,
      discountPercentage: coupon.discountPercentage,
    });
  } catch (error) {
    console.log("Error in validateCoupon controller", error.message);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

export const addCoupon = async (req, res) => {
  const { name, code, discount, expirationDate } = req.body;

  try {
    // Check if the coupon code already exists
    const existingCoupon = await Coupon.findOne({ code });
    if (existingCoupon) {
      return res.status(400).json({ message: "Coupon already exists" });
    }

    const newCoupon = new Coupon({
      name,
      code,
      discountPercentage: discount,
      expirationDate,
    });

    await newCoupon.save();
    res
      .status(201)
      .json({ message: "Coupon added successfully", coupon: newCoupon });
  } catch (error) {
    console.log(error.message);
    res
      .status(500)
      .json({ message: "Error adding coupon", error: error.message });
  }
};

// Delete a coupon
export const deleteCoupon = async (req, res) => {
  const { id } = req.params;

  try {
    const deletedCoupon = await Coupon.findByIdAndDelete(id);

    if (!deletedCoupon) {
      return res.status(404).json({ message: "Coupon not found" });
    }

    res.status(200).json({ message: "Coupon deleted successfully" });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error deleting coupon", error: error.message });
  }
};
