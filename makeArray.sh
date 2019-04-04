#! /bin/bash

files=('Square (outline)'/*)
echo [ > output.txt

x=$(IFS=,;printf  "%s" "${files[*]}")
echo "$x" >> output.txt

  echo ]>> output.txt 

