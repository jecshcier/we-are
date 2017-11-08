module.exports = {
    db_config: {
        databaseName: "tesedu",
        username: "root",
        password: "Admin12345*",
        options: {
            define: {
                timestamps: false // true by default
            },
            timezone: "+08:00",
            host: "192.168.109.150",
            // host:"localhost",
            dialect: "mysql",
            dialectOptions: {
                charset: "utf8mb4"
            }
        }
    },
    teslaVersion: "0.2.0",
    skydiskApiKey: "A91E2F",
    projectName: "/weare",
    static: "/weare/tesla",
    img: "/weare/img",
    imgDir: "../../../tmp/",
    TxDir: "userTx/",
    skydiskServer: "http://pan.tes-sys.com/skydisk-ms/",
    newDirApi: "api/dirNewCreate.html",
    uploadApi: "api/fileUpload.html",
    getFileListApi: "api/dirList.html",
    Api: {
        skydisk: {
            url: "http://math.tes-sys.com/skydisk-ms/",
            staticKey: "A91E2F",
            uploadUrl: "api/fileUploadForJson.html",
            uploadModel: function (d, data, url, role_type, createUser) {
                this.d = d
                this.data = data
                this.url = url
                this.role_type = role_type
                this.createUser = createUser
            }
        },
        ums: {
            url: "http://ums.tes-sys.com/ums-api"
        }
    },
    sourceDir: {
        sourceDir: "sourceDir",
        sourceUrl: process.cwd() + '/',
        userImg: "userTx"
    },
    uploadCallbackUrl: "http://localhost:3000/weare/getUploadFile"
}
