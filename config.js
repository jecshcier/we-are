exports.db_config = {
    databaseName: 'tesedu',
    username: 'root',
    password: 'Admin12345*',
    options: {
        define: {
            timestamps: false // true by default
        },
        timezone: '+08:00',
        host: 'localhost',
        dialect: 'mysql',
        dialectOptions: {
            charset: 'utf8mb4'
        }
    }
};
exports.teslaVersion = "0.1.3"
exports.skydiskApiKey = 'A91E2F';
exports.projectName = '/weare';
exports.static = '/weare/tesla';
exports.Tx = '/weare/userTx';
exports.img = '/weare/img';
exports.imgDir = '../../../tmp/';
exports.TxDir = 'userTx/';
exports.skydiskServer = 'http://pan.tes-sys.com/skydisk-ms/';
exports.newDirApi = 'api/dirNewCreate.html';
exports.uploadApi = 'api/fileUpload.html';
exports.getFileListApi = 'api/dirList.html';
exports.uploadCallbackUrl = 'http://localhost:3000/weare/getUploadFile';
