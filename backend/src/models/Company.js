const mongoose = require("mongoose");

const companySchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Company name is required"],
      unique: true,
      trim: true,
    },
    industry: {
      type: String,
      required: [true, "Industry type is required"],
      trim: true,
    },
    description: {
      type: String,
      required: [true, "Company description is required"],
      trim: true,
    },
    website: {
      type: String,
      trim: true,
    },
    logo: {
      type: String,
      default: null,
    },
  },
  {
    timestamps: true,
  },
);

const Company = mongoose.model("Company", companySchema);

module.exports = Company;
