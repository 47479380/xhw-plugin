import schedule from "node-schedule";
import HttpsProxyAgent from "https-proxy-agent";
import fetch from "node-fetch";
import qs from "qs";
import path from "path";
import { promisify } from "util";
import { pipeline } from "node:stream";
import fs from "fs";
const mode="DEV"
//项目路径
const _path = process.cwd();
class downloadTasks {

  _isRun = false;
  _JobName = "0/30 * * * * *";
  apis = [{
    errorNum: 0,
    url: "https://api.lolicon.app/setu/v2",
    parameter: {
      num: 10,
      r18: 0,
      tag: "原神",
      //不需要转换

    },
    transform: function(data) {
      return data;
    },
  }, {
    errorNum: 0,
    url: "https://setu.yuban10703.xyz/setu",
    parameter: {
      num: 10,
      r18: 0,
      tags: "原神",
      // 转换成lolicon一样的数据格式


    },
    transform: function(data) {
      return {
        "pid": data.artwork.id,
        "p": data.page,
        "uid": data.author.id,
        "title": data.artwork.title,
        "author": data.author.name,
        "r18": data.r18,
        "width": data.size.width,
        "height": data.size.height,
        "tags": data.tags,
        "uploadDate": data.create_date,
        "urls": data.urls,
      };
    },

  }];
  pixivData = [];
  _downloadImageErrorNum=0
  _numberOfDownloaded=0
  _numberOfDownload=0
  //判断是否在运行
  isRun() {
    return this._isRun;
  }
  setNumberOfDownload(num){
    this._numberOfDownload=num
  }
  start(num=20) {
    //如果增在运行直接返回
    if (this.isRun()) return;
    if (this.apis.length===0){
      throw "api已经全部失效"
    }
    if (this._downloadImageErrorNum>=5){
      throw "下载图片错误已经超过"+this._downloadImageErrorNum+"次"
    }
    if (this._numberOfDownload===0){
      this.setNumberOfDownload(num)
    }
    this._isRun = true;
   this.job= schedule.scheduleJob(this._JobName, this.task.bind(this));
    Bot.logger.info("开始执行下载任务----------------------")
  }
  cancel(){
    this._isRun=false
    this.job.cancel()
    Bot.logger.info("取消下载任务----------------------")
  }
  async task() {
    // 没有数据 需要先获取数据
    if (!this.pixivData.length) {
      const api = this.apis.pop();
      const data = await this.getPixivData(api);

      if (!data) {
        //连续出错次数超过了5次停止使用这个api
        if (api.errorNum < 5) {
          api.errorNum++
          this.apis.unshift(api);
        }
        //api全部失效了取消任务
        if (this.apis.length===0){
          this.cancel()
        }
        return
      }else {
        //获取pixivData数据成功
        api.errorNum=0
        this.apis.unshift(api);
      }

      this.pixivData = this.pixivData.concat(data);
    }
    const data = this.pixivData.pop();
    try {
     await this.downloadImage(data)
      this._downloadImageErrorNum=0

      Bot.logger.info("下载涩图"+data.urls.original+"成功")
    }catch (e) {
      this._downloadImageErrorNum++
      if (this._downloadImageErrorNum>=5){
        this.cancel()
      }
      Bot.logger.error(`下载涩图${data.urls.original}异常${e}`)
    }

    this._numberOfDownloaded++
    // 下载够了停止任务
    if (this._numberOfDownloaded>=this._numberOfDownload){
      this._numberOfDownloaded=0
      this._numberOfDownload=0
      this.cancel()
    }

  }

  async downloadImage(data){
      //   下载图片
      const response = await $fetch(data.urls.original);
      if (!response.ok) {
        //下载失败
       throw "下载失败 状态码错误"
      }
      //截取文件扩展名
      const ename = path.extname(data.urls.original);
      //保存文件
      const streamPipeline = promisify(pipeline);

      await streamPipeline(response.body, fs.createWriteStream(`${_path}/data/setu/${data.pid}`));
       fs.writeFileSync(`${_path}/data/setu/${data.pid}.json`, JSON.stringify(data));
       //等文件下载完成再重命名为图片避免没有下载完成就被发送了
       if (!fs.existsSync(`${_path}/data/setu/${data.pid}${ename}`)){
         fs.renameSync(`${_path}/data/setu/${data.pid}`,`${_path}/data/setu/${data.pid}${ename}`)

       }
  }
  async getPixivData(api) {
    const { url, parameter, transform } = api;
    try {
      const response = await $fetch(url + `?${qs.stringify(parameter)}&replace_url=https://i.pixiv.re`);
      if (!response.ok) {
        //请求没有成功
        return false;
      }
      const json = await response.json();
      if (json?.data && json.data.length) {
        Bot.logger.info("获取数据成功")
        return json.data.map(transform);
      } else {
        //  没有数据返回
        return false;
      }
    } catch (e) {
      //网络错误
      return false;

    }


  }

}

//重写$fetch
function $fetch(url, config = {}) {
  //开发的时候使用代理
  if (mode === "DEV") {
    config.agent = new HttpsProxyAgent("http://127.0.0.1:1081");
  }
  return fetch(url, config);
}
export {downloadTasks}