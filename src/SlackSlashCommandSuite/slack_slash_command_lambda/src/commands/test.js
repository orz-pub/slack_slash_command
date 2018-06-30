"user strict";

exports.do = function(event, context, end) {
    context.slackText = "테스트 성공";
    end();
}