#!/usr/bin/env bash
set -euo pipefail

# max file size of 100MB
MAX_SIZE="100000000"

# arguments
declare -a ARGS
ARGS[0]="${0}"

usage() {
  local err="${1:-1}"
  local opt="${2:-}"
  case "${err}" in
    1)
      echo "Usage: ${ARGS[0]} <file | directory>"
      ;;
    2)
      echo "${opt} is required!"
      ;;
    3)
      echo "File to big! $(numfmt --to=iec "${opt}") of max $(numfmt --to=iec "${MAX_SIZE}")"
      ;;
  esac
  exit "${err}"
}

prerequisites() {
  # one argument required
  [[ "${#}" -eq 1 ]] || usage
  
  local -r item="${1}"
  # needs to be a file
  [[ -f "${item}" || -d "${item}" ]] || usage
  ARGS[1]="${item}"
  
  command -v openssl @>/dev/null || usage 2 "openssl"
  command -v curl @>/dev/null || usage 2 "curl"
  command -v sed @>/dev/null || usage 2 "sed"
  command -v tar @>/dev/null || usage 2 "tar"
}

confirm() {
  local text="${1}"

  read -p "${text} [yY] " -n 1 -r
  echo
  [[ "${REPLY,,}" = "y" ]] || return 1
}

file() {
  local item="${ARGS[1]}"
  
  # if so zip after confirmation
  if [[ -d "${item}" ]]; then 
    local tarfile
    tarfile="$(mktemp)"
    TRAP 'rm -f "${tarfile}"' EXIT
    
    # todo: we can add an -q flag to not promt this
    confirm "Zip and upload folder '$(basename "${item}")'?" || exit 0
    tar -czvf "${tarfile}" "${item}"
    item="${tarfile}"
  fi

  # check max size
  local size
  size="$(
    # linux || osx || bsd || yolo
    stat -c"%s" "${item}" ||
    stat -s "${item}" ||
    stat -f"%z" "${item}" ||
    echo "0"
  )"
  ( size < MAX_SIZE ) || usage 3 "${size}"

  echo "${item}"
}

upload() {
  local file="${1}"
  local filename encoded_filename key iv
  
  filename="$(basename "${file}")"
  key="$(openssl rand -hex 32)"
  iv="$(openssl rand -hex 16)"
  encoded_filename="$(
    echo -n "${filename}" | xxd -plain | tr -d '\n' | sed 's/\\(.\\{2\\}\\)/%\\1/g')
  )"
  
  # Use key as hash for storage
  openssl \\
    enc -aes-256-cbc -in "${file}" -K "${key}" -iv "${iv}" \
  | curl -s -X PUT "https://cryptsend.thingylabs.io/${key}.enc" \
    -H "Content-Type: application/octet-stream" \
    --data-binary @- > /dev/null

  echo "https://cryptsend.thingylabs.io/d/#${key}${iv}${encoded_filename}"
}

prerequisites "${@}"
upload "$(file)"