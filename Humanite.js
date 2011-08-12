Chapitre = function(quoi){
  return {
    Quoi : quoi, 
    Evenements : [],
  }
};

Evenement = function(date, jour, quoi) {
  return {
    Quand : date,
    Jour : jour,
    Quoi : quoi
  };
};

GoogleImage = (function(){

  var recherche = function(texte, callback) {
		var url = 'https://ajax.googleapis.com/ajax/services/search/images?v=1.0&rsz=8&q=%texte%&callback=?';
    url = url.replace('%texte%', texte);
    $.getJSON(url, function(data) {
      callback(data);
    });
  };

  return {
    Recherche : recherche
  }
}());

Humanite = (function(){

  var idChapitre = 0,
      idEvenement = 0,
      chapitres = [],
      toCancel = [];

  var analyseData = function(contenuFichier) {
      var lignes = _(contenuFichier.split(/\n/)).chain()
                                   .map(function(t){return t.trim();})
                                   .without("")
                                   .value();

      chapitres = [];
      var monChapitreEnCours;

      lignes.forEach(function(l){
        if (l.match(/^-*[0-9]{1,4}\s.*/)) {
            var quand = l.match(/^(-{0,1}[0-9]\s{0,1}[0-9]{1,4}).*/)[1];
            var quoi = l.replace(quand, '');
            var jour = quoi.match(/^(\s[0-9\-]{1,5}\s(?:janvier|février|mars|avril|mai|juin|juillet|août|septembre|octobre|novembre|décembre)\s).*/);
            if (jour) {
              quoi = quoi.replace(jour[1], '');
              jour = jour[1].trim();
            } else {
              jour = ""; 
            }
            monChapitreEnCours.Evenements.push(Evenement(+quand.replace(/\s/,''), jour, quoi));
        }
        else {
          if(monChapitreEnCours) {
            chapitres.push(monChapitreEnCours);
          }
          monChapitreEnCours = Chapitre(l);
        }
      });
      chapitres.push(monChapitreEnCours);

      return chapitres;
  };

  var lireChapitre = function() {
      var monChapitre = chapitres[idChapitre];
      var quandMin = monChapitre.Evenements[0].Quand;
      var distanceAnnees = monChapitre.Evenements[monChapitre.Evenements.length - 1].Quand - monChapitre.Evenements[0].Quand;
      $('div.Timeline').html('');
      monChapitre.Evenements.forEach(function(e) {
        $('<div class="etiquette"/>').html(e.Quand)
                                     .css({left : (e.Quand - quandMin) / (distanceAnnees * 1.1/ $('div.Timeline').width()) })
                                     .appendTo($('div.Timeline'));
      });
      $('div.Timeline').show();

      afficherTitre(monChapitre);
      transition(2000, afficherSlide);
  };

  var afficherSlide = function() {
      var monChapitre = chapitres[idChapitre];
      var monSlide = monChapitre.Evenements[idEvenement];
      $('div.contenu').html('');
      $('<div/>').addClass('evenement')
                 .html(monSlide.Quoi)
                 .appendTo($('div.contenu'));
      $('div.date .annee').html(monSlide.Quand);
      $('div.date .jour').html(monSlide.Jour);
      $('div.date').show();
      $('.etiquette').removeClass('selected');
      $('div.timeline div.etiquette:contains("' + monSlide.Quand + '")').addClass('selected');
      idEvenement++;
      GoogleImage.Recherche(monSlide.Quoi, function(d) {
        var results = d.responseData.results;
        var top = 70 + -document.height * 0.6 / 2;
        var left = 40;
        var maxTop = 0;
        results.forEach(function(r){
          $('<img/>').addClass('vignette').attr('src', r.url)
                     .bind('load', function(){
                        $(this).css({top: top, left:left}).appendTo('div.contenu');
                        if (left + $(this).width() > document.width * 0.8) {
                          left = 40;
                          top += maxTop + 50;
                          maxTop = 0;
                        } else {
                          left += $(this).width() + 50;
                          if ($(this).height() > maxTop) 
                            maxTop = $(this).height();
                        }
                      });
        });
      });
      transition(7000, afficherSlide);
  };

  var transition = function(temps, callback){
      toCancel.push(setTimeout(function(){
        $('div.contenu').css({top:document.height/3, left:0})
        toCancel.push(setTimeout(function(){
          $('div.contenu').css({left:-2000});
          toCancel.push(setTimeout(callback, temps));
        }, temps));
      }, 10));
  };

  var cancelPlay = function(){
    toCancel.forEach(function(e){
        clearTimeout(e);
    });
  };

  var afficherTitre = function(chapitre) {
      $('div.contenu').html('');
      $('<div/>').addClass('titreChapitre')
                 .html(chapitre.Quoi)
                 .appendTo('div.contenu');
  };

  var sommaire = function(){
    cancelPlay();
    $('div.Timeline').hide();
    $('div.date').hide();
    var maListe = $('<ul class="sommaire"/>');
    var i = 0;
    chapitres.forEach(function(elt) {
        var li = $('<li></li>');
        li.attr('id', i);
        i += 1;
        li.html(elt.Quoi);
        li.bind('click', function(){
          idChapitre = parseInt($(this).attr('id'));
          idEvenement = 0;
          lireChapitre();
        });
        li.appendTo(maListe);
    });
    $('div.contenu').html('');
    $('div.contenu').css({left:0,top:0});
    maListe.appendTo('div.contenu');   
  };

  var init = function(){
    $('.retourSommaire').click(function(){
      sommaire();
    });
    $.get('data.txt', function(d) {
      chapitres = analyseData(d); 
      sommaire();
//      lireChapitre();
    });
  };

  return {
    Init : init
  };
}());

