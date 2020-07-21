<?php
/**
 * Třída pro přegenerování obrázku
 */

if (!function_exists('getimagesizefromstring')) {
    function getimagesizefromstring($data)
    {
        $uri = 'data://application/octet-stream;base64,' . base64_encode($data);
        return getimagesize($uri);
    }
}

class ImageURL {

    const   MAX_WIDTH   = 640;
    const   MAX_HEIGHT  = 480;

    private $imgContents;

    /** @var boolean Chceme plnou (maximální) šířku obrázku i v případě, že je po zmenšení užší */
    private $fullWidth  = FALSE;


    /**
     * Class constructor
     */
    public function __construct()
    {
    }

    /**
     * Nastaví parametr, zda chceme obrázek na plnou (maximální) šířku
     * @param bool fullWidth
     * @return $this
     */
    public function setFull($fullWidth = FALSE)
    {
        $this->fullWidth    = $fullWidth;
        return $this;
    }

    /**
     * Načte obrázek z URL (např. http://server.ext/image.png)
     * @param string image URL
     * @return $this
     */
    public function setImageUrl($imageUrl)
    {
        $this->imgContents  = file_get_contents($imageUrl);
        return $this;
    }

    /**
     * Načte obrázek z dataURL (např. data:image/jpeg;base64,==image-data==)
     * @param string image dataURL
     * @return $this
     */
    public function setImageDataUrl($dataUrl)
    {
        $this->imgContents  = base64_decode(preg_replace('/data\:image\/(jpe?g|gif|png)\;base64\,/', '', $dataUrl));
        return $this;
    }

    /**
     * Přesampluje obrázek na novou vypočtenou velikost
     * @param image source image
     * @param integer new width
     * @param integer new height
     * @param integer old width
     * @param integer old height
     * @param integer destination X
     * @param integer real new image width
     * @return image resource
     */
    private function imageResample($imgSrc, $newW, $newH, $oldW, $oldH, $destX, $imgW)
    {
        // Vytvoříme obrázek:
        $imgDst = @imagecreatetruecolor($newW, $newH);
        if (FALSE === $imgDst) {
            throw new \Exception('Cannot resample image.');
        }
        imagefill($imgDst, 0, 0, imagecolorallocate($imgDst, 255, 255, 255));

        // Vytvoříme obrazový podklad, je-li žádoucí:
        if ($this->fullWidth && ($imgW !== static::MAX_WIDTH)) {
            $imgLayer   = @imagecreatetruecolor($newW, $newH);
            if (FALSE === $imgLayer) {
                throw new \Exception('Cannot create image layer.');
            }
            imagefill($imgLayer, 0, 0, imagecolorallocate($imgLayer, 255, 255, 255));
            imagecopyresampled(
                $imgLayer,      // destination image
                $imgSrc,        // source image
                0, 0,           // destination X, Y
                0, 0,           // source X, Y
                $newW, $newH,   // destination width, height
                $oldW, $oldH    // source width, height
            );
            imagecopymerge(
                $imgDst,        // destination image
                $imgLayer,      // source image
                0, 0,           // destination X, Y
                0, 0,           // source X, Y
                $newW, $newH,   // source width, height
                20
            );
        }

        // Zkopírujeme zdrojový obrázek:
        imagecopyresampled(
            $imgDst,            // destination image
            $imgSrc,            // source image
            $destX, 0,          // destination X, Y
            0, 0,               // source X, Y
            $imgW, $newH,       // destination width, height
            $oldW, $oldH        // source width, height
        );
        return $imgDst;
    }

    /**
     * Je-li zapotřebí, vypočítá novou velikost a přesampluje obrázek
     * @param integer image width
     * @param integer image height
     * @param string image MIME type
     * @return void
     */
    private function resizeImage($width, $height, $imgMime) {
        $oversizeX  = ($width > static::MAX_WIDTH);
        $oversizeY  = ($height > static::MAX_HEIGHT);
        if (!$oversizeX && !$oversizeY) {
            return;
        }

        $newW   = $width;
        $newH   = $height;

        if ($oversizeX) {
            $newH   = (int)floor($newH / ($newW / static::MAX_WIDTH));
            $newW   = static::MAX_WIDTH;
        }
        if ($newH > static::MAX_HEIGHT) {
            $newW  = (int)floor($newW / ($newH / static::MAX_HEIGHT));
            $newH = static::MAX_HEIGHT;
        }

        // Pokud budeme umisťovat užší obrázek do středu, opravíme velikosti:
        if ($this->fullWidth && static::MAX_WIDTH > $newW) {
            $imgW   = $newW;
            $destX  = (static::MAX_WIDTH - $newW) / 2;
            $newW   = static::MAX_WIDTH;
        } else {
            $imgW   = $newW;
            $destX  = 0;
        }

        // Vytvoříme zmenšeninu:
        ob_start();
        imagepng($this->imageResample(imagecreatefromstring($this->imgContents), $newW, $newH, $width, $height, $destX, $imgW));
        $this->imgContents  = ob_get_contents();
        ob_end_clean();
    }

    /**
     * Vytvoří dataURL obrázku
     * @return string
     */
    private function getDataUrl()
    {
        if (FALSE === $this->imgContents) {
            throw new \Exception('Image not found.');
        }

        $imgSize            = getimagesizefromstring($this->imgContents);
        $imgMime            = $imgSize['mime'];
        if (!in_array($imgMime, array('image/jpeg', 'image/jpg', 'image/png', 'image/gif'))) {
            throw new \Exception('Not image or unsuported image type.');
        }

        $this->resizeImage($imgSize[0], $imgSize[1], $imgMime);

        return 'data:image/png;base64,' . base64_encode($this->imgContents);
    }

    /**
     * @return array
     */
    private function getOutput()
    {
        $output = array();
        try {
            $output['data']     = $this->getDataUrl();
        } catch (\Exception $ex) {
            $output['error']    = $ex->getMessage();
        }
        return json_encode($output);
    }

    /**
     * Writes JSON response
     * @return void
     */
    public function writeJSON()
    {
        $out    = $this->getOutput();
        header('Content-Type: application/json');
        echo($out);
    }

}
