param(
    [Parameter(Mandatory = $true, Position = 0)]
    [string]$VideoPath,

    [Parameter(Mandatory = $false)]
    [string]$OutputRoot = "",

    [Parameter(Mandatory = $false)]
    [int]$Columns = 80,

    [Parameter(Mandatory = $false)]
    [int]$Fps = 30,

    [Parameter(Mandatory = $false)]
    [int]$LumThreshold = 30,

    [Parameter(Mandatory = $false)]
    [string]$Chars = "",

    [Parameter(Mandatory = $false)]
    [switch]$Invert
)

$ErrorActionPreference = "Stop"

$FontRatio = 0.44
$LuminanceThreshold = $LumThreshold
$OutputFps = $Fps
$OutputColumns = [Math]::Max(20, [Math]::Min(300, $Columns))

if ([string]::IsNullOrWhiteSpace($Chars)) {
    $AsciiCharsStr = ' .''`^,:;Il!i><~+_-?][}{1)(|/tfjrxnuvczXYUJCLQ0OZmwqpdbkhao*#MW&8%B@$'
} else {
    $AsciiCharsStr = $Chars
}

$StringInfo = [System.Globalization.StringInfo]::new($AsciiCharsStr)
$AsciiChars = @()
for ($i = 0; $i -lt $StringInfo.LengthInTextElements; $i++) {
    $AsciiChars += $StringInfo.SubstringByTextElements($i, 1)
}

if ($Invert) {
    [Array]::Reverse($AsciiChars)
}

$SupportedFormats = @(".mp4", ".mkv", ".mov", ".avi", ".gif")

if ([System.IO.Path]::IsPathRooted($VideoPath)) {
    $ResolvedVideoPath = [System.IO.Path]::GetFullPath($VideoPath)
} else {
    $ResolvedVideoPath = [System.IO.Path]::GetFullPath((Join-Path (Get-Location) $VideoPath))
}

if (-not (Test-Path $ResolvedVideoPath -PathType Leaf)) {
    throw "Input file does not exist: $ResolvedVideoPath"
}

$Extension = [System.IO.Path]::GetExtension($ResolvedVideoPath).ToLowerInvariant()
if ($SupportedFormats -notcontains $Extension) {
    throw "Unsupported file format '$Extension'. Supported formats: $($SupportedFormats -join ', ')"
}

$DimensionText = & ffprobe `
    -v error `
    -select_streams v:0 `
    -show_entries stream=width,height `
    -of csv=s=x:p=0 `
    $ResolvedVideoPath

if ($LASTEXITCODE -ne 0 -or [string]::IsNullOrWhiteSpace($DimensionText)) {
    throw "ffprobe failed to read the input video dimensions."
}

$WidthText, $HeightText = $DimensionText.Trim() -split "x"
$Width = [int]$WidthText
$Height = [int]$HeightText
$OutputHeight = [Math]::Max(1, [int][Math]::Round($Height * ($OutputColumns / [double]$Width) * $FontRatio))

$BaseOutputRoot = if ([string]::IsNullOrWhiteSpace($OutputRoot)) {
    [System.IO.Path]::GetFullPath((Get-Location).Path)
} elseif ([System.IO.Path]::IsPathRooted($OutputRoot)) {
    [System.IO.Path]::GetFullPath($OutputRoot)
} else {
    [System.IO.Path]::GetFullPath((Join-Path (Get-Location) $OutputRoot))
}

New-Item -ItemType Directory -Path $BaseOutputRoot -Force | Out-Null

$Timestamp = [DateTimeOffset]::UtcNow.ToUnixTimeMilliseconds()
$WorkingDir = Join-Path $BaseOutputRoot "ascii_frames_$Timestamp"
$FrameDir = Join-Path $WorkingDir "frame_images"
$RawFrameFile = Join-Path $WorkingDir "frames.raw"

New-Item -ItemType Directory -Path $FrameDir -Force | Out-Null

Write-Host "Created working directory: $WorkingDir"
Write-Host "Extracting frames from '$ResolvedVideoPath'..."
Write-Host "Settings: columns=$OutputColumns fps=$OutputFps threshold=$LuminanceThreshold chars_len=$($AsciiChars.Length) invert=$Invert"

& ffmpeg `
    -loglevel error `
    -i $ResolvedVideoPath `
    -vf "scale=$OutputColumns`:$OutputHeight,fps=$OutputFps,format=gray" `
    -f rawvideo `
    -pix_fmt gray `
    $RawFrameFile

if ($LASTEXITCODE -ne 0 -or -not (Test-Path $RawFrameFile -PathType Leaf)) {
    throw "ffmpeg failed to extract grayscale frames."
}

$Bytes = [System.IO.File]::ReadAllBytes($RawFrameFile)
$FrameSize = $OutputColumns * $OutputHeight

if ($Bytes.Length -eq 0) {
    throw "ffmpeg returned no frame data."
}

if (($Bytes.Length % $FrameSize) -ne 0) {
    throw "ffmpeg returned incomplete frame data."
}

$LuminanceRange = [Math]::Max(1, 255 - $LuminanceThreshold)
$FrameCount = [int]($Bytes.Length / $FrameSize)

Write-Host "Processing frames into ASCII..."

for ($FrameIndex = 0; $FrameIndex -lt $FrameCount; $FrameIndex++) {
    $FrameOffset = $FrameIndex * $FrameSize
    $Builder = [System.Text.StringBuilder]::new()

    for ($Row = 0; $Row -lt $OutputHeight; $Row++) {
        $RowOffset = $FrameOffset + ($Row * $OutputColumns)

        for ($Column = 0; $Column -lt $OutputColumns; $Column++) {
            $Pixel = [int]$Bytes[$RowOffset + $Column]

            if ($Pixel -lt $LuminanceThreshold) {
                [void]$Builder.Append(" ")
                continue
            }

            $CharIndex = [int][Math]::Floor((($Pixel - $LuminanceThreshold) * ($AsciiChars.Length - 1)) / $LuminanceRange)
            [void]$Builder.Append($AsciiChars[$CharIndex])
        }

        [void]$Builder.AppendLine()
    }

    $FrameName = "frame_{0:d4}.txt" -f ($FrameIndex + 1)
    $FramePath = Join-Path $FrameDir $FrameName
    [System.IO.File]::WriteAllText($FramePath, $Builder.ToString())
    Write-Host "Processed $FrameName"
}

Remove-Item $RawFrameFile -Force

Write-Host "ASCII generation complete. Frames written: $FrameCount"
Write-Host "Output directory: $FrameDir"
