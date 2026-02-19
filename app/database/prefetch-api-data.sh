#!/bin/bash

# Complete CocktailDB Fetcher - Gets everything dynamically

API_BASE="https://www.thecocktaildb.com/api/json/v1/1"
OUTPUT_DIR="./api_data"
mkdir -p "$OUTPUT_DIR"

echo "========================================"
echo "Complete CocktailDB Data Fetcher"
echo "========================================"

echo "1. Downloading all basic lists..."
echo "   - Categories..."
curl -s "$API_BASE/list.php?c=list" -o "$OUTPUT_DIR/menu_category.json"
echo "   - Ingredients..."
curl -s "$API_BASE/list.php?i=list" -o "$OUTPUT_DIR/ingredient.json"
echo "   - Glass types..."
curl -s "$API_BASE/list.php?g=list" -o "$OUTPUT_DIR/glass.json"

echo "2. Extracting categories..."

CATEGORIES_FILE="$OUTPUT_DIR/menu_category.json"

# Check if we got a valid response
if ! grep -q '"drinks"' "$CATEGORIES_FILE"; then
    echo "ERROR: Invalid API response for categories"
    cat "$CATEGORIES_FILE"
    exit 1
fi

# Method 1: Use jq if available
if command -v jq >/dev/null 2>&1; then
    echo "   Using jq for JSON parsing..."
    # Read jq output line by line into array (works in older bash)
    categories=()
    while IFS= read -r line; do
        categories+=("$line")
    done < <(jq -r '.drinks[].strCategory' "$CATEGORIES_FILE")

# Method 2: Use awk (available on most systems)
elif command -v awk >/dev/null 2>&1; then
    echo "   Using awk for JSON parsing..."
    categories=()
    while IFS= read -r line; do
        categories+=("$line")
    done < <(awk -F'"' '/"strCategory":/ {print $4}' "$CATEGORIES_FILE")

# Method 3: Use grep/sed (universal fallback)
else
    echo "   Using grep/sed (basic parsing)"
    # Extract categories with grep/sed
    categories_str=$(grep -o '"strCategory":"[^"]*"' "$CATEGORIES_FILE" | 
                     sed 's/"strCategory":"//g; s/"//g')
    
    # Convert string to array - compatible with all bash versions
    categories=()
    OLD_IFS="$IFS"
    IFS=$'\n'
    for line in $categories_str; do
        categories+=("$line")
    done
    IFS="$OLD_IFS"
fi

# Check if we got categories
if [ ${#categories[@]} -eq 0 ]; then
    echo "ERROR: No categories extracted. Raw response:"
    cat "$CATEGORIES_FILE"
    exit 1
fi

echo "   Found ${#categories[@]} categories:"
for category in "${categories[@]}"; do
    echo "   - $category"
done

echo "3. Creating drinks by category directory..."
DRINKS_BY_CATEGORY_DIR="$OUTPUT_DIR/drinks_by_category"
mkdir -p "$DRINKS_BY_CATEGORY_DIR"

echo "4. Downloading all drinks with their categories..."
ALL_DRINKS_FILE="$OUTPUT_DIR/all_drinks.json"

# Start the JSON file
echo '{"drinks":[' > "$ALL_DRINKS_FILE"

first=true
total_drinks=0
processed_categories=0

for category in "${categories[@]}"; do
    # URL encode the category (compatible method)
    encoded=$(echo "$category" | sed '
        s/ /%20/g
        s/\//%2F/g
        s/&/%26/g
        s/\\//g
    ')
    
    echo "   - Processing: $category"
    
    # Download drinks for this category
    response=$(curl -s "$API_BASE/filter.php?c=$encoded")
    
    if echo "$response" | grep -q '"drinks"'; then
        # Extract drinks array
        drinks=$(echo "$response" | sed 's/^{"drinks":\[//' | sed 's/\]}$//')
        
        if [ -n "$drinks" ] && echo "$drinks" | grep -q '"strDrink"'; then
            # Create category-specific file
            safe_category_name=$(echo "$category" | sed 's/[\/ ]/_/g')
            CATEGORY_DRINKS_FILE="$DRINKS_BY_CATEGORY_DIR/${safe_category_name}.json"
            echo '{"drinks":[' > "$CATEGORY_DRINKS_FILE"
            
            # Split into individual drink objects
            drinks_normalized=$(echo "$drinks" | sed 's/},{/}\n{/g')
            
            drink_count=0
            first_in_category=true
            
            while IFS= read -r drink; do
                if [ -n "$drink" ]; then
                    # Clean up the drink object
                    drink=$(echo "$drink" | sed 's/,$//')
                    
                    # Add category attribute
                    if echo "$drink" | grep -q '}$'; then
                        drink_with_cat=$(echo "$drink" | sed 's/}$//')
                        drink_with_cat="${drink_with_cat},\"strCategory\":\"$category\"}"
                    else
                        drink_with_cat="${drink},\"strCategory\":\"$category\"}"
                    fi
                    
                    # Add to combined JSON (all drinks)
                    if [ "$first" = true ]; then
                        echo "$drink_with_cat" >> "$ALL_DRINKS_FILE"
                        first=false
                    else
                        echo ",$drink_with_cat" >> "$ALL_DRINKS_FILE"
                    fi
                    
                    # Add to category-specific JSON
                    if [ "$first_in_category" = true ]; then
                        echo "$drink_with_cat" >> "$CATEGORY_DRINKS_FILE"
                        first_in_category=false
                    else
                        echo ",$drink_with_cat" >> "$CATEGORY_DRINKS_FILE"
                    fi
                    
                    drink_count=$((drink_count + 1))
                fi
            done <<< "$drinks_normalized"
            
            # Close category file
            echo "]}" >> "$CATEGORY_DRINKS_FILE"
            
            if [ $drink_count -gt 0 ]; then
                total_drinks=$((total_drinks + drink_count))
                processed_categories=$((processed_categories + 1))
                echo "     ✓ Found $drink_count drinks (saved to ${safe_category_name}.json)"
            else
                echo "     ⚠ No valid drinks found"
                rm -f "$CATEGORY_DRINKS_FILE"
            fi
        else
            echo "     ⚠ No drinks in category"
        fi
    else
        echo "     ⚠ Invalid API response"
    fi
    
    # Small delay to be polite to the API
    sleep 0.1
done

# Complete the JSON
echo "]}" >> "$ALL_DRINKS_FILE"

echo "5. Creating summary files..."
SUMMARY_FILE="$OUTPUT_DIR/summary.txt"

cat > "$SUMMARY_FILE" << EOF
Complete CocktailDB Data Fetch Summary
========================================
Date: $(date)

BASIC LISTS:
- Categories: $(wc -l < "$OUTPUT_DIR/menu_category.json" || echo "0") lines
- Ingredients: $(wc -l < "$OUTPUT_DIR/ingredient.json" || echo "0") lines  
- Glass types: $(wc -l < "$OUTPUT_DIR/glass.json" || echo "0") lines

DRINKS BY CATEGORY:
Total categories: ${#categories[@]}
Categories with drinks: $processed_categories
Total drinks collected: $total_drinks

Categories processed:
EOF

for category in "${categories[@]}"; do
    safe_name=$(echo "$category" | sed 's/[\/ ]/_/g')
    category_file="$DRINKS_BY_CATEGORY_DIR/${safe_name}.json"
    if [ -f "$category_file" ]; then
        count=$(grep -c '"strDrink"' "$category_file" 2>/dev/null || echo "0")
        echo "  - $category: $count drinks" >> "$SUMMARY_FILE"
    else
        echo "  - $category: No drinks found" >> "$SUMMARY_FILE"
    fi
done

echo "" >> "$SUMMARY_FILE"
echo "OUTPUT FILES:" >> "$SUMMARY_FILE"
echo "  • all_drinks.json: $total_drinks drinks ($(wc -c < "$ALL_DRINKS_FILE") bytes)" >> "$SUMMARY_FILE"
echo "  • drinks_by_category/: Individual category files" >> "$SUMMARY_FILE"

# Create a quick verification file
VERIFICATION_FILE="$OUTPUT_DIR/verification.txt"
cat > "$VERIFICATION_FILE" << EOF
Data Verification
=================
Total drinks in all_drinks.json: $total_drinks

Sample drinks (first 3):
EOF

# Show first 3 drinks
if [ -s "$ALL_DRINKS_FILE" ]; then
    head -50 "$ALL_DRINKS_FILE" | grep -o '{"[^}]*}[^,]*' | head -3 | while read -r drink; do
        echo "" >> "$VERIFICATION_FILE"
        echo "$drink" | sed 's/,/,\n  /g' >> "$VERIFICATION_FILE"
    done
fi

echo "========================================"
echo "DOWNLOAD COMPLETE!"
echo "========================================"
echo "All data has been downloaded successfully!"
echo ""
echo "📁 OUTPUT DIRECTORY: $OUTPUT_DIR/"
echo ""
echo "📄 FILES CREATED:"
echo "  Basic lists:"
echo "    • menu_category.json    - All drink categories"
echo "    • ingredient.json       - All ingredients"
echo "    • glass.json           - All glass types"
echo ""
echo "  Drinks data:"
echo "    • all_drinks.json      - All $total_drinks drinks with categories"
echo "    • drinks_by_category/  - Individual category files"
echo ""
echo "  Summary files:"
echo "    • summary.txt          - Complete summary"
echo "    • verification.txt     - Data verification"
echo ""
echo "🔍 SAMPLE OUTPUT:"
if [ -s "$ALL_DRINKS_FILE" ]; then
    # Show first complete drink object
    first_drink=$(head -30 "$ALL_DRINKS_FILE" | grep -o '{"[^}]*}[^,]*' | head -1)
    if [ -n "$first_drink" ]; then
        echo "$first_drink" | sed 's/,/,\n  /g'
    fi
fi