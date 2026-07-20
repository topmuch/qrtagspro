#!/usr/bin/env bash
# Task 3-img: Generate 58 product images across 6 categories (shoes, toiletries,
# health, electronics, accessories, misc) for the qrbags travel checklist web app.
# Uses the z-ai CLI (global v0.0.18 that sends X-Token header) in batches of 3 to avoid 429s.
# Each item: up to 4 attempts with exponential backoff (5/10/20/40s).
# Logs to /home/z/my-project/qrbags/scripts/gen-other-images.log
# Idempotent: skips files already >5KB (resume support).
set -u

OUTPUT_BASE="/home/z/my-project/qrbags/public/items"
LOG="/home/z/my-project/qrbags/scripts/gen-other-images.log"
: > "$LOG"

# Each entry: "slug|category|subject"
# - slug: filename (without .png)
# - category: subdirectory under public/items/
# - subject: short description inserted into the e-commerce product photo prompt
ITEMS=(
  # shoes (6)
  "baskets|shoes|a pair of white sneakers"
  "chaussures-ville|shoes|a pair of brown leather dress shoes"
  "sandales|shoes|a pair of leather sandals"
  "tongs|shoes|a pair of flip-flops"
  "bottes|shoes|a pair of black leather ankle boots"
  "chaussons|shoes|a pair of cozy slipper socks"
  # toiletries (15)
  "brosse-dents|toiletries|a toothbrush"
  "dentifrice|toiletries|a tube of toothpaste"
  "deodorant|toiletries|a deodorant stick"
  "shampoing|toiletries|a shampoo bottle"
  "apres-shampoing|toiletries|a conditioner bottle"
  "gel-douche|toiletries|a shower gel bottle"
  "savon|toiletries|a bar of soap"
  "rasoir|toiletries|a razor"
  "mousse-raser|toiletries|a shaving foam can"
  "parfum|toiletries|a perfume bottle"
  "creme-hydratante|toiletries|a moisturizer jar"
  "maquillage|toiletries|a makeup kit with lipstick and palette"
  "brosse-cheveux|toiletries|a hairbrush"
  "peigne|toiletries|a comb"
  "serviettes|toiletries|a folded white towel"
  # health (5)
  "medicaments|health|a small medicine bottle with pills"
  "lunettes|health|a pair of eyeglasses"
  "lentilles-contact|health|a contact lens case"
  "solution-lentilles|health|a bottle of contact lens solution"
  "trousse-premiers-secours|health|a red first aid kit box"
  # electronics (12)
  "telephone|electronics|a modern smartphone"
  "chargeur|electronics|a phone charger with USB cable"
  "cables-usb|electronics|a bundle of USB cables"
  "batterie-externe|electronics|a portable power bank"
  "tablette|electronics|a tablet computer"
  "ordinateur-portable|electronics|a laptop computer"
  "chargeur-pc|electronics|a laptop charger"
  "appareil-photo|electronics|a digital camera"
  "carte-memoire|electronics|an SD memory card"
  "casque-audio|electronics|over-ear headphones"
  "ecouteurs|electronics|wireless earbuds in a charging case"
  "montre-connectee|electronics|a smartwatch"
  # accessories (12)
  "sac-main|accessories|a leather handbag"
  "sac-dos|accessories|a travel backpack"
  "portefeuille|accessories|a leather wallet"
  "ceinture|accessories|a brown leather belt coiled"
  "bijoux|accessories|a jewelry box with necklace and rings"
  "montre|accessories|a wristwatch"
  "lunettes-soleil|accessories|a pair of sunglasses"
  "casquette|accessories|a baseball cap"
  "chapeau|accessories|a straw sun hat"
  "echarpe|accessories|a folded scarf"
  "gants|accessories|a pair of gloves"
  "parapluie|accessories|a folded umbrella"
  # misc (8)
  "livres|misc|a stack of books"
  "magazines|misc|a stack of magazines"
  "carnet|misc|a notebook"
  "stylos|misc|a set of pens"
  "jeux|misc|a deck of playing cards and travel games"
  "jouets-enfants|misc|a small stuffed toy"
  "snacks|misc|a selection of snack bars"
  "gourde|misc|a reusable water bottle"
)

# Ensure all category directories exist
for cat in shoes toiletries health electronics accessories misc; do
  mkdir -p "$OUTPUT_BASE/$cat"
done

# generate_one(slug, category, subject): retry up to 4 times with exponential backoff
generate_one() {
  local slug="$1"
  local cat="$2"
  local subject="$3"
  local out="$OUTPUT_BASE/$cat/$slug.png"
  local prompt="A clean e-commerce product photo of $subject, pure white background, centered composition, soft drop shadows, professional studio lighting, sharp focus, high detail, no text, no watermark, no logo, square 1024x1024"

  # Skip if already exists with reasonable size
  if [[ -f "$out" ]]; then
    local sz
    sz=$(stat -c%s "$out" 2>/dev/null || echo 0)
    if (( sz > 5000 )); then
      echo "[$cat/$slug] SKIP (already exists, $sz bytes)" | tee -a "$LOG"
      return 0
    fi
  fi

  for attempt in 1 2 3 4; do
    echo "[$cat/$slug] attempt $attempt/4 ..." | tee -a "$LOG"
    local tmp_err
    tmp_err=$(mktemp)
    if z-ai image -p "$prompt" -o "$out" -s 1024x1024 >>"$LOG" 2>"$tmp_err"; then
      local sz
      sz=$(stat -c%s "$out" 2>/dev/null || echo 0)
      if (( sz > 5000 )); then
        echo "[$cat/$slug] OK attempt $attempt -> $out ($sz bytes)" | tee -a "$LOG"
        rm -f "$tmp_err"
        return 0
      else
        echo "[$cat/$slug] WARN attempt $attempt: file too small ($sz bytes)" | tee -a "$LOG"
        cat "$tmp_err" >>"$LOG"
      fi
    else
      echo "[$cat/$slug] FAIL attempt $attempt: $(head -c 300 "$tmp_err")" | tee -a "$LOG"
    fi
    rm -f "$tmp_err"
    # Backoff: 5s, 10s, 20s, 40s
    if (( attempt < 4 )); then
      local wait=$(( 5 * (1 << (attempt - 1)) ))
      echo "[$cat/$slug] waiting ${wait}s before retry" | tee -a "$LOG"
      sleep "$wait"
    fi
  done

  echo "[$cat/$slug] GIVEUP after 4 attempts" | tee -a "$LOG"
  return 1
}

# Process items in batches of BATCH_SIZE parallel workers, with a small delay
# between batches to be gentle on the rate limiter.
BATCH_SIZE=3
INTER_BATCH_DELAY=4

# Parse entries into 3 parallel arrays
SLUGS=()
CATS=()
SUBJECTS=()
for entry in "${ITEMS[@]}"; do
  local_slug="${entry%%|*}"; rest="${entry#*|}"
  local_cat="${rest%%|*}"
  local_subj="${rest#*|}"
  SLUGS+=("$local_slug")
  CATS+=("$local_cat")
  SUBJECTS+=("$local_subj")
done

N=${#SLUGS[@]}
echo "Total items: $N, batch size: $BATCH_SIZE" | tee -a "$LOG"

i=0
failures=()
while (( i < N )); do
  j=$(( i + BATCH_SIZE ))
  (( j > N )) && j=$N

  echo "" | tee -a "$LOG"
  echo "=== BATCH items $i..$((j-1)) ===" | tee -a "$LOG"

  pids=()
  for (( k=i; k<j; k++ )); do
    slug="${SLUGS[$k]}"
    cat="${CATS[$k]}"
    subj="${SUBJECTS[$k]}"
    (
      generate_one "$slug" "$cat" "$subj"
    ) &
    pids+=($!)
  done

  fail_in_batch=0
  for (( m=0; m<${#pids[@]}; m++ )); do
    pid="${pids[$m]}"
    if ! wait "$pid"; then
      idx=$(( i + m ))
      failures+=("${CATS[$idx]}/${SLUGS[$idx]}")
      fail_in_batch=$((fail_in_batch+1))
    fi
  done

  echo "Batch done (failures in batch: $fail_in_batch)" | tee -a "$LOG"
  i=$j
  if (( i < N )); then
    echo "Inter-batch sleep ${INTER_BATCH_DELAY}s..." | tee -a "$LOG"
    sleep "$INTER_BATCH_DELAY"
  fi
done

echo "" | tee -a "$LOG"
echo "=== FINAL SUMMARY ===" | tee -a "$LOG"
total_ok=0
total_files_size=0
for entry in "${ITEMS[@]}"; do
  slug="${entry%%|*}"; rest="${entry#*|}"
  cat="${rest%%|*}"
  out="$OUTPUT_BASE/$cat/$slug.png"
  if [[ -f "$out" ]]; then
    sz=$(stat -c%s "$out" 2>/dev/null || echo 0)
    if (( sz > 5000 )); then
      total_ok=$((total_ok+1))
      total_files_size=$((total_files_size+sz))
      echo "  OK   $out ($sz bytes)" | tee -a "$LOG"
    else
      echo "  BAD  $out (too small: $sz bytes)" | tee -a "$LOG"
    fi
  else
    echo "  MISS $out" | tee -a "$LOG"
  fi
done

echo "" | tee -a "$LOG"
echo "Successful items: $total_ok / $N" | tee -a "$LOG"
echo "Total bytes on disk: $total_files_size" | tee -a "$LOG"
if (( ${#failures[@]} > 0 )); then
  echo "Failed items: ${failures[*]}" | tee -a "$LOG"
  exit 1
fi
echo "All items generated successfully." | tee -a "$LOG"
