import { DataTypes } from "sequelize";
import sequelize from "../config/db.js";
import User from "./User.js";

const Lead = sequelize.define(
  "Lead",
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    first_name: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    last_name: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    email: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
    },
    phone: {
      type: DataTypes.STRING,
    },
    company: {
      type: DataTypes.STRING,
    },
    city: {
      type: DataTypes.STRING,
    },
    state: {
      type: DataTypes.STRING,
    },
    source: {
      type: DataTypes.ENUM(
        "website",
        "facebook_ads",
        "google_ads",
        "referral",
        "events",
        "other"
      ),
      allowNull: false,
    },
    status: {
      type: DataTypes.ENUM("new", "contacted", "qualified", "lost", "won"),
      allowNull: false,
      defaultValue: "new",
    },
    score: {
      type: DataTypes.INTEGER,
      allowNull: true,
      validate: {
        min: 0,
        max: 100,
      },
    },
    lead_value: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: true,
    },
    last_activity_at: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    is_qualified: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
    userId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: User,
        key: "id",
      },
    },
  },
  { timestamps: true }
);

// Define associations
Lead.belongsTo(User, { foreignKey: "userId" });
User.hasMany(Lead, { foreignKey: "userId" });

export default Lead;
