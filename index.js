import {help,seTu} from "./apps/index.js";


let rule = {
  help: {
    reg: "^帮帮忙$", //匹配消息正则，命令正则
    priority: 5000, //优先级，越小优先度越高
    describe: "【#例子】测试帮助", //【命令】功能说明
  },
  seTu: {
    reg: "^#涩图$", //匹配消息正则，命令正则
    priority: 5000, //优先级，越小优先度越高
    describe: "【#涩图】发送#涩图获取涩图", //【命令】功能说明
  },
};

Bot.logger.mark("小黑屋插件初始化成功~")
export {rule,help,seTu}