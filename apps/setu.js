import {downloadTasks} from "../components/downloadTasks.js";
import fs from "fs";
import path from "path";
import { segment } from "oicq";
const tasks=new downloadTasks()
const _path = process.cwd();

if (!fs.existsSync(`${_path}/data/setu/`)) {
  fs.mkdirSync(`${_path}/data/setu/`);
}

export async function seTu(e){

  const files = fs.readdirSync(`${_path}/data/setu/`).filter((value) => {
    return [".jpg", ".png", ".gif"].includes(path.extname(value));
  });

  try {
    if (files.length===0){
      e.reply([segment.image(`file:///${_path}/plugins/xhw-plugin/resources/setu/bukeyisese.png`)]);
      if (!tasks.isRun()){

        tasks.start(20)
      }
      return false
    }
    if (files.length<40){
      if (!tasks.isRun()){
        tasks.start(20)
      }
    }
  }catch (err) {
    e.reply(err)
    return false
  }

  let random = randomNum(0, files.length-1);
  let imgPath = files[random];
  let jsonPath = path.basename(imgPath, path.extname(imgPath));

  let json;
  try {
    let jsonData = fs.readFileSync(`${_path}/data/setu/${jsonPath}.json`, "utf-8");
    json = JSON.parse(jsonData);
  } catch (err) {
    Bot.logger.error("读取json文件出错"+err)
    fs.unlinkSync(`${_path}/data/setu/${imgPath}`);
    fs.unlinkSync(`${_path}/data/setu/${jsonPath}.json`);
    return false
  }
  const msg=[
    segment.image(`file:///${_path}/data/setu/${imgPath}`),
    "\npixivID: " + json.pid,
    "\n画师: " + json.author,
  ]
  e.reply(msg).then(_=>{
    //发送成功释放空间
    fs.unlinkSync(`${_path}/data/setu/${imgPath}`);
    fs.unlinkSync(`${_path}/data/setu/${jsonPath}.json`);
  }).catch(err=>{
    Bot.logger.error("图片发送失败",  "\npixivID: " + json.pid, "\n画师: " + json.author)
    e.reply([segment.image(`file:///${_path}/plugins/xhw-plugins/resources/setu/bukeyisese.png`)]);
  })
  return true
}
function randomNum(minNum, maxNum) {
  switch (arguments.length) {
    case 1:
      return parseInt(Math.random() * minNum + 1, 10);
      break;
    case 2:
      return parseInt(Math.random() * (maxNum - minNum + 1) + minNum, 10);
      break;
    default:
      return 0;
      break;
  }
}

async  function init() {

  const files=getSeTuTotal()
  if (files < 40) {
   tasks.setNumberOfDownload(20)
    tasks.start()
  }
Bot.logger.debug("init执行成功-----当前涩图总数"+files)
}
function getSeTuTotal() {
  return fs.readdirSync(`${_path}/data/setu/`).filter((value) => {
    return [".jpg", ".png", ".gif"].includes(path.extname(value));
  }).length;
}
await init()
