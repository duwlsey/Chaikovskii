# 호두까기 인형 모음곡 · 음악 감상실

여덟 곡을 듣고, 활동지에 감상을 쓰고, 춤출 곡을 한 곡 고르는 태블릿용 수업 페이지입니다.

## 1. Apps Script 연결 (약 5분)

1. 새 Google 스프레드시트를 만듭니다. 스프레드시트는 학생에게 공유할 필요가 없습니다.
2. **확장 프로그램 → Apps Script**를 엽니다.
3. 기본 코드를 모두 지우고 이 저장소의 [`apps-script/Code.gs`](apps-script/Code.gs) 내용을 붙여 넣습니다.
4. 왼쪽 **프로젝트 설정(톱니바퀴) → 스크립트 속성 → 스크립트 속성 추가**에서 다음 값을 저장합니다.

   | 속성 | 값 |
   | --- | --- |
   | `TEACHER_PASSWORD` | 직접 정한 8자 이상의 교사 비밀번호 |
   | `ROOM_IDS` | `music-class` |

   비밀번호는 Apps Script의 스크립트 속성에만 넣으세요. GitHub 파일에 넣지 않습니다.
5. 코드 편집기로 돌아와 상단 함수 목록에서 **setup**을 선택하고 **실행**합니다. 요청되는 본인 스프레드시트 접근 권한을 허용합니다. 시트에 `선택_music-class` 탭이 생깁니다. setup을 다시 실행해도 기존 선택은 지우지 않습니다.
6. **배포 → 새 배포 → 유형 선택(톱니바퀴) → 웹 앱**을 선택합니다.
   - 실행 사용자: **나**
   - 액세스 권한: **모든 사용자** (익명 학생도 접속 가능한 항목)
7. 배포 후 **웹 앱 URL**을 복사합니다. 끝이 `/exec`인 주소를 사용합니다. `/dev` 주소가 아닙니다.
8. GitHub의 [`config.js`](config.js)를 열고 연필(편집)을 눌러 `scriptUrl: ""`의 따옴표 안에 웹 앱 URL을 붙여 넣고 저장합니다.

```js
window.CLASS_CONFIG = Object.freeze({
  scriptUrl: "여기에 복사한 https://script.google.com/macros/s/…/exec 주소",
  room: "music-class",
  pollIntervalMs: 2000
});
```

연결 전에도 음악은 들을 수 있습니다. 연결 전에는 선택 버튼을 잠가 기기에만 저장된 상태를 공유 상태로 오해하지 않도록 했습니다.

학교 계정에서 '모든 사용자' 배포가 허용되지 않으면 학교 관리자의 배포 정책을 확인해야 합니다. Apps Script 코드를 수정한 뒤에는 **배포 → 배포 관리 → 수정 → 버전: 새 버전 → 배포**로 반영하세요. 기존 웹 앱 URL은 유지할 수 있습니다.

## 2. GitHub Pages 배포

저장소: https://github.com/duwlsey/Chaikovskii

이 저장소는 **GitHub Actions 자동 배포**로 설정되어 있습니다. `main`에 파일을 저장하면 페이지가 갱신됩니다. 기본 주소는 **https://duwlsey.github.io/Chaikovskii/** 입니다. 최초 배포와 파일 수정 반영에 잠시 시간이 걸릴 수 있습니다.

다른 저장소에 사본을 만들었거나 수동 설정이 필요하면 **Settings → Pages → Source: GitHub Actions**를 선택하고 Actions 탭에서 **Publish music classroom → Run workflow**를 실행하세요.

**대안: 브랜치에서 바로 배포**

1. 저장소 **Settings → Pages**를 엽니다.
2. Source를 **Deploy from a branch**로 선택합니다.
3. Branch는 **main**, 폴더는 **/(root)**로 선택하고 Save를 누릅니다.
4. Pages 설정 상단에 표시되는 실제 배포 주소를 확인합니다. 기본 주소는 `https://duwlsey.github.io/Chaikovskii/`입니다.

별도의 빌드나 패키지 설치가 필요 없습니다. 함께 포함한 `.github/workflows/pages.yml`로 배포하려면 Source를 **GitHub Actions**로 선택하세요. 두 방식을 동시에 설정할 필요는 없습니다. Actions 워크플로는 사이트 파일만 배포하므로 Apps Script 소스는 웹 페이지의 일부로 배포되지 않습니다. 저장소 자체는 공개이므로 비밀번호를 절대 코드에 넣지 않습니다.

## 3. 수업 전에 확인

- 학생 패드 두 대로 같은 페이지를 엽니다. 두 패드 모두 **선택 현황 연결됨**이 나타나는지 확인합니다.
- 한 패드에서 한 곡을 선택합니다. 다른 패드에서 보통 2초 + 통신 시간 안에 **선택됨**으로 바뀌는지 확인합니다.
- 같은 곡을 동시에 선택해도 서버의 잠금 안에서 한 명만 확정됩니다. 늦은 학생에게는 다른 곡을 선택하라는 안내가 나타납니다.
- 상단 **Reset**을 누르고 본인이 정한 교사 비밀번호를 입력해 초기화합니다.
- 재생 버튼으로 음악이 나오고, 다시 누르거나 재생 조작 영역 밖을 누르면 멈추는지 확인합니다. 정지 시 처음으로 돌아갑니다. 다른 곡을 누르면 앞 곡이 멈춥니다. 다른 탭으로 이동하거나 화면이 숨겨져도 멈춥니다.
- 선택된 곡도 감상은 계속할 수 있습니다. 선택만 잠깁니다.

선택 기록은 이름 대신 이 브라우저의 임의 식별자로 저장합니다. 한 패드(정확히는 브라우저의 사이트 저장 공간)당 한 곡입니다. 선택한 뒤에는 학생이 브라우저를 바꾸거나 사이트 데이터를 지우지 않도록 안내하세요. 개인 로그인으로 학생을 구별하는 방식은 아닙니다. 초기화 후에는 같은 패드로 다시 선택할 수 있습니다.

## 다른 반에서 사용

반마다 현황을 나누려면 Apps Script 속성 `ROOM_IDS`를 `class-1,class-2`처럼 수정한 뒤 setup을 실행합니다. 반별 사이트 사본의 `config.js`에서 `room`을 해당 값으로 바꾸세요. 영문·숫자·하이픈·밑줄만 사용할 수 있습니다. 각 반에서 Reset을 누르면 그 반의 선택만 초기화됩니다.

## 곡과 감상 시간

| 곡 | 페이지의 감상 길이 | 방식 |
| --- | --- | --- |
| 작은 서곡 | 3:00 | 앞부분 감상 |
| 행진곡 | 약 2:46 | 전곡 |
| 사탕 요정의 춤 | 약 1:47 | 전곡 |
| 러시아 춤 | 약 1:13 | 전곡 |
| 아라비아 춤 | 3:00 | 앞부분 감상 |
| 중국 춤 | 약 1:08 | 전곡 |
| 갈대피리춤 | 약 2:24 | 전곡 |
| 꽃의 왈츠 | 3:00 | 앞부분 감상 |

재생 시간은 원본 파일의 메타데이터 기준이며 실제 끝은 약간 다를 수 있습니다. 영상·광고·배경 효과음 없이 오디오 파일만 재생합니다. 긴 곡은 플레이어에서 3분에 정지하며 원본 파일은 편집하거나 재인코딩하지 않습니다. 음원 보관소에 접근 가능한 인터넷 연결이 필요합니다.

## 출처

- 음악: [Sugarplums and Song / DuPage Symphony Orchestra, Barbara Schubert 지휘, Eric Pancer 녹음·게시, 2010-12-12](https://archive.org/details/dso20101212)
- 음원 라이선스: [CC BY-NC-ND 3.0 US](https://creativecommons.org/licenses/by-nc-nd/3.0/us/) — 원본 음원 연결, 비상업적 감상용. 음원 출처 표시는 페이지 하단에도 있습니다.
- 삽화: 이 페이지를 위해 제작한 SVG 원본. 페이지와 함께 포함되어 있습니다.
- 글꼴: Google Fonts의 Gowun Batang, Noto Sans KR. 글꼴 서버에 연결되지 않으면 기기 기본 글꼴로 표시됩니다.
- 기술 문서: [Apps Script ContentService](https://developers.google.com/apps-script/guides/content), [LockService](https://developers.google.com/apps-script/reference/lock/lock-service), [GitHub Pages](https://docs.github.com/en/pages/quickstart)

## 연결이 안 될 때

- `scriptUrl`의 `/exec` 주소와 `room` 값, `ROOM_IDS` 속성을 확인합니다.
- setup 실행 및 권한 허용을 확인하고, 웹 앱 실행 사용자가 '나', 접근 권한이 '모든 사용자'인지 확인합니다.
- Apps Script의 실행 내역에서 오류를 확인합니다. 비밀번호는 학생 페이지에 공개되지 않습니다.
- 선택 결과가 늦거나 네트워크 오류가 나면 버튼이 잠기고 연결 상태를 표시합니다. 성공 응답을 받기 전에는 확정되었다고 표시하지 않습니다. 저장 후 응답만 놓친 경우 다음 조회에서 실제 선택 상태를 복구합니다.
- 학생 수가 많아 Apps Script의 동시 실행/요청 한도에 닿으면 `pollIntervalMs`를 4000~6000으로 늘립니다. 기본 2초는 실시간 푸시가 아닌 주기적인 조회이며, 네트워크나 Google 서버 상황에 따라 더 늦어질 수 있습니다.
