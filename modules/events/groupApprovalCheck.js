const fs = require('fs');
const path = require('path');

module.exports.config = {
  name: "groupApprovalCheck",
  eventType: ["message"],
  version: "1.0.0",
  credits: "TOHI-BOT-HUB",
  description: "Check if group is approved before allowing commands"
};

module.exports.run = async function({ api, event, Groups }) {
  try {
    const { threadID, isGroup, senderID, body } = event;

    // Only check for group messages
    if (!isGroup) return true;

    const prefix = global.config.PREFIX || '%';

    // Check if message starts with prefix (is a command)
    if (!body || !body.startsWith(prefix)) return true;

    // Parse command name
    const commandName = body.substring(prefix.length).split(' ')[0].toLowerCase();
    
    // Check if sender is bot admin/owner
    const isOwner = global.config.ADMINBOT && global.config.ADMINBOT.includes(senderID);
    
    // Allow approve command for admins even in unapproved groups
    if (isOwner && commandName === 'approve') {
      return true;
    }

    // Check group approval status
    let isApproved = false;
    let isPending = false;
    let isRejected = false;

    try {
      isApproved = Groups.isApproved(threadID);
      isPending = Groups.isPending(threadID);
      isRejected = Groups.isRejected(threadID);
    } catch (error) {
      console.error('Groups system error:', error);
      // If Groups system fails, check if group exists in database
      const groupData = Groups.getData(threadID);
      if (!groupData) {
        // New group - add to pending
        try {
          await Groups.createData(threadID);
          Groups.addToPending(threadID);
          isPending = true;
        } catch (createError) {
          console.error('Error creating group data:', createError);
        }
      }
    }

    if (isRejected) {
      // Group is rejected - block all commands except for owners
      if (!isOwner) {
        return false;
      }
    } else if (isPending || !isApproved) {
      // Group is not approved yet
      let groupData = Groups.getData(threadID);

      if (!groupData) {
        // Create group data if doesn't exist
        try {
          groupData = await Groups.createData(threadID);
          Groups.addToPending(threadID);

          api.sendMessage(
            `⚠️ এই গ্রুপটি এখনো approve করা হয়নি!\n\n` +
            `🆔 Group ID: ${threadID}\n` +
            `📊 Status: Pending Approval\n\n` +
            `🚫 Bot commands কাজ করবে না যতক্ষণ না approve হয়।\n` +
            `👑 Admin: ${global.config.ADMINBOT?.[0] || 'Unknown'}`,
            threadID
          );

          // Notify admin
          if (global.config.ADMINBOT && global.config.ADMINBOT.length > 0) {
            for (const adminID of global.config.ADMINBOT) {
              try {
                await api.sendMessage(
                  `🔔 নতুন গ্রুপ approval এর জন্য অপেক্ষা করছে:\n\n` +
                  `📝 Group: ${groupData ? groupData.threadName : 'Unknown'}\n` +
                  `🆔 ID: ${threadID}\n` +
                  `👥 Members: ${groupData ? groupData.memberCount : 0}\n\n` +
                  `✅ Approve: ${prefix}approve ${threadID}\n` +
                  `❌ Reject: ${prefix}approve reject ${threadID}`,
                  adminID
                );
              } catch (notifyError) {
                console.error(`Failed to notify admin ${adminID}:`, notifyError);
              }
            }
          }
        } catch (error) {
          console.error('Error handling new group:', error);
        }
      } else {
        // Group exists but not approved - only notify once per session
        if (!global.pendingNotified) global.pendingNotified = {};
        
        if (!global.pendingNotified[threadID]) {
          api.sendMessage(
            `🚫 এই গ্রুপটি এখনো approve করা হয়নি!\n\n` +
            `📊 Status: ${groupData.status}\n` +
            `⏰ Admin approval এর জন্য অপেক্ষা করুন।\n\n` +
            `👑 Bot Admin: ${global.config.ADMINBOT?.[0] || 'Unknown'}`,
            threadID
          );
          global.pendingNotified[threadID] = true;
        }
      }

      // Block command execution for non-owners
      if (!isOwner) {
        return false;
      }
    }

    // Group is approved or user is owner - allow command execution
    return true;

  } catch (error) {
    console.error('Error in groupApprovalCheck:', error);
    return false; // Block command execution on error for safety
  }
};