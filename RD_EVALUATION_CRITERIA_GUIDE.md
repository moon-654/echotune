# R&D 역량평가 기준 설정 가이드

## 개요
이 시스템은 사용자가 "R&D 역량평가 기준 설정" 모달에서 설정한 값을 `data.json`에 저장하고, 모든 점수 계산과 화면 표시에 사용합니다.

## 저장 위치
- **파일**: `data.json`
- **키**: 
  - `rdEvaluationCriteria`: 6대 역량별 maxScore, weight, scoringRanges
  - `detailedCriteria`: 역량별 상세 배점 기준

## 구조

### rdEvaluationCriteria (개요)
```json
{
  "global_competency": {
    "name": "글로벌",
    "maxScore": 10,
    "weight": 10,
    "scoringRanges": [
      { "min": 10, "max": 10, "converted": 100 },
      { "min": 7, "max": 8, "converted": 80 },
      { "min": 4, "max": 6, "converted": 60 },
      { "min": 1, "max": 2, "converted": 40 }
    ]
  }
}
```

### detailedCriteria (상세 배점)
```json
{
  "global_competency": {
    "영어 TOEIC": {
      "950-990": 10,
      "900-949": 8,
      "800-899": 6,
      "700-799": 4,
      "700미만": 3
    },
    "일본어 JLPT": {
      "N1": 12,
      "N2": 7,
      "N3": 4,
      "N4": 2,
      "N5": 1
    }
  }
}
```

## 점수 계산 흐름

1. **원점수 계산** (detailedCriteria 기준)
   - 예: 영어 TOEIC 850점 → 6점
   - 예: 일본어 JLPT N1 → 12점
   - 합계: 18점

2. **maxScore 제한**
   - Math.min(18, 10) = 10점

3. **환산 점수** (scoringRanges 기준)
   - 10점 → 100점 (레이더 차트)

## 주의사항

### scoringRanges 빈틈 방지
- 범위가 연속되도록 설정
- 예: [1-2점, 4-6점]에서 3점은 빈틈!
- 권장: [1-3점, 4-6점]

### 범위 밖 점수 처리
- 최소 범위 미만 → 최소 환산점수
- 최대 범위 초과 → 최대 환산점수
- 범위 사이 빈틈 → 최소 환산점수

## 수정 방법

### UI에서 수정 (권장)
1. "R&D 역량평가 기준 설정" 모달 열기
2. 개요 탭: maxScore, scoringRanges 수정
3. 상세 설정 탭: 어학시험, 자격증 등 배점 수정
4. 저장 버튼 클릭

### data.json 직접 수정 (비권장)
- JSON 형식 주의
- 백업 후 수정
- 저장 후 서버 재시작 필요

## 코드 위치

### 서버 (점수 계산)
- `server/rd-evaluation-auto.ts`: 자동 평가 계산
- `server/routes.ts`: API 엔드포인트

### 클라이언트 (화면 표시)
- `client/src/components/charts/rd-radar-chart.tsx`: 레이더 차트
- `client/src/pages/employee-detail.tsx`: 직원 상세 페이지
- `client/src/pages/rd-evaluation.tsx`: R&D 역량평가 페이지
- `client/src/components/rd-evaluation/rd-evaluation-criteria-modal.tsx`: 설정 모달

## 변경 이력

### 2025-10-11
- 글로벌 scoringRanges: 0-2점 → 1-2점 변경
- TOEIC 700미만: 2점 → 3점 변경
- JLPT N1: 10점 → 12점 변경
- 하드코딩 제거 및 data.json 완전 연동 구현
- maxScore 제한 적용
- 범위 밖 점수 처리 로직 추가

## 문제 해결

### 문현진님 글로벌 점수가 떨어진 이유
**원인**: 
- 서버 점수 계산에서 maxScore를 무시하고 100으로 하드코딩
- 레이더 차트에서 하드코딩된 scoringRanges 사용
- 원점수가 범위를 벗어나면서 환산 점수 하락

**해결**:
- maxScore 10점 제한 적용
- data.json의 scoringRanges 사용
- 원점수 18점 → maxScore 10점 → 환산 100점 (만점 복구)

## 참고사항

### 하드코딩 제거 완료
- ❌ `client/src/components/charts/rd-radar-chart.tsx`: scoringRanges 하드코딩 제거
- ❌ `client/src/components/rd-evaluation/rd-evaluation-criteria-modal.tsx`: 초기값 하드코딩 제거
- ⚠️ `server/routes.ts`: defaultDetailedCriteria는 폴백용으로 유지 (주석 명확화)

### 연동 완료
- ✅ 서버 점수 계산: rdEvaluationCriteria.maxScore 사용
- ✅ 레이더 차트: rdEvaluationCriteria.scoringRanges 사용
- ✅ 직원 상세: rdEvaluationCriteria.scoringRanges 사용
- ✅ 원점수 계산: detailedCriteria 사용

