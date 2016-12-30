$(function () {
    function getCookie(googleId) {
        var nameEQ = googleId + "=";
        var ca = document.cookie.split(';');
        for(var i=0;i < ca.length;i++) {
            var c = ca[i];
            while (c.charAt(0)==' ') c = c.substring(1,c.length);
            if (c.indexOf(nameEQ) == 0) return c.substring(nameEQ.length,c.length);
        }
        return null;
    }
    var map;
    var infowindow = new google.maps.InfoWindow();
    var getLocation = function () {
        var deferred = $.Deferred();
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(deferred.resolve, deferred.reject, {timeout: 5000});
        }
        else {
            deferred.reject(new Error("geolocation is not supported!"));
        }
        return deferred.promise();
    };
    var createButton = function () {
        var buttonSearch = document.createElement('div');
        buttonSearch.id = "btn_search";
        buttonSearch.title = 'Click To Search';
        var controlText = document.createElement('div');
        controlText.innerHTML = 'Search';
        controlText.id = "btn_txt_search";
        buttonSearch.appendChild(controlText);
        return buttonSearch;
    };

    var createLogout = function () {
        var buttonLogout = document.createElement('div');
        buttonLogout.id = "btn_logout";
        buttonLogout.title = 'Click To Logout';
        var controlText = document.createElement('div');
        controlText.innerHTML = 'logout';
        controlText.id = "btn_txt_logout";
        buttonLogout.appendChild(controlText);
        return buttonLogout;
    };
    var lon, lat;

    function initMap() {
        var result = getLocation();
        result.then(function (data) {
            lon = data.coords.longitude;
            lat = data.coords.latitude;
            var mylocation = {lat: lat, lng: lon};
            var button = createButton();
            var logout = createLogout();
            var searchbox = document.getElementById("txt_search");
            searchbox.addEventListener("keypress", function(e){
                var key = e.which || e.keyCode;
                if (key === 13){
                    searchLocation();
                }
            });
            button.addEventListener("click", function () {
                searchLocation();
            }, false);
            logout.addEventListener("click", function () {
                signOut();
            }, false);
            map = new google.maps.Map(document.getElementById('map'), {
                center: mylocation,
                zoom: 17
            });
            var input = document.getElementById('txt_search');
            map.controls[google.maps.ControlPosition.TOP_LEFT].push(input);
            map.controls[google.maps.ControlPosition.TOP_LEFT].push(button);
            map.controls[google.maps.ControlPosition.TOP_RIGHT].push(logout);
        });
    }

    function searchLocation() {
        var text = document.getElementById("txt_search").value;
        if (!text || text == "") {
            return false;
        }
        var service = new google.maps.places.PlacesService(map);
        service.textSearch({
            location: {lat: lat, lng: lon},
            radius: 500,
            type: ["establishment"],
            query: text
        }, processResults);
    }

    function processResults(results, status, pagination) {
        if (status !== google.maps.places.PlacesServiceStatus.OK) {
            return false;
        } else {
            createMarkers(results);

            if (pagination.hasNextPage) {
                var moreButton = document.getElementById('more');

                moreButton.disabled = false;

                moreButton.addEventListener('click', function () {
                    moreButton.disabled = true;
                    pagination.nextPage();
                });
            }
        }
    }

    function openResult(place, map) {
        var infowindowContent = document.getElementById('infowindow-content');
        infowindow.close();
        var marker = new google.maps.Marker({
            map: map
        });
        marker.addListener('click', function () {
            infowindow.open(map, marker);
        });
        marker.setPlace({
            placeId: place.place_id,
            location: place.geometry.location
        });
        marker.setVisible(true);
        infowindowContent.children['place-name'].textContent = place.name;
        infowindowContent.children['place-address'].textContent = place.formatted_address;
        infowindowContent.children['place-image'].src = place.photos? place.photos[0].getUrl({
            'maxWidth': 100,
            'maxHeight': 160
        }) : "";
        infowindow.maxWidth = 350;
        infowindow.open(map, marker);
        infowindow.setContent(infowindowContent);
    }

    function createMarkers(places) {
        var bounds = new google.maps.LatLngBounds();
        var placesList = document.getElementById('places');
        placesList.innerHTML = "";
        for (var i = 0; i < places.length; i++) {
            var place = places[i];
            var image = {
                url: place.icon,
                size: new google.maps.Size(71, 71),
                origin: new google.maps.Point(0, 0),
                anchor: new google.maps.Point(17, 34),
                scaledSize: new google.maps.Size(25, 25)
            };
            var marker;
            marker = new google.maps.Marker({
                map: map,
                icon: image,
                title: place.name,
                position: place.geometry.location
            });
            var hours = place.opening_hours.open_now ? "Open Now" : "Closed Now";
            var color = place.opening_hours.open_now ? "#B6F2B7" : "#FEA6A7";
            var list = document.createElement("li");
            (function (p, m) {
                list.addEventListener("click", function () {
                    openResult(p, m);
                });
            })(place, map);
            list.style.cursor = "pointer";
            list.innerHTML += '<span>' + place.name + '<br/>' + place.formatted_address + '<br/>' +
                '<mark style="background-color: ' + color + '">' + hours + '</mark></span>';
            placesList.appendChild(list);
            bounds.extend(place.geometry.location);
        }
        map.fitBounds(bounds);
    }
    function initAuth() {
        gapi.load('auth2', function() {
            gapi.auth2.init();
        });
    }
    function signOut() {
        var auth2 = gapi.auth2.getAuthInstance();
        auth2.signOut().then(function () {
            document.cookie = 'googleId=;expires=Thu, 01 Jan 1970 00:00:01 GMT;';
            window.location.href="login.html";
        });
    }
    if(getCookie("googleId")){
        initAuth();
        initMap();
    }
    else{
        window.location.href="login.html";
    }
});