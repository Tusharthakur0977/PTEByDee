# Predicted Questions Feature

Add a "prediction level" flag (`NONE`, `LOW`, `MEDIUM`, `HIGH`) to questions so admins can mark questions as predicted, and create a new "Predicted Questions" section in the portal where users can browse and practice them.

## User Review Required

> [!IMPORTANT]
> **Prediction level values** — The plan uses `NONE | LOW | MEDIUM | HIGH`. `NONE` is the default for all existing questions. Please confirm these are the levels you want.

> [!IMPORTANT]
> **Portal "Predicted Questions" tab** — This will be added as a third tab alongside the existing "Practice" and "History" tabs in the Portal page. When a user clicks it, they'll see predicted questions grouped by question type, filterable by prediction level. Clicking a question navigates to its existing practice page. Does this flow work for you?

## Proposed Changes

### Database (Prisma Schema)

#### [MODIFY] [schema.prisma](file:///c:/Users/Tushar%20Thakur/OneDrive/Desktop/PTEByDee/Backend/prisma/schema.prisma)

1. Add a new enum `PredictionLevel`:
```prisma
enum PredictionLevel {
  NONE
  LOW
  MEDIUM
  HIGH
}
```

2. Add field to the `Question` model:
```prisma
predictionLevel PredictionLevel @default(NONE)
```

3. Add an index on `predictionLevel` for efficient queries:
```prisma
@@index([predictionLevel])
```

After schema changes, run `npx prisma generate` and `npx prisma db push` to sync with MongoDB.

---

### Backend — Admin APIs

#### [MODIFY] [updateQuestion.controller.ts](file:///c:/Users/Tushar%20Thakur/OneDrive/Desktop/PTEByDee/Backend/src/controllers/Admin/updateQuestion.controller.ts)

- Accept `predictionLevel` in `req.body`
- Add it to `updateData` when provided (validated against `NONE | LOW | MEDIUM | HIGH`)

#### [MODIFY] [getAllQuestions.controller.ts](file:///c:/Users/Tushar%20Thakur/OneDrive/Desktop/PTEByDee/Backend/src/controllers/Admin/getAllQuestions.controller.ts)

- Accept `predictionLevel` as a query filter
- Add it to `whereClause` when provided
- The `predictionLevel` field is already included in the response since we use `...question` spread

#### [NEW] [updatePredictionLevel.controller.ts](file:///c:/Users/Tushar%20Thakur/OneDrive/Desktop/PTEByDee/Backend/src/controllers/Admin/updatePredictionLevel.controller.ts)

A dedicated bulk-update endpoint so the admin can set prediction levels for multiple questions at once:
- **Route**: `PUT /api/admin/questions/prediction-level`
- **Body**: `{ questionIds: string[], predictionLevel: 'NONE' | 'LOW' | 'MEDIUM' | 'HIGH' }`
- Uses `prisma.question.updateMany()` for efficiency

#### [MODIFY] [admin.routes.ts](file:///c:/Users/Tushar%20Thakur/OneDrive/Desktop/PTEByDee/Backend/src/routes/admin.routes.ts)

- Import and register the new `updatePredictionLevel` controller
- Add route: `router.put('/questions/prediction-level', protect, isAdmin, updatePredictionLevel)`

---

### Backend — User/Portal APIs

#### [NEW] [getPredictedQuestions.controller.ts](file:///c:/Users/Tushar%20Thakur/OneDrive/Desktop/PTEByDee/Backend/src/controllers/User/getPredictedQuestions.controller.ts)

New endpoint for the portal to fetch predicted questions:
- **Route**: `GET /api/user/predicted-questions`
- **Query params**: `predictionLevel` (optional filter for LOW/MEDIUM/HIGH), `questionType` (optional), `limit`, `page`
- Queries `Question` where `predictionLevel` is not `NONE` and `isArchived` is false
- Groups results by question type for easy frontend rendering
- Returns questions with signed URLs (same pattern as `getPracticeQuestions`)

#### [MODIFY] [user.routes.ts](file:///c:/Users/Tushar%20Thakur/OneDrive/Desktop/PTEByDee/Backend/src/routes/user.routes.ts)

- Import and register `getPredictedQuestions`
- Add public route: `router.get('/predicted-questions', getPredictedQuestions)`

---

### Frontend — Admin Panel

#### [MODIFY] [QuestionManagement.tsx](file:///c:/Users/Tushar%20Thakur/OneDrive/Desktop/PTEByDee/FrontEnd/src/pages/admin/QuestionManagement.tsx)

- Add a `predictionLevel` filter dropdown alongside existing filters (Section, Type, Test)
- Support filter values: All, Low, Medium, High

#### [MODIFY] [QuestionPreview.tsx](file:///c:/Users/Tushar%20Thakur/OneDrive/Desktop/PTEByDee/FrontEnd/src/components/QuestionPreview.tsx)

- Display a prediction level badge next to the question code (colored: amber for HIGH, blue for MEDIUM, slate for LOW)
- Add a dropdown or button group to quickly change the prediction level inline (calls `updateQuestion` API)

#### [MODIFY] [QuestionForm.tsx](file:///c:/Users/Tushar%20Thakur/OneDrive/Desktop/PTEByDee/FrontEnd/src/components/QuestionForm.tsx)

- Add a `predictionLevel` select dropdown to the question create/edit form
- Default to `NONE`

#### [MODIFY] [questions.ts (service)](file:///c:/Users/Tushar%20Thakur/OneDrive/Desktop/PTEByDee/FrontEnd/src/services/questions.ts)

- Add `predictionLevel` to `CreateQuestionData` interface
- Add `predictionLevel` to `QuestionFilters` interface
- Add `updatePredictionLevel(questionIds: string[], level: string)` method that calls the new bulk endpoint

---

### Frontend — Portal (User-Facing)

#### [MODIFY] [Portal.tsx](file:///c:/Users/Tushar%20Thakur/OneDrive/Desktop/PTEByDee/FrontEnd/src/pages/Portal.tsx)

- Add a new `'predicted'` tab to the `activeTab` state (alongside `'practice'` and `'history'`)
- Add a "Predicted" tab button with a flame/target icon in the tab bar
- When active, render a new `PredictedQuestions` component

#### [NEW] [PredictedQuestions.tsx](file:///c:/Users/Tushar%20Thakur/OneDrive/Desktop/PTEByDee/FrontEnd/src/components/PredictedQuestions.tsx)

New component showing predicted questions in an organized layout:
- **Filter bar**: Prediction level tabs (All / High / Medium / Low)
- **Questions grouped by question type** (e.g., "Read Aloud", "Write Essay") with section headers
- Each question card shows: question code, prediction level badge (colored), difficulty level, practice status
- Clicking a question navigates to the corresponding practice page (using `getPracticePagePath()`)
- Uses the new `getPredictedQuestions` API

#### [MODIFY] [portal.ts (service)](file:///c:/Users/Tushar%20Thakur/OneDrive/Desktop/PTEByDee/FrontEnd/src/services/portal.ts)

- Add `getPredictedQuestions()` function that calls `GET /api/user/predicted-questions`

---

## File Change Summary

| Layer | File | Action |
|-------|------|--------|
| DB | `schema.prisma` | Add `PredictionLevel` enum + field + index |
| Backend | `updateQuestion.controller.ts` | Accept `predictionLevel` |
| Backend | `getAllQuestions.controller.ts` | Add prediction filter |
| Backend | `updatePredictionLevel.controller.ts` | **NEW** — bulk update endpoint |
| Backend | `admin.routes.ts` | Register new route |
| Backend | `getPredictedQuestions.controller.ts` | **NEW** — user-facing predicted questions API |
| Backend | `user.routes.ts` | Register new route |
| Frontend | `QuestionManagement.tsx` | Add filter dropdown |
| Frontend | `QuestionPreview.tsx` | Show badge + inline level change |
| Frontend | `QuestionForm.tsx` | Add prediction level field |
| Frontend | `questions.ts` | Update types + add bulk method |
| Frontend | `Portal.tsx` | Add "Predicted" tab |
| Frontend | `PredictedQuestions.tsx` | **NEW** — predicted questions browser |
| Frontend | `portal.ts` | Add API call function |

## Verification Plan

### Automated Tests
- Run `npx prisma generate` to verify schema compiles
- Run `npx prisma db push` to sync with MongoDB
- Start backend and verify no TypeScript compilation errors
- Start frontend and verify no compilation errors

### Manual Verification
1. **Admin panel**: Create/edit a question → verify prediction level dropdown works
2. **Admin panel**: QuestionManagement list → verify prediction level badge shows, inline edit works, filter works
3. **Portal**: Switch to "Predicted" tab → verify predicted questions load, grouped by type
4. **Portal**: Click a predicted question → verify it navigates to correct practice page
5. **Portal**: Filter by prediction level → verify filtering works
