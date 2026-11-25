# Rift Wardens (리프트 온라인)

3D 브라우저 온라인 RPG. 오픈 필드 파티 사냥, 무기 강화/인첸트, 전직, 상점, 경매장, 유저 간 거래.
PC(키보드·마우스)와 모바일(터치)을 자동 감지해 둘 다 플레이할 수 있습니다.

## 실행
`index.html` 한 파일이 게임 전체입니다. three.js r128만 CDN에서 불러옵니다.

- **GitHub Pages로 배포**: 저장소 Settings → Pages → Branch `main` / `(root)` 저장. 주소가 생기면 그대로 접속하면 됩니다.
- 로컬에서 열어도 동작합니다. 서버(Supabase)에 연결되지 않으면 자동으로 오프라인 모드(이 기기에만 저장)로 실행됩니다.

## 구조
- `index.html` — 빌드 결과(단일 파일)
- `src/` — 소스 (`build.sh`가 순서대로 합쳐 `index.html` 생성)
- `test/` — 스텁 기반 node 테스트 (`node test/smoke.js`)

```
./build.sh            # index.html 생성 + 문법 검사
node test/smoke.js    # 가입 → 사냥 → 정산 → 강화/전직 → 경매 → 사망/부활 시나리오
```

## 서버
Supabase 프로젝트 `rift-wardens`. 모든 게임 로직은 `rw_*` RPC(보안 정의자 함수)로만 접근하며, 테이블은 RLS로 직접 접근이 막혀 있습니다.
멀티플레이(파티·채팅·거래 신청)는 Supabase Realtime 채널 `rw-field-1..6`(채널당 12명)을 사용합니다.

## 게임 요약
- 직업: 전사 / 마법사 / 궁수 → 1차 전직(Lv10) → 2차 전직(Lv30), 상위 직업 12종
- 필드: 마을 → 초원 → 망자의 숲 → 화염 황무지 → 수정 협곡
- 성장: 무기 8등급 · +20 강화 · 인첸트 8종 · 물약 6종
- 조작(PC): WASD 이동, 마우스 공격, Q/E/R 스킬, Space 대시, 1~6 물약, I 가방, P 파티, Enter 채팅
