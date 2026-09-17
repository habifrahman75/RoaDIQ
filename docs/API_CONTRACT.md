# RoadIQ API Contract

> **Version**: 1.0.0  
> **Base URL (Backend)**: `http://localhost:8000`  
> **Base URL (AI Service)**: `http://localhost:8001`  
> **Auth**: Mock token via `Authorization: Bearer <token>` header (real auth not implemented in MVP)

---

## Standard Enumerations

### DamageType
| Value | Description |
|---|---|
| `pothole` | Localised road depression |
| `longitudinal_crack` | Crack parallel to road direction |
| `transverse_crack` | Crack perpendicular to road direction |
| `alligator_crack` | Interconnected fatigue cracking |
| `damaged_road` | General / mixed road surface damage |

### Severity
| Value | Meaning |
|---|---|
| `LOW` | Minor visible damage |
| `MEDIUM` | Moderate damage, monitoring required |
| `HIGH` | Significant damage, prompt repair needed |
| `CRITICAL` | Severe damage, immediate action required |

### ReportStatus
| Value | Description |
|---|---|
| `PENDING` | Submitted, not yet reviewed |
| `ASSIGNED` | Repair crew assigned |
| `UNDER_REPAIR` | Active repair in progress |
| `RESOLVED` | Repair completed |
| `VERIFICATION_REQUIRED` | Awaiting AI before/after verification |

### Road Health Score
| Range | Label |
|---|---|
| 80–100 | GOOD |
| 60–79 | MODERATE |
| 40–59 | POOR |
| 0–39 | CRITICAL |

---

## Backend Endpoints

### Health

```
GET /health
→ { "status": "ok", "service": "RoadIQ Backend", "version": "1.0.0" }
```

---

### Dashboard

```
GET /api/dashboard/stats
→ {
    "total_reports":       int,
    "critical_damages":    int,
    "high_priority":       int,
    "pending_repairs":     int,
    "average_road_health": float,
    "resolved_today":      int
  }
```

---

### Reports

```
POST /api/reports
Content-Type: application/json
Body: {
  "damage_type":     DamageType,
  "confidence":      float (0.0–1.0),
  "severity":        Severity,
  "latitude":        float (-90 to 90),
  "longitude":       float (-180 to 180),
  "image_url":       string | null,
  "road_segment_id": string | null
}
→ ReportResponse (201 Created)
```

```
GET /api/reports?severity=HIGH&damage_type=pothole&status=PENDING&page=1&limit=20
→ {
    "total":   int,
    "page":    int,
    "limit":   int,
    "reports": [ ReportResponse, ... ]
  }
```

```
GET /api/reports/{report_id}
→ ReportResponse
```

```
PUT /api/reports/{report_id}/status
Body: { "status": ReportStatus, "notes": string | null }
→ ReportResponse
```

```
POST /api/reports/analyze
Content-Type: multipart/form-data
Fields:
  image     – image file (JPEG/PNG)
  latitude  – float (default 0.0)
  longitude – float (default 0.0)
→ {
    "damage_detected": bool,
    "detections": [
      { "damage_type": string, "confidence": float,
        "severity": string, "bbox": [x1,y1,x2,y2] }
    ],
    "_source": "real" | "mock" | "DEV_MOCK – ..."
  }
```

**ReportResponse schema:**
```json
{
  "id":              "string (MongoDB ObjectId)",
  "damage_type":     "DamageType",
  "confidence":      0.94,
  "severity":        "HIGH",
  "latitude":        11.083912,
  "longitude":       77.142156,
  "image_url":       "string | null",
  "road_segment_id": "string | null",
  "priority_score":  87.0,
  "status":          "PENDING",
  "created_at":      "ISO 8601 datetime",
  "updated_at":      "ISO 8601 datetime"
}
```

---

### Road Segments

Both URL prefixes return identical data:

```
GET /api/road-segments        (canonical)
GET /api/roads                (frontend alias)
→ { "total": int, "segments": [ RoadSegmentResponse, ... ] }
```

```
GET /api/road-segments/{segment_id}
GET /api/roads/{segment_id}
→ RoadSegmentResponse
```

```
GET /api/roads/{segment_id}/history
→ { "segment_id": string, "history": [ {...}, ... ] }
```

```
GET /api/roads/{segment_id}/reports
→ [ ReportResponse, ... ]
```

```
POST /api/road-segments
Body: { "segment_id": string, "name": string, "latitude": float, "longitude": float }
→ RoadSegmentResponse (201 Created)
```

---

### Priority Queue

```
GET /api/priority?limit=50
→ {
    "total": int,
    "items": [
      {
        "segment_id":      string,
        "name":            string,
        "priority_score":  float (0–100),
        "severity_score":  float,
        "frequency_score": float,
        "road_health":     float,
        "report_count":    int,
        "reason":          string,
        "latitude":        float,
        "longitude":       float
      }, ...
    ]
  }
```

---

### Repairs

```
POST /api/repairs
Body: { "report_id": string, "assigned_to": string | null, "notes": string | null }
→ RepairResponse (201)
```

```
GET /api/repairs
→ [ RepairResponse, ... ]
```

```
GET /api/repairs/{repair_id}
→ RepairResponse
```

```
PUT /api/repairs/{repair_id}
Body: { "report_id": string, "assigned_to": string, "notes": string, "status": ReportStatus }
→ RepairResponse
```

---

### Verification

```
POST /api/verify-repair
Body: {
  "report_id":        string,
  "before_image_url": string,
  "after_image_url":  string
}
→ {
    "report_id":             string,
    "verified":              bool,
    "confidence":            float,
    "damage_detected_after": bool,
    "notes":                 string,
    "verified_at":           datetime
  }
```

```
GET /api/verifications
→ [ { "report_id", "damage_type", "severity", "road_segment_id",
      "before_image_url", "after_image_url", "verified", "confidence",
      "damage_detected_after", "notes", "verified_at" }, ... ]
```

---

### Analytics

```
GET /api/analytics
→ {
    "daily_reports":      [ { "date": "YYYY-MM-DD", "count": int }, ... ],
    "type_breakdown":     [ { "damage_type": string, "count": int }, ... ],
    "severity_breakdown": [ { "severity": string, "count": int }, ... ],
    "total_reports":      int,
    "resolved_count":     int,
    "pending_count":      int
  }
```

---

### Notifications

```
GET /api/notifications
→ [
    {
      "id":        string,
      "type":      "new_critical" | "status_change",
      "title":     string,
      "message":   string,
      "report_id": string,
      "created_at": datetime
    }, ...
  ]
```

---

### Recurring Damage

```
GET /api/recurring-damage?min_reports=3
→ [
    {
      "segment_id":     string,
      "name":           string | null,
      "report_count":   int,
      "dominant_type":  string | null,
      "worst_severity": string | null,
      "latitude":       float,
      "longitude":      float
    }, ...
  ]
```

---

### Contributors

```
GET /api/contributors/{user_id}/stats
→ {
    "user_id":           string,
    "points":            int,
    "reports_submitted": int,
    "ai_verified":       int,
    "resolved":          int,
    "needs_evidence":    int,
    "under_review":      int,
    "under_repair":      int
  }
```

---

## AI Service Endpoints

### Health

```
GET http://localhost:8001/health
→ { "status": "ok", "service": "RoadIQ AI Service", "mock_mode": bool }
```

### Detect

```
POST http://localhost:8001/detect
Content-Type: multipart/form-data
Fields: image (file), latitude (float), longitude (float)
→ {
    "damage_detected": bool,
    "detections": [
      { "damage_type": string, "confidence": float,
        "severity": string, "bbox": [x1,y1,x2,y2] }
    ],
    "source": "real" | "mock"
  }
```

### Verify

```
POST http://localhost:8001/verify
Body: { "before_image_url": string, "after_image_url": string }
→ {
    "damage_detected": bool,
    "confidence":      float,
    "verified":        bool,
    "notes":           string,
    "source":          string
  }
```
