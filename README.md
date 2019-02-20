# Bublina

Slouží jako ukázka kódu HTML, JavaScript a "vanilla" PHP.

Použité JS knihovny:
- [jQuery](http://jquery.com/)
- [jQuery UI](http://jqueryui.com/)
- [Bootstrap](https://getbootstrap.com/docs/3.4/)
- [Crc64](https://gist.github.com/elad-yosifon/f8667d0be3f0554e72779197d72fe5ef)
- [dom-to-image](https://github.com/tsayen/dom-to-image)

## Použití:
Web je vystavený na _prozatímní_ adrese [bublina.wz.cz](http://bublina.wz.cz/). Vzhledem k protokolu (http) není zatím možné použít knihovny pro přihlašování k Facebooku apod.

Po otevření webu je možné do základního obrázku vkládat (kliknutím na tlačítko _Přidat bublinu_) textové "bubliny" a do nich vepisovat text. Tyto bubliny je možné rozšířit (dvojklikem na šedé pole _bublina_) o šipky. Prvním dvouklikem se šipka vytvoří, dalším přesune atd. až k opětovnému odstranění šipky. Bubliny je možné po obrázku přesouvat a je možné měnit jejich velikost.

Základní obrázek je po kliknutí na tlačítko (_Načíst obrázek_) možno měnit -- buď zkopírováním URL požadovaného obrázku, nebo jeho přetažením na zvýrazněnou plochu (a následným uploadem). Obrázek bude resamplován na definovanou maximální velikost (640 pixelů na šířku, 480 pixelů na výšku). Podporované formáty jsou JPG, PNG a GIF. Není-li základní obrázek určen, bude náhodně vybrán z definované skupiny obrázků (zatím jde o fotografie několika měst z ČR).

Obrázek je možné nadefinovat i při otevření stránky, GET parametrem ```url``` obsahujícím požadovanou URL základního obrázku. I v takovém případě bude obrázek resamplován na požadovanou velikost.
**Příklad:** http://bublina.wz.cz/?url=http://1gr.cz/fotky/idnes/19/022/org/MIN797c0e_889cccb358614a0dbfbb20a2c868917c_0.jpg

Po dokončení úprav je možné stisknutím talčítka _Náhled výsledku_ zobrazit preview hotového obrázku. Při stisknutí tlačítka _Stáhnout na disk_ se zobrazí standardní dialog prohlížeče.

Vzhledem k omezenému času bylo zatím testováno pouze na prohlížeči Firefox 65.0 v prostředí Linux Mint.
