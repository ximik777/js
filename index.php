<?
    header('Content-type: text/javascript; charset=utf-8');

    $root = $_SERVER['DOCUMENT_ROOT'];
    $dir = '/js/';
    $files = array(
        'core.js',
        'events.js',
        'cookie.js',
        'ajax.js',
        'dom.js',
        'dom.buttons.js',
        'dom.messageBox.js',
        'langs.js',
        'trash.js',
        'oop.js'
    );

    ob_start();

    foreach($files as $f)
    {
        echo '//'.$f."\r\n";
        echo file_get_contents($root.$dir.$f);
    }

    $content = ob_get_contents();
    ob_end_clean();

    echo $content;


?>