#! /bin/bash

files=('Square (outline)'/*)
echo [ > output.txt

echo ${files[0]}

echo $((${#files[@]} - 1))

for i in "${!files[@]}"
do
if [ $i -eq $((${#files[@]} - 1)) ]
then
echo $(basename "${files[$i]}") >> output.txt
else 
echo "$(basename "${files[$i]}"), " >> output.txt
fi
done
  echo ]>> output.txt 

