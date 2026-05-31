#!/bin/bash

# Retry downloading empty HTML files with detailed debugging
PROJECT_ID="1538946726987836143"
API_KEY="AQ.Ab8RN6JvFTLIDBdPR1U3uqDR3nZJTl0SZIYoPg7A9cp3YZCrzQ"

# Array of screen_id:filename pairs
screens=(
  "31f7db6ac62d4f56a672e3371a1c4be0:04-department-directory"
  "51d43303c1d345da9386a1c55d28e93d:05-daily-attendance-log"
  "05f0b2efa6384ca6b84ecbd2bd5e951c:11-job-vacancy-portal-1"
  "13f6e8cac5ff40c193f54c241f76026d:12-employee-payslips-view"
  "311e250bedfe4736982484631e1759db:13-job-vacancy-portal-2"
  "41a20da2b56240a1865ea9fce12644ac:15-notification-center-feed"
  "8272b244475e4ce797065abe9e39cb33:17-applicant-tracking-ats"
  "90860c8b31b6434c830a673123fcdb8c:18-manager-approval-inbox"
  "ad565c331b6d46e3aa60e51245695526:19-automated-analytics-reports"
  "b25b09d0887441548bad9ba542d7e96b:20-job-vacancy-portal-4"
  "ddae8e7cbfef45fb80b3a361d83993ae:21-leave-management-hub"
  "e007bf8cc14c48f4bc2ac33939b4c0ac:22-leave-request-portal"
  "f65961bde78041aeaf81d60cd48bdf6e:23-performance-appraisal-center"
)

echo "============================================="
echo "Retrying Empty HTML Files (13 screens)"
echo "============================================="
echo ""

success=0
no_html=0
download_error=0

for screen in "${screens[@]}"; do
  IFS=':' read -r screen_id filename <<< "$screen"
  
  echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
  echo "Screen: $filename"
  echo "ID: $screen_id"
  
  # Fetch screen metadata
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
  
  # Check if htmlCode exists in response
  has_html=$(echo "$response" | jq -r '.result.structuredContent.htmlCode != null')
  
  if [ "$has_html" == "true" ]; then
    html_url=$(echo "$response" | jq -r '.result.structuredContent.htmlCode.downloadUrl')
    echo "✓ HTML URL found"
    
    # Download with verbose output
    curl -L -o "html/${filename}.html" "$html_url" 2>&1 | grep -E "(Total|HTTP)"
    file_size=$(stat -f%z "html/${filename}.html" 2>/dev/null || echo "0")
    
    echo "  File Size: $file_size bytes"
    
    if [ "$file_size" -gt 100 ]; then
      echo "  ✅ SUCCESS - HTML downloaded ($file_size bytes)"
      ((success++))
    else
      echo "  ⚠️  FAILED - Empty or tiny file"
      echo "  Response check:"
      echo "$response" | jq -r '.result.structuredContent.htmlCode' | head -3
      ((download_error++))
    fi
  else
    echo "✗ No HTML code available in Stitch project"
    echo "  Response check:"
    echo "$response" | jq -r '.result.structuredContent | keys'
    ((no_html++))
  fi
  
  echo ""
done

echo "============================================="
echo "RETRY SUMMARY"
echo "============================================="
echo "  ✅ Successfully downloaded: $success"
echo "  ✗ No HTML in project: $no_html"
echo "  ⚠️  Download errors: $download_error"
echo ""

# Show final status
total_valid=$(find html -name "*.html" -size +100c | wc -l | tr -d ' ')
total_empty=$(find html -name "*.html" -size -100c | wc -l | tr -d ' ')

echo "Current HTML files status:"
echo "  Files with content (>100 bytes): $total_valid"
echo "  Empty/tiny files (<100 bytes): $total_empty"
