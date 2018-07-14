"use strict";

var fs = require("fs");
var request = require("request");

const CACHE = {};

const responseSlack = function(event, context, end) {
    context.slackAttachments.push({
        "footer": `by \`${event.user_name}\``,
        "mrkdwn": true,
        "color": "#" + getRandomColorRGB()
    });

    const response = {
        "response_type": context.response_type || "ephemeral",
        "channel": event.channel_id,
        "text": context.slackText,
        "attachments": context.slackAttachments,
        "mrkdwn": true
    };

    if (event.local_test) {
        console.log(response);
        end(null, response);
        return;
    }

    const options = {
        method: "POST",
        url: event.response_url,
        headers: {
            "Content-Type": "application/json"
        },
        json: response
    };

    request(options,
        function(err, res, body) {
            if (err) {
                console.log(`슬랙 응답 오류: ${err}`);
                end(null, null);
                return;
            }

            end(null, "API Gateway 통합응답 설정이 되어 있다면, 이 메시지는 보이지 않는다");
        });
}

function getRandomColorRGB() {
    return Math.random().toString(16).substr(2, 6);
}

exports.handler = function(event, context, end) {
    if (event.from_cloud_watch) {
        event.load_files.forEach((file) => {
            if (CACHE[file] == null) {
                console.log(`load ${file}`);
                CACHE[file] = require(file);
            }
        });

        end(null, null);
        return;
    }

    console.log(event);

    context.slackText = "기본 응답";
    context.slackAttachments = [];
    context.response_type = "ephemeral";    // response message will be visible only to the user that issued the command.

    const errorMessage = checkValidRequest(event);
    if (checkValidRequest(event)) {
        context.slackText = errorMessage;
        responseSlack(event, context, end);
        return;
    }

    const commmand = event.command.replace("/", "");
    const workerFile = `./src/commands/${commmand}.js`;

    if (fs.existsSync(workerFile) === false) {
        context.slackText = `유효한 명령어가 아닙니다. file not exists. \`${event.command} ${event.text}\``;
        responseSlack(event, context, end);
        return;
    }

    if (CACHE[workerFile] == null) {
        CACHE[workerFile] = require(workerFile);
    }

    const worker = CACHE[workerFile];
    if (typeof worker.do !== "function") {
        context.slackText = `유효한 명령어가 아닙니다. function not exists. \`${event.command} ${event.text}\``;
        responseSlack(event, context, end);
        return;
    }

    // context.response_type = "in_channel";   // 채널 전체에게 보이게 한다.

    worker.do(event, context, responseSlack.bind(this, event, context, end));
}

function checkValidRequest(event) {
    var errorMessage = null;
    if (event.token !== process.env.slack_slash_command_token) {
        errorMessage = `유효한 토큰이 아닙니다. ${event.token}`;
        console.log(errorMessage);
    }

    return errorMessage;
}