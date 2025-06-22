
module.exports.config = {
  name: "uptime",
  version: "4.0.0",
  permission: 0,
  usePrefix: true,
  commandCategory: "system",
  credits: "TOHI-BOT-HUB ",
  aliases: ["upt", "ut", "status"]
};

function byte2mb(bytes) {
  const units = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  let l = 0, n = parseInt(bytes, 10) || 0;
  while (n >= 1024 && ++l) n = n / 1024;
  return `${n.toFixed(n < 10 && l > 0 ? 1 : 0)} ${units[l]}`;
}

module.exports.run = async ({ api, event }) => {
  const { threadID } = event;

  // Step 1: Send first loading message (45%)
  const loading = await api.sendMessage("TOHI-BOT UPTIME LOADING... [▓▓░░] 45%", threadID);

  // Step 2: Edit to 75%
  setTimeout(() => {
    api.editMessage("TOHI-BOT UPTIME LOADING... [▓▓▓▓▓░] 75%", loading.messageID, threadID);
  }, 400);

  // Step 3: Edit to 100%
  setTimeout(() => {
    api.editMessage("TOHI-BOT UPTIME LOADING... [▓▓▓▓▓▓▓▓] 100%", loading.messageID, threadID);
  }, 700);

  // Step 4: Edit to final status
  setTimeout(() => {
    // Calculate uptime
    const time = process.uptime();
    const hours = Math.floor(time / 3600);
    const minutes = Math.floor((time % 3600) / 60);
    const seconds = Math.floor(time % 60);
    const moment = require("moment-timezone");
    const timeNow = moment.tz("Asia/Dhaka").format("DD/MM/YYYY | HH:mm:ss");
    
    // Get real bot configuration
    const { commands } = global.client;
    const config = global.config;
    const prefix = config.PREFIX || '%';
    const botName = config.BOTNAME || "TOHI-BOT";
    const adminName = config.ADMINNAME || "TOHIDUL ISLAM";
    const facebookLink = config.FACEBOOK || "https://www.facebook.com/tohi.khanx";
    
    // Get real user and thread data
    const totalUsers = global.data.allUserID ? global.data.allUserID.length : 0;
    const totalThreads = global.data.allThreadID ? global.data.allThreadID.length : 0;
    
    // Get system stats using Node.js built-in methods
    const memUsage = process.memoryUsage();
    const cpuUsage = process.cpuUsage();
    
    // Calculate CPU percentage (approximation)
    const startTime = process.hrtime();
    setTimeout(() => {
      const diff = process.hrtime(startTime);
      const cpuPercent = ((diff[0] * 1e9 + diff[1]) / 1e9 * 100).toFixed(1);
    }, 10);
    
    // Memory usage in MB
    const memoryUsedMB = (memUsage.heapUsed / 1024 / 1024).toFixed(1);
    const memoryTotalMB = (memUsage.heapTotal / 1024 / 1024).toFixed(1);
    
    // System memory usage percentage (approximation)
    const memoryPercent = ((memUsage.heapUsed / memUsage.heapTotal) * 100).toFixed(1);
    
    // Calculate ping
    const ping = Date.now() - event.timestamp;
    
    let msg = `
╭─────◆◇◆─────╮
│ 🤖 𝗧𝗢𝗛𝗜-𝗕𝗢𝗧 𝗦𝗧𝗔𝗧𝗨𝗦 │
╰─────◆◇◆─────╯

💚 𝗦𝘁𝗮𝘁𝘂𝘀: 𝐎𝐍𝐋𝐈𝐍𝐄 ✨
⚡ 𝗨𝗽𝘁𝗶𝗺𝗲: ${hours}h ${minutes}m ${seconds}s
🎯 𝗖𝗼𝗺𝗺𝗮𝗻𝗱𝘀: ${commands.size}
👥 𝗨𝘀𝗲𝗿𝘀: ${totalUsers} | 💬 𝗚𝗿𝗼𝘂𝗽𝘀: ${totalThreads}
💾 𝗥𝗔𝗠: ${memoryUsedMB}𝗠𝗕 (${memoryPercent}%)
🌐 𝗣𝗶𝗻𝗴: ${ping}𝗺𝘀

◈ 𝗢𝘄𝗻𝗲𝗿: ${adminName}
◈ 𝗣𝗿𝗲𝗳𝗶𝘅: ${prefix}

▪▫▪▫ 𝗥𝘂𝗻𝗻𝗶𝗻𝗴 𝗦𝗺𝗼𝗼𝘁𝗵𝗹𝘆! ▫▪▫▪
`;
    api.editMessage(msg, loading.messageID, threadID);
  }, 1000);
};
