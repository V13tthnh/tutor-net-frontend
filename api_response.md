api http://localhost:8080/api/v1/admin/dashboard trả về response 
{
  "success": true,
  "message": "Tải dữ liệu Dashboard thành công",
  "data": {
    "kpis": {
      "totalRevenue": 0,
      "totalClassRequests": 18,
      "matchRate": 50.0,
      "newTutors": 14
    },
    "timeSeriesChart": [],
    "topSubjects": [
      {
        "categoryName": "Toán",
        "count": 5
      },
      {
        "categoryName": "Vật lý",
        "count": 3
      },
      {
        "categoryName": "Luyện chữ",
        "count": 2
      },
      {
        "categoryName": "Tiếng Anh",
        "count": 2
      },
      {
        "categoryName": "Tiếng Hàn",
        "count": 2
      }
    ],
    "pendingTutors": [],
    "overdueContracts": [],
    "negativeReviews": [],
    "recentTransactions": []
  },
  "timestamp": "2026-06-19T07:29:09.751961700Z"
}