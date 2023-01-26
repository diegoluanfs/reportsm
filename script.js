
//https://reportsm-api.herokuapp.com/map/getall
var url_api = 'https://reportsm-api.herokuapp.com/';

//if (location.href.includes('localhost')) {
//    url_api = url_api + '';
//}
//else if (location.href.includes('herokuapp')) {
//    url_api = 'https://reportsm-api.herokuapp.com/';
//}

//#region Cria o mapa
var map = L.map('map').setView([-29.73867602, -51.13110041], 13);
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
}).addTo(map);

map.locate({ setView: true, maxZoom: 13 });
//#endregion

//#region Coloca o marker para movimentação manual
var myLat;
var myLgt;
var myMarker;
map.on('locationfound', function (e) {
    myLat = e.latitude;
    myLgt = e.longitude;
    myMarker = L.marker([myLat, myLgt], { draggable: true }).addTo(map);
    myMarker.on('dragend', function () {
        //console.log(myMarker.getLatLng());
    });
    myMarker.on('locationfound', function () {
        //console.log(myMarker.getLatLng());
    });
});
//#endregion

GetMarkers();

//#region Pega markers do db
function GetMarkers() {
    $.ajax({
        url: 'https://reportsm-api.herokuapp.com/map/getall',
        type: 'GET',
        headers: { 'APIKey': '', 'APIVersion': '1.0' },
        contentType: 'application/json',
        async: false,
        processData: false,
        crossDomain: true,
        data: {},
        success: function (resp) {
            markers = resp.data;
            if (resp.errorCode != null) {
                console.log('Bateu um erro!');
                GetMarkers();
            }
            //#region Determinação dos ícones
            class Icon {
                constructor(iconUrl) {
                    this.iconUrl = iconUrl;
                    this.iconSize = [25, 25];
                }
            }
            var gun = L.icon(new Icon('Images/gun.svg'));
            var thief = L.icon(new Icon('Images/thief.svg'));
            var car = L.icon(new Icon('Images/car.svg'));
            var harassment = L.icon(new Icon('Images/harassment.svg'));
            //#endregion
            //#region Coloca os marcadores dentro do mapa
            var markers;
            markers.forEach(function (marker) {
                if (marker.idOccurrenceType == 1) {
                    L.marker([marker.latitude, marker.longitude], { icon: gun }).addTo(map);
                }
                else if (marker.idOccurrenceType == 2) {
                    L.marker([marker.latitude, marker.longitude], { icon: thief }).addTo(map);
                }
                else if (marker.idOccurrenceType == 3) {
                    L.marker([marker.latitude, marker.longitude], { icon: car }).addTo(map);
                }
                else if (marker.idOccurrenceType == 4) {
                    L.marker([marker.latitude, marker.longitude], { icon: harassment }).addTo(map);
                }
                else {
                    L.marker([marker.latitude, marker.longitude], { icon: gun }).addTo(map);
                }
            });
            //#endregion
        },
        error: function (ex) {
        }
    });
}
//#endregion

//#region Pega as opções para o botão de ocorrências
$.ajax({
    url: url_api + 'Utility/getoccurrences',
    type: 'GET',
    headers: { 'APIKey': '', 'APIVersion': '1.0' },
    contentType: 'application/json',
    async: false,
    processData: false,
    crossDomain: true,
    data: {},
    success: function (resp) {
        var selectbox = $('#occurrence');
        $(resp.data).each(function (index, element) {
            selectbox.append('<option value="' + element.id + '">' + element.name + '</option>');
        });
    },
    error: function (ex) {
        //console.log(ex);
    }
});
//#endregion


//#region Função de reportar um crime
var opt = $("#occurrence option:selected").val();
var desc = $('#occurrence-description').val();
$('.btnReport').on('click', function () {
    var _latitude = myMarker.getLatLng().lat;
    var _longitude = myMarker.getLatLng().lng;
    let option = opt;
    let description = desc;
    var _inputDate = $('#input-date').val();

    if (_latitude.value == 0 || _longitude.value == 0) {
        Swal.fire({
            icon: 'error',
            title: 'Oops...',
            text: 'Você precisa posicionar o marcador no mapa, caso ele não esteja aparecendo recarregue a página!',
        });
    }
    else if ($('#occurrence').val() == 0) {
        Swal.fire({
            icon: 'error',
            title: 'Oops...',
            text: 'Selecione o tipo de evento!',
        });
    }
    else if ($('#input-date').val() == 0) {
        Swal.fire({
            icon: 'error',
            title: 'Oops...',
            text: 'Selecione a data da ocorrência!',
        });
    }
    else {
        var occurrence = JSON.stringify({
            latitude: _latitude + "",
            longitude: _longitude + "",
            occurrenceType: $('#occurrence').val(),
            occurrenceDescription: $('#occurrence-description').val(),
            inputDate: _inputDate
        });
        $.ajax({
            url: url_api + 'Map/create',
            type: 'POST',
            headers: { 'APIKey': localStorage.getItem('l'), 'APIVersion': '1.0' },
            contentType: 'application/json',
            async: false,
            processData: false,
            crossDomain: true,
            data: occurrence,
            success: function (resp) {
                var response = resp.result;
                if (resp.data.length != 0) {
                    Swal.fire({
                        position: 'top-end',
                        icon: 'success',
                        title: 'A ocorrência foi salva com sucesso!',
                        showConfirmButton: false,
                        timer: 5000
                    })
                }
            },
            error: function (ex) {
                Swal.fire({
                    icon: 'error',
                    title: 'Oops...',
                    text: 'Algo deu errado, tente novamente mais tarde!',
                    footer: '<a href="">' + ex + '</a>'
                })
            }
        });
    }
});
//#endregion

