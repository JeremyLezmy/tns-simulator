#!/usr/bin/env bash
set -e
rm -rf _site
mkdir _site
cp -r public/* _site/
cp -r src        _site/
