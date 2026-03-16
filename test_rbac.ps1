$baseUrl = "http://localhost:3000/api"

function Login {
    param([string]$email, [string]$password)
    $loginBody = @{ email = $email; password = $password } | ConvertTo-Json
    $response = Invoke-RestMethod -Uri "$baseUrl/login" -Method POST -Body $loginBody -ContentType "application/json" -SessionVariable session
    return $session
}

function TestRoute {
    param([string]$name, [string]$url, [string]$method = "GET", $session = $null, [string]$body = $null)
    try {
        $params = @{ Uri = $url; Method = $method }
        if ($session) { $params["WebSession"] = $session }
        if ($body) { $params["Body"] = $body; $params["ContentType"] = "application/json" }
        $response = Invoke-RestMethod @params
        Write-Host "  [ALLOWED] $name - Got response"
        return 200
    } catch {
        $statusCode = $_.Exception.Response.StatusCode.value__
        Write-Host "  [BLOCKED $statusCode] $name"
        return $statusCode
    }
}

Write-Host "=== Module 7: RBAC Boundary Testing ==="
Write-Host ""

# Get sessions
$teacherSession = Login -email "teacher_uat@edusphere.test" -password "TeacherPass123"
$studentSession = Login -email "student1_uat@edusphere.test" -password "TeacherPass123"
Write-Host "Sessions established."
Write-Host ""

# Get classId
$classes = Invoke-RestMethod -Uri "$baseUrl/classes" -Method GET -WebSession $teacherSession
$classId = ($classes | Where-Object { $_.classCode -eq "29405C" }).id

Write-Host "--- Test 1: Unauthenticated Access Blocks ---"
TestRoute -name "GET /api/me (no session)" -url "$baseUrl/me"
TestRoute -name "GET /api/classes (no session)" -url "$baseUrl/classes"
Write-Host ""

Write-Host "--- Test 2: Student Accessing Teacher-Only Routes ---"
TestRoute -name "POST /api/classes (student)" -url "$baseUrl/classes" -method "POST" -session $studentSession -body '{"name":"HackedClass"}'
TestRoute -name "POST /api/classes/:id/assignments (student)" -url "$baseUrl/classes/$classId/assignments" -method "POST" -session $studentSession -body '{"title":"hack"}'
TestRoute -name "PATCH /api/classes/:id (student)" -url "$baseUrl/classes/$classId" -method "PATCH" -session $studentSession -body '{"name":"hacked"}'
TestRoute -name "DELETE /api/classes/:id (student)" -url "$baseUrl/classes/$classId" -method "DELETE" -session $studentSession
Write-Host ""

Write-Host "--- Test 3: Student can access their own allowed routes ---"
TestRoute -name "GET /api/classes (student)" -url "$baseUrl/classes" -session $studentSession
TestRoute -name "GET /api/me (student)" -url "$baseUrl/me" -session $studentSession
TestRoute -name "GET /api/gamification/me (student)" -url "$baseUrl/gamification/me" -session $studentSession
Write-Host ""

Write-Host "--- Test 4: Teacher can access teacher routes ---"
TestRoute -name "GET /api/classes (teacher)" -url "$baseUrl/classes" -session $teacherSession
TestRoute -name "GET /api/classes/:id/roster (teacher)" -url "$baseUrl/classes/$classId/roster" -session $teacherSession
Write-Host ""

Write-Host "=== RBAC Tests Complete ==="
