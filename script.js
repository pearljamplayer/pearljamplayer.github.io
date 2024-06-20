var currentSongId;

function main() {
    fetch('albums.json')
        .then(response => {
            
        if (!response.ok) {
            throw new Error('Couldn\'t load the JSON File.');
        }
        
        // Returns JSON data
        return response.json();
    })
    .then(data => {
        // manipulate JSON data
        showAlbums(data);
        lazyLoadImages();
    })
    .catch(error => {
        console.error('Error loading the JSON file:', error);
    });

    // reset time
    var timeRange = document.querySelector(".time-range");
    timeRange.value = 0;

    // search handler
    var searchBtn = document.getElementById('search_btn');
    searchBtn.addEventListener('click', search);
}

function showAlbums(data)
{
    const albumsSection = document.getElementById('albums');

    // loop through each album in the JSON data
    for (const album in data) {
        if (data.hasOwnProperty (album)) {
            const albumData = data[album];
            const albumDiv = document.createElement('div');
            albumDiv.classList.add('album');
            albumDiv.id = albumData.name.toLowerCase();

            // create detail and summary
            const details = document.createElement('details');
            albumDiv.appendChild(details);

            const summary = document.createElement('summary');
            details.appendChild(summary);

            // Create and append cover art
            if (albumData.artwork && albumData.artwork.length > 0) {
                const coverImg = document.createElement('img');
                coverImg.classList.add('cover-img', 'lazy');
                coverImg.setAttribute('data-src', albumData.artwork[0]);
                coverImg.src = "./loading.jpg";
                summary.appendChild(coverImg);
            }

            // Create and append title
            const title = document.createElement('h2');
            title.classList.add('album-title');
            title.textContent = albumData.name;
            details.appendChild(title);

            // create album menu section (info, gallery, ...)
            const albumMenu = document.createElement('div');
            albumMenu.classList.add('album-menu');
            details.appendChild(albumMenu);

            // create info section
            const info = document.createElement('details');
            info.classList.add('info');
            albumMenu.appendChild(info);

            const infoIcon = document.createElement('summary');
            infoIcon.classList.add('info-summary');
            info.appendChild(infoIcon);
            const infoCircle = document.createElement('i');
            infoCircle.classList.add('fa');
            infoCircle.classList.add('fa-info-circle');
            infoCircle.classList.add('fa-lg');
            infoCircle.classList.add('info-icon');
            infoIcon.appendChild(infoCircle);

            // Create and append album year element
            const year = document.createElement('p');
            year.classList.add('album-year');
            year.textContent = `Year: ${albumData.year}`;
            info.appendChild(year);

            // Info text
            const infoText = document.createElement('p');
            infoText.textContent = albumData.info;
            info.appendChild(infoText);

            // album artworks
            const gallery = document.createElement('details');
            gallery.classList.add('gallery');
            albumMenu.appendChild(gallery);

            const galleryIconSummary = document.createElement('summary');
            galleryIconSummary.classList.add('gallery-summary');
            gallery.appendChild(galleryIconSummary);

            const galleryIcon = document.createElement('i');
            galleryIcon.classList.add('fa');
            galleryIcon.classList.add('fa-picture-o');
            galleryIcon.classList.add('fa-lg');
            galleryIcon.classList.add('gallery-icon');
            galleryIconSummary.appendChild(galleryIcon);

            // create and append artworks
            const artList = document.createElement('div');
            artList.classList.add('art-list');
            gallery.appendChild(artList);
            //var artworksLength = albumData.artwork.length;
            var index = 0;
            albumData.artwork.forEach(art => {
                const imageItem = document.createElement('img');
                imageItem.classList.add('image-item', 'lazy');
                imageItem.setAttribute('data-src', albumData.artwork[index]);
                imageItem.src = "./loading.jpg";
                imageItem.onclick = () => {
                    expandImg(imageItem.src);
                };
                artList.appendChild(imageItem);
                index++;
            });

            // Video link, if it has
            if (albumData.video != null) {
                const videoFrame = document.createElement('details');
                videoFrame.classList.add('video-frame');
                albumMenu.appendChild(videoFrame);

                const videoFrameSummary = document.createElement('summary');
                videoFrameSummary.classList.add('video-frame-summary');
                videoFrame.appendChild(videoFrameSummary);

                const videoIcon = document.createElement('i');
                videoIcon.classList.add('fa');
                videoIcon.classList.add('fa-video-camera');
                videoIcon.classList.add('fa-lg');
                videoIcon.classList.add('video-icon');
                videoFrameSummary.appendChild(videoIcon);

                const videolink = document.createElement('a');
                videolink.classList.add('video-link');
                videolink.setAttribute('href', albumData.video);
                videolink.setAttribute('target', '_blank');
                videolink.textContent = "Watch: " + albumData.name;
                videoFrame.appendChild(videolink);
            }

            // Create and append song list element
            const songsList = document.createElement('ul');
            songsList.classList.add('song-list');
            var albumSongsLength = albumData.songs.length;
            albumData.songs.forEach(song => {
                const songItem = document.createElement('li');
                let thisTitle = song.title.replace(/\\'/g, "'");
                songItem.innerHTML = `<button id="${song.id}" class="album-track-btn" onclick="playSong('${song.id}','${albumData.name}','${albumSongsLength}','${albumData.artwork[0]}', '${song.url}','${song.title}','${song.track}','${song.duration}','${song.lyrics}')">${song.track}. ${thisTitle}</button>`;
                songsList.appendChild(songItem);
            });
            details.appendChild(songsList);

            // Append the album div to the albums section
            albumsSection.appendChild(albumDiv);
        }
    }
}

function parseLrc(lyrics, currentTime) {
    document.getElementById("layout_lyrics").innerHTML = "";

    var lines = lyrics.split("\n");

    var currentLine = "";
    for (var i = 0; i < lines.length; i++) {
        var line = lines[i];
        var timeStartIndex = line.indexOf("[");
        var timeEndIndex = line.indexOf("]");
        var time = line.substring(timeStartIndex + 1, timeEndIndex);
        var timeParts = time.split(":");
        var minutes = parseInt(timeParts[0]);
        var seconds = parseFloat(timeParts[1]);
        var lineTime = minutes * 60 + seconds;

        if (lineTime <= currentTime) {
            currentLine = line.substring(timeEndIndex + 1);
        }
    }

    var lyricsDiv = document.getElementById("layout_lyrics");
    var linesArray = currentLine.split("<br>");
    linesArray.forEach(function(line) {
        var p = document.createElement("p");
        p.textContent = line;
        lyricsDiv.appendChild(p);
    });
}

function playSong(songId, albumName, albumSongsLength, coverImgSrc, songUrl, songTitle, songTrack, songDuration, songLyrics) {
    var coverImg = document.getElementById("player-cover-img");
    var player = document.getElementById("player");
    var title = document.getElementById("song_title");
    var duration = document.getElementById("time_end");
    var currentTime = document.getElementById("time_current");
    var timeRange = document.querySelector(".time-range");
    var playPauseBtn = document.getElementById("play_pause_btn");
    var songItem = document.getElementById(songId);

    currentSongId = songId;

    coverImg.src = coverImgSrc;
    var url = songUrl;
    title.textContent = albumName + " | " + songTrack + ". " + songTitle;
    duration.textContent = songDuration;
 
    player.querySelector("source").src = url;
    player.load();
    player.play();
    
    var songDurationInSeconds = getSecondsFromDuration(songDuration);
    timeRange.max = songDurationInSeconds;

    function getSecondsFromDuration(duration) {
        var parts = duration.split(':');
        return parseInt(parts[0]) * 60 + parseInt(parts[1]);
    }

    function formatTime(seconds) {
        var minutes = Math.floor(seconds / 60);
        var seconds = seconds % 60;
        return minutes.toString().padStart(2, '0') + ":" + seconds.toString().padStart(2, '0');
    }

    // check if album ended
    var isEnded = false;
    if (songTrack == albumSongsLength) {
        isEnded = true;
    }else {
        isEnded = false;
    }

    timeRange.addEventListener('input', function() {
        player.currentTime = timeRange.value;
    });

    player.ontimeupdate = function() {
        var currentSeconds = Math.floor(player.currentTime);
        currentTime.textContent = formatTime(currentSeconds);
        timeRange.value = currentSeconds;

        if (songLyrics != null) {
            parseLrc(songLyrics, currentSeconds);
        }
    };

    playPauseBtn.textContent = "||";

    player.onended = function() {
        let thisSong = parseInt(currentSongId);
        if (isEnded) { // finish album
            player.pause();
            coverImg.src = "https://posterplus.com.au/files/2021/04/BLC5039-pearl-jam.jpg";
            playPauseBtn.textContent = "▶";
            currentSongId = 0;
            player.currentTime = 0;
            duration.textContent = "00:00";
            title.textContent = "Let the Records Play...";
            songLyrics = "";
        }else { // play the next song
            let nextSongTrack = thisSong + 1;
            
            // Select the button with the ID equal to the new songTrack
            var nextButton = document.getElementById(nextSongTrack);
            
            // Simulate a click on the button
            if (nextButton) {
                nextButton.click();
            }
        }
    };
    
    songItem.style.color = "#797979";
}

function doVolumeInc() {
    var player = document.getElementById("player");
    if (player.volume < 1.0) {
        player.volume = Math.min(1.0, player.volume + 0.1);
    }
}

function doVolumeDec() {
    var player = document.getElementById("player");
    if (player.volume > 0.0) {
        player.volume = Math.max(0.0, player.volume - 0.1);
    }
}

function doPlayPause()
{
    player = document.getElementById("player");
    playPauseBtn = document.getElementById("play_pause_btn");

    if (player.paused) {
        player.play();
        playPauseBtn.textContent = "||";
    }else {
        player.pause();
        playPauseBtn.textContent = "▶";
    }
}

function search() {
    var searchInput = document.getElementById('search_input');
    var searchBtn = document.getElementById('search_btn');

    var searchStr = searchInput.value.trim().toLowerCase(); 

    var searchElement = document.querySelector('[id*="' + searchStr + '"]');

    if (searchElement) {
        searchBtn.href = "#" + searchElement.id;
        searchBtn.click();
    } else {
        console.log('Elemento não encontrado com o ID parcial:', searchStr);
    }
}

function expandImg(src)
{
    const modal = document.getElementById('myModal');
    const modalImg = document.getElementById('modalImg');
    const captionText = document.getElementById('caption');

    modal.style.display = "block";
    modalImg.src = src;

    const span = document.getElementsByClassName('close')[0];
    span.onclick = function() {
        modal.style.display = "none";
    };

    modal.onclick = function(event) {
        if (event.target == modal) {
            modal.style.display = "none";
        }
    };
        
}

function lazyLoadImages() {
    const lazyImages = document.querySelectorAll('img.lazy');
    const observer = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const img = entry.target;
                img.src = img.getAttribute('data-src'); 
                img.classList.remove('lazy');
                observer.unobserve(img);
            }
        });
    });

    lazyImages.forEach(image => {
        observer.observe(image);
    });
}

main();
