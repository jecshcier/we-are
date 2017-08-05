module.exports = function(sequelize, DataTypes) {
  return sequelize.define('Teach_process', {
    process_id: {
      type: DataTypes.STRING,
      allowNull: false,
      autoIncrement: false,
      primaryKey: true,
      defaultValue: null
    },
    user_id: {
      type: DataTypes.STRING,
      allowNull: false,
      autoIncrement: false,
      primaryKey: false,
      defaultValue: null
    },
    book_id: {
      type: DataTypes.STRING,
      allowNull: false,
      autoIncrement: false,
      primaryKey: false,
      defaultValue: null
    },
    book_chapter_dir_id: {
      type: DataTypes.STRING,
      allowNull: true,
      autoIncrement: false,
      primaryKey: false,
      defaultValue: null
    },
    book_chapter_no: {
      type: DataTypes.INTEGER(11),
      allowNull: true,
      autoIncrement: false,
      primaryKey: false,
      defaultValue: 0
    },
    book_chapter_name: {
      type: DataTypes.STRING,
      allowNull: true,
      autoIncrement: false,
      primaryKey: false,
      defaultValue: null
    },
    book_section_dir_id: {
      type: DataTypes.STRING,
      allowNull: true,
      autoIncrement: false,
      primaryKey: false,
      defaultValue: null
    },
    book_section_no: {
      type: DataTypes.INTEGER(11),
      allowNull: true,
      autoIncrement: false,
      primaryKey: false,
      defaultValue: 0
    },
    book_section_name: {
      type: DataTypes.STRING,
      allowNull: true,
      autoIncrement: false,
      primaryKey: false,
      defaultValue: null
    },
    page_name: {
      type: DataTypes.STRING,
      allowNull: false,
      autoIncrement: false,
      primaryKey: false,
      defaultValue: null
    },
    page_num: {
      type: DataTypes.INTEGER(11),
      allowNull: true,
      autoIncrement: false,
      primaryKey: false,
      defaultValue: 0
    },
    detail_count: {
      type: DataTypes.INTEGER(11),
      allowNull: false,
      autoIncrement: false,
      primaryKey: false,
      defaultValue: 0
    },
    process_name: {
      type: DataTypes.STRING,
      allowNull: true,
      autoIncrement: false,
      primaryKey: false,
      defaultValue: null
    },
    process_type: {
      type: DataTypes.STRING,
      allowNull: true,
      autoIncrement: false,
      primaryKey: false,
      defaultValue: null
    },
    process_note: {
      type: DataTypes.STRING,
      allowNull: true,
      autoIncrement: false,
      primaryKey: false,
      defaultValue: null
    },
    pos_x: {
      type: DataTypes.INTEGER(11),
      allowNull: true,
      autoIncrement: false,
      primaryKey: false,
      defaultValue: 0
    },
    pos_y: {
      type: DataTypes.INTEGER(11),
      allowNull: true,
      autoIncrement: false,
      primaryKey: false,
      defaultValue: 0
    },
    create_user: {
      type: DataTypes.STRING,
      allowNull: true,
      autoIncrement: false,
      primaryKey: false,
      defaultValue: null
    },
    update_user: {
      type: DataTypes.STRING,
      allowNull: true,
      autoIncrement: false,
      primaryKey: false,
      defaultValue: null
    },
    create_time: {
      type: DataTypes.DATE,
      allowNull: true,
      autoIncrement: false,
      primaryKey: false,
      defaultValue: null
    },
    update_time: {
      type: DataTypes.DATE,
      allowNull: true,
      autoIncrement: false,
      primaryKey: false,
      defaultValue: null
    },
    del_flag: {
      type: DataTypes.INTEGER(1),
      allowNull: true,
      autoIncrement: false,
      primaryKey: false,
      defaultValue: 0
    }
  }, {
    tableName: 'teach_process'
  });
};