<?php
/**
 * Třída pro přegenerování obrázku
 */

class ImageURL {

    const   MAX_WIDTH   = 640;
    const   MAX_HEIGHT  = 480;

    private $imgContents;


    /**
     * Class constructor
     */
    public function __construct()
    {
    }

    /**
     * Načte obrázek z URL (např. http://server.ext/image.png)
     * @param string image URL
     * @return void
     */
    public function setImageUrl($imageUrl)
    {
        $this->imgContents  = file_get_contents($imageUrl);
    }

    /**
     * Načte obrázek z dataURL (např. data:image/jpeg;base64,==image-data==)
     * @param string image dataURL
     * @return void
     */
    public function setImageDataUrl($dataUrl)
    {
        $this->imgContents  = base64_decode(preg_replace('/data\:image\/(jpe?g|gif|png)\;base64\,/', '', $dataUrl));
    }

    /**
     * Přesampluje obrázek na novou vypočtenou velikost
     * @param image source image
     * @param integer new width
     * @param integer new height
     * @param integer old width
     * @param integer old height
     * @return image resource
     */
    private function imageResample($imgSrc, $newW, $newH, $oldW, $oldH)
    {
        $imgDst = @imagecreatetruecolor($newW, $newH);
        if (FALSE === $imgDst) {
            throw new \Exception('Cannot resample image.');
        }
        imagecopyresampled(
            $imgDst,            // destination image
            $imgSrc,            // source image
            0, 0,               // destination X, Y
            0, 0,               // source X, Y
            $newW, $newH,       // destination width, height
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

        // Vytvoříme zmenšeninu:
        ob_start();
        imagepng($this->imageResample(imagecreatefromstring($this->imgContents), $newW, $newH, $width, $height));
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
        if (!in_array($imgMime, ['image/jpeg', 'image/jpg', 'image/png', 'image/gif'])) {
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
        $output = [];
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
