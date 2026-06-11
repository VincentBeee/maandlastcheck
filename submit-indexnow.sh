#!/bin/bash
# IndexNow submission — MaandlastCheck.nl
# Uitvoeren na elke nieuwe tool of inhoudelijke wijziging: bash submit-indexnow.sh

curl -s -o /dev/null -w "HTTP %{http_code}\n" \
  -X POST "https://api.indexnow.org/IndexNow" \
  -H "Content-Type: application/json; charset=utf-8" \
  -d '{
    "host": "maandlastcheck.nl",
    "key": "7c45e4d367394dc2aec9221e685aaf52",
    "keyLocation": "https://maandlastcheck.nl/7c45e4d367394dc2aec9221e685aaf52.txt",
    "urlList": [
      "https://maandlastcheck.nl/",
      "https://maandlastcheck.nl/tools/netto-salaris-calculator.html",
      "https://maandlastcheck.nl/tools/maximale-hypotheek-calculator.html",
      "https://maandlastcheck.nl/tools/studielast-calculator.html",
      "https://maandlastcheck.nl/tools/huur-vs-koop-calculator.html",
      "https://maandlastcheck.nl/tools/lening-check.html",
      "https://maandlastcheck.nl/tools/koopkracht-calculator.html"
    ]
  }'
