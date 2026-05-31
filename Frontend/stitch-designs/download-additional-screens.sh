#!/bin/bash

# Download additional screens (11-23) from Stitch project
PROJECT_ID="1538946726987836143"
API_KEY="AQ.Ab8RN6JvFTLIDBdPR1U3uqDR3nZJTl0SZIYoPg7A9cp3YZCrzQ"

declare -a screens=(
  "05f0b2efa6384ca6b84ecbd2bd5e951c:11-job-vacancy-portal-1"
  "13f6e8cac5ff40c193f54c241f76026d:12-employee-payslips-view"
  "311e250bedfe4736982484631e1759db:13-job-vacancy-portal-2"
  "3bf0cd1da39b4e8c8c4ea5aff699bb63:14-job-vacancy-portal-3"
  "41a20da2b56240a1865ea9fce12644ac:15-notification-center-feed"
  "5de1c3b7513d452689aed7a59cc8435b:16-payroll-processing-center"
  "8272b244475e4ce797065abe9e39cb33:17-applicant-tracking-ats"
  "90860c8b31b6434c830a673123fcdb8c:18-manager-approval-inbox"
  "ad565c331b6d46e3aa60e51245695526:19-automated-analytics-reports"
  "b25b09d0887441548bad9ba542d7e96b:20-job-vacancy-portal-4"
  "ddae8e7cbfef45fb80b3a361d83993ae:21-leave-management-hub"
  "e007bf8cc14c48f4bc2ac33939b4c0ac:22-leave-request-portal"
  "f65961bde78041aeaf81d60cd48bdf6e:23-performance-appraisal-center"
)

echo "Starting download of 13 additional screens..."
echo "============================================="

success_count=0
failed_count=0
empty_html_count=0

for screen in "${screens[@]}"; do
  IFS=':' read -r screen_id filename <<< "$screen"
  
  echo ""
  echo "Fetching: $filename..."
  
  response=$(curl -s -X POST https://stitch.googleapis.com/mcp \
    -H "Content-Type: application/json" \
    -H "X-Goog-Api-Key: $API_KEY" \
    -d "{
      \"jsonrpc\": \"2.0\",
      \"id\": 1,
      \"method\": \"tools/call\",
      \"params\": {
        \"name\": \"get_screen\",
        \"arguments\": {
          \"project_id\": \"$PROJECT_ID\",
          \"screen_id\": \"$screen_id\"
        }
      }
    }")
  
  screenshot_url=$(echo "$response" | jq -r '.result.structuredContent.screenshot.downloadUrl')
  html_url=$(echo "$response" | jq -r '.result.structuredContent.htmlCode.downloadUrl')
  
  if [ "$screenshot_url" != "null" ] && [ "$screenshot_url" != "" ]; then
    echo "  ↓ Downloading screenshot..."
    curl -L -o "screenshots/${filename}.png" "$screenshot_url" 2>&1 | grep -E "(Total|100)" | tail -1
    screenshot_size=$(stat -f%z "screenshots/${filename}.png" 2>/dev/null || echo "0")
    echo "  ✓ Screenshot saved: ${screenshot_size} bytes"
  else
    echo "  ✗ Screenshot URL not available"
    ((failed_count++))
  fi
  
  if [ "$html_url" != "null" ] && [ "$html_url" != "" ]; then
    echo "  ↓ Downloading HTML..."
    curl -L -o "html/${filename}.html" "$html_url" 2>&1 | grep -E "(Total|100)" | tail -1
    html_size=$(stat -f%z "html/${filename}.html" 2>/dev/null || echo "0")
    
    if [ "$html_size" -gt 0 ]; then
      echo "  ✓ HTML saved: ${html_size} bytes"
      ((success_count++))
    else
      echo "  ⚠ HTML is empty (0 bytes)"
      ((empty_html_count++))
    fi
  else
    echo "  ✗ HTML URL not available"
    ((failed_count++))
  fi
  
  echo "  Done: $filename"
done

echo ""
echo "============================================="
echo "Download Complete!"
echo "  ✓ Successful: $success_count screens"
echo "  ⚠ Empty HTML: $empty_html_count screens"
echo "  ✗ Failed: $failed_count screens"
echo ""
