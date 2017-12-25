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
            // host:"192.168.109.236",
            host:"127.0.0.1",
            dialect: "mysql",
            dialectOptions: {
                charset: "utf8mb4"
            }
        }
    },
    teslaVersion: "0.2.2",
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
    callbackModel:function(flag,message,data){
        return {
            flag:false,
            message:'',
            data:null
        }
    },
    Api: {
        skydisk: {
            url: "http://pan.tes-sys.com/skydisk-ms/",
            staticKey: "A91E2F",
            uploadUrl: "api/fileUploadForJson.html",
            uploadModel: function (d, data, url, role_type, createUser) {
                this.d = d
                this.data = data
                this.url = url
                this.role_type = role_type
                this.createUser = createUser
            },
            newDirUrl: "api/dirNewCreate.html",
            newDirModel: function (d, url, diskName, role_type, createUser, pubFlag) {
                this.d = d
                this.url = url
                this.diskName = diskName
                this.role_type = role_type
                this.createUser = createUser
                this.pubFlag = pubFlag
            },
            fileListUrl: "api/dirList.html",
            fileListModel: function (d, url, role_type, user_id, order_name, order_type, disk_type, singlePage_fileNum, no) {
                this.d = d
                this.url = url
                this.role_type = role_type
                this.user_id = user_id
                this.order_name = order_name
                this.order_type = order_type
                this.disk_type = disk_type
                this.singlePage_fileNum = singlePage_fileNum
                this.no = no
            }
        },
        ums: {
            url: "http://ums.tes-sys.com/ums-api"
        }
    },
    sourceDir: {
        sourceDir: "sourceDir",
        sourceUrl: __dirname + '/',
        userImg: "userTx"
    },
    uploadCallbackUrl: "http://localhost:3000/weare/getUploadFile"
}
