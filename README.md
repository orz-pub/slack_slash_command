# Slack Slash Command with AWS
슬랙의 슬래시(/) 명령어를 AWS 를 이용하여 구현

--------------------------------------------------------------------------------

Lambda 생성
-----------
- `./src/SlackSlashCommandSuite/slack_slash_command_lambda` 아래의 파일을 zip 으로 묶어 올린다
  - [참고](./img/create_lambda.jpg)

- 람다가 프라이빗 서브넷에 접근하면서, 외부 인터넷도 되어야 하는 상황이면 추가 설정이 필요하다
  - [참고](https://docs.aws.amazon.com/AmazonVPC/latest/UserGuide/VPC_Scenario2.html)

API Gateway 생성
----------------
- API 를 생성하고 리소스를 생성한다
- `POST` 메서드를 생성하고, 람다를 통합 포인트로 선택한다
  - [참고](./img/create_api_gateway.jpg)
- `통합 요청`의 `본문 매핑 템플릿`의 `매핑 템플릿 추가(정의된 템플릿이 없는 경우)`를 누른다
- `Content-Type`에 `application/x-www-form-urlencoded`를 입력하고, [코드](/src/apigateway_integration_request/apigateway_integration_request.txt)를 붙여넣어 저장한다
  - 슬랙이 보내는 데이터를 람다가 처리할 수 있도록 변환한다
  - [참고](./img/api_gateway_post_integration_request.jpg)
- `통합 응답`의 `본문 매핑 템플릿`의 `application/json` 항목에 `#set($inputRoot = $input.path('$'))` 를 추가한다
  - 람다에서 리턴하는 메시지를 슬랙에서 보이지 않도록 하기 위한 것으로 생략해도 된다
    - 슬랙에서 명령은 보이지 않고, 결과만 보이게 하고 싶은 경우에 사용한다
  - [참고](./img/api_gateway_post_integration_response.jpg)

slack_slash_command_lambda
--------------------------
- 구현은 `Node.js` 로 하였다
- `app.js`
  - `src/commands` 아래에 슬랙 명령어를 이름으로 하는 `js` 파일의 `work` 함수를 호출한다
    - 예를 들어 `/test` 라는 명령어는 `src/commands/test.js` 파일에 `work` 함수로 구현한다
- 람다 환경 변수
  - 설정과 같은 외부 정보를 저장하는데 활용한다
  - 토큰 검사를 위해 `slack_slash_command_token` 에 슬랙 토큰 값을 넣는다
    - [참고](./img/lambda_env.jpg)
  - `process.env.이름` 처럼 같이 접근한다
    - `process.env.slack_slash_command_token`
- Cold Start 방지
  - 대부분의 람다 호출이 Cold Start 로 실행될 가능성이 높다
    - 자원을 할당 받는 시간만큼 명령 응답이 늦어진다
  - CloudWatch 의 Event 로 람다를 주기적으로 호출하여 Warm Start 를 유지한다
    - 입력 `json` 에 `"from_cloud_watch": true` 를 추가하여, 슬랙이 아닌 AWS 의 Event 임을 알린다
      - `{ "from_cloud_watch": true }`
    - [참고](./img/cloudwatch_event.jpg)
- 메시지 포멧
  - 원하는 모양의 결과를 얻으려면 슬랙의 메시지 포멧을 [참고](https://api.slack.com/docs/messages)한다
