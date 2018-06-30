Slack Slash Command
-------------------
슬랙에서 내리는 슬래시(/) 명령어를 AWS 서비스를 이용하여 구현하는 프로젝트

AWS 에 대한 기본적인 이해가 있다는 가정 하에 설치하는 방법을 기술한다

--------------------------------------------------------------------------------

Lambda 생성
-----------
- `./src/SlackSlashCommandSuite/slack_slash_command_lambda` 아래의 파일을 zip 으로 묶어 올린다
  - [참고](./img/create_lambda.jpg)

- 만약 Lambda 가 private-subnet 에 접근하면서 인터넷도 되야하는 상황이면 추가 설정이 필요하다
  - https://docs.aws.amazon.com/AmazonVPC/latest/UserGuide/VPC_Scenario2.html

API Gateway 생성
----------------
- API 를 생성하고 리소스를 생성한다
- POST 메서드를 생성하고, Lambda 를 통합 포인트로 선택한다
  - [참고](./img/create_api_gateway.jpg)

- `통합 요청`의 `본문 매핑 템플릿`의 `매핑 템플릿 추가(정의된 템플릿이 없는 경우)`를 누른다
- `Content-Type`에 `application/x-www-form-urlencoded`를 입력하고, [코드](/src/apigateway_integration_request/apigateway_integration_request.txt)를 붙여넣어 저장한다
  - [참고](./img/api_gateway_post_integration_request.jpg)
  - 슬랙이 보내는 데이터를 람다가 처리할 수 있도록 변환하는 역할을 한다
- `통합 응답`의 `본문 매핑 템플릿`의 `application/json` 항목에 `#set($inputRoot = $input.path('$'))` 를 추가한다
  - [참고](./img/api_gateway_post_integration_response.jpg)
  - Lambda 에서 리턴하는 메시지를 슬랙에서 보이지 않도록 하기 위한 것으로 생략해도 된다
    - 슬랙 명령은 보이지 않고, 결과만 보이게 하고 싶은 경우

slack_slash_command_lambda
----------------------
- Lambda 를 Node.js 로 구현
- `app.js`
  - `src/commands` 아래에 슬랙 명령어를 이름으로 하는 js 파일의 `work` 함수를 호출한다
    - 예를 들어 `/test` 라는 명령어는 `src/commands/test.js` 파일에 `work` 함수로 구현한다
- Lambda 환경 변수
  - 설정과 같은 외부 정보를 저장하는데 활용한다
  - 토큰 검사를 위해 `slack_slash_command_token` 에 슬랙 토큰 값을 넣는다
  - `process.env.이름` 처럼 같이 접근한다
    - 예: `process.env.slack_slash_command_token`
