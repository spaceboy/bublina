'use strict';

var fontFace    = "sans-serif";
var fontSize    = "middle";
var fontFaceSize = {
    "sans-serif": {
        "small":    "10px",
        "middle":   "12px",
        "large":    "14px"
    },
    "BohemianTypewriter": {
        "small":    "12px",
        "middle":   "14px",
        "large":    "16px"
    }
}



/**
 * Plugin pro zvětšování výšky textarea v závislosti na obsahu textu
 */
$.fn.keepHeight = function () {
    for (var i = 0, l = this.length; i < l; ++i) {
        var el  = this[i];
        var $el = $(el);
        el.setAttribute("data-original-height", el.scrollHeight);
        el.setAttribute("data-original-diff", el.scrollHeight - $el.height());
        $el.on("keyup", function (e) {
            var target  = e.currentTarget;
            if (target.getAttribute("data-original-height") != target.scrollHeight) {
                target.style.height = parseInt(target.scrollHeight) + parseInt(target.getAttribute("data-original-diff")) + "px";
                target.setAttribute("data-original-height", target.scrollHeight);
            }
        });
    }
    return $(this);
}

/**
 * "Camelize" string
 */
function camelize (str) {
    return str.replace(/(?:^\w|[A-Z]|\-|\b\w|\s+)/g, function(match, index) {
        if (/(\s|\-)+/.test(match)) {
            return "";
        }
        return (
            0 === index
            ? match.toLowerCase()
            : match.toUpperCase()
        );
  });
}

/**
 * Get styles of element (attributes matching list values only)
 */
function getElementStyle (el, list) {
    var cs  = window.getComputedStyle(el);
    var out = [];
    for (var i in list) {
        var val = cs[camelize(list[i])];
        if (val) {
            out.push([list[i], val].join(': '));
        }
    }
    return out.join('; ');
}

/**
 * Makes element style "inline" (attributes matching list values only)
 */
function makeStyleInline (el, list) {
    var s   = getElementStyle(el, list);
    if (s) {
        el.setAttribute('style', s);
    }
}

/**
 * Converts DOM element or jQuery element to DOM element
 */
function jQuery2element ($el) {
    if (!$el) {
        return $el;
    }
    if (undefined === $el.length) {
        return $el;
    }
    return (
        $el.length
        ? $el[0]
        : null
    );
}

function showModal ($el, callback) {
    $("#modal-wrapper").fadeIn("fast", function () {
        $("#modal-wrapper .content")
            .html($el.find(".content").html())
            .fadeIn("fast", function () {
                if (callback) {
                    callback();
                }
            });
    });
}

function closeModal (e) {
    // Opět zobrazíme okolí bublin, zobrazíme textarea, skryjeme textový div:
    $('#bubblinus-maximus .bubble [data-hide="true"], #bublina-bottomtext-input, #bubblinus-maximus .ui-resizable-handle').show();
    $("#bublina-bottomtext-show").hide();
    // Skryjeme nejdřív obsah, pak i podklad:
    $("#modal-wrapper .content").fadeOut("fast", function () {
        $("#modal-wrapper").fadeOut("fast", function () {
            $("#modal-wrapper .content")
                .html("")
                .show();
        });
    });
}

/**
 * Odstraníme z obrázku bublinu
 */
function removeBubble (e) {
    $(e.currentTarget).closest(".bubble").remove();
}

/**
 * Vložíme do obrázku bublinu
 * event handler | function
 */
function createBubble (e) {
    // Pokud voláme jako event handler, zastavíme původní akci:
    if (e) {
        e.preventDefault();
    }
    // Vytvoříme bublinu a osadíme obsluhou událostí:
    $("#bubble-source > div")
        .clone()
        .appendTo("#bubblinus-maximus");
    $("#bubblinus-maximus .bubble:last-child")
        .css({
            top: "10px",
            left: "10px"
        })
        .draggable({
            containment: "parent",
            grid: [20, 20],
            handle: ".handle"
        })
        .resizable({
            containment: "parent",
            grid: [10, 10],
            handles: "e, s, se",
            minHeight: 60,
            maxHeight: 200,
            minWidth: 100,
            maxWidth: 260,
        })
        .children(".delete")
        .on("click", removeBubble)
        .parent()
        .children(".handle, .arrow")
        .on("dblclick", function (e) {
            e.stopPropagation();
            var classList   = ["arrow-se", "arrow-sw", "arrow-nw", "arrow-ne"];
            var $arrow      = $(e.currentTarget).parent().children(".arrow");
            var className   = $arrow[0].className.match(/arrow\-[a-z]+/);
            if (!className) {
                $arrow.addClass(classList[0]);
                return;
            }
            var index       = classList.indexOf(className[0]);
            $arrow.removeClass(classList);
            if (classList.length > index++) {
                $arrow.addClass(classList[index]);
                return;
            }
        });
}

/**
 * Vytvoří uniqid
 * (není tak moc uniq, ale to teď není důležité)
 */
function uniqid () {
    var d = new Date;
    return crc64(d.getTime() + "" + d.getUTCMilliseconds()).replace(/^\-*/, "");
}

/**
 * Jakmile je podkladový obrázek načtený, zpropagujeme ho do editovaného obrázku a zavřeme modální okno
 */
function imageLoaded (e) {
    var $img    = $(e.currentTarget);
    $("#bubblinus-maximus")
        .removeClass("loading")
        .attr(
            "style",
            "min-height: "  + $img.height() + "px; " +
            "height: "  + $img.height() + "px; " +
            "width: "       + $img.width() + "px; " +
            "background: url('" + $img.attr("src") + "') no-repeat;"
        );
    closeModal();
}

/**
 * Callback provedený po návratu AJAX requestu na resized image
 */
function loadImageAjax (r) {
    if (r.hasOwnProperty("data")) {
        $("#load-image-internal").attr("src", r.data);
    }
    if (r.hasOwnProperty("error")) {
        if ($("#modal-wrapper .error").length) {
            $("#modal-wrapper .error")
                .text(r.error)
                .show();
        } else {
            $("#bubblinus-maximus").removeClass("loading");
            $("body").prepend('<div class="alert alert-danger alert-dismissible" role="alert"><button type="button" class="close" data-dismiss="alert" aria-label="Close"><span aria-hidden="true">&times;</span></button><strong>Chyba:</strong> ' + r.error + '</div>');
        }
    }
}

/**
 * Načteme podkladový obrázek
 * event handler
 */
function loadImage (e) {
    e.preventDefault();
    showModal($("#load-image"), function () {
        // Ošetříme přetažení obrázku:
        if (window.FileReader) {
            $("#modal-wrapper .drag-text")
                .on("drop", function (e) {
                    e.preventDefault();
                    if (e.originalEvent.dataTransfer.files.length) {
                        var f = e.originalEvent.dataTransfer.files[0];
                        if (-1 != ["image/jpg", "image/jpeg", "image/png", "image/gif"].indexOf(f.type)) {
                            window.reader.readAsDataURL(f);
                        }
                    }
                })
                .on("dragover", function (e) {
                    e.preventDefault();
                });
            $("#modal-wrapper .drag-text").show();
        }
        // Ošetříme vložení URL (načtení AJAX):
        $("#modal-wrapper .load-image-submit").on("click", function (e) {
            $("#bubblinus-maximus").addClass("loading");
            $.getJSON(
                "./imgurl.php",
                {
                    "url":  $("#modal-wrapper input[name=\"url\"]").val(),
                    "full": ($("#modal-wrapper input[name=\"full\"]")[0].checked ? "1" : "")
                },
                loadImageAjax
            );
        });
        // Ošetříme vložení URL (přejít na adresu s parametrem):
        $("#modal-wrapper .load-image-redir").on("click", function () {
            $("#bubblinus-maximus").addClass("loading");
            location.href = "/?url=" + encodeURIComponent($("#modal-wrapper input[name=\"url\"]").val()) + ($("#modal-wrapper input[name=\"full\"]")[0].checked ? "&full=1" : "");
            return;
        });
        // https://scontent-prg1-1.xx.fbcdn.net/v/t1.0-9/106380013_3259628924087356_5586813539749098183_n.jpg?_nc_cat=109&_nc_sid=2d5d41&_nc_ohc=TXN7iqpbVe8AX8DKQ1g&_nc_ht=scontent-prg1-1.xx&oh=2f3489a03ef88e0e8654ddb7e3480cc2&oe=5F20C9B0
        // Ošetříme upload obrázku:
        $("#modal-wrapper .image-upload").on("submit", function (e) {
            e.preventDefault();
            var fd = new FormData(e.target);
            $.ajax({
                "url":          "./imgurl.php",
                "type":         "POST",
                "data":         new FormData(e.target),
                "contentType":  false,
                "cache":        false,
                "processData":  false,
                "success":      function (r) {
                    console.log("success");
                    console.log(r);
                },
                "error":        function (r) {
                    console.log("error");
                    console.log(r);
                }
            });
        });
    });
}

/**
 * Vytvoříme obrázek:
 * event handler
 */
function makeImage (e) {
    e.preventDefault();

    // Skryjeme držátka a ostatní bordel u bublin:
    $('#bubblinus-maximus .bubble [data-hide="true"], #bubblinus-maximus .ui-resizable-handle').hide();

    // Zkopírujeme bottom text a skryjeme textarea; pokud je spodní text, zobrazíme div:
    var bottomText  = $("#bublina-bottomtext-input").hide().val();
    if (bottomText) {
        $("#bublina-bottomtext-show")
            .html(bottomText)
            .css("marginTop", $("#bubblinus-maximus").height() + "px")
            .show();
    }

    // Vytvoříme obrázek:
    domtoimage
        .toPng(document.getElementById("bubblinus-maximus"))
        .then(function (dataUrl) {
            document.getElementById("bubble-output").src    = dataUrl;
            $("#bubble-download").attr({
                "href":     dataUrl,
                "download": "bublina-" + uniqid() + ".png"
            });
            showModal($("#bubble-show"));
        })
        .catch(function (error) {
            alert('oops, something went wrong!', error);
        });
}

/**
 * Inicializace FileReaderu
 */
function initFileReader () {
    if (window.FileReader) {
        window.reader   = new FileReader();
        reader.onload   = function (f) {
            $.ajax({
                "dataType": "json",
                "url":      "imgurl.php",
                "method":   "POST",
                "data":     {
                    "dataUrl":  f.target.result
                },
                "success":  loadImageAjax
            });
        };
    }
}

/**
 * Najdeme GET parametr
 */
function getParameter (paramName) {
    var url = new URL(location.href);
    return url.searchParams.get(paramName);
}

/**
 * Vybereme náhodně jednu hodnotu z pole
 */
function chooseOneFrom (arr) {
    return arr[Math.floor(Math.random() * arr.length)];
}

/**
 * Nastavíme řez písma
 */
function setFontProperties () {
    $("#bublina-bottomtext-input, #bublina-bottomtext-show, #bubblinus-maximus .text").css({
        "fontFamily":   fontFace,
        "fontSize":     fontFaceSize[fontFace][fontSize]
    });
}

/**
 * Načteme prvotní obrázek
 */
function loadImageOnStart (url, full) {
    if (!url) {
        url = chooseOneFrom([
            "./gfx/image_prague.jpg",
            "./gfx/image_brno.jpg",
            "./gfx/image_ostrava.jpg",
            "./gfx/image_plzen.jpg",
            "./gfx/image_ceske-budejovice.jpg",
            "./gfx/image_usti-nad-labem.jpg",
            "./gfx/image_liberec.jpg",
            "./gfx/image_pardubice.jpg",
            "./gfx/image_litomerice.jpg",
            "./gfx/image_kutna-hora.jpg"
        ]);
    }
    $.getJSON(
        "./imgurl.php",
        {
            "url":  url,
            "full": full
        },
        loadImageAjax
    );
}

/**
 * Inicializace
 */
$(function () {
    initFileReader();
    $("#modal-wrapper .closer").on("click", closeModal);
    $("#load-image-internal").on("load", imageLoaded);
    $("textarea[data-keep-height=\"true\"]").keepHeight();
    $("#btn-image").on("click", loadImage);
    $("#btn-bubble").on("click", createBubble);
    $("#btn-camera").on("click", makeImage);
    $("#font-face > li > a").on("click", function (e) {
        e.preventDefault();
        fontFace    = e.currentTarget.getAttribute("data-face");
        setFontProperties();
    });
    $("#font-size > button").on("click", function (e) {
        e.preventDefault();
        fontSize    = e.currentTarget.getAttribute("data-size");
        setFontProperties();
    });
    loadImageOnStart(getParameter("url"), getParameter("full"));
    createBubble();
});
