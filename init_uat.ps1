$baseUrl = "http://localhost:3000/api"

function Register-User {
    param([string]$name, [string]$email, [string]$password, [string]$role)
    $regUrl = "$baseUrl/register"
    $regBody = @{
        name = $name
        email = $email
        password = $password
        role = $role
    } | ConvertTo-Json
    
    try {
        $response = Invoke-RestMethod -Uri $regUrl -Method POST -Body $regBody -ContentType "application/json"
        Write-Host "Registered $role : $email"
    } catch {
        Write-Host "Failed to register $email : $($_.Exception.Message)"
    }
}

Register-User -name "Test Teacher" -email "teacher_uat@edusphere.test" -password "TeacherPass123" -role "teacher"
Register-User -name "Student Alpha" -email "student1_uat@edusphere.test" -password "TeacherPass123" -role "student"
Register-User -name "Student Beta" -email "student2_uat@edusphere.test" -password "TeacherPass123" -role "student"

# Login as teacher to get session cookie details for later manual usage if needed
$loginUrl = "$baseUrl/login"
$loginBody = @{
    email = "teacher_uat@edusphere.test"
    password = "TeacherPass123"
} | ConvertTo-Json

try {
    $response = Invoke-RestMethod -Uri $loginUrl -Method POST -Body $loginBody -ContentType "application/json" -SessionVariable teacherSession
    # Extract connect.sid cookie
    $cookie = $teacherSession.Cookies.GetCookies($baseUrl) | Where-Object Name -eq "connect.sid"
    Write-Host "Teacher Session Cookie:"
    Write-Host "connect.sid=$($cookie.Value)"
} catch {
    Write-Host "Failed to login teacher : $($_.Exception.Message)"
}
