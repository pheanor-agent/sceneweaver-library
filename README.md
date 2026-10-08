# SceneWeaver Library

**매일, 세 개의 세계를 펼칩니다.**

영화 같은 한 장면, 아름다운 애니메이션, 아이와 함께 읽는 따뜻한 동화. SceneWeaver는 그림과 한국어 이야기를 한 페이지씩 감상하는 스토리북 서재입니다.

### [웹 서재에서 읽기 →](https://pheanor-agent.github.io/sceneweaver-library/)

## 세 가지 이야기

| 유형 | 이야기의 컨셉 |
| --- | --- |
| 영화 | 가상의 20대 한국 여성 주인공의 매력과 주체적인 행동을 다양한 장르의 영화 같은 장면으로 담습니다. |
| 애니메이션 | 이야기마다 어울리는 주인공과 세계를 아름다운 색채와 연출로 펼칩니다. |
| 동화 | 유치원생을 위한 쉬운 한국어, 귀여운 그림, 아름다운 주제와 따뜻한 결말을 담습니다. |

매일 유형별 한 권씩, 총 세 권을 만들며 각 책은 독립적으로 정한 **10–30페이지**로 구성합니다. 한 페이지에는 그림 한 장과 이야기 한 단락이 함께 놓입니다.

## 서재에서 할 수 있는 일

- **오늘의 신간**에서 가장 최근에 공개된 세 권을 만납니다.
- **날짜별 서재**에서 쌓여 가는 책을 찾고, 월·유형·제목으로 탐색합니다.
- 그림의 원래 비율을 유지한 읽기 화면에서 이전·다음 이동과 페이지 선택을 사용합니다.
- 같은 브라우저에서는 마지막으로 읽은 페이지부터 이어 읽습니다.
- 휴대폰과 데스크톱에서 작품별 분위기에 맞춘 화면을 감상합니다.

## 첫 공개 작품 · 2026년 10월 8일

| 유형 | 작품 | 분량 |
| --- | --- | --- |
| 영화 | [파도 아래의 지도](https://pheanor-agent.github.io/sceneweaver-library/?book=20261008-book-01) | 28페이지 |
| 애니메이션 | [달빛을 잇는 북](https://pheanor-agent.github.io/sceneweaver-library/?book=20261008-book-02) | 17페이지 |
| 동화 | [콩콩이와 무지개 물방울](https://pheanor-agent.github.io/sceneweaver-library/?book=20261008-book-03) | 19페이지 |

## 매일 업데이트

**Hermes 내부 시스템이 매일 새벽 3시(KST)에 생성을 시작합니다.** 스토리북 생성과 Discord 게시가 완료되고 원본·본문·첨부 검증을 통과하면 웹 서재도 자동으로 갱신됩니다. 새 책은 기존 책과 함께 날짜별로 누적됩니다.

이미지는 브라우저 ChatGPT로 생성합니다. 웹 감상용 이미지와 표지는 날짜별 [GitHub Releases](https://github.com/pheanor-agent/sceneweaver-library/releases)에 보관하고, 웹사이트는 GitHub Pages로 배포합니다. 생성에 걸리는 시간에 따라 공개 시각은 달라집니다.

## 저장소 구성

이 저장소에는 공개 웹사이트와 책 데이터가 있습니다. 생성·운영 시스템은 Hermes에서 별도로 관리합니다.

```text
index.html                   서재와 읽기 화면
app.js                       탐색·페이지 이동·이어읽기
styles.css                   반응형 화면과 작품별 분위기
data/catalog.json            누적 책 목록
data/books/<book-id>.json     책별 본문과 이미지 링크
.github/workflows/pages.yml  GitHub Pages 배포
README.md                    프로젝트 소개
```

HTML·CSS·JavaScript로 구성한 정적 사이트입니다. 저장소를 내려받아 `python3 -m http.server 8000`을 실행한 뒤 `http://localhost:8000`에서 확인할 수 있습니다.

## 링크

- [스토리북 웹 서재](https://pheanor-agent.github.io/sceneweaver-library/)
- [날짜별 이미지 Releases](https://github.com/pheanor-agent/sceneweaver-library/releases)
- [웹사이트 배포 기록](https://github.com/pheanor-agent/sceneweaver-library/actions/workflows/pages.yml)

그림은 AI로 생성했으며, 등장인물과 이야기는 창작입니다.
