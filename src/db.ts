import { DataTypes, Sequelize } from "sequelize";

export const Database = new Sequelize("sqlite::memory:");

export const Post = Database.define("Post", {
  uri: {
    type: DataTypes.STRING,
    primaryKey: true,
  },
  text: {
    type: DataTypes.STRING,
    allowNull: false,
  },
});
