module.exports = function(sequelize, DataTypes) {
  return sequelize.define('System_region', {
    region_id: {
      type: DataTypes.INTEGER(10),
      allowNull: false,
      autoIncrement: true,
      primaryKey: true,
      defaultValue: null
    },
    parent_id: {
      type: DataTypes.INTEGER(10),
      allowNull: false,
      autoIncrement: false,
      primaryKey: false,
      defaultValue: 0
    },
    region_name: {
      type: DataTypes.STRING,
      allowNull: false,
      autoIncrement: false,
      primaryKey: false,
      defaultValue: 
    },
    region_type: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      autoIncrement: false,
      primaryKey: false,
      defaultValue: 2
    },
    is_delete: {
      type: DataTypes.STRING,
      allowNull: true,
      autoIncrement: false,
      primaryKey: false,
      defaultValue: 0
    },
    is_carriage_region: {
      type: DataTypes.INTEGER(3),
      allowNull: false,
      autoIncrement: false,
      primaryKey: false,
      defaultValue: 0
    }
  }, {
    tableName: 'system_region'
  });
};