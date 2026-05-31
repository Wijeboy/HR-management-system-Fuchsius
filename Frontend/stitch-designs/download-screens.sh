#!/bin/bash

# Screen 2: Employee Profile View
echo "Downloading Screen 2: Employee Profile View..."
curl -L -o screenshots/02-employee-profile-view.png "https://lh3.googleusercontent.com/aida/AOfcidVOO3sCdNnhZfZNwV6z7LgBMFRZNOGoX0TQC4NZwfT6_b4OFO3yQahLkV9UwMObejcMH1Taj4hv3yekA4jPD3eEQMdu7bY1Grxp6-YMxoLmQZ0dMT5lIs8gi_4l5zcyxnS5a6la9N4265_sjqGntzuvxI-YEoKGSDfJilyNMCNv8pbvVcrTkPRBWgymAaGi91mvBTekp3flQDXSFLz6MbM0quWifyymz1ZNm_FR9ueBskP7BZoLJdemRco"
curl -L -o html/02-employee-profile-view.html "https://contribution.usercontent.google.com/download?c=CgthaWRhX2NvZGVmeBJ7Eh1hcHBfY29tcGFuaW9uX2dlbmVyYXRlZF9maWxlcxpaCiVodG1sXzU2OTY5ZmYxMmRiOTRhODNiNTVhN2JjZmZkZmI0ZGJhEgsSBxCenNHLogkYAZIBIwoKcHJvamVjdF9pZBIVQhMxNTM4OTQ2NzI2OTg3ODM2MTQz&filename=&opi=89354086"

# Get remaining screens (3-10) from Stitch API
PROJECT_ID="1538946726987836143"
API_KEY="AQ.Ab8RN6JvFTLIDBdPR1U3uqDR3nZJTl0SZIYoPg7A9cp3YZCrzQ"

declare -a screens=(
  "3108015796154c43af3974982a69d30e:03-fuchsius-login-screen"
  "31f7db6ac62d4f56a672e3371a1c4be0:04-department-directory"
  "51d43303c1d345da9386a1c55d28e93d:05-daily-attendance-log"
  "55db497d4c214c6fba40238b8b9a6e6e:06-admin-control-center-dashboard"
  "7831c5e549f94ba7b5bc27f950234e7c:07-role-permission-manager"
  "878450fa40de4d20a69d84b74db6ca56:08-employee-data-form"
  "cbed6ccaec834be3b2a0bfd163ff4ac6:09-document-vault-storage"
  "d8cead86284a4473881fa3d9dffc3b65:10-security-audit-logs"
)

for screen in "${screens[@]}"; do
  IFS=':' read -r screen_id filename <<< "$screen"
  
  echo "Fetching Screen: $filename..."
  
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
    echo "Downloading screenshot: $filename.png"
    curl -L -o "screenshots/${filename}.png" "$screenshot_url"
  fi
  
  if [ "$html_url" != "null" ] && [ "$html_url" != "" ]; then
    echo "Downloading HTML: $filename.html"
    curl -L -o "html/${filename}.html" "$html_url"
  fi
  
  echo "Completed: $filename"
  echo "---"
done

echo "All screens downloaded!"
