# Outlook Email AI Assistant - Admin Management Script
# This script provides administrative functions for managing user preferences

function Get-OutlookAIPreferences {
    param(
        [Parameter(Mandatory=$true)]
        [string]$UserName
    )
    
    $path = "C:\Users\$UserName\AppData\Roaming\OutlookEmailAssistant\preferences.json"
    
    if (Test-Path $path) {
        $content = Get-Content $path -Raw | ConvertFrom-Json
        return $content
    } else {
        Write-Warning "No preferences found for user: $UserName"
        return $null
    }
}

function Set-OutlookAIPreferences {
    param(
        [Parameter(Mandatory=$true)]
        [string]$UserName,
        [Parameter(Mandatory=$true)]
        [object]$Preferences
    )
    
    $path = "C:\Users\$UserName\AppData\Roaming\OutlookEmailAssistant\preferences.json"
    $directory = Split-Path $path -Parent
    
    if (!(Test-Path $directory)) {
        New-Item -ItemType Directory -Path $directory -Force
    }
    
    $Preferences | ConvertTo-Json -Depth 10 | Out-File $path -Encoding UTF8
    Write-Host "Preferences updated for user: $UserName"
}

function Export-OutlookAIPreferences {
    param(
        [Parameter(Mandatory=$true)]
        [string]$UserName,
        [Parameter(Mandatory=$true)]
        [string]$ExportPath
    )
    
    $preferences = Get-OutlookAIPreferences -UserName $UserName
    if ($preferences) {
        $preferences | ConvertTo-Json -Depth 10 | Out-File $ExportPath -Encoding UTF8
        Write-Host "Preferences exported to: $ExportPath"
    }
}

function Import-OutlookAIPreferences {
    param(
        [Parameter(Mandatory=$true)]
        [string]$UserName,
        [Parameter(Mandatory=$true)]
        [string]$ImportPath
    )
    
    if (Test-Path $ImportPath) {
        $preferences = Get-Content $ImportPath -Raw | ConvertFrom-Json
        Set-OutlookAIPreferences -UserName $UserName -Preferences $preferences
    } else {
        Write-Error "Import file not found: $ImportPath"
    }
}

function Get-OutlookAIUsers {
    $users = Get-ChildItem "C:\Users" -Directory | Where-Object {
        Test-Path "C:\Users\$($_.Name)\AppData\Roaming\OutlookEmailAssistant\preferences.json"
    }
    
    return $users | ForEach-Object {
        [PSCustomObject]@{
            UserName = $_.Name
            PreferencesPath = "C:\Users\$($_.Name)\AppData\Roaming\OutlookEmailAssistant\preferences.json"
            LastModified = (Get-Item "C:\Users\$($_.Name)\AppData\Roaming\OutlookEmailAssistant\preferences.json").LastWriteTime
        }
    }
}

function Deploy-OutlookAIDefaults {
    param(
        [Parameter(Mandatory=$true)]
        [string]$DefaultsPath,
        [Parameter(Mandatory=$false)]
        [string[]]$TargetUsers = @()
    )
    
    if (!(Test-Path $DefaultsPath)) {
        Write-Error "Defaults file not found: $DefaultsPath"
        return
    }
    
    $defaults = Get-Content $DefaultsPath -Raw | ConvertFrom-Json
    
    if ($TargetUsers.Count -eq 0) {
        # Deploy to all users
        $TargetUsers = Get-ChildItem "C:\Users" -Directory | ForEach-Object { $_.Name }
    }
    
    foreach ($user in $TargetUsers) {
        try {
            Set-OutlookAIPreferences -UserName $user -Preferences $defaults
            Write-Host "Deployed defaults to: $user"
        } catch {
            Write-Warning "Failed to deploy to user: $user - $($_.Exception.Message)"
        }
    }
}

# Export functions
Export-ModuleMember -Function Get-OutlookAIPreferences, Set-OutlookAIPreferences, Export-OutlookAIPreferences, Import-OutlookAIPreferences, Get-OutlookAIUsers, Deploy-OutlookAIDefaults

Write-Host "Outlook Email AI Assistant Admin Module Loaded"
Write-Host "Available functions:"
Write-Host "  - Get-OutlookAIPreferences -UserName <username>"
Write-Host "  - Set-OutlookAIPreferences -UserName <username> -Preferences <object>"
Write-Host "  - Export-OutlookAIPreferences -UserName <username> -ExportPath <path>"
Write-Host "  - Import-OutlookAIPreferences -UserName <username> -ImportPath <path>"
Write-Host "  - Get-OutlookAIUsers"
Write-Host "  - Deploy-OutlookAIDefaults -DefaultsPath <path> [-TargetUsers <array>]"
