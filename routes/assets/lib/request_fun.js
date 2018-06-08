const config = require('../../../config')
const crypto = require('crypto')
const request = require('request')

let system_key = crypto.createHash('sha1').update(config.system_key).digest('hex')

const postReq = (url, data) =>{
  let info = {
    flag: false,
    message: '',
    data: null
  }
  data.token = system_key
  return new Promise((resolve, reject) => {
    request.post({
      url: url,
      body: data,
      json: true
    }, function optionalCallback(err, httpResponse, body) {
      if (err) {
        info.message = err
        console.log("错误")
        reject(info)
      } else {
        if (body) {
          if (typeof body !== 'object') {
            info.message = '404'
            reject(info)
            return
          }
          if (body.flag) {
            info.flag = true
            info.message = body.message
            info.data = body.data
            resolve(info)
          } else {
            info.message = body.message
            info.data = body.data
            reject(info)
          }
        } else {
          info.message = '500'
          reject(info)
        }
      }
    })
  })
}

const postReqCommon = (url, data) =>{
  let info = {
    flag: false,
    message: '',
    data: null
  }
  return new Promise((resolve, reject) => {
    request.post({
      url: url,
      body: data,
      json: true
    }, function optionalCallback(err, httpResponse, body) {
      if (err) {
        info.message = err
        console.log("错误")
        reject(info)
      } else {
        if (body) {
          if (typeof body !== 'object') {
            info.message = '404'
            reject(info)
            return
          }
          info.flag = true
          info.message = "请求成功"
          info.data = body
          resolve(info)
        } else {
          info.message = '500'
          reject(info)
        }
      }
    })
  })
}

const postProxy = (url,req,res) => {
  req.pipe(request(url)).pipe(res);
}

module.exports = {
  postReq:postReq,
  postReqCommon:postReqCommon,
  postProxy:postProxy
}
