module.exports = {
  //dev or production
  MODE:"dev",
  teslaVersion: "0.3.0",
  projectName: "/weare",
  staticUrl: "/weare/tesla",
  Api: {
    skydisk: {
      url: "http://pan.tes-sys.com/skydisk-ms/",
      staticKey: "A91E2F",
      uploadUrl: "api/fileUploadForJson.html",
      newDirUrl: "api/dirNewCreate.html",
      fileListUrl: "api/dirList.html"
    },
    ums: {
      url: "http://ums.tes-sys.com/ums-api"
    },
    tesla_api: {
      host: 'http://127.0.0.1:3030/weare/api/',
    },
    rms:{
      url:"http://es.tes-sys.com/rm"
    }
  },
  sourceDir: {
    sourceDir: "sourceDir",
    sourceUrl: __dirname + '/sourceDir/',
    userTxUrl: "userTx",
    userTxDir: __dirname + '/userTx/',
    imgUrl:'img',
    imgDir:__dirname + '/tmp/'
  },
  system_key: "tesla_key",
  systemCode: 'tesla'
}
