#!/usr/bin/env bash
set -euo pipefail

usage() {
	cat <<'USAGE'
Usage:
  scripts/encode-site-video.sh <input-video> <output-base-name> [width] [fps]

Examples:
  scripts/encode-site-video.sh ~/Desktop/hero-master.mov hero-site
  scripts/encode-site-video.sh ~/Desktop/workshop.mp4 workshop-site 1920 25
  npm run encode-video -- ~/Desktop/hero-master.mov hero-site

Outputs:
  src/assets/oldtimer/<output-base-name>.mp4
  src/assets/oldtimer/<output-base-name>.webm
  src/assets/oldtimer/<output-base-name>-motion.avif
  src/assets/oldtimer/<output-base-name>-motion.webp

Defaults:
  width: 1920
  fps: 25
USAGE
}

if [[ "${1:-}" == "-h" || "${1:-}" == "--help" ]]; then
	usage
	exit 0
fi

if [[ $# -lt 2 || $# -gt 4 ]]; then
	usage
	exit 1
fi

if ! command -v ffmpeg >/dev/null 2>&1; then
	echo "Error: ffmpeg is not installed or not on PATH." >&2
	exit 1
fi

if ! command -v ffprobe >/dev/null 2>&1; then
	echo "Error: ffprobe is not installed or not on PATH." >&2
	exit 1
fi

input=$1
base_name=$2
width=${3:-1920}
fps=${4:-25}
asset_dir="src/assets/oldtimer"

if [[ ! -f "$input" ]]; then
	echo "Error: input video does not exist: $input" >&2
	exit 1
fi

if [[ ! "$base_name" =~ ^[a-z0-9][a-z0-9-]*$ ]]; then
	echo "Error: output base name must be lowercase kebab-case, for example hero-site." >&2
	exit 1
fi

mkdir -p "$asset_dir"

mp4="$asset_dir/$base_name.mp4"
webm="$asset_dir/$base_name.webm"
avif="$asset_dir/$base_name-motion.avif"
webp="$asset_dir/$base_name-motion.webp"
video_filter="fps=$fps,scale=$width:-2:flags=lanczos,format=yuv420p"

echo "Encoding Safari-safe MP4: $mp4"
ffmpeg -y -i "$input" \
	-map 0:v:0 -an -dn -sn \
	-vf "$video_filter" \
	-c:v libx264 -preset slow -crf 20 -profile:v high -level 4.0 \
	-movflags +faststart \
	"$mp4"

echo "Encoding optional AV1 WebM: $webm"
ffmpeg -y -i "$input" \
	-map 0:v:0 -an -dn -sn \
	-vf "$video_filter" \
	-c:v libsvtav1 -preset 8 -crf 32 -pix_fmt yuv420p \
	"$webm"

echo "Encoding animated AVIF fallback: $avif"
ffmpeg -y -i "$mp4" \
	-an -dn -sn \
	-vf "$video_filter" \
	-c:v libsvtav1 -preset 7 -crf 21 -pix_fmt yuv420p -f avif \
	"$avif"

echo "Encoding last-resort animated WebP fallback: $webp"
ffmpeg -y -i "$mp4" \
	-an -dn -sn \
	-vf "$video_filter" \
	-loop 0 -c:v libwebp -quality 82 -compression_level 6 -preset photo \
	"$webp"

echo "Validating MP4 streams..."
video_codec=$(ffprobe -hide_banner -v error -select_streams v:0 -show_entries stream=codec_name -of csv=p=0 "$mp4")
pixel_format=$(ffprobe -hide_banner -v error -select_streams v:0 -show_entries stream=pix_fmt -of csv=p=0 "$mp4")
video_stream_count=$(ffprobe -hide_banner -v error -select_streams v -show_entries stream=index -of csv=p=0 "$mp4" | wc -l | tr -d ' ')
audio_streams=$(ffprobe -hide_banner -v error -select_streams a -show_entries stream=index -of csv=p=0 "$mp4")
data_streams=$(ffprobe -hide_banner -v error -select_streams d -show_entries stream=index -of csv=p=0 "$mp4")

if [[ "$video_codec" != "h264" ]]; then
	echo "Error: MP4 video codec is $video_codec, expected h264." >&2
	exit 1
fi

if [[ "$pixel_format" != "yuv420p" ]]; then
	echo "Error: MP4 pixel format is $pixel_format, expected yuv420p." >&2
	exit 1
fi

if [[ "$video_stream_count" != "1" ]]; then
	echo "Error: MP4 has $video_stream_count video streams, expected exactly 1." >&2
	exit 1
fi

if [[ -n "$audio_streams" ]]; then
	echo "Error: MP4 still has audio streams: $audio_streams" >&2
	exit 1
fi

if [[ -n "$data_streams" ]]; then
	echo "Error: MP4 still has data/timecode streams: $data_streams" >&2
	exit 1
fi

echo "Done."
echo "Generated:"
echo "  $mp4"
echo "  $webm"
echo "  $avif"
echo "  $webp"
