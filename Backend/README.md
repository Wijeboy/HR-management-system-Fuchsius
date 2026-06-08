# HRMS Backend (Payroll + Performance/Appraisal)

This backend is scoped to the two modules you are implementing in the frontend:

- Payroll Management
- Performance & Appraisal (including Goals/KPIs)

It uses Prisma ORM with MongoDB and Express APIs that match the frontend field names.

## Setup & Run

```bash
cd Backend
npm install
npm run db:setup
npm run dev
```

Before running `db:setup`, create `Backend/.env` from `Backend/.env.example` and set:
- `MONGO_URI` to your MongoDB connection string
- `FRONTEND_URL` to one or more allowed origins (comma-separated), for example `http://localhost:5173,http://127.0.0.1:5173`

Server default: `http://localhost:5020`

## Prisma Commands

- `npm run prisma:generate`
- `npm run prisma:push`
- `npm run prisma:seed` (inserts test payroll + performance data)
- `npm run db:setup` (runs all of the above)

## API Base

`/api`

## Health

- `GET /api/health`

## Payroll APIs

- `GET /api/payroll/employees`
- `POST /api/payroll/employees`
- `GET /api/payroll/records?search=&status=&period=`
- `GET /api/payroll/payslips?employeeId=&period=`
- `GET /api/payroll/payslips/:id`
- `POST /api/payroll/calculate`

### Payroll Calculate Payload

```json
{
  "employeeId": "EMP-0034",
  "payPeriod": "2026-03",
  "attendanceDays": 22,
  "unpaidLeaveDays": 0,
  "overtimeHours": 4,
  "overtimeRate": 35,
  "performanceBonus": 500,
  "otherAllowance": 0,
  "taxRate": 12,
  "insuranceDeduction": 220,
  "statutoryDeduction": 180,
  "otherDeductions": 0,
  "status": "Processed"
}
```

## Performance APIs

- `GET /api/performance/reviews?search=&cycle=&status=`
- `POST /api/performance/reviews`
- `GET /api/performance/goals?employee=&status=`
- `POST /api/performance/goals`
- `PATCH /api/performance/goals/:id/current`

### Create Review Payload

```json
{
  "employeeName": "Sarah Williams",
  "employeeId": "EMP-0034",
  "department": "Sales & Marketing",
  "reviewer": "Diana Carter",
  "cycle": "Q2 2026",
  "goalsScore": 4.4,
  "competencyScore": 4.2,
  "behaviorScore": 4.5,
  "recommendation": "Promotion",
  "status": "Completed"
}
```

### Create Goal Payload

```json
{
  "employeeName": "John Davis",
  "employeeId": "EMP-0012",
  "goal": "Reduce MTTR",
  "metric": "Average MTTR (hours)",
  "target": 3,
  "current": 3.5,
  "weight": 25,
  "dueDate": "2026-06-30",
  "lowerIsBetter": true
}
```
