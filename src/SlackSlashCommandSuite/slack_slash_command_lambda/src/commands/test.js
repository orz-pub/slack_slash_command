"use strict";

exports.do = function(event, context, end) {
    const args = event.text.split(" ");

    const functionName = args[0];

    if (typeof this[functionName] !== "function") {
        context.slackText = `/test 에서 지원하지 않는 명령입니다. ${functionName}`;
        end();
        return;
    }

    this[functionName](args, event, context, end);
}

exports.echo = function (args, event, context, end) {
    context.slackText = `call ${args}`;
    end();
}