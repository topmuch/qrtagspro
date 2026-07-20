#!/usr/bin/env bash
# Task 2b: Generate 18 clothing product images in batches of 3 to avoid 429s.
# Uses the z-ai CLI (which uses global SDK v0.0.18 that sends X-Token header).
# Each item: up to 4 attempts with exponential backoff.
# Logs to /home/z/my-project/qrbags/scripts/gen-clothing-images.log
set -u

OUTPUT_DIR="/home/z/my-project/qrbags/public/items/clothing"
LOG="/home/z/my-project/qrbags/scripts/gen-clothing-images.log"
: > "$LOG"

# Each entry: "slug|subject"
ITEMS=(
  "t-shirts|a neatly folded stack of 3 white cotton t-shirts"
  "chemises|a neatly folded white button-up dress shirt"
  "polos|a folded light blue short-sleeve collared polo shirt"
  "pulls|a folded beige cream knit sweater"
  "vestes|a casual dark gray jacket"
  "manteaux|a long camel beige winter coat"
  "pantalons|a pair of neatly folded black dress pants"
  "jeans|a pair of neatly folded blue denim jeans"
  "shorts|a pair of folded beige chino shorts"
  "jupes|a navy blue pleated skirt"
  "robes|a floral pattern summer dress"
  "costumes|a dark navy mens suit jacket on a wooden hanger"
  "cravates|three rolled mens ties, one red, one blue, one black"
  "ceintures|a coiled brown leather belt with metal buckle"
  "sous-vetements|a small neatly folded stack of white cotton underwear briefs"
  "chaussettes|a neatly folded pair of white cotton socks"
  "pyjamas|a folded light blue striped pajama set, top and bottom"
  "maillots-de-bain|a navy blue mens swim trunk swimsuit"
)

mkdir -p "$OUTPUT_DIR"

# generate_one(slug, subject): retry up to 4 times with backoff
generate_one() {
  local slug="$1"
  local subject="$2"
  local out="$OUTPUT_DIR/$slug.png"
  local prompt="A clean e-commerce product photo of $subject, pure white background, centered composition, soft drop shadows, professional studio lighting, sharp focus, high detail, no text, no watermark, no logo, square 1024x1024"

  # Skip if already exists with reasonable size
  if [[ -f "$out" ]]; then
    local sz
    sz=$(stat -c%s "$out" 2>/dev/null || echo 0)
    if (( sz > 5000 )); then
      echo "[$slug] SKIP (already exists, $sz bytes)" | tee -a "$LOG"
      return 0
    fi
  fi

  for attempt in 1 2 3 4; do
    echo "[$slug] attempt $attempt/4 ..." | tee -a "$LOG"
    # Run z-ai image. Its stdout/stderr go to a temp log we capture.
    local tmp_err
    tmp_err=$(mktemp)
    if z-ai image -p "$prompt" -o "$out" -s 1024x1024 >>"$LOG" 2>"$tmp_err"; then
      local sz
      sz=$(stat -c%s "$out" 2>/dev/null || echo 0)
      if (( sz > 5000 )); then
        echo "[$slug] OK attempt $attempt -> $out ($sz bytes)" | tee -a "$LOG"
        rm -f "$tmp_err"
        return 0
      else
        echo "[$slug] WARN attempt $attempt: file too small ($sz bytes)" | tee -a "$LOG"
        cat "$tmp_err" >>"$LOG"
      fi
    else
      echo "[$slug] FAIL attempt $attempt: $(head -c 300 "$tmp_err")" | tee -a "$LOG"
    fi
    rm -f "$tmp_err"
    # Backoff: 5s, 10s, 20s, 40s
    if (( attempt < 4 )); then
      local wait=$(( 5 * (1 << (attempt - 1)) ))
      echo "[$slug] waiting ${wait}s before retry" | tee -a "$LOG"
      sleep "$wait"
    fi
  done

  echo "[$slug] GIVEUP after 4 attempts" | tee -a "$LOG"
  return 1
}

# Process items in batches of BATCH_SIZE parallel workers, with a small delay
# between batches to be gentle on the rate limiter.
BATCH_SIZE=3
INTER_BATCH_DELAY=4

# Convert ITEMS into 2 parallel arrays by reading with sed
SLUGS=()
SUBJECTS=()
for entry in "${ITEMS[@]}"; do
  SLUGS+=("${entry%%|*}")
  SUBJECTS+=("${entry#*|}")
done

N=${#SLUGS[@]}
echo "Total items: $N, batch size: $BATCH_SIZE" | tee -a "$LOG"

i=0
failures=()
while (( i < N )); do
  # End index of this batch (exclusive)
  j=$(( i + BATCH_SIZE ))
  (( j > N )) && j=$N

  echo "" | tee -a "$LOG"
  echo "=== BATCH items $i..$((j-1)) ===" | tee -a "$LOG"

  pids=()
  for (( k=i; k<j; k++ )); do
    slug="${SLUGS[$k]}"
    subj="${SUBJECTS[$k]}"
    # Run in background, in a subshell so failures don't exit the main shell
    (
      generate_one "$slug" "$subj"
    ) &
    pids+=($!)
  done

  # Wait for all batch workers
  fail_in_batch=0
  for (( m=0; m<${#pids[@]}; m++ )); do
    pid="${pids[$m]}"
    if ! wait "$pid"; then
      idx=$(( i + m ))
      failures+=("${SLUGS[$idx]}")
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
  slug="${entry%%|*}"
  out="$OUTPUT_DIR/$slug.png"
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
