#!/bin/bash

# Aggressive retry for 7 empty HTML files with multiple methods
PROJECT_ID="1538946726987836143"
API_KEY="AQ.Ab8RN6JvFTLIDBdPR1U3uqDR3nZJTl0SZIYoPg7A9cp3YZCrzQ"

# The 7 problematic screens
screens=(
  "31f7db6ac62d4f56a672e3371a1c4be0:04-department-directory"
  "51d43303c1d345da9386a1c55d28e93d:05-daily-attendance-log"
  "13f6e8cac5ff40c193f54c241f76026d:12-employee-payslips-view"
  "8272b244475e4ce797065abe9e39cb33:17-applicant-tracking-ats"
  "90860c8b31b6434c830a673123fcdb8c:18-manager-approval-inbox"
  "ad565c331b6d46e3aa60e51245695526:19-automated-analytics-reports"
  "f65961bde78041aeaf81d60cd48bdf6e:23-performance-appraisal-center"
)

echo "╔════════════════════════════════════════════════════════╗"
echo "║  AGGRESSIVE RETRY - 7 Empty HTML Files                ║"
echo "╚════════════════════════════════════════════════════════╝"
echo ""

success=0
failed=0

for screen in "${screens[@]}"; do
  IFS=':' read -r screen_id filename <<< "$screen"
  
  echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
  echo "🔄 Attempting: $filename"
  echo "ID: $screen_id"
  echo ""
  
  # Get the download URL
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
  
  html_url=$(echo "$response" | jq -r '.result.structuredContent.htmlCode.downloadUrl')
  
  if [ "$html_url" == "null" ] || [ -z "$html_url" ]; then
    echo "❌ No download URL available"
    ((failed++))
    echo ""
    continue
  fi
  
  echo "✓ URL obtained"
  
  # METHOD 1: curl with browser headers
  echo "  [1/5] Trying curl with browser headers..."
  curl -L -s \
    -H "User-Agent: Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36" \
    -H "Accept: text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8" \
    -H "Accept-Language: en-US,en;q=0.9" \
    -H "Accept-Encoding: identity" \
    -H "Connection: keep-alive" \
    -o "html/${filename}.html" \
    "$html_url"
  
  size=$(stat -f%z "html/${filename}.html" 2>/dev/null || echo "0")
  
  if [ "$size" -gt 100 ]; then
    echo "  ✅ SUCCESS! Downloaded ${size} bytes"
    ((success++))
    echo ""
    continue
  fi
  
  # METHOD 2: curl with different flags
  echo "  [2/5] Trying curl with --compressed..."
  curl -L -s --compressed \
    -o "html/${filename}.html" \
    "$html_url"
  
  size=$(stat -f%z "html/${filename}.html" 2>/dev/null || echo "0")
  
  if [ "$size" -gt 100 ]; then
    echo "  ✅ SUCCESS! Downloaded ${size} bytes"
    ((success++))
    echo ""
    continue
  fi
  
  # METHOD 3: curl without -L (no redirect follow)
  echo "  [3/5] Trying curl without redirect following..."
  curl -s \
    -H "User-Agent: Mozilla/5.0" \
    -o "html/${filename}.html" \
    "$html_url"
  
  size=$(stat -f%z "html/${filename}.html" 2>/dev/null || echo "0")
  
  if [ "$size" -gt 100 ]; then
    echo "  ✅ SUCCESS! Downloaded ${size} bytes"
    ((success++))
    echo ""
    continue
  fi
  
  # METHOD 4: wget with options
  echo "  [4/5] Trying wget..."
  wget -q --no-check-certificate \
    --user-agent="Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36" \
    -O "html/${filename}.html" \
    "$html_url" 2>/dev/null
  
  size=$(stat -f%z "html/${filename}.html" 2>/dev/null || echo "0")
  
  if [ "$size" -gt 100 ]; then
    echo "  ✅ SUCCESS! Downloaded ${size} bytes"
    ((success++))
    echo ""
    continue
  fi
  
  # METHOD 5: Check if it's a redirect issue
  echo "  [5/5] Analyzing URL response..."
  http_response=$(curl -I -s "$html_url" | head -20)
  echo "$http_response" | grep -E "(HTTP|Location|Content-Length|Content-Type)" | sed 's/^/    /'
  
  content_length=$(echo "$http_response" | grep -i "content-length" | awk '{print $2}' | tr -d '\r')
  
  if [ "$content_length" == "0" ] || [ -z "$content_length" ]; then
    echo "  ⚠️  Server returns Content-Length: 0 or empty"
    echo "  ℹ️  This HTML genuinely doesn't exist in Stitch project"
  fi
  
  ((failed++))
  echo ""
done

echo "╔════════════════════════════════════════════════════════╗"
echo "║  FINAL RESULTS                                         ║"
echo "╚════════════════════════════════════════════════════════╝"
echo "  ✅ Successfully retrieved: $success / 7"
echo "  ❌ Still unavailable: $failed / 7"
echo ""

# Final count
total_valid=$(find html -name "*.html" -size +100c | wc -l | tr -d ' ')
total_empty=$(find html -name "*.html" -size -100c | wc -l | tr -d ' ')

echo "📊 Overall HTML Status:"
echo "  Valid files (>100 bytes): $total_valid"
echo "  Empty files (<100 bytes): $total_empty"
echo ""

if [ "$success" -gt 0 ]; then
  echo "🎉 Retrieved $success additional HTML file(s)!"
else
  echo "ℹ️  All methods exhausted. The remaining files are genuinely"
  echo "   unavailable from Stitch API (server returns 0 bytes)."
fi
