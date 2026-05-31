#!/bin/bash

# Fix missing HTML files (04 and 05)
PROJECT_ID="1538946726987836143"
API_KEY="AQ.Ab8RN6JvFTLIDBdPR1U3uqDR3nZJTl0SZIYoPg7A9cp3YZCrzQ"

# Screen 04: Department Directory
echo "Downloading HTML for Department Directory..."
response=$(curl -s -X POST https://stitch.googleapis.com/mcp \
  -H "Content-Type: application/json" \
  -H "X-Goog-Api-Key: $API_KEY" \
  -d '{
    "jsonrpc": "2.0",
    "id": 1,
    "method": "tools/call",
    "params": {
      "name": "get_screen",
      "arguments": {
        "project_id": "1538946726987836143",
        "screen_id": "31f7db6ac62d4f56a672e3371a1c4be0"
      }
    }
  }')

html_url=$(echo "$response" | jq -r '.result.structuredContent.htmlCode.downloadUrl')
curl -L -o html/04-department-directory.html "$html_url"
echo "Downloaded 04-department-directory.html ($(stat -f%z html/04-department-directory.html) bytes)"

# Screen 05: Daily Attendance Log
echo "Downloading HTML for Daily Attendance Log..."
response=$(curl -s -X POST https://stitch.googleapis.com/mcp \
  -H "Content-Type: application/json" \
  -H "X-Goog-Api-Key: $API_KEY" \
  -d '{
    "jsonrpc": "2.0",
    "id": 1,
    "method": "tools/call",
    "params": {
      "name": "get_screen",
      "arguments": {
        "project_id": "1538946726987836143",
        "screen_id": "51d43303c1d345da9386a1c55d28e93d"
      }
    }
  }')

html_url=$(echo "$response" | jq -r '.result.structuredContent.htmlCode.downloadUrl')
curl -L -o html/05-daily-attendance-log.html "$html_url"
echo "Downloaded 05-daily-attendance-log.html ($(stat -f%z html/05-daily-attendance-log.html) bytes)"

echo "All missing HTML files downloaded!"
