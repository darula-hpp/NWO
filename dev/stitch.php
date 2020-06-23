<?php

function loadFiles(string $base_dir, string $file_type, array &$all_files = [])
{
    $files = scandir($base_dir);
    echo "Entering " . $base_dir . "\n";
    foreach ($files as $key=> $value)
    {
        $path = realpath($base_dir . DIRECTORY_SEPARATOR . $value);
        if(!is_dir($path))
        {
            $all_files[] = $path;
            $ext = pathinfo($path)['extension'];
            if($ext == "js")
            {
                echo $path . "\n";
            }

            else if($ext == "css")
            {
                echo "css";
            }
        }

        elseif($value != "." && $value != "..")
        {
            loadFiles($path, $file_type, $all_files);
        }
    }
}


$base = "/home/darula/dev/geezuzdarula/dev/src";
$files = [];
loadFiles($base, "js", $files);

$txt = "";
foreach ($files as $file)
{
    $txt .= file_get_contents($file);
}

file_put_contents("../public/twadye/kak.js", $txt);
file_put_contents("merged.js", $txt);
echo "Finished stitching" . "\n";