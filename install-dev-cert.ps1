# PowerShell script to install development certificate for Office Add-ins
# This script should be run as Administrator

param(
    [string]$CertPath = "C:\Apps\code\outlook_email_assistant\node_modules\.cache\webpack-dev-server\server.pem"
)

Write-Host "Installing development certificate for Office Add-ins..."
Write-Host "Certificate path: $CertPath"

# Check if running as Administrator
if (-NOT ([Security.Principal.WindowsPrincipal] [Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole] "Administrator")) {
    Write-Host "This script requires Administrator privileges. Please run as Administrator." -ForegroundColor Red
    exit 1
}

# Check if certificate file exists
if (-not (Test-Path $CertPath)) {
    Write-Host "Certificate file not found at: $CertPath" -ForegroundColor Red
    exit 1
}

try {
    # Read the certificate file
    $certContent = Get-Content $CertPath -Raw
    
    # Check if it's a combined certificate and key file
    if ($certContent -match "-----BEGIN CERTIFICATE-----" -and $certContent -match "-----BEGIN PRIVATE KEY-----") {
        Write-Host "Found combined certificate and key file"
        
        # Extract only the certificate part for installation
        $certStart = $certContent.IndexOf("-----BEGIN CERTIFICATE-----")
        $certEnd = $certContent.IndexOf("-----END CERTIFICATE-----") + "-----END CERTIFICATE-----".Length
        $certOnly = $certContent.Substring($certStart, $certEnd - $certStart)
        
        # Create a temporary certificate file
        $tempCertPath = [System.IO.Path]::GetTempFileName() + ".crt"
        Set-Content -Path $tempCertPath -Value $certOnly
        
        # Import the certificate to the Trusted Root Certification Authorities store
        Write-Host "Importing certificate to Trusted Root Certification Authorities..."
        $cert = New-Object System.Security.Cryptography.X509Certificates.X509Certificate2($tempCertPath)
        $store = New-Object System.Security.Cryptography.X509Certificates.X509Store([System.Security.Cryptography.X509Certificates.StoreName]::Root, [System.Security.Cryptography.X509Certificates.StoreLocation]::LocalMachine)
        $store.Open([System.Security.Cryptography.X509Certificates.OpenFlags]::ReadWrite)
        $store.Add($cert)
        $store.Close()
        
        # Clean up temporary file
        Remove-Item $tempCertPath
        
        Write-Host "Certificate installed successfully!" -ForegroundColor Green
        Write-Host "You may need to restart Outlook for the changes to take effect." -ForegroundColor Yellow
    } else {
        Write-Host "Invalid certificate format. Expected combined certificate and key file." -ForegroundColor Red
        exit 1
    }
} catch {
    Write-Host "Error installing certificate: $_" -ForegroundColor Red
    exit 1
}
